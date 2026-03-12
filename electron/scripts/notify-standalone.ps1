# Affiche une notification Windows (toast) quand l'app SPARK est fermée.
# Même style que les notifications e-mail / Windows : coin de l'écran, non bloquante.
# Usage: powershell -ExecutionPolicy Bypass -File notify-standalone.ps1 -Title "Rappel" -Body "Contenu"

param(
    [Parameter(Mandatory = $true)]
    [string]$Title,
    [Parameter(Mandatory = $false)]
    [string]$Body = "Rappel de tâche"
)

# Notification toast Windows 10/11 (coin de l'écran, comme les e-mails)
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $rawXml = [xml] $template.GetXml()
    ($rawXml.toast.visual.binding.text | Where-Object { $_.id -eq "1" }).AppendChild($rawXml.CreateTextNode($Title)) | Out-Null
    ($rawXml.toast.visual.binding.text | Where-Object { $_.id -eq "2" }).AppendChild($rawXml.CreateTextNode($Body)) | Out-Null

    $serializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $serializedXml.LoadXml($rawXml.OuterXml)

    $toast = [Windows.UI.Notifications.ToastNotification]::new($serializedXml)
    $toast.Tag = "SPARK"
    $toast.Group = "SPARK"
    $toast.ExpirationTime = [DateTimeOffset]::Now.AddMinutes(1)

    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("SPARK Task Manager")
    $notifier.Show($toast)
    exit 0
} catch {
    # Fallback : boîte de message si toast indisponible (ancien Windows ou erreur)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($Body, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
}

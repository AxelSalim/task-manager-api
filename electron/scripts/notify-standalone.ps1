# Affiche une notification Windows quand l'app SPARK est fermée.
# Utilisé par le Planificateur de tâches pour les rappels.
# Usage: powershell -ExecutionPolicy Bypass -File notify-standalone.ps1 -Title "Rappel" -Body "Contenu"

param(
    [Parameter(Mandatory = $true)]
    [string]$Title,
    [Parameter(Mandatory = $false)]
    [string]$Body = "Rappel de tâche"
)

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($Body, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)

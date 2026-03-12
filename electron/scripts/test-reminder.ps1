# Script de test des rappels SPARK (notification même app fermée)
# Exécuter dans PowerShell : .\test-reminder.ps1
# Ou double-cliquer sur test-reminder.bat

param(
    [switch]$Immediate,   # Affiche une notification tout de suite
    [switch]$In1Minute,   # Planifie une notification dans 1 minute (pour tester "app fermée")
    [switch]$All          # Les deux (défaut si aucun paramètre)
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$notifyScript = Join-Path $scriptDir "notify-standalone.ps1"

if (-not (Test-Path $notifyScript)) {
    Write-Host "Erreur: notify-standalone.ps1 introuvable dans $scriptDir" -ForegroundColor Red
    exit 1
}

$runAll = -not ($Immediate -or $In1Minute)
$doImmediate = $Immediate -or $runAll
$doScheduled = $In1Minute -or $runAll

# --- Test 1 : notification immédiate ---
if ($doImmediate) {
    Write-Host "`n[Test 1] Notification immédiate..." -ForegroundColor Cyan
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $notifyScript `
        -Title "SPARK - Test rappel" `
        -Body "Si vous voyez ce message, la notification fonctionne (test immédiat)."
    Write-Host "  -> Boîte affichée." -ForegroundColor Green
}

# --- Test 2 : tâche planifiée dans 1 minute ---
if ($doScheduled) {
    $taskName = "SPARK_Reminder_TEST"
    $runAt = (Get-Date).AddMinutes(1)
    $st = $runAt.ToString("HH:mm")
    $sd = $runAt.ToString("MM/dd/yyyy")
    $tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$notifyScript`" -Title `"SPARK - Test dans 1 min`" -Body `"Rappel planifié : cette notification s'affiche même si l'app est fermée.`""

    # Supprimer une ancienne tâche de test si elle existe
    schtasks /delete /tn $taskName /f 2>$null

    Write-Host "`n[Test 2] Tâche planifiée dans 1 minute..." -ForegroundColor Cyan
    $result = schtasks /create /tn $taskName /tr $tr /sc once /st $st /sd $sd /f
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  -> Erreur création tâche (droits admin ?)" -ForegroundColor Red
    } else {
        Write-Host "  -> Tâche créée : $taskName à $st le $sd" -ForegroundColor Green
        Write-Host "  -> Vous pouvez fermer cette fenêtre et attendre 1 min. La notification s'affichera." -ForegroundColor Yellow
        Write-Host "  -> Pour supprimer la tâche de test : schtasks /delete /tn $taskName /f" -ForegroundColor Gray
    }
}

Write-Host "`nTests terminés.`n" -ForegroundColor Cyan

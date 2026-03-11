/**
 * Enregistrement des rappels dans le Planificateur de tâches Windows
 * pour afficher des notifications même quand l'application est fermée.
 * Windows uniquement.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const TASK_PREFIX = 'SPARK_Reminder_';

/**
 * Retourne le chemin du script PowerShell dans userData (créé si besoin)
 */
function getNotifyScriptPath() {
  const userData = app.getPath('userData');
  const scriptsDir = path.join(userData, 'scripts');
  const scriptPath = path.join(scriptsDir, 'notify.ps1');

  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  const sourcePath = path.join(__dirname, '..', 'scripts', 'notify-standalone.ps1');
  if (fs.existsSync(sourcePath) && (!fs.existsSync(scriptPath) || fs.statSync(sourcePath).mtimeMs > fs.statSync(scriptPath).mtimeMs)) {
    fs.copyFileSync(sourcePath, scriptPath);
  }

  return scriptPath;
}

/**
 * Formate la date pour schtasks : MM/dd/yyyy (format attendu par schtasks)
 */
function formatDateForSchtasks(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Formate l'heure pour schtasks : HH:mm
 */
function formatTimeForSchtasks(date) {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
}

/**
 * Échappe les guillemets pour la ligne de commande Windows (valeur de /tr)
 */
function escapeForCmd(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

/**
 * Enregistre un rappel dans le Planificateur de tâches Windows.
 * @param {number} taskId - ID de la tâche
 * @param {string} reminderDate - Date/heure du rappel (ISO string ou Date)
 * @param {string} title - Titre de la notification
 * @param {string} [body] - Corps du message
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
function registerReminder(taskId, reminderDate, title, body = '') {
  if (process.platform !== 'win32') {
    return Promise.resolve({ ok: false, error: 'Rappels planifiés (app fermée) supportés uniquement sur Windows.' });
  }

  const taskName = `${TASK_PREFIX}${taskId}`;
  const scriptPath = getNotifyScriptPath();
  const date = new Date(reminderDate);
  const sd = formatDateForSchtasks(date);
  const st = formatTimeForSchtasks(date);

  const escapedTitle = escapeForCmd(title);
  const escapedBody = escapeForCmd(body || 'Rappel de tâche');

  // Pour schtasks /tr : guillemets échappés avec \ pour cmd.exe
  const tr = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File \\"${scriptPath}\\" -Title \\"${escapedTitle}\\" -Body \\"${escapedBody}\\"`;

  return new Promise((resolve) => {
    // Supprimer une tâche existante pour ce taskId (mise à jour du rappel)
    exec(`schtasks /delete /tn "${taskName}" /f`, () => {
      exec(`schtasks /create /tn "${taskName}" /tr "${tr}" /sc once /st ${st} /sd ${sd} /f`, (err, stdout, stderr) => {
        if (err) {
          console.warn('⚠️ Impossible de créer la tâche planifiée:', err.message);
          resolve({ ok: false, error: err.message });
          return;
        }
        console.log('✅ Rappel planifié (app fermée):', taskName, st, sd);
        resolve({ ok: true });
      });
    });
  });
}

/**
 * Supprime le rappel planifié pour une tâche.
 * @param {number} taskId - ID de la tâche
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
function unregisterReminder(taskId) {
  if (process.platform !== 'win32') {
    return Promise.resolve({ ok: true });
  }

  const taskName = `${TASK_PREFIX}${taskId}`;

  return new Promise((resolve) => {
    exec(`schtasks /delete /tn "${taskName}" /f`, (err) => {
      if (err && !err.message.includes('cannot find')) {
        console.warn('⚠️ Impossible de supprimer la tâche planifiée:', err.message);
        resolve({ ok: false, error: err.message });
        return;
      }
      resolve({ ok: true });
    });
  });
}

module.exports = {
  registerReminder,
  unregisterReminder,
  getNotifyScriptPath,
};

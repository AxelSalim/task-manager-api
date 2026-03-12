# Tester les rappels (notification même app fermée)

Ces scripts permettent de vérifier que les rappels Windows fonctionnent, y compris quand l’application SPARK est fermée.

Les notifications affichées sont des **toasts Windows** (coin de l’écran), comme pour les e-mails ou les mises à jour : elles n’ouvrent pas de fenêtre bloquante et disparaissent après quelques secondes.

## Prérequis

- **Windows** (Planificateur de tâches)
- PowerShell (installé par défaut sur Windows)

## Méthode 1 : Double-clic (le plus simple)

1. Ouvrir l’explorateur dans le dossier du projet.
2. Aller dans `electron/scripts/`.
3. **Double-cliquer sur `test-reminder.bat`**.

Il va :
- **Test 1** : afficher tout de suite une **toast** en bas à droite (« SPARK - Test rappel »), comme une notification e-mail.
- **Test 2** : créer une tâche planifiée qui affiche une toast **dans 1 minute**.

Après le test 2, vous pouvez fermer toutes les fenêtres (y compris SPARK) et attendre 1 minute : une deuxième toast doit apparaître (« SPARK - Test dans 1 min »). Si la toast ne s’affiche pas (Windows ancien), une boîte de message s’ouvrira à la place.

## Méthode 2 : PowerShell

Dans un terminal PowerShell, depuis la racine du projet :

```powershell
cd electron\scripts
.\test-reminder.ps1 -All
```

Options :
- `-Immediate` : seulement la notification immédiate.
- `-In1Minute` : seulement la tâche planifiée dans 1 minute.
- `-All` (défaut) : les deux.

## Nettoyer la tâche de test

Pour supprimer la tâche planifiée créée par le test :

```powershell
schtasks /delete /tn SPARK_Reminder_TEST /f
```

Ou via l’interface : **Outils d’administration** → **Planificateur de tâches** → chercher `SPARK_Reminder_TEST` → supprimer.

## En cas d’erreur

- **« notify-standalone.ps1 introuvable »** : exécuter le script depuis `electron/scripts/` (ou vérifier que le fichier est bien à côté de `test-reminder.ps1`).
- **Erreur à la création de la tâche** : lancer PowerShell en **Administrateur** (clic droit → Exécuter en tant qu’administrateur), puis relancer le test.

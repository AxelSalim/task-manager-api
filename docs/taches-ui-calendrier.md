# Tâches UI et Calendrier — Suivi (1 tâche = 1 commit)

Fichier de suivi pour maximiser les commits : chaque case = une modification atomique à committer.

**Convention** : Create/Edit/Delete, titres en français, Dialog Shadcn pour les suppressions, `SheetHeader` avec `py-3`.

---

## Habits (Mes habitudes)

- [x] **H1** — `CreateHabitSheet.tsx` : remplacer le titre "Create habit" par "Ajouter une habitude"
- [x] **H2** — `EditHabitSheet.tsx` : remplacer le titre "Edit habit" par "Modifier l'habitude"

---

## Tags

- [x] **T1** — `CreateTagDialog.tsx` : remplacer le titre "Create tag" par "Ajouter un tag"
- [x] **T2** — `EditTagDialog.tsx` : remplacer le titre "Edit tag" par "Modifier le tag"
- [x] **T3** — `DeleteTagDialog.tsx` : remplacer le titre "Delete tag" par "Supprimer le tag"
- [x] **T4** — `DeleteTagDialog.tsx` : vérifier que c’est un Dialog Shadcn (pas AlertDialog) avec `DialogClose` pour Annuler
- [x] **T5** — `DeleteTagDialog.tsx` : ajouter `className="sm:justify-between"` sur `DialogFooter` pour séparer Annuler / Supprimer

---

## Tâches (Kanban)

- [x] **K1** — `CreateTaskDialog.tsx` : passer le titre "Ajouter une tâche" au lieu de "Create task" (via prop `title` de `TaskForm`)
- [x] **K2** — `EditTaskDialog.tsx` : passer le titre "Modifier la tâche" au lieu de "Edit task"
- [ ] **K3** — Créer `DeleteTaskDialog.tsx` : composant avec Dialog Shadcn, titre "Supprimer la tâche", props `open`, `onOpenChange`, `task`, `onDeleted`
- [ ] **K4** — `DeleteTaskDialog.tsx` : bouton Annuler avec `DialogClose`, bouton Supprimer `variant="destructive"`
- [ ] **K5** — `DeleteTaskDialog.tsx` : `DialogFooter` avec `className="sm:justify-between"`
- [ ] **K6** — Page Kanban : importer `DeleteTaskDialog`
- [ ] **K7** — Page Kanban : état `taskToDelete` et `deleteDialogOpen`
- [ ] **K8** — Page Kanban : ouvrir `DeleteTaskDialog` au clic supprimer (depuis KanbanCard ou menu)
- [ ] **K9** — Page Kanban : appeler `mutate()` dans `onDeleted` et fermer le dialog

---

## Calendrier — Composant DeleteTaskDialog (réutilisable)

- [ ] **C1** — Créer le fichier `frontend/src/components/tasks/DeleteTaskDialog.tsx` (squelette avec Dialog, DialogContent)
- [ ] **C2** — `DeleteTaskDialog.tsx` : ajouter DialogHeader, DialogTitle "Supprimer la tâche", DialogDescription
- [ ] **C3** — `DeleteTaskDialog.tsx` : ajouter DialogFooter avec DialogClose (Annuler) et Button Supprimer
- [ ] **C4** — `DeleteTaskDialog.tsx` : implémenter `handleConfirm` (appel `tasksAPI.delete`, toast, `onDeleted`, fermeture)
- [ ] **C5** — `DeleteTaskDialog.tsx` : état `deleting` et désactiver le bouton Supprimer pendant l’appel
- [ ] **C6** — `DeleteTaskDialog.tsx` : gérer le cas `task === null` (ne pas afficher le bouton Supprimer ou retourner null)

---

## Calendrier — CalendarDaySheet (ajout des actions)

- [ ] **C7** — `CalendarDaySheet.tsx` : ajouter les props optionnelles `onAddTask?: () => void`, `onEditTask?: (task) => void`, `onDeleteTask?: (task) => void`
- [ ] **C8** — `CalendarDaySheet.tsx` : dans l’état vide (aucune tâche), ajouter un bouton "Ajouter une tâche" qui appelle `onAddTask`
- [ ] **C9** — `CalendarDaySheet.tsx` : quand il y a des tâches, ajouter un bouton "Ajouter une tâche" en haut de la liste (ou dans le header)
- [ ] **C10** — `CalendarDaySheet.tsx` : sur chaque `TaskCard`, ajouter un bouton ou menu "Modifier" qui appelle `onEditTask(task)`
- [ ] **C11** — `CalendarDaySheet.tsx` : sur chaque `TaskCard`, ajouter un bouton ou menu "Supprimer" qui appelle `onDeleteTask(task)`
- [ ] **C12** — `CalendarDaySheet.tsx` : importer les icônes (SquarePen, Trash2) et styliser les boutons d’action sur la carte
- [ ] **C13** — `CalendarDaySheet.tsx` : exporter le type `CalendarDayTask` si besoin pour la page (déjà exporté, vérifier usage)

---

## Calendrier — Page calendar

- [ ] **C14** — `calendar/page.tsx` : importer `CreateTaskDialog` et `EditTaskDialog` depuis `@/components/tasks`
- [ ] **C15** — `calendar/page.tsx` : importer `DeleteTaskDialog` depuis `@/components/tasks`
- [ ] **C16** — `calendar/page.tsx` : état `createTaskDialogOpen` (boolean)
- [ ] **C17** — `calendar/page.tsx` : état `editingTask` (CalendarDayTask | null)
- [ ] **C18** — `calendar/page.tsx` : état `taskToDelete` (CalendarDayTask | null) et `deleteTaskDialogOpen` (boolean)
- [ ] **C19** — `calendar/page.tsx` : handler `handleOpenCreateTask` qui set `createTaskDialogOpen` à true (et garde `selectedDate`)
- [ ] **C20** — `calendar/page.tsx` : handler `handleEditTask(task)` qui set `editingTask` et ouvre le dialog d’édition (état dédié ou réutiliser un seul dialog open)
- [ ] **C21** — `calendar/page.tsx` : handler `handleDeleteTask(task)` qui set `taskToDelete` et `deleteTaskDialogOpen` à true
- [ ] **C22** — `calendar/page.tsx` : passer `onAddTask={handleOpenCreateTask}` à `CalendarDaySheet`
- [ ] **C23** — `calendar/page.tsx` : passer `onEditTask={handleEditTask}` à `CalendarDaySheet`
- [ ] **C24** — `calendar/page.tsx` : passer `onDeleteTask={handleDeleteTask}` à `CalendarDaySheet`
- [ ] **C25** — `calendar/page.tsx` : rendre `<CreateTaskDialog>` avec `open={createTaskDialogOpen}`, `onOpenChange`, et pré-remplir la date d’échéance avec `selectedDate`
- [ ] **C26** — `calendar/page.tsx` : implémenter `handleCreateSubmit` pour créer la tâche avec `dueDate` = `selectedDate`, puis `loadTasks()` et fermer le dialog
- [ ] **C27** — `calendar/page.tsx` : rendre `<EditTaskDialog>` avec `task={editingTask}`, `open`, `onOpenChange`
- [ ] **C28** — `calendar/page.tsx` : implémenter `handleEditSubmit` pour mettre à jour la tâche, puis `loadTasks()` et fermer le dialog
- [ ] **C29** — `calendar/page.tsx` : rendre `<DeleteTaskDialog>` avec `task={taskToDelete}`, `open={deleteTaskDialogOpen}`, `onOpenChange`, `onDeleted`
- [ ] **C30** — `calendar/page.tsx` : dans `onDeleted` du DeleteTaskDialog, appeler `loadTasks()` et réinitialiser `taskToDelete`
- [ ] **C31** — `calendar/page.tsx` : après création/édition, fermer le Create/Edit dialog et garder le sheet du jour ouvert (ne pas fermer le sheet)

---

## Calendrier — UX et détails

- [ ] **C32** — Création depuis le calendrier : s’assurer que le formulaire CreateTaskDialog reçoit bien `dueDate` initialisé à `selectedDate` (prop ou contexte)
- [ ] **C33** — Vérifier que `TaskForm` / `CreateTaskDialog` accepte une date initiale (sinon ajouter une prop `initialDueDate` sur CreateTaskDialog)
- [ ] **C34** — Après suppression d’une tâche depuis le sheet, vérifier que la liste du jour se met à jour sans recharger toute la page

---

## Finance (vérifications / cohérence)

- [ ] **F1** — Vérifier que tous les `SheetHeader` des sheets Finance ont bien `py-3` (CreateCategory, CreateTransaction, EditTransaction)
- [ ] **F2** — Si une suppression de transaction est ajoutée plus tard : créer `DeleteFinanceTransactionDialog.tsx` avec Dialog Shadcn et titre "Supprimer la transaction"
- [ ] **F3** — Si une suppression de catégorie est ajoutée : créer `DeleteFinanceCategoryDialog.tsx` avec Dialog Shadcn et titre "Supprimer la catégorie"

---

## Accessibilité et polish

- [ ] **A1** — Habits : vérifier les `aria-label` sur les boutons Modifier / Supprimer de chaque ligne (déjà présents, vérifier)
- [ ] **A2** — CalendarDaySheet : ajouter `aria-label` sur le bouton "Ajouter une tâche"
- [ ] **A3** — CalendarDaySheet : ajouter `aria-label` sur les boutons Modifier / Supprimer de chaque TaskCard
- [ ] **A4** — DeleteHabitDialog : vérifier que le focus revient sur le bouton qui a ouvert le dialog après annulation (comportement par défaut du Dialog Shadcn)

---

## Documentation et suivi

- [ ] **D1** — Mettre à jour la section "Ordre de réalisation" en bas de ce fichier après les premiers commits
- [ ] **D2** — Cocher les tâches au fur et à mesure dans ce fichier (remplacer `- [ ]` par `- [x]`)
- [ ] **D3** — Ajouter en en-tête la date de dernière mise à jour du fichier

---

## Récap par zone (nombre de tâches)

| Zone        | Nombre de tâches |
|------------|-------------------|
| Habits     | 2                 |
| Tags       | 5                 |
| Kanban     | 9                 |
| Calendrier | 28                |
| Finance    | 3                 |
| A11y       | 4                 |
| Doc        | 3                 |
| **Total**  | **54**            |

---

## Ordre de réalisation suggéré

1. **Habits** (H1, H2) — 2 commits  
2. **Tags** (T1–T5) — 5 commits  
3. **Kanban titres** (K1, K2) — 2 commits  
4. **DeleteTaskDialog** (K3–K5 puis C1–C6, ou fusionner) — à découper en 6 commits  
5. **Kanban suppression** (K6–K9) — 4 commits  
6. **CalendarDaySheet** (C7–C13) — 7 commits  
7. **Calendar page** (C14–C31) — 18 commits  
8. **Calendar UX** (C32–C34) — 3 commits  
9. **Finance** (F1–F3) — 1 à 3 commits  
10. **Accessibilité** (A1–A4) — 4 commits  
11. **Documentation** (D1–D3) — 3 commits  

---

*Dernière mise à jour : à mettre à jour au fur et à mesure.*

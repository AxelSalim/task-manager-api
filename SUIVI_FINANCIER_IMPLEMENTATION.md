# Implémentation du module Suivi Financier

Document de référence pour l’ajout du module **Mon Suivi Financier** (transactions, budget, dashboard, avertissements) à l’application Spark (desktop).

---

## 1. Vision et périmètre

### 1.1 Objectif

- Permettre à l’utilisateur de suivre **transactions**, **budget** (revenus / dépenses / factures / crédits / épargnes) et **avertissements**.
- Vue type tableau + graphiques (dashboard), avec comparaison **Réel vs Budget**.
- Devise : **CFA** (configurable plus tard si besoin).
- Données **locales** (SQLite), un profil utilisateur = un suivi financier.

### 1.2 Vues cibles (d’après les maquettes)

| Vue | Description |
|-----|-------------|
| **Transactions** | Liste des transactions (Date, Type, Catégorie, Montant, Commentaires) + formulaire Ajouter / Annuler. Filtre par période (ex. mois). Total. |
| **Budget** | Tableau Revenus / Dépenses par catégories et par mois (Janvier… Juin). Onglets ou sections : Factures, Crédits, Épargnes. |
| **Dashboard** | "Mon Suivi Financier" : sélecteur de mois, cartes (Revenus total, Dépenses variables, Dépenses fixes, Épargne, Solde), graphiques (barres, donuts), tableaux Réel vs Budget (Revenus, Dépenses, Factures). |
| **Avertissements** | Liste des alertes (dépassement budget, échéances, etc.). |

### 1.3 Types de flux

- **Revenus** (ex. Salaire net, Extras, Revenus locatif).
- **Factures** (dépenses fixes récurrentes : électricité, eau, internet, loyer, Netflix, logiciels, téléphone).
- **Dépenses** (variables : courses, carburant, shopping, assurances, santé, enfant, restaurant, imprévus).
- **Épargnes** (ex. Retraite, Projet).
- **Crédits** (ex. Maison, Voiture, Crédit conso).

---

## 2. Modèle de données (backend)

### 2.1 Entités principales

```
User (existant)
  └── userId utilisé pour lier toutes les entités financières

Transaction
  - id, userId, date, type, categoryId, amount, comment, createdAt, updatedAt
  - type: 'revenus' | 'factures' | 'depenses' | 'epargnes' | 'credits'

Category
  - id, userId, name, type, createdAt, updatedAt
  - type: même enum que Transaction (ou 'revenus'|'depenses'|'factures'|'credits'|'epargnes')
  - ex. "Salaire Net" (revenus), "Courses" (depenses), "Electricité" (factures)

BudgetEntry (budget prévu par catégorie et par mois)
  - id, userId, categoryId, year, month, amount, createdAt, updatedAt
  - ou : categoryId + year + month unique

RecurringBill (optionnel, phase 2 – factures récurrentes)
  - id, userId, name, categoryId, amount, dayOfMonth, createdAt, updatedAt

Credit (optionnel, phase 2 – crédits en cours)
  - id, userId, name, categoryId, totalAmount, monthlyPayment, startDate, endDate, createdAt, updatedAt

SavingsGoal (optionnel, phase 2 – objectifs épargne)
  - id, userId, name, targetAmount, currentAmount, createdAt, updatedAt

Alert / Avertissement (phase 2)
  - id, userId, type, message, read, createdAt
  - type: 'budget_exceeded' | 'upcoming_bill' | etc.
```

### 2.2 Migrations à prévoir

1. `create-categories` : table Categories (id, userId, name, type, createdAt, updatedAt).
2. `create-transactions` : table Transactions (id, userId, date, type, categoryId, amount, comment, createdAt, updatedAt).
3. `create-budget-entries` : table BudgetEntries (id, userId, categoryId, year, month, amount, createdAt, updatedAt).
4. (Phase 2) Tables RecurringBills, Credits, SavingsGoals, Alerts.

### 2.3 Contraintes et index

- `Transactions.userId`, `Transactions.date`, `Transactions.type`, `Transactions.categoryId`.
- `BudgetEntries.(userId, categoryId, year, month)` unique.
- Clés étrangères vers User et Category.

---

## 3. API (backend)

### 3.1 Catégories

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/finance/categories` | Liste des catégories de l’utilisateur (filtrer par type optionnel). |
| POST | `/api/finance/categories` | Créer une catégorie (name, type). |
| PUT | `/api/finance/categories/:id` | Modifier une catégorie. |
| DELETE | `/api/finance/categories/:id` | Supprimer une catégorie (attention aux transactions liées). |

### 3.2 Transactions

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/finance/transactions` | Liste (query: year, month, type, categoryId). |
| GET | `/api/finance/transactions/:id` | Détail d’une transaction. |
| POST | `/api/finance/transactions` | Créer (date, type, categoryId, amount, comment). |
| PUT | `/api/finance/transactions/:id` | Modifier. |
| DELETE | `/api/finance/transactions/:id` | Supprimer. |

### 3.3 Budget

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/finance/budget` | Entrées de budget (query: year, month). Retourner par catégorie ou par (year, month). |
| PUT | `/api/finance/budget` | Créer ou mettre à jour des lignes (ex. tableau { categoryId, year, month, amount }). |

### 3.4 Dashboard (agrégats)

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/finance/dashboard` | Agrégats pour un mois (query: year, month) : totaux par type (revenus, dépenses, factures, crédits, épargnes), répartition, comparaison réel vs budget. |

### 3.5 Avertissements (phase 2)

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/finance/alerts` | Liste des avertissements non lus / récents. |
| PATCH | `/api/finance/alerts/:id/read` | Marquer comme lu. |

### 3.6 Authentification

- Toutes les routes sous `/api/finance/*` protégées par le **même auth middleware** que le reste de l’app (JWT / session desktop).
- `userId` = `req.user.id`.

---

## 4. Frontend

### 4.1 Structure des routes (Next.js)

```
(dashboard)/
  finance/                    → layout avec onglets ou sidebar secondaire
    page.tsx                  → redirect vers /finance/dashboard ou /finance/transactions
    dashboard/page.tsx        → Mon Suivi Financier (mois, cartes, graphiques, tableaux Réel vs Budget)
    transactions/page.tsx     → Liste + formulaire d’ajout
    budget/page.tsx           → Tableau budget (revenus / dépenses / factures / crédits / épargnes par mois)
    avertissements/page.tsx   → Liste des alertes (phase 2)
```

### 4.2 Sidebar principale (Spark)

- Ajouter un lien **Finance** ou **Budget** pointant vers `/finance` (ou `/finance/dashboard`).
- Ordre proposé : Kanban, Calendrier, **Finance**.

### 4.3 Composants à prévoir

| Composant | Rôle |
|-----------|------|
| `FinanceLayout` | Layout avec onglets (Dashboard, Transactions, Budget, Avertissements). |
| `TransactionList` | Table avec colonnes Date, Type, Catégorie, Montant, Commentaires + tri/filtre. |
| `TransactionForm` | Formulaire Ajouter / Annuler (date, type, catégorie, montant, commentaire). |
| `BudgetTable` | Tableau catégories × mois (éditable). |
| `DashboardCards` | Cartes Revenus total, Dépenses variables, Dépenses fixes, Épargne, Solde. |
| `DashboardCharts` | Graphiques barres (vue d’ensemble), donuts (% répartition). |
| `ReelVsBudgetTable` | Tableaux Revenus / Dépenses / Factures avec colonnes Réel et Budget. |
| `MonthPicker` | Sélecteur mois/année. |
| `AlertsList` | Liste des avertissements (phase 2). |

### 4.4 State et API client

- Créer un **contexte** ou des **hooks** dédiés (ex. `useTransactions`, `useBudget`, `useDashboard`) qui appellent les routes `/api/finance/*`.
- Fichier `lib/api.ts` : ajouter une section `financeAPI` (getCategories, getTransactions, createTransaction, getBudget, getDashboard, etc.).

### 4.5 Libs pour les graphiques

- **Recharts** ou **Chart.js** pour barres et donuts (déjà souvent utilisés avec React/Next).

---

## 5. Phasage

### Phase 1 – MVP

1. **Backend**
   - Migrations : Categories, Transactions, BudgetEntries.
   - Modèles Sequelize : Category, Transaction, BudgetEntry.
   - Routes : categories CRUD, transactions CRUD, budget GET/PUT, dashboard GET (agrégats pour un mois).

2. **Frontend**
   - Route `/finance` + layout avec onglets.
   - Page **Transactions** : liste + formulaire d’ajout, filtre par mois.
   - Page **Budget** : tableau simple (catégories × mois) pour saisie des montants budget.
   - Page **Dashboard** : sélecteur de mois, cartes (totaux), 1 tableau Réel vs Budget (revenus + dépenses), optionnellement 1 graphique (barres ou donuts).

3. **Données de base**
   - Seed ou script pour créer des catégories par défaut (Salaire net, Extras, Revenus locatif ; Courses, Carburant, etc. ; Factures : Électricité, Eau, Internet, Loyer, etc.).

### Phase 2 – Complet

1. Factures récurrentes (RecurringBills) et éventuellement pré-remplissage du budget.
2. Crédits (Credits) : suivi mensualités et restant dû.
3. Épargnes / objectifs (SavingsGoals).
4. Moteur d’**avertissements** (dépassement budget, rappels) + page Avertissements.
5. Export (CSV/Excel) optionnel.

---

## 6. Points d’attention

- **Devise** : tout stocker en **centimes** ou **entier** (ex. CFA) pour éviter les erreurs de flottants. Affichage avec séparateur de milliers.
- **Période** : mois + année partout (year, month). Pas de timezone complexe pour une app desktop locale.
- **Suppression en cascade** : supprimer une catégorie peut invalider des transactions ou lignes de budget ; décider (interdire, ou réaffecter “Sans catégorie”).
- **Performance** : pour le dashboard, privilégier des agrégats calculés côté backend (SUM, GROUP BY) plutôt que tout charger en front.

---

## 7. Checklist avant de coder

- [ ] Valider les noms des types (revenus, factures, depenses, epargnes, credits) et leur usage dans l’UI.
- [ ] Choisir la lib de graphiques (Recharts recommandé).
- [ ] Décider si Budget = une ligne par (userId, categoryId, year, month) ou structure différente.
- [ ] Prévoir un seed ou une page “Premier lancement” pour créer les catégories par défaut.

---

*Document créé pour le projet Spark – module Suivi Financier. À mettre à jour au fil de l’implémentation.*

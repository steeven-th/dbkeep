# Structure du projet

Organisation des fichiers et dossiers de DBKeep.

## Vue d'ensemble

DBKeep suit la structure Nuxt 4 avec le dossier `app/` pour le code source frontend et une architecture **Open Core** permettant différents modes de déploiement.

```
dbkeep/
├── app/                      # Code source frontend (Nuxt 4)
├── docs/                     # Documentation
├── i18n/                     # Internationalisation
├── public/                   # Assets statiques
├── server/                   # Backend Nitro
├── test/                     # Configuration des tests
├── tests/                    # Tests E2E
├── .env.example              # Exemple de configuration
├── drizzle.config.ts         # Configuration Drizzle Kit
├── nuxt.config.ts            # Configuration Nuxt
├── package.json              # Dépendances
└── vitest.config.ts          # Configuration Vitest
```

## Dossier app/

Code source frontend Vue.js/Nuxt.

```
app/
├── assets/                   # CSS, images, fonts
│   └── css/
│       └── main.css          # Styles globaux + Design System
├── components/               # Composants Vue
│   ├── canvas/               # Composants Vue Flow
│   │   ├── DatabaseCanvas.vue    # Canvas principal
│   │   ├── CanvasToolbar.vue     # Barre d'outils
│   │   ├── TableEditor.vue       # Slideover édition table
│   │   ├── GroupEditor.vue       # Slideover édition groupe
│   │   ├── NoteEditor.vue        # Slideover édition note
│   │   ├── RelationEditor.vue    # Modal édition relation
│   │   ├── SqlChangesOverlay.vue # Overlay modifications SQL
│   │   ├── NewProjectModal.vue   # Modal nouveau projet
│   │   ├── nodes/
│   │   │   ├── DbTable.vue       # Node table
│   │   │   ├── DbGroup.vue       # Node groupe
│   │   │   └── DbNote.vue        # Node note
│   │   └── edges/
│   │       └── RelationEdge.vue  # Edge relation
│   ├── sidebar/
│   │   └── SqlPreview.vue        # Prévisualisation SQL
│   ├── DeleteConfirmModal.vue    # Modal confirmation suppression
│   ├── ProfileEditModal.vue      # Modal édition profil
│   └── ...                   # Autres composants
├── composables/              # Composables Vue (hooks réutilisables)
│   ├── useAppMode.ts         # Gestion mode invité + inscription
│   ├── useAuth.ts            # Authentification
│   ├── useProjectStore.ts    # Store projet (tables, colonnes)
│   ├── useCanvasStore.ts     # Store Vue Flow (nodes, edges)
│   ├── useProjects.ts        # CRUD projets (API)
│   ├── useSqlGenerator.ts    # Génération SQL
│   ├── useSqlParser.ts       # Parsing SQL
│   └── useDeleteConfirm.ts   # Confirmation de suppression
├── layouts/                  # Layouts Nuxt
│   ├── default.vue           # Layout avec navbar (app)
│   └── landing.vue           # Layout sans navbar (public)
├── middleware/               # Middleware de route
│   └── auth.ts               # Protection routes (supporte guest mode)
├── pages/                    # Pages/routes automatiques
│   ├── index.vue             # Landing page (/)
│   ├── login.vue             # Connexion (/login)
│   ├── register.vue          # Inscription (/register)
│   └── app/
│       ├── index.vue         # Dashboard projets (/app)
│       ├── settings.vue      # Paramètres (/app/settings)
│       └── project/
│           └── [id].vue      # Éditeur projet (/app/project/:id)
├── types/                    # Types TypeScript
│   └── database.ts           # Types pour tables, colonnes, relations
├── plugins/
│   └── monaco.client.ts      # Plugin Monaco Editor
└── utils/                    # Utilitaires
    └── auth-client.ts        # Client Better Auth
```

## Dossier server/

Backend Nitro (API, base de données, services).

```
server/
├── api/                      # Routes API
│   ├── auth/
│   │   └── [...all].ts       # Handler Better Auth (catch-all)
│   └── projects/
│       ├── index.get.ts      # GET /api/projects (liste)
│       ├── index.post.ts     # POST /api/projects (création)
│       ├── [id].get.ts       # GET /api/projects/:id
│       ├── [id].put.ts       # PUT /api/projects/:id
│       └── [id].delete.ts    # DELETE /api/projects/:id
├── database/                 # Base de données
│   ├── drizzle.ts            # Connexion PostgreSQL
│   └── schema.ts             # Schéma Drizzle (tables)
├── services/                 # Services métier
│   └── projectService.ts     # Opérations projets (Drizzle)
├── plugins/                  # Plugins Nitro
│   └── guestUser.ts          # Création user guest au démarrage
└── utils/                    # Utilitaires serveur
    ├── auth.ts               # Configuration Better Auth
    ├── appMode.ts            # Helpers mode invité
    └── guestUser.ts          # Gestion utilisateur guest
```

## Dossier i18n/

Fichiers de traduction pour l'internationalisation.

```
i18n/
└── locales/
    ├── fr.json               # Traductions françaises
    └── en.json               # Traductions anglaises
```

### Structure des traductions

```json
{
  "app_name": "DBKeep",
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "auth": {
    "login_title": "Connexion",
    "login_button": "Se connecter"
  },
  "guest": {
    "mode_label": "Mode Invité"
  }
}
```

## Fichiers de configuration

### nuxt.config.ts

Configuration principale de Nuxt avec les variables d'environnement runtime.

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/i18n'
  ],
  runtimeConfig: {
    public: {
      guestMode: false,      // NUXT_PUBLIC_GUEST_MODE
      enableRegister: true   // NUXT_PUBLIC_ENABLE_REGISTER
    }
  }
})
```

### drizzle.config.ts

Configuration de Drizzle Kit pour les migrations.

```typescript
export default defineConfig({
  schema: './server/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```

### vitest.config.ts

Configuration des tests unitaires.

### playwright.config.ts

Configuration des tests E2E.

## Conventions de nommage

### Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `TableEditor.vue` |
| Composables | camelCase avec `use` | `useProjectStore.ts` |
| Services | camelCase avec `Service` | `projectService.ts` |
| Pages | kebab-case | `login.vue` |
| Types | PascalCase | `database.ts` |
| Utils | camelCase | `auth-client.ts` |

### Code

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `<TableEditor />` |
| Fonctions | camelCase | `addTable()` |
| Constantes | SCREAMING_SNAKE | `GUEST_USER_ID` |
| Types/Interfaces | PascalCase | `TableData` |
| Enums | PascalCase | `ColumnType` |

## Architecture Open Core

DBKeep suit une architecture découplée permettant différents modes :

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  useAppMode         → Configuration mode invité/register    │
│  useCanvasStore     → État canvas (agnostique auth)         │
│  middleware/auth    → Protection routes (guest bypass)      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  services/          → Logique métier centralisée            │
│  utils/appMode      → Helpers mode invité                   │
│  plugins/guestUser  → Création user guest au démarrage      │
└─────────────────────────────────────────────────────────────┘
```

Voir [Configuration](./configuration.md) pour les variables d'environnement.

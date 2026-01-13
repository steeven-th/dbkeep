# Project Structure

File and folder organization for DBKeep.

## Overview

DBKeep follows the Nuxt 4 structure with the `app/` folder for frontend source code and an **extensible architecture** supporting different deployment modes.

```
dbkeep/
├── app/                      # Frontend source code (Nuxt 4)
├── docs/                     # Documentation
├── i18n/                     # Internationalization
├── public/                   # Static assets
├── server/                   # Nitro Backend
├── test/                     # Test configuration
├── tests/                    # E2E tests
├── .env.example              # Configuration example
├── drizzle.config.ts         # Drizzle Kit configuration
├── nuxt.config.ts            # Nuxt configuration
├── package.json              # Dependencies
└── vitest.config.ts          # Vitest configuration
```

## app/ Folder

Vue.js/Nuxt frontend source code.

```
app/
├── assets/                   # CSS, images, fonts
│   └── css/
│       └── main.css          # Global styles + Design System
├── components/               # Vue components
│   ├── canvas/               # Vue Flow components
│   │   ├── DatabaseCanvas.vue    # Main canvas
│   │   ├── CanvasToolbar.vue     # Toolbar
│   │   ├── TableEditor.vue       # Table edit slideover
│   │   ├── GroupEditor.vue       # Group edit slideover
│   │   ├── NoteEditor.vue        # Note edit slideover
│   │   ├── RelationEditor.vue    # Relation edit modal
│   │   ├── SqlChangesOverlay.vue # SQL changes overlay
│   │   ├── NewProjectModal.vue   # New project modal
│   │   ├── nodes/
│   │   │   ├── DbTable.vue       # Table node
│   │   │   ├── DbGroup.vue       # Group node
│   │   │   └── DbNote.vue        # Note node
│   │   └── edges/
│   │       └── RelationEdge.vue  # Relation edge
│   ├── sidebar/
│   │   └── SqlPreview.vue        # SQL preview
│   ├── DeleteConfirmModal.vue    # Delete confirmation modal
│   ├── ProfileEditModal.vue      # Profile edit modal
│   └── ...                   # Other components
├── composables/              # Vue composables (reusable hooks)
│   ├── useAppMode.ts         # Guest mode + registration management
│   ├── useAuth.ts            # Authentication
│   ├── useProjectStore.ts    # Project store (tables, columns)
│   ├── useCanvasStore.ts     # Vue Flow store (nodes, edges)
│   ├── useProjects.ts        # Projects CRUD (API)
│   ├── useSqlGenerator.ts    # SQL generation
│   ├── useSqlParser.ts       # SQL parsing
│   └── useDeleteConfirm.ts   # Delete confirmation
├── layouts/                  # Nuxt layouts
│   ├── default.vue           # Layout with navbar (app)
│   └── landing.vue           # Layout without navbar (public)
├── middleware/               # Route middleware
│   └── auth.ts               # Route protection (supports guest mode)
├── pages/                    # Automatic pages/routes
│   ├── index.vue             # Landing page (/)
│   ├── login.vue             # Login (/login)
│   ├── register.vue          # Registration (/register)
│   └── app/
│       ├── index.vue         # Projects dashboard (/app)
│       ├── settings.vue      # Settings (/app/settings)
│       └── project/
│           └── [id].vue      # Project editor (/app/project/:id)
├── types/                    # TypeScript types
│   └── database.ts           # Types for tables, columns, relations
├── plugins/
│   └── monaco.client.ts      # Monaco Editor plugin
└── utils/                    # Utilities
    └── auth-client.ts        # Better Auth client
```

## server/ Folder

Nitro backend (API, database, services).

```
server/
├── api/                      # API routes
│   ├── auth/
│   │   └── [...all].ts       # Better Auth handler (catch-all)
│   └── projects/
│       ├── index.get.ts      # GET /api/projects (list)
│       ├── index.post.ts     # POST /api/projects (create)
│       ├── [id].get.ts       # GET /api/projects/:id
│       ├── [id].put.ts       # PUT /api/projects/:id
│       └── [id].delete.ts    # DELETE /api/projects/:id
├── database/                 # Database
│   ├── drizzle.ts            # PostgreSQL connection
│   └── schema.ts             # Drizzle schema (tables)
├── services/                 # Business services
│   └── projectService.ts     # Project operations (Drizzle)
├── plugins/                  # Nitro plugins
│   └── guestUser.ts          # Guest user creation at startup
└── utils/                    # Server utilities
    ├── auth.ts               # Better Auth configuration
    ├── appMode.ts            # Guest mode helpers
    ├── workspace.ts          # Multi-tenancy extension point
    └── guestUser.ts          # Guest user management
```

## i18n/ Folder

Translation files for internationalization.

```
i18n/
└── locales/
    ├── fr.json               # French translations
    └── en.json               # English translations
```

### Translation Structure

```json
{
  "app_name": "DBKeep",
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login_title": "Login",
    "login_button": "Sign in"
  },
  "guest": {
    "mode_label": "Guest Mode"
  }
}
```

## Configuration Files

### nuxt.config.ts

Main Nuxt configuration with runtime environment variables.

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

Drizzle Kit configuration for migrations.

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

Unit test configuration.

### playwright.config.ts

E2E test configuration.

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TableEditor.vue` |
| Composables | camelCase with `use` | `useProjectStore.ts` |
| Services | camelCase with `Service` | `projectService.ts` |
| Pages | kebab-case | `login.vue` |
| Types | PascalCase | `database.ts` |
| Utils | camelCase | `auth-client.ts` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `<TableEditor />` |
| Functions | camelCase | `addTable()` |
| Constants | SCREAMING_SNAKE | `GUEST_USER_ID` |
| Types/Interfaces | PascalCase | `TableData` |
| Enums | PascalCase | `ColumnType` |

## Extensible Architecture

DBKeep follows a decoupled architecture supporting different modes:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  useAppMode         → Guest mode/register configuration     │
│  useCanvasStore     → Canvas state (auth-agnostic)          │
│  middleware/auth    → Route protection (guest bypass)       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  services/          → Centralized business logic            │
│  utils/appMode      → Guest mode helpers                    │
│  utils/workspace    → Multi-tenancy extension point         │
│  plugins/guestUser  → Guest user creation at startup        │
└─────────────────────────────────────────────────────────────┘
```

See [Configuration](./configuration.md) for environment variables.

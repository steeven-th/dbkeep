# Guide de contribution

Merci de votre intérêt pour contribuer à DBKeep !

## Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/votre-username/dbkeep/issues)
2. Créez une nouvelle issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs obtenu
   - Screenshots si pertinent
   - Environnement (OS, navigateur, version Node.js)

### Proposer une fonctionnalité

1. Ouvrez une issue avec le tag `feature`
2. Décrivez la fonctionnalité et son cas d'usage
3. Attendez la validation avant de commencer le développement

### Soumettre du code

1. **Fork** le repository
2. **Cloner** votre fork
   ```bash
   git clone https://github.com/VOTRE_USERNAME/dbkeep.git
   cd dbkeep
   ```
3. **Créer une branche**
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-bugfix
   ```
4. **Développer** en suivant les conventions
5. **Tester** vos changements
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
6. **Commiter** avec un message clair
   ```bash
   git commit -m "feat: ajouter la fonctionnalité X"
   ```
7. **Pusher** votre branche
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
8. **Créer une Pull Request** vers `main`

## Conventions de code

### Style général

- **Langue du code** : Anglais (noms de variables, fonctions)
- **Commentaires** : Français accepté pour la documentation complexe
- **Indentation** : 2 espaces
- **Quotes** : Single quotes (`'`)
- **Point-virgule** : Non (style Nuxt/Vue)

### Commits

Format des messages de commit :

```
type(scope): description courte

Corps optionnel avec plus de détails.
```

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de changement de code)
- `refactor` : Refactoring
- `test` : Ajout/modification de tests
- `chore` : Maintenance, dépendances

Exemples :
```
feat(canvas): ajouter le zoom avec la molette
fix(auth): corriger la redirection après connexion
docs: mettre à jour le README
```

### TypeScript

- Toujours typer les paramètres et retours de fonction
- Éviter `any`, préférer `unknown` si nécessaire
- Utiliser des interfaces pour les objets complexes

```typescript
// Bien
const addTable = (table: TableData): void => { ... }

// Éviter
const addTable = (table: any) => { ... }
```

### Vue/Nuxt

- Utiliser `<script setup lang="ts">`
- Composables avec préfixe `use`
- Props typées avec `defineProps<T>()`

```vue
<script setup lang="ts">
interface Props {
  table: TableData
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
})
</script>
```

### i18n

**Aucun texte en dur**. Toujours utiliser `$t()` ou `t()`.

```vue
<!-- Bien -->
<UButton>{{ $t('common.save') }}</UButton>

<!-- Éviter -->
<UButton>Enregistrer</UButton>
```

Ajouter les traductions dans les deux fichiers :
- `i18n/locales/fr.json`
- `i18n/locales/en.json`

## Structure des fichiers

Respecter l'organisation existante :

```
app/
├── components/canvas/     # Composants Vue Flow
├── composables/           # Hooks réutilisables
├── pages/                 # Routes
├── types/                 # Types TypeScript
└── utils/                 # Utilitaires
```

## Tests

### Tests unitaires

Utiliser Vitest pour les tests unitaires.

```typescript
import { describe, it, expect } from 'vitest'

describe('maFonction', () => {
  it('devrait retourner true', () => {
    expect(maFonction()).toBe(true)
  })
})
```

### Tests E2E

Utiliser Playwright pour les tests end-to-end.

```typescript
import { test, expect } from '@playwright/test'

test('connexion utilisateur', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/app')
})
```

## Checklist avant PR

- [ ] Le code compile sans erreur (`pnpm typecheck`)
- [ ] Le linter passe (`pnpm lint`)
- [ ] Les tests passent (`pnpm test`)
- [ ] Les traductions sont ajoutées (FR et EN)
- [ ] La documentation est mise à jour si nécessaire
- [ ] Le commit suit les conventions

## Besoin d'aide ?

- Ouvrez une issue avec le tag `question`
- Consultez la documentation dans `/docs`

Merci de contribuer à DBKeep !

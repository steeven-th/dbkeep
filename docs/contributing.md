# Contributing Guide

Thank you for your interest in contributing to DBKeep!

## How to Contribute

### Report a Bug

1. Check that the bug hasn't already been reported in [Issues](https://github.com/your-username/dbkeep/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if relevant
   - Environment (OS, browser, Node.js version)

### Propose a Feature

1. Open an issue with the `feature` tag
2. Describe the feature and its use case
3. Wait for validation before starting development

### Submit Code

1. **Fork** the repository
2. **Clone** your fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/dbkeep.git
   cd dbkeep
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```
4. **Develop** following conventions
5. **Test** your changes
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
6. **Commit** with a clear message
   ```bash
   git commit -m "feat: add feature X"
   ```
7. **Push** your branch
   ```bash
   git push origin feature/my-feature
   ```
8. **Create a Pull Request** to `main`

## Code Conventions

### General Style

- **Code language**: English (variable names, functions)
- **Comments**: English for code comments
- **Indentation**: 2 spaces
- **Quotes**: Single quotes (`'`)
- **Semicolons**: No (Nuxt/Vue style)

### Commits

Commit message format:

```
type(scope): short description

Optional body with more details.
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Refactoring
- `test`: Adding/modifying tests
- `chore`: Maintenance, dependencies

Examples:
```
feat(canvas): add mouse wheel zoom
fix(auth): fix redirect after login
docs: update README
```

### TypeScript

- Always type function parameters and returns
- Avoid `any`, prefer `unknown` if needed
- Use interfaces for complex objects

```typescript
// Good
const addTable = (table: TableData): void => { ... }

// Avoid
const addTable = (table: any) => { ... }
```

### Vue/Nuxt

- Use `<script setup lang="ts">`
- Composables with `use` prefix
- Typed props with `defineProps<T>()`

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

**No hardcoded text**. Always use `$t()` or `t()`.

```vue
<!-- Good -->
<UButton>{{ $t('common.save') }}</UButton>

<!-- Avoid -->
<UButton>Save</UButton>
```

Add translations in both files:
- `i18n/locales/fr.json`
- `i18n/locales/en.json`

## File Structure

Follow the existing organization:

```
app/
├── components/canvas/     # Vue Flow components
├── composables/           # Reusable hooks
├── pages/                 # Routes
├── types/                 # TypeScript types
└── utils/                 # Utilities
```

## Tests

### Unit Tests

Use Vitest for unit tests.

```typescript
import { describe, it, expect } from 'vitest'

describe('myFunction', () => {
  it('should return true', () => {
    expect(myFunction()).toBe(true)
  })
})
```

### E2E Tests

Use Playwright for end-to-end tests.

```typescript
import { test, expect } from '@playwright/test'

test('user login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/app')
})
```

## Checklist Before PR

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Translations added (FR and EN)
- [ ] Documentation updated if necessary
- [ ] Commit follows conventions

## Need Help?

- Open an issue with the `question` tag
- Check the documentation in `/docs`

Thank you for contributing to DBKeep!

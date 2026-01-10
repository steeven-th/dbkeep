# Configuration

Guide de configuration des variables d'environnement.

## Fichier .env

DBKeep utilise un fichier `.env` pour la configuration. Un fichier d'exemple `.env.example` est fourni.

```bash
cp .env.example .env
```

## Variables d'environnement

### DATABASE_URL

URL de connexion à PostgreSQL.

**Format** :
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Exemples** :

```env
# Avec mot de passe
DATABASE_URL=postgresql://postgres:monmotdepasse@localhost:5432/dbkeep

# Sans mot de passe (config locale macOS par défaut)
DATABASE_URL=postgresql://steeventhomas@localhost:5432/dbkeep

# Avec SSL (production)
DATABASE_URL=postgresql://user:pass@host.com:5432/dbkeep?sslmode=require
```

### BETTER_AUTH_SECRET

Clé secrète pour signer les sessions et tokens. **Doit faire au moins 32 caractères**.

**Générer une clé sécurisée** :

```bash
# Avec OpenSSL
openssl rand -base64 32

# Avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Exemple** :
```env
BETTER_AUTH_SECRET=+dh34Ge0TJcUPxtk7Nza9eOZ7+lPlX6itV/ATEw3jzs=
```

> **Important** : Ne jamais commiter cette clé dans le code source !

### BETTER_AUTH_URL

URL de base de l'application. Utilisée pour les redirections et les callbacks.

```env
# Développement
BETTER_AUTH_URL=http://localhost:3000

# Production
BETTER_AUTH_URL=https://dbkeep.example.com
```

---

## Modes de fonctionnement

DBKeep supporte différents modes de déploiement via des variables d'environnement.

### NUXT_PUBLIC_GUEST_MODE

Active le **Mode Invité** permettant d'utiliser l'application sans authentification.

| Valeur | Comportement |
|--------|--------------|
| `false` (défaut) | Authentification requise |
| `true` | Accès libre, projets attribués à un utilisateur "guest" |

**Cas d'usage** :
- Auto-hébergement personnel
- Instances de démonstration
- Usage local sans compte

```env
NUXT_PUBLIC_GUEST_MODE=true
```

**Impact** :
- Le middleware auth laisse passer toutes les requêtes vers `/app`
- Les projets sont sauvegardés avec l'ID utilisateur `guest-user`
- Les options "Profil" et "Paramètres" sont masquées dans le menu

### NUXT_PUBLIC_ENABLE_REGISTER

Contrôle l'inscription de nouveaux utilisateurs.

| Valeur | Comportement |
|--------|--------------|
| `true` (défaut) | Inscription ouverte |
| `false` | Inscription désactivée |

**Cas d'usage** :
- SaaS privé (seul l'admin crée les comptes)
- Instance personnelle verrouillée
- Phase beta fermée

```env
NUXT_PUBLIC_ENABLE_REGISTER=false
```

**Impact** :
- Le lien "S'inscrire" est masqué sur `/login`
- La page `/register` affiche un message d'erreur
- L'API `/api/auth/sign-up` retourne une erreur 403

---

## Scénarios de déploiement

### SaaS Public (défaut)

Configuration standard avec authentification et inscription ouverte.

```env
DATABASE_URL=postgresql://user:pass@db.host.com:5432/dbkeep
BETTER_AUTH_SECRET=<clé-sécurisée>
BETTER_AUTH_URL=https://dbkeep.example.com

# Valeurs par défaut (peuvent être omises)
NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=true
```

### SaaS Privé

Authentification requise, inscription désactivée (admin crée les comptes).

```env
DATABASE_URL=postgresql://user:pass@db.host.com:5432/dbkeep
BETTER_AUTH_SECRET=<clé-sécurisée>
BETTER_AUTH_URL=https://private.dbkeep.example.com

NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Auto-hébergement Personnel

Mode invité pour usage personnel sans gestion de compte.

```env
DATABASE_URL=postgresql://localhost/dbkeep
BETTER_AUTH_SECRET=dev-key-not-important-in-guest-mode
BETTER_AUTH_URL=http://localhost:3000

NUXT_PUBLIC_GUEST_MODE=true
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Développement Local

Configuration pour le développement avec toutes les fonctionnalités.

```env
DATABASE_URL=postgresql://localhost/dbkeep
BETTER_AUTH_SECRET=dev-secret-key-not-for-production-use
BETTER_AUTH_URL=http://localhost:3000

NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=true
```

---

## Exemple complet

```env
# ===========================================
# Database PostgreSQL
# ===========================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/dbkeep

# ===========================================
# Better Auth
# ===========================================
BETTER_AUTH_SECRET=+dh34Ge0TJcUPxtk7Nza9eOZ7+lPlX6itV/ATEw3jzs=
BETTER_AUTH_URL=http://localhost:3000

# ===========================================
# Mode de fonctionnement
# ===========================================
# Mode Invité (accès sans authentification)
NUXT_PUBLIC_GUEST_MODE=false

# Inscription des utilisateurs
NUXT_PUBLIC_ENABLE_REGISTER=true
```

## Validation

Après configuration, vérifiez que tout fonctionne :

```bash
# Tester la connexion à la base
pnpm db:push

# Lancer l'application
pnpm dev

# Ouvrir Drizzle Studio pour vérifier les tables
pnpm db:studio
```

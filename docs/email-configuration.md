# Email Configuration (SMTP)

DBKeep uses an SMTP server to send emails. This configuration is **optional** but required for certain features:

- **Password reset** ("Forgot password")
- **Email verification** at signup (optional)

## Environment Variables

Add these variables to your `.env` file:

```bash
# SMTP Server
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-key
SMTP_SECURE=false

# Sender address
EMAIL_FROM="DBKeep <noreply@yourdomain.com>"

# Public application URL (for links in emails)
NUXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL, 1025 for Mailpit) | `587` |
| `SMTP_USER` | SMTP username (optional for local dev) | `user@example.com` |
| `SMTP_PASSWORD` | SMTP password or API key (optional for local dev) | `xkeysib-xxx` |
| `SMTP_SECURE` | `true` for SSL (port 465), `false` for TLS (port 587) | `false` |
| `EMAIL_FROM` | Sender address with name | `"DBKeep <noreply@dbkeep.io>"` |
| `NUXT_PUBLIC_APP_URL` | Base URL for links in emails | `https://dbkeep.io` |

## Provider Configuration

### Brevo (formerly Sendinblue)

Brevo is an email service with a generous free tier (300 emails/day).

1. Create an account on [brevo.com](https://www.brevo.com/)
2. Go to **Settings** > **SMTP & API**
3. Generate an SMTP key

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=xkeysib-your-smtp-key
SMTP_SECURE=false
```

### Mailpit (local development)

[Mailpit](https://github.com/axllent/mailpit) is a tool that captures emails locally for development.

1. Install Mailpit:
   ```bash
   # macOS with Homebrew
   brew install mailpit

   # Docker
   docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
   ```

2. Start Mailpit:
   ```bash
   mailpit
   ```

3. Configure DBKeep:
   ```bash
   SMTP_HOST=localhost
   SMTP_PORT=1025
   # No need for SMTP_USER or SMTP_PASSWORD with Mailpit
   SMTP_SECURE=false
   ```

4. Open the web interface: http://localhost:8025

### Gmail

> ⚠️ Gmail requires an "App Password" if you have 2FA enabled.

1. Enable 2FA on your Google account
2. Generate an app password: [Google Account > Security > App Passwords](https://myaccount.google.com/apppasswords)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
```

### Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-api-key
SMTP_SECURE=false
```

### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key
SMTP_SECURE=false
```

### OVH

```bash
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
```

## Email Features

### Password Reset

Automatically enabled if SMTP is configured. Users can click "Forgot password" on the login page.

The reset link expires after **60 minutes**.

### Email Verification (optional)

By default, email verification is **disabled**. To enable it:

```bash
REQUIRE_EMAIL_VERIFICATION=true
```

When enabled:
- A verification email is sent at signup
- Users must click the link to activate their account

## Testing Configuration

To test your SMTP configuration, you can use the `testEmailConfiguration()` function:

```typescript
import { testEmailConfiguration } from '~/server/services/emailService'

// Returns true if SMTP connection works
const isConfigured = await testEmailConfiguration()
```

## Behavior Without Email Configuration

If SMTP is not configured (`SMTP_HOST` empty or missing):

- **Password reset**: The link is displayed in server logs (useful for development)
- **Email verification**: Disabled, users are automatically verified
- No errors are thrown, the application continues to work

## Troubleshooting

### Emails are not sent

1. Check that `SMTP_HOST` is defined
2. Check server logs for `[EmailService]` errors
3. Test the connection with `testEmailConfiguration()`

### "Authentication failed" error

- Check `SMTP_USER` and `SMTP_PASSWORD`
- For Gmail, use an "App Password", not your main password
- For Brevo, use your email and SMTP key (not API key)

### SSL certificate error

- Try `SMTP_SECURE=false` with port 587 (TLS)
- Or `SMTP_SECURE=true` with port 465 (SSL)

### Emails going to spam

- Configure SPF and DKIM records on your domain
- Use an `EMAIL_FROM` address with a verified domain
- Avoid "spammy" terms in the subject line

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Service d'envoi d'emails via SMTP
 *
 * Compatible avec :
 * - Brevo (smtp-relay.brevo.com)
 * - Mailpit (dev local)
 * - Mailgun, SendGrid, ou tout serveur SMTP
 *
 * Configuration via variables d'environnement :
 * - SMTP_HOST : Hôte SMTP (ex: smtp-relay.brevo.com, localhost)
 * - SMTP_PORT : Port SMTP (ex: 587, 1025)
 * - SMTP_USER : Utilisateur SMTP (optionnel pour dev local)
 * - SMTP_PASSWORD : Mot de passe SMTP (optionnel pour dev local)
 * - SMTP_SECURE : true pour SSL/TLS (port 465), false sinon
 * - EMAIL_FROM : Adresse d'expéditeur (ex: "DBKeep <noreply@dbkeep.io>")
 * - NUXT_PUBLIC_APP_URL : URL de l'application (pour les liens dans les emails)
 */

// ============================================================================
// Configuration
// ============================================================================

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'

const FROM_EMAIL = process.env.EMAIL_FROM || 'DBKeep <noreply@dbkeep.io>'
const APP_URL = process.env.NUXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
const APP_NAME = process.env.APP_NAME || 'DBKeep'

// ============================================================================
// Transporter
// ============================================================================

/**
 * Crée le transporter Nodemailer
 */
function createTransporter(): Transporter | null {
  if (!SMTP_HOST) {
    return null
  }

  const config: nodemailer.TransportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE
  } as nodemailer.TransportOptions

  // Ajouter l'auth seulement si user/password sont fournis
  if (SMTP_USER && SMTP_PASSWORD) {
    (config as any).auth = {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  }

  return nodemailer.createTransport(config)
}

// Singleton du transporter
let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!transporter) {
    transporter = createTransporter()
  }
  return transporter
}

/**
 * Vérifie si le service email est configuré
 */
export function isEmailConfigured(): boolean {
  return !!SMTP_HOST
}

// ============================================================================
// Types
// ============================================================================

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================================================
// Fonction générique d'envoi
// ============================================================================

/**
 * Envoie un email via SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getTransporter()

  if (!transport) {
    console.warn('[EmailService] SMTP non configuré (SMTP_HOST manquant). Email non envoyé.')
    return {
      success: false,
      error: 'Email service not configured'
    }
  }

  try {
    const result = await transport.sendMail({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html)
    })

    console.log(`[EmailService] Email envoyé à ${options.to} (ID: ${result.messageId})`)

    return {
      success: true,
      messageId: result.messageId
    }
  } catch (err: any) {
    console.error('[EmailService] Erreur envoi email:', err)
    return {
      success: false,
      error: err.message || 'Unknown error'
    }
  }
}

/**
 * Teste la configuration SMTP
 */
export async function testEmailConfiguration(): Promise<boolean> {
  const transport = getTransporter()

  if (!transport) {
    console.warn('[EmailService] SMTP non configuré pour le test')
    return false
  }

  try {
    await transport.verify()
    console.log('[EmailService] Configuration SMTP vérifiée avec succès')
    return true
  } catch (err) {
    console.error('[EmailService] Erreur de configuration SMTP:', err)
    return false
  }
}

// ============================================================================
// Templates de base
// ============================================================================

/**
 * Génère le wrapper HTML pour tous les emails
 */
function emailWrapper(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
          <tr>
            <td align="center">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                © ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Génère un bouton CTA pour les emails
 */
function emailButton(url: string, text: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <a href="${url}"
         style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #2563eb; border-radius: 8px; text-decoration: none;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`
}

/**
 * Supprime les balises HTML pour générer le texte brut
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// Emails d'authentification
// ============================================================================

interface PasswordResetEmailData {
  to: string
  resetUrl: string
  expiresInMinutes?: number
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
  const expiresIn = data.expiresInMinutes || 60

  const content = `
<h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
  Réinitialisation de votre mot de passe
</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
  Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
</p>

${emailButton(data.resetUrl, 'Réinitialiser mon mot de passe')}

<p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
  Ou copiez ce lien dans votre navigateur :
</p>
<p style="margin: 0 0 24px; font-size: 14px; color: #2563eb; word-break: break-all;">
  ${data.resetUrl}
</p>

<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

<p style="margin: 0; font-size: 13px; color: #a1a1aa;">
  Ce lien expire dans ${expiresIn} minutes.
  Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
</p>
`

  return sendEmail({
    to: data.to,
    subject: `Réinitialisation de votre mot de passe ${APP_NAME}`,
    html: emailWrapper(content, 'Réinitialisation de mot de passe')
  })
}

interface EmailVerificationData {
  to: string
  verifyUrl: string
  userName?: string
}

/**
 * Envoie un email de vérification d'adresse email
 */
export async function sendEmailVerification(data: EmailVerificationData): Promise<SendEmailResult> {
  const greeting = data.userName ? `Bonjour ${data.userName},` : 'Bonjour,'

  const content = `
<h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
  Vérifiez votre adresse email
</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
  ${greeting}<br><br>
  Merci de vous être inscrit sur ${APP_NAME} ! Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
</p>

${emailButton(data.verifyUrl, 'Vérifier mon email')}

<p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
  Ou copiez ce lien dans votre navigateur :
</p>
<p style="margin: 0 0 24px; font-size: 14px; color: #2563eb; word-break: break-all;">
  ${data.verifyUrl}
</p>

<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

<p style="margin: 0; font-size: 13px; color: #a1a1aa;">
  Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
</p>
`

  return sendEmail({
    to: data.to,
    subject: `Vérifiez votre adresse email - ${APP_NAME}`,
    html: emailWrapper(content, 'Vérification email')
  })
}

// ============================================================================
// Exports pour extension (utilisés par le CLOUD)
// ============================================================================

export {
  emailWrapper,
  emailButton,
  stripHtml,
  APP_URL,
  APP_NAME,
  FROM_EMAIL
}

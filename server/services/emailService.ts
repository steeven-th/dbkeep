import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { t, getValidLocale } from '../utils/i18n'
import type { SupportedLocale } from '../utils/i18n'

/**
 * Email sending service via SMTP
 *
 * Compatible with:
 * - Brevo (smtp-relay.brevo.com)
 * - Mailpit (local dev)
 * - Mailgun, SendGrid, or any SMTP server
 *
 * Configuration via environment variables:
 * - SMTP_HOST: SMTP host (e.g., smtp-relay.brevo.com, localhost)
 * - SMTP_PORT: SMTP port (e.g., 587, 1025)
 * - SMTP_USER: SMTP user (optional for local dev)
 * - SMTP_PASSWORD: SMTP password (optional for local dev)
 * - SMTP_SECURE: true for SSL/TLS (port 465), false otherwise
 * - EMAIL_FROM: Sender address (e.g., "DBKeep <noreply@dbkeep.io>")
 * - NUXT_PUBLIC_APP_URL: Application URL (for email links)
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
 * Creates the Nodemailer transporter
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

  // Add auth only if user/password are provided
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
 * Checks if the email service is configured
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
// Generic send function
// ============================================================================

/**
 * Sends an email via SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getTransporter()

  if (!transport) {
    console.warn('[EmailService] SMTP not configured (SMTP_HOST missing). Email not sent.')
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

    console.log(`[EmailService] Email sent to ${options.to} (ID: ${result.messageId})`)

    return {
      success: true,
      messageId: result.messageId
    }
  } catch (err: any) {
    console.error('[EmailService] Error sending email:', err)
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
    console.warn('[EmailService] SMTP not configured for test')
    return false
  }

  try {
    await transport.verify()
    console.log('[EmailService] SMTP configuration verified successfully')
    return true
  } catch (err) {
    console.error('[EmailService] SMTP configuration error:', err)
    return false
  }
}

// ============================================================================
// Base templates
// ============================================================================

/**
 * Generates the HTML wrapper for all emails
 */
function emailWrapper(content: string, title: string, locale: SupportedLocale = 'en'): string {
  return `
<!DOCTYPE html>
<html lang="${locale}">
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
                © ${new Date().getFullYear()} ${APP_NAME}. ${t(locale, 'email.footer')}
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
 * Generates a CTA button for emails
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
 * Strips HTML tags to generate plain text
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
// Authentication emails
// ============================================================================

interface PasswordResetEmailData {
  to: string
  resetUrl: string
  expiresInMinutes?: number
  locale?: string
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
  const locale = getValidLocale(data.locale)
  const expiresIn = data.expiresInMinutes || 60

  const content = `
<h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
  ${t(locale, 'email.password_reset.title')}
</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
  ${t(locale, 'email.password_reset.description')}
</p>

${emailButton(data.resetUrl, t(locale, 'email.password_reset.button'))}

<p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
  ${t(locale, 'email.link_fallback')}
</p>
<p style="margin: 0 0 24px; font-size: 14px; color: #2563eb; word-break: break-all;">
  ${data.resetUrl}
</p>

<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

<p style="margin: 0; font-size: 13px; color: #a1a1aa;">
  ${t(locale, 'email.password_reset.expires_in', { minutes: expiresIn })}
  ${t(locale, 'email.password_reset.ignore_notice')}
</p>
`

  return sendEmail({
    to: data.to,
    subject: t(locale, 'email.password_reset.subject', { app_name: APP_NAME }),
    html: emailWrapper(content, t(locale, 'email.password_reset.title'), locale)
  })
}

interface EmailVerificationData {
  to: string
  verifyUrl: string
  userName?: string
  locale?: string
}

/**
 * Sends an email verification email
 */
export async function sendEmailVerification(data: EmailVerificationData): Promise<SendEmailResult> {
  const locale = getValidLocale(data.locale)
  const greeting = data.userName
    ? t(locale, 'email.email_verification.greeting', { name: data.userName })
    : t(locale, 'email.email_verification.greeting_anonymous')

  const content = `
<h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
  ${t(locale, 'email.email_verification.title')}
</h2>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
  ${greeting}<br><br>
  ${t(locale, 'email.email_verification.description', { app_name: APP_NAME })}
</p>

${emailButton(data.verifyUrl, t(locale, 'email.email_verification.button'))}

<p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
  ${t(locale, 'email.link_fallback')}
</p>
<p style="margin: 0 0 24px; font-size: 14px; color: #2563eb; word-break: break-all;">
  ${data.verifyUrl}
</p>

<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

<p style="margin: 0; font-size: 13px; color: #a1a1aa;">
  ${t(locale, 'email.email_verification.ignore_notice')}
</p>
`

  return sendEmail({
    to: data.to,
    subject: t(locale, 'email.email_verification.subject', { app_name: APP_NAME }),
    html: emailWrapper(content, t(locale, 'email.email_verification.title'), locale)
  })
}

// ============================================================================
// Exports for extension (used by CLOUD)
// ============================================================================

export {
  emailWrapper,
  emailButton,
  stripHtml,
  APP_URL,
  APP_NAME,
  FROM_EMAIL,
  t,
  getValidLocale
}

export type { SupportedLocale }

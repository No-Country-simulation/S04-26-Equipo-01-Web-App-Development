import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ResendEmailResponse = {
  id?: string;
  error?: string;
};

type SendRegistrationConfirmationParams = {
  to: string;
  recipientName?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey: string;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'Red de Bienestar Laboral <no-reply@redbienestarlaboral.com>',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
  }

  async sendRegistrationConfirmation(
    params: SendRegistrationConfirmationParams,
  ): Promise<void> {
    if (!this.resendApiKey) {
      this.logger.warn(
        `RESEND_API_KEY is not configured. Skipping email for ${params.to}.`,
      );
      return;
    }

    if (!this.isValidEmail(params.to)) {
      this.logger.warn(
        `Invalid recipient email '${params.to}'. Skipping send.`,
      );
      return;
    }

    const subject = 'Bienvenido a Red de Bienestar Laboral';
    const recipientName = params.recipientName?.trim() || params.to;
    const safeRecipientName = this.escapeHtml(recipientName);
    const text = this.buildPlainTextMessage(recipientName, this.frontendUrl);
    const html = this.buildHtmlMessage(safeRecipientName, this.frontendUrl);

    const controller = new AbortController();
    const timeoutMs = 10000; // 10s timeout
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.sanitizeFrom(this.fromEmail),
        to: [params.to],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const rawBody = await response.text().catch(() => '');
      const payload = this.parseErrorBody(rawBody);
      let details = payload?.error ?? rawBody;
      if (typeof details === 'string' && details.length > 1000) {
        details = details.slice(0, 1000) + '...';
      }

      throw new Error(
        `Resend request failed with status ${response.status}${details ? `: ${details}` : ''}`,
      );
    }

    this.logger.log(`Confirmation email queued for ${params.to}.`);
  }

  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    // simple RFC-like check
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  private sanitizeFrom(from: string): string {
    // Prevent header injection by removing newlines
    return from.replace(/[\r\n]/g, ' ').trim();
  }

  private buildPlainTextMessage(
    recipientName: string,
    frontendUrl: string,
  ): string {
    return [
      `Hola ${recipientName},`,
      '',
      'Tu registro en Red de Bienestar Laboral fue completado con éxito.',
      'Puedes acceder a tu cuenta y completar tu perfil aquí:',
      frontendUrl,
      '',
      'Saludos,',
      'Red de Bienestar Laboral',
    ].join('\n');
  }

  private buildHtmlMessage(recipientName: string, frontendUrl: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:24px; text-align:center; background: #f3f4f6;">
              <h1 style="margin:0; font-size:20px; color:#0f172a;">Red de Bienestar Laboral</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px; background: #ffffff;">
              <p style="font-size:16px; margin:0 0 12px 0;">Hola <strong>${recipientName}</strong>,</p>
              <p style="margin:0 0 16px 0; color:#374151;">Gracias por registrarte en Red de Bienestar Laboral. Tu cuenta se creó correctamente.</p>

              <div style="text-align:center; margin:20px 0;">
                <a href="${frontendUrl}" style="background:#0b76ef; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:6px; display:inline-block;">Ir a mi cuenta</a>
              </div>

              <p style="margin:0 0 8px 0; color:#6b7280; font-size:13px;">Si no solicitaste esta cuenta, ignora este correo.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px; text-align:center; font-size:12px; color:#9ca3af;">
              Red de Bienestar Laboral — Apoyando tu bienestar en el trabajo
            </td>
          </tr>
        </table>
      </div>
    `.trim();
  }

  private parseErrorBody(body: string): ResendEmailResponse | null {
    if (!body) {
      return null;
    }

    try {
      return JSON.parse(body) as ResendEmailResponse;
    } catch {
      return null;
    }
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

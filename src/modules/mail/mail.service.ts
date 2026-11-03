import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: Number(config.get('SMTP_PORT')),
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') } : undefined,
    });
  }

  async sendVerificationCode(to: string, name: string, code: string) {
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject: 'Votre code de vérification',
      html: `
        <p>Bonjour ${escapeHtml(name)},</p>
        <p>Votre code de vérification est :</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
        <p>Il est valable 10 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>`,
    });
  }
}

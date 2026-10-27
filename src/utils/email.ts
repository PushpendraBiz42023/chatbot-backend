import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Dev-only provider: logs the email to the server console instead of delivering it.
 * No SMTP credentials are configured for local dev, and this keeps the auth flow
 * fully testable end-to-end without a real mail server.
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[DEV EMAIL] To: ${message.to} | Subject: ${message.subject}\n${message.text}`
    );
  }
}

/**
 * Real delivery via SMTP (e.g. Gmail). Credentials come only from env.smtp
 * (backend/.env, gitignored) — never hardcoded, never logged, never included
 * in any API response. On failure, only the error's `message` is logged
 * (never the transporter config or the OTP code itself).
 */
class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(config: NonNullable<typeof env.smtp>) {
    this.fromAddress = config.user;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}

function createEmailProvider(): EmailProvider {
  switch (env.emailProvider) {
    case "smtp":
      if (!env.smtp) {
        throw new Error("EMAIL_PROVIDER=smtp but SMTP configuration failed to load.");
      }
      return new SmtpEmailProvider(env.smtp);
    case "console":
      return new ConsoleEmailProvider();
    default:
      return new ConsoleEmailProvider();
  }
}

const provider = createEmailProvider();

export class EmailService {
  static async sendOtpEmail(to: string, code: string, purpose: string): Promise<void> {
    try {
      await provider.send({
        to,
        subject: "Your verification code",
        text: `Your ${purpose} verification code is: ${code}. It expires in 10 minutes.`,
      });
    } catch (error) {
      // Email delivery failures must never crash or block the request (e.g. signup
      // should still succeed even if sending throws). Log only the error message
      // (never the OTP code, recipient's full content, or SMTP credentials).
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error(`[EmailService] Failed to send ${purpose} email: ${reason}`);
    }
  }
}

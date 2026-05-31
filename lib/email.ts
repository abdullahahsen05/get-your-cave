import nodemailer from "nodemailer";

type MessageNotificationEmailInput = {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  summary: string;
  linkUrl: string;
};

type NotificationEmailInput = {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  summary: string;
  linkUrl: string;
  ctaLabel?: string;
};

type LoginVerificationEmailInput = {
  recipientEmail: string;
  recipientName: string;
  code: string;
  expiresInMinutes: number;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const appPassword = process.env.SMTP_APP_PASSWORD?.trim();
  const from = process.env.SMTP_FROM_EMAIL?.trim() || user;
  const portValue = process.env.SMTP_PORT?.trim();
  const secureValue = process.env.SMTP_SECURE?.trim();

  if (!host || !user || !appPassword || !from) {
    return null;
  }

  const port = Number.parseInt(portValue || "465", 10);
  const secure = secureValue ? secureValue.toLowerCase() === "true" : port === 465;

  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return { host, user, appPassword, from, port, secure };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
  });

  return transporter;
}

export async function sendMessageNotificationEmail(
  input: MessageNotificationEmailInput,
) {
  return sendNotificationEmail({
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    subject: input.subject,
    summary: input.summary,
    linkUrl: input.linkUrl,
    ctaLabel: "Open conversation",
    heading: `New message from ${input.senderName}`,
    footer:
      "This notification was sent because you have messaging enabled on GetYourCave.",
  });
}

export async function sendNotificationEmail(input: NotificationEmailInput & {
  heading?: string;
  footer?: string;
}) {
  const activeTransporter = getTransporter();
  const smtpConfig = getSmtpConfig();

  if (!activeTransporter || !smtpConfig) {
    return { sent: false as const };
  }

  const html = `
    <div style="background:#f6f4ef;padding:32px 0;font-family:Arial,sans-serif;color:#1f2937">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ebe4da;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.08)">
        <div style="padding:28px 30px;border-bottom:1px solid #f1ede7;background:linear-gradient(135deg,#fff8f1,#fff)">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#c15f1a;font-weight:700;margin-bottom:10px">GetYourCave</div>
          <h1 style="margin:0;font-size:24px;line-height:1.25;color:#111827">${escapeHtml(input.heading ?? input.subject)}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#4b5563">
            Hi ${escapeHtml(input.recipientName)}, you have a new update from GetYourCave.
          </p>
        </div>
        <div style="padding:28px 30px">
          <div style="background:#faf7f3;border:1px solid #ede5d8;border-radius:18px;padding:20px 22px">
            <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a5a26;margin-bottom:10px">
              ${escapeHtml(input.subject)}
            </div>
            <div style="font-size:16px;line-height:1.7;color:#1f2937">${escapeHtml(input.summary)}</div>
          </div>
          <div style="margin-top:24px">
            <a href="${escapeHtml(input.linkUrl)}" style="display:inline-block;background:#f26a1b;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">${escapeHtml(input.ctaLabel ?? "Open notification")}</a>
          </div>
        </div>
        <div style="padding:18px 30px 28px;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid #f1ede7">
          ${escapeHtml(input.footer ?? "This notification was sent because you enabled email notifications on GetYourCave.")}
        </div>
      </div>
    </div>
  `;

  await activeTransporter.sendMail({
    from: smtpConfig.from,
    to: input.recipientEmail,
    subject: input.subject,
    text: `${input.subject}\n\n${input.summary}\n\n${input.linkUrl}`,
    html,
  });

  return { sent: true as const };
}

export async function sendLoginVerificationCodeEmail(
  input: LoginVerificationEmailInput,
) {
  const activeTransporter = getTransporter();
  const smtpConfig = getSmtpConfig();

  if (!activeTransporter || !smtpConfig) {
    return { sent: false as const };
  }

  const html = `
    <div style="background:#f6f4ef;padding:32px 0;font-family:Arial,sans-serif;color:#1f2937">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ebe4da;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.08)">
        <div style="padding:28px 30px;border-bottom:1px solid #f1ede7;background:linear-gradient(135deg,#fff8f1,#fff)">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#c15f1a;font-weight:700;margin-bottom:10px">GetYourCave</div>
          <h1 style="margin:0;font-size:24px;line-height:1.25;color:#111827">Your login verification code</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#4b5563">
            Hi ${escapeHtml(input.recipientName)}, use the one-time code below to finish signing in.
          </p>
        </div>
        <div style="padding:28px 30px">
          <div style="text-align:center;background:#faf7f3;border:1px solid #ede5d8;border-radius:18px;padding:26px 22px">
            <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a5a26;margin-bottom:14px">
              Verification code
            </div>
            <div style="font-size:40px;letter-spacing:0.2em;font-weight:800;color:#111827">${escapeHtml(input.code)}</div>
            <div style="margin-top:12px;font-size:14px;line-height:1.6;color:#4b5563">
              This code expires in ${String(input.expiresInMinutes)} minutes.
            </div>
          </div>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#4b5563">
            If you did not try to sign in, you can safely ignore this email.
          </p>
        </div>
        <div style="padding:18px 30px 28px;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid #f1ede7">
          This security step helps protect your account with email-based two-factor authentication.
        </div>
      </div>
    </div>
  `;

  await activeTransporter.sendMail({
    from: smtpConfig.from,
    to: input.recipientEmail,
    subject: "Your GetYourCave login code",
    text: `Your GetYourCave verification code is ${input.code}. It expires in ${input.expiresInMinutes} minutes.`,
    html,
  });

  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

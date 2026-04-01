const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function buildEmailHtml({
  title,
  body,
  ctaText,
  ctaUrl,
}: {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const fullCtaUrl = ctaUrl?.startsWith("http") ? ctaUrl : `${APP_URL}${ctaUrl}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#16161F;border-radius:12px;border:1px solid #2A2A3A;">
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:#10C5EA;">Bandwire</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#F1F1F3;">${title}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#8888A0;">${body}</p>
          ${ctaText && ctaUrl ? `<a href="${fullCtaUrl}" style="display:inline-block;padding:12px 28px;background-color:#10C5EA;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${ctaText}</a>` : ""}
        </td></tr>
        <tr><td style="padding:32px;border-top:1px solid #2A2A3A;margin-top:24px;">
          <p style="margin:0;font-size:12px;color:#8888A0;">You're receiving this because you have a Bandwire account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set, skipping email send");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Bandwire <notifications@bandwire.com>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Resend email failed:", text);
    }
  } catch (error) {
    console.error("Email send error:", error);
  }
}

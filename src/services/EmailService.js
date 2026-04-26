import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { trackEvent } from "../lib/trackEvent";

// All email sends go through Base44 backend integration (Core.SendEmail)
// which handles the actual delivery. Fire-and-forget — never block UI.

async function sendEmail({ to, subject, body }) {
  await base44.integrations.Core.SendEmail({
    to,
    subject,
    body,
    from_name: "Fresh Start",
  });
}

export async function sendPaymentReceiptEmail({ orderId, userEmail, amount, description, userName }) {
  const today = format(new Date(), "dd/MM/yyyy");
  const subject = "קבלה על תשלום — Fresh Start";
  const body = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1E5FA8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Fresh Start</h1>
        <p style="color: #B8D4F0; margin: 4px 0 0 0; font-size: 14px;">קבלה על תשלום</p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">שלום ${userName || ""},</p>
        <p style="color: #374151;">תשלום על <strong>${description}</strong> בסך <strong>₪${amount}</strong> התקבל בהצלחה.</p>
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #374151; font-size: 14px;">מספר עסקה: <strong>${orderId}</strong></p>
          <p style="margin: 4px 0; color: #374151; font-size: 14px;">תאריך: <strong>${today}</strong></p>
          <p style="margin: 4px 0; color: #374151; font-size: 14px;">סכום: <strong>₪${amount}</strong></p>
        </div>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Fresh Start — פלטפורמת ניהול העסק הישראלי</p>
      </div>
    </div>
  `;
  try {
    await sendEmail({ to: userEmail, subject, body });
    trackEvent("email_sent", { type: "receipt" });
  } catch (e) {
    console.error("sendPaymentReceiptEmail failed:", e);
  }
}

export async function sendEmailSignatureEmail({ userEmail, signatureHtml, userName }) {
  const subject = "חתימת האימייל שלך מוכנה — Fresh Start";
  const body = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1E5FA8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Fresh Start</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">שלום ${userName || ""},</p>
        <p style="color: #374151;">חתימת האימייל שלך מצורפת למטה.</p>
        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 20px 0; background: #F9FAFB;">
          ${signatureHtml}
        </div>
        <div style="background: #EAF2FB; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #1E5FA8; font-weight: bold; margin: 0 0 8px 0;">📋 כיצד להוסיף ל-Gmail:</p>
          <p style="color: #374151; font-size: 14px; margin: 4px 0;">הגדרות ← ראה את כל ההגדרות ← חתימה ← הדבק את החתימה</p>
        </div>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Fresh Start</p>
      </div>
    </div>
  `;
  try {
    await sendEmail({ to: userEmail, subject, body });
    trackEvent("email_sent", { type: "signature" });
  } catch (e) {
    console.error("sendEmailSignatureEmail failed:", e);
    throw e; // Re-throw so caller can show failure toast
  }
}

export async function sendWelcomeEmail({ userEmail, userName }) {
  const subject = "ברוך הבא ל-Fresh Start! 🎉";
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://app.fresh-start.co.il";
  const body = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1E5FA8; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Fresh Start 🎉</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; color: #111827; font-weight: bold;">שלום ${userName || ""},  ברוך הבא לפרש סטארט!</p>
        <p style="color: #374151; font-size: 15px;">הפלטפורמה לניהול העסק העצמאי שלך מוכנה.</p>
        <p style="color: #374151;">כעת תוכל לנהל מסמכים, לקוחות, תשלומים וסדר יום — הכול במקום אחד.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}/dashboard" style="background: #1E5FA8; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">כנס לחשבון שלי ←</a>
        </div>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Fresh Start — פלטפורמת ניהול העסק הישראלי</p>
      </div>
    </div>
  `;
  try {
    await sendEmail({ to: userEmail, subject, body });
    trackEvent("email_sent", { type: "welcome" });
  } catch (e) {
    console.error("sendWelcomeEmail failed:", e);
  }
}

export async function sendWaitlistConfirmationEmail({ userEmail, userName }) {
  const subject = "נרשמת לרשימת ההמתנה — Fresh Start 🎉";
  const body = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1E5FA8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Fresh Start</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">שלום ${userName || "משתמש יקר"},</p>
        <p style="color: #374151;">תודה שנרשמת לרשימת ההמתנה למסלולי המנוי של Fresh Start.</p>
        <p style="color: #374151;">נעדכן אותך ברגע שהמסלולים יהיו זמינים.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">צוות Fresh Start</p>
      </div>
    </div>
  `;
  try {
    await sendEmail({ to: userEmail, subject, body });
    trackEvent("email_sent", { type: "waitlist" });
  } catch (e) {
    console.error("sendWaitlistConfirmationEmail failed:", e);
  }
}

export async function sendTestEmail({ toEmail }) {
  const subject = "בדיקת שליחת מייל — Fresh Start";
  const body = `
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
      <p>זהו מייל בדיקה מ-Fresh Start. אם קיבלת אותו, שליחת המיילים פועלת תקין. ✅</p>
      <p style="color: #9CA3AF; font-size: 12px;">Fresh Start</p>
    </div>
  `;
  await sendEmail({ to: toEmail, subject, body });
  trackEvent("email_sent", { type: "test" });
}
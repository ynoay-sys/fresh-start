import { trackEvent } from "../lib/trackEvent";

const SERVICE_ID = "service_czd4kds";
const TEMPLATE_ID = "template_op4y6na";
const PUBLIC_KEY = "2A8X5gj3k4_MNMMvv";

function sendEmail({ toEmail, subject, message }) {
  return window.emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { to_email: toEmail, subject, message },
    PUBLIC_KEY
  );
}

export async function sendPaymentReceiptEmail({ orderId, userEmail, amount, description, userName }) {
  try {
    await sendEmail({
      toEmail: userEmail,
      subject: "קבלה על תשלום — Fresh Start",
      message:
        "שלום " + (userName || "") + ",\n\n" +
        "תשלום על " + description + " בסך ₪" + amount + " התקבל בהצלחה.\n" +
        "מספר עסקה: " + orderId + "\n" +
        "תאריך: " + new Date().toLocaleDateString("he-IL"),
    });
    trackEvent("email_sent", { type: "receipt" });
  } catch (e) {
    console.error("sendPaymentReceiptEmail failed:", e);
  }
}

export async function sendEmailSignatureEmail({ userEmail, userName, fullName, role, businessName, phone, email }) {
  const params = {
    to_email: userEmail,
    subject: "חתימת האימייל שלך מ-Fresh Start",
    user_name: userName || "משתמש יקר",
    full_name: fullName || "—",
    role: role || "—",
    business_name: businessName || "—",
    phone: phone || "—",
    email: email || userEmail || "—",
  };
  console.log('[EMAIL SERVICE] emailjs.send params:', params);
  try {
    await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    trackEvent("email_sent", { type: "signature" });
  } catch (e) {
    console.error("sendEmailSignatureEmail failed:", e);
    throw e;
  }
}

export async function sendWelcomeEmail({ userEmail, userName }) {
  try {
    await sendEmail({
      toEmail: userEmail,
      subject: "ברוכים הבאים ל-Fresh Start! 🎉",
      message:
        "שלום " + (userName || "") + ",\n\n" +
        "ברוכים הבאים ל-Fresh Start!\n" +
        "הפלטפורמה לניהול העסק העצמאי שלך מוכנה.\n\n" +
        "צוות Fresh Start",
    });
    trackEvent("email_sent", { type: "welcome" });
  } catch (e) {
    console.error("sendWelcomeEmail failed:", e);
  }
}

export async function sendWaitlistConfirmationEmail({ userEmail }) {
  try {
    await sendEmail({
      toEmail: userEmail,
      subject: "נרשמת לרשימת ההמתנה — Fresh Start",
      message:
        "שלום,\n\n" +
        "תודה שנרשמת לרשימת ההמתנה למסלולי המנוי.\n" +
        "נעדכן אותך ברגע שהמסלולים יהיו זמינים.\n\n" +
        "צוות Fresh Start",
    });
    trackEvent("email_sent", { type: "waitlist" });
  } catch (e) {
    console.error("sendWaitlistConfirmationEmail failed:", e);
  }
}

export async function sendTestEmail({ toEmail }) {
  try {
    await sendEmail({
      toEmail,
      subject: "בדיקת שליחת מייל — Fresh Start",
      message: "זהו מייל בדיקה מ-Fresh Start. הכל עובד תקין.",
    });
    trackEvent("email_sent", { type: "test" });
  } catch (e) {
    console.error("sendTestEmail failed:", e);
    throw e;
  }
}
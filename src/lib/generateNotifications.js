import { base44 } from "@/api/base44Client";

// Holidays are now loaded from the IsraeliHoliday entity

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function daysDiff(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}

function nextBirthday(dobStr) {
  const dob = new Date(dobStr);
  const now = new Date(); now.setHours(0,0,0,0);
  const year = now.getFullYear();
  let candidate = new Date(year, dob.getMonth(), dob.getDate());
  if (candidate < now) candidate = new Date(year + 1, dob.getMonth(), dob.getDate());
  return candidate;
}

async function notifExists(existingNotifs, title, type) {
  return existingNotifs.some(n => n.title === title && n.type === type);
}

export async function generateNotifications() {
  const todayStr = new Date().toISOString().split("T")[0];
  if (localStorage.getItem("lastNotifCheck") === todayStr) return;

  const user = await base44.auth.me();
  const existingNotifs = await base44.entities.Notification.filter({ created_by: user.email });
  const toCreate = [];

  // 1. Family birthdays from UserProfile
  const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
  const profile = profiles[0];
  if (profile?.family_data?.length) {
    for (const member of profile.family_data) {
      if (!member.dob || !member.name) continue;
      const bday = nextBirthday(member.dob);
      const diff = Math.round((bday - new Date().setHours(0,0,0,0)) / 86400000);
      if (diff >= 0 && diff <= 7) {
        const title = `יום הולדת מתקרב 🎂`;
        const body = `${member.name} חוגג/ת יום הולדת ב-${formatDate(bday.toISOString())}`;
        if (!await notifExists(existingNotifs, title + " - " + member.name, "birthday")) {
          toCreate.push({ tier:"personal", type:"birthday", title: `יום הולדת מתקרב 🎂 — ${member.name}`, body, action_url:"/profile", scheduled_for: bday.toISOString(), is_read: false });
        }
      }
    }
  }

  // 2. Israeli holidays within 14 days
  const dbHolidays = await base44.entities.IsraeliHoliday.filter({ is_active: true });
  for (const holiday of dbHolidays) {
    const diff = daysDiff(holiday.date);
    if (diff >= 0 && diff <= 14) {
      const holidayName = holiday.name_he || holiday.name;
      const title = `חג מתקרב: ${holidayName} 🎉`;
      if (!await notifExists(existingNotifs, title, "holiday")) {
        toCreate.push({ tier:"national", type:"holiday", title, body:`החג ${holidayName} מתקרב ב-${formatDate(holiday.date)}. כדאי להתכונן מראש.`, scheduled_for: new Date(holiday.date).toISOString(), is_read: false });
      }
    }
  }

  // 3. Milestone deadlines within 7 days
  const milestones = await base44.entities.Milestone.filter({ created_by: user.email, status: "active" });
  for (const m of milestones) {
    if (!m.due_date) continue;
    const diff = daysDiff(m.due_date);
    if (diff >= 0 && diff <= 7) {
      const title = `אבן דרך מתקרבת ⏰`;
      const body = `${m.title} — יעד: ${formatDate(m.due_date)}`;
      if (!existingNotifs.some(n => n.type === "milestone_due" && n.body === body)) {
        toCreate.push({ tier:"system", type:"milestone_due", title, body, action_url:"/vision", scheduled_for: new Date(m.due_date).toISOString(), is_read: false });
      }
    }
  }

  // 4. Delivery delays
  const orders = await base44.entities.Order.filter({ created_by: user.email });
  const today = new Date(); today.setHours(0,0,0,0);
  for (const order of orders) {
    if (!["in_transit","pending"].includes(order.status)) continue;
    if (!order.expected_date) continue;
    const exp = new Date(order.expected_date); exp.setHours(0,0,0,0);
    if (exp < today) {
      const title = `משלוח מאוחר 📦`;
      const body = `ההזמנה ${order.order_number || ""} מ-${order.carrier || ""} צפויה להגיע ${formatDate(order.expected_date)} — עדיין לא הגיעה.`;
      if (!existingNotifs.some(n => n.type === "delivery_delay" && n.body === body)) {
        toCreate.push({ tier:"system", type:"delivery_delay", title, body, action_url:"/orders", is_read: false });
      }
    }
  }

  // 5. Business step reminders
  const userCreatedDate = new Date(user.created_date || Date.now());
  const daysSinceRegistration = Math.round((Date.now() - userCreatedDate) / 86400000);
  if (daysSinceRegistration >= 3) {
    const notStartedSteps = await base44.entities.BusinessOpeningStep.filter({ created_by: user.email, status: "not_started" });
    if (notStartedSteps.length > 0) {
      const title = `שלבי פתיחת עסק ממתינים 📋`;
      if (!await notifExists(existingNotifs, title, "deadline")) {
        toCreate.push({ tier:"system", type:"deadline", title, body:`יש לך ${notStartedSteps.length} שלבים שעדיין לא הושלמו בתהליך פתיחת העסק.`, action_url:"/business-opening", is_read: false });
      }
    }
  }

  // Bulk create
  for (const n of toCreate) {
    await base44.entities.Notification.create(n);
  }

  localStorage.setItem("lastNotifCheck", todayStr);
}
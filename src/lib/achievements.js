import { base44 } from "@/api/base44Client";

export const ACHIEVEMENT_DEFS = [
  {
    key: "first_step_done",
    title: "הצעד הראשון",
    description: "השלמת את השלב הראשון בפתיחת העסק",
    icon: "🚀",
  },
  {
    key: "profile_complete",
    title: "הפרופיל שלי מוכן",
    description: "מילאת את כל הפרטים החשובים בפרופיל",
    icon: "👤",
  },
  {
    key: "first_document",
    title: "המסמך הראשון",
    description: "העלאת את המסמך הראשון שלך",
    icon: "📁",
  },
  {
    key: "first_signature",
    title: "החתימה הראשונה",
    description: "חתמת על המסמך הראשון שלך דיגיטלית",
    icon: "✍️",
  },
  {
    key: "first_client",
    title: "הלקוח הראשון",
    description: "הוספת את הלקוח הראשון שלך למערכת",
    icon: "🤝",
  },
  {
    key: "all_steps_done",
    title: "עסק רשום!",
    description: "השלמת את כל שלבי פתיחת העסק",
    icon: "🏢",
  },
  {
    key: "vision_set",
    title: "החזון שלי",
    description: "הגדרת את החזון שלך לעסק",
    icon: "🌟",
  },
  {
    key: "first_goal_done",
    title: "מטרה הושגה!",
    description: "השלמת את המטרה הראשונה שלך",
    icon: "🏆",
  },
  {
    key: "page_published",
    title: "דף הנחיתה שלי באוויר!",
    description: "פרסמת את דף הנחיתה שלך",
    icon: "🌐",
  },
];

let toastQueue = [];
let toastCallback = null;

export function registerAchievementToastHandler(cb) {
  toastCallback = cb;
}

function enqueueToast(achievement) {
  toastQueue.push(achievement);
  if (toastQueue.length === 1 && toastCallback) {
    toastCallback(toastQueue[0]);
  }
}

export function nextToast() {
  toastQueue.shift();
  if (toastQueue.length > 0 && toastCallback) {
    toastCallback(toastQueue[0]);
  } else if (toastCallback) {
    toastCallback(null);
  }
}

export async function checkAndUnlockAchievements() {
  const user = await base44.auth.me();

  const [
    existingAchievements,
    bizSteps,
    documents,
    signedDocs,
    clients,
    milestones,
    profiles,
  ] = await Promise.all([
    base44.entities.Achievement.filter({ created_by: user.email }),
    base44.entities.BusinessOpeningStep.filter({ created_by: user.email }),
    base44.entities.Document.filter({ created_by: user.email, status: "active" }),
    base44.entities.Document.filter({ created_by: user.email, is_signed: true }),
    base44.entities.Client.filter({ created_by: user.email }),
    base44.entities.Milestone.filter({ created_by: user.email }),
    base44.entities.UserProfile.filter({ created_by: user.email }),
  ]);

  const unlockedKeys = new Set(existingAchievements.map(a => a.achievement_key));

  const profile = profiles[0] || null;
  const completedSteps = bizSteps.filter(s => s.status === "completed");
  const visionMilestone = milestones.find(m => m.type === "vision");
  const completedGoals = milestones.filter(m => m.type === "goal" && m.status === "completed");

  const triggers = {
    first_step_done: completedSteps.length >= 1,
    profile_complete: profile &&
      profile.first_name && profile.last_name && profile.phone_il &&
      profile.business_name && profile.city,
    first_document: documents.length >= 1,
    first_signature: signedDocs.length >= 1,
    first_client: clients.length >= 1,
    all_steps_done: completedSteps.length === 4 && bizSteps.length >= 4,
    vision_set: !!visionMilestone,
    first_goal_done: completedGoals.length >= 1,
  };

  const newlyUnlocked = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (!unlockedKeys.has(def.key) && triggers[def.key]) {
      await base44.entities.Achievement.create({
        achievement_key: def.key,
        title_he: def.title,
        description_he: def.description,
        icon: def.icon,
        unlocked_at: new Date().toISOString(),
      });
      newlyUnlocked.push(def);
    }
  }

  for (const a of newlyUnlocked) {
    enqueueToast(a);
  }

  return newlyUnlocked;
}
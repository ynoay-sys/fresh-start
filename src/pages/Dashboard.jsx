import { useState, useEffect } from "react";
import { formatDistanceToNow, isToday, isYesterday, format, isAfter } from "date-fns";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BusinessProgressMap from "../components/BusinessProgressMap";
import OnboardingChecklist from "../components/OnboardingChecklist.jsx";
import LaunchCelebration from "../components/LaunchCelebration";
import { ACHIEVEMENT_DEFS } from "../lib/achievements";
import WelcomeModal from "../components/WelcomeModal";
import { trackEvent } from "../lib/trackEvent";
import BusinessTypeCards from "../components/BusinessTypeCards";
import PartnerDashboardWidgets from "../components/partner/PartnerDashboardWidgets";


function StatCard({ emoji, label, value, sub, onClick }) {
  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center cursor-pointer hover:shadow-md hover:border-gray-200 transition-all">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-4xl font-bold mb-1" style={{ color: "#1E5FA8" }}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mb-0.5">{sub}</p>}
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("welcomeShown"));
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [docCount, setDocCount] = useState(null);
  const [contactCount, setContactCount] = useState(null);
  const [clientCount, setClientCount] = useState(null);
  const [stepsCompleted, setStepsCompleted] = useState(null);
  const [steps, setSteps] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [tasksByGoal, setTasksByGoal] = useState({});
  const [urgentTemplates, setUrgentTemplates] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [landingPage, setLandingPage] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [isPartner, setIsPartner] = useState(false);
  const [aiUsage, setAiUsage] = useState(0);
  const [templateUsage, setTemplateUsage] = useState(0);
  const [monthPayments, setMonthPayments] = useState(0);
  const [emailSigCount, setEmailSigCount] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [onboardingChecks, setOnboardingChecks] = useState(null);

  useEffect(() => { trackEvent('page_view', { module: '/dashboard' }); document.title = 'לוח בקרה | Fresh Start'; }, []);

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();

      // Step 1 — critical user data
      const docs = await base44.entities.Document.filter({ created_by: user.email, status: "active" });
      setDocCount(docs.length);
      await new Promise(r => setTimeout(r, 250));

      const clients = await base44.entities.Client.filter({ created_by: user.email });
      setClientCount(clients.length);
      await new Promise(r => setTimeout(r, 250));

      const allSteps = await base44.entities.BusinessOpeningStep.filter({ created_by: user.email });
      const completedSteps = allSteps.filter(s => s.status === "completed");
      setStepsCompleted(completedSteps.length);
      setSteps(allSteps);
      await new Promise(r => setTimeout(r, 250));

      // Step 2 — contacts + milestones + profile
      const contacts = await base44.entities.Contact.filter({ created_by: user.email });
      setContactCount(contacts.length);
      await new Promise(r => setTimeout(r, 250));

      const milestonesRes = await base44.entities.Milestone.filter({ created_by: user.email });
      const active = milestonesRes.filter(m => m.type === "goal" && m.status === "active").slice(0, 3);
      setActiveGoals(active);
      const allTasks = milestonesRes.filter(m => m.type === "task");
      const byGoal = {};
      for (const g of active) { byGoal[g.id] = allTasks.filter(t => t.parent_id === g.id); }
      setTasksByGoal(byGoal);
      await new Promise(r => setTimeout(r, 250));

      const profileArr = await base44.entities.UserProfile.filter({ created_by: user.email });
      if (profileArr[0]?.role === "partner") setIsPartner(true);
      const profileRec = profileArr[0];
      const visionsForChecklist = milestonesRes.filter(m => m.type === "vision");
      setOnboardingChecks({
        profile: !!(profileRec?.first_name),
        document: docs.length > 0,
        client: clients.length > 0,
        vision: visionsForChecklist.length > 0,
        business: completedSteps.length > 0,
      });

      if (profileRec) {
        const fields = ['first_name','last_name','phone_il','business_name','vat_number','address'];
        const filled = fields.filter(f => !!profileRec[f]).length;
        const pct = Math.round((filled / fields.length) * 100);
        const dismissed = localStorage.getItem('profileBannerDismissed');
        const daysSinceReg = user.created_date ? (Date.now() - new Date(user.created_date).getTime()) / 86400000 : 0;
        if (pct < 50 && daysSinceReg > 1 && !dismissed) setShowProfileBanner(true);
      }
      await new Promise(r => setTimeout(r, 250));

      // Step 3 — events + notifications
      const eventsRes = await base44.entities.ScheduleEvent.filter({ created_by: user.email });
      const now = new Date();
      const upcoming = eventsRes
        .filter(e => isAfter(new Date(e.start_time), now))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
      await new Promise(r => setTimeout(r, 250));

      const notifsRes = await base44.entities.Notification.filter({ created_by: user.email });
      const unread = notifsRes.filter(n => !n.is_read)
        .sort((a,b) => new Date(b.scheduled_for || b.created_date) - new Date(a.scheduled_for || a.created_date))
        .slice(0, 3);
      setRecentNotifs(unread);
      await new Promise(r => setTimeout(r, 250));

      // Step 4 — templates
      const allTemplates = await base44.entities.DocumentTemplate.filter({ urgency: "high", is_active: true });
      await new Promise(r => setTimeout(r, 250));
      const completions = await base44.entities.UserTemplateCompletion.filter({ created_by: user.email });
      const completedKeys = completions.map(c => c.template_key);
      setUrgentTemplates(allTemplates.filter(t => !completedKeys.includes(t.key)).slice(0, 3));
      await new Promise(r => setTimeout(r, 250));

      // Step 5 — orders + achievements + usage
      const ordersRes = await base44.entities.Order.filter({ created_by: user.email }, "-created_date");
      const activeOrdersList = ordersRes.filter(o => o.status === "in_transit" || o.status === "delayed").slice(0, 3);
      setActiveOrders(activeOrdersList);
      await new Promise(r => setTimeout(r, 250));

      const achievementsRes = await base44.entities.Achievement.filter({ created_by: user.email });
      setAchievements(achievementsRes);
      await new Promise(r => setTimeout(r, 250));

      const usageRecords = await base44.entities.UserFeatureUsage.filter({ created_by: user.email });
      const aiRec = usageRecords.find(r => r.feature_key === "ai_query");
      const tmplRec = usageRecords.find(r => r.feature_key === "template_download");
      setAiUsage(aiRec?.usage_count || 0);
      setTemplateUsage(tmplRec?.usage_count || 0);
      await new Promise(r => setTimeout(r, 250));

      // Step 6 — landing page + email sig + payments
      const landingPages = await base44.entities.LandingPage.filter({ created_by: user.email });
      setLandingPage(landingPages[0] || null);
      await new Promise(r => setTimeout(r, 250));

      const emailSigs = await base44.entities.EmailSignature.filter({ created_by: user.email });
      setEmailSigCount(emailSigs.length);
      await new Promise(r => setTimeout(r, 250));

      const payments = await base44.entities.Payment.filter({ created_by: user.email });
      const nowDate = new Date();
      const thisMonth = payments.filter(p => {
        const d = new Date(p.created_date);
        return d.getMonth() === nowDate.getMonth() && d.getFullYear() === nowDate.getFullYear() && p.status === "completed";
      });
      setMonthPayments(thisMonth.reduce((s, p) => s + (p.amount_ils || 0), 0));

      // Launch celebration check
      if (!localStorage.getItem('launchCelebrated')) {
        const visionsRes = milestonesRes.filter(m => m.type === 'vision');
        const allOnboardingDone = !!(profileRec?.first_name) &&
          docs.length > 0 && clients.length > 0 &&
          visionsRes.length > 0 &&
          completedSteps.length >= 4;
        if (allOnboardingDone) setShowCelebration(true);
      }
    }
    const t = setTimeout(() => load(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto" dir="rtl">
      {showCelebration && <LaunchCelebration onDismiss={() => setShowCelebration(false)} />}
      {showWelcome && <WelcomeModal onComplete={() => setShowWelcome(false)} />}

      {showProfileBanner && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-yellow-800">הפרופיל שלך לא מלא — השלמת הפרופיל משפרת את הדיוק של הטפסים האוטומטיים</p>
          <div className="flex items-center gap-2 flex-shrink-0 mr-3">
            <button onClick={() => navigate('/profile')} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#C25A00' }}>השלם פרופיל ←</button>
            <button onClick={() => { setShowProfileBanner(false); localStorage.setItem('profileBannerDismissed','1'); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{(() => { const h = new Date().getHours(); const g = h >= 6 && h < 12 ? 'בוקר טוב' : h >= 12 && h < 17 ? 'צהריים טובים' : h >= 17 && h < 21 ? 'ערב טוב' : 'לילה טוב'; return `${g} 👋`; })()}</h1>
      <p className="text-sm text-gray-500 mb-8">{isPartner ? "לוח הבקרה המקצועי שלי — Fresh Start" : "ברוך הבא ל-Fresh Start — הפלטפורמה לעצמאים בישראל"}</p>

      {/* Partner widgets — shown above all else for partners */}
      {isPartner && <PartnerDashboardWidgets />}

      {/* Business Type Flip Cards */}
      <BusinessTypeCards />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard emoji="📁" label="מסמכים" value={docCount} onClick={() => navigate("/documents")} />
        <StatCard emoji="🤝" label="לקוחות" value={clientCount} onClick={() => navigate("/clients")} />
        <StatCard emoji="👥" label="אנשי קשר" value={contactCount} onClick={() => navigate("/contacts")} />

        <StatCard emoji="✅" label="שלבי פתיחה" value={stepsCompleted != null ? `${stepsCompleted}/4` : "—"} onClick={() => navigate("/business-opening")} />
        <StatCard emoji="📈" label="התקדמות" value="←" onClick={() => navigate("/progress")} />
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist checks={onboardingChecks} />

      {/* Contacts marketplace link */}
      <div className="flex justify-end mb-2 -mt-6">
        <button onClick={() => navigate("/contacts/marketplace")}
          className="text-xs font-medium"
          style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
          מצא אנשי מקצוע ←
        </button>
      </div>

      {/* Business Opening Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">מסע פתיחת העסק</h2>
        </div>
        <BusinessProgressMap steps={steps} mini={true} />
      </div>

      {/* Upcoming Events Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">אירועים קרובים</h2>
          <button onClick={() => navigate("/schedule")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>
            כל האירועים ←
          </button>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">אין אירועים קרובים. הוסף את האירוע הראשון שלך.</p>
            <button onClick={() => navigate("/schedule")}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              + הוסף אירוע
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingEvents.map(ev => {
              const CAT_COLORS = { client:"#1E5FA8", delivery:"#C25A00", order:"#C25A00", milestone:"#5C1A8A", government:"#AA1111", personal:"#555555" };
              const CAT_LABELS = { client:"לקוח", delivery:"משלוח", order:"הזמנה", milestone:"אבן דרך", government:"ממשלתי", personal:"אישי" };
              const SOURCE_LABELS = { client:"לקוח", order:"הזמנה", milestone:"אבן דרך", manual:"ידני" };
              const color = CAT_COLORS[ev.category] || "#555";
              return (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate block">{ev.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 text-left flex-shrink-0">
                    {format(new Date(ev.start_time), "dd/MM")}{!ev.all_day ? ` | ${format(new Date(ev.start_time), "HH:mm")}` : ""}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: color }}>
                    {SOURCE_LABELS[ev.source_type] || "ידני"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Notifications Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">התראות אחרונות</h2>
          <button onClick={() => navigate("/notifications")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל ההתראות ←</button>
        </div>
        {recentNotifs.length === 0 ? (
          <p className="text-sm text-center text-green-600 py-3">אין התראות חדשות ✓</p>
        ) : (
          <div className="space-y-2">
            {recentNotifs.map(n => {
              const TIER_ICONS = { personal:"👤", national:"🇮🇱", system:"⚙️" };
              const d = n.scheduled_for || n.created_date;
              let timeLabel = d ? format(new Date(d), "dd/MM") : "";
              return (
                <div key={n.id} className="flex items-center gap-2.5" onClick={() => navigate("/notifications")} style={{cursor:"pointer"}}>
                  <span className="text-base">{TIER_ICONS[n.tier] || "🔔"}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{n.title}</span>
                  <span className="text-xs text-gray-400">{timeLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Urgent Templates Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">טפסים דחופים ⚠️</h2>
          <button onClick={() => navigate("/documents/templates")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל הטפסים ←</button>
        </div>
        {urgentTemplates.length === 0 ? (
          <p className="text-sm text-center text-green-600 py-3">כל הטפסים הדחופים הושלמו ✓</p>
        ) : (
          <div className="space-y-3">
            {urgentTemplates.map(t => {
              const COLORS = { tax_authority: "#1E5FA8", vat: "#5C1A8A", nii: "#1A7A4A", municipality: "#C25A00", other: "#555" };
              return (
                <div key={t.key} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[t.authority] || "#555" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title_he}</p>
                    {t.deadline_note && <p className="text-xs text-orange-500 truncate">{t.deadline_note}</p>}
                  </div>
                  <a href={t.external_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex-shrink-0">
                    צפה ←
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">ההישגים שלי 🏆</h2>
          <button onClick={() => navigate("/progress")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל ההישגים ←</button>
        </div>
        <p className="text-xs text-gray-500 mb-2">{achievements.length} מתוך {ACHIEVEMENT_DEFS.length} הישגים פוּתחו</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full" style={{ width: `${Math.round((achievements.length / ACHIEVEMENT_DEFS.length) * 100)}%`, background: "linear-gradient(90deg, #1E5FA8, #5C1A8A)" }} />
        </div>
        {achievements.length === 0 ? (
          <p className="text-xs text-gray-400">השלם פעולות כדי לפתוח הישגים!</p>
        ) : (
          <div className="space-y-2">
            {[...achievements].sort((a,b) => new Date(b.unlocked_at) - new Date(a.unlocked_at)).slice(0, 2).map(a => (
              <div key={a.achievement_key} className="flex items-center gap-2.5">
                <span className="text-xl">{a.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{a.title_he}</span>
                <span className="text-xs text-gray-400">{a.unlocked_at ? format(new Date(a.unlocked_at), "dd/MM") : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Landing Page Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">דף הנחיתה שלי 🌐</h2>
          <button onClick={() => navigate("/landing-page")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>עבור לעורך ←</button>
        </div>
        {!landingPage ? (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500 mb-3">צור את דף הנחיתה שלך והצג את העסק ללקוחות</p>
            <button onClick={() => navigate("/landing-page")}
              className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              ✨ צור דף נחיתה
            </button>
          </div>
        ) : landingPage.is_published ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-700">הדף שלך פעיל ✓</p>
              <p className="text-xs text-gray-400">freshstart.app/{landingPage.subdomain}</p>
            </div>
            <button onClick={() => navigate("/landing-page")}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">ערוך ←</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">דף הנחיתה שלך מוכן לפרסום</p>
              <p className="text-xs text-gray-400">טיוטה — לא פורסם עדיין</p>
            </div>
            <button onClick={() => navigate("/landing-page")}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: "#1E5FA8" }}>פרסם עכשיו ←</button>
          </div>
        )}
      </div>

      {/* Usage Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">שימוש השוטף 💳</h2>
          <button onClick={() => navigate("/billing")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>היסטוריית תשלומים ←</button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>עוזר AI: {aiUsage}/20 שאלות חינמיות</span>
              <span>{aiUsage >= 20 ? "מוצה" : `נותרו ${20 - aiUsage}`}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (aiUsage / 20) * 100)}%`, backgroundColor: aiUsage >= 20 ? "#EF4444" : aiUsage >= 15 ? "#F59E0B" : "#1A7A4A" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>טפסים: {templateUsage}/3 הורדות חינמיות</span>
              <span>{templateUsage >= 3 ? "מוצה" : `נותרו ${3 - templateUsage}`}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (templateUsage / 3) * 100)}%`, backgroundColor: templateUsage >= 3 ? "#EF4444" : templateUsage >= 2 ? "#F59E0B" : "#1A7A4A" }} />
            </div>
          </div>
          <p className="text-xs text-gray-500 pt-1">הוצאות החודש: <span className="font-bold text-gray-800">₪{monthPayments}</span></p>
        </div>
      </div>

      {/* Orders Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">הזמנות פעילות 📦</h2>
          <button onClick={() => navigate("/orders")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל ההזמנות ←</button>
        </div>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-center text-green-600 py-3">אין משלוחים פעילים כרגע ✓</p>
        ) : (
          <div className="space-y-2.5">
            {activeOrders.filter(o => o.status === "delayed").length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-red-700 text-xs font-medium mb-1">
                ⚠️ {activeOrders.filter(o => o.status === "delayed").length} הזמנות מאוחרות
              </div>
            )}
            {activeOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.status === "delayed" ? "#AA1111" : "#1E5FA8" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate block">{o.carrier} — {o.contents}</span>
                </div>
                {o.expected_date && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{format(new Date(o.expected_date), "dd/MM")}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">המטרות שלי 🎯</h2>
          <button onClick={() => navigate("/vision")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>כל המטרות ←</button>
        </div>
        {activeGoals.length === 0 ? (
          <button onClick={() => navigate("/vision")} className="text-sm font-medium" style={{ color: "#1E5FA8" }}>הגדר את המטרה הראשונה שלך ←</button>
        ) : (
          <div className="space-y-3">
            {activeGoals.map(g => {
              const tasks = tasksByGoal[g.id] || [];
              const done = tasks.filter(t => t.status === "completed").length;
              const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">{g.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 mr-2">{done}/{tasks.length}</span>
                    {g.due_date && <span className="text-[10px] text-gray-400">{format(new Date(g.due_date), "dd/MM")}</span>}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#1E5FA8" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Signature Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">✉️ חתימת אימייל</h2>
          <button onClick={() => navigate("/documents/email-signature")} className="text-xs font-medium" style={{ color: "#1E5FA8" }}>
            {emailSigCount > 0 ? "ערוך ←" : "יצירת חתימה ←"}
          </button>
        </div>
        {emailSigCount === 0 || emailSigCount === null ? (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500 mb-3">צור חתימה מקצועית לאימייל שלך</p>
            <button onClick={() => navigate("/documents/email-signature")}
              className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: "#1E5FA8" }}>
              יצירת חתימה ←
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-700">יש לך <strong>{emailSigCount}</strong> חתימות שמורות ✓</p>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">פעולות מהירות</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: "📄", label: "העלאת מסמך", path: "/documents/upload" },
          { emoji: "👥", label: "הוספת לקוח", path: "/clients" },
          { emoji: "🎯", label: "הגדרת מטרה", path: "/vision" },
        ].map(({ emoji, label, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-200 transition-all text-center">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
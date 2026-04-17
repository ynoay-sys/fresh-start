import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, FolderOpen, Users, Package, CalendarDays,
  Bell, Target, Globe, Contact2, Trophy, Settings,
  ChevronDown, ChevronLeft, LogOut, User, Menu, X, MoreHorizontal
} from "lucide-react";
import NotificationBellPanel from "./NotificationBellPanel";
import AchievementToast from "./AchievementToast";
import { checkAndUnlockAchievements } from "../lib/achievements";
import { generateNotifications } from "../lib/generateNotifications";
import { isAdmin } from "../lib/userRole";

const MOBILE_NAV = [
  { icon: Building2, label: "פתיחת עסק", path: "/business-opening" },
  { icon: FolderOpen, label: "מסמכים", path: "/documents" },
  { icon: CalendarDays, label: "לוח זמנים", path: "/schedule" },
  { icon: Bell, label: "התראות", path: "/notifications" },
  { icon: MoreHorizontal, label: "עוד", path: "/profile" },
];



function NavItem({ icon: Icon, label, path, isActive, badge, onClick, children, isOpen, onToggle }) {
  const hasChildren = !!children;
  return (
    <div>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors cursor-pointer
          ${isActive && !hasChildren ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
        style={isActive && !hasChildren ? { backgroundColor: "#1E5FA8" } : {}}
        onClick={hasChildren ? onToggle : onClick}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive && !hasChildren ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"}`}>
            {badge}
          </span>
        )}
        {hasChildren && (
          isOpen
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="mr-6 mb-1 border-r border-gray-200 pr-2 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ label, path, isActive, onClick }) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`block px-3 py-2 rounded-md text-sm transition-colors
        ${isActive ? "font-semibold" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
      style={isActive ? { color: "#1E5FA8" } : {}}
    >
      {label}
    </Link>
  );
}

export default function Layout() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [todayEventCount, setTodayEventCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [allNotifs, setAllNotifs] = useState([]);
  const [activeGoalCount, setActiveGoalCount] = useState(0);
  const [urgentTemplatesCount, setUrgentTemplatesCount] = useState(0);
  const [landingPagePublished, setLandingPagePublished] = useState(false);
  const [orderBadge, setOrderBadge] = useState(null);
  const [orderBadgeColor, setOrderBadgeColor] = useState("#1E5FA8");
  const [docsExpanded, setDocsExpanded] = useState(
    location.pathname.startsWith("/documents")
  );
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    generateNotifications().catch(() => {});
    checkAndUnlockAchievements().catch(() => {});
    isAdmin().then(setUserIsAdmin);
  }, []);

  // Session timeout
  useEffect(() => {
    let warnTimeout;
    let logoutTimeout;
    const resetAll = () => {
      clearTimeout(warnTimeout);
      clearTimeout(logoutTimeout);
      warnTimeout = setTimeout(() => {
        const stay = window.confirm('הפעלתך עומדת לפוג עקב חוסר פעילות.\n\nלחץ אישור כדי להישאר מחובר.');
        if (!stay) { window.location.href = '/login'; return; }
        resetAll();
      }, 25 * 60 * 1000);
      logoutTimeout = setTimeout(() => {
        window.alert('הפעלתך פגה. אנא התחבר מחדש.');
        window.location.href = '/login';
      }, 30 * 60 * 1000);
    };
    resetAll();
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetAll, { passive: true }));
    return () => {
      clearTimeout(warnTimeout);
      clearTimeout(logoutTimeout);
      events.forEach(e => window.removeEventListener(e, resetAll));
    };
  }, []);

  // Real-time sync for business opening badge
  useEffect(() => {
    const unsubscribe = base44.entities.BusinessOpeningStep.subscribe(async () => {
      const u = await base44.auth.me();
      const completed = await base44.entities.BusinessOpeningStep.filter({ created_by: u.email, status: "completed" });
      setStepsCompleted(completed.length);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadSidebarData() {
      const u = await base44.auth.me();
      setUser(u);
      // Batch 1
      const [notifs, docs, contacts, clients, steps, goals] = await Promise.all([
        base44.entities.Notification.filter({ created_by: u.email }),
        base44.entities.Document.filter({ created_by: u.email, status: "active" }),
        base44.entities.Contact.filter({ created_by: u.email }),
        base44.entities.Client.filter({ created_by: u.email }),
        base44.entities.BusinessOpeningStep.filter({ created_by: u.email, status: "completed" }),
        base44.entities.Milestone.filter({ created_by: u.email, type: "goal", status: "active" }),
      ]);
      // Batch 2
      const [templates, completions, landingPages, orders, events] = await Promise.all([
        base44.entities.DocumentTemplate.filter({ urgency: "high", is_active: true }),
        base44.entities.UserTemplateCompletion.filter({ created_by: u.email }),
        base44.entities.LandingPage.filter({ created_by: u.email }),
        base44.entities.Order.filter({ created_by: u.email }),
        base44.entities.ScheduleEvent.filter({ created_by: u.email }),
      ]);
      setAllNotifs(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
      setDocCount(docs.length);
      setContactCount(contacts.length);
      setClientCount(clients.length);
      setStepsCompleted(steps.length);
      setActiveGoalCount(goals.length);
      const completedKeys = completions.map(c => c.template_key);
      setUrgentTemplatesCount(templates.filter(t => !completedKeys.includes(t.key)).length);
      setLandingPagePublished(landingPages[0]?.is_published || false);
      const delayed = orders.filter(o => o.status === "delayed" || (o.status === "in_transit" && o.expected_date && new Date(o.expected_date) < new Date())).length;
      const inTransit = orders.filter(o => o.status === "in_transit").length;
      if (delayed > 0) { setOrderBadge(delayed); setOrderBadgeColor("#AA1111"); }
      else if (inTransit > 0) { setOrderBadge(inTransit); setOrderBadgeColor("#1E5FA8"); }
      const todayStr = new Date().toDateString();
      setTodayEventCount(events.filter(e => new Date(e.start_time).toDateString() === todayStr).length);
    }
    // Stagger to avoid rate-limiting when Dashboard also loads on mount
    const t = setTimeout(() => loadSidebarData().catch(() => {}), 300);
    return () => clearTimeout(t);
  }, []);

  // Auto-expand docs menu when on a docs route
  useEffect(() => {
    if (location.pathname.startsWith("/documents")) setDocsExpanded(true);
  }, [location.pathname]);

  const unreadNotifCount = allNotifs.filter(n => !n.is_read).length;

  const DOC_SUB = [
    { label: "ארכיון", path: "/documents" },
    { label: "העלאה", path: "/documents/upload" },
    { label: "חתימת אימייל", path: "/documents/email-signature" },
    { label: `טפסים${urgentTemplatesCount > 0 ? ` (${urgentTemplatesCount})` : ""}`, path: "/documents/templates" },
    { label: "חתימה", path: "/documents/sign/create" },
  ];

  async function handleNotifClick(notif) {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      setAllNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.action_url) window.location.href = notif.action_url;
  }

  async function handleMarkAllRead() {
    const unread = allNotifs.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setAllNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).slice(0, 2).join("")
    : user?.email?.[0]?.toUpperCase() || "?";

  const closeSidebar = () => setSidebarOpen(false);
  const isActive = (path) => location.pathname === path;
  const isDocsActive = location.pathname.startsWith("/documents");

  const NAV_TOP = [
    { icon: Users, label: "לקוחות", path: "/clients", badge: clientCount },
    { icon: Package, label: "הזמנות", path: "/orders", badge: orderBadge, badgeColor: orderBadgeColor },
    { icon: CalendarDays, label: "לוח זמנים", path: "/schedule", badge: todayEventCount },
    { icon: Bell, label: "התראות", path: "/notifications", badge: unreadNotifCount },
    { icon: Target, label: "חזון ומטרות", path: "/vision", badge: activeGoalCount, badgeColor: "#5C1A8A" },
    { icon: Globe, label: "דף הנחיתה", path: "/landing-page", badge: landingPagePublished ? "פעיל" : null, badgeColor: "#1A7A4A" },
    { icon: Contact2, label: "אנשי קשר", path: "/contacts", badge: contactCount },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-rubik flex flex-col" dir="rtl">
      {/* Top Bar */}
      <header className="fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden hover:bg-gray-100 rounded-lg flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44, WebkitTapHighlightColor: 'transparent', cursor: 'pointer' }}
            onClick={() => setSidebarOpen(v => !v)}
            onTouchEnd={e => { e.preventDefault(); setSidebarOpen(v => !v); }}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1E5FA8" }}>
              <span className="text-white font-bold text-xs">FS</span>
            </div>
            <span className="font-bold text-gray-900 text-base hidden sm:block">Fresh Start</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div style={{ position: 'relative' }}>
            <div
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, cursor: 'pointer', borderRadius: 8 }}
              className="hover:bg-gray-100 transition-colors"
              onClick={() => setBellOpen(v => !v)}
            >
              <Bell className="w-5 h-5 text-gray-600" style={{ pointerEvents: 'none' }} />
              {unreadNotifCount > 0 && (
                <span style={{ position: 'absolute', top: 2, left: 2, pointerEvents: 'none', zIndex: 1, minWidth: 18, height: 18, borderRadius: '50%', backgroundColor: '#EF4444', color: 'white', fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              )}
            </div>
            {bellOpen && (
              <NotificationBellPanel
                notifications={allNotifs}
                onClose={() => setBellOpen(false)}
                onMarkAllRead={handleMarkAllRead}
                onNotifClick={handleNotifClick}
              />
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors gap-1"
              style={{ minWidth: 44, minHeight: 44, padding: '6px 8px' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: "#1E5FA8" }}>
                {initials}
              </div>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute left-0 top-10 w-44 bg-white rounded-lg shadow-lg border border-gray-100 z-40 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" />פרופיל
                  </Link>
                  <button onClick={() => base44.auth.logout("/")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />התנתקות
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={closeSidebar} />}

        {/* Sidebar */}
        <aside className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-60 bg-white border-l border-gray-200 z-30 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0`}>
          <nav className="flex-1 overflow-y-auto py-4 px-2">

            {/* Dashboard */}
            <Link to="/dashboard" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/dashboard") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/dashboard") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">🏠</span><span>ראשי</span>
            </Link>

            {/* Business Opening */}
            <Link to="/business-opening" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/business-opening") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/business-opening") ? { backgroundColor: "#1E5FA8" } : {}}>
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">פתיחת עסק</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                stepsCompleted === 4 ? "bg-green-100 text-green-700" :
                stepsCompleted > 0 ? "bg-orange-100 text-orange-700" :
                "bg-gray-100 text-gray-600"
              } ${isActive("/business-opening") ? "!bg-white/25 !text-white" : ""}`}>
                {stepsCompleted}/4
              </span>
            </Link>

            {/* Documents with sub-menu */}
            <div>
              <div
                onClick={() => setDocsExpanded(v => !v)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors cursor-pointer ${isDocsActive && !docsExpanded ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
                style={isDocsActive && !docsExpanded ? { backgroundColor: "#1E5FA8" } : {}}
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">מסמכים</span>
                {docCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{docCount}</span>
                )}
                {docsExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  : <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />}
              </div>
              {docsExpanded && (
                <div className="mr-6 mb-1 border-r border-gray-200 pr-2 space-y-0.5">
                  {DOC_SUB.map(sub => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={closeSidebar}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive(sub.path) ? "font-semibold" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                      style={isActive(sub.path) ? { color: "#1E5FA8" } : {}}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other Nav Items */}
            {NAV_TOP.map(({ icon: Icon, label, path, badge, badgeColor }) => (
              <Link key={path} to={path} onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive(path) ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
                style={isActive(path) ? { backgroundColor: "#1E5FA8" } : {}}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge != null && badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive(path) ? "bg-white/25 text-white" : "text-white"}`}
                    style={!isActive(path) ? { backgroundColor: badgeColor || "#6B7280" } : {}}>{badge}</span>
                )}
              </Link>
            ))}

            {/* Section 2 — Personal */}
            <hr style={{border:'none', borderTop:'1px solid #E5E7EB', margin:'8px 0'}}/>
            <Link to="/profile" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/profile") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/profile") ? { backgroundColor: "#1E5FA8" } : {}}>
              <User className="w-4 h-4 flex-shrink-0" /><span>פרופיל</span>
            </Link>
            <Link to="/progress" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/progress") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/progress") ? { backgroundColor: "#1E5FA8" } : {}}>
              <Trophy className="w-4 h-4" /><span>ההתקדמות שלי 🏆</span>
            </Link>

            {/* Section 3 — Business */}
            <hr style={{border:'none', borderTop:'1px solid #E5E7EB', margin:'8px 0'}}/>
            <Link to="/pricing" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/pricing") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/pricing") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">💰</span><span>תמחיר</span>
            </Link>
            <Link to="/billing" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/billing") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/billing") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">💳</span><span>תשלומים</span>
            </Link>
            <Link to="/settings" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/settings") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/settings") ? { backgroundColor: "#1E5FA8" } : {}}>
              <Settings className="w-4 h-4" /><span>הגדרות</span>
            </Link>

            {/* Section 4 — Admin (visible to admins only) */}
            {userIsAdmin && (
              <>
                <hr style={{border:'none', borderTop:'1px solid #E5E7EB', margin:'8px 0'}}/>
                <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">ניהול מערכת</p>
                <Link to="/admin/users" onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors text-gray-500 hover:bg-gray-100 ${isActive("/admin/users") ? "!text-white" : ""}`}
                  style={isActive("/admin/users") ? { backgroundColor: "#1E5FA8" } : {}}>
                  <span>👥</span><span>ניהול משתמשים</span>
                </Link>
                <Link to="/admin/content" onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors text-gray-500 hover:bg-gray-100 ${isActive("/admin/content") ? "!text-white" : ""}`}
                  style={isActive("/admin/content") ? { backgroundColor: "#1E5FA8" } : {}}>
                  <span>📝</span><span>ניהול תוכן</span>
                </Link>
                <Link to="/admin/analytics" onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors text-gray-500 hover:bg-gray-100 ${isActive("/admin/analytics") ? "!text-white" : ""}`}
                  style={isActive("/admin/analytics") ? { backgroundColor: "#1E5FA8" } : {}}>
                  <span>📊</span><span>אנליטיקה</span>
                </Link>
                <Link to="/admin/launch-checklist" onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors text-gray-500 hover:bg-gray-100 ${isActive("/admin/launch-checklist") ? "!text-white" : ""}`}
                  style={isActive("/admin/launch-checklist") ? { backgroundColor: "#1E5FA8" } : {}}>
                  <span>🚀</span><span>מוכנות לשחרור</span>
                </Link>
                <Link to="/admin/automation-test" onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors text-gray-500 hover:bg-gray-100 ${isActive("/admin/automation-test") ? "!text-white" : ""}`}
                  style={isActive("/admin/automation-test") ? { backgroundColor: "#1E5FA8" } : {}}>
                  <span>⚙️</span><span>בדיקת אוטומציה</span>
                </Link>
              </>
            )}

            {/* Help, Terms, Privacy, Logout */}
            <hr style={{border:'none', borderTop:'1px solid #E5E7EB', margin:'8px 0'}}/>
            <Link to="/help" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/help") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/help") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">❓</span><span>עזרה</span>
            </Link>
            <Link to="/terms" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/terms") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/terms") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">📋</span><span>תנאי שימוש</span>
            </Link>
            <Link to="/privacy" onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${isActive("/privacy") ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive("/privacy") ? { backgroundColor: "#1E5FA8" } : {}}>
              <span className="w-4 h-4 text-center text-sm leading-none">🔒</span><span>מדיניות פרטיות</span>
            </Link>
            <hr style={{border:'none', borderTop:'1px solid #E5E7EB', margin:'8px 0'}}/>
            <button onClick={() => base44.auth.logout("/")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" /><span>התנתקות</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 md:mr-60 min-h-[calc(100vh-3.5rem)] pb-20 md:pb-0" style={{overflowX:'hidden', maxWidth:'100vw', boxSizing:'border-box'}}>
          <Outlet />
        </main>
      </div>

      <AchievementToast />

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] md:hidden" style={{ height: 56 }}>
        <div className="flex items-center justify-around">
          {MOBILE_NAV.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path || (path === "/documents" && location.pathname.startsWith("/documents"));
            return (
              <Link key={path} to={path} className="flex-1 flex flex-col items-center gap-1 py-2 relative">
                <div className="relative">
                  <Icon className="w-5 h-5" style={{ color: active ? "#1E5FA8" : "#9CA3AF" }} />
                  {path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: "#1E5FA8" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: active ? "#1E5FA8" : "#9CA3AF" }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
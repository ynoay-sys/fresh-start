import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, FolderOpen, Users, Package, CalendarDays,
  Bell, Target, Globe, Contact2, Trophy, Settings, ChevronDown,
  LogOut, User, Menu, X, MoreHorizontal
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Building2, label: "פתיחת עסק", path: "/business-opening" },
  { icon: FolderOpen, label: "מסמכים", path: "/documents" },
  { icon: Users, label: "לקוחות", path: "/clients" },
  { icon: Package, label: "הזמנות", path: "/orders" },
  { icon: CalendarDays, label: "לוח זמנים", path: "/schedule" },
  { icon: Bell, label: "התראות", path: "/notifications" },
  { icon: Target, label: "חזון ומטרות", path: "/vision" },
  { icon: Globe, label: "דף הנחיתה", path: "/landing-page" },
  { icon: Contact2, label: "אנשי קשר", path: "/contacts" },
  { icon: User, label: "פרופיל", path: "/profile" },
];

const MOBILE_NAV = [
  { icon: Building2, label: "פתיחת עסק", path: "/business-opening" },
  { icon: FolderOpen, label: "מסמכים", path: "/documents" },
  { icon: CalendarDays, label: "לוח זמנים", path: "/schedule" },
  { icon: Bell, label: "התראות", path: "/notifications" },
  { icon: MoreHorizontal, label: "עוד", path: "/profile" },
];

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    base44.entities.Notification.filter({ created_by: user.email, is_read: false })
      .then(items => setUnreadCount(items.length))
      .catch(() => setUnreadCount(0));
  }, [user]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).slice(0, 2).join("")
    : user?.email?.[0]?.toUpperCase() || "?";

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-rubik flex flex-col" dir="rtl">
      {/* Top Bar */}
      <header className="fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        {/* Right: Logo + mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(v => !v)}
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

        {/* Left: Bell + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Link to="/notifications" className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1"
                style={{ backgroundColor: "#1E5FA8" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: "#1E5FA8" }}>
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
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    פרופיל
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    התנתקות
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar Overlay on Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-60 bg-white border-l border-gray-200 z-30
            flex flex-col transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
            md:translate-x-0
          `}
        >
          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors
                    ${isActive
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                  style={isActive ? { backgroundColor: "#1E5FA8" } : {}}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {path === "/notifications" && unreadCount > 0 && (
                    <span className={`mr-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "text-white"}`}
                      style={!isActive ? { backgroundColor: "#1E5FA8" } : {}}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Links */}
          <div className="border-t border-gray-100 px-2 py-3 space-y-0.5">
            <Link
              to="/progress"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === "/progress" ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={location.pathname === "/progress" ? { backgroundColor: "#1E5FA8" } : {}}
            >
              <Trophy className="w-4 h-4" />
              <span>ההתקדמות שלי 🏆</span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === "/settings" ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={location.pathname === "/settings" ? { backgroundColor: "#1E5FA8" } : {}}
            >
              <Settings className="w-4 h-4" />
              <span>הגדרות</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:mr-60 min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="flex items-center justify-around">
          {MOBILE_NAV.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex-1 flex flex-col items-center gap-1 py-2 relative"
              >
                <div className="relative">
                  <Icon className="w-5 h-5" style={{ color: isActive ? "#1E5FA8" : "#9CA3AF" }} />
                  {path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: "#1E5FA8" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: isActive ? "#1E5FA8" : "#9CA3AF" }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
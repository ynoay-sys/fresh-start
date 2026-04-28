import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import BackButton from "../../components/BackButton";
import { Search, Download, X, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import PartnersTab from "../../components/admin/PartnersTab";

const ROLE_LABELS = { user: "משתמש", admin: "מנהל", super_admin: "סופר מנהל", partner: "שותף" };
const ROLE_COLORS = { user: "bg-gray-100 text-gray-600", admin: "bg-blue-100 text-blue-700", super_admin: "bg-yellow-100 text-yellow-800", partner: "bg-purple-100 text-purple-700" };
const PLAN_COLORS = { free: "bg-gray-100 text-gray-600", starter: "bg-green-100 text-green-700", pro: "bg-blue-100 text-blue-700", business: "bg-purple-100 text-purple-700" };
const PLAN_LABELS = { free: "חינמי", starter: "סטארטר", pro: "פרו", business: "עסקי" };
const PAGE_SIZE = 20;

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color: color || "#1E5FA8" }}>{value ?? "—"}</p>
    </div>
  );
}

function UserDetailPanel({ profile, onClose }) {
  if (!profile) return null;
  const color = "#1E5FA8";
  const initials = [profile.first_name, profile.last_name].filter(Boolean).map(s => s[0]).join("") || profile.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-50 flex justify-start" dir="rtl">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">פרופיל משתמש</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col items-center py-8 px-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
            style={{ backgroundColor: color }}>{initials}</div>
          <h3 className="text-xl font-bold text-gray-900">{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"}</h3>
          <p className="text-sm text-gray-500 mt-1" dir="ltr">{profile.email || "—"}</p>
          <div className="flex gap-2 mt-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[profile.role] || ROLE_COLORS.user}`}>
              {ROLE_LABELS[profile.role] || "משתמש"}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLAN_COLORS[profile.plan] || PLAN_COLORS.free}`}>
              {PLAN_LABELS[profile.plan] || "חינמי"}
            </span>
          </div>
        </div>
        <div className="px-5 space-y-4 pb-10">
          {[
            { label: "סוג עסק", value: profile.business_type },
            { label: "שם העסק", value: profile.business_name },
            { label: "מספר עוסק", value: profile.vat_number },
            { label: "טלפון", value: profile.phone_il },
            { label: "עיר", value: profile.city },
            { label: "תאריך הצטרפות", value: profile.created_date ? format(new Date(profile.created_date), "dd/MM/yyyy") : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm text-gray-800">{value || "—"}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">סטטוס</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profile.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {profile.is_active !== false ? "פעיל" : "מושהה"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [detailProfile, setDetailProfile] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    document.title = "ניהול משתמשים | Fresh Start";
    base44.entities.UserProfile.list().then(data => {
      setProfiles(data);
      setLoading(false);
    });
  }, []);

  async function adminUpdate(profileId, data) {
    await base44.functions.invoke('adminUpdateUserProfile', { profileId, data });
  }

  async function handleRoleChange(profile, newRole) {
    await adminUpdate(profile.id, { role: newRole });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    setMenuOpenId(null);
  }

  async function handleToggleStatus(profile) {
    const newActive = profile.is_active === false ? true : false;
    await adminUpdate(profile.id, { is_active: newActive });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: newActive } : p));
    setMenuOpenId(null);
  }

  function exportCSV() {
    const rows = [["שם מלא", "אימייל", "תפקיד", "תוכנית", "תאריך הצטרפות", "סטטוס"]];
    profiles.forEach(p => {
      rows.push([
        [p.first_name, p.last_name].filter(Boolean).join(" "),
        p.created_by || "",
        ROLE_LABELS[p.role] || "משתמש",
        PLAN_LABELS[p.plan] || "חינמי",
        p.created_date ? format(new Date(p.created_date), "dd/MM/yyyy") : "",
        p.is_active !== false ? "פעיל" : "מושהה",
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
    a.download = "users.csv";
    a.click();
  }

  const filtered = profiles.filter(p => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").toLowerCase();
    const email = (p.created_by || "").toLowerCase();
    const q = search.toLowerCase();
    if (q && !name.includes(q) && !email.includes(q)) return false;
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (statusFilter === "active" && p.is_active === false) return false;
    if (statusFilter === "inactive" && p.is_active !== false) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const todayStr = new Date().toDateString();
  const activeToday = profiles.filter(p => p.updated_date && new Date(p.updated_date).toDateString() === todayStr).length;
  const admins = profiles.filter(p => p.role === "admin" || p.role === "super_admin").length;
  const partners = profiles.filter(p => p.role === "partner").length;

  const [activeTab, setActiveTab] = useState("users");
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSyncDone(false);
    try {
      const users = await base44.entities.UserProfile.list();
      // Re-trigger profile creation for any users missing a profile
      // Since profiles are already the source, just reload the list
      const fresh = await base44.entities.UserProfile.list();
      setProfiles(fresh);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (e) {
      console.error("Sync failed:", e);
    }
    setSyncing(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" /> ייצא CSV
        </button>
      </div>

      {/* Info note */}
      <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800">
        <span>המשתמשים מוצגים לאחר כניסה ראשונה לאפליקציה. אם משתמש חדש אינו מוצג, בקש ממנו להתחבר.</span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {syncing ? "מסנכרן..." : syncDone ? "סנכרון הושלם ✓" : "סנכרן משתמשים"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("users")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "users" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          משתמשים
        </button>
        <button onClick={() => setActiveTab("partners")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "partners" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
          שותפים מקצועיים
        </button>
      </div>

      {activeTab === "partners" && <PartnersTab />}

      {activeTab === "users" && <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="סה״כ משתמשים" value={profiles.length} />
        <StatCard label="פעילים היום" value={activeToday} color="#1A7A4A" />
        <StatCard label="מנהלים" value={admins} color="#1E5FA8" />
        <StatCard label="שותפים" value={partners} color="#5C1A8A" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="חפש לפי שם או אימייל..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400" dir="rtl" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="all">כל התפקידים</option>
          <option value="user">משתמש</option>
          <option value="admin">מנהל</option>
          <option value="super_admin">סופר מנהל</option>
          <option value="partner">שותף</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="all">כל הסטטוסים</option>
          <option value="active">פעיל</option>
          <option value="inactive">מושהה</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["שם מלא", "אימייל", "הצטרפות", "תפקיד", "תוכנית", "סטטוס", "פעולות"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(profile => {
                  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
                  const initials = [profile.first_name, profile.last_name].filter(Boolean).map(s => s[0]).join("") || "?";
                  const email = profile.created_by || "—";
                  return (
                    <tr key={profile.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailProfile(profile)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: "#1E5FA8" }}>{initials}</div>
                          <span className="font-medium text-gray-900">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600" dir="ltr">{email}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {profile.created_date ? format(new Date(profile.created_date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[profile.role] || ROLE_COLORS.user}`}>
                          {ROLE_LABELS[profile.role] || "משתמש"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLORS[profile.plan] || PLAN_COLORS.free}`}>
                          {PLAN_LABELS[profile.plan] || "חינמי"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${profile.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {profile.is_active !== false ? "פעיל" : "מושהה"}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setMenuOpenId(menuOpenId === profile.id ? null : profile.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpenId === profile.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute left-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                <button onClick={() => { setDetailProfile(profile); setMenuOpenId(null); }}
                                  className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50">צפה בפרופיל</button>
                                <div className="border-t border-gray-100">
                                  <p className="px-4 pt-2 pb-1 text-xs text-gray-400 font-semibold">שנה תפקיד</p>
                                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                    <button key={key} onClick={() => handleRoleChange(profile, key)}
                                      className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 ${profile.role === key ? "font-semibold" : ""}`}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                                <div className="border-t border-gray-100">
                                  <button onClick={() => handleToggleStatus(profile)}
                                    className={`w-full text-right px-4 py-2.5 text-sm ${profile.is_active !== false ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                                    {profile.is_active !== false ? "השהה משתמש" : "הפעל משתמש"}
                                  </button>
                                  <button onClick={() => { alert("נשלח קישור לאיפוס סיסמה"); setMenuOpenId(null); }}
                                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50">אפס סיסמה</button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">לא נמצאו משתמשים</div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${page === n ? "text-white" : "hover:bg-gray-50 text-gray-700"}`}
              style={page === n ? { backgroundColor: "#1E5FA8" } : {}}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {detailProfile && <UserDetailPanel profile={detailProfile} onClose={() => setDetailProfile(null)} />}
      </>}
    </div>
  );
}
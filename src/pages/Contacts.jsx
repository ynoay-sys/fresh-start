import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import TabBar from "../components/TabBar";
import ContactModal from "../components/ContactModal";
import ContactDrawer from "../components/ContactDrawer";

const CATEGORY_LABELS = {
  family: "משפחה", advisor: "יועצים", lawyer: "עורכי דין",
  investor: "משקיעים", client: "לקוחות", banker: "בנקאים",
  colleague: "עמיתים", supplier: "ספקים",
};

const CATEGORY_ICONS = {
  family: "👨‍👩‍👧", advisor: "💼", lawyer: "⚖️",
  investor: "💰", client: "🤝", banker: "🏦",
  colleague: "👥", supplier: "📦",
};

const CATEGORY_COLORS = {
  family: "#FF6B9D", advisor: "#1E5FA8", lawyer: "#0D3B6E",
  investor: "#B8860B", client: "#1A7A4A", banker: "#008080",
  colleague: "#5C1A8A", supplier: "#C25A00",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3" />
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 mx-auto" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-3" />
      <div className="h-3 bg-gray-100 rounded mb-1" />
      <div className="h-3 bg-gray-100 rounded" />
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete, onClick }) {
  const initials = contact.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "?";
  const color = CATEGORY_COLORS[contact.category] || "#6B7280";

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col p-5 cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: color }}>
          {initials}
        </div>
      </div>

      {/* Name + Profession */}
      <p className="font-bold text-gray-900 text-sm text-center mb-0.5 break-words">{contact.full_name}</p>
      {contact.profession && (
        <p className="text-xs text-gray-400 text-center mb-2 break-words">{contact.profession}</p>
      )}

      {/* Category badge */}
      <div className="flex justify-center mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
          {CATEGORY_LABELS[contact.category] || contact.category}
        </span>
      </div>

      {/* Contact info */}
      <div className="text-xs text-gray-500 space-y-1 mb-4">
        {contact.phone && <p className="break-words">📞 {contact.phone}</p>}
        {contact.email && <p className="break-all">✉️ {contact.email}</p>}
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-2 w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onEdit(contact)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0"
        >
          <Edit className="w-3.5 h-3.5" /> ערוך
        </button>
        <button
          onClick={() => onDelete(contact)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" /> מחק
        </button>
      </div>
    </div>
  );
}

function DeleteDialog({ contact, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 text-lg mb-2">מחיקת איש קשר</h3>
        <p className="text-sm text-gray-600 mb-6">
          האם אתה בטוח שברצונך למחוק את <span className="font-medium">{contact.full_name}</span> מרשימת אנשי הקשר?
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">מחק</button>
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [modalContact, setModalContact] = useState(undefined); // undefined=closed, null=add, obj=edit
  const [drawerContact, setDrawerContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function load() {
    const user = await base44.auth.me();
    const results = await base44.entities.Contact.filter({ created_by: user.email }, "full_name");
    setContacts(results);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(contact) {
    await base44.entities.Contact.delete(contact.id);
    setContacts(c => c.filter(x => x.id !== contact.id));
    setDeleteTarget(null);
  }

  async function handleSaved() {
    setModalContact(undefined);
    setLoading(true);
    await load();
  }

  const categoryCounts = contacts.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  const filtered = contacts.filter(c => {
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || [c.full_name, c.profession, c.email].some(f => f?.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const FILTER_CATEGORIES = Object.keys(CATEGORY_LABELS);

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Category Sidebar */}
      <aside className="hidden md:flex flex-col w-52 border-l border-gray-100 bg-white px-3 py-6 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">קטגוריות</p>
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${activeCategory === "all" ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
          style={activeCategory === "all" ? { backgroundColor: "#1E5FA8" } : {}}
        >
          <span>הכל</span>
          <span className="text-xs opacity-70">{contacts.length}</span>
        </button>
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${activeCategory === cat ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
            style={activeCategory === cat ? { backgroundColor: "#1E5FA8" } : {}}
          >
            <span className="inline-flex items-center gap-1.5">
              <span style={{ fontSize: 15, lineHeight: 1 }}>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
            </span>
            <span className="text-xs opacity-70 mr-1">{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">אנשי קשר</h1>
          <button
            onClick={() => setModalContact(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            <Plus className="w-4 h-4" /> הוסף איש קשר
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חפש לפי שם, מקצוע או אימייל..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
            dir="rtl"
          />
        </div>

        {/* Mobile category tabs */}
        <div className="mb-4 md:hidden">
          <TabBar
            tabs={[
              { key: "all", label: `הכל (${contacts.length})` },
              ...FILTER_CATEGORIES.map(cat => ({
                key: cat,
                label: `${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`
              }))
            ]}
            activeKey={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <ContactCard
                key={c.id} contact={c}
                onEdit={contact => setModalContact(contact)}
                onDelete={setDeleteTarget}
                onClick={() => setDrawerContact(c)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-16 text-center px-6">
            <span className="text-6xl mb-4">👤</span>
            <p className="text-lg font-semibold text-gray-700 mb-1">עדיין אין אנשי קשר</p>
            <p className="text-sm text-gray-400 mb-6">
              {search || activeCategory !== "all" ? "לא נמצאו אנשי קשר התואמים לחיפוש" : "הוסיפו את איש הקשר הראשון שלכם"}
            </p>
            {!search && activeCategory === "all" && (
              <button onClick={() => setModalContact(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#1E5FA8" }}>
                <Plus className="w-4 h-4" /> הוסיפו איש קשר
              </button>
            )}
          </div>
        )}
        </div>

      {/* Modals */}
      {modalContact !== undefined && (
        <ContactModal
          contact={modalContact}
          onClose={() => setModalContact(undefined)}
          onSaved={handleSaved}
        />
      )}
      {drawerContact && (
        <ContactDrawer
          contact={drawerContact}
          onClose={() => setDrawerContact(null)}
          onEdit={() => { setModalContact(drawerContact); setDrawerContact(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          contact={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
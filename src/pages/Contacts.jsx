import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import TabBar from "../components/TabBar";
import ContactModal from "../components/ContactModal";
import ContactDrawer from "../components/ContactDrawer";
import { trackEvent } from "../lib/trackEvent";

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

function ContactCard({ contact, onEdit, onDelete, onClick, selectionMode, selected, onToggleSelect }) {
  const initials = contact.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "?";
  const color = CATEGORY_COLORS[contact.category] || "#6B7280";

  const cardStyle = {
    width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    padding: '12px 16px', overflowX: 'hidden', marginBottom: '8px',
    position: 'relative',
    ...(selectionMode && selected
      ? { border: '2px solid #1E5FA8', backgroundColor: '#EAF2FB' }
      : {}),
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col cursor-pointer"
      style={cardStyle}
      onClick={selectionMode ? () => onToggleSelect(contact.id) : onClick}
    >
      {/* Checkbox in selection mode */}
      {selectionMode && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: selected ? '#1E5FA8' : 'transparent',
            border: selected ? '2px solid #1E5FA8' : '2px solid #9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {selected && <span style={{ color: 'white', fontSize: 13, fontWeight: 'bold', lineHeight: 1 }}>✓</span>}
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: color }}>
          {initials}
        </div>
      </div>

      {/* Name + Profession */}
      <p style={{fontWeight:'bold', fontSize:'14px', color:'#111827', textAlign:'center', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block'}}>{contact.full_name}</p>
      {contact.profession && (
        <p style={{fontSize:'12px', color:'#9CA3AF', textAlign:'center', marginBottom:'8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block'}}>{contact.profession}</p>
      )}

      {/* Category badge */}
      <div className="flex justify-center mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
          {CATEGORY_LABELS[contact.category] || contact.category}
        </span>
      </div>

      {/* Contact info */}
      <div style={{fontSize:'12px', color:'#6B7280', marginBottom:'16px', width:'100%'}}>
        {contact.phone && <p style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block', marginBottom:'4px'}}>📞 {contact.phone}</p>}
        {contact.email && <p style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block'}}>✉️ {contact.email}</p>}
      </div>

      {/* Actions — hidden in selection mode */}
      {!selectionMode && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: '100%', overflow: 'visible', flexWrap: 'wrap', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(contact)}
            style={{ flexShrink: 0 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit className="w-3.5 h-3.5" /> ערוך
          </button>
          <button
            onClick={() => onDelete(contact)}
            style={{ flexShrink: 0 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> מחק
          </button>
        </div>
      )}
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
  const [toast, setToast] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const toggleSelect = (contactId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  async function load() {
    const currentUser = await base44.auth.me();
    const results = await base44.entities.Contact.filter({ created_by: currentUser.email }, "full_name");
    setContacts(results);
    setLoading(false);
  }

  useEffect(() => { load(); document.title = 'אנשי קשר | Fresh Start'; }, []);

  async function handleDelete(contact) {
    await base44.entities.Contact.delete(contact.id);
    setContacts(c => c.filter(x => x.id !== contact.id));
    setDeleteTarget(null);
    setDrawerContact(null);
    showToast(`איש הקשר "${contact.full_name}" נמחק בהצלחה`);
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      await base44.entities.Contact.delete(id);
      await new Promise(r => setTimeout(r, 200));
    }
    showToast(`${count} אנשי קשר נמחקו בהצלחה`);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    const currentUser = await base44.auth.me();
    const fresh = await base44.entities.Contact.filter({ created_by: currentUser.email }, "full_name");
    setContacts(fresh);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSaved(isNew, category, prefetchedList) {
    if (isNew) trackEvent('contact_added', { category: category || 'unknown' });
    setModalContact(undefined);
    if (prefetchedList) {
      // Modal already verified the list — use it directly, no extra fetch needed
      const sorted = [...prefetchedList].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      setContacts(sorted);
      setLoading(false);
    } else {
      setLoading(true);
      await load();
    }
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
    <div style={{width:'100%', maxWidth:'100vw', overflowX:'hidden', boxSizing:'border-box'}} dir="rtl">
      <div style={{display:'flex', flexDirection:'row', width:'100%'}}>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
            </span>
            <span className="text-xs opacity-70 mr-1">{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <div style={{flex:1, minWidth:0, overflowX:'hidden', padding:'32px 12px', boxSizing:'border-box', maxWidth:'100%'}}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">אנשי קשר</h1>
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <button
                onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ביטול
              </button>
            ) : (
              <button
                onClick={() => { setSelectionMode(true); setSelectedIds(new Set()); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                בחר
              </button>
            )}
            {!selectionMode && (
              <button
                onClick={() => setModalContact(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#1E5FA8" }}
              >
                <Plus className="w-4 h-4" /> הוסף איש קשר
              </button>
            )}
          </div>
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
        <div style={{width:'100%', maxWidth:'100%', overflowX:'hidden', boxSizing:'border-box', marginBottom:'16px'}} className="md:hidden">
          <TabBar
            tabs={[
              { key: "all", label: `הכל (${contacts.length})` },
              ...FILTER_CATEGORIES.map(cat => ({
                key: cat,
                label: CATEGORY_LABELS[cat]
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
          <div style={{width:'100%', maxWidth:'100%', boxSizing:'border-box', overflowX:'hidden', display:'flex', flexDirection:'column', gap:'8px'}}>
            {filtered.map(c => (
              <ContactCard
                key={c.id} contact={c}
                onEdit={contact => setModalContact(contact)}
                onDelete={setDeleteTarget}
                onClick={() => setDrawerContact(c)}
                selectionMode={selectionMode}
                selected={selectedIds.has(c.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px', boxSizing: 'border-box' }}>
            <span className="text-6xl mb-4">👤</span>
            <p className="text-lg font-semibold text-gray-700 mb-1" style={{ textAlign: 'center' }}>עדיין אין אנשי קשר</p>
            <p className="text-sm text-gray-400 mb-6" style={{ textAlign: 'center' }}>
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
      </div>{/* end flex row */}

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
          onDelete={(c) => { setDrawerContact(null); setDeleteTarget(c); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          contact={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {/* Toast — top-center with × dismiss */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1A7A4A', color: 'white',
          padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
        }}>
          {toast}
          <button onClick={() => setToast("")} style={{ color: 'white', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Floating action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 70, left: 0, right: 0, zIndex: 100,
          backgroundColor: 'white', boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} dir="rtl">
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selectedIds.size} אנשי קשר נבחרו</span>
          <button
            onClick={() => {
              if (selectedIds.size === contacts.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(contacts.map(c => c.id)));
            }}
            style={{ fontSize: 13, color: '#1E5FA8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            {selectedIds.size === contacts.length ? "בטל בחירת הכל" : "בחר הכל"}
          </button>
          <button
            onClick={() => setShowBulkConfirm(true)}
            style={{ backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            מחק נבחרים 🗑️
          </button>
        </div>
      )}

      {/* Bulk delete confirm dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-1">האם למחוק {selectedIds.size} אנשי קשר?</h3>
            <p className="text-sm text-gray-500 mb-6">פעולה זו אינה ניתנת לביטול</p>
            <div className="flex gap-3">
              <button onClick={handleBulkDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">מחק הכל</button>
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Trash2, Download, FolderOpen, PenLine } from "lucide-react";
import { format } from "date-fns";
import LegalCheckButton from "../components/LegalCheckButton";
import TabBar from "../components/TabBar";
import DocumentChatbot from "../components/DocumentChatbot";
import TemplatesLibrary from "../components/TemplatesLibrary";
import { trackEvent } from "../lib/trackEvent";

const TABS = [
  { key: "all", label: "הכל" },
  { key: "contract", label: "חוזים" },
  { key: "invoice", label: "חשבוניות" },
  { key: "license", label: "רישיונות" },
  { key: "receipt", label: "קבלות" },
  { key: "form", label: "טפסים" },
  { key: "other", label: "אחר" },
  { key: "templates", label: "ספריית טפסים" },
];

const CATEGORY_LABELS = {
  contract: "חוזה",
  invoice: "חשבונית",
  license: "רישיון",
  receipt: "קבלה",
  form: "טופס",
  other: "אחר",
};

const CATEGORY_COLORS = {
  contract: "bg-blue-100 text-blue-700",
  invoice: "bg-purple-100 text-purple-700",
  license: "bg-orange-100 text-orange-700",
  receipt: "bg-gray-100 text-gray-700",
  form: "bg-green-100 text-green-700",
  other: "bg-slate-100 text-slate-600",
};

function FileTypeIcon({ ext }) {
  if (ext === "pdf") return <span className="text-5xl">📄</span>;
  if (["jpg", "jpeg", "png"].includes(ext)) return <span className="text-5xl">🖼️</span>;
  return <span className="text-5xl">📝</span>;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
    </div>
  );
}

function DeleteDialog({ doc, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 text-lg mb-2">מחיקת מסמך</h3>
        <p className="text-sm text-gray-600 mb-6">
          האם אתה בטוח שברצונך למחוק את "<span className="font-medium">{doc.file_name}</span>"?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}

function LegalStatusBadge({ confidence }) {
  if (confidence == null) return null;
  if (confidence >= 80) return <span className="flex items-center gap-1 text-xs text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />נדרשת בדיקה</span>;
  if (confidence >= 50) return <span className="flex items-center gap-1 text-xs text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />ייתכן נדרשת</span>;
  return <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />תקין</span>;
}

function DocumentCard({ doc, onDelete, onSign, onConfidenceUpdate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col p-5" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Icon */}
      <div className="flex justify-center mb-3">
        <FileTypeIcon ext={doc.file_type} />
      </div>

      {/* Name */}
      <p className="font-semibold text-gray-800 text-sm text-center truncate mb-2" title={doc.file_name}>
        {doc.file_name}
      </p>

      {/* Category + Signed + Legal badges */}
      <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
          {CATEGORY_LABELS[doc.category] || "אחר"}
        </span>
        {doc.is_signed && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
            חתום ✓
          </span>
        )}
        <LegalStatusBadge confidence={doc.legal_check_confidence} />
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-400 text-center space-y-0.5 mb-4">
        {doc.created_date && (
          <p>{format(new Date(doc.created_date), "dd/MM/yyyy")}</p>
        )}
        {doc.file_size_kb && <p>{doc.file_size_kb >= 1024 ? `${(doc.file_size_kb / 1024).toFixed(1)} MB` : `${doc.file_size_kb} KB`}</p>}
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <a
            href={doc.storage_path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            הורד
          </a>
          {!doc.is_signed && (
            <button
              onClick={() => onSign(doc)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
              style={{ borderColor: "#1E5FA8", color: "#1E5FA8" }}
            >
              <PenLine className="w-3.5 h-3.5" />
              חתום
            </button>
          )}
          <button
            onClick={() => onDelete(doc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            מחק
          </button>
        </div>
        <LegalCheckButton doc={doc} onConfidenceUpdate={onConfidenceUpdate} />
      </div>
    </div>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  useEffect(() => { trackEvent('page_view', { module: '/documents' }); document.title = 'מסמכים | Fresh Start'; }, []);
  const handleSign = (doc) => { trackEvent('document_signed', { hasLegalCheck: false }); navigate(`/documents/sign/${doc.id}`); };
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleConfidenceUpdate(docId, confidence) {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, legal_check_confidence: confidence } : d));
  }

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const results = await base44.entities.Document.filter({ created_by: user.email, status: "active" }, "-created_date");
      setDocs(results);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(doc) {
    await base44.entities.Document.update(doc.id, { status: "deleted" });
    setDocs(d => d.filter(x => x.id !== doc.id));
    setDeleteTarget(null);
  }

  const filtered = docs.filter(d => {
    const matchTab = activeTab === "all" || d.category === activeTab;
    const matchSearch = !search || d.file_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const TABS_LIST = TABS.map(t => ({ key: t.key, label: t.label }));

  return (
    <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', padding: '32px 16px' }} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">המסמכים שלי</h1>
        <button
          onClick={() => navigate("/documents/upload")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          <Plus className="w-4 h-4" />
          העלאת מסמך
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <TabBar tabs={TABS_LIST} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש מסמך לפי שם..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
          dir="rtl"
        />
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Templates Library */}
      {activeTab === "templates" && (
        <TemplatesLibrary />
      )}

      {/* Document Grid */}
      {activeTab !== "templates" && !loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, width: '100%', boxSizing: 'border-box' }}>
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={setDeleteTarget} onSign={handleSign} onConfidenceUpdate={handleConfidenceUpdate} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeTab !== "templates" && !loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-1">עדיין אין מסמכים</p>
          <p className="text-sm text-gray-400 mb-6">
            {search || activeTab !== "all"
              ? "לא נמצאו מסמכים התואמים את החיפוש"
              : "העלה את המסמך הראשון שלך כדי להתחיל"}
          </p>
          {!search && activeTab === "all" && (
            <button
              onClick={() => navigate("/documents/upload")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              <Plus className="w-4 h-4" />
              העלה מסמך +
            </button>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteDialog
          doc={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* AI Chatbot */}
      <DocumentChatbot />
    </div>
  );
}
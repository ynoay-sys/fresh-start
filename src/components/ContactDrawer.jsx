import { X, Phone, Mail, Globe, Clock, Edit, Trash2 } from "lucide-react";

const CATEGORY_LABELS = {
  family: "משפחה", advisor: "יועצים", lawyer: "עורכי דין",
  investor: "משקיעים", client: "לקוחות", banker: "בנקאים",
  colleague: "עמיתים", supplier: "ספקים",
};

const CATEGORY_COLORS = {
  family: "#FF6B9D", advisor: "#1E5FA8", lawyer: "#0D3B6E",
  investor: "#B8860B", client: "#1A7A4A", banker: "#008080",
  colleague: "#5C1A8A", supplier: "#C25A00",
};

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-800">{value || "—"}</span>
    </div>
  );
}

export default function ContactDrawer({ contact, onClose, onEdit, onDelete }) {
  if (!contact) return null;

  const initials = contact.full_name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "?";
  const color = CATEGORY_COLORS[contact.category] || "#6B7280";

  const phone = contact.phone?.replace(/[-\s]/g, "");
  const waPhone = phone ? `972${phone.replace(/^0/, "")}` : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start" dir="rtl">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={onEdit} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#1E5FA8" }}>
              <Edit className="w-4 h-4" /> ערוך
            </button>
            {onDelete && (
              <button onClick={() => onDelete(contact)} className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" /> מחק
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-8 px-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
            style={{ backgroundColor: color }}>
            {initials}
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">{contact.full_name}</h2>
          {contact.profession && <p className="text-sm text-gray-500 mt-1">{contact.profession}</p>}
          <span className="mt-2 text-xs px-3 py-1 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
            {CATEGORY_LABELS[contact.category] || contact.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-5 mb-6">
          {waPhone ? (
            <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium text-green-700 border-green-200 hover:bg-green-50">
              <Phone className="w-4 h-4" /> שלח ווטסאפ
            </a>
          ) : (
            <button disabled title="אין מספר טלפון"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium text-gray-300 border-gray-100 cursor-not-allowed">
              <Phone className="w-4 h-4" /> שלח ווטסאפ
            </button>
          )}
          {contact.email ? (
            <a href={`mailto:${contact.email}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium border-gray-200 text-gray-700 hover:bg-gray-50">
              <Mail className="w-4 h-4" /> שלח אימייל
            </a>
          ) : (
            <button disabled title="אין כתובת אימייל"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium text-gray-300 border-gray-100 cursor-not-allowed">
              <Mail className="w-4 h-4" /> שלח אימייל
            </button>
          )}
        </div>

        {/* Details */}
        <div className="px-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">פרטי קשר</h3>
            <div className="space-y-3">
              <Row label="טלפון" value={contact.phone} />
              <Row label="אימייל" value={contact.email} />
              <Row label="אתר אינטרנט" value={contact.website} />
              <Row label="שעות זמינות" value={contact.availability} />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">פרטי עסק</h3>
            <div className="space-y-3">
              <Row label="מקצוע / תפקיד" value={contact.profession} />
              <Row label="אחריות / מטרה" value={contact.responsibility} />
            </div>
          </div>
          {contact.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">הערות</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
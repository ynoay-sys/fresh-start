import { useNavigate } from "react-router-dom";
import { X, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const CAT_LABELS = {
  client: "לקוח", delivery: "משלוח", order: "הזמנה",
  milestone: "אבן דרך", government: "ממשלתי", personal: "אישי",
};

const CAT_COLORS = {
  client: "#1E5FA8", delivery: "#C25A00", order: "#C25A00",
  milestone: "#5C1A8A", government: "#AA1111", personal: "#555555",
};

const SOURCE_LABELS = {
  client: { icon: "👥", label: "לקוח", path: "/clients" },
  order: { icon: "📦", label: "הזמנה", path: "/orders" },
  milestone: { icon: "🎯", label: "אבן דרך", path: "/vision" },
  manual: { icon: "✏️", label: "ידני", path: null },
};

export default function EventPopover({ event, onClose, onEdit, onDeleted }) {
  const navigate = useNavigate();
  const color = CAT_COLORS[event.category] || "#555555";
  const source = SOURCE_LABELS[event.source_type] || SOURCE_LABELS.manual;

  async function handleDelete() {
    if (!confirm(`למחוק את "${event.title}"?`)) return;
    await base44.entities.ScheduleEvent.delete(event.id);
    onDeleted();
  }

  function formatTime(dt) {
    if (!dt) return "";
    return format(new Date(dt), "HH:mm");
  }

  function formatDate(dt) {
    if (!dt) return "";
    return format(new Date(dt), "dd/MM/yyyy");
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
            {CAT_LABELS[event.category] || event.category}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-base">{event.title}</h3>
          <div className="text-sm text-gray-600">
            {formatDate(event.start_time)}
            {!event.all_day && ` | ${formatTime(event.start_time)}–${formatTime(event.end_time)}`}
            {event.all_day && " | כל היום"}
          </div>
          {event.notes && <p className="text-sm text-gray-500">{event.notes}</p>}
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{source.icon}</span>
            {source.path ? (
              <button onClick={() => { onClose(); navigate(source.path); }}
                className="text-sm font-medium underline" style={{ color }}>
                {source.label}
              </button>
            ) : (
              <span className="text-sm text-gray-500">{source.label}</span>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Edit className="w-3.5 h-3.5" /> ערוך
          </button>
          <button onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-100 text-sm font-medium text-red-500 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" /> מחק
          </button>
        </div>
      </div>
    </div>
  );
}
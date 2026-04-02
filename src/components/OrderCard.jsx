import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays } from "date-fns";
import confetti from "canvas-confetti";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const STATUS_COLORS = {
  pending: "#9CA3AF",
  in_transit: "#1E5FA8",
  delivered: "#1A7A4A",
  delayed: "#AA1111",
};

const STATUS_LABELS = {
  pending: "ממתין",
  in_transit: "בדרך",
  delivered: "נמסר",
  delayed: "מאוחר",
};

function isOverdue(order) {
  if (!order.expected_date || order.status === "delivered") return false;
  return new Date(order.expected_date) < new Date();
}

export default function OrderCard({ order, onUpdated, user }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(order.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const today = new Date();
  const overdue = isOverdue(order);
  const statusColor = STATUS_COLORS[order.status] || "#9CA3AF";

  let daysLabel = null;
  if (order.status === "in_transit" && order.expected_date) {
    const diff = differenceInDays(new Date(order.expected_date), today);
    daysLabel = diff >= 0 ? `עוד ${diff} ימים` : `מאוחר ב-${Math.abs(diff)} ימים`;
  } else if (order.status === "delivered") {
    daysLabel = "נמסר ✓";
  } else if (order.status === "delayed" && order.expected_date) {
    const diff = differenceInDays(today, new Date(order.expected_date));
    daysLabel = `מאוחר ב-${Math.abs(diff)} ימים`;
  }

  async function updateStatus(newStatus) {
    setStatusOpen(false);
    await base44.entities.Order.update(order.id, { status: newStatus });
    if (newStatus === "delivered") {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      if (user) {
        await base44.entities.Notification.create({
          tier: "system",
          type: "deadline",
          title: "הזמנה הגיעה! 📦",
          body: `${order.contents || "הזמנה"} מ${order.carrier || "ספק"} נמסרה.`,
          is_read: false,
        });
      }
    }
    onUpdated();
  }

  async function saveNotes() {
    setSavingNotes(true);
    await base44.entities.Order.update(order.id, { notes });
    setSavingNotes(false);
  }

  async function deleteOrder() {
    await base44.entities.Order.delete(order.id);
    onUpdated();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Status strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: statusColor }} />

      <div className="p-4">
        {/* Row 1: Carrier + order number */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-base truncate">{order.carrier || "ספק לא ידוע"}</span>
          <span className="text-xs text-gray-400 font-mono mr-2 flex-shrink-0">{order.order_number}</span>
        </div>

        {/* Row 2: Contents */}
        {order.contents && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{order.contents}</p>
        )}

        {/* Row 3: Expected date */}
        {order.expected_date && (
          <div className="mb-2">
            {overdue ? (
              <p className="text-sm font-medium text-red-600">
                ⚠️ באיחור! היה אמור להגיע {format(new Date(order.expected_date), "dd/MM")}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                📅 צפוי: {format(new Date(order.expected_date), "dd/MM/yyyy")}
              </p>
            )}
          </div>
        )}

        {/* Row 4: Status badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
            style={{ backgroundColor: statusColor }}
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
          {daysLabel && (
            <span className="text-xs text-gray-500">{daysLabel}</span>
          )}
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-2"
        >
          📋 הערות {notesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {notesOpen && (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            placeholder="הוסף הערות..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none mb-2"
            dir="rtl"
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              עדכן סטטוס <ChevronDown className="w-3 h-3" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(key)}
                      className="block w-full text-right px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <button onClick={deleteOrder} className="text-red-600 font-medium hover:underline">מחק</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:underline">ביטול</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
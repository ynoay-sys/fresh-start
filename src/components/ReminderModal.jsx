import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  return `972${local}`;
}

export default function ReminderModal({ client, onClose }) {
  const [channel, setChannel] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const biz = profiles[0]?.business_name || "העסק שלנו";
      setMessage(`שלום ${client.full_name}, זוהי תזכורת מ${biz}. נשמח לשמוע ממך!`);
    }
    loadProfile();
  }, [client]);

  async function handleSend() {
    if (scheduled && scheduleTime) {
      setSaving(true);
      const user = await base44.auth.me();
      await base44.entities.Notification.create({
        tier: "system",
        type: "deadline",
        title: `תזכורת ללקוח: ${client.full_name}`,
        body: message,
        scheduled_for: new Date(scheduleTime).toISOString(),
        action_url: "/clients",
      });
      setSaving(false);
      setSent(true);
      return;
    }

    if (channel === "whatsapp" && client.phone) {
      const wa = formatPhone(client.phone);
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, "_blank");
    } else if (channel === "sms" && client.phone) {
      window.open(`sms:${client.phone}?body=${encodeURIComponent(message)}`, "_blank");
    }
    setSent(true);
  }

  const channelNotice = channel === "whatsapp"
    ? "ההודעה תיפתח בוואטסאפ לאישור שליחה סופי שלך."
    : "ההודעה תיפתח באפליקציית SMS שלך.";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">שליחת תזכורת ל{client.full_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-gray-800">
              {scheduled && scheduleTime
                ? `התזכורת נקבעה ל-${new Date(scheduleTime).toLocaleString("he-IL")} ✓`
                : "ההודעה נפתחה לשליחה ✓"}
            </p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>סגור</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תוכן ההודעה</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" dir="rtl" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">ערוץ שליחה</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="whatsapp" checked={channel === "whatsapp"} onChange={() => setChannel("whatsapp")} />
                  <span className="text-sm">📱 WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="sms" checked={channel === "sms"} onChange={() => setChannel("sms")} />
                  <span className="text-sm">💬 SMS</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={scheduled} onChange={e => setScheduled(e.target.checked)} />
              <span className="text-sm text-gray-700">שלח בזמן מאוחר יותר</span>
            </label>

            {scheduled && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך ושעה לשליחה</label>
                <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            )}

            {!scheduled && (
              <p className="text-xs text-gray-400">{channelNotice}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={handleSend} disabled={saving || !client.phone}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "#1E5FA8" }}>
                {saving ? "שומר..." : "שלח הודעה"}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
            </div>
            {!client.phone && <p className="text-xs text-red-500">אין מספר טלפון ללקוח זה.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
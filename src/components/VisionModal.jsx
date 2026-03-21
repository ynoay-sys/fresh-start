import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VisionModal({ vision, onClose, onSaved }) {
  const [title, setTitle] = useState(vision?.title || "");
  const [description, setDescription] = useState(vision?.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    if (vision?.id) {
      await base44.entities.Milestone.update(vision.id, { title, description });
    } else {
      await base44.entities.Milestone.create({ type: "vision", title, description, status: "active" });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{vision ? "עריכת חזון" : "הגדרת חזון"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">חזון *</label>
            <textarea value={title} onChange={e => setTitle(e.target.value)} rows={4} dir="rtl"
              placeholder="לאן אתה רוצה שהעסק שלך יגיע בעוד 3 שנים?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תיאור נוסף</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} dir="rtl"
              placeholder="פרט את החזון שלך..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1E5FA8" }}>
            {saving ? "שומר..." : "שמור חזון"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">ביטול</button>
        </div>
      </div>
    </div>
  );
}
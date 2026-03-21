import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { he } from "date-fns/locale";

const TIER_ICONS = { personal: "👤", national: "🇮🇱", system: "⚙️" };
const TIER_BG = { personal: "#FFF0F6", national: "#EAF0FB", system: "#F4F4F4" };
const TIER_ICON_COLOR = { personal: "#C2185B", national: "#1E5FA8", system: "#555" };

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return `לפני ${formatDistanceToNow(d, { locale: he })}`;
  if (isYesterday(d)) return "אתמול";
  return format(d, "dd/MM");
}

export default function NotificationItem({ notification, onClick, compact = false }) {
  const { tier, title, body, is_read, scheduled_for, created_date } = notification;
  const date = scheduled_for || created_date;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${!is_read ? "bg-blue-50" : "bg-white"} ${compact ? "px-3 py-2" : ""}`}
    >
      {/* Unread dot */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: is_read ? "transparent" : "#1E5FA8" }} />
      </div>

      {/* Tier icon */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: TIER_BG[tier] || "#F4F4F4" }}>
        {TIER_ICONS[tier] || "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"} truncate`}>{title}</p>
        {!compact && body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>}
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(date)}</p>
      </div>
    </div>
  );
}
import { useState } from "react";

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

const CAT_COLORS = {
  client: "#1E5FA8", delivery: "#C25A00", order: "#C25A00",
  milestone: "#5C1A8A", government: "#AA1111", personal: "#555555",
};

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getEventsForDay(events, date) {
  return events.filter(e => {
    const d = new Date(e.start_time);
    return isSameDay(d, date);
  });
}

export default function CalendarMonthly({ year, month, events, onDateClick, onEventClick }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const today = new Date();

  // Build calendar grid (Sunday first)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNum));
    }
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_HE.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="bg-gray-50 min-h-[90px]" />;

          const dayEvents = getEventsForDay(events, date);
          const isToday = isSameDay(date, today);
          const isExpanded = expandedDay && isSameDay(expandedDay, date);
          const shown = isExpanded ? dayEvents : dayEvents.slice(0, 3);
          const extra = dayEvents.length - 3;

          return (
            <div key={i} className="bg-white min-h-[90px] p-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onDateClick(date)}>
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "text-white" : "text-gray-700"}`}
                  style={isToday ? { backgroundColor: "#1E5FA8" } : {}}>
                  {date.getDate()}
                </span>
              </div>
              {/* Event chips */}
              <div className="space-y-0.5">
                {shown.map(ev => (
                  <div key={ev.id}
                    className="text-white text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: CAT_COLORS[ev.category] || "#555" }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}>
                    {ev.title}
                  </div>
                ))}
                {!isExpanded && extra > 0 && (
                  <div className="text-[10px] text-blue-600 font-medium cursor-pointer px-1"
                    onClick={e => { e.stopPropagation(); setExpandedDay(date); }}>
                    + {extra} נוספים
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { format } from "date-fns";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07-22

const CAT_COLORS = {
  client: "#1E5FA8", delivery: "#C25A00", order: "#C25A00",
  milestone: "#5C1A8A", government: "#AA1111", personal: "#555555",
};

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const HOUR_HEIGHT = 60; // px per hour

export default function CalendarDaily({ date, events, onEventClick }) {
  const dayEvents = events.filter(e => {
    const d = new Date(e.start_time);
    return isSameDay(d, date) && !e.all_day;
  });

  const allDayEvents = events.filter(e => isSameDay(new Date(e.start_time), date) && e.all_day);

  const now = new Date();
  const isToday = isSameDay(date, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMin - 7 * 60) / 60) * HOUR_HEIGHT;

  function getEventStyle(ev) {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time || new Date(start.getTime() + 3600000));
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const top = ((startMin - 7 * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
    return { top, height };
  }

  return (
    <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
          {allDayEvents.map(ev => (
            <div key={ev.id}
              className="text-white text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80"
              style={{ backgroundColor: CAT_COLORS[ev.category] || "#555" }}
              onClick={() => onEventClick(ev)}>
              {ev.title}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative" style={{ height: HOUR_HEIGHT * 16 }}>
        {/* Hour rows */}
        {HOURS.map(h => (
          <div key={h} className="absolute w-full flex items-start border-t border-gray-100"
            style={{ top: (h - 7) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
            <span className="text-xs text-gray-400 px-2 pt-1 w-14 text-left flex-shrink-0">{String(h).padStart(2,"0")}:00</span>
          </div>
        ))}

        {/* Current time line */}
        {isToday && nowOffset > 0 && nowOffset < HOUR_HEIGHT * 16 && (
          <div className="absolute w-full z-10 pointer-events-none" style={{ top: nowOffset }}>
            <div className="h-0.5 bg-red-500 mr-14" />
          </div>
        )}

        {/* Events */}
        <div className="absolute inset-0 mr-14 pr-2 pl-2">
          {dayEvents.map((ev, idx) => {
            const { top, height } = getEventStyle(ev);
            const color = CAT_COLORS[ev.category] || "#555";
            return (
              <div key={ev.id}
                className="absolute rounded-lg text-white text-xs p-1.5 cursor-pointer hover:opacity-90 overflow-hidden"
                style={{ top, height, left: "4px", right: "4px", backgroundColor: color, zIndex: 5 }}
                onClick={() => onEventClick(ev)}>
                <div className="font-semibold truncate">{ev.title}</div>
                <div className="opacity-80">
                  {format(new Date(ev.start_time), "HH:mm")}–{format(new Date(ev.end_time || ev.start_time), "HH:mm")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
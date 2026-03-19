import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import CalendarMonthly from "../components/CalendarMonthly";
import CalendarDaily from "../components/CalendarDaily";
import AddEventModal from "../components/AddEventModal";
import EventPopover from "../components/EventPopover";
import UpcomingEventsSidebar from "../components/UpcomingEventsSidebar";

const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS_HE = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Schedule() {
  const today = new Date();
  const [view, setView] = useState("monthly");
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dailyDate, setDailyDate] = useState(today);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEventDate, setAddEventDate] = useState(null); // null = closed, Date = open
  const [editEvent, setEditEvent] = useState(null);
  const [popoverEvent, setPopoverEvent] = useState(null);

  async function loadEvents() {
    const user = await base44.auth.me();
    const results = await base44.entities.ScheduleEvent.filter({ created_by: user.email });
    setEvents(results);
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  // Monthly navigation (RTL: → = prev, ← = next)
  function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
  function goToday() { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); }

  // Daily navigation
  function prevDay() { setDailyDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }); }
  function nextDay() { setDailyDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; }); }

  function handleDateClick(date) {
    if (view === "monthly") {
      setDailyDate(date);
      setView("daily");
    } else {
      setAddEventDate(date);
    }
  }

  function handleEventSaved() {
    setAddEventDate(null);
    setEditEvent(null);
    loadEvents();
  }

  function handleEventDeleted() {
    setPopoverEvent(null);
    loadEvents();
  }

  const displayedEvents = view === "monthly"
    ? events.filter(e => {
        const d = new Date(e.start_time);
        return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
      })
    : events;

  const dailyLabel = `${DAYS_HE[dailyDate.getDay()]}, ${format(dailyDate, "dd/MM/yyyy")}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 px-4 py-6 max-w-7xl mx-auto" dir="rtl">
      {/* Main Calendar */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          {/* Month/day title + navigation */}
          <div className="flex items-center gap-2">
            {view === "monthly" ? (
              <>
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 min-w-[140px] text-center">
                  {MONTHS_HE[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={goToday} className="mr-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  היום
                </button>
              </>
            ) : (
              <>
                <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-base font-bold text-gray-900 min-w-[160px] text-center">{dailyLabel}</h2>
                <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => setView("monthly")} className="mr-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  חזור לחודשי
                </button>
              </>
            )}
          </div>

          {/* View toggle + add button */}
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setView("monthly")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "monthly" ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={view === "monthly" ? { backgroundColor: "#1E5FA8" } : {}}>
                חודשי
              </button>
              <button onClick={() => setView("daily")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "daily" ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={view === "daily" ? { backgroundColor: "#1E5FA8" } : {}}>
                יומי
              </button>
            </div>
            <button onClick={() => setAddEventDate(view === "daily" ? dailyDate : today)}
              className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "#1E5FA8" }}>
              + הוסף אירוע
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : view === "monthly" ? (
          <CalendarMonthly
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            events={displayedEvents}
            onDateClick={handleDateClick}
            onEventClick={setPopoverEvent}
          />
        ) : (
          <CalendarDaily
            date={dailyDate}
            events={events}
            onEventClick={setPopoverEvent}
          />
        )}
      </div>

      {/* Upcoming sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <UpcomingEventsSidebar
          events={events}
          onAddEvent={() => setAddEventDate(today)}
        />
      </div>

      {/* Modals */}
      {addEventDate && (
        <AddEventModal
          initialDate={addEventDate instanceof Date ? addEventDate.toISOString().split("T")[0] : addEventDate}
          onClose={() => setAddEventDate(null)}
          onSaved={handleEventSaved}
        />
      )}
      {editEvent && (
        <AddEventModal
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={handleEventSaved}
        />
      )}
      {popoverEvent && (
        <EventPopover
          event={popoverEvent}
          onClose={() => setPopoverEvent(null)}
          onEdit={() => { setEditEvent(popoverEvent); setPopoverEvent(null); }}
          onDeleted={handleEventDeleted}
        />
      )}
    </div>
  );
}
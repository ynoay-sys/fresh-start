const MAX_EVENTS = 500;
const STORAGE_KEY = 'analytics_events';

export function trackEvent(eventName, properties = {}) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const events = stored ? JSON.parse(stored) : [];
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });
    // Keep only last MAX_EVENTS
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    // silently fail
  }
}

export function getEvents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function clearEvents() {
  localStorage.removeItem(STORAGE_KEY);
}
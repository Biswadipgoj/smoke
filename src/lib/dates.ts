// src/lib/dates.ts
// One definition of "what day is it" for the whole app.
//
// Using `toISOString().slice(0, 10)` for this is a trap in the target market:
// it yields the UTC date, so at UTC+5:30 (India) or UTC+6 (Bangladesh) every
// local time before 05:30/06:00 reports the *previous* day. That silently
// breaks anything keyed by date — day beads would be re-created on every app
// open, and a 2am check-in (the app's peak usage window) would land on
// yesterday.
export function localDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local midnight for the given date. */
export function startOfLocalDay(d: Date = new Date()): Date {
  const copy = new Date(d.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

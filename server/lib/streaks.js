// Derive loved-streak / boredom-cycle info from a preference's check-in events.
//
// Pure: takes the raw `food_events` rows for ONE preference and returns a
// summary. Streak counters are *derived* (never stored) so correcting history
// is just deleting an event. Used by cats.js (GET /:id) and the events routes.

function toIsoDate(value) {
  // occurred_on may arrive as a 'YYYY-MM-DD' string or a Date — normalize both.
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  // Handles 'YYYY-MM-DD' and full ISO timestamps alike.
  return new Date(s.length === 10 ? `${s}T00:00:00Z` : s).toISOString().slice(0, 10);
}

function todayIso() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function daysBetween(aIso, bIso) {
  const ms = Date.parse(`${bIso}T00:00:00Z`) - Date.parse(`${aIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

const EMPTY = { currentLovedStreak: 0, streakStart: null, streakDays: 0, runs: [], rotationHint: null };

/**
 * @param {Array<{id:number, reaction:string, occurred_on:string|Date}>} events
 * @returns {{currentLovedStreak:number, streakStart:string|null, streakDays:number,
 *            runs:Array<{start:string,end:string,count:number,spanDays:number,endedBy:string}>,
 *            rotationHint:null|{count:number,spanDays:number,boredOn:string,daysSinceBored:number}}}
 */
function summarizeEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return { ...EMPTY };

  // Stable order: by date, then insertion id (breaks same-day ties).
  const ev = [...events]
    .map(e => ({ reaction: e.reaction, date: toIsoDate(e.occurred_on), id: e.id }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));

  const today = todayIso();

  // Group maximal consecutive 'loved' sequences into runs.
  const runs = [];
  for (let i = 0; i < ev.length; i++) {
    if (ev[i].reaction !== 'loved') continue;
    let j = i;
    while (j + 1 < ev.length && ev[j + 1].reaction === 'loved') j++;
    const next = ev[j + 1]; // event that broke the run (if any)
    runs.push({
      start: ev[i].date,
      end: ev[j].date,
      count: j - i + 1,
      spanDays: daysBetween(ev[i].date, ev[j].date),
      endedBy: next ? next.reaction : 'loved-ongoing', // 'bored' | 'disliked' | 'liked' | 'loved-ongoing'
    });
    i = j;
  }

  // Current streak: only when the most recent event is itself 'loved'.
  const last = ev[ev.length - 1];
  let currentLovedStreak = 0;
  let streakStart = null;
  let streakDays = 0;
  if (last.reaction === 'loved') {
    const ongoing = runs[runs.length - 1];
    currentLovedStreak = ongoing.count;
    streakStart = ongoing.start;
    streakDays = daysBetween(ongoing.start, today);
  }

  // Rotation hint: most recent event is 'bored' and the run it ended was a
  // genuine streak (loved >= 2 times) — i.e. they got bored, worth re-trying.
  let rotationHint = null;
  if (last.reaction === 'bored') {
    const endedRun = runs.length ? runs[runs.length - 1] : null;
    if (endedRun && endedRun.endedBy === 'bored' && endedRun.count >= 2) {
      rotationHint = {
        count: endedRun.count,
        spanDays: endedRun.spanDays,
        boredOn: last.date,
        daysSinceBored: daysBetween(last.date, today),
      };
    }
  }

  return { currentLovedStreak, streakStart, streakDays, runs, rotationHint };
}

module.exports = { summarizeEvents };

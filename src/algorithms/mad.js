// Priority Scheduling
// Author: Ibrash Madiyar
//
// At each scheduling decision picks the ready process with the highest priority.
// Lower number = higher priority. Non-preemptive.
//
// Key problem: starvation — a low priority process may never run
// if high priority processes keep arriving.

function clone(procs) {
  return procs.map(p => ({ ...p, rem: p.burst }));
}

export function runPriority(procs) {
  const ps = clone(procs);
  const gantt = [], metrics = {}, done = new Set();
  let t = 0;

  while (done.size < ps.length) {
    const ready = ps.filter(p => p.arrival <= t && !done.has(p.id));

    if (!ready.length) {
      t = Math.min(...ps.filter(p => !done.has(p.id)).map(p => p.arrival));
      continue;
    }

    // Pick highest priority (lowest number), break ties by arrival time
    const p = ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0];

    if (metrics[p.id] === undefined) metrics[p.id] = { response: t - p.arrival };

    gantt.push({ pid: p.id, start: t, end: t + p.burst });
    t += p.burst;

    metrics[p.id].turnaround = t - p.arrival;
    metrics[p.id].waiting = metrics[p.id].turnaround - p.burst;
    done.add(p.id);
  }

  return { gantt, metrics };
}
// MLFQ — Multi-Level Feedback Queue
// 3 queues with decreasing priority and increasing quantum size.
// New processes always enter Q1 (highest priority, shortest quantum).
// If a process uses its full quantum it gets demoted to the next queue — anti-gaming.
// Priority boost every `boost` time units resets all processes to Q1
// to prevent starvation of long-running processes stuck in Q3.

function clone(procs) {
  return procs.map(p => ({ ...p, rem: p.burst }));
}

export function runMLFQ(procs, qs = [2, 4, 8], boost = 20) {
  const levels = qs.length;
  const ps = clone(procs).map(p => ({ ...p, ql: 0 }));
  const gantt = [], metrics = {}, done = new Set(), added = new Set();
  const queues = Array.from({ length: levels }, () => []);
  let t = 0, nextBoost = boost;

  const addArrivals = () =>
    ps.filter(p => p.arrival <= t && !added.has(p.id) && !done.has(p.id))
      .sort((a, b) => a.arrival - b.arrival)
      .forEach(p => { queues[0].push(p); added.add(p.id); });

  addArrivals();

  while (done.size < ps.length) {

    // Priority boost — reset all processes to Q1 to prevent starvation
    if (t >= nextBoost) {
      const all = queues.flat();
      queues.forEach(q => q.length = 0);
      all.forEach(p => { p.ql = 0; queues[0].push(p); });
      nextBoost += boost;
    }

    // Find the highest priority non-empty queue
    let qi = -1;
    for (let i = 0; i < levels; i++) if (queues[i].length) { qi = i; break; }

    if (qi < 0) {
      const next = ps.filter(p => !added.has(p.id) && !done.has(p.id))
        .sort((a, b) => a.arrival - b.arrival)[0];
      if (!next) break;
      t = next.arrival;
      addArrivals();
      continue;
    }

    const p = queues[qi].shift();
    if (metrics[p.id] === undefined) metrics[p.id] = { response: t - p.arrival };

    // Last queue (Q3) has no quantum limit — runs to completion (FIFO)
    const slice = qi < levels - 1 ? qs[qi] : p.rem;
    const run = Math.min(slice, p.rem);

    gantt.push({ pid: p.id, start: t, end: t + run, ql: qi });
    t += run;
    p.rem -= run;
    addArrivals();

    if (p.rem > 0) {
      // Used full quantum — demote to next queue (anti-gaming mechanism)
      const nq = Math.min(qi + 1, levels - 1);
      p.ql = nq;
      queues[nq].push(p);
    } else {
      metrics[p.id].turnaround = t - p.arrival;
      metrics[p.id].waiting = metrics[p.id].turnaround - p.burst;
      done.add(p.id);
    }
  }

  return { gantt, metrics };
}
// FIFO — First In, First Out
// Processes run in order of arrival. Non-preemptive.

function clone(procs) {
    return procs.map(p => ({ ...p, rem: p.burst }));
}

export function runFIFO(procs) {
    const ps = clone(procs).sort((a, b) => a.arrival - b.arrival || a.id - b.id);
    const gantt = [], metrics = {};
    let t = 0;
    for (const p of ps) {
        if (t < p.arrival) t = p.arrival;
        metrics[p.id] = {
            response: t - p.arrival,
            waiting: t - p.arrival,
            turnaround: t - p.arrival + p.burst,
        };
        gantt.push({ pid: p.id, start: t, end: t + p.burst });
        t += p.burst;
    }
    return { gantt, metrics };
}

// SJF — Shortest Job First
// At each decision point picks the ready process with smallest burst time. Non-preemptive.
// Optimal for average turnaround time but requires knowing burst time in advance.

export function runSJF(procs) {
    const ps = clone(procs);
    const gantt = [], metrics = {}, done = new Set();
    let t = 0;
    while (done.size < ps.length) {
        const ready = ps.filter(p => p.arrival <= t && !done.has(p.id));
        if (!ready.length) {
            t = Math.min(...ps.filter(p => !done.has(p.id)).map(p => p.arrival));
            continue;
        }
        const p = ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival)[0];
        if (metrics[p.id] === undefined) metrics[p.id] = { response: t - p.arrival };
        gantt.push({ pid: p.id, start: t, end: t + p.burst });
        t += p.burst;
        metrics[p.id].turnaround = t - p.arrival;
        metrics[p.id].waiting = metrics[p.id].turnaround - p.burst;
        done.add(p.id);
    }
    return { gantt, metrics };
}
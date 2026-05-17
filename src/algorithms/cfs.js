// CFS — Completely Fair Scheduler (Linux, since 2007)
// Instead of fixed time slices, CFS tracks virtual runtime (vruntime) per process.
// It always runs the process with the smallest vruntime.
// vruntime increases proportionally to real time but inversely to weight.
// Weight is derived from priority (nice value): lower priority = less weight = vruntime grows faster.
// This means high-priority processes accumulate vruntime more slowly and get scheduled more often.

function clone(procs) {
    return procs.map(p => ({ ...p, rem: p.burst }));
}

export function runCFS(procs) {
    // Weight formula mirrors Linux: base 1024, reduced by factor 1.25 per priority level
    const ps = clone(procs).map(p => ({
        ...p,
        vrt: 0,
        wt: 1024 / Math.pow(1.25, p.priority - 1),
    }));

    const gantt = [], metrics = {}, done = new Set();
    let t = 0;

    while (done.size < ps.length) {
        const ready = ps.filter(p => p.arrival <= t && !done.has(p.id));
        if (!ready.length) {
            t = Math.min(...ps.filter(p => !done.has(p.id)).map(p => p.arrival));
            continue;
        }

        // Always pick the process with the lowest vruntime (most "behind" in fairness)
        const p = ready.sort((a, b) => a.vrt - b.vrt)[0];
        if (metrics[p.id] === undefined) metrics[p.id] = { response: t - p.arrival };

        // Time slice is proportional to this process's share of total weight
        const totalWt = ready.reduce((s, r) => s + r.wt, 0);
        const slice = Math.max(1, Math.round(p.wt / totalWt * 4));
        const run = Math.min(slice, p.rem);

        gantt.push({ pid: p.id, start: t, end: t + run });

        // vruntime grows slower for high-weight (high-priority) processes
        p.vrt += run * (1024 / p.wt);
        t += run;
        p.rem -= run;

        if (p.rem <= 0) {
            metrics[p.id].turnaround = t - p.arrival;
            metrics[p.id].waiting = metrics[p.id].turnaround - p.burst;
            done.add(p.id);
        }
    }
    return { gantt, metrics };
}
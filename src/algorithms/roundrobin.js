// Round Robin
// Each process gets a fixed time slice (quantum). Preemptive and fair.
// Small quantum = more context switches. Large quantum = behaves like FIFO.

function clone(procs) {
    return procs.map(p => ({ ...p, rem: p.burst }));
}

export function runRR(procs, quantum) {
    const ps = clone(procs);
    const gantt = [], metrics = {}, done = new Set(), added = new Set();
    let t = 0;
    const queue = [];

    ps.filter(p => p.arrival <= 0)
        .sort((a, b) => a.arrival - b.arrival)
        .forEach(p => { queue.push(p); added.add(p.id); });

    const addArrivals = () =>
        ps.filter(p => p.arrival <= t && !added.has(p.id))
            .sort((a, b) => a.arrival - b.arrival)
            .forEach(p => { queue.push(p); added.add(p.id); });

    while (done.size < ps.length) {
        if (!queue.length) {
            const next = ps.filter(p => !added.has(p.id) && !done.has(p.id))
                .sort((a, b) => a.arrival - b.arrival)[0];
            if (!next) break;
            t = next.arrival;
            addArrivals();
        }
        if (!queue.length) break;

        const p = queue.shift();
        if (metrics[p.id] === undefined) metrics[p.id] = { response: t - p.arrival };

        const run = Math.min(quantum, p.rem);
        gantt.push({ pid: p.id, start: t, end: t + run });
        t += run;
        p.rem -= run;

        addArrivals();

        if (p.rem > 0) {
            queue.push(p); // not done — go back to end of queue
        } else {
            metrics[p.id].turnaround = t - p.arrival;
            metrics[p.id].waiting = metrics[p.id].turnaround - p.burst;
            done.add(p.id);
        }
    }
    return { gantt, metrics };
}
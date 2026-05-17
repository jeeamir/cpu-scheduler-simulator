import { useState, useMemo, useEffect, useRef } from "react";
import { runFIFO, runSJF } from "./algorithms/fifo";
import { runRR } from "./algorithms/roundRobin";
import { runPriority } from "./algorithms/priority";
import { runMLFQ } from "./algorithms/mlfq";
import { runCFS } from "./algorithms/cfs";

// ── Colors per process ──────────────────────────────────────
const COLORS = ['#378ADD','#1D9E75','#D85A30','#D4537E','#7F77DD','#BA7517','#E24B4A','#5DCAA5','#AFA9EC','#9FE1CB'];
const col = id => COLORS[(id - 1) % COLORS.length];

// ── Default workload ────────────────────────────────────────
const DEFAULT_PROCS = [
    { id:1, name:'P1', arrival:0, burst:8, priority:3 },
    { id:2, name:'P2', arrival:1, burst:4, priority:1 },
    { id:3, name:'P3', arrival:2, burst:9, priority:2 },
    { id:4, name:'P4', arrival:3, burst:5, priority:4 },
    { id:5, name:'P5', arrival:4, burst:2, priority:5 },
];

// ── Workload presets ────────────────────────────────────────
const PRESETS = {
    cpu: [
        { id:1, name:'P1', arrival:0,  burst:12, priority:2 },
        { id:2, name:'P2', arrival:2,  burst:10, priority:3 },
        { id:3, name:'P3', arrival:4,  burst:8,  priority:1 },
        { id:4, name:'P4', arrival:6,  burst:15, priority:4 },
    ],
    io: [
        { id:1, name:'P1', arrival:0, burst:2, priority:1 },
        { id:2, name:'P2', arrival:0, burst:3, priority:2 },
        { id:3, name:'P3', arrival:1, burst:1, priority:3 },
        { id:4, name:'P4', arrival:2, burst:2, priority:1 },
        { id:5, name:'P5', arrival:3, burst:1, priority:2 },
    ],
    mixed: [
        { id:1, name:'P1', arrival:0, burst:8,  priority:2 },
        { id:2, name:'P2', arrival:1, burst:2,  priority:1 },
        { id:3, name:'P3', arrival:2, burst:12, priority:3 },
        { id:4, name:'P4', arrival:3, burst:3,  priority:1 },
        { id:5, name:'P5', arrival:5, burst:6,  priority:2 },
    ],
};

// ── Dispatch ────────────────────────────────────────────────
function runAlgo(algo, procs, params) {
    if (!procs.length) return { gantt: [], metrics: {} };
    switch (algo) {
        case 'FIFO':     return runFIFO(procs);
        case 'SJF':      return runSJF(procs);
        case 'RR':       return runRR(procs, params.q || 2);
        case 'Priority': return runPriority(procs);
        case 'MLFQ':     return runMLFQ(procs, [params.q1 || 2, params.q2 || 4, params.q3 || 8], params.boost || 20);
        case 'CFS':      return runCFS(procs);
        default:         return runFIFO(procs);
    }
}

function calcAvg(metrics, procs) {
    const ids = procs.map(p => p.id).filter(id => metrics[id]);
    if (!ids.length) return { r: 0, w: 0, t: 0 };
    const n = ids.length;
    return {
        r: ids.reduce((s, id) => s + (metrics[id].response || 0), 0) / n,
        w: ids.reduce((s, id) => s + (metrics[id].waiting || 0), 0) / n,
        t: ids.reduce((s, id) => s + (metrics[id].turnaround || 0), 0) / n,
    };
}

// ── Main Component ───────────────────────────────────────────
export default function App() {
    const [procs, setProcs]     = useState(DEFAULT_PROCS);
    const [algo, setAlgo]       = useState('FIFO');
    const [params, setParams]   = useState({ q:2, q1:2, q2:4, q3:8, boost:20 });
    const [tab, setTab]         = useState('sim');
    const [nextId, setNextId]   = useState(6);
    const [newP, setNewP]       = useState({ name:'', arrival:0, burst:4, priority:1 });
    const [playT, setPlayT]     = useState(null);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef(null);

    const { gantt, metrics } = useMemo(() => runAlgo(algo, procs, params), [algo, procs, params]);
    const maxT  = useMemo(() => Math.max(...gantt.map(g => g.end), 1), [gantt]);
    const stats = useMemo(() => calcAvg(metrics, procs), [metrics, procs]);

    const allStats = useMemo(() =>
        ['FIFO','SJF','RR','Priority','MLFQ','CFS'].map(a => {
            const { metrics: m } = runAlgo(a, procs, params);
            return { algo: a, ...calcAvg(m, procs) };
        }), [procs, params]);

    const dispT    = playT ?? maxT;
    const visGantt = gantt.filter(g => g.start < dispT);

    useEffect(() => {
        if (playing) {
            timerRef.current = setInterval(() => {
                setPlayT(t => {
                    const nt = (t ?? 0) + 1;
                    if (nt >= maxT) { setPlaying(false); return maxT; }
                    return nt;
                });
            }, 180);
        } else clearInterval(timerRef.current);
        return () => clearInterval(timerRef.current);
    }, [playing, maxT]);

    const play  = () => { if ((playT ?? maxT) >= maxT) setPlayT(0); setPlaying(true); };
    const pause = () => setPlaying(false);
    const reset = () => { setPlayT(0); setPlaying(false); };
    const full  = () => { setPlayT(null); setPlaying(false); };

    const addProc = () => {
        if (!newP.name.trim()) return;
        setProcs(ps => [...ps, { id: nextId, ...newP }]);
        setNextId(n => n + 1);
        setNewP({ name:'', arrival:0, burst:4, priority:1 });
    };

    // ── Styles ──────────────────────────────────────────────
    const s = {
        btn: (active) => ({
            padding: '5px 13px', borderRadius: 8,
            border: `1px solid ${active ? '#888' : '#ddd'}`,
            background: active ? '#f0f0f0' : 'transparent',
            cursor: 'pointer', fontSize: 13,
            fontWeight: active ? 600 : 400,
        }),
        tab: (active) => ({
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: active ? 600 : 400,
            borderBottom: active ? '2px solid #333' : '2px solid transparent',
        }),
        card: { background: '#f8f8f8', borderRadius: 8, padding: '12px 16px' },
        th: { padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#666', borderBottom: '1px solid #eee', fontSize: 12 },
        td: { padding: '7px 10px', fontSize: 13 },
    };

    const timeAxis = () => {
        const step = Math.max(1, Math.ceil(maxT / 14));
        return Array.from({ length: maxT + 1 }, (_, i) => i).filter(i => i % step === 0 || i === maxT);
    };

    const ALGO_DESC = {
        FIFO:     'First In, First Out — processes run in arrival order, non-preemptive.',
        SJF:      'Shortest Job First — picks the ready process with the smallest burst time, non-preemptive.',
        RR:       'Round Robin — each process gets a fixed time quantum; preemptive and fair.',
        Priority: 'Priority scheduling — lower number = higher priority, non-preemptive.',
        MLFQ:     'Multi-Level Feedback Queue — 3 queues with decreasing priority; new jobs start at top. Anti-gaming via priority boost.',
        CFS:      'Linux CFS — tracks virtual runtime (vruntime); always schedules the process with lowest vruntime. Fair, weighted by priority.',
    };

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: 860, margin: '0 auto', padding: '24px 16px', color: '#111' }}>

            {/* Header */}
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>CPU Scheduler Simulator</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px' }}>
                Team AkAsMaDiAM · 6 algorithms · Gantt visualization · Metrics comparison
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 24 }}>
                {[['sim','Simulator'],['compare','Compare all'],['workload','Workload']].map(([t, l]) => (
                    <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{l}</button>
                ))}
            </div>

            {/* ═══ SIMULATOR ═══════════════════════════════════════ */}
            {tab === 'sim' && <>
                {/* Algorithm buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {['FIFO','SJF','RR','Priority','MLFQ','CFS'].map(a => (
                        <button key={a} style={s.btn(algo === a)} onClick={() => setAlgo(a)}>{a}</button>
                    ))}
                </div>

                {/* Algorithm description */}
                <div style={{ fontSize: 12, color: '#555', marginBottom: 16, padding: '8px 12px', border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
                    {ALGO_DESC[algo]}
                </div>

                {/* Parameters */}
                {algo === 'RR' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 13 }}>
                        <span style={{ color: '#666' }}>Time quantum</span>
                        <input type="range" min={1} max={10} step={1} value={params.q}
                               onChange={e => setParams(p => ({ ...p, q: +e.target.value }))} style={{ width: 120 }} />
                        <span style={{ fontWeight: 600, minWidth: 20 }}>{params.q}</span>
                    </div>
                )}
                {algo === 'MLFQ' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 13, flexWrap: 'wrap' }}>
                        {[['Q1 quantum','q1',1,8],['Q2 quantum','q2',2,16],['Boost interval','boost',10,60]].map(([l, k, mn, mx]) => (
                            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#666' }}>{l}</span>
                                <input type="range" min={mn} max={mx} step={1} value={params[k]}
                                       onChange={e => setParams(p => ({ ...p, [k]: +e.target.value }))} style={{ width: 80 }} />
                                <span style={{ fontWeight: 600, minWidth: 20 }}>{params[k]}</span>
                            </label>
                        ))}
                    </div>
                )}

                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
                    {[['Avg response time', stats.r],['Avg waiting time', stats.w],['Avg turnaround time', stats.t]].map(([l, v]) => (
                        <div key={l} style={s.card}>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{l}</div>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{v.toFixed(1)}</div>
                        </div>
                    ))}
                </div>

                {/* Gantt chart */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#666' }}>
              Gantt chart &nbsp;<strong>t = {dispT}</strong> / {maxT}
            </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={s.btn(false)} onClick={reset}>↩ Reset</button>
                            <button style={s.btn(playing)} onClick={playing ? pause : play}>{playing ? '⏸ Pause' : '▶ Play'}</button>
                            <button style={s.btn(playT === null)} onClick={full}>Full</button>
                        </div>
                    </div>

                    <div style={{ paddingLeft: 32 }}>
                        {procs.map(p => {
                            const segs = visGantt.filter(g => g.pid === p.id);
                            return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <span style={{ width: 24, flexShrink: 0, fontSize: 12, color: '#666', textAlign: 'right' }}>{p.name}</span>
                                    <div style={{ flex: 1, height: 26, position: 'relative', background: '#f0f0f0', borderRadius: 4 }}>
                                        {segs.map((seg, i) => {
                                            const left  = seg.start / maxT * 100;
                                            const right = Math.min(seg.end, dispT) / maxT * 100;
                                            const w = right - left;
                                            if (w <= 0) return null;
                                            const opacity = seg.ql !== undefined ? [1, 0.7, 0.45][seg.ql] ?? 0.4 : 1;
                                            return (
                                                <div key={i}
                                                     title={`${p.name} t=${seg.start}–${seg.end}${seg.ql !== undefined ? ` Q${seg.ql+1}` : ''}`}
                                                     style={{ position: 'absolute', left: `${left}%`, width: `${w}%`, top: 0, height: '100%',
                                                         background: col(p.id), opacity, borderRadius: 4,
                                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                         fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.95)',
                                                         overflow: 'hidden', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                                                    {w > 7 ? `${seg.start}–${Math.min(seg.end, dispT)}` : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time axis */}
                    <div style={{ paddingLeft: 56, position: 'relative', height: 16, marginTop: 4 }}>
                        {timeAxis().map(t => (
                            <span key={t} style={{ position: 'absolute', left: `${t / maxT * 100}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#999' }}>{t}</span>
                        ))}
                    </div>
                    {algo === 'MLFQ' && (
                        <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Opacity = queue level: Q1 (full), Q2 (medium), Q3 (faded)</p>
                    )}
                </div>

                {/* Per-process metrics table */}
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Process metrics</div>
                <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ background: '#f8f8f8' }}>
                            {['Process','Arrival','Burst','Priority','Response','Waiting','Turnaround'].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {procs.map(p => {
                            const m = metrics[p.id] || {};
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={s.td}>
                                        <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:col(p.id), marginRight:6 }}/>
                                        {p.name}
                                    </td>
                                    <td style={s.td}>{p.arrival}</td>
                                    <td style={s.td}>{p.burst}</td>
                                    <td style={s.td}>{p.priority}</td>
                                    <td style={s.td}>{m.response ?? '—'}</td>
                                    <td style={s.td}>{m.waiting ?? '—'}</td>
                                    <td style={{ ...s.td, fontWeight: 600 }}>{m.turnaround ?? '—'}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </>}

            {/* ═══ COMPARE ════════════════════════════════════════ */}
            {tab === 'compare' && <>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>All algorithms on the same workload — lower is better.</p>

                <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ background: '#f8f8f8' }}>
                            {['Algorithm','Avg Response','Avg Waiting','Avg Turnaround'].map(h => <th key={h} style={s.th}>{h}</th>)}
                        </tr>
                        </thead>
                        <tbody>
                        {allStats.map(r => (
                            <tr key={r.algo} style={{ borderBottom: '1px solid #f0f0f0', background: r.algo === algo ? '#f5f5f5' : 'transparent' }}>
                                <td style={{ ...s.td, fontWeight: r.algo === algo ? 700 : 400 }}>
                                    {r.algo}
                                    {r.algo === algo && <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>← current</span>}
                                </td>
                                <td style={s.td}>{r.r.toFixed(2)}</td>
                                <td style={s.td}>{r.w.toFixed(2)}</td>
                                <td style={{ ...s.td, fontWeight: 600 }}>{r.t.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {[['Avg turnaround time', r => r.t],['Avg waiting time', r => r.w],['Avg response time', r => r.r]].map(([label, fn]) => {
                    const mx = Math.max(...allStats.map(fn), 0.1);
                    return (
                        <div key={label} style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{label}</div>
                            {allStats.map(r => (
                                <div key={r.algo} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <span style={{ width: 56, fontSize: 12, color: '#666', textAlign: 'right', flexShrink: 0 }}>{r.algo}</span>
                                    <div style={{ flex: 1, height: 18, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${fn(r) / mx * 100}%`, height: '100%', background: r.algo === algo ? '#378ADD' : '#B5D4F4', borderRadius: 3 }} />
                                    </div>
                                    <span style={{ width: 32, fontSize: 12, fontWeight: r.algo === algo ? 700 : 400, flexShrink: 0 }}>{fn(r).toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </>}

            {/* ═══ WORKLOAD ════════════════════════════════════════ */}
            {tab === 'workload' && <>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Presets</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[['cpu','CPU-bound'],['io','I/O-bound'],['mixed','Mixed']].map(([t, l]) => (
                            <button key={t} style={s.btn(false)} onClick={() => { setProcs(PRESETS[t]); setNextId(6); }}>{l}</button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Processes ({procs.length})</div>
                    {procs.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, padding: '8px 12px', border: '1px solid #eee', borderRadius: 8, fontSize: 13 }}>
                            <span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:col(p.id), flexShrink:0 }}/>
                            <span style={{ width: 28, fontWeight: 600 }}>{p.name}</span>
                            <span style={{ color: '#666' }}>arrival: {p.arrival}</span>
                            <span style={{ color: '#666' }}>burst: {p.burst}</span>
                            <span style={{ color: '#666' }}>priority: {p.priority}</span>
                            <button onClick={() => setProcs(ps => ps.filter(x => x.id !== p.id))}
                                    style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#E24B4A', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                    ))}
                </div>

                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Add process</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="text" placeholder="Name" value={newP.name}
                               onChange={e => setNewP(p => ({ ...p, name: e.target.value }))}
                               onKeyDown={e => e.key === 'Enter' && addProc()}
                               style={{ width: 70, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                        {[['Arrival',0,30,'arrival'],['Burst',1,30,'burst'],['Priority',1,10,'priority']].map(([l, mn, mx, k]) => (
                            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                <span style={{ color: '#666' }}>{l}</span>
                                <input type="number" min={mn} max={mx} value={newP[k]}
                                       onChange={e => setNewP(p => ({ ...p, [k]: +e.target.value }))}
                                       style={{ width: 52, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                            </label>
                        ))}
                        <button style={{ ...s.btn(false), padding: '5px 14px' }} onClick={addProc}>+ Add</button>
                    </div>
                </div>
            </>}
        </div>
    );
}
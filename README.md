# CPU Scheduler Simulator

A visual, interactive simulator of classic CPU scheduling algorithms built with React.  
Final project for Computer Architecture and Operating Systems course.

**Team:** AkAsMaDiAM

## Team & Contributions

| Name | Algorithm | File |
|------|-----------|------|
| Akzhol Khassengaziyev | FIFO, SJF | `src/algorithms/fifo.js`|
| Tastan Asylkhan | Round Robin | `src/algorithms/roundRobin.js` |
| Ibrash Madiyar | Priority Scheduling | `src/algorithms/priority.js` |
| Dildakhan Didar | MLFQ | `src/algorithms/mlfq.js` |
| Jiyembayev Amir | CFS + Setup + README | `src/algorithms/cfs.js` |

## Algorithms Implemented

- **FIFO** — First In First Out, non-preemptive, processes run in arrival order
- **SJF** — Shortest Job First, picks the ready process with the smallest burst time
- **Round Robin** — preemptive, each process gets a configurable time quantum
- **Priority** — non-preemptive, lower number = higher priority
- **MLFQ** — Multi-Level Feedback Queue, 3 queues with priority boost and anti-gaming
- **CFS** — Linux Completely Fair Scheduler, vruntime-based weighted fairness

## Features

- Gantt chart with live step-by-step playback
- Per-process metrics: response time, waiting time, turnaround time
- Compare all 6 algorithms side by side on the same workload
- Workload presets: CPU-bound, I/O-bound, mixed
- Configurable parameters: RR quantum, MLFQ boost interval and queue quantums

## How to Run

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Project Structure

```
src/
  algorithms/
    fifo.js          — FIFO and SJF (Akzhol)
    roundRobin.js    — Round Robin (Tastan)
    priority.js      — Priority Scheduling (Madiyar)
    mlfq.js          — MLFQ (Didar)
    cfs.js           — Linux CFS (Amir)
  App.jsx            — UI, Gantt chart, metrics
README.md
AI_USAGE.md
```

## Repository

https://github.com/jeeamir/cpu-scheduler-simulator

## Presentation

[https://canva.link/406avwucco4u90l]

## AI Usage

See [AI_USAGE.md](./AI_USAGE.md)
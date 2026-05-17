# AI Usage

**Team:** AkAsMaDiAM  
**Project:** CPU Scheduler Simulator

This project was built using AI tools as required by the course.

## Tools used

- **Claude (claude.ai)** — architecture design, algorithm implementation, UI component

## How we used AI

### Architecture and initial setup
Prompt used:
> "I need to build a CPU scheduler simulator for my OS course. It needs to implement FIFO, SJF, Round Robin, Priority, MLFQ and Linux CFS. It should have a Gantt chart visualization, per-process metrics (response time, waiting time, turnaround) and a workload generator. Build it as a React component."

### Algorithm implementation
Each team member used Claude to help implement and understand their algorithm. Example prompt for Round Robin:
> "Implement Round Robin CPU scheduling in JavaScript. Input: array of processes with id, name, arrival, burst. Output: gantt array of {pid, start, end} and metrics object with response, waiting, turnaround per process. Handle the case where the CPU is idle between process arrivals."

### Debugging
When the MLFQ priority boost logic had a bug where processes were being duplicated across queues, we used:
> "My MLFQ implementation duplicates processes after a priority boost. Here is the code: [code]. What is wrong?"

## What we learned

Using AI to generate code still requires understanding what the code does — every team member had to be able to explain their algorithm at the defense. AI helped us iterate faster and catch bugs, but the conceptual understanding came from reading and testing the output ourselves.
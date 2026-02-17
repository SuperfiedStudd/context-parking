import { Project } from '@/types';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Square APM Application Strategy',
    objective: 'Craft a compelling APM application for Square, emphasizing infrastructure scaling experience and product-led growth thinking.',
    chosenDirection: 'Lead with the distributed systems narrative — highlight tracing and observability work from previous roles.',
    strategicForks: [
      'Developer tooling angle (SDKs, APIs, DX) vs Distributed systems narrative',
      'Cross-functional PM experience vs Technical depth positioning',
      'Data pipeline expertise vs Observability-first approach',
    ],
    deferredDecisions: [
      'Revisit data pipeline angle after initial application feedback',
    ],
    drafts: [
      {
        id: 'draft-1a',
        title: 'Cover Letter — Observability Focus',
        content: 'Dear Square Hiring Team,\n\nI\'m excited to apply for the APM role. My background in distributed tracing and observability tooling at scale directly maps to the challenges your platform team faces...',
        status: 'Ready',
        reminderAt: daysFromNow(1),
      },
      {
        id: 'draft-1b',
        title: 'Follow-up Email Template',
        content: 'Hi [Name],\n\nThank you for the conversation last week. I wanted to share a quick summary of the points we discussed regarding observability platform design...',
        status: 'Draft',
      },
    ],
    nextAction: 'Review cover letter tone, then submit application by Wednesday.',
    lastActiveAt: hoursAgo(3),
    reminderAt: daysFromNow(1),
    activityLog: [
      { id: 'a1', type: 'created', description: 'Project created', timestamp: daysAgo(5) },
      { id: 'a2', type: 'updated', description: 'Added strategic forks', timestamp: daysAgo(4) },
      { id: 'a3', type: 'draft_status_changed', description: 'Cover letter marked as Ready', timestamp: daysAgo(1) },
      { id: 'a4', type: 'reminder_set', description: 'Reminder set for tomorrow', timestamp: hoursAgo(3) },
    ],
  },
  {
    id: 'proj-2',
    title: 'AI Evals Orchestration Platform',
    objective: 'Design and spec an evaluation orchestration layer that standardizes how teams run, compare, and track LLM evals across environments.',
    chosenDirection: 'Build a lightweight orchestrator that wraps existing eval frameworks (Braintrust, Evalica) with a unified config and reporting layer.',
    strategicForks: [
      'Full custom eval framework vs Wrapper/orchestrator approach',
      'Plugin architecture (teams bring own runners) vs Unified adapter layer',
    ],
    deferredDecisions: [],
    drafts: [
      {
        id: 'draft-2a',
        title: 'Technical Spec — V1 Architecture',
        content: '## AI Evals Orchestrator — V1 Spec\n\n### Overview\nA thin orchestration layer that provides:\n- Unified YAML config for eval suites\n- Parallel execution across eval backends\n- Standardized result schema and diffing\n\n### Architecture\nRunner → Adapter → Backend (Braintrust/Custom)\nResults → Normalizer → Store → Dashboard',
        status: 'Draft',
      },
    ],
    nextAction: 'Finalize adapter interface spec and share with platform team for feedback.',
    lastActiveAt: daysAgo(2),
    activityLog: [
      { id: 'a5', type: 'created', description: 'Project created', timestamp: daysAgo(10) },
      { id: 'a6', type: 'updated', description: 'Chose orchestrator direction over full custom', timestamp: daysAgo(7) },
      { id: 'a7', type: 'context_generated', description: 'Context prompt generated and copied', timestamp: daysAgo(2) },
    ],
  },
  {
    id: 'proj-3',
    title: 'Context Parking V1 Build Plan',
    objective: 'Ship a polished V1 of Context Parking — the tool for capturing and resuming AI chat context deterministically.',
    chosenDirection: 'Start as a client-side SPA with localStorage, validate the UX, then add backend persistence later.',
    strategicForks: [
      'Browser extension from day one vs SPA-first approach',
      'Server-first with real-time sync vs Client-side with later migration',
      'CLI tool with chat API integration vs Web-based UI',
    ],
    deferredDecisions: [
      'Revisit server-first architecture after validating SPA UX patterns',
    ],
    drafts: [
      {
        id: 'draft-3a',
        title: 'Product Brief',
        content: '## Context Parking — Product Brief\n\n**Problem:** Users lose context when switching between AI chat sessions. Resuming requires manual re-explanation.\n\n**Solution:** A structured capture tool that parks context and generates deterministic resume prompts.\n\n**Key Insight:** "One arrow, two birds" — helps humans avoid cognitive reload AND gives AI better context faster.',
        status: 'Sent',
      },
      {
        id: 'draft-3b',
        title: 'V1 Feature Scope',
        content: '### V1 Scope\n- Project CRUD with structured fields\n- Capture flow (simulated extension)\n- Context prompt generator with inclusion toggles\n- Activity timeline\n- localStorage persistence\n- Seed data for demo',
        status: 'Ready',
      },
    ],
    nextAction: 'Complete implementation and test all flows end-to-end.',
    lastActiveAt: hoursAgo(1),
    activityLog: [
      { id: 'a8', type: 'created', description: 'Project created', timestamp: daysAgo(3) },
      { id: 'a9', type: 'draft_status_changed', description: 'Product brief marked as Sent', timestamp: daysAgo(2) },
      { id: 'a10', type: 'draft_status_changed', description: 'V1 Feature Scope marked as Ready', timestamp: daysAgo(1) },
      { id: 'a11', type: 'updated', description: 'Updated next action', timestamp: hoursAgo(1) },
    ],
  },
];

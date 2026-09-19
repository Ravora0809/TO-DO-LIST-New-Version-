import {
  ProjectIdea,
  ProjectStage,
  ProjectStageId,
  ProjectBug,
  StageStatus,
} from '../types';

const STORAGE_KEY_PROJECTS = 'productivity_idea_projects_v1';
const STORAGE_KEY_BUGS = 'productivity_idea_bugs_v1';
const STORAGE_KEY_ACTIVE_PROJECT = 'productivity_active_project_id_v1';

export function createStandardStages(): ProjectStage[] {
  return [
    {
      id: 'srs',
      name: 'Software Requirements Specification (SRS)',
      shortName: 'SRS & Scope',
      stepNumber: 1,
      description: 'Define core problem, target audience, functional & non-functional requirements, and user stories.',
      status: 'completed',
      keyDeliverables: ['Problem Statement', 'Target Persona', 'Core User Stories', 'Non-Functional Specs'],
      notes: 'SRS approved with focus on clean zero-latency interactions and accessible responsive design.',
      items: [
        { id: 'srs-1', title: 'Draft Executive Summary & Problem Statement', completed: true, notes: 'Clear value proposition drafted' },
        { id: 'srs-2', title: 'Map Target User Personas & Primary Use Cases', completed: true },
        { id: 'srs-3', title: 'Define Functional Requirements & Scope Boundaries', completed: true, notes: 'Must-have vs nice-to-have prioritized' },
        { id: 'srs-4', title: 'Specify Security, Latency & Accessibility Constraints', completed: true },
        { id: 'srs-5', title: 'User Sign-off on SRS Scope Document', completed: true },
      ],
    },
    {
      id: 'architecture',
      name: 'System Architecture & Tech Stack',
      shortName: 'Architecture',
      stepNumber: 2,
      description: 'Formulate system topology, database models, API communication protocols, and technology selections.',
      status: 'completed',
      keyDeliverables: ['Architecture Diagram', 'Database Schema', 'API Contracts', 'Security Model'],
      notes: 'Opted for React 19 + Tailwind CSS + Client Cache + IndexedDB/LocalStorage for offline instant speed.',
      items: [
        { id: 'arch-1', title: 'Select Frontend & State Management Architecture', completed: true },
        { id: 'arch-2', title: 'Design Data Schema & Entity-Relationship Model', completed: true },
        { id: 'arch-3', title: 'Document REST / WebSocket API Specifications', completed: true },
        { id: 'arch-4', title: 'Verify Auth, Token Encryption & Storage Policies', completed: true },
        { id: 'arch-5', title: 'Create Visual Architecture Map in Whiteboard', completed: true },
      ],
    },
    {
      id: 'wireframe',
      name: 'UI/UX Design & Screen Wireframes',
      shortName: 'Wireframing',
      stepNumber: 3,
      description: 'Design user journeys, responsive screen layouts, typography, and reusable component tokens.',
      status: 'completed',
      keyDeliverables: ['User Flow Diagram', 'Low-Fidelity Wireframes', 'Design System Tokens', 'Responsive Layouts'],
      notes: 'Clean neutral palette with high contrast and AA accessibility verified across mobile and desktop.',
      items: [
        { id: 'wf-1', title: 'Sketch User Navigation Flow & Screen Hierarchy', completed: true },
        { id: 'wf-2', title: 'Create Low-Fidelity Wireframes for Mobile & Desktop', completed: true },
        { id: 'wf-3', title: 'Establish Typographic Hierarchy & Spacing Tokens', completed: true },
        { id: 'wf-4', title: 'Define Icon Set & Interactive State Micro-animations', completed: true },
        { id: 'wf-5', title: 'Review Accessibility (Color Contrast & Touch Targets)', completed: true },
      ],
    },
    {
      id: 'prototype',
      name: 'Interactive Prototype & MVP Validation',
      shortName: 'Prototype',
      stepNumber: 4,
      description: 'Assemble an interactive clickable prototype to validate user experience, test core workflows, and refine features.',
      status: 'in_progress',
      keyDeliverables: ['Clickable Prototype Flow', 'User Usability Feedback', 'Performance Benchmark', 'MVP Scope Polish'],
      notes: 'Currently validating user flow with real interactions. Identified 3 UI bugs in testing phase.',
      items: [
        { id: 'proto-1', title: 'Assemble Clickable Prototype Screens with Dynamic State', completed: true },
        { id: 'proto-2', title: 'Test Core User Journey from Ideation to Task Completion', completed: true },
        { id: 'proto-3', title: 'Conduct Usability Walkthrough with Target Users', completed: true },
        { id: 'proto-4', title: 'Triage & Log Prototype Bugs in the Bug Tracker', completed: true },
        { id: 'proto-5', title: 'Finalize MVP Scope Adjustments Based on Prototype Feedback', completed: false, notes: 'Target review meeting Friday' },
      ],
    },
    {
      id: 'development',
      name: 'Core Development & Implementation',
      shortName: 'Development',
      stepNumber: 5,
      description: 'Build production frontend components, state hydration, offline sync, and business logic.',
      status: 'in_progress',
      keyDeliverables: ['Production Components', 'State Management', 'Local Persistence', 'PWA Service Worker'],
      notes: 'Initial sprint active. 60% of foundational components completed.',
      items: [
        { id: 'dev-1', title: 'Scaffold Component Hierarchy & Shared Types', completed: true },
        { id: 'dev-2', title: 'Implement Interactive Whiteboard Canvas & Tools', completed: true },
        { id: 'dev-3', title: 'Implement SRS-to-Prototype Roadmap & Milestones', completed: true },
        { id: 'dev-4', title: 'Implement Bug Fixing Notes & Severity Manager', completed: true },
        { id: 'dev-5', title: 'Optimize Bundle Size & Fast First Contentful Paint', completed: false },
      ],
    },
    {
      id: 'testing',
      name: 'Quality Assurance & Bug Testing',
      shortName: 'QA & Testing',
      stepNumber: 6,
      description: 'Perform unit, integration, cross-browser, security, and edge-case testing.',
      status: 'not_started',
      keyDeliverables: ['QA Test Suite', 'Security Audit', 'Cross-browser Matrix', 'Bug Fix Verification'],
      notes: 'Scheduled to commence immediately upon completion of sprint development.',
      items: [
        { id: 'qa-1', title: 'Write Unit Tests for Calculation & State Logic', completed: false },
        { id: 'qa-2', title: 'Execute Cross-Browser Matrix (Chrome, Safari, Firefox, Edge)', completed: false },
        { id: 'qa-3', title: 'Simulate Offline Mode & Network Reconnection', completed: false },
        { id: 'qa-4', title: 'Verify Resolved Bug Notes with Regression Testing', completed: false },
        { id: 'qa-5', title: 'Lighthouse Performance & Security Audit Score > 95', completed: false },
      ],
    },
    {
      id: 'deployment',
      name: 'Production Deployment & Launch',
      shortName: 'Deployment',
      stepNumber: 7,
      description: 'Deploy to Cloud Run / edge CDN, configure custom domain, setup monitoring, and launch.',
      status: 'not_started',
      keyDeliverables: ['Production Live Deployment', 'Monitoring & Telemetry', 'Launch Announcement', 'Documentation'],
      notes: 'Cloud infrastructure ready for instant container deployment.',
      items: [
        { id: 'dep-1', title: 'Configure Production Build & Asset Minification', completed: false },
        { id: 'dep-2', title: 'Deploy Container to Cloud Run Ingress', completed: false },
        { id: 'dep-3', title: 'Verify SSL Certificate & Custom Domain DNS', completed: false },
        { id: 'dep-4', title: 'Enable Error Telemetry & Usage Analytics', completed: false },
        { id: 'dep-5', title: 'Publish Release Notes & Product Launch', completed: false },
      ],
    },
  ];
}

export const INITIAL_PROJECTS: ProjectIdea[] = [
  {
    id: 'proj-devflow',
    title: 'DevFlow AI - Developer Ideation & Architecture Suite',
    tagline: 'All-in-one ideation whiteboard, SRS planner, and issue tracker for modern software teams',
    category: 'Developer Tools',
    priority: 'high',
    targetDate: '2026-10-15',
    problemStatement:
      'Engineers and product creators frequently lose momentum transitioning from abstract brainstorming into structured SRS requirements, prototypes, and bug triage. Context is fragmented across disparate apps.',
    targetAudience:
      'Software developers, engineering leads, system architects, and technical product managers.',
    currentStage: 'prototype',
    stages: createStandardStages(),
    whiteboardId: 'board-architecture',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-zenith',
    title: 'Zenith Health - Real-time Vital & Habit Sync',
    tagline: 'Holistic health tracking with smart biometric correlations and privacy-first local storage',
    category: 'Health & Wellness',
    priority: 'medium',
    targetDate: '2026-11-30',
    problemStatement:
      'Users lack unified visibility between their daily stress markers, sleep habits, and task velocity, leading to burnout without actionable early warnings.',
    targetAudience: 'Health-conscious professionals, athletes, and remote workers.',
    currentStage: 'wireframe',
    stages: (() => {
      const s = createStandardStages();
      s[0].status = 'completed';
      s[1].status = 'completed';
      s[2].status = 'in_progress';
      s[3].status = 'not_started';
      s[4].status = 'not_started';
      return s;
    })(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_BUGS: ProjectBug[] = [
  {
    id: 'bug-1',
    projectId: 'proj-devflow',
    title: 'Canvas shape coordinate misalignment on multi-touch pinch zoom',
    description:
      'When users pinch-zoom on touch screens, element boundary boxes experience a 12px offset relative to the SVG cursor position.',
    stageFound: 'prototype',
    severity: 'high',
    status: 'resolved',
    stepsToReproduce:
      '1. Open Whiteboard on iPad/tablet\n2. Add a rectangle shape\n3. Use two fingers to pinch-zoom to 150%\n4. Drag the rectangle with one finger',
    rootCause:
      'The clientX coordinate was transformed without accounting for the CSS zoom scale factor and pan transform matrix translation.',
    fixNotes:
      'Refactored screenToCanvasPoint helper to compute (clientX - rect.left - pan.x) / zoom before calculating delta.',
    createdAt: '2026-09-12T14:30:00Z',
    resolvedAt: '2026-09-13T10:15:00Z',
  },
  {
    id: 'bug-2',
    projectId: 'proj-devflow',
    title: 'SRS milestone checklist state reset on page refresh',
    description:
      'Checking off milestone items in Stage 1 did not immediately sync to the serialized LocalStorage payload if user closed the tab immediately.',
    stageFound: 'development',
    severity: 'medium',
    status: 'resolved',
    stepsToReproduce:
      '1. Go to Idea Planner -> SRS Stage\n2. Toggle 2 milestone items\n3. Immediately hit browser reload (Cmd+R)',
    rootCause:
      'A debounced save timer (500ms) had not flushed to storage before the beforeunload event fired.',
    fixNotes:
      'Replaced debounce with synchronous localStorage persist in the state dispatch handler, plus beforeunload safety flush.',
    createdAt: '2026-09-14T09:20:00Z',
    resolvedAt: '2026-09-14T11:45:00Z',
  },
  {
    id: 'bug-3',
    projectId: 'proj-devflow',
    title: 'Color picker dropdown clipped by sticky bottom navigation on small screens',
    description:
      'On viewport widths below 640px, the element styling drawer color picker popup extends below the viewport fold.',
    stageFound: 'prototype',
    severity: 'low',
    status: 'in_progress',
    stepsToReproduce:
      '1. Resize window to mobile width (<640px)\n2. Tap any shape on the whiteboard\n3. Open color palette dropdown in bottom toolbar',
    rootCause:
      'Fixed bottom margin was not computing safe-area-inset and mobile navigation height padding.',
    fixNotes:
      'Applying z-index elevation and flex-wrap with top-aligned popover positioning.',
    createdAt: '2026-09-15T16:00:00Z',
  },
  {
    id: 'bug-4',
    projectId: 'proj-devflow',
    title: 'Text element newline breaks losing formatting on SVG export',
    description:
      'Multi-line text annotations inside sticky notes render as a single continuous line when downloaded as PNG image.',
    stageFound: 'testing',
    severity: 'medium',
    status: 'open',
    stepsToReproduce:
      '1. Create a sticky note with 3 bulleted lines\n2. Click "Export PNG"\n3. Check exported PNG image',
    rootCause:
      'SVG <text> element lacks foreignObject or multi-line <tspan> coordinate offsets during canvas rasterization.',
    fixNotes:
      'Splitting text by newline and generating distinct <tspan dy="1.2em" x={x}> tags for every line.',
    createdAt: '2026-09-16T18:30:00Z',
  },
  {
    id: 'bug-5',
    projectId: 'proj-zenith',
    title: 'Health sensor Bluetooth reconnect timeout failing gracefully',
    description:
      'If heart rate BLE monitor disconnects abruptly, app hangs on reconnect polling without notifying the user.',
    stageFound: 'wireframe',
    severity: 'critical',
    status: 'open',
    stepsToReproduce:
      '1. Turn off Bluetooth on device during sync\n2. Check connection status modal',
    rootCause:
      'Promise rejection in Web Bluetooth navigator.bluetooth requestDevice was unhandled.',
    fixNotes:
      'Add try/catch block with fallback simulated heart rate and retry toast notification.',
    createdAt: '2026-09-15T11:00:00Z',
  },
];

export function getProjectIdeas(): ProjectIdea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      saveProjectIdeas(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load project ideas from storage', e);
  }
  return INITIAL_PROJECTS;
}

export function saveProjectIdeas(projects: ProjectIdea[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save project ideas', e);
  }
}

export function getActiveProjectId(): string {
  const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
  if (stored) return stored;
  return INITIAL_PROJECTS[0]?.id || 'proj-devflow';
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, id);
}

export function getProjectBugs(projectId?: string): ProjectBug[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUGS);
    let bugs = INITIAL_BUGS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        bugs = parsed;
      }
    } else {
      saveProjectBugs(INITIAL_BUGS);
    }
    if (projectId) {
      return bugs.filter((b) => b.projectId === projectId);
    }
    return bugs;
  } catch (e) {
    console.error('Failed to load project bugs', e);
    return INITIAL_BUGS;
  }
}

export function saveProjectBugs(bugs: ProjectBug[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUGS, JSON.stringify(bugs));
  } catch (e) {
    console.error('Failed to save project bugs', e);
  }
}

export function calculateProjectProgress(project: ProjectIdea): {
  totalMilestones: number;
  completedMilestones: number;
  percent: number;
  completedStages: number;
  currentStageIndex: number;
} {
  let totalMilestones = 0;
  let completedMilestones = 0;
  let completedStages = 0;

  project.stages.forEach((stage) => {
    if (stage.status === 'completed') {
      completedStages++;
    }
    stage.items.forEach((item) => {
      totalMilestones++;
      if (item.completed) {
        completedMilestones++;
      }
    });
  });

  const percent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const currentStageIndex = project.stages.findIndex((s) => s.id === project.currentStage);

  return {
    totalMilestones,
    completedMilestones,
    percent,
    completedStages,
    currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
  };
}

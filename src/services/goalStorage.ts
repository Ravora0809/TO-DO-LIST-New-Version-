import { TargetGoal } from '../types';

const STORAGE_KEY = 'ravora_target_goals';

export const generateSeedGoals = (): TargetGoal[] => {
  const today = new Date();
  
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'goal-1',
      title: 'Master Full-Stack AI System Architecture',
      tagline: 'Deep dive into microservices, vector search, and Gemini GenAI streaming agents.',
      category: 'Learning',
      priority: 'high',
      startDate: formatDate(-14),
      targetDate: formatDate(28),
      status: 'in_progress',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1-1',
          title: 'Master Advanced TypeScript 5.x & React 19 State Patterns',
          description: 'Type narrowing, template literal types, and concurrent UI rendering.',
          targetDate: formatDate(-10),
          estimatedHours: 12,
          actualHoursSpent: 14,
          completed: true,
          completedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          order: 1,
          notes: 'Completed all deep-dive exercises with 100% score.',
        },
        {
          id: 'step-1-2',
          title: 'Design Scalable Express & WebSocket Streaming Microservices',
          description: 'High-throughput event streaming, backpressure, and rate-limiting middleware.',
          targetDate: formatDate(-4),
          estimatedHours: 16,
          actualHoursSpent: 15,
          completed: true,
          completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          order: 2,
          notes: 'Achieved sub-10ms pipeline propagation on local benchmark.',
        },
        {
          id: 'step-1-3',
          title: 'Implement Multi-Modal Gemini GenAI Integration & RAG Pipeline',
          description: 'Streaming structured tool responses, semantic search with vector indexing.',
          targetDate: formatDate(7),
          targetTime: '18:00',
          estimatedHours: 20,
          actualHoursSpent: 8.5,
          completed: false,
          order: 3,
          notes: 'Right now working on embedding search index integration.',
        },
        {
          id: 'step-1-4',
          title: 'Containerize with Docker & Deploy on Cloud Run Cluster',
          description: 'Multi-stage production build, environment secrets, and automated CDN caching.',
          targetDate: formatDate(18),
          targetTime: '17:00',
          estimatedHours: 10,
          actualHoursSpent: 0,
          completed: false,
          order: 4,
        },
        {
          id: 'step-1-5',
          title: 'Conduct Security Auditing, Load Testing & Latency Optimization',
          description: 'Benchmark 5,000 req/sec and enforce strict Content-Security-Policy.',
          targetDate: formatDate(28),
          targetTime: '20:00',
          estimatedHours: 14,
          actualHoursSpent: 0,
          completed: false,
          order: 5,
        },
      ],
      stickyNotes: [
        {
          id: 'sn-1-1',
          content: 'Keep vector chunks under 512 tokens for optimal semantic lookup recall!',
          color: 'yellow',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          pinned: true,
        },
        {
          id: 'sn-1-2',
          content: 'Benchmark Cloud Run cold starts with min-instances=1 to avoid 2s latency spikes.',
          color: 'blue',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          pinned: false,
        },
      ],
    },
    {
      id: 'goal-2',
      title: 'Launch SaaS Beta App to First 100 Users',
      tagline: 'Ship MVP, activate billing integration, and run high-converting beta onboarding campaign.',
      category: 'Career',
      priority: 'high',
      startDate: formatDate(-20),
      targetDate: formatDate(12),
      status: 'in_progress',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-2-1',
          title: 'Finalize User Authentication, JWT Tokens & Stripe Billing',
          description: 'Subscription tiers, usage-based metering, and customer portal setup.',
          targetDate: formatDate(-12),
          estimatedHours: 18,
          actualHoursSpent: 16,
          completed: true,
          completedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
          order: 1,
        },
        {
          id: 'step-2-2',
          title: 'Complete Mobile-Responsive Dashboard UI & Dark Mode Polish',
          description: 'Eliminate layout shifts, fix 44px touch targets, and calibrate contrast.',
          targetDate: formatDate(-2),
          estimatedHours: 14,
          actualHoursSpent: 15.5,
          completed: true,
          completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          order: 2,
        },
        {
          id: 'step-2-3',
          title: 'Configure Telemetry, Error Logging & User Session Replay',
          description: 'Set up real-time crash alerting and conversion funnel analytics.',
          targetDate: formatDate(3),
          targetTime: '15:30',
          estimatedHours: 8,
          actualHoursSpent: 3.5,
          completed: false,
          order: 3,
        },
        {
          id: 'step-2-4',
          title: 'Draft Product Hunt & Tech Community Announcement Assets',
          description: 'Demo video GIF, 5 customer case slides, and concise feature bullet points.',
          targetDate: formatDate(8),
          targetTime: '12:00',
          estimatedHours: 12,
          actualHoursSpent: 0,
          completed: false,
          order: 4,
        },
        {
          id: 'step-2-5',
          title: 'Onboard 100 Active Beta Users & Review First Retention Cohort',
          description: 'Send personalized welcome emails and conduct 15-minute feedback calls.',
          targetDate: formatDate(12),
          targetTime: '19:00',
          estimatedHours: 25,
          actualHoursSpent: 0,
          completed: false,
          order: 5,
        },
      ],
      stickyNotes: [
        {
          id: 'sn-2-1',
          content: 'Offer first 50 beta power users lifetime 30% discount with promo code: BETAPIONEER',
          color: 'green',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          pinned: true,
        },
        {
          id: 'sn-2-2',
          content: 'Include 1-click in-app feedback modal on the main dashboard!',
          color: 'pink',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          pinned: false,
        },
      ],
    },
    {
      id: 'goal-3',
      title: 'Run a Sub-1:50 Half Marathon',
      tagline: 'Structured 12-week aerobic conditioning, nutrition balance, and pacing discipline.',
      category: 'Health',
      priority: 'medium',
      startDate: formatDate(-30),
      targetDate: formatDate(45),
      status: 'in_progress',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-3-1',
          title: 'Base Aerobic Phase: 35 km Weekly Mileage at Zone 2 Heart Rate',
          description: 'Build mitochondrial density without joint stress.',
          targetDate: formatDate(-15),
          estimatedHours: 24,
          actualHoursSpent: 26,
          completed: true,
          completedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          order: 1,
        },
        {
          id: 'step-3-2',
          title: 'Threshold Pace Blocks: 5x1km at 4:55/km Pace with Active Jog Recovery',
          description: 'Lactate threshold endurance sessions twice a week.',
          targetDate: formatDate(10),
          targetTime: '07:30',
          estimatedHours: 18,
          actualHoursSpent: 7,
          completed: false,
          order: 2,
        },
        {
          id: 'step-3-3',
          title: 'Dress Rehearsal: 18 km Long Run with Gel & Hydration Strategy',
          description: 'Simulate race day wake up, electrolytes, and shoe choice.',
          targetDate: formatDate(25),
          targetTime: '06:30',
          estimatedHours: 8,
          actualHoursSpent: 0,
          completed: false,
          order: 3,
        },
        {
          id: 'step-3-4',
          title: 'Taper Week & Official Race Day Sub-1:50 Execution',
          description: 'Carb load, reduce volume by 50%, and maintain smooth 5:10/km average.',
          targetDate: formatDate(45),
          targetTime: '07:00',
          estimatedHours: 10,
          actualHoursSpent: 0,
          completed: false,
          order: 4,
        },
      ],
      stickyNotes: [
        {
          id: 'sn-3-1',
          content: 'Drink 500ml water with sodium before 6 AM for long training runs.',
          color: 'orange',
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          pinned: true,
        },
      ],
    },
  ];
};

export const loadGoals = (): TargetGoal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = generateSeedGoals();
      saveGoals(seeds);
      return seeds;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load target goals:', error);
    return generateSeedGoals();
  }
};

export const saveGoals = (goals: TargetGoal[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to save target goals:', error);
  }
};

import { WhiteboardBoard, WhiteboardElement } from '../types';

const STORAGE_KEY_BOARDS = 'productivity_whiteboard_boards_v1';
const STORAGE_KEY_ACTIVE = 'productivity_whiteboard_active_id_v1';

export const INITIAL_WHITEBOARD_ELEMENTS: WhiteboardElement[] = [
  // System Architecture Diagram Elements
  {
    id: 'elem-client',
    type: 'rounded-rect',
    x: 80,
    y: 120,
    width: 170,
    height: 90,
    fill: '#e0f2fe', // sky-100
    stroke: '#0284c7', // sky-600
    strokeWidth: 2,
    text: 'Client Web & Mobile App\n(React + Tailwind + PWA)',
    textColor: '#0369a1',
    fontSize: 13,
    zIndex: 1,
  },
  {
    id: 'elem-gateway',
    type: 'diamond',
    x: 320,
    y: 105,
    width: 130,
    height: 120,
    fill: '#fef3c7', // amber-100
    stroke: '#d97706', // amber-600
    strokeWidth: 2,
    text: 'API Gateway &\nAuth Shield',
    textColor: '#b45309',
    fontSize: 12,
    zIndex: 2,
  },
  {
    id: 'elem-server',
    type: 'rectangle',
    x: 520,
    y: 120,
    width: 180,
    height: 90,
    fill: '#ede9fe', // violet-100
    stroke: '#7c3aed', // violet-600
    strokeWidth: 2,
    text: 'Core Business Logic\n& Background Workers',
    textColor: '#6d28d9',
    fontSize: 13,
    zIndex: 3,
  },
  {
    id: 'elem-db',
    type: 'cylinder',
    x: 760,
    y: 110,
    width: 150,
    height: 110,
    fill: '#dcfce7', // green-100
    stroke: '#16a34a', // green-600
    strokeWidth: 2,
    text: 'Main Database &\nEncrypted Cache',
    textColor: '#15803d',
    fontSize: 13,
    zIndex: 4,
  },
  // Connectors / Arrows
  {
    id: 'elem-arrow-1',
    type: 'arrow',
    x: 250,
    y: 165,
    width: 70,
    height: 0,
    fill: '#0284c7',
    stroke: '#0284c7',
    strokeWidth: 2,
    text: 'HTTPS / REST',
    textColor: '#0369a1',
    fontSize: 11,
    zIndex: 5,
  },
  {
    id: 'elem-arrow-2',
    type: 'arrow',
    x: 450,
    y: 165,
    width: 70,
    height: 0,
    fill: '#7c3aed',
    stroke: '#7c3aed',
    strokeWidth: 2,
    text: 'Verified JWT',
    textColor: '#6d28d9',
    fontSize: 11,
    zIndex: 6,
  },
  {
    id: 'elem-arrow-3',
    type: 'arrow',
    x: 700,
    y: 165,
    width: 60,
    height: 0,
    fill: '#16a34a',
    stroke: '#16a34a',
    strokeWidth: 2,
    text: 'DQL / Pool',
    textColor: '#15803d',
    fontSize: 11,
    zIndex: 7,
  },
  // Sticky Notes for Idea Brainstorming
  {
    id: 'elem-sticky-1',
    type: 'sticky',
    x: 100,
    y: 280,
    width: 190,
    height: 150,
    fill: '#fef08a', // yellow-200
    stroke: '#eab308',
    strokeWidth: 1,
    text: '💡 UI / UX Priority:\n- Offline-first cache\n- Smooth touch drag & gestures\n- Dark mode support\n- Instant voice feedback',
    textColor: '#713f12',
    fontSize: 12,
    zIndex: 8,
  },
  {
    id: 'elem-sticky-2',
    type: 'sticky',
    x: 350,
    y: 280,
    width: 190,
    height: 150,
    fill: '#fbcfe8', // pink-200
    stroke: '#ec4899',
    strokeWidth: 1,
    text: '🔒 Security & SRS Notes:\n- Zero plaintext secrets\n- Rate limiting on API\n- Input sanitization\n- Automated test coverage',
    textColor: '#831843',
    fontSize: 12,
    zIndex: 9,
  },
  {
    id: 'elem-sticky-3',
    type: 'sticky',
    x: 600,
    y: 280,
    width: 190,
    height: 150,
    fill: '#bbf7d0', // emerald-200
    stroke: '#22c55e',
    strokeWidth: 1,
    text: '🚀 Prototype Milestones:\n- Clickable wireframe done\n- Stage 4 user test passing\n- Bug triage verified\n- Fast <100ms render target',
    textColor: '#14532d',
    fontSize: 12,
    zIndex: 10,
  },
  // Cloud service icon element
  {
    id: 'elem-cloud',
    type: 'cloud',
    x: 540,
    y: 30,
    width: 140,
    height: 70,
    fill: '#f1f5f9',
    stroke: '#64748b',
    strokeWidth: 2,
    text: 'Cloud Deploy',
    textColor: '#334155',
    fontSize: 12,
    zIndex: 11,
  },
];

export const INITIAL_BOARDS: WhiteboardBoard[] = [
  {
    id: 'board-architecture',
    name: 'Project Architecture & Idea Map',
    description: 'System design, microservices, and user journey flow',
    elements: INITIAL_WHITEBOARD_ELEMENTS,
    gridMode: 'dots',
    bgColor: '#ffffff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'board-wireframes',
    name: 'UI Wireframe & User Experience',
    description: 'Screen layouts, visual components, and UX wireframes',
    elements: [
      {
        id: 'wf-screen-1',
        type: 'rectangle',
        x: 100,
        y: 80,
        width: 320,
        height: 440,
        fill: '#ffffff',
        stroke: '#0f172a',
        strokeWidth: 2,
        text: '📱 Mobile Prototype Screen\n\n[Header Bar with Search]\n[Hero Metric & Status Card]\n[Interactive Checklist]\n[Quick Action Float Button]',
        textColor: '#0f172a',
        fontSize: 13,
        zIndex: 1,
      },
      {
        id: 'wf-sticky-1',
        type: 'sticky',
        x: 480,
        y: 120,
        width: 210,
        height: 160,
        fill: '#fed7aa', // orange-200
        stroke: '#f97316',
        strokeWidth: 1,
        text: '✨ Prototype Feedback:\n- Card tap response feels responsive\n- Add progress ring to header\n- Keep contrast AA accessible\n- Enable single-click bug reporting',
        textColor: '#7c2d12',
        fontSize: 13,
        zIndex: 2,
      },
    ],
    gridMode: 'lines',
    bgColor: '#f8fafc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getWhiteboardBoards(): WhiteboardBoard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
    if (!raw) {
      saveWhiteboardBoards(INITIAL_BOARDS);
      return INITIAL_BOARDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse whiteboard boards from local storage', e);
  }
  return INITIAL_BOARDS;
}

export function saveWhiteboardBoards(boards: WhiteboardBoard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(boards));
  } catch (e) {
    console.error('Failed to save whiteboard boards', e);
  }
}

export function getActiveBoardId(): string {
  const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
  if (stored) return stored;
  return INITIAL_BOARDS[0]?.id || 'board-architecture';
}

export function setActiveBoardId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

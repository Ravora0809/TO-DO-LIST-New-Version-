import React from 'react';
import {
  Server,
  Database,
  Cloud,
  Globe,
  Cpu,
  Terminal,
  Wifi,
  Code,
  GitBranch,
  Key,
  ShieldCheck,
  Layers,
  Boxes,
  Smartphone,
  Monitor,
  Layout,
  MousePointer,
  Bell,
  ShoppingCart,
  CreditCard,
  Search,
  Image,
  Sliders,
  User,
  Users,
  Briefcase,
  Award,
  Rocket,
  Target,
  Zap,
  Sparkles,
  Compass,
  Lightbulb,
  Flag,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Wrench,
  Clock,
  Activity,
  Flame,
  ThumbsUp,
  Heart,
  Star,
  HardDrive,
  Lock,
  Workflow,
  Radio,
  Share2,
} from 'lucide-react';

export const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string; size?: number; color?: string }>> = {
  // Tech & Infrastructure
  Server,
  Database,
  Cloud,
  Globe,
  Cpu,
  Terminal,
  Wifi,
  Code,
  GitBranch,
  Key,
  ShieldCheck,
  Layers,
  Boxes,
  HardDrive,
  Lock,
  Workflow,
  Radio,
  Share2,

  // UI & Product
  Smartphone,
  Monitor,
  Layout,
  MousePointer,
  Bell,
  ShoppingCart,
  CreditCard,
  Search,
  Image,
  Sliders,

  // People & Business
  User,
  Users,
  Briefcase,
  Award,
  Rocket,
  Target,
  Zap,
  Sparkles,
  Compass,
  Lightbulb,
  Flag,
  MessageSquare,

  // Indicators & Tools
  CheckCircle2,
  AlertTriangle,
  Bug,
  Wrench,
  Clock,
  Activity,
  Flame,
  ThumbsUp,
  Heart,
  Star,
};

export interface IconCategory {
  name: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: 'Tech & Architecture',
    icons: [
      'Server',
      'Database',
      'Cloud',
      'Globe',
      'Cpu',
      'Terminal',
      'Code',
      'GitBranch',
      'Layers',
      'Boxes',
      'HardDrive',
      'Workflow',
      'Wifi',
    ],
  },
  {
    name: 'UI, Devices & Flow',
    icons: [
      'Smartphone',
      'Monitor',
      'Layout',
      'MousePointer',
      'Bell',
      'ShoppingCart',
      'CreditCard',
      'Search',
      'Image',
      'Sliders',
    ],
  },
  {
    name: 'Team & Business Strategy',
    icons: [
      'Rocket',
      'Lightbulb',
      'Target',
      'Briefcase',
      'User',
      'Users',
      'Award',
      'Zap',
      'Sparkles',
      'Compass',
      'Flag',
      'MessageSquare',
    ],
  },
  {
    name: 'Security, QA & Bugs',
    icons: [
      'Bug',
      'ShieldCheck',
      'Lock',
      'Key',
      'Wrench',
      'AlertTriangle',
      'CheckCircle2',
      'Activity',
      'Clock',
      'Star',
      'Flame',
      'ThumbsUp',
    ],
  },
];

interface WhiteboardIconRendererProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export const WhiteboardIconRenderer: React.FC<WhiteboardIconRendererProps> = ({
  name,
  size = 28,
  color = 'currentColor',
  className = '',
}) => {
  const IconComp = ICON_REGISTRY[name] || Lightbulb;
  return <IconComp size={size} color={color} className={className} />;
};

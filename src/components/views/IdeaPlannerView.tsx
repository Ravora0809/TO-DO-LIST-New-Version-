import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Bug,
  Plus,
  ArrowRight,
  FolderKanban,
  FileText,
  Layers,
  Layout,
  Cpu,
  ShieldAlert,
  Rocket,
  ChevronRight,
  Calendar,
  Tag,
  Check,
  Filter,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Lightbulb,
  AlertTriangle,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ProjectIdea,
  ProjectStage,
  ProjectStageId,
  ProjectBug,
  BugSeverity,
  BugStatus,
  StageStatus,
} from '../../types';
import {
  getProjectIdeas,
  saveProjectIdeas,
  getActiveProjectId,
  setActiveProjectId,
  getProjectBugs,
  saveProjectBugs,
  calculateProjectProgress,
  createStandardStages,
} from '../../services/ideaPlannerStorage';

interface IdeaPlannerViewProps {
  onOpenWhiteboard?: () => void;
}

export const IdeaPlannerView: React.FC<IdeaPlannerViewProps> = ({ onOpenWhiteboard }) => {
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [activeProjectId, setActiveId] = useState<string>('');
  const [activeStageId, setActiveStageId] = useState<ProjectStageId>('prototype');
  const [bugs, setBugs] = useState<ProjectBug[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'bugs' | 'all_projects'>('roadmap');

  // Modals & Forms
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewBugModalOpen, setIsNewBugModalOpen] = useState(false);
  const [isEditBugModalOpen, setIsEditBugModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<ProjectBug | null>(null);

  // New Project Form
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTagline, setNewProjTagline] = useState('');
  const [newProjCategory, setNewProjCategory] = useState('Web App');
  const [newProjPriority, setNewProjPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newProjTargetDate, setNewProjTargetDate] = useState('');
  const [newProjProblem, setNewProjProblem] = useState('');
  const [newProjAudience, setNewProjAudience] = useState('');

  // New Bug Form
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugStage, setBugStage] = useState<ProjectStageId>('prototype');
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>('medium');
  const [bugSteps, setBugSteps] = useState('');
  const [bugRootCause, setBugRootCause] = useState('');
  const [bugFixNotes, setBugFixNotes] = useState('');

  // Bug filters
  const [bugFilterStatus, setBugFilterStatus] = useState<string>('all');
  const [bugFilterSeverity, setBugFilterSeverity] = useState<string>('all');
  const [bugSearch, setBugSearch] = useState('');

  // New Milestone Item input
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Load projects & bugs on mount
  useEffect(() => {
    const loadedProjects = getProjectIdeas();
    setProjects(loadedProjects);
    const active = getActiveProjectId();
    const found = loadedProjects.find((p) => p.id === active) || loadedProjects[0];
    if (found) {
      setActiveId(found.id);
      setActiveStageId(found.currentStage);
    }
    const loadedBugs = getProjectBugs();
    setBugs(loadedBugs);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeStage = activeProject?.stages.find((s) => s.id === activeStageId) || activeProject?.stages[0];
  const projectBugs = bugs.filter((b) => b.projectId === activeProjectId);

  // Calculate Progress Stats
  const stats = activeProject
    ? calculateProjectProgress(activeProject)
    : { totalMilestones: 0, completedMilestones: 0, percent: 0, completedStages: 0, currentStageIndex: 0 };

  // Update & Persist Projects
  const updateProject = (updated: ProjectIdea) => {
    const newProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(newProjects);
    saveProjectIdeas(newProjects);
  };

  // Toggle Milestone Item
  const handleToggleMilestone = (stageId: ProjectStageId, itemId: string) => {
    if (!activeProject) return;
    const updatedStages = activeProject.stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      const updatedItems = stage.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      // Auto compute if all completed
      const allDone = updatedItems.every((i) => i.completed);
      return {
        ...stage,
        items: updatedItems,
        status: allDone ? ('completed' as StageStatus) : stage.status,
      };
    });

    const updatedProject = {
      ...activeProject,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    };
    updateProject(updatedProject);

    // Confetti celebration if 100%
    const newStats = calculateProjectProgress(updatedProject);
    if (newStats.percent === 100) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Add New Milestone Item to Active Stage
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim() || !activeProject || !activeStage) return;

    const newItem = {
      id: `m-${Date.now()}`,
      title: newMilestoneText.trim(),
      completed: false,
    };

    const updatedStages = activeProject.stages.map((stage) => {
      if (stage.id !== activeStage.id) return stage;
      return {
        ...stage,
        items: [...stage.items, newItem],
      };
    });

    updateProject({
      ...activeProject,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    });

    setNewMilestoneText('');
  };

  // Change Stage Status manually
  const handleSetStageStatus = (stageId: ProjectStageId, status: StageStatus) => {
    if (!activeProject) return;
    const updatedStages = activeProject.stages.map((s) => (s.id === stageId ? { ...s, status } : s));

    // If marked completed, check if currentStage needs advancing
    let nextCurrent = activeProject.currentStage;
    if (status === 'completed' && activeProject.currentStage === stageId) {
      const idx = activeProject.stages.findIndex((s) => s.id === stageId);
      if (idx < activeProject.stages.length - 1) {
        nextCurrent = activeProject.stages[idx + 1].id;
        setActiveStageId(nextCurrent);
        confetti({ particleCount: 50, spread: 60 });
      }
    }

    updateProject({
      ...activeProject,
      currentStage: nextCurrent,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Save Stage Notes
  const handleUpdateStageNotes = (notes: string) => {
    if (!activeProject || !activeStage) return;
    const updatedStages = activeProject.stages.map((s) => (s.id === activeStage.id ? { ...s, notes } : s));
    updateProject({
      ...activeProject,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newProj: ProjectIdea = {
      id: `proj-${Date.now()}`,
      title: newProjTitle.trim(),
      tagline: newProjTagline.trim() || 'Innovative project ideation & execution',
      category: newProjCategory,
      priority: newProjPriority,
      targetDate: newProjTargetDate || undefined,
      problemStatement: newProjProblem.trim() || 'Clear problem statement identified in ideation.',
      targetAudience: newProjAudience.trim() || 'Target audience and market segments.',
      currentStage: 'srs',
      stages: createStandardStages(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    setActiveId(newProj.id);
    setActiveProjectId(newProj.id);
    setActiveStageId('srs');
    saveProjectIdeas(updated);
    setIsNewProjectModalOpen(false);

    // Reset Form
    setNewProjTitle('');
    setNewProjTagline('');
    setNewProjProblem('');
    setNewProjAudience('');
  };

  // Add Bug Note
  const handleAddBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !activeProject) return;

    const newBug: ProjectBug = {
      id: `bug-${Date.now()}`,
      projectId: activeProject.id,
      title: bugTitle.trim(),
      description: bugDesc.trim(),
      stageFound: bugStage,
      severity: bugSeverity,
      status: 'open',
      stepsToReproduce: bugSteps.trim(),
      rootCause: bugRootCause.trim(),
      fixNotes: bugFixNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newBug, ...bugs];
    setBugs(updated);
    saveProjectBugs(updated);
    setIsNewBugModalOpen(false);

    // Reset Form
    setBugTitle('');
    setBugDesc('');
    setBugSteps('');
    setBugRootCause('');
    setBugFixNotes('');
  };

  // Toggle Bug Status
  const handleToggleBugStatus = (bugId: string) => {
    const updated = bugs.map((b) => {
      if (b.id !== bugId) return b;
      let nextStatus: BugStatus = 'in_progress';
      let resolvedAt: string | undefined = undefined;
      if (b.status === 'open') nextStatus = 'in_progress';
      else if (b.status === 'in_progress') {
        nextStatus = 'resolved';
        resolvedAt = new Date().toISOString();
        confetti({ particleCount: 40, spread: 50 });
      } else nextStatus = 'open';

      return {
        ...b,
        status: nextStatus,
        resolvedAt,
      };
    });
    setBugs(updated);
    saveProjectBugs(updated);
  };

  // Save Edited Bug
  const handleSaveEditedBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBug) return;
    const updated = bugs.map((b) => (b.id === editingBug.id ? editingBug : b));
    setBugs(updated);
    saveProjectBugs(updated);
    setIsEditBugModalOpen(false);
    setEditingBug(null);
  };

  // Delete Bug
  const handleDeleteBug = (bugId: string) => {
    const updated = bugs.filter((b) => b.id !== bugId);
    setBugs(updated);
    saveProjectBugs(updated);
  };

  // Filtered Bugs
  const filteredBugs = projectBugs.filter((b) => {
    if (bugFilterStatus !== 'all' && b.status !== bugFilterStatus) return false;
    if (bugFilterSeverity !== 'all' && b.severity !== bugFilterSeverity) return false;
    if (
      bugSearch.trim() &&
      !b.title.toLowerCase().includes(bugSearch.toLowerCase()) &&
      !b.description.toLowerCase().includes(bugSearch.toLowerCase()) &&
      !b.rootCause?.toLowerCase().includes(bugSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const stageIcons: Record<ProjectStageId, React.ComponentType<{ className?: string }>> = {
    srs: FileText,
    architecture: Layers,
    wireframe: Layout,
    prototype: Cpu,
    development: FolderKanban,
    testing: ShieldAlert,
    deployment: Rocket,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Project Selector Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Lightbulb className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Project Select Dropdown */}
              <select
                value={activeProjectId}
                onChange={(e) => {
                  setActiveId(e.target.value);
                  setActiveProjectId(e.target.value);
                  const p = projects.find((item) => item.id === e.target.value);
                  if (p) setActiveStageId(p.currentStage);
                }}
                className="text-base font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl outline-none cursor-pointer border border-neutral-200 dark:border-neutral-700"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    💡 {p.title}
                  </option>
                ))}
              </select>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                {activeProject?.category || 'Project'}
              </span>

              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeProject?.priority === 'high'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {activeProject?.priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-2xl">
              {activeProject?.tagline}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onOpenWhiteboard && (
            <button
              onClick={onOpenWhiteboard}
              title="Open Idea & Architecture Whiteboard"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Ideation Whiteboard</span>
            </button>
          )}

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Idea / Project</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation: Roadmap / Bugs / All Projects */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'roadmap'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Project Lifecycle & Status ({stats.percent}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('bugs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            activeTab === 'bugs'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Bug className="w-4 h-4 text-rose-500" />
          <span>Bug Fixing Notes ({projectBugs.length})</span>
          {projectBugs.filter((b) => b.status === 'open').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('all_projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'all_projects'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>All Ideas Overview ({projects.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ROADMAP & "WHERE I REACHED" TRACKER                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'roadmap' && activeProject && (
        <div className="space-y-6">
          {/* Status Tracker & Milestone Progress Header */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Where You Have Reached
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                    Current Stage: {activeProject.stages.find((s) => s.id === activeProject.currentStage)?.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Stage {stats.currentStageIndex + 1} of 7
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    {stats.percent}%
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium">
                    {stats.completedMilestones} of {stats.totalMilestones} milestones completed
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Animated Progress Bar */}
            <div className="w-full h-3.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            {/* Stepper Timeline Across 7 Full Steps (SRS -> Prototype -> Deployment) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
              {activeProject.stages.map((stage, idx) => {
                const isSelected = activeStageId === stage.id;
                const isCurrent = activeProject.currentStage === stage.id;
                const Icon = stageIcons[stage.id];

                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500'
                        : stage.status === 'completed'
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-300'
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-850/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                          stage.status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {stage.status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          stage.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : stage.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {stage.status === 'completed'
                          ? 'Done'
                          : stage.status === 'in_progress'
                          ? 'Active'
                          : 'Pending'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {stage.shortName}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {stage.items.filter((i) => i.completed).length}/{stage.items.length} done
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Detailed Workspace */}
          {activeStage && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Stage Milestones & Checklist (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                          Stage {activeStage.stepNumber}: {activeStage.name}
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {activeStage.description}
                      </p>
                    </div>

                    {/* Stage Status Selector */}
                    <div className="flex items-center gap-2">
                      <select
                        value={activeStage.status}
                        onChange={(e) => handleSetStageStatus(activeStage.id, e.target.value as StageStatus)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                      >
                        <option value="not_started">⚪ Not Started</option>
                        <option value="in_progress">🟡 In Progress</option>
                        <option value="completed">🟢 Mark Completed</option>
                        <option value="blocked">🔴 Blocked</option>
                      </select>
                    </div>
                  </div>

                  {/* Key Deliverables Chips */}
                  {activeStage.keyDeliverables && (
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                        Key Deliverables for this Stage:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeStage.keyDeliverables.map((del) => (
                          <span
                            key={del}
                            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                            {del}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Milestones Checklist */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Stage Milestone Checklist ({activeStage.items.filter((i) => i.completed).length}/
                      {activeStage.items.length})
                    </span>

                    <div className="space-y-2">
                      {activeStage.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleMilestone(activeStage.id, item.id)}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                            item.completed
                              ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-850/30 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                                item.completed
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-neutral-300 dark:border-neutral-600'
                              }`}
                            >
                              {item.completed && <Check className="w-3.5 h-3.5" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-semibold block truncate ${
                                  item.completed
                                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                                    : 'text-neutral-900 dark:text-white'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.notes && (
                                <span className="text-[11px] text-neutral-400 block truncate">
                                  Note: {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Milestone Input */}
                    <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newMilestoneText}
                        onChange={(e) => setNewMilestoneText(e.target.value)}
                        placeholder={`Add custom ${activeStage.shortName} step / milestone...`}
                        className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                      >
                        Add Step
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Stage Notes, SRS Details & Whiteboard Link (1 Col) */}
              <div className="space-y-6">
                {/* Notes & Spec Editor */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {activeStage.shortName} Documentation & Notes
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium">Auto-saved</span>
                  </div>

                  <textarea
                    value={activeStage.notes}
                    onChange={(e) => handleUpdateStageNotes(e.target.value)}
                    rows={8}
                    placeholder={`Enter key notes, functional specs, architecture decisions, or test observations for ${activeStage.name}...`}
                    className="w-full text-xs font-mono p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/50 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Quick Link to Whiteboard */}
                {onOpenWhiteboard && (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900 border border-amber-200/70 dark:border-amber-900/50 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Visualize on Whiteboard</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      Diagram your system components, user flows, UI wireframes, and prototype notes directly on the canvas.
                    </p>
                    <button
                      onClick={onOpenWhiteboard}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <span>Open Canvas for this Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: BUG FIXING & ISSUE NOTES FOR THIS IDEA                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bugs' && activeProject && (
        <div className="space-y-6">
          {/* Bugs Header & Stats Bar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Bug Fixing Notes: {activeProject.title}
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Log identified bugs, reproduction steps, root cause analysis, and fix solutions across all project phases
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsNewBugModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Bug & Fix Note</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bugSearch}
                  onChange={(e) => setBugSearch(e.target.value)}
                  placeholder="Search bug title, description, or root cause..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bugFilterStatus}
                onChange={(e) => setBugFilterStatus(e.target.value)}
                className="text-xs font-medium px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved & Fixed</option>
              </select>

              <select
                value={bugFilterSeverity}
                onChange={(e) => setBugFilterSeverity(e.target.value)}
                className="text-xs font-medium px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Bug Notes List */}
          {filteredBugs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No Bugs Found</h4>
              <p className="text-xs text-neutral-400 mt-1">
                No bugs matching this filter, or no issues logged yet for this project.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleToggleBugStatus(bug.id)}
                        title="Click to toggle status (Open -> In Progress -> Resolved)"
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                          bug.status === 'resolved'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : bug.status === 'in_progress'
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {bug.status === 'resolved' && <Check className="w-3.5 h-3.5" />}
                        {bug.status === 'in_progress' && <Clock className="w-3 h-3" />}
                      </button>

                      <h4
                        className={`text-sm font-bold ${
                          bug.status === 'resolved'
                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {bug.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bug.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : bug.severity === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {bug.severity}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                        Stage: {bug.stageFound}
                      </span>

                      <button
                        onClick={() => {
                          setEditingBug(bug);
                          setIsEditBugModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBug(bug.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bug Description */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{bug.description}</p>

                  {/* Steps to Reproduce */}
                  {bug.stepsToReproduce && (
                    <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 text-xs">
                      <span className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">
                        Steps to Reproduce:
                      </span>
                      <pre className="font-sans whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 text-xs">
                        {bug.stepsToReproduce}
                      </pre>
                    </div>
                  )}

                  {/* Two Column: Root Cause & Fix Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Root Cause */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[10px] block mb-1">
                        🔍 Root Cause Analysis:
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        {bug.rootCause || 'Root cause investigation in progress...'}
                      </p>
                    </div>

                    {/* Fix Notes */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                        💡 Fix Notes & Solution:
                      </span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        {bug.fixNotes || 'No fix notes documented yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ALL PROJECTS OVERVIEW                                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'all_projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const pStats = calculateProjectProgress(proj);
            const pBugs = bugs.filter((b) => b.projectId === proj.id);

            return (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveId(proj.id);
                  setActiveProjectId(proj.id);
                  setActiveStageId(proj.currentStage);
                  setActiveTab('roadmap');
                }}
                className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-4 hover:shadow-lg ${
                  proj.id === activeProjectId
                    ? 'border-amber-400 dark:border-amber-600 bg-white dark:bg-neutral-900 shadow-md ring-1 ring-amber-400'
                    : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                      {proj.category}
                    </span>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-1.5">
                      {proj.title}
                    </h4>
                  </div>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {pStats.percent}%
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {proj.problemStatement}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${pStats.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span>Current: {proj.stages.find((s) => s.id === proj.currentStage)?.shortName}</span>
                  <span className="flex items-center gap-1 text-rose-500 font-medium">
                    <Bug className="w-3 h-3" />
                    {pBugs.length} bugs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW PROJECT / IDEA                              */}
      {/* ------------------------------------------------------------- */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
              Start New Project / Idea Roadmap
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Set up full lifecycle stages from SRS to Architecture, Wireframes, Prototype, and Deployment
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="e.g. CloudScale AI, VitalPulse Tracker..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tagline / Pitch
                </label>
                <input
                  type="text"
                  value={newProjTagline}
                  onChange={(e) => setNewProjTagline(e.target.value)}
                  placeholder="e.g. High-performance caching engine with real-time analytics"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="Web App">Web Application</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="AI / ML">AI / Machine Learning</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Productivity">Productivity</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={newProjPriority}
                    onChange={(e) => setNewProjPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  SRS: Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={newProjProblem}
                  onChange={(e) => setNewProjProblem(e.target.value)}
                  placeholder="What user pain point does this idea solve?"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={newProjAudience}
                  onChange={(e) => setNewProjAudience(e.target.value)}
                  placeholder="e.g. Designers, developers, remote teams"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                >
                  Create Project Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LOG NEW BUG & FIX NOTE                                 */}
      {/* ------------------------------------------------------------- */}
      {isNewBugModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
              Log Bug & Fix Notes
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Record defects found in prototype, wireframes, or testing, plus root cause and fix details
            </p>

            <form onSubmit={handleAddBug} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Bug Title *
                </label>
                <input
                  type="text"
                  required
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="e.g. Canvas offset on pinch-zoom, API timeout on refresh..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Stage Found
                  </label>
                  <select
                    value={bugStage}
                    onChange={(e) => setBugStage(e.target.value as ProjectStageId)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="wireframe">3. Wireframing</option>
                    <option value="prototype">4. Prototype & MVP</option>
                    <option value="development">5. Development</option>
                    <option value="testing">6. QA & Testing</option>
                    <option value="deployment">7. Deployment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Severity
                  </label>
                  <select
                    value={bugSeverity}
                    onChange={(e) => setBugSeverity(e.target.value as BugSeverity)}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="critical">Critical (Blocker)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  placeholder="Observed behavior vs expected behavior"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Steps to Reproduce
                </label>
                <textarea
                  rows={2}
                  value={bugSteps}
                  onChange={(e) => setBugSteps(e.target.value)}
                  placeholder="1. Navigate to... 2. Click... 3. Notice error..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={2}
                  value={bugRootCause}
                  onChange={(e) => setBugRootCause(e.target.value)}
                  placeholder="Why did this issue occur? (e.g. Unhandled promise, race condition...)"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                  Fix Notes & Solution
                </label>
                <textarea
                  rows={2}
                  value={bugFixNotes}
                  onChange={(e) => setBugFixNotes(e.target.value)}
                  placeholder="What was fixed, code changes made, or verification steps applied..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBugModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs"
                >
                  Save Bug & Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT BUG & FIX NOTE                                    */}
      {/* ------------------------------------------------------------- */}
      {isEditBugModalOpen && editingBug && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
              Update Bug & Fix Notes
            </h3>

            <form onSubmit={handleSaveEditedBug} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Bug Title
                </label>
                <input
                  type="text"
                  required
                  value={editingBug.title}
                  onChange={(e) => setEditingBug({ ...editingBug, title: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingBug.status}
                    onChange={(e) => setEditingBug({ ...editingBug, status: e.target.value as BugStatus })}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved & Fixed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Severity
                  </label>
                  <select
                    value={editingBug.severity}
                    onChange={(e) => setEditingBug({ ...editingBug, severity: e.target.value as BugSeverity })}
                    className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={3}
                  value={editingBug.rootCause || ''}
                  onChange={(e) => setEditingBug({ ...editingBug, rootCause: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                  Fix Notes & Solution
                </label>
                <textarea
                  rows={3}
                  value={editingBug.fixNotes || ''}
                  onChange={(e) => setEditingBug({ ...editingBug, fixNotes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditBugModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
                >
                  Update Bug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

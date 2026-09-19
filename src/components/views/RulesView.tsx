import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Flame,
  Timer,
  Calendar,
  Layers,
  Shield,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Award,
} from 'lucide-react';
import { WorkRule, RuleCategory } from '../../types';
import {
  loadRules,
  saveRules,
  loadDailyCompliance,
  saveDailyCompliance,
  DEFAULT_RULES,
} from '../../services/rulesStorage';

const CATEGORIES: Array<'All' | RuleCategory> = [
  'All',
  'Focus & Time',
  'Execution & Quality',
  'Habits & Mindset',
  'Environment',
];

export const RulesView: React.FC = () => {
  const [rules, setRules] = useState<WorkRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | RuleCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daily compliance state
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [checkedRuleIds, setCheckedRuleIds] = useState<string[]>([]);

  // Add / Edit rule modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ruleToEdit, setRuleToEdit] = useState<WorkRule | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDesc, setModalDesc] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<RuleCategory>('Focus & Time');
  const [modalStrictness, setModalStrictness] = useState<WorkRule['strictness']>('recommended');

  useEffect(() => {
    const loaded = loadRules();
    setRules(loaded);
    setCheckedRuleIds(loadDailyCompliance(todayStr));
  }, [todayStr]);

  const handleToggleCompliance = (ruleId: string) => {
    const updated = checkedRuleIds.includes(ruleId)
      ? checkedRuleIds.filter((id) => id !== ruleId)
      : [...checkedRuleIds, ruleId];
    setCheckedRuleIds(updated);
    saveDailyCompliance(todayStr, updated);
  };

  const handleToggleActive = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    setRules(updated);
    saveRules(updated);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    saveRules(updated);
  };

  const handleOpenAdd = () => {
    setRuleToEdit(null);
    setModalTitle('');
    setModalDesc('');
    setModalCategory('Focus & Time');
    setModalStrictness('recommended');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: WorkRule) => {
    setRuleToEdit(rule);
    setModalTitle(rule.title);
    setModalDesc(rule.description);
    setModalCategory(rule.category);
    setModalStrictness(rule.strictness);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    if (ruleToEdit) {
      const updated = rules.map((r) =>
        r.id === ruleToEdit.id
          ? {
              ...r,
              title: modalTitle.trim(),
              description: modalDesc.trim(),
              category: modalCategory,
              strictness: modalStrictness,
            }
          : r
      );
      setRules(updated);
      saveRules(updated);
    } else {
      const newRule: WorkRule = {
        id: `rule-${Date.now()}`,
        title: modalTitle.trim(),
        description: modalDesc.trim(),
        category: modalCategory,
        strictness: modalStrictness,
        isCustom: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [...rules, newRule];
      setRules(updated);
      saveRules(updated);
    }
    setIsModalOpen(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset to standard recommended work & focus rules?')) {
      setRules(DEFAULT_RULES);
      saveRules(DEFAULT_RULES);
    }
  };

  // Filter rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (selectedCategory !== 'All' && rule.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rule.title.toLowerCase().includes(q) ||
          rule.description.toLowerCase().includes(q) ||
          rule.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rules, selectedCategory, searchQuery]);

  // Active rules count for compliance score
  const activeRules = useMemo(() => rules.filter((r) => r.isActive), [rules]);
  const compliancePercent =
    activeRules.length > 0 ? Math.round((checkedRuleIds.length / activeRules.length) * 100) : 0;

  // Spotlight rule of the day
  const spotlightRule = useMemo(() => {
    if (rules.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return rules[dayOfYear % rules.length];
  }, [rules]);

  const getStrictnessBadge = (s: WorkRule['strictness']) => {
    switch (s) {
      case 'mandatory':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            Mandatory
          </span>
        );
      case 'recommended':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            Recommended
          </span>
        );
      case 'best-practice':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Best Practice
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Productivity Codex & Work Standards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-1 tracking-tight">
            Work & Focus Rules
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Core execution principles, definition-of-done criteria, and distraction guards to ensure consistent flow state.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold text-xs shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Rule</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to recommended defaults"
            className="p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Rule Compliance Card & Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Compliance Tracker */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Today's Rule Practice Tracker
              </h3>
            </div>
            <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              {checkedRuleIds.length} / {activeRules.length} Followed ({compliancePercent}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${compliancePercent}%` }}
            />
          </div>

          <p className="text-xs text-neutral-400">
            Check off rules on the list below as you honor them throughout today's focus blocks and task completions.
          </p>
        </div>

        {/* Rule Spotlight */}
        {spotlightRule && (
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-neutral-900 dark:text-white shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rule Spotlight</span>
            </div>
            <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
              {spotlightRule.title}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3">
              {spotlightRule.description}
            </p>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSel
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search rules, disciplines, and guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.length === 0 ? (
          <div className="col-span-2 py-16 text-center rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 p-6 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              No rules found
            </h4>
            <p className="text-xs text-neutral-400">
              No rules match your search or filter. You can add a custom rule or reset defaults.
            </p>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isFollowedToday = checkedRuleIds.includes(rule.id);

            return (
              <div
                key={rule.id}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                  !rule.isActive
                    ? 'opacity-50 bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/40'
                    : isFollowedToday
                    ? 'bg-white dark:bg-neutral-900 border-emerald-500/50 dark:border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800/80 shadow-xs'
                }`}
              >
                {/* Header & Badges */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompliance(rule.id)}
                        title={isFollowedToday ? 'Mark as not practiced' : 'Check off as practiced today'}
                        className="text-neutral-400 hover:text-emerald-500 transition cursor-pointer shrink-0"
                      >
                        {isFollowedToday ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 hover:text-emerald-500" />
                        )}
                      </button>
                      <h4 className="font-extrabold text-base text-neutral-900 dark:text-white leading-snug">
                        {rule.title}
                      </h4>
                    </div>

                    <div className="shrink-0">{getStrictnessBadge(rule.strictness)}</div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2.5 leading-relaxed pl-7">
                    {rule.description}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium text-[11px]">
                      {rule.category}
                    </span>
                    {rule.isCustom && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule.id)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition cursor-pointer ${
                        rule.isActive
                          ? 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Paused'}
                    </button>

                    {rule.isCustom && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                {ruleToEdit ? 'Edit Rule' : 'Create Custom Work Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Rule Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., No Slack during focus blocks"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Description / Action Guideline
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain when and how this rule applies..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Category
                  </label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value as RuleCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="Focus & Time">Focus & Time</option>
                    <option value="Execution & Quality">Execution & Quality</option>
                    <option value="Habits & Mindset">Habits & Mindset</option>
                    <option value="Environment">Environment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Strictness
                  </label>
                  <select
                    value={modalStrictness}
                    onChange={(e) => setModalStrictness(e.target.value as WorkRule['strictness'])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="recommended">Recommended</option>
                    <option value="best-practice">Best Practice</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

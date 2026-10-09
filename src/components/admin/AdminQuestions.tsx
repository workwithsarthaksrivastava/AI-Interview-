import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { QuestionItem, Role, Company, InterviewType, InterviewDifficulty } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassModal } from '../common/GlassModal';
import { GlassInput } from '../common/GlassInput';
import { useAppStore } from '../../store/useAppStore';
import {
  HelpCircle,
  Plus,
  Upload,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const { addToast } = useAppStore();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiRole, setAiRole] = useState('Software Development Engineer II');
  const [aiCompany, setAiCompany] = useState('Google');
  const [aiCount, setAiCount] = useState(4);

  // New Question state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newIdealAnswer, setNewIdealAnswer] = useState('');
  const [newType, setNewType] = useState<InterviewType>('Technical');
  const [newDifficulty, setNewDifficulty] = useState<InterviewDifficulty>('Mid');
  const [newTags, setNewTags] = useState('Algorithms, Concurrency');

  useEffect(() => {
    api.getQuestions().then(setQuestions).catch(console.error);
  }, []);

  const handleGenerateAiQuestions = async () => {
    try {
      setIsAiGenerating(true);
      const added = await api.aiGenerateQuestions({
        roleTitle: aiRole,
        companyName: aiCompany,
        count: aiCount,
        difficulty: 'Mid'
      });
      setQuestions((prev) => [...added, ...prev]);
      setIsAiModalOpen(false);
      addToast('success', `Generated ${added.length} questions using Gemini!`);
    } catch (e: any) {
      addToast('error', 'AI question generation failed.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newText.trim()) return;
    try {
      const q = await api.createQuestion({
        roleId: 'sde-2',
        companyId: 'google',
        type: newType,
        difficulty: newDifficulty,
        text: newText,
        idealAnswer: newIdealAnswer,
        tags: newTags.split(',').map((t) => t.trim())
      });
      setQuestions((prev) => [q, ...prev]);
      setIsAddModalOpen(false);
      setNewText('');
      setNewIdealAnswer('');
      addToast('success', 'Question added to question bank.');
    } catch {
      addToast('error', 'Failed to add question.');
    }
  };

  const filtered = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || q.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Question Bank</h2>
          <p className="text-xs text-text-secondary mt-1">
            Curated repository of {questions.length} technical, behavioral, and system design questions with bar-raiser rubrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="mint"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            AI Generate with Gemini
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Question
          </GlassButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search questions or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl bg-sage-950/40 border border-sage-300/20 pl-9 pr-3 py-2 text-text-primary focus:outline-none focus:border-sage-400"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs rounded-xl bg-sage-950/50 border border-sage-300/20 px-3 py-2 text-text-primary focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="Technical">Technical</option>
          <option value="Behavioral">Behavioral</option>
          <option value="System Design">System Design</option>
          <option value="HR">HR</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filtered.map((q) => (
          <GlassCard key={q.id} className="p-4 border border-sage-300/15 hover:border-sage-300/35">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sage-500/20 text-mint">
                    {q.type}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-sage-950/50 text-gold border border-gold/20">
                    {q.difficulty}
                  </span>
                  <span className="text-[11px] text-text-muted">Target: {q.companyId.toUpperCase()}</span>
                </div>
                <h4 className="font-semibold text-xs text-text-primary">{q.text}</h4>
                {q.idealAnswer && (
                  <p className="text-[11px] text-text-secondary line-clamp-2 italic">
                    Ideal benchmark: {q.idealAnswer}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {q.tags.map((t, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-sage-950/40 text-text-muted border border-sage-300/10">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* AI Generate Modal */}
      <GlassModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI Generate Practice Questions (Gemini 3.8 Flash)"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">Target Role</label>
            <input
              type="text"
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2.5 text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">Target Company Culture</label>
            <input
              type="text"
              value={aiCompany}
              onChange={(e) => setAiCompany(e.target.value)}
              className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2.5 text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={10}
              value={aiCount}
              onChange={(e) => setAiCount(parseInt(e.target.value, 10))}
              className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2.5 text-text-primary focus:outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <GlassButton variant="ghost" size="sm" onClick={() => setIsAiModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleGenerateAiQuestions}
              loading={isAiGenerating}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Generate Questions
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Add Question Modal */}
      <GlassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Question to Question Bank"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">Question Prompt</label>
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. How does consistent hashing prevent cache hotspotting?"
              className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2.5 text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">Ideal Model Answer / Rubric</label>
            <textarea
              rows={3}
              value={newIdealAnswer}
              onChange={(e) => setNewIdealAnswer(e.target.value)}
              placeholder="Key concepts expected from candidate..."
              className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2.5 text-text-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2 text-text-primary"
              >
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">Difficulty</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as any)}
                className="w-full rounded-xl bg-sage-950/40 border border-sage-300/20 p-2 text-text-primary"
              >
                <option value="Fresher">Fresher</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <GlassButton variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={handleCreateQuestion}>
              Save to Catalog
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

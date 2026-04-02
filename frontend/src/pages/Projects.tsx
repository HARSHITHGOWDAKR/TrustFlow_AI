import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeHub } from '@/components/KnowledgeHub';
import { KnowledgeBaseManager } from '@/components/KnowledgeBaseManager';
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';
import { RAGInsights } from '@/components/RAGInsights';
import { ConfidenceRecommender } from '@/components/ConfidenceRecommender';
import { AgentOrchestrationTrace } from '@/components/AgentOrchestrationTrace';
import { useAgentMock, MOCK_QUESTIONS } from '@/hooks/useAgentMock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  ChevronRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Play,
  Zap,
  AlertCircle,
  Brain,
  Database,
  Search,
  CheckCircle,
  Layers,
  BookOpen,
  Shield,
  MoreVertical,
  Edit3,
  ThumbsUp,
  Flag,
  X,
  Save,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  ChevronDown,
  Copy,
  Download,
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: 'APPROVED' | 'NEEDS_EDIT' | 'FLAGGED' | 'PROCESSING' | 'PENDING';
  confidence: number | null;
  citations: Array<{
    embeddingId: number;
    score: number;
    snippet: string;
    source: string;
  }>;
  intakeCategory?: string;
  expandedQuery?: string;
  retrievedChunksData?: string;
  verificationStatus?: string;
  verificationReason?: string;
  verificationSuggestions?: string;
  processingTimeMs?: number;
}

interface KBFile {
  id: string;
  name: string;
  type: 'txt' | 'pdf' | 'image';
  size: number;
  status: 'pending' | 'vectorizing' | 'completed' | 'error';
  thumbnail?: string;
  uploadedAt: Date;
  vectorCount?: number;
}

interface AgentStep {
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: Date;
  details?: string;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewMode, setReviewMode] = useState<'queue' | 'all'>('queue');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kbFiles, setKbFiles] = useState<KBFile[]>([]);
  const [showAgentLogs, setShowAgentLogs] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'NEEDS_EDIT' | 'FLAGGED' | 'PENDING'>('all');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const mockAgentSteps = useAgentMock(activeQuestionId, isDemoMode && showAgentLogs);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects');
        if (!response.ok) throw new Error('Failed to load projects');
        const data = await response.json();
        setProjects((data.projects ?? []) as Project[]);
      } catch (error) {
        console.error('Projects load error:', error);
      }
    };

    void loadProjects();
  }, []);

  // Sync mock agent steps
  useEffect(() => {
    if (isDemoMode && showAgentLogs && mockAgentSteps.length > 0) {
      setAgentSteps(mockAgentSteps as AgentStep[]);
    }
  }, [mockAgentSteps, isDemoMode, showAgentLogs]);

  // AUTO-REFRESH: Poll for updates when processing is active
  useEffect(() => {
    if (!selectedProject) return;

    const hasPendingItems = reviewItems.some(item => 
      item.status === 'PENDING' || item.status === 'PROCESSING'
    );

    if (!hasPendingItems) return;

    // Poll every 2 seconds for updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/projects/${selectedProject.id}/review`);
        if (response.ok) {
          const data = await response.json();
          setReviewItems((data.questions ?? []).map((q: ReviewItem) => ({
            ...q,
            status: q.status || 'PENDING',
          })));
        }
      } catch (err) {
        // Silently fail on poll, don't spam console
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedProject, reviewItems]);

  const handleUploadQuestionnaire = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/projects/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProjects((prev) => [data.project, ...prev]);
      setFile(null);

      // AUTO-SELECT the newly created project and load its questions
      setSelectedProject(data.project);
      setReviewMode('queue');
      setShowAgentLogs(false);
      setAgentSteps([]);

      // Load the questions immediately
      try {
        const reviewResponse = await fetch(`http://localhost:3000/projects/${data.project.id}/review`);
        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          setReviewItems((reviewData.questions ?? []).map((q: ReviewItem) => ({
            ...q,
            status: q.status || 'PENDING',
          })));
        }
      } catch (err) {
        console.warn('Could not load review items:', err);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewItems = async (projectId: number, mode: 'queue' | 'all') => {
    if (mode === 'queue') {
      const queueResponse = await fetch(`http://localhost:3000/projects/${projectId}/review-queue`);
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setReviewItems((queueData.questions ?? []).map((q: ReviewItem) => ({
          ...q,
          status: q.status || 'PENDING',
        })));
        return;
      }
    }

    const response = await fetch(`http://localhost:3000/projects/${projectId}/review`);
    if (!response.ok) throw new Error('Failed to fetch review data');
    const data = await response.json();
    setReviewItems((data.questions ?? []).map((q: ReviewItem) => ({
      ...q,
      status: q.status || 'PENDING',
    })));
  };

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    setReviewMode('queue');
    setLoading(true);
    setShowAgentLogs(false);
    setAgentSteps([]);

    try {
      await loadReviewItems(project.id, 'queue');
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeReviewMode = async (mode: 'queue' | 'all') => {
    if (!selectedProject) return;
    setReviewMode(mode);
    setLoading(true);

    try {
      await loadReviewItems(selectedProject.id, mode);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId: number, status: string, editedAnswer?: string) => {
    try {
      const response = await fetch(`http://localhost:3000/projects/questions/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, editedAnswer }),
      });

      if (!response.ok) throw new Error('Status update failed');

      setReviewItems(
        reviewItems.map((item) =>
          item.id === itemId
            ? { ...item, status: status as ReviewItem['status'], answer: editedAnswer || item.answer }
            : item,
        ),
      );
      setEditingId(null);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleUploadKB = async (files: File[]) => {
    for (const file of files) {
      const kbFile: KBFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.name.endsWith('.txt') ? 'txt' : 'image',
        size: file.size,
        status: 'vectorizing',
        uploadedAt: new Date(),
      };

      setKbFiles((prev) => [kbFile, ...prev]);

      if (!selectedProject) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:3000/knowledge-base/${selectedProject.id}/ingest`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || 'Upload failed');
        }

        const data = await response.json();

        setKbFiles((prev) =>
          prev.map((f) =>
            f.id === kbFile.id
              ? {
                  ...f,
                  status: 'completed',
                  vectorCount: data.chunkCount,
                }
              : f,
          ),
        );

        if (selectedProject) {
          await loadReviewItems(selectedProject.id, reviewMode);
        }
      } catch (error) {
        setKbFiles((prev) =>
          prev.map((f) =>
            f.id === kbFile.id
              ? { ...f, status: 'error' }
              : f,
          ),
        );
        console.error('KB upload error:', error);
      }
    }
  };

  const handleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      setShowAgentLogs(true);
      setReviewItems(MOCK_QUESTIONS.map((q: any) => ({
        ...q,
        status: q.status || 'PENDING',
      })));
      setAgentSteps([]);
    }
  };

  // Get filtered items
  const filteredItems = statusFilter === 'all' 
    ? reviewItems 
    : reviewItems.filter(item => item.status === statusFilter);

  // Calculate stats
  const stats = {
    total: reviewItems.length,
    approved: reviewItems.filter(i => i.status === 'APPROVED').length,
    needsEdit: reviewItems.filter(i => i.status === 'NEEDS_EDIT').length,
    flagged: reviewItems.filter(i => i.status === 'FLAGGED').length,
    pending: reviewItems.filter(i => i.status === 'PENDING' || i.status === 'PROCESSING').length,
    avgConfidence: reviewItems.length > 0 
      ? (reviewItems.reduce((sum, i) => sum + (i.confidence || 0), 0) / reviewItems.length * 100).toFixed(1)
      : 0,
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                GRC Projects
              </h1>
              <p className="text-lg text-muted-foreground">
                Multi-agent AI-powered questionnaire processor with confidence-based workflows
              </p>
            </div>

            {/* Create New Project */}
            <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  Create New Project
                </CardTitle>
                <CardDescription>Upload your GRC questionnaire to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    placeholder="Select questionnaire"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleUploadQuestionnaire} 
                    disabled={!file || loading}
                    className="gap-2 px-6"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Excel, CSV, or XLSX format. Questions will be processed through our 4-agent LLM pipeline.
                </p>
              </CardContent>
            </Card>

            {/* Projects Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Projects</h2>
              {projects.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground text-lg">No projects yet</p>
                    <p className="text-sm text-muted-foreground">Upload a questionnaire above to create your first project</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleViewProject(project)}
                      className="cursor-pointer"
                    >
                      <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Created {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-40 bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProject(null);
                setIsDemoMode(false);
                setAgentSteps([]);
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{selectedProject.name}</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Questions: {stats.total} | Approved: {stats.approved} | Needs Edit: {stats.needsEdit} | Flagged: {stats.flagged}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded border border-green-300">
                <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Auto-Processing Active</span>
              </div>
              <Button
                onClick={() => setShowAgentLogs(!showAgentLogs)}
                variant={showAgentLogs ? 'default' : 'outline'}
                className="gap-2"
              >
                {showAgentLogs ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Hide Logs
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Show Logs
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList className="bg-background border border-border/50">
            <TabsTrigger value="questions" className="gap-2">
              <FileText className="w-4 h-4" />
              Questions Review
            </TabsTrigger>
            <TabsTrigger value="citations" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Citation Section
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Zap className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="confidence" className="gap-2">
              <Shield className="w-4 h-4" />
              Confidence
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            {/* Status Overview Cards */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total', value: stats.total, color: 'bg-blue-500/20 text-blue-700' },
                { label: 'Approved', value: stats.approved, color: 'bg-emerald-500/20 text-emerald-700' },
                { label: 'Needs Edit', value: stats.needsEdit, color: 'bg-yellow-500/20 text-yellow-700' },
                { label: 'Flagged', value: stats.flagged, color: 'bg-red-500/20 text-red-700' },
                { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, color: 'bg-purple-500/20 text-purple-700' },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Filter and Sort */}
            <Card className="border-border/50">
              <CardContent className="pt-6 flex gap-3 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-2">
                  {(['all', 'APPROVED', 'NEEDS_EDIT', 'FLAGGED', 'PENDING'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="gap-1"
                    >
                      {status === 'all' && '📊 All'}
                      {status === 'APPROVED' && '✅ Approved'}
                      {status === 'NEEDS_EDIT' && '✏️ Needs Edit'}
                      {status === 'FLAGGED' && '⛔ Flagged'}
                      {status === 'PENDING' && '⏳ Pending'}
                      {statusFilter === status && (
                        <span className="ml-1 bg-background px-2 py-0.5 rounded text-xs font-semibold">
                          {status === 'all' ? stats.total : (stats as any)[status.toLowerCase()] || 0}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Review Mode Tabs */}
            <div className="flex gap-2 border-b border-border/50">
              {[
                { mode: 'queue' as const, label: '📋 Processing Queue' },
                { mode: 'all' as const, label: '📊 All Questions' },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => handleChangeReviewMode(tab.mode)}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    reviewMode === tab.mode
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading questions...</p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">No questions found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <Card className={`border-l-4 transition-all ${
                        item.status === 'APPROVED' ? 'border-l-emerald-500 bg-emerald-50/30' :
                        item.status === 'NEEDS_EDIT' ? 'border-l-yellow-500 bg-yellow-50/30' :
                        item.status === 'FLAGGED' ? 'border-l-red-500 bg-red-50/30' :
                        'border-l-blue-500 bg-blue-50/30'
                      }`}>
                        <CardContent className="pt-6">
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => setExpandedQuestion(expandedQuestion === item.id ? null : item.id)}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                  item.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                                  item.status === 'NEEDS_EDIT' ? 'bg-yellow-500 text-white' :
                                  item.status === 'FLAGGED' ? 'bg-red-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {item.id}
                                </div>
                                <p className="text-sm font-semibold text-foreground">{item.question}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 ml-11">
                                {item.intakeCategory && (
                                  <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border border-border/50">
                                    {item.intakeCategory}
                                  </span>
                                )}
                                {(item.confidence ?? 0) > 0 ? (
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    item.confidence > 0.8 ? 'bg-emerald-500/20 text-emerald-700' :
                                    item.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-700' :
                                    'bg-red-500/20 text-red-700'
                                  }`}>
                                    {(item.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                ) : (
                                  <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border border-border/50">
                                    No confidence score
                                  </span>
                                )}
                                {item.processingTimeMs && (
                                  <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border border-border/50 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.processingTimeMs}ms
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-700' :
                              item.status === 'NEEDS_EDIT' ? 'bg-yellow-500/20 text-yellow-700' :
                              item.status === 'FLAGGED' ? 'bg-red-500/20 text-red-700' :
                              'bg-blue-500/20 text-blue-700'
                            }`}>
                              {item.status === 'APPROVED' && '✅ Approved'}
                              {item.status === 'NEEDS_EDIT' && '✏️ Needs Edit'}
                              {item.status === 'FLAGGED' && '⛔ Flagged'}
                              {item.status === 'PENDING' && '⏳ Pending'}
                              {item.status === 'PROCESSING' && '⚙️ Processing'}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {expandedQuestion === item.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-border/50 space-y-4"
                              >
                                {/* Answer Section */}
                                <div>
                                  <p className="text-sm font-semibold text-foreground mb-2">Current Answer</p>
                                  {editingId === item.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingAnswer}
                                        onChange={(e) => setEditingAnswer(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleStatusUpdate(item.id, item.status, editingAnswer)}
                                          className="gap-2"
                                        >
                                          <Save className="w-4 h-4" />
                                          Save Changes
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingId(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                      {item.answer || 'No answer yet'}
                                    </p>
                                  )}
                                </div>

                                {/* Sources - Redirect to Citation Section Tab */}
                                {item.citations && item.citations.length > 0 && (
                                  <div>
                                    <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded flex items-center gap-2">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      View full citations in the <strong>Citation Section</strong> tab
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                    variant={item.status === 'APPROVED' ? 'default' : 'outline'}
                                    className="gap-2 flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setEditingAnswer(item.answer || '');
                                      handleStatusUpdate(item.id, 'NEEDS_EDIT');
                                    }}
                                    variant={item.status === 'NEEDS_EDIT' ? 'default' : 'outline'}
                                    className="gap-2 flex-1"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate(item.id, 'FLAGGED')}
                                    variant={item.status === 'FLAGGED' ? 'destructive' : 'outline'}
                                    className="gap-2 flex-1"
                                  >
                                    <Flag className="w-4 h-4" />
                                    Flag
                                  </Button>
                                  <Button size="sm" variant="ghost" className="gap-2">
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="gap-2">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Citation Section Tab - Query-Specific Citations + RAG Insights + Knowledge Base */}
          <TabsContent value="citations" className="space-y-6">
            {/* Query-Specific Citations */}
            {expandedQuestion !== null ? (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />
                    Query-Specific Citations
                  </CardTitle>
                  <CardDescription>
                    Citations relevant to Question #{expandedQuestion}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const selectedItem = reviewItems.find(item => item.id === expandedQuestion);
                    if (!selectedItem || !selectedItem.citations || selectedItem.citations.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">No citations available for this query</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span>📍 Sources Cited</span>
                          <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-0.5 rounded">
                            {selectedItem.citations.length} source{selectedItem.citations.length !== 1 ? 's' : ''}
                          </span>
                        </p>
                        {selectedItem.citations.map((citation, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                  <p className="text-sm font-semibold text-foreground">{citation.source}</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-4">Company Policy Citation</p>
                              </div>
                              <span className="text-xs bg-emerald-500/20 text-emerald-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                                {(citation.score * 100).toFixed(0)}% match
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground p-2 rounded bg-background/50 border border-border/30">
                              "{citation.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">Select a question from the Questions Review tab to view its citations</p>
                </CardContent>
              </Card>
            )}

            {/* Policy Section */}
            <div className="border-t border-border/50 pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Policy Management
              </h3>
              {selectedProject && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-semibold mb-3">Database-Backed Policies</h4>
                    <KnowledgeBaseUpload projectId={selectedProject.id} />
                  </div>
                  
                  <div className="border-t border-border/50 pt-6">
                    <h4 className="text-md font-semibold mb-3">Processed Knowledge Base</h4>
                    <KnowledgeBaseManager projectId={selectedProject.id} />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                RAG Insights
              </h3>
              {selectedProject && <RAGInsights projectId={selectedProject.id} />}
            </div>
          </TabsContent>

          {/* Confidence Tab */}
          <TabsContent value="confidence" className="space-y-6">
            {selectedProject && <ConfidenceRecommender projectId={selectedProject.id} />}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Approval Rate', value: stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0, unit: '%' },
                { title: 'Edit Rate', value: stats.total > 0 ? ((stats.needsEdit / stats.total) * 100).toFixed(1) : 0, unit: '%' },
                { title: 'Flag Rate', value: stats.total > 0 ? ((stats.flagged / stats.total) * 100).toFixed(1) : 0, unit: '%' },
                { title: 'Avg Confidence', value: stats.avgConfidence, unit: '%' },
              ].map((metric, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-4xl font-bold text-primary mt-2">
                      {metric.value}{metric.unit}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Agent Logs Panel */}
      {showAgentLogs && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="fixed right-0 top-0 bottom-0 bg-background/95 border-l border-border/50 backdrop-blur-sm w-96 shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                Agent Execution Pipeline
              </h3>
              <button
                onClick={() => setShowAgentLogs(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {agentSteps.length > 0 ? (
                <AgentOrchestrationTrace steps={agentSteps} isVisible={showAgentLogs} />
              ) : (
                <p className="text-center py-6 text-muted-foreground text-sm">Start mode to see agent execution</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

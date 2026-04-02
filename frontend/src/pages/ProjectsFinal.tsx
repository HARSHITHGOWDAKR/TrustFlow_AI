import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DraftReviewCard } from '@/components/DraftReviewCard';
import { KnowledgeHub } from '@/components/KnowledgeHub';
import { AgentOrchestrationTrace } from '@/components/AgentOrchestrationTrace';
import { useAgentMock, MOCK_QUESTIONS } from '@/hooks/useAgentMock';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  ChevronRight,
  Calendar,
  ArrowLeft,
  Clock,
  BookOpen,
  Eye,
  Play,
  Zap,
  AlertCircle,
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
  status: string;
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
  type: 'txt' | 'image';
  size: number;
  status: 'pending' | 'vectorizing' | 'completed' | 'error';
  thumbnail?: string;
  uploadedAt: Date;
  vectorCount?: number;
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

  const agentSteps = useAgentMock(activeQuestionId, isDemoMode && showAgentLogs);

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
        setReviewItems(queueData.questions ?? []);
        return;
      }
    }

    const response = await fetch(`http://localhost:3000/projects/${projectId}/review`);
    if (!response.ok) throw new Error('Failed to fetch review data');
    const data = await response.json();
    setReviewItems(data.questions ?? []);
  };

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    setReviewMode('queue');
    setLoading(true);
    setShowAgentLogs(false);

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
            ? { ...item, status, answer: editedAnswer || item.answer }
            : item,
        ),
      );
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
      setReviewItems(MOCK_QUESTIONS);
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              GRC Projects
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Multi-agent AI-powered document analysis with 4-stage intelligence verification
            </p>
          </div>
          <Button
            onClick={handleDemoMode}
            variant={isDemoMode ? 'default' : 'outline'}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {isDemoMode ? 'Exit' : 'Start'}
          </Button>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Create New Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                placeholder="Select questionnaire (Excel/CSV)"
                className="flex-1"
              />
              <Button
                onClick={handleUploadQuestionnaire}
                disabled={!file || loading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload your GRC questionnaire as Excel or CSV to process through our 4-agent LLM pipeline.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {projects.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  No projects yet. Upload a questionnaire to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card 
                  className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewProject(project)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {project.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-96">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedProject(null);
            setIsDemoMode(false);
          }}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {selectedProject.name}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            🧠 Intake → 🔍 Retrieval → ✍️ Drafter → ✅ Critic
          </p>
        </div>
        <Button
          onClick={() => setShowAgentLogs(!showAgentLogs)}
          variant={showAgentLogs ? 'default' : 'outline'}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {showAgentLogs ? 'Hide' : 'Show'} Agent Logs
        </Button>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="w-4 h-4" />
            Questions ({reviewItems.length})
          </TabsTrigger>
          <TabsTrigger value="knowledge-base" className="gap-2">
            <Zap className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Tabs value={reviewMode} onValueChange={(v) => handleChangeReviewMode(v as 'queue' | 'all')}>
            <TabsList>
              <TabsTrigger value="queue">Processing Queue</TabsTrigger>
              <TabsTrigger value="all">All Questions</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Loading questions...
                </p>
              </div>
            </div>
          )}

          {!loading && reviewItems.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  {reviewMode === 'queue'
                    ? 'No questions in processing queue'
                    : 'No questions yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewItems.map((item) => {
                let retrievedChunks = [];
                try {
                  if (item.retrievedChunksData) {
                    retrievedChunks = JSON.parse(item.retrievedChunksData);
                  } else if (item.citations && item.citations.length > 0) {
                    retrievedChunks = item.citations.map((c) => ({
                      source: c.source,
                      section: 'Retrieved from knowledge base',
                      snippet: c.snippet,
                      score: c.score,
                    }));
                  }
                } catch (e) {
                  console.error('Error parsing chunks:', e);
                }

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveQuestionId(item.id)}
                    onMouseLeave={() => setActiveQuestionId(null)}
                  >
                    <DraftReviewCard
                      questionId={item.id}
                      question={item.question}
                      answer={item.answer || 'Processing...'}
                      confidenceScore={item.confidence || 0}
                      sources={retrievedChunks}
                      intakeCategory={item.intakeCategory}
                      expandedQuery={item.expandedQuery}
                      processingTimeMs={item.processingTimeMs}
                      criticReasoning={item.verificationReason}
                      onApprove={() => handleStatusUpdate(item.id, 'APPROVED')}
                      onEdit={() => handleStatusUpdate(item.id, 'NEEDS_EDIT')}
                      onFlag={() => handleStatusUpdate(item.id, 'FLAGGED')}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledge-base" className="space-y-4">
          <KnowledgeHub
            files={kbFiles}
            onFilesSelected={handleUploadKB}
            lastSyncTime={new Date()}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>

      <AgentOrchestrationTrace steps={agentSteps} isVisible={showAgentLogs} />
    </div>
  );
}

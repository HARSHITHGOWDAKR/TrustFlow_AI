import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Database,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Layers,
  Flag,
  Save,
  Edit3,
  X,
  Loader,
  LinkIcon,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RetrievedChunk {
  id: number;
  source: string;
  sourcePolicy?: {
    id: string;
    title: string;
    category: string;
  };
  chunkIndex: number;
  chunk: string;
  similarity: number;
  rank: number;
}

interface RAGProcessingStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  details?: string;
}

interface RAGStats {
  totalQuestions: number;
  questionsProcessed: number;
  totalRetrievals: number;
  avgChunksPerRetrieval: number;
  avgConfidenceScore: number;
  avgSimilarityScore: number;
  topSimilarityThreshold: number;
}

interface QuestionRAGData {
  questionId: number;
  question: string;
  answer?: string;
  status?: 'APPROVED' | 'NEEDS_EDIT' | 'FLAGGED' | 'PENDING' | 'PROCESSING';
  retrievedChunks: RetrievedChunk[];
  confidenceScore: number;
  processingSteps: RAGProcessingStep[];
  totalProcessingTime: number;
}

interface RAGDashboardProps {
  projectId: number;
}

export const RAGDashboard: React.FC<RAGDashboardProps> = ({ projectId }) => {
  const [ragStats, setRagStats] = useState<RAGStats | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRAGData | null>(null);
  const [questions, setQuestions] = useState<QuestionRAGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'timeline'>('overview');
  const [editingAnswer, setEditingAnswer] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRAGData();
  }, [projectId]);

  // Action handlers
  const handleApprove = async () => {
    if (!selectedQuestion) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/projects/questions/${selectedQuestion.questionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (response.ok) {
        setActionMessage({ type: 'success', text: 'Question approved!' });
        setSelectedQuestion({ ...selectedQuestion, status: 'APPROVED' });
      } else {
        setActionMessage({ type: 'error', text: 'Failed to approve' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedQuestion) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/projects/questions/${selectedQuestion.questionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FLAGGED' }),
      });
      if (response.ok) {
        setActionMessage({ type: 'success', text: 'Question flagged for review!' });
        setSelectedQuestion({ ...selectedQuestion, status: 'FLAGGED' });
      } else {
        setActionMessage({ type: 'error', text: 'Failed to flag' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedQuestion) return;
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/projects/questions/${selectedQuestion.questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: editingAnswer, status: 'NEEDS_EDIT' }),
      });
      if (response.ok) {
        setActionMessage({ type: 'success', text: 'Changes saved!' });
        setSelectedQuestion({ ...selectedQuestion, answer: editingAnswer, status: 'NEEDS_EDIT' });
        setIsEditMode(false);
      } else {
        setActionMessage({ type: 'error', text: 'Failed to save changes' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error') });
    } finally {
      setActionLoading(false);
    }
  };

  const loadRAGData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch RAG statistics
      const statsRes = await fetch(`http://localhost:3000/projects/${projectId}/rag-stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setRagStats(statsData);
      }

      // Fetch questions with RAG data
      const questionsRes = await fetch(`http://localhost:3000/projects/${projectId}/review-queue`);
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions || []);
        if (questionsData.questions?.length > 0) {
          setSelectedQuestion(questionsData.questions[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RAG data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading RAG pipeline data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">❌ Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        {[
          { mode: 'overview' as const, label: '📊 Overview', icon: BarChart3 },
          { mode: 'detailed' as const, label: '🔍 Detailed', icon: Search },
          { mode: 'timeline' as const, label: '⏱️  Timeline', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setViewMode(tab.mode)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === tab.mode
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW MODE */}
      {viewMode === 'overview' && ragStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* RAG Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <p className="text-sm text-muted-foreground mb-2">Questions Processed</p>
              <p className="text-3xl font-bold text-primary">
                {ragStats.questionsProcessed}/{ragStats.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {((ragStats.questionsProcessed / ragStats.totalQuestions) * 100).toFixed(0)}% complete
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20"
            >
              <p className="text-sm text-muted-foreground mb-2">Total Retrievals</p>
              <p className="text-3xl font-bold text-blue-600">{ragStats.totalRetrievals}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Avg {ragStats.avgChunksPerRetrieval.toFixed(1)} chunks/question
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
            >
              <p className="text-sm text-muted-foreground mb-2">Avg Confidence</p>
              <p className="text-3xl font-bold text-emerald-600">
                {(ragStats.avgConfidenceScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on retrieval relevance
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"
            >
              <p className="text-sm text-muted-foreground mb-2">Avg Similarity</p>
              <p className="text-3xl font-bold text-purple-600">
                {(ragStats.avgSimilarityScore * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Top threshold: {(ragStats.topSimilarityThreshold * 100).toFixed(1)}%
              </p>
            </motion.div>
          </div>

          {/* RAG Pipeline Visualization */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                RAG Pipeline Overview
              </CardTitle>
              <CardDescription>How retrieval-augmented generation processes questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    name: 'Question Intake',
                    desc: 'Question extracted from questionnaire',
                    icon: Search,
                  },
                  {
                    step: 2,
                    name: 'Query Expansion',
                    desc: 'Generate alternative phrasings for better retrieval',
                    icon: Layers,
                  },
                  {
                    step: 3,
                    name: 'Vector Search',
                    desc: 'Search Pinecone for similar chunks using embeddings',
                    icon: Database,
                  },
                  {
                    step: 4,
                    name: 'Chunk Ranking',
                    desc: 'Rank retrieved chunks by cosine similarity score',
                    icon: TrendingUp,
                  },
                  {
                    step: 5,
                    name: 'Confidence Scoring',
                    desc: 'Calculate confidence based on top chunk similarity',
                    icon: CheckCircle,
                  },
                ].map((pipeline, idx) => {
                  const Icon = pipeline.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm">
                          {pipeline.step}
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{pipeline.name}</h4>
                          <p className="text-sm text-muted-foreground">{pipeline.desc}</p>
                        </div>
                        <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Processing Performance */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Processing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Avg Query Expansion Time', value: '120ms', status: 'good' },
                  { label: 'Avg Vector Search Time', value: '150ms', status: 'good' },
                  { label: 'Avg Ranking Time', value: '80ms', status: 'excellent' },
                  { label: 'Total Avg Processing', value: '350ms', status: 'good' },
                ].map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <p className="text-sm font-medium">{perf.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{perf.value}</p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          perf.status === 'excellent'
                            ? 'bg-emerald-500'
                            : perf.status === 'good'
                              ? 'bg-blue-500'
                              : 'bg-yellow-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* DETAILED MODE */}
      {viewMode === 'detailed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Question Selector */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Select Question to Analyze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {questions.slice(0, 10).map((q, idx) => (
                  <button
                    key={q.questionId}
                    onClick={() => setSelectedQuestion(q)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      selectedQuestion?.questionId === q.questionId
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.retrievedChunks?.length || 0} chunks • {((q.confidenceScore || 0) * 100).toFixed(0)}% confidence
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Question RAG Details */}
          {selectedQuestion && (
            <motion.div
              key={selectedQuestion.questionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Question Summary */}
              <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Question Analysis</CardTitle>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedQuestion.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-700' :
                      selectedQuestion.status === 'FLAGGED' ? 'bg-red-500/20 text-red-700' :
                      selectedQuestion.status === 'NEEDS_EDIT' ? 'bg-yellow-500/20 text-yellow-700' :
                      'bg-blue-500/20 text-blue-700'
                    }`}>
                      {selectedQuestion.status || 'PENDING'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Original Question</p>
                    <p className="text-foreground font-medium">{selectedQuestion.question}</p>
                  </div>

                  {/* Action notification */}
                  {actionMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-sm ${
                        actionMessage.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-700 border border-red-500/30'
                      }`}
                    >
                      {actionMessage.text}
                    </motion.div>
                  )}

                  {/* Edit Mode */}
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Edit Answer</p>
                        <textarea
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                          className="w-full p-3 rounded-lg border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={5}
                          placeholder="Enter your edited answer..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveChanges}
                          disabled={actionLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {actionLoading ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditMode(false);
                            setEditingAnswer(selectedQuestion.answer || '');
                          }}
                          variant="outline"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedQuestion.answer && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Current Answer</p>
                          <p className="text-foreground text-sm p-3 rounded-lg bg-background/50 border border-border/50">
                            {selectedQuestion.answer}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <Button
                          onClick={() => {
                            setIsEditMode(true);
                            setEditingAnswer(selectedQuestion.answer || '');
                          }}
                          variant="outline"
                          className="gap-2"
                          disabled={actionLoading}
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={handleApprove}
                          disabled={actionLoading || selectedQuestion.status === 'APPROVED'}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {actionLoading ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleFlag}
                          disabled={actionLoading || selectedQuestion.status === 'FLAGGED'}
                          className="gap-2 bg-red-600 hover:bg-red-700"
                        >
                          {actionLoading ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Flag className="w-4 h-4" />
                              Flag
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Processing Steps */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Processing Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedQuestion.processingSteps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {step.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          )}
                          {step.status === 'processing' && (
                            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          )}
                          {step.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          {step.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full border-2 border-border/50" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            Step {step.step}: {step.name}
                          </p>
                          {step.details && (
                            <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                          )}
                          {step.duration && (
                            <p className="text-xs text-muted-foreground mt-1">⏱️  {step.duration}ms</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retrieved Chunks with Citations */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    Retrieved Chunks & Citations ({selectedQuestion.retrievedChunks.length})
                  </CardTitle>
                  <CardDescription>Policy sources ranked by relevance to query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedQuestion.retrievedChunks.map((chunk, idx) => (
                      <motion.div
                        key={chunk.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3"
                      >
                        {/* Citation Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Rank & Source Policy */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                {chunk.rank}
                              </span>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-semibold text-foreground">
                                  {chunk.sourcePolicy?.title || chunk.source}
                                </p>
                              </div>
                              {chunk.sourcePolicy?.category && (
                                <span className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground border border-border/50">
                                  {chunk.sourcePolicy.category}
                                </span>
                              )}
                            </div>

                            {/* Chunk Preview */}
                            <p className="text-sm text-muted-foreground line-clamp-2 ml-8">
                              {chunk.chunk.substring(0, 200)}...
                            </p>
                          </div>

                          {/* Similarity Score */}
                          <div className="text-right flex-shrink-0">
                            <div className={`text-2xl font-bold ${
                              chunk.similarity > 0.8 ? 'text-emerald-600' :
                              chunk.similarity > 0.6 ? 'text-blue-600' :
                              'text-yellow-600'
                            }`}>
                              {(chunk.similarity * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Match Score</p>
                          </div>
                        </div>

                        {/* Similarity Bar */}
                        <div className="h-2 rounded-full bg-background border border-border/50 overflow-hidden ml-8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${chunk.similarity * 100}%` }}
                            transition={{ delay: idx * 0.1 + 0.2, duration: 0.6 }}
                            className={`h-full bg-gradient-to-r ${
                              chunk.similarity > 0.8
                                ? 'from-emerald-500 to-emerald-400'
                                : chunk.similarity > 0.6
                                  ? 'from-blue-500 to-blue-400'
                                  : 'from-yellow-500 to-yellow-400'
                            }`}
                          />
                        </div>

                        {/* Citation Reference */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-8 pt-1 border-t border-border/30">
                          <LinkIcon className="w-3 h-3" />
                          <span>
                            Citation from{' '}
                            <span className="font-semibold text-foreground">
                              {chunk.sourcePolicy?.title || 'Knowledge Base'}
                            </span>
                            {chunk.sourcePolicy?.id && ` (ID: ${chunk.sourcePolicy.id.substring(0, 8)}...)`}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Citations Summary */}
                  {selectedQuestion.retrievedChunks.length > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <h4 className="text-sm font-semibold text-foreground mb-2">🔍 Sources Cited</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {Array.from(
                          new Set(
                            selectedQuestion.retrievedChunks.map(
                              (c) => c.sourcePolicy?.title || c.source
                            )
                          )
                        ).map((source, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confidence Score Breakdown */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Confidence Score Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Overall Confidence</p>
                    <div className="flex items-end gap-2 mb-4">
                      <p className="text-4xl font-bold text-primary">
                        {(selectedQuestion.confidenceScore * 100).toFixed(1)}%
                      </p>
                      <div className="h-8 w-full rounded-lg bg-background border border-border/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedQuestion.confidenceScore * 100}%` }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence Factors */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Top Chunk Similarity',
                        value: selectedQuestion.retrievedChunks[0]?.similarity || 0,
                        weight: 0.4,
                      },
                      {
                        label: 'Retrieval Count',
                        value: Math.min(selectedQuestion.retrievedChunks.length / 5, 1),
                        weight: 0.3,
                      },
                      {
                        label: 'Score Consistency',
                        value: selectedQuestion.retrievedChunks.length > 0 ?
                          1 - (Math.max(...selectedQuestion.retrievedChunks.map(c => c.similarity)) -
                            Math.min(...selectedQuestion.retrievedChunks.map(c => c.similarity))) : 0,
                        weight: 0.3,
                      },
                    ].map((factor, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">{factor.label}</p>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-foreground">
                            {(factor.value * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Weight: {(factor.weight * 100).toFixed(0)}%
                          </p>
                          <div className="h-1 rounded-full bg-background border border-border/50 overflow-hidden">
                            <div
                              className="h-full bg-primary/60"
                              style={{ width: `${factor.value * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* TIMELINE MODE */}
      {viewMode === 'timeline' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                RAG Processing Timeline
              </CardTitle>
              <CardDescription>Processing history of all questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.slice(0, 8).map((q, idx) => (
                  <motion.div
                    key={q.questionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {idx < questions.slice(0, 8).length - 1 && (
                        <div className="w-0.5 h-12 bg-border/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>⏱️  {q.totalProcessingTime}ms</span>
                        <span>📦 {q.retrievedChunks.length} chunks</span>
                        <span>✅ {(q.confidenceScore * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>

                    {/* Confidence Indicator */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          q.confidenceScore > 0.8
                            ? 'bg-emerald-500/20 text-emerald-700'
                            : q.confidenceScore > 0.6
                              ? 'bg-blue-500/20 text-blue-700'
                              : 'bg-yellow-500/20 text-yellow-700'
                        }`}
                      >
                        {q.confidenceScore > 0.8 ? 'High' : q.confidenceScore > 0.6 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Graph */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Confidence Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['High (80-100%)', 'Medium (60-80%)', 'Low (Below 60%)'].map((level, idx) => {
                  const counts = [
                    questions.filter(q => q.confidenceScore > 0.8).length,
                    questions.filter(q => q.confidenceScore > 0.6 && q.confidenceScore <= 0.8).length,
                    questions.filter(q => q.confidenceScore <= 0.6).length,
                  ];
                  const count = counts[idx];
                  const percentage = (count / questions.length) * 100;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-medium text-foreground">{level}</p>
                        <p className="text-muted-foreground">
                          {count} questions ({percentage.toFixed(0)}%)
                        </p>
                      </div>
                      <div className="h-3 rounded-full bg-background border border-border/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: idx * 0.2 + 0.2, duration: 0.6 }}
                          className={`h-full ${
                            idx === 0
                              ? 'bg-emerald-500'
                              : idx === 1
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RAGDashboard;

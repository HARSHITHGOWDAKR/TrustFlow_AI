import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Search,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  FileText,
} from 'lucide-react';

interface RetrievedChunk {
  source: string;
  chunk: string;
  score: number;
}

interface AgentPipelineViewProps {
  question: string;
  intakeCategory?: string;
  expandedQuery?: string;
  retrievedChunksData?: string; // JSON stringified
  answer?: string;
  verificationStatus?: string; // PASS | FAIL | NEEDS_REVIEW
  verificationReason?: string;
  verificationSuggestions?: string;
  confidence?: number;
  processingTimeMs?: number;
}

const AgentIcon = ({ stage }: { stage: number }) => {
  const icons = [
    <Brain className="w-5 h-5" />,
    <Zap className="w-5 h-5" />,
    <Search className="w-5 h-5" />,
    <PenTool className="w-5 h-5" />,
    <CheckCircle2 className="w-5 h-5" />,
  ];
  return icons[stage] || icons[0];
};

const AgentStageName = ({ stage }: { stage: number }) => {
  const names = [
    'Intake Agent',
    'Embedding',
    'Retrieval Agent',
    'Drafter Agent',
    'Critic Agent',
  ];
  return names[stage] || 'Unknown';
};

const AgentStageDescription = ({ stage }: { stage: number }) => {
  const descriptions = [
    'Classifies question into GRC category and expands query',
    'Generates vector embeddings for semantic search',
    'Searches knowledge base by semantic similarity',
    'Generates compliance answer using retrieved context',
    'Verifies answer accuracy and scores confidence',
  ];
  return descriptions[stage] || 'Unknown stage';
};

export function AgentPipelineView({
  question,
  intakeCategory,
  expandedQuery,
  retrievedChunksData,
  answer,
  verificationStatus,
  verificationReason,
  verificationSuggestions,
  confidence,
  processingTimeMs,
}: AgentPipelineViewProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const retrievedChunks: RetrievedChunk[] = retrievedChunksData
    ? JSON.parse(retrievedChunksData)
    : [];

  const stages = [
    {
      name: 'Intake Agent',
      icon: <Brain className="w-5 h-5" />,
      description: 'Question Classification & Expansion',
      status: intakeCategory ? 'complete' : 'pending',
      details: {
        category: intakeCategory,
        expandedQuery: expandedQuery,
      },
    },
    {
      name: 'Embedding',
      icon: <Zap className="w-5 h-5" />,
      description: 'Vector Generation',
      status: expandedQuery ? 'complete' : 'pending',
      details: {
        info: 'Generated 1536-dimensional embedding vector',
      },
    },
    {
      name: 'Retrieval Agent',
      icon: <Search className="w-5 h-5" />,
      description: 'Semantic Search',
      status: retrievedChunks.length > 0 ? 'complete' : 'pending',
      details: {
        chunksCount: retrievedChunks.length,
        chunks: retrievedChunks,
      },
    },
    {
      name: 'Drafter Agent',
      icon: <PenTool className="w-5 h-5" />,
      description: 'Answer Generation',
      status: answer ? 'complete' : 'pending',
      details: {
        answerPreview: answer?.substring(0, 150) + (answer && answer.length > 150 ? '...' : ''),
      },
    },
    {
      name: 'Critic Agent',
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: 'Verification & Scoring',
      status: verificationStatus ? 'complete' : 'pending',
      details: {
        status: verificationStatus,
        confidence: confidence,
        reason: verificationReason,
        suggestions: verificationSuggestions,
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            ✓
          </div>
        );
      case 'pending':
        return (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white animate-pulse">
            •
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
            !
          </div>
        );
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Pipeline Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              4-Agent Processing Pipeline
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{question}</p>
          </div>
          {processingTimeMs && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4" />
                {processingTimeMs}ms
              </div>
            </div>
          )}
        </div>

        {/* Processing Summary */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-white dark:bg-slate-800 rounded px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">Category:</span>
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {intakeCategory || '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">Chunks:</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {retrievedChunks.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {verificationStatus || '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">Confidence:</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {confidence ? `${(confidence * 100).toFixed(0)}%` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${getStatusColor(stage.status)}`}>
              <div
                onClick={() =>
                  setExpandedStage(expandedStage === idx ? null : idx)
                }
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-slate-700 dark:text-slate-300">
                    {getStatusIcon(stage.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {stage.icon}
                        {stage.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          stage.status === 'complete'
                            ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {stage.status === 'complete' ? 'Complete' : 'Processing'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {stage.description}
                    </p>
                  </div>
                </div>
                {expandedStage === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </div>

              {/* Stage Details */}
              {expandedStage === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50"
                >
                  {stage.name === 'Intake Agent' && stage.details.category && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Detected Category
                        </label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded w-fit">
                          {stage.details.category}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Expanded Query
                        </label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 italic">
                          "{stage.details.expandedQuery}"
                        </p>
                      </div>
                    </div>
                  )}

                  {stage.name === 'Embedding' && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {stage.details.info}
                      </p>
                    </div>
                  )}

                  {stage.name === 'Retrieval Agent' &&
                    stage.details.chunks &&
                    stage.details.chunks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                          Retrieved Chunks ({stage.details.chunks.length})
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {stage.details.chunks.map((chunk, i) => (
                            <div
                              key={i}
                              className="bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {chunk.source}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold whitespace-nowrap">
                                  {(chunk.score * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {chunk.chunk}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {stage.name === 'Drafter Agent' && stage.details.answerPreview && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
                        Generated Answer
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {stage.details.answerPreview}
                      </p>
                    </div>
                  )}

                  {stage.name === 'Critic Agent' && stage.details.status && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
                          Verification Results
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Status
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded font-semibold ${
                                stage.details.status === 'PASS'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                  : stage.details.status === 'FAIL'
                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                              }`}
                            >
                              {stage.details.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Confidence
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {stage.details.confidence
                                ? `${(stage.details.confidence * 100).toFixed(1)}%`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {stage.details.reason && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                            Reasoning
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-2 rounded italic">
                            {stage.details.reason}
                          </p>
                        </div>
                      )}

                      {stage.details.suggestions && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                            Suggestions
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-2 rounded">
                            {stage.details.suggestions}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

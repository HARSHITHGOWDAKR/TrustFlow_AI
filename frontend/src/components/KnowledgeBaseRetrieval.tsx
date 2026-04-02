import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Database, FileText, TrendingUp, Badge, LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CitationItem {
  embeddingId: number;
  score: number;
  snippet: string;
  source: string;
  policyId?: string;
  policyCategory?: string;
}

interface KnowledgeBaseRetrievalProps {
  citations: CitationItem[];
  question: string;
}

export function KnowledgeBaseRetrieval({ citations, question }: KnowledgeBaseRetrievalProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  if (!citations || citations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No knowledge base sources retrieved for this question
          </p>
        </div>
      </motion.div>
    );
  }

  // Sort by score descending
  const sortedCitations = [...citations].sort((a, b) => b.score - a.score);
  
  // Group by source
  const sourceGroups = sortedCitations.reduce(
    (acc, citation) => {
      if (!acc[citation.source]) {
        acc[citation.source] = [];
      }
      acc[citation.source].push(citation);
      return acc;
    },
    {} as Record<string, CitationItem[]>,
  );

  const sourceNames = Object.keys(sourceGroups);
  const avgScore = (sortedCitations.reduce((sum, c) => sum + c.score, 0) / sortedCitations.length * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-t border-slate-200 dark:border-slate-700 pt-3"
    >
      {/* Summary Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-center gap-3 flex-1">
          <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-left flex-1">
            <p className="font-semibold text-sm text-slate-900 dark:text-white">
              📍 Company Policy Citations
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {citations.length} policy source{citations.length !== 1 ? 's' : ''} cited • {avgScore}% average relevance
            </p>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2"
          >
            {/* Source Groups */}
            {sourceNames.map((sourceName) => {
              const sourceCitations = sourceGroups[sourceName];
              const maxScore = Math.max(...sourceCitations.map((c) => c.score));
              const minScore = Math.min(...sourceCitations.map((c) => c.score));
              const avgSourceScore = sourceCitations.reduce((sum, c) => sum + c.score, 0) / sourceCitations.length;

              return (
                <motion.div
                  key={sourceName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {/* Source Header */}
                  <button
                    onClick={() =>
                      setExpandedSource(expandedSource === sourceName ? null : sourceName)
                    }
                    className="w-full flex items-start justify-between gap-3 pb-2 hover:opacity-75 transition-opacity"
                  >
                    <div className="flex items-start gap-2 flex-1 text-left">
                      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white break-words">
                          🔐 {sourceName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {(avgSourceScore * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                            {sourceCitations.length} citation{sourceCitations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expandedSource === sourceName ? (
                      <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>

                  {/* Source Snippets */}
                  <AnimatePresence>
                    {expandedSource === sourceName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700"
                      >
                        {sourceCitations.map((citation, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700"
                          >
                            {/* Score Bar */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Relevance
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {(citation.score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      citation.score > 0.8
                                        ? 'bg-green-500 dark:bg-green-400'
                                        : citation.score > 0.6
                                          ? 'bg-yellow-500 dark:bg-yellow-400'
                                          : 'bg-orange-500 dark:bg-orange-400'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${citation.score * 100}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Snippet Text */}
                            <div className="p-2 rounded border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 my-2">
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="inline-block font-semibold text-blue-600 dark:text-blue-400 mr-1">►</span>
                                "{citation.snippet}"
                              </p>
                            </div>

                            {/* Citation Badge */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                              <LinkIcon className="w-3 h-3" />
                              <span>Direct citation from company policy</span>
                              {citation.policyId && (
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  ID: {citation.policyId.substring(0, 6)}...
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Retrieval Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
            >
              <p className="font-medium mb-1">Retrieval Stats:</p>
              <ul className="space-y-0.5">
                <li>• Total sources retrieved: {citations.length}</li>
                <li>• Sources by file: {sourceNames.length}</li>
                <li>• Top relevance: {(Math.max(...citations.map((c) => c.score)) * 100).toFixed(0)}%</li>
                <li>• Avg relevance: {avgScore}%</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

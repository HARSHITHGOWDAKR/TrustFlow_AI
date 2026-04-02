import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, ChevronDown, Eye, HelpCircle } from 'lucide-react';

interface SourceEvidence {
  source: string;
  section: string;
  snippet: string;
  score: number;
  imagePreview?: string;
}

interface DraftReviewCardProps {
  questionId: number;
  question: string;
  answer: string;
  confidenceScore: number;
  sources: SourceEvidence[];
  criticReasoning?: string;
  intakeCategory?: string;
  expandedQuery?: string;
  processingTimeMs?: number;
  onApprove?: () => void;
  onEdit?: () => void;
  onFlag?: () => void;
}

export const DraftReviewCard: React.FC<DraftReviewCardProps> = ({
  questionId,
  question,
  answer,
  confidenceScore,
  sources,
  criticReasoning,
  intakeCategory,
  expandedQuery,
  processingTimeMs,
  onApprove,
  onEdit,
  onFlag,
}) => {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const [showCriticReasoning, setShowCriticReasoning] = useState(false);

  const confidencePercentage = Math.round(confidenceScore * 100);
  const confidenceColor =
    confidenceScore >= 0.8 ? 'text-emerald-500' :
    confidenceScore >= 0.6 ? 'text-amber-500' :
    'text-red-500';

  const radiusCircle = 45;
  const circumference = 2 * Math.PI * radiusCircle;
  const strokeDashoffset = circumference - (confidenceScore * circumference);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Q{questionId}
              </span>
              {intakeCategory && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  {intakeCategory}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {question}
            </h3>
            {expandedQuery && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">
                Expanded: {expandedQuery}
              </p>
            )}
          </div>

          {/* Confidence Gauge */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radiusCircle}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radiusCircle}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${confidenceColor} transition-all duration-500`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${confidenceColor}`}>
                  {confidencePercentage}%
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Confidence</span>
          </div>
        </div>

        {processingTimeMs && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            ⚡ Processed in {processingTimeMs}ms
          </p>
        )}
      </div>

      {/* Draft Answer */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          AI-Generated Answer
        </h4>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>

      {/* Source Evidence */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Source Evidence ({sources.length})
        </h4>
        <div className="space-y-2">
          {sources.map((source, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSource(expandedSource === index ? null : index)}
                className="w-full p-3 flex items-start justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {source.source}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {source.section}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    {Math.round(source.score * 100)}%
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedSource === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedSource === index && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Source Text
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                      "{source.snippet}"
                    </p>
                  </div>

                  {source.imagePreview && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                        Document Preview
                      </p>
                      <img
                        src={source.imagePreview}
                        alt="Source preview"
                        className="w-full h-auto rounded border border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Critic Verification */}
      {criticReasoning && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <button
            onClick={() => setShowCriticReasoning(!showCriticReasoning)}
            className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Why this answer?
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showCriticReasoning ? 'rotate-180' : ''}`}
            />
          </button>
          {showCriticReasoning && (
            <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Critic Agent:
                </span>{' '}
                {criticReasoning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 flex items-center justify-between gap-2">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onFlag}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors"
        >
          <Flag className="w-4 h-4" />
          Flag
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle2, AlertCircle, Loader, TrendingUp, AlertTriangle, Shield, History, CheckSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { KnowledgeBaseRetrieval } from './KnowledgeBaseRetrieval';
import { AgentPipelineView } from './AgentPipelineView';

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: string;
  confidence: number | null;
  citations: CitationItem[];
  auditTrail?: AuditEvent[];
  // Agent pipeline fields
  intakeCategory?: string;
  expandedQuery?: string;
  retrievedChunksData?: string;
  verificationStatus?: string;
  verificationReason?: string;
  verificationSuggestions?: string;
  processingTimeMs?: number;
}

interface CitationItem {
  embeddingId: number;
  score: number;
  snippet: string;
  source: string;
}

interface AuditEvent {
  id: number;
  action: string;
  reviewer: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
}

interface ReviewInterfaceProps {
  items: ReviewItem[];
  projectId: number;
  onStatusUpdate: (itemId: number, status: string, editedAnswer?: string) => void;
  isLoading?: boolean;
}

export function ReviewInterface({
  items,
  onStatusUpdate,
  isLoading = false,
}: ReviewInterfaceProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string>>({});

  // Filter items by status
  const pendingItems = items.filter((item) => item.status === 'PENDING');
  const needsReviewItems = items.filter((item) => item.status === 'NEEDS_REVIEW');
  const draftedItems = items.filter((item) => item.status === 'DRAFTED');
  const approvedItems = items.filter((item) => item.status === 'APPROVED');
  const rejectedItems = items.filter((item) => item.status === 'REJECTED');

  const handleApprove = (item: ReviewItem) => {
    onStatusUpdate(item.id, 'APPROVED');
  };

  const handleReject = (item: ReviewItem) => {
    onStatusUpdate(item.id, 'REJECTED');
  };

  const handleEdit = (item: ReviewItem) => {
    const editedAnswer = editedAnswers[item.id] || item.answer || '';
    onStatusUpdate(item.id, 'APPROVED', editedAnswer);
    setEditingId(null);
  };

  const getStatusBadge = (status: string, confidence: number | null) => {
    const badges = [];

    const statusConfig: Record<
      string,
      {
        icon: React.ReactNode;
        bgColor: string;
        textColor: string;
        label: string;
      }
    > = {
      PENDING: {
        icon: <Loader className="w-4 h-4 animate-spin" />,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-800 dark:text-blue-300',
        label: 'Processing',
      },
      NEEDS_REVIEW: {
        icon: <AlertCircle className="w-4 h-4" />,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        label: 'Needs Review',
      },
      DRAFTED: {
        icon: <Clock className="w-4 h-4" />,
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-800 dark:text-orange-300',
        label: 'Drafted',
      },
      APPROVED: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-300',
        label: 'Approved',
      },
      REJECTED: {
        icon: <AlertCircle className="w-4 h-4" />,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-800 dark:text-red-300',
        label: 'Rejected',
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    badges.push(
      <span
        key="status"
        className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${config.bgColor} ${config.textColor}`}
      >
        {config.icon}
        {config.label}
      </span>
    );

    if (confidence !== null && confidence > 0) {
      const confidenceColor =
        confidence > 0.8
          ? 'text-green-600 dark:text-green-400'
          : confidence > 0.6
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-orange-600 dark:text-orange-400';
      badges.push(
        <span
          key="confidence"
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${confidenceColor}`}
        >
          <TrendingUp className="w-4 h-4" />
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      );
    }

    return badges;
  };

  const [expandedAuditId, setExpandedAuditId] = useState<number | null>(null);

  const renderItem = (item: ReviewItem, showEdit = false) => {
    const isLowConfidence = item.confidence !== null && item.confidence < 0.65;
    const requiresHumanReview = item.status === 'NEEDS_REVIEW' || isLowConfidence;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`mb-4 border-slate-200 dark:border-slate-800 ${isLowConfidence ? 'border-l-4 border-l-red-500' : ''}`}>
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">
              {item.question}
            </CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">{getStatusBadge(item.status, item.confidence)}</div>
            
            {/* Low Confidence Warning Banner */}
            {isLowConfidence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md flex items-start gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                    Mandatory Human Review Required
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Confidence score is {(item.confidence * 100).toFixed(0)}% (threshold: 65%). This answer requires expert validation before approval.
                  </p>
                </div>
              </motion.div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {editingId === item.id && showEdit ? (
              <div className="space-y-2">
                <Textarea
                  value={editedAnswers[item.id] || item.answer || ''}
                  onChange={(e) =>
                    setEditedAnswers({
                      ...editedAnswers,
                      [item.id]: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(item)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    Save Edit
                  </Button>
                  <Button onClick={() => setEditingId(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {item.answer ? (
                  <div className="space-y-4">
                    {/* Agent Pipeline View */}
                    {item.intakeCategory || item.expandedQuery || item.retrievedChunksData ? (
                      <div className="mb-4">
                        <AgentPipelineView
                          question={item.question}
                          intakeCategory={item.intakeCategory}
                          expandedQuery={item.expandedQuery}
                          retrievedChunksData={item.retrievedChunksData}
                          answer={item.answer}
                          verificationStatus={item.verificationStatus}
                          verificationReason={item.verificationReason}
                          verificationSuggestions={item.verificationSuggestions}
                          confidence={item.confidence}
                          processingTimeMs={item.processingTimeMs}
                        />
                      </div>
                    ) : null}

                    <div>
                      <p className="text-slate-700 dark:text-slate-300 mb-3">{item.answer}</p>
                    </div>

                    {/* Knowledge Base Retrieval Display */}
                    {item.citations && item.citations.length > 0 && (
                      <KnowledgeBaseRetrieval citations={item.citations} question={item.question} />
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 italic">
                    No answer generated yet. Processing...
                  </div>
                )}

                {/* Human Verification Requirement Card */}
                {requiresHumanReview && showEdit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md"
                  >
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-300">Human Verification Required</p>
                        <div className="text-xs text-blue-800 dark:text-blue-400 mt-1 space-y-1">
                          <p>• Review confidence threshold: {isLowConfidence ? '❌ Below 65%' : '✅ Above 65%'}</p>
                          <p>• Export eligible: {item.status === 'APPROVED' ? '✅ Yes' : '❌ After approval'}</p>
                          <p>• Requires: Expert validation and sign-off</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Audit Trail Section */}
                {item.auditTrail && item.auditTrail.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-slate-200 dark:border-slate-700 pt-3"
                  >
                    <button
                      onClick={() => setExpandedAuditId(expandedAuditId === item.id ? null : item.id)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      Audit Trail ({item.auditTrail.length})
                      <span className="text-xs ml-auto">
                        {expandedAuditId === item.id ? '▼' : '▶'}
                      </span>
                    </button>
                    {expandedAuditId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 space-y-2 text-xs"
                      >
                        {item.auditTrail.map((event, idx) => (
                          <div key={idx} className="flex gap-3 pb-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                            <div className="text-slate-500 dark:text-slate-400 min-w-fit">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-750 dark:text-slate-250">
                                {event.action} by {event.reviewer}
                              </p>
                              {event.previousValue && event.newValue && (
                                <p className="text-slate-600 dark:text-slate-400 mt-1">
                                  Updated: "{event.previousValue}" → "{event.newValue}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Compliance Checklist */}
                {showEdit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">Compliance Checklist</p>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${item.answer ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className={item.answer ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          Answer generated & grounded in policy
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${item.citations && item.citations.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className={item.citations && item.citations.length > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          Sources cited & verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${item.status === 'APPROVED' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className={item.status === 'APPROVED' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          Human approved & verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${item.auditTrail && item.auditTrail.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className={item.auditTrail && item.auditTrail.length > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          Audit trail logged & complete
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className={`w-4 h-4 ${item.status === 'APPROVED' && !isLowConfidence ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                        <span className={item.status === 'APPROVED' && !isLowConfidence ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          Export ready
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showEdit && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {item.status !== 'REJECTED' && (
                      <>
                        <Button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditedAnswers({ ...editedAnswers, [item.id]: item.answer || '' });
                          }}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        >
                          Edit & Approve
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Reject Answer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to reject this answer? You can edit and re-approve it
                              later.
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end mt-4">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleReject(item)}>
                                Reject
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-600 dark:text-slate-400">Loading review items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = items.length;
  const completionPercentage =
    totalItems > 0 ? ((approvedItems.length + rejectedItems.length) / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Review Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Overall Completion
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {completionPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Status Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                {/* Total */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
                </div>

                {/* Processing */}
                {pendingItems.length > 0 && (
                  <motion.div
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 font-semibold">
                      <Loader className="w-3 h-3 inline animate-spin mr-1" /> Processing
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {pendingItems.length}
                    </p>
                  </motion.div>
                )}

                {/* Needs Review */}
                {needsReviewItems.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1 font-semibold">
                      Needs Review
                    </p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {needsReviewItems.length}
                    </p>
                  </div>
                )}

                {/* Drafted */}
                {draftedItems.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-1 font-semibold">
                      Drafted
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {draftedItems.length}
                    </p>
                  </div>
                )}

                {/* Approved */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-1 font-semibold">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {approvedItems.length}
                  </p>
                </div>

                {/* Rejected */}
                {rejectedItems.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
                    <p className="text-xs text-red-700 dark:text-red-300 mb-1 font-semibold">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {rejectedItems.length}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              <div className="text-xs text-slate-600 dark:text-slate-400 pt-2">
                {pendingItems.length > 0 && (
                  <p className="flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    {pendingItems.length} question{pendingItems.length !== 1 ? 's' : ''} being
                    processed by AI...
                  </p>
                )}
                {totalItems === 0 && (
                  <p className="text-slate-500 dark:text-slate-500 italic">
                    No questions uploaded yet. Upload an XLSX file to get started.
                  </p>
                )}
                {totalItems > 0 &&
                  approvedItems.length + rejectedItems.length === totalItems && (
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      ✓ All questions reviewed!
                    </p>
                  )}
              </div>

              {/* Export Eligibility & Compliance Summary */}
              {totalItems > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Export Compliance</p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={needsReviewItems.length === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                        {needsReviewItems.length === 0 ? '✓' : '⚠'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Low confidence items: {needsReviewItems.length} remaining
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={pendingItems.length === 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}>
                        {pendingItems.length === 0 ? '✓' : '⧗'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        All questions processed: {pendingItems.length === 0 ? 'Ready' : `${pendingItems.length} pending`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={approvedItems.length === totalItems ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                        {approvedItems.length === totalItems ? '✓' : '—'}
                      </span>
                      <span className={approvedItems.length === totalItems ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                        Export eligible: {approvedItems.length}/{totalItems} approved
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Section */}
      {pendingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Loader className="w-5 h-5 animate-spin" />
                Processing ({pendingItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">{pendingItems.map((item) => renderItem(item, false))}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Needs Review Section */}
      {needsReviewItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                <AlertCircle className="w-5 h-5" />
                Needs Review ({needsReviewItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">{needsReviewItems.map((item) => renderItem(item, true))}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Drafted Section */}
      {draftedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <Clock className="w-5 h-5" />
                Drafted ({draftedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">{draftedItems.map((item) => renderItem(item, true))}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Approved Section */}
      {approvedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <CheckCircle2 className="w-5 h-5" />
                Approved ({approvedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">{approvedItems.map((item) => renderItem(item, false))}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rejected Section */}
      {rejectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                <AlertCircle className="w-5 h-5" />
                Rejected ({rejectedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">{rejectedItems.map((item) => renderItem(item, false))}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                  No items to review
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload an XLSX file with questions to get started
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

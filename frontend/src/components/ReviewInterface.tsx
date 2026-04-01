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
import { Clock, CheckCircle2, AlertCircle, Loader, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: string;
  confidence: number | null;
  citations: CitationItem[];
}

interface CitationItem {
  embeddingId: number;
  score: number;
  snippet: string;
  source: string;
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

  const renderItem = (item: ReviewItem, showEdit = false) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            {item.question}
          </CardTitle>
          <div className="flex gap-2 mt-2 flex-wrap">{getStatusBadge(item.status, item.confidence)}</div>
        </CardHeader>
        <CardContent>
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
            <div>
              {item.answer ? (
                <div className="mb-4">
                  <p className="text-slate-700 dark:text-slate-300 mb-3">{item.answer}</p>
                  {item.citations && item.citations.length > 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <p className="font-semibold mb-1">Sources:</p>
                      <ul className="space-y-1">
                        {item.citations.map((citation, idx) => (
                          <li key={idx} className="text-xs">
                            {citation.snippet} ({citation.source})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 italic">
                  No answer generated yet. Processing...
                </div>
              )}
              {showEdit && (
                <div className="flex gap-2 flex-wrap">
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

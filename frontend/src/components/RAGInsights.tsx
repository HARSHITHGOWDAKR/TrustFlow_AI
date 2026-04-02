import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, TrendingUp, AlertCircle, CheckCircle, BarChart3, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: 'APPROVED' | 'NEEDS_EDIT' | 'FLAGGED' | 'PROCESSING' | 'PENDING';
  confidence: number | null;
}

interface RAGInsightsProps {
  projectId: number;
}

export const RAGInsights: React.FC<RAGInsightsProps> = ({ projectId }) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/projects/${projectId}/review`);
      if (!response.ok) throw new Error('Failed to fetch review data');
      const data = await response.json();
      setReviewItems(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading RAG insights...</p>
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

  // Calculate metrics from review items
  const totalQuestions = reviewItems.length;
  const questionsWithConfidence = reviewItems.filter((q) => q.confidence !== null && q.confidence > 0);
  const avgConfidence =
    questionsWithConfidence.length > 0
      ? questionsWithConfidence.reduce((sum, q) => sum + (q.confidence || 0), 0) / questionsWithConfidence.length
      : 0;

  const highConfidence = questionsWithConfidence.filter((q) => (q.confidence || 0) > 0.7).length;
  const mediumConfidence = questionsWithConfidence.filter(
    (q) => (q.confidence || 0) > 0.4 && (q.confidence || 0) <= 0.7
  ).length;
  const lowConfidence = questionsWithConfidence.filter((q) => (q.confidence || 0) <= 0.4).length;

  const approved = reviewItems.filter((q) => q.status === 'APPROVED').length;
  const needsEdit = reviewItems.filter((q) => q.status === 'NEEDS_EDIT').length;
  const flagged = reviewItems.filter((q) => q.status === 'FLAGGED').length;

  const topQuestions = questionsWithConfidence.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 5);
  const bottomQuestions = questionsWithConfidence
    .sort((a, b) => (a.confidence || 0) - (b.confidence || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Questions</p>
              <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
              <p className="text-xs text-muted-foreground mt-2">{questionsWithConfidence.length} with confidence scores</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Avg Confidence Score</p>
              <p className="text-3xl font-bold text-emerald-600">{(avgConfidence * 100).toFixed(0)}%</p>
              <div className="h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${avgConfidence * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Approved Answers</p>
              <p className="text-3xl font-bold text-purple-600">{approved}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {totalQuestions > 0 ? ((approved / totalQuestions) * 100).toFixed(0) : 0}% approval rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Needs Review</p>
              <p className="text-3xl font-bold text-orange-600">{needsEdit + flagged}</p>
              <p className="text-xs text-muted-foreground mt-2">{needsEdit} edits, {flagged} flagged</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confidence Distribution */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Confidence Distribution
          </CardTitle>
          <CardDescription>Breakdown of answer confidence scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">High Confidence (70-100%)</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{highConfidence}</span>
              </div>
              <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${questionsWithConfidence.length > 0 ? (highConfidence / questionsWithConfidence.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Medium Confidence (40-70%)</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{mediumConfidence}</span>
              </div>
              <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${questionsWithConfidence.length > 0 ? (mediumConfidence / questionsWithConfidence.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Low Confidence (&lt;40%)</span>
                </div>
                <span className="text-lg font-bold text-red-600">{lowConfidence}</span>
              </div>
              <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${questionsWithConfidence.length > 0 ? (lowConfidence / questionsWithConfidence.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Questions */}
      {topQuestions.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Top Performing Questions
            </CardTitle>
            <CardDescription>Highest confidence retrieval results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topQuestions.map((question, idx) => (
                <div key={question.id} className="flex items-start justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded">#{idx + 1}</span>
                      <p className="text-sm font-medium text-foreground">{question.question}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-0">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-200">{question.status}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-emerald-600">{(question.confidence! * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Confidence Questions - Need Attention */}
      {bottomQuestions.length > 0 && lowConfidence > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Questions Needing Attention
            </CardTitle>
            <CardDescription>Lowest confidence retrieval results - review recommended</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomQuestions.slice(0, 5).map((question, idx) => (
                <div key={question.id} className="flex items-start justify-between p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">⚠</span>
                      <p className="text-sm font-medium text-foreground">{question.question}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-0">
                      <Activity className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-700 dark:text-red-200">{question.status}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-red-600">{(question.confidence! * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Summary */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            RAG Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            ✅ <strong>{questionsWithConfidence.length}</strong> questions have been processed through the RAG pipeline
          </p>
          <p className="text-muted-foreground">
            ✅ Average confidence score is <strong>{(avgConfidence * 100).toFixed(0)}%</strong>, indicating{' '}
            {avgConfidence > 0.7 ? 'good' : avgConfidence > 0.5 ? 'moderate' : 'low'} retrieval quality
          </p>
          <p className="text-muted-foreground">
            ✅ <strong>{highConfidence}</strong> questions ({questionsWithConfidence.length > 0 ? ((highConfidence / questionsWithConfidence.length) * 100).toFixed(0) : 0}%) have high
            confidence scores and are ready for approval
          </p>
          {lowConfidence > 0 && (
            <p className="text-muted-foreground">
              ⚠️ <strong>{lowConfidence}</strong> questions with low confidence may need manual review or additional context
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  Shield,
  AlertOctagon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfidenceRecommendation {
  level: 'high' | 'medium' | 'low';
  count: number;
  percentage: number;
  recommendation: string;
  color: string;
}

interface RAGRecommendations {
  confidenceDistribution: {
    high: ConfidenceRecommendation;
    medium: ConfidenceRecommendation;
    low: ConfidenceRecommendation;
  };
  overallHealthScore: number;
  recommendations: string[];
}

interface RAGSummary {
  stats: {
    totalQuestions: number;
    questionsProcessed: number;
    totalRetrievals: number;
    avgChunksPerRetrieval: number;
    avgConfidenceScore: number;
    avgSimilarityScore: number;
    topSimilarityThreshold: number;
  };
  processingHistory: {
    total: number;
    averageProcessingTime: number;
    fastestProcessing: number;
    slowestProcessing: number;
  };
  confidenceDistribution: {
    high: ConfidenceRecommendation;
    medium: ConfidenceRecommendation;
    low: ConfidenceRecommendation;
  };
  overallHealthScore: number;
  recommendations: string[];
}

interface ConfidenceRecommenderProps {
  projectId: number;
}

export const ConfidenceRecommender: React.FC<ConfidenceRecommenderProps> = ({ projectId }) => {
  const [summary, setSummary] = useState<RAGSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfidenceFilter, setSelectedConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadRAGSummary();
  }, [projectId]);

  const loadRAGSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/projects/${projectId}/rag/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RAG summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading confidence analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const { confidenceDistribution, overallHealthScore, recommendations, processingHistory } = summary;

  const confidenceFilters = [
    { level: 'all' as const, label: 'All Results', icon: Filter },
    { level: 'high' as const, label: `High (${confidenceDistribution.high.count})`, icon: CheckCircle, color: 'emerald' },
    { level: 'medium' as const, label: `Medium (${confidenceDistribution.medium.count})`, icon: AlertTriangle, color: 'blue' },
    { level: 'low' as const, label: `Low (${confidenceDistribution.low.count})`, icon: AlertOctagon, color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">RAG System Health</h3>
            <p className="text-sm text-muted-foreground">Overall system confidence and reliability</p>
          </div>
          <div className="text-right">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-primary"
            >
              {overallHealthScore}%
            </motion.div>
            <p className="text-xs text-muted-foreground mt-1">Confidence Score</p>
          </div>
        </div>

        {/* Health Status Indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              overallHealthScore > 75
                ? 'bg-emerald-500 animate-pulse'
                : overallHealthScore > 50
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            {overallHealthScore > 75
              ? '✅ System is performing excellently'
              : overallHealthScore > 50
                ? '⚠️ System is performing adequately'
                : '❌ System needs improvement'}
          </span>
        </div>
      </motion.div>

      {/* Confidence Level Filter */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Filter by Confidence Level
          </CardTitle>
          <CardDescription>Filter results based on retrieval confidence scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {confidenceFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <motion.button
                  key={filter.level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedConfidenceFilter(filter.level)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedConfidenceFilter === filter.level
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-2" />
                  <p className="text-sm font-medium">{filter.label}</p>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            key: 'high' as const,
            icon: CheckCircle,
            color: 'emerald',
            bgColor: 'from-emerald-500/10 to-emerald-500/5',
            borderColor: 'border-emerald-500/20',
            textColor: 'text-emerald-600',
          },
          {
            key: 'medium' as const,
            icon: AlertTriangle,
            color: 'blue',
            bgColor: 'from-blue-500/10 to-blue-500/5',
            borderColor: 'border-blue-500/20',
            textColor: 'text-blue-600',
          },
          {
            key: 'low' as const,
            icon: AlertOctagon,
            color: 'yellow',
            bgColor: 'from-yellow-500/10 to-yellow-500/5',
            borderColor: 'border-yellow-500/20',
            textColor: 'text-yellow-600',
          },
        ].map(({ key, icon: Icon, color, bgColor, borderColor, textColor }) => {
          const data = confidenceDistribution[key];
          const isSelected =
            selectedConfidenceFilter === 'all' || selectedConfidenceFilter === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isSelected ? 1 : 0.6, y: 0 }}
              transition={{ delay: ['high', 'medium', 'low'].indexOf(key) * 0.1 }}
              className={`p-6 rounded-lg bg-gradient-to-br ${bgColor} border ${borderColor} transition-opacity ${
                !isSelected ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-1 capitalize">
                    {key} Confidence
                  </h4>
                  <p className="text-xs text-muted-foreground">{data.recommendation}</p>
                </div>
                <Icon className={`w-5 h-5 ${textColor}`} />
              </div>

              <div className="space-y-3">
                {/* Count */}
                <div>
                  <p className={`text-3xl font-bold ${textColor}`}>{data.count}</p>
                  <p className="text-sm text-muted-foreground">Results ({data.percentage}%)</p>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-background border border-border/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.percentage}%` }}
                    transition={{ delay: ['high', 'medium', 'low'].indexOf(key) * 0.1 + 0.2, duration: 0.6 }}
                    className={`h-full bg-${color}-500`}
                    style={{
                      background:
                        key === 'high'
                          ? 'rgb(16, 185, 129)'
                          : key === 'medium'
                            ? 'rgb(59, 130, 246)'
                            : 'rgb(234, 179, 8)',
                    }}
                  />
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    key === 'high'
                      ? 'bg-emerald-500/20 text-emerald-700'
                      : key === 'medium'
                        ? 'bg-blue-500/20 text-blue-700'
                        : 'bg-yellow-500/20 text-yellow-700'
                  }`}
                >
                  {key === 'high'
                    ? '✅ Reliable'
                    : key === 'medium'
                      ? '⚠️ Review'
                      : '❌ Verify'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Processing Performance Metrics */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Processing Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Processed', value: processingHistory.total, unit: '' },
              {
                label: 'Avg Processing',
                value: processingHistory.averageProcessingTime,
                unit: 'ms',
              },
              { label: 'Fastest', value: processingHistory.fastestProcessing, unit: 'ms' },
              { label: 'Slowest', value: processingHistory.slowestProcessing, unit: 'ms' },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-background/50 border border-border/50"
              >
                <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                  <span className="text-sm ml-1">{metric.unit}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-border/50 border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Actionable insights to improve RAG system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex-shrink-0 text-lg">
                  {rec.includes('✅')
                    ? '✅'
                    : rec.includes('⚠️')
                      ? '⚠️'
                      : rec.includes('❌')
                        ? '❌'
                        : '📌'}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card className="border-border/50 bg-background/30">
        <CardHeader>
          <CardTitle className="text-sm">How to Use Confidence Scores</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">High Confidence (80%+):</strong> These answers are highly confident based on strong retrieval matches. Use them directly.
          </p>
          <p>
            <strong className="text-foreground">Medium Confidence (60-80%):</strong> These answers have moderate confidence. Recommend human review or cross-reference with multiple sources.
          </p>
          <p>
            <strong className="text-foreground">Low Confidence (&lt;60%):</strong> These answers have low confidence. Requires manual review, additional sources, or knowledge base expansion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfidenceRecommender;

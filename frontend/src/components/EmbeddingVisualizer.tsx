import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmbeddingStats {
  chunkId: number;
  source: string;
  chunkIndex: number;
  vectorDimension: number;
  nonZeroValues: number;
  minValue: number;
  maxValue: number;
  averageValue: number;
  magnitude: number;
  pineconeId: string;
}

interface EmbeddingVisualizerProps {
  chunks: Array<{
    id: number;
    source: string;
    chunkIndex: number;
    chunk: string;
    pineconeId?: string;
  }>;
  projectId: number;
}

// Simple hash function to generate consistent colors
const hashToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 55 + (Math.abs(hash) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Generate mock embedding stats for visualization
const generateEmbeddingStats = (chunk: { id: number; source: string; chunkIndex: number; chunk: string; pineconeId?: string }): EmbeddingStats => {
  const text = chunk.chunk;
  const hash = Array.from(text).reduce((h, c) => h + c.charCodeAt(0), 0);

  // Simulate embedding statistics
  const nonZeroValues = Math.floor(text.length * 0.15);
  const minValue = -0.95;
  const maxValue = 0.98;
  const averageValue = Math.sin(hash) * 0.1;
  const magnitude = Math.sqrt(1024);

  return {
    chunkId: chunk.id,
    source: chunk.source,
    chunkIndex: chunk.chunkIndex,
    vectorDimension: 1024,
    nonZeroValues,
    minValue,
    maxValue,
    averageValue,
    magnitude,
    pineconeId: chunk.pineconeId || `vec-${chunk.id}`,
  };
};

export const EmbeddingVisualizer: React.FC<EmbeddingVisualizerProps> = ({ chunks, projectId }) => {
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  useEffect(() => {
    const stats = chunks.map(generateEmbeddingStats);
    setEmbeddingStats(stats);
    if (chunks.length > 0) {
      setSelectedChunk(chunks[0].id);
    }
  }, [chunks]);

  if (embeddingStats.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-muted-foreground">No embeddings available</p>
        </CardContent>
      </Card>
    );
  }

  const selectedStats = embeddingStats.find((s) => s.chunkId === selectedChunk);

  return (
    <div className="space-y-6">
      {/* Embedding Overview Grid */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Embedding Attributes {embeddingStats.length > 1 && `(${embeddingStats.length} chunks)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {embeddingStats.map((stats, idx) => (
              <motion.button
                key={stats.chunkId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedChunk(stats.chunkId)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedChunk === stats.chunkId
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 hover:border-border/70 hover:bg-background/80'
                }`}
              >
                <p className="text-sm font-semibold text-foreground truncate">{stats.source}</p>
                <p className="text-xs text-muted-foreground">Chunk {stats.chunkIndex}</p>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Chunk Embedding Details */}
      {selectedStats && (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base">
                Vector Embedding: {selectedStats.source} - Chunk {selectedStats.chunkIndex}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vector Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Vector Dimension</p>
                  <p className="text-2xl font-bold text-primary">{selectedStats.vectorDimension}</p>
                  <p className="text-xs text-muted-foreground mt-1">D</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Non-Zero Values</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedStats.nonZeroValues}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({((selectedStats.nonZeroValues / selectedStats.vectorDimension) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Vector Magnitude</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {selectedStats.magnitude.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">||v||</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Avg Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedStats.averageValue.toFixed(3)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">μ</p>
                </div>
              </div>

              {/* Value Range */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Value Range Distribution</p>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex items-end justify-between gap-2 h-20">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const height = Math.abs(selectedStats.minValue + (selectedStats.maxValue - selectedStats.minValue) * (i / 20)) * 100;
                      return (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ delay: i * 0.02 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary to-primary/40"
                          style={{
                            backgroundColor: hashToColor(selectedStats.pineconeId + i),
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className="text-sm font-semibold text-foreground">{selectedStats.minValue.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className="text-sm font-semibold text-foreground">{selectedStats.maxValue.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vector ID and Sparsity Info */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pinecone Vector ID</p>
                  <p className="text-xs font-mono text-foreground break-all">{selectedStats.pineconeId}</p>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Sparsity</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-background border border-border/50 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                        style={{
                          width: `${((selectedStats.nonZeroValues / selectedStats.vectorDimension) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs font-semibold w-12 text-right">
                      {((selectedStats.nonZeroValues / selectedStats.vectorDimension) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedStats.nonZeroValues} / {selectedStats.vectorDimension} dimensions active
                  </p>
                </div>
              </div>

              {/* Embedding Characteristics */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Characteristics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-semibold">Dense (Gemini)</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Format</p>
                    <p className="font-semibold">Float32</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Normalization</p>
                    <p className="font-semibold">L2-Normalized</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Distance Metric</p>
                    <p className="font-semibold">Cosine Similarity</p>
                  </div>
                </div>
              </div>

              {/* Similarity Preview */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                <p className="text-sm font-semibold">Similarity to Other Chunks</p>
                <div className="space-y-2">
                  {embeddingStats
                    .filter((s) => s.chunkId !== selectedChunk)
                    .slice(0, 3)
                    .map((stats) => {
                      // Mock similarity score based on chunk index proximity
                      const similarity =
                        Math.cos((selectedStats.chunkIndex - stats.chunkIndex) * Math.PI / 4) * 0.5 + 0.5;

                      return (
                        <div key={stats.chunkId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Chunk {stats.chunkIndex}
                            </span>
                            <span className="font-semibold">{similarity.toFixed(3)}</span>
                          </div>
                          <div className="h-1 rounded-full bg-background border border-border/50 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60"
                              style={{ width: `${similarity * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmbeddingVisualizer;

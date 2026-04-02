import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Database, Zap, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Chunk {
  id: number;
  source: string;
  chunkIndex: number;
  chunk: string;
  pineconeId?: string;
  createdAt: string;
}

interface KnowledgeBaseSummary {
  projectId: number;
  totalChunks: number;
  totalFiles: number;
  totalCharacters: number;
  bySource: Array<{
    source: string;
    chunkCount: number;
    totalCharacters: number;
    chunksPreview: Array<{
      index: number;
      preview: string;
      length: number;
    }>;
  }>;
}

interface ChunkViewerProps {
  projectId: number;
}

export const ChunkViewer: React.FC<ChunkViewerProps> = ({ projectId }) => {
  const [summary, setSummary] = useState<KnowledgeBaseSummary | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadKnowledgeBase();
  }, [projectId]);

  const loadKnowledgeBase = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch summary
      const summaryRes = await fetch(`http://localhost:3000/knowledge-base/${projectId}/chunks/summary`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Fetch all chunks
      const chunksRes = await fetch(`http://localhost:3000/knowledge-base/${projectId}/chunks`);
      if (chunksRes.ok) {
        const chunksData = await chunksRes.json();
        setChunks(chunksData.chunks || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading knowledge base chunks...</p>
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

  if (!summary || chunks.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-8 pb-8 text-center">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No knowledge base chunks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a .txt file to see processed chunks here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Chunks</p>
                <p className="text-2xl font-bold text-primary">{summary.totalChunks}</p>
              </div>
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Files Processed</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalFiles}</p>
              </div>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Characters</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {(summary.totalCharacters / 1000).toFixed(1)}K
                </p>
              </div>
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Chunk Size</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(summary.totalCharacters / summary.totalChunks)} chars
                </p>
              </div>
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* By Source Stats */}
      {summary.bySource.map((source) => (
        <motion.div
          key={source.source}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {source.source}
              </CardTitle>
              <CardDescription>
                {source.chunkCount} chunks | {source.totalCharacters} characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {source.chunksPreview.map((preview) => (
                  <div
                    key={preview.index}
                    className="p-3 rounded-lg bg-background/50 border border-border/30 text-sm"
                  >
                    <p className="font-semibold text-foreground mb-2">Chunk {preview.index + 1}</p>
                    <p className="text-muted-foreground text-xs mb-2">{preview.length} characters</p>
                    <p className="text-foreground">{preview.preview}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Full Chunks View */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Full Chunk Details</span>
            <button
              onClick={() =>
                setShowFullContent((prev) =>
                  Object.values(prev).some((v) => v)
                    ? {}
                    : Object.fromEntries(chunks.map((_, i) => [i, true]))
                )
              }
              className="flex items-center gap-2 px-3 py-1 rounded text-sm bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {Object.values(showFullContent).some((v) => v) ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Expand All
                </>
              )}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chunks.map((chunk, idx) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setShowFullContent((prev) => ({
                      ...prev,
                      [chunk.id]: !prev[chunk.id],
                    }))
                  }
                  className="w-full p-4 bg-background/50 hover:bg-background/80 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold">
                          {chunk.chunkIndex + 1}
                        </span>
                        {chunk.source} - Chunk {chunk.chunkIndex}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {chunk.chunk.length} characters | Pinecone ID: {chunk.pineconeId?.substring(0, 20)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {showFullContent[chunk.id] ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {showFullContent[chunk.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border/50 bg-background/30 p-4"
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap font-mono text-xs">
                      {chunk.chunk}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Created: {new Date(chunk.createdAt).toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChunkViewer;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database, Grid, List, Eye, EyeOff, RefreshCw, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChunkViewer from './ChunkViewer';
import ChunkEditor from './ChunkEditor';
import EmbeddingVisualizer from './EmbeddingVisualizer';

interface Chunk {
  id: number;
  source: string;
  chunkIndex: number;
  chunk: string;
  pineconeId?: string;
  createdAt: string;
}

interface KnowledgeBaseManagerProps {
  projectId: number;
}

type ViewMode = 'overview' | 'chunks' | 'embeddings' | 'editor';

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ projectId }) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedChunkId, setSelectedChunkId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'index' | 'source' | 'size'>('index');
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const loadChunks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/${projectId}/chunks`
      );
      if (response.ok) {
        const data = await response.json();
        setChunks(data.chunks || []);
      } else {
        setError('Failed to load chunks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chunks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChunks();
  }, [projectId]);

  const getSortedChunks = () => {
    let sorted = [...chunks];

    if (filterSource) {
      sorted = sorted.filter((c) => c.source === filterSource);
    }

    switch (sortBy) {
      case 'index':
        sorted.sort((a, b) => {
          if (a.source !== b.source) return a.source.localeCompare(b.source);
          return a.chunkIndex - b.chunkIndex;
        });
        break;
      case 'source':
        sorted.sort((a, b) => a.source.localeCompare(b.source));
        break;
      case 'size':
        sorted.sort((a, b) => a.chunk.length - b.chunk.length);
        break;
    }

    return sorted;
  };

  const groupedChunks = getSortedChunks().reduce(
    (acc, chunk) => {
      if (!acc[chunk.source]) {
        acc[chunk.source] = [];
      }
      acc[chunk.source].push(chunk);
      return acc;
    },
    {} as Record<string, Chunk[]>
  );

  const uniqueSources = Object.keys(groupedChunks);

  if (error && chunks.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <button
            onClick={loadChunks}
            className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (chunks.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-8 pb-8 text-center">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No knowledge base chunks yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Knowledge Base ({chunks.length} chunks)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadChunks}
            disabled={loading}
            className="p-2 rounded hover:bg-secondary transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
            {[
              { mode: 'overview' as ViewMode, icon: Grid, label: 'Overview' },
              { mode: 'chunks' as ViewMode, icon: List, label: 'Chunks' },
              { mode: 'embeddings' as ViewMode, icon: Eye, label: 'Embeddings' },
              { mode: 'editor' as ViewMode, icon: MoreVertical, label: 'Editor' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded bg-yellow-100 border border-yellow-200 text-sm text-yellow-700"
        >
          {error}
        </motion.div>
      )}

      {/* View Modes */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChunkViewer projectId={projectId} />
          </motion.div>
        )}

        {viewMode === 'chunks' && (
          <motion.div
            key="chunks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Sorting Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded text-sm border border-border/50 bg-background"
              >
                <option value="index">Sort by Index</option>
                <option value="source">Sort by Source</option>
                <option value="size">Sort by Size</option>
              </select>

              {uniqueSources.length > 1 && (
                <select
                  value={filterSource || ''}
                  onChange={(e) => setFilterSource(e.target.value || null)}
                  className="px-3 py-2 rounded text-sm border border-border/50 bg-background"
                >
                  <option value="">All Sources</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Chunks by Source */}
            {Object.entries(groupedChunks).map(([source, sourceChunks]) =>
              !filterSource || filterSource === source ? (
                <div key={source} className="space-y-3">
                  <Card className="border-border/50 bg-background/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        📄 {source} ({sourceChunks.length} chunks)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sourceChunks.map((chunk) => (
                          <motion.button
                            key={chunk.id}
                            onClick={() => setSelectedChunkId(chunk.id)}
                            whileHover={{ x: 2 }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedChunkId === chunk.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/30 hover:border-border/50 hover:bg-background/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">Chunk {chunk.chunkIndex}</p>
                                <p className="text-xs text-muted-foreground">
                                  {chunk.chunk.length} characters
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {chunk.chunk.substring(0, 30)}...
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null
            )}
          </motion.div>
        )}

        {viewMode === 'embeddings' && (
          <motion.div
            key="embeddings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <EmbeddingVisualizer chunks={getSortedChunks()} projectId={projectId} />
          </motion.div>
        )}

        {viewMode === 'editor' && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {selectedChunkId && (
              <Card className="border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Editing:'{chunks.find((c) => c.id === selectedChunkId)?.source}' - Chunk{' '}
                  {chunks.find((c) => c.id === selectedChunkId)?.chunkIndex}
                </p>
              </Card>
            )}

            {getSortedChunks().map((chunk, idx) => (
              <ChunkEditor
                key={chunk.id}
                chunk={chunk}
                projectId={projectId}
                onChunkUpdated={loadChunks}
                onChunkDeleted={loadChunks}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {chunks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"
        >
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Total Characters</p>
            <p className="font-semibold text-foreground">
              {chunks.reduce((sum, c) => sum + c.chunk.length, 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Average Size</p>
            <p className="font-semibold text-foreground">
              {Math.round(chunks.reduce((sum, c) => sum + c.chunk.length, 0) / chunks.length)} chars
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Files</p>
            <p className="font-semibold text-foreground">{uniqueSources.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Last Updated</p>
            <p className="font-semibold text-foreground text-xs">
              {chunks.length > 0
                ? new Date(chunks[chunks.length - 1].createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;

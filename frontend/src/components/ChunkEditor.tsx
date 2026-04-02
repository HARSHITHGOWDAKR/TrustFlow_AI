import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Chunk {
  id: number;
  source: string;
  chunkIndex: number;
  chunk: string;
  pineconeId?: string;
  createdAt: string;
}

interface ChunkEditorProps {
  chunk: Chunk;
  projectId: number;
  onChunkUpdated: () => void;
  onChunkDeleted: () => void;
}

export const ChunkEditor: React.FC<ChunkEditorProps> = ({
  chunk,
  projectId,
  onChunkUpdated,
  onChunkDeleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(chunk.chunk);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/${projectId}/chunks/${chunk.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunk: editedContent }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update chunk');
      }

      setIsEditing(false);
      onChunkUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving chunk');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/${projectId}/chunks/${chunk.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete chunk');
      }

      onChunkDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting chunk');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(chunk.chunk);
    setIsEditing(false);
    setError(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Chunk {chunk.chunkIndex} - {chunk.source}
            </CardTitle>
            {!isEditing && !showDeleteConfirm && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  title="Edit chunk"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded hover:bg-red-100 transition-colors text-muted-foreground hover:text-red-600"
                  title="Delete chunk"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded bg-red-100 border border-red-200 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          {isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-48 p-3 rounded border border-border/50 bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-2 rounded text-sm border border-border/50 hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-2 rounded text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap font-mono text-xs">
              {chunk.chunk}
            </p>
          )}

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded bg-red-50 border border-red-200 space-y-3"
            >
              <p className="text-sm text-red-700">
                Are you sure you want to delete this chunk? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded text-sm border border-border/50 hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Chunk'}
                </button>
              </div>
            </motion.div>
          )}

          <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground space-y-1">
            <p>📊 Size: {chunk.chunk.length} characters</p>
            <p>🔗 Pinecone ID: {chunk.pineconeId?.substring(0, 30)}...</p>
            <p>📅 Created: {new Date(chunk.createdAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChunkEditor;

import React, { useState } from 'react';
import { Upload, FileText, Image, Check, AlertCircle, Trash2, ArrowUpRight } from 'lucide-react';

interface IngestionFile {
  id: string;
  name: string;
  type: 'txt' | 'image';
  size: number;
  status: 'pending' | 'vectorizing' | 'completed' | 'error';
  thumbnail?: string;
  uploadedAt: Date;
  vectorCount?: number;
}

interface KnowledgeHubProps {
  files: IngestionFile[];
  onFilesSelected: (files: File[]) => void;
  lastSyncTime?: Date;
  isLoading?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({
  files,
  onFilesSelected,
  lastSyncTime,
  isLoading = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      ['text/plain', 'image/png', 'image/jpeg'].includes(file.type)
    );

    if (droppedFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      onFilesSelected(newFiles);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i.toString() !== id));
  };

  const getFileIcon = (type: string) => {
    return type === 'txt' ? FileText : Image;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'vectorizing':
        return <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />;
    }
  };

  const syncTimeString = lastSyncTime
    ? lastSyncTime.toLocaleTimeString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  const totalVectors = files
    .filter((f) => f.status === 'completed')
    .reduce((sum, f) => sum + (f.vectorCount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Drag-and-Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".txt,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-white">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Supported: TXT, PNG, JPG (Max 50MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Knowledge Base Status
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {totalVectors.toLocaleString()} vectors stored
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last sync: {syncTimeString}
          </p>
        </div>
      </div>

      {/* Ingested Documents Grid */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Ingested Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              const statusBg =
                file.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : file.status === 'vectorizing'
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : file.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50';

              return (
                <div
                  key={file.id}
                  className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${statusBg}`}
                >
                  {/* Thumbnail for images */}
                  {file.type === 'image' && file.thumbnail && (
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <FileIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {getStatusIcon(file.status)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                          file.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : file.status === 'vectorizing'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : file.status === 'error'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {file.status === 'vectorizing' && (
                          <ArrowUpRight className="w-3 h-3 animate-pulse" />
                        )}
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>

                      {file.vectorCount && file.status === 'completed' && (
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {file.vectorCount} chunks
                        </span>
                      )}
                    </div>

                    {/* Upload Date */}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {file.uploadedAt.toLocaleDateString()} at{' '}
                      {file.uploadedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Processing files...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

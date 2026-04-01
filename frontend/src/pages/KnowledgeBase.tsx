import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Zap,
  Database,
  Search,
  FileText,
  BookOpen,
  ArrowRight,
  Loader,
} from 'lucide-react';

interface KnowledgeBasePageProps {
  projectId?: number;
}

interface ProjectOption {
  id: number;
  name: string;
}

interface KnowledgeStats {
  projectId: number;
  chunkCount: number;
  sourceCount: number;
  recentSources: string[];
}

export function KnowledgeBasePage({ projectId }: KnowledgeBasePageProps) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(projectId ?? null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const loadStats = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/knowledge-base/${id}/stats`);
      if (!response.ok) throw new Error('Failed to load knowledge stats');
      const data = await response.json();
      setStats(data as KnowledgeStats);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await fetch('http://localhost:3000/projects');
        if (!response.ok) throw new Error('Failed to load projects');
        const data = await response.json();
        const loadedProjects = (data.projects ?? []) as ProjectOption[];
        setProjects(loadedProjects);

        if (activeProjectId === null && loadedProjects.length > 0) {
          const firstProjectId = loadedProjects[0].id;
          setActiveProjectId(firstProjectId);
          await loadStats(firstProjectId);
        } else if (activeProjectId !== null) {
          await loadStats(activeProjectId);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Could not load projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    void loadProjects();
  }, [projectId]);

  const handleFileUpload = async () => {
    if (!file || activeProjectId === null) return;

    setLoading(true);
    setMessage(null);
    setProcessingStatus('Uploading and processing PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`http://localhost:3000/knowledge-base/${activeProjectId}/ingest`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `✓ Successfully ingested ${data.chunkCount} chunks from PDF!`,
      });
      await loadStats(activeProjectId);
      setFile(null);
      setProcessingStatus(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to ingest PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Knowledge Base
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Upload internal security policies and documentation to power AI-driven answer generation.
          </p>
        </motion.div>

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert
              className={
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900'
              }
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <AlertDescription
                  className={
                    message.type === 'success'
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }
                >
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}

        {/* Processing Status */}
        {processingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader className="h-5 w-5 text-blue-600 dark:text-cyan-400 animate-spin" />
                  <p className="text-blue-800 dark:text-blue-300 font-medium">{processingStatus}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                  Upload Policy Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Select Project
                  </label>
                  <Select
                    value={activeProjectId !== null ? String(activeProjectId) : undefined}
                    onValueChange={(value) => {
                      const selectedId = Number(value);
                      setActiveProjectId(selectedId);
                      void loadStats(selectedId);
                    }}
                    disabled={loadingProjects || projects.length === 0}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue
                        placeholder={
                          loadingProjects ? 'Loading projects...' : 'Select a project'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {projects.length === 0 && !loadingProjects && (
                    <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      No projects found. Create a project first.
                    </p>
                  )}
                </div>

                {/* File Upload Area */}
                <div>
                  <label htmlFor="pdf-input" className="cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        PDF files only (SOC2, ISO27001, Company Policies, etc.)
                      </p>
                    </div>
                  </label>
                  <Input
                    id="pdf-input"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleFileUpload}
                  disabled={!file || loading || activeProjectId === null}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload & Index PDF
                    </>
                  )}
                </Button>

                {/* What Happens Next */}
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-900 p-6 space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                    What happens when you upload:
                  </p>
                  <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <span>
                        <strong>Extraction:</strong> Amazon Textract extracts text from your PDF
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>
                        <strong>Chunking:</strong> Document is split into overlapping sections
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>
                        <strong>Embeddings:</strong> Each chunk converted to vector using Bedrock
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <span>
                        <strong>Storage:</strong> Vectors indexed in PostgreSQL for fast retrieval
                      </span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Knowledge Stats */}
            {stats && (
              <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Knowledge Base Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Chunks Stored</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stats.chunkCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sources</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.sourceCount}
                    </p>
                  </div>
                  {stats.recentSources && stats.recentSources.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Recent Documents
                      </p>
                      <ul className="space-y-1">
                        {stats.recentSources.slice(0, 3).map((source, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300">
                            • {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* How RAG Works */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                  How RAG Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Retrieval
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    When answering a question, AI finds similar chunks using vector similarity
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Augmentation
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Retrieves your exact policy text as context
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Generation
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Claude generates answers grounded only in your policies
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Benefits */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Key Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'No hallucinations',
                  'Policy-grounded answers',
                  'Contextual accuracy',
                  'Audit trail',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

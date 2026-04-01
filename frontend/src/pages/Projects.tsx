import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewInterface } from '@/components/ReviewInterface';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Plus,
  ChevronRight,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: string;
  confidence: number | null;
  citations: Array<{
    embeddingId: number;
    score: number;
    snippet: string;
    source: string;
  }>;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewMode, setReviewMode] = useState<'queue' | 'all'>('queue');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects');
        if (!response.ok) throw new Error('Failed to load projects');
        const data = await response.json();
        setProjects((data.projects ?? []) as Project[]);
      } catch (error) {
        console.error('Projects load error:', error);
      }
    };

    void loadProjects();
  }, []);

  const handleUploadQuestionnaire = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/projects/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProjects((prev) => [data.project, ...prev]);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewItems = async (projectId: number, mode: 'queue' | 'all') => {
    if (mode === 'queue') {
      const queueResponse = await fetch(`http://localhost:3000/projects/${projectId}/review-queue`);
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setReviewItems(queueData.questions ?? []);
        return;
      }
    }

    // Backward-compatible fallback and all-items loader.
    const response = await fetch(`http://localhost:3000/projects/${projectId}/review`);
    if (!response.ok) throw new Error('Failed to fetch review data');
    const data = await response.json();
    setReviewItems(data.questions ?? []);
  };

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    setReviewMode('queue');
    setLoading(true);

    try {
      await loadReviewItems(project.id, 'queue');
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeReviewMode = async (mode: 'queue' | 'all') => {
    if (!selectedProject) return;
    setReviewMode(mode);
    setLoading(true);

    try {
      await loadReviewItems(selectedProject.id, mode);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId: number, status: string, editedAnswer?: string) => {
    try {
      const response = await fetch(`http://localhost:3000/projects/questions/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, editedAnswer }),
      });

      if (!response.ok) throw new Error('Status update failed');

      // Update local state
      setReviewItems(
        reviewItems.map((item) =>
          item.id === itemId
            ? { ...item, status, answer: editedAnswer || item.answer }
            : item,
        ),
      );
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`http://localhost:3000/projects/${selectedProject.id}/export`);

      if (response.status === 409) {
        alert('Cannot export: There are items still needing review');
        return;
      }

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${selectedProject.id}-export.xlsx`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <AlertCircle className="h-3 w-3" /> Needs Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      default:
        return null;
    }
  };

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => setSelectedProject(null)}
              className="mb-6 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {selectedProject.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Created on {new Date(selectedProject.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={reviewMode === 'queue' ? 'default' : 'outline'}
                  onClick={() => handleChangeReviewMode('queue')}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Needs Review
                </Button>
                <Button
                  variant={reviewMode === 'all' ? 'default' : 'outline'}
                  onClick={() => handleChangeReviewMode('all')}
                  disabled={loading}
                >
                  All Questions
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="review" className="text-base">
                Review Questions
              </TabsTrigger>
              <TabsTrigger value="export" className="text-base">
                Export Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="review">
              <ReviewInterface
                items={reviewItems}
                projectId={selectedProject.id}
                onStatusUpdate={handleStatusUpdate}
                isLoading={loading}
              />
            </TabsContent>

            <TabsContent value="export">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                      Export Project Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 p-4">
                      <p className="text-slate-700 dark:text-slate-300">
                        Download all reviewed and approved questions and answers as an Excel file. This file can be submitted directly to security review requests.
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        ⚠️ All items must be approved before export. Please review all pending items first.
                      </p>
                    </div>

                    <Button
                      onClick={handleExport}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Excel File
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Security Review Projects
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Upload questionnaires, review AI drafts, and export approved answers for submission.
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-blue-50 dark:from-blue-900/10 to-cyan-50 dark:to-cyan-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                Upload Questionnaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center hover:border-blue-400 dark:hover:border-cyan-400 transition-colors cursor-pointer">
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Excel files (.xlsx) only
                  </p>
                </label>
              </div>

              <Button
                onClick={handleUploadQuestionnaire}
                disabled={!file || loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-50"
              >
                <Plus className="h-5 w-5 mr-2" />
                {loading ? 'Uploading...' : 'Upload & Create Project'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {projects.length === 0 ? 'No projects yet' : 'Your Projects'}
          </h2>

          {projects.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800 text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Upload your first questionnaire to get started
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleViewProject(project)}
                  className="cursor-pointer group"
                >
                  <Card className="border-slate-200 dark:border-slate-800 h-full hover:border-blue-400 dark:hover:border-cyan-400 hover:shadow-lg dark:hover:shadow-cyan-900/20 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                            {project.name}
                          </CardTitle>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      >
                        Review Questions
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}


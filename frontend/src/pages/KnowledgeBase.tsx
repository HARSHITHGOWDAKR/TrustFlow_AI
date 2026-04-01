import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KnowledgeBasePageProps {
  projectId?: number;
}

interface ProjectOption {
  id: number;
  name: string;
}

export function KnowledgeBasePage({ projectId }: KnowledgeBasePageProps) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(projectId ?? null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

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
          setActiveProjectId(loadedProjects[0].id);
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
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-gray-600">
          Ingest security policy PDFs to create a knowledge base for Q&A automation.
        </p>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}>
          <AlertDescription
            className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {processingStatus && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-blue-800">{processingStatus}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Project</label>
            <Select
              value={activeProjectId !== null ? String(activeProjectId) : undefined}
              onValueChange={(value) => setActiveProjectId(Number(value))}
              disabled={loadingProjects || projects.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProjects ? 'Loading projects...' : 'Select a project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name} (#{project.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projects.length === 0 && !loadingProjects && (
              <p className="text-xs text-gray-600">No projects found. Upload a questionnaire in Projects first.</p>
            )}
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="pdf-input"
            />
            <label htmlFor="pdf-input" className="cursor-pointer">
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {file ? file.name : 'Choose PDF or drag and drop'}
                </p>
                <p className="text-sm text-gray-600">
                  Security policy documents (SOC2, ISO27001, etc.)
                </p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleFileUpload}
            disabled={!file || loading || activeProjectId === null}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Processing...' : 'Upload PDF'}
          </Button>

          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2">
            <p className="font-semibold">What happens next:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>PDF is extracted using Amazon Textract</li>
              <li>Text is split into 1000-char chunks</li>
              <li>Each chunk is embedded using Bedrock Titan v2 (1024-dim)</li>
              <li>Embeddings are stored in PostgreSQL vector database</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Extraction:</strong> Amazon Textract extracts text and tables from complex PDFs.
          </p>
          <p>
            <strong>Chunking:</strong> Long documents are split into overlapping chunks for better search.
          </p>
          <p>
            <strong>Embeddings:</strong> Each chunk is converted to a 1024-dimensional vector using Bedrock Titan v2.
          </p>
          <p>
            <strong>Storage:</strong> Vectors are stored with pgvector for semantic search.
          </p>
          <p>
            <strong>RAG:</strong> When answering questions, the system finds relevant chunks using vector similarity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

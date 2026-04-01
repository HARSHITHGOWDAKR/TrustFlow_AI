import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tab, Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { ReviewInterface } from '@/components/ReviewInterface';

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
  citations: string | null;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Load projects on mount
  useEffect(() => {
    // This would fetch from API: GET /projects
    console.log('Loading projects...');
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
      setProjects([...projects, data.project]);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/projects/${project.id}/review`);
      if (!response.ok) throw new Error('Failed to fetch review data');

      const data = await response.json();
      setReviewItems(data.questions);
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">TrustFlow Projects</h1>

      {!selectedProject ? (
        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Questionnaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button
                onClick={handleUploadQuestionnaire}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? 'Uploading...' : 'Upload & Create Project'}
              </Button>
            </CardContent>
          </Card>

          {/* Projects List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleViewProject(project)}
                      className="w-full"
                    >
                      View & Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
            <Button
              onClick={() => setSelectedProject(null)}
              variant="outline"
            >
              ← Back to Projects
            </Button>
          </div>

          <Tabs defaultValue="review">
            <TabsList className="grid w-full grid-cols-2">
              <Tab value="review">Review</Tab>
              <Tab value="export">Export</Tab>
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
              <Card>
                <CardHeader>
                  <CardTitle>Export Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Export will download all reviewed questions and answers as an Excel file.
                  </p>
                  <p className="text-sm text-yellow-600">
                    ⚠️ All items must be approved or rejected before export.
                  </p>
                  <Button
                    onClick={handleExport}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Download Excel
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

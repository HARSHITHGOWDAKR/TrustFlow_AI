import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  Tag,
  Folder,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: 'FILE' | 'MANUAL' | 'API';
  isActive: boolean;
  uploadedAt: string;
  updatedAt: string;
}

interface KnowledgeBaseUploadProps {
  projectId: number;
  onPolicyAdded?: (policy: Policy) => void;
}

export function KnowledgeBaseUpload({ projectId, onPolicyAdded }: KnowledgeBaseUploadProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });

  // Load policies on mount
  useEffect(() => {
    loadPolicies();
    loadCategories();
    loadStatistics();
  }, [projectId]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/knowledge-base/projects/${projectId}/policies`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`http://localhost:3000/knowledge-base/projects/${projectId}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`http://localhost:3000/knowledge-base/projects/${projectId}/statistics`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/projects/${projectId}/policies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            category: formData.category || 'General',
            tags: formData.tags.split(',').map((t) => t.trim()),
            source: 'MANUAL',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPolicies([result.policy, ...policies]);
        setFormData({ title: '', content: '', category: '', tags: '' });
        setShowUploadForm(false);
        await loadCategories();
        await loadStatistics();
        onPolicyAdded?.(result.policy);
      }
    } catch (error) {
      console.error('Failed to add policy:', error);
      alert('Failed to add policy');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/policies/${policyId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setPolicies(policies.filter((p) => p.id !== policyId));
        await loadStatistics();
      }
    } catch (error) {
      console.error('Failed to delete policy:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadPolicies();
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `http://localhost:3000/knowledge-base/projects/${projectId}/search?keyword=${encodeURIComponent(
          searchKeyword,
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        setPolicies(data.results || []);
      }
    } catch (error) {
      console.error('Failed to search policies:', error);
    } finally {
      setSearching(false);
    }
  };

  const filteredPolicies = filterCategory
    ? policies.filter((p) => p.category === filterCategory)
    : policies;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Policies', value: stats.totalPolicies, color: 'bg-blue-500/20 text-blue-700' },
            { label: 'Categories', value: stats.categories, color: 'bg-purple-500/20 text-purple-700' },
            { label: 'Total Chunks', value: stats.totalChunks, color: 'bg-green-500/20 text-green-700' },
            {
              label: 'Last Updated',
              value: new Date().toLocaleDateString(),
              color: 'bg-orange-500/20 text-orange-700',
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search policies by keyword..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching} variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button onClick={() => setShowUploadForm(!showUploadForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Policy
            </Button>
          </div>

          {/* Categories Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(cat)}
                  className="gap-1"
                >
                  <Folder className="w-3 h-3" />
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Policy Form */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Add New Policy
                </CardTitle>
                <CardDescription>Upload a policy directly to the knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPolicy} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Policy Title *</label>
                      <Input
                        placeholder="e.g., Data Retention Policy"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Input
                        placeholder="e.g., Data Protection"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                    <Input
                      placeholder="e.g., GDPR, privacy, compliance"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Policy Content *</label>
                    <textarea
                      className="w-full p-3 rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-64 font-mono text-sm"
                      placeholder="Paste the full policy content here..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.content.length} characters
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Save Policy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Policies List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Loading policies...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredPolicies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {searchKeyword ? 'No policies found matching your search' : 'No policies yet. Add one to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredPolicies.map((policy, idx) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-l-4 border-l-primary hover:shadow-md transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">{policy.title}</h3>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {policy.category && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              {policy.category}
                            </span>
                          )}
                          {policy.tags && policy.tags.length > 0 && (
                            <>
                              {policy.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-background border border-border/50 text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </>
                          )}
                          <span className="text-xs bg-background border border-border/50 text-muted-foreground px-2 py-1 rounded-full">
                            {new Date(policy.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{policy.content}</p>

                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="gap-1 text-xs">
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs">
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            policy.isActive
                              ? 'bg-emerald-500/20 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {policy.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Empty State Tips */}
      {filteredPolicies.length === 0 && !loading && (
        <Card className="border-informational/50 bg-informational/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-informational flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Get started with your knowledge base:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Click "Add Policy" to upload your company policies</li>
                  <li>Organize policies by category (GDPR, Security, HR, etc.)</li>
                  <li>Use tags for better searchability and filtering</li>
                  <li>The RAG system will use these policies to answer questions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

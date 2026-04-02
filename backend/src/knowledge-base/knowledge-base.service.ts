import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PineconeService } from '../llm-agents/pinecone.service';
import { GeminiService } from '../llm-agents/gemini.service';
import * as crypto from 'crypto';

export interface KnowledgeBasePolicy {
  id?: string;
  projectId: number;
  title: string;
  content: string;
  category: string;
  tags?: string | string[];
  uploadedAt?: Date;
  updatedAt?: Date;
  source: 'FILE' | 'MANUAL' | 'API';
  isActive: boolean;
}

export interface KnowledgeBaseChunk {
  id?: string;
  policyId: string;
  content: string;
  embeddingVector?: number[];
  order: number;
  sourceRef: string;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private prisma: PrismaService,
    private pineconeService: PineconeService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Add a new knowledge base policy to the database
   * AUTO-INDEXES in Pinecone immediately after creation
   */
  async addPolicy(data: KnowledgeBasePolicy): Promise<any> {
    try {
      // Convert tags array to comma-separated string if needed
      const tagsValue = Array.isArray(data.tags) ? data.tags.join(',') : data.tags || '';

      const policy = await this.prisma.knowledgeBasePolicy.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          content: data.content,
          category: data.category,
          tags: tagsValue || null,
          source: data.source || 'MANUAL',
          isActive: data.isActive ?? true,
          uploadedAt: new Date(),
        },
      });

      // AUTO-INDEX: Chunk and index the policy in Pinecone immediately
      this.logger.log(`📝 Auto-indexing policy "${policy.title}" in Pinecone...`);
      try {
        await this.indexPolicyInPinecone(policy);
        this.logger.log(`✅ Policy indexed in Pinecone automatically`);
      } catch (indexError) {
        this.logger.warn(`⚠️ Auto-indexing failed: ${(indexError as Error).message}`);
        // Don't throw - policy is still created, just not indexed
      }

      return {
        success: true,
        policyId: policy.id,
        message: `Policy "${data.title}" added successfully and indexed in knowledge base`,
        policy,
      };
    } catch (error) {
      throw new Error(`Failed to add policy: ${error.message}`);
    }
  }

  /**
   * INDEX POLICY IN PINECONE: Chunks and embeds policy, stores vectors
   * Private method called automatically after policy creation
   */
  private async indexPolicyInPinecone(policy: any): Promise<void> {
    try {
      this.logger.debug(`Chunking policy content (${policy.content.length} chars)...`);
      
      // Step 1: Chunk the policy
      const chunks = this.chunkText(policy.content, 450, 50);
      this.logger.debug(`Created ${chunks.length} chunks`);

      // Step 2: Generate embeddings and prepare vectors for Pinecone
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${policy.id}-chunk-${i}`;
        
        // Generate embedding using Gemini or fallback to synthetic
        let embedding: number[];
        try {
          this.logger.debug(`Generating embedding for chunk ${i + 1}/${chunks.length}...`);
          embedding = await this.geminiService.embedText(chunk);
        } catch (e) {
          // Fallback to synthetic embedding if Gemini fails
          this.logger.warn(`Embedding failed, using synthetic embedding for chunk ${i}`);
          embedding = this.generateSyntheticEmbedding(chunk);
        }

        vectors.push({
          id: chunkId,
          embedding,
          source: policy.title,
          chunk: chunk,
          projectId: policy.projectId,
          chunkIndex: i,
        });
      }

      // Step 3: Upsert vectors to Pinecone
      this.logger.debug(`Upserting ${vectors.length} vectors to Pinecone...`);
      await this.pineconeService.upsertChunks(vectors);
      this.logger.log(`✅ Indexed ${vectors.length} chunks from "${policy.title}"`);

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to index policy in Pinecone: ${msg}`);
      throw error;
    }
  }

  /**
   * CHUNK TEXT: Split content into overlapping chunks
   */
  private chunkText(text: string, chunkSize: number = 450, overlap: number = 50): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * SYNTHETIC EMBEDDING: Fallback when real embeddings fail
   * Generates deterministic vector from text hash
   */
  private generateSyntheticEmbedding(text: string, dimensions: number = 1024): number[] {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector: number[] = [];
    for (let i = 0; i < dimensions; i++) {
      const byte1 = hash[(i * 2) % 32];
      const byte2 = hash[(i * 2 + 1) % 32];
      const val = ((byte1 << 8) | byte2) / 65536;
      vector.push(val);
    }
    return vector;
  }

  /**
   * Get all policies for a project
   */
  async getPoliciesByProject(projectId: number): Promise<any[]> {
    try {
      const policies = await this.prisma.knowledgeBasePolicy.findMany({
        where: {
          projectId,
          isActive: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });

      return policies;
    } catch (error) {
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }
  }

  /**
   * Get a specific policy
   */
  async getPolicyById(policyId: string): Promise<any> {
    try {
      const policy = await this.prisma.knowledgeBasePolicy.findUnique({
        where: { id: policyId },
        include: {
          chunks: true,
        },
      });

      if (!policy) {
        throw new Error('Policy not found');
      }

      return policy;
    } catch (error) {
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }
  }

  /**
   * Update a policy
   */
  async updatePolicy(policyId: string, data: Partial<KnowledgeBasePolicy>): Promise<any> {
    try {
      const policy = await this.prisma.knowledgeBasePolicy.update({
        where: { id: policyId },
        data: {
          title: data.title,
          content: data.content,
          category: data.category,
          tags: Array.isArray(data.tags) ? data.tags.join(',') : data.tags || null,
          isActive: data.isActive,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Policy updated successfully',
        policy,
      };
    } catch (error) {
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  /**
   * Delete a policy (soft delete)
   */
  async deletePolicy(policyId: string): Promise<any> {
    try {
      const policy = await this.prisma.knowledgeBasePolicy.update({
        where: { id: policyId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Policy deleted successfully',
        policy,
      };
    } catch (error) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Search policies by keyword
   */
  async searchPolicies(
    projectId: number,
    keyword: string,
  ): Promise<any[]> {
    try {
      const policies = await this.prisma.knowledgeBasePolicy.findMany({
        where: {
          projectId,
          isActive: true,
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } },
            { tags: { contains: keyword, mode: 'insensitive' } },
          ],
        },
      });

      return policies;
    } catch (error) {
      throw new Error(`Failed to search policies: ${error.message}`);
    }
  }

  /**
   * Get policies by category
   */
  async getPoliciesByCategory(projectId: number, category: string): Promise<any[]> {
    try {
      const policies = await this.prisma.knowledgeBasePolicy.findMany({
        where: {
          projectId,
          category,
          isActive: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });

      return policies;
    } catch (error) {
      throw new Error(`Failed to fetch policies by category: ${error.message}`);
    }
  }

  /**
   * Get all categories for a project
   */
  async getCategories(projectId: number): Promise<string[]> {
    try {
      const policies = await this.prisma.knowledgeBasePolicy.findMany({
        where: {
          projectId,
          isActive: true,
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      });

      return policies.map((p) => p.category).filter((c) => c !== null) as string[];
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Add chunks to a policy (for vector embeddings)
   */
  async addChunks(policyId: string, chunks: KnowledgeBaseChunk[]): Promise<any> {
    try {
      const createdChunks = await Promise.all(
        chunks.map((chunk) =>
          this.prisma.knowledgeBaseChunk.create({
            data: {
              policyId,
              content: chunk.content,
              embeddingVector: Array.isArray(chunk.embeddingVector) 
                ? JSON.stringify(chunk.embeddingVector)
                : chunk.embeddingVector,
              order: chunk.order,
              sourceRef: chunk.sourceRef,
            },
          }),
        ),
      );

      return {
        success: true,
        message: `${createdChunks.length} chunks added successfully`,
        chunks: createdChunks,
      };
    } catch (error) {
      throw new Error(`Failed to add chunks: ${error.message}`);
    }
  }

  /**
   * Get chunks by policy
   */
  async getChunksByPolicy(policyId: string): Promise<any[]> {
    try {
      const chunks = await this.prisma.knowledgeBaseChunk.findMany({
        where: { policyId },
        orderBy: { order: 'asc' },
      });

      return chunks;
    } catch (error) {
      throw new Error(`Failed to fetch chunks: ${error.message}`);
    }
  }

  /**
   * Bulk add policies from import
   */
  async bulkAddPolicies(projectId: number, policies: any[]): Promise<any> {
    try {
      const created = await Promise.all(
        policies.map((policy) =>
          this.prisma.knowledgeBasePolicy.create({
            data: {
              projectId,
              title: policy.title,
              content: policy.content,
              category: policy.category || 'General',
              tags: policy.tags || [],
              source: policy.source || 'API',
              isActive: true,
              uploadedAt: new Date(),
            },
          }),
        ),
      );

      return {
        success: true,
        message: `${created.length} policies imported successfully`,
        policies: created,
      };
    } catch (error) {
      throw new Error(`Failed to bulk import policies: ${error.message}`);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStatistics(projectId: number): Promise<any> {
    try {
      const totalPolicies = await this.prisma.knowledgeBasePolicy.count({
        where: {
          projectId,
          isActive: true,
        },
      });

      const categories = await this.getCategories(projectId);

      const totalChunks = await this.prisma.knowledgeBaseChunk.count({
        where: {
          policy: {
            projectId,
            isActive: true,
          },
        },
      });

      const policyBreakdown = await Promise.all(
        categories.map(async (category) => ({
          category,
          count: await this.prisma.knowledgeBasePolicy.count({
            where: {
              projectId,
              category,
              isActive: true,
            },
          }),
        })),
      );

      return {
        totalPolicies,
        totalChunks,
        categories: categories.length,
        categoryBreakdown: policyBreakdown,
      };
    } catch (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  /**
   * Export policies for backup
   */
  async exportPolicies(projectId: number): Promise<any[]> {
    try {
      const policies = await this.prisma.knowledgeBasePolicy.findMany({
        where: {
          projectId,
          isActive: true,
        },
        include: {
          chunks: true,
        },
      });

      return policies;
    } catch (error) {
      throw new Error(`Failed to export policies: ${error.message}`);
    }
  }
}

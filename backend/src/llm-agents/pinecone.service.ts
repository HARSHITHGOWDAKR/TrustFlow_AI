import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';

export interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    source: string;
    chunk: string;
    chunkIndex?: number;
  };
}

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private client: Pinecone;
  private indexName = process.env.PINECONE_INDEX || 'trustflow-kb';

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }

    this.client = new Pinecone({
      apiKey,
    });
  }

  /**
   * RETRIEVAL AGENT: Smart query and retrieval from Pinecone
   */
  async retrieveChunks(
    queryEmbedding: number[],
    topK: number = 6,
    projectId: number,
  ): Promise<PineconeMatch[]> {
    try {
      const index = this.client.Index(this.indexName);

      const results = await index.query({
        vector: queryEmbedding,
        topK,
        filter: {
          projectId: { $eq: projectId },
        },
        includeMetadata: true,
      });

      return (results.matches || []).map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as {
          source: string;
          chunk: string;
          chunkIndex?: number;
        },
      }));
    } catch (error) {
      this.logger.error('Retrieval from Pinecone failed:', error);
      throw error;
    }
  }

  /**
   * UPSERT: Store knowledge base chunks in Pinecone
   */
  async upsertChunks(
    chunks: Array<{
      id: string;
      embedding: number[];
      source: string;
      chunk: string;
      projectId: number;
      chunkIndex?: number;
    }>,
  ): Promise<void> {
    try {
      const index = this.client.Index(this.indexName);

      const vectors = chunks.map((c) => ({
        id: c.id,
        values: c.embedding,
        metadata: {
          source: c.source,
          chunk: c.chunk,
          projectId: c.projectId,
          chunkIndex: c.chunkIndex || 0,
        },
      }));

      await index.upsert(vectors);
      this.logger.log(`Upserted ${chunks.length} chunks to Pinecone`);
    } catch (error) {
      this.logger.error('Upsert to Pinecone failed:', error);
      throw error;
    }
  }

  /**
   * LIST: Get all chunks for a project (for debugging/viewing)
   */
  async listProjectChunks(projectId: number): Promise<Array<{
    id: string;
    source: string;
    chunk: string;
    chunkIndex: number;
  }>> {
    try {
      const index = this.client.Index(this.indexName);

      // Use queryByMetadata or list to get all chunks
      // Since Pinecone doesn't have a direct list method, we'll use a paginated query
      const chunks: Array<{
        id: string;
        source: string;
        chunk: string;
        chunkIndex: number;
      }> = [];

      // Fetch metadata stats
      const stats = await index.describeIndexStats();
      this.logger.debug(`Index stats:`, stats);

      // Note: Pinecone free tier has limitations on listing
      // This is a workaround - in production, store metadata in a database
      this.logger.log(`Project ${projectId} - full metadata retrieval requires database lookup`);

      return chunks;
    } catch (error) {
      this.logger.error('Failed to list chunks from Pinecone:', error);
      throw error;
    }
  }
}


import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import type { KnowledgeBasePolicy } from './knowledge-base.service';

@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  /**
   * POST /knowledge-base/projects/:projectId/policies
   * Add a new knowledge base policy
   */
  @Post('projects/:projectId/policies')
  async addPolicy(
    @Param('projectId') projectId: string,
    @Body() policyData: KnowledgeBasePolicy,
  ) {
    try {
      const result = await this.knowledgeBaseService.addPolicy({
        ...policyData,
        projectId: parseInt(projectId),
      });
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/policies
   * Get all policies for a project
   */
  @Get('projects/:projectId/policies')
  async getPolicies(@Param('projectId') projectId: string) {
    try {
      const policies = await this.knowledgeBaseService.getPoliciesByProject(
        parseInt(projectId),
      );
      return {
        success: true,
        count: policies.length,
        policies,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /knowledge-base/policies/:policyId
   * Get a specific policy
   */
  @Get('policies/:policyId')
  async getPolicy(@Param('policyId') policyId: string) {
    try {
      const policy = await this.knowledgeBaseService.getPolicyById(policyId);
      return {
        success: true,
        policy,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * PUT /knowledge-base/policies/:policyId
   * Update a policy
   */
  @Put('policies/:policyId')
  async updatePolicy(
    @Param('policyId') policyId: string,
    @Body() updateData: Partial<KnowledgeBasePolicy>,
  ) {
    try {
      const result = await this.knowledgeBaseService.updatePolicy(
        policyId,
        updateData,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * DELETE /knowledge-base/policies/:policyId
   * Delete a policy (soft delete)
   */
  @Delete('policies/:policyId')
  async deletePolicy(@Param('policyId') policyId: string) {
    try {
      const result = await this.knowledgeBaseService.deletePolicy(policyId);
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/search
   * Search policies by keyword
   */
  @Get('projects/:projectId/search')
  async searchPolicies(
    @Param('projectId') projectId: string,
    @Query('keyword') keyword: string,
  ) {
    try {
      if (!keyword) {
        throw new Error('Keyword is required');
      }
      const results = await this.knowledgeBaseService.searchPolicies(
        parseInt(projectId),
        keyword,
      );
      return {
        success: true,
        count: results.length,
        results,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/categories/:category
   * Get policies by category
   */
  @Get('projects/:projectId/categories/:category')
  async getPoliciesByCategory(
    @Param('projectId') projectId: string,
    @Param('category') category: string,
  ) {
    try {
      const policies = await this.knowledgeBaseService.getPoliciesByCategory(
        parseInt(projectId),
        category,
      );
      return {
        success: true,
        category,
        count: policies.length,
        policies,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/categories
   * Get all categories for a project
   */
  @Get('projects/:projectId/categories')
  async getCategories(@Param('projectId') projectId: string) {
    try {
      const categories = await this.knowledgeBaseService.getCategories(
        parseInt(projectId),
      );
      return {
        success: true,
        count: categories.length,
        categories,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /knowledge-base/policies/:policyId/chunks
   * Add chunks to a policy (for vector embeddings)
   */
  @Post('policies/:policyId/chunks')
  async addChunks(
    @Param('policyId') policyId: string,
    @Body() chunkData: any,
  ) {
    try {
      const result = await this.knowledgeBaseService.addChunks(
        policyId,
        chunkData.chunks,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /knowledge-base/policies/:policyId/chunks
   * Get chunks by policy
   */
  @Get('policies/:policyId/chunks')
  async getChunks(@Param('policyId') policyId: string) {
    try {
      const chunks = await this.knowledgeBaseService.getChunksByPolicy(
        policyId,
      );
      return {
        success: true,
        count: chunks.length,
        chunks,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /knowledge-base/projects/:projectId/bulk-import
   * Bulk import policies
   */
  @Post('projects/:projectId/bulk-import')
  async bulkImport(
    @Param('projectId') projectId: string,
    @Body() importData: any,
  ) {
    try {
      const result = await this.knowledgeBaseService.bulkAddPolicies(
        parseInt(projectId),
        importData.policies,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/statistics
   * Get knowledge base statistics
   */
  @Get('projects/:projectId/statistics')
  async getStatistics(@Param('projectId') projectId: string) {
    try {
      const stats = await this.knowledgeBaseService.getStatistics(
        parseInt(projectId),
      );
      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /knowledge-base/projects/:projectId/export
   * Export all policies for backup
   */
  @Get('projects/:projectId/export')
  async exportPolicies(@Param('projectId') projectId: string) {
    try {
      const policies = await this.knowledgeBaseService.exportPolicies(
        parseInt(projectId),
      );
      return {
        success: true,
        count: policies.length,
        policies,
        exportedAt: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

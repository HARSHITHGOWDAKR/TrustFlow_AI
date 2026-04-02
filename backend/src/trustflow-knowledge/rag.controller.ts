import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { RAGService, QuestionRAGData, RAGStats } from './rag.service';

@Controller('projects/:projectId/rag')
export class RAGController {
  constructor(private readonly ragService: RAGService) {}

  /**
   * GET /projects/:projectId/rag-stats
   * Get RAG statistics for a project including confidence and retrieval metrics
   */
  @Get('stats')
  async getRAGStats(@Param('projectId') projectId: string) {
    const stats = await this.ragService.getRAGStats(parseInt(projectId, 10));
    return {
      success: true,
      stats,
    };
  }

  /**
   * POST /projects/:projectId/rag/process-question
   * Process a question through RAG pipeline
   * Returns: question, retrieved chunks, confidence score, processing steps
   */
  @Post('process-question')
  @HttpCode(HttpStatus.OK)
  async processQuestion(
    @Param('projectId') projectId: string,
    @Body() body: { questionId: number; question: string },
  ) {
    if (!body.question || body.question.trim().length === 0) {
      throw new BadRequestException('Question text is required');
    }

    const ragData = await this.ragService.processQuestionRAG(
      parseInt(projectId, 10),
      body.questionId,
      body.question,
    );

    return {
      success: true,
      message: 'Question processed through RAG pipeline',
      data: ragData,
    };
  }

  /**
   * GET /projects/:projectId/rag/history
   * Get RAG processing history for all questions
   */
  @Get('history')
  async getProcessingHistory(@Param('projectId') projectId: string) {
    const history = this.ragService.getProcessingHistory();

    return {
      success: true,
      totalProcessed: history.length,
      averageConfidence: history.length > 0
        ? (history.reduce((sum, q) => sum + q.confidenceScore, 0) / history.length * 100).toFixed(1)
        : 0,
      history,
    };
  }

  /**
   * GET /projects/:projectId/rag/question/:questionId
   * Get RAG data for a specific question
   */
  @Get('question/:questionId')
  async getQuestionRAGData(
    @Param('projectId') projectId: string,
    @Param('questionId') questionId: string,
  ) {
    const ragData = this.ragService.getRAGDataForQuestion(
      parseInt(projectId, 10),
      parseInt(questionId, 10),
    );

    if (!ragData) {
      return {
        success: false,
        message: 'No RAG data found for this question',
        data: null,
      };
    }

    return {
      success: true,
      data: ragData,
    };
  }

  /**
   * GET /projects/:projectId/rag/all-data
   * Get all RAG data for a project
   */
  @Get('all-data')
  async getAllRAGData(@Param('projectId') projectId: string) {
    const allData = this.ragService.getAllRAGData();

    return {
      success: true,
      totalQuestions: allData.length,
      data: allData,
    };
  }

  /**
   * GET /projects/:projectId/rag/confidence-threshold
   * Get recommendations based on confidence thresholds
   */
  async getConfidenceThresholdRecommendationsData(projectId: number) {
    const confidenceData = await this.ragService.getConfidenceDistribution(projectId);
    const history = this.ragService.getProcessingHistory();

    const calculateOverallHealthScore = (data: any) => {
      const highCount = data.high?.count || 0;
      const mediumCount = data.medium?.count || 0;
      const lowCount = data.low?.count || 0;
      const totalCount = highCount + mediumCount + lowCount;
      
      if (totalCount === 0) return 75;
      return (
        (highCount * 1.0 + mediumCount * 0.6 + lowCount * 0.2) / totalCount * 100
      ).toFixed(1);
    };

    return {
      high: confidenceData.high,
      medium: confidenceData.medium,
      low: confidenceData.low,
      overallHealthScore: calculateOverallHealthScore(confidenceData),
      recommendations: this.getRecommendations(history),
    };
  }

  /**
   * GET /projects/:projectId/rag/confidence-threshold (public endpoint)
   * Get recommendations based on confidence thresholds
   */
  @Get('confidence-threshold')
  async getConfidenceThresholdRecommendations(@Param('projectId') projectId: string) {
    const history = this.ragService.getProcessingHistory();

    const highConfidence = history.filter(q => q.confidenceScore > 0.8).length;
    const mediumConfidence = history.filter(q => q.confidenceScore > 0.6 && q.confidenceScore <= 0.8).length;
    const lowConfidence = history.filter(q => q.confidenceScore <= 0.6).length;

    return {
      success: true,
      confidenceDistribution: {
        high: {
          count: highConfidence,
          percentage: history.length > 0 ? ((highConfidence / history.length) * 100).toFixed(1) : 0,
          recommendation: 'Use these answers with high confidence',
          color: 'emerald',
        },
        medium: {
          count: mediumConfidence,
          percentage: history.length > 0 ? ((mediumConfidence / history.length) * 100).toFixed(1) : 0,
          recommendation: 'Verify with human review or additional sources',
          color: 'blue',
        },
        low: {
          count: lowConfidence,
          percentage: history.length > 0 ? ((lowConfidence / history.length) * 100).toFixed(1) : 0,
          recommendation: 'Requires manual review or knowledge base expansion',
          color: 'yellow',
        },
      },
      overallHealthScore: history.length > 0
        ? (
            (highConfidence * 1.0 + mediumConfidence * 0.6 + lowConfidence * 0.2) / history.length * 100
          ).toFixed(1)
        : 0,
      recommendations: [
        highConfidence > history.length * 0.7
          ? '✅ RAG system is performing excellently - most answers have high confidence'
          : '⚠️  Consider expanding knowledge base or improving query expansion',
        mediumConfidence > 0
          ? '📋 Review medium-confidence results for accuracy improvement opportunities'
          : '✅ No medium-confidence results',
        lowConfidence > history.length * 0.2
          ? '❌ High number of low-confidence results - Knowledge base needs expansion'
          : '✅ Low-confidence results are minimal',
      ],
    };
  }

  /**
   * GET /projects/:projectId/rag/summary
   * Get complete RAG summary including stats, distribution, and recommendations
   */
  @Get('summary')
  async getRAGSummary(@Param('projectId') projectId: string) {
    const stats = await this.ragService.getRAGStats(parseInt(projectId, 10));
    const history = this.ragService.getProcessingHistory();
    const confidenceData = await this.getConfidenceThresholdRecommendationsData(parseInt(projectId, 10));

    return {
      success: true,
      stats,
      processingHistory: {
        total: history.length,
        averageProcessingTime: history.length > 0
          ? (history.reduce((sum, q) => sum + q.totalProcessingTime, 0) / history.length).toFixed(0)
          : 0,
        fastestProcessing: history.length > 0 ? Math.min(...history.map(q => q.totalProcessingTime)) : 0,
        slowestProcessing: history.length > 0 ? Math.max(...history.map(q => q.totalProcessingTime)) : 0,
      },
      confidenceDistribution: confidenceData,
      overallHealthScore: confidenceData.overallHealthScore,
      recommendations: this.getRecommendations(history),
    };
  }

  private getRecommendations(history: QuestionRAGData[]): string[] {
    const highConfidence = history.filter(q => q.confidenceScore > 0.8).length;
    const mediumConfidence = history.filter(q => q.confidenceScore > 0.6 && q.confidenceScore <= 0.8).length;
    const lowConfidence = history.filter(q => q.confidenceScore <= 0.6).length;

    return [
      highConfidence > history.length * 0.7
        ? '✅ RAG system is performing excellently - most answers have high confidence'
        : '⚠️  Consider expanding knowledge base or improving query expansion',
      mediumConfidence > 0
        ? '📋 Review medium-confidence results for accuracy improvement opportunities'
        : '✅ No medium-confidence results',
      lowConfidence > history.length * 0.2
        ? '❌ High number of low-confidence results - Knowledge base needs expansion'
        : '✅ Low-confidence results are minimal',
    ];
  }

}

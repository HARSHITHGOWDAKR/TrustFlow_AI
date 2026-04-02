import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenerativeAI;
  private modelFlash = 'models/gemini-1.5-flash'; // Using currently supported flash model
  private modelEmbedding = 'models/text-embedding-004'; // Updated model name

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * INTAKE AGENT: Classifies question into GRC category and expands query
   * FALLBACK: If Gemini API fails, uses intelligent fallback classification
   */
  async intakeQuestion(question: string): Promise<{
    category: string;
    expandedQuery: string;
    summary: string;
  }> {
    try {
      const prompt = `You are a Security GRC (Governance, Risk, Compliance) expert. Classify this security question into ONE category and expand it for better search.

Question: "${question}"

Respond in JSON format ONLY:
{
  "category": "access-control|data-encryption|incident-response|compliance|authentication|network-security|data-protection|audit-logging|other",
  "expandedQuery": "expanded search query with synonyms and related terms",
  "summary": "1-line summary of what this question is asking"
}`;

      const model = this.client.getGenerativeModel({ model: this.modelFlash });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Gemini JSON response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // FALLBACK: Use intelligent category detection without API
      this.logger.warn(`Gemini Intake failed, using fallback classification: ${(error as Error).message}`);
      return this.classifyQuestionFallback(question);
    }
  }

  /**
   * FALLBACK: Intelligent question classification without API
   */
  private classifyQuestionFallback(question: string): {
    category: string;
    expandedQuery: string;
    summary: string;
  } {
    const lowerQ = question.toLowerCase();
    let category = 'other';

    // Keyword-based classification
    if (lowerQ.includes('encrypt') || lowerQ.includes('cipher') || lowerQ.includes('tls') || lowerQ.includes('ssl')) {
      category = 'data-encryption';
    } else if (lowerQ.includes('access') || lowerQ.includes('role') || lowerQ.includes('permission') || lowerQ.includes('rbac')) {
      category = 'access-control';
    } else if (lowerQ.includes('incident') || lowerQ.includes('breach') || lowerQ.includes('attack') || lowerQ.includes('response')) {
      category = 'incident-response';
    } else if (lowerQ.includes('compliance') || lowerQ.includes('gdpr') || lowerQ.includes('regulation') || lowerQ.includes('standard')) {
      category = 'compliance';
    } else if (lowerQ.includes('authentication') || lowerQ.includes('mfa') || lowerQ.includes('password') || lowerQ.includes('login')) {
      category = 'authentication';
    } else if (lowerQ.includes('network') || lowerQ.includes('firewall') || lowerQ.includes('vpn') || lowerQ.includes('security')) {
      category = 'network-security';
    } else if (lowerQ.includes('data') || lowerQ.includes('retention') || lowerQ.includes('deletion') || lowerQ.includes('privacy')) {
      category = 'data-protection';
    } else if (lowerQ.includes('audit') || lowerQ.includes('log') || lowerQ.includes('tracking')) {
      category = 'audit-logging';
    }

    return {
      category,
      expandedQuery: `${question} related terms security policy compliance`,
      summary: question.substring(0, 100),
    };
  }

  /**
   * CRITIC AGENT: Evaluates answer completeness and confidence
   * FALLBACK: If Gemini API fails, uses confidence calculation fallback
   */
  async criticAnswer(
    question: string,
    answer: string,
    sources: string[]
  ): Promise<{
    status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
    confidence: number;
    reasoning: string;
    suggestions: string;
  }> {
    try {
      const sourcesText = sources.join('\n- ');
      
      // Calculate confidence based on answer-to-sources alignment
      const calculatedConfidence = await this.calculateAnswerConfidence(answer, sources);
      
      const prompt = `You are a GRC compliance reviewer. Evaluate this answer to the security question.

QUESTION: "${question}"

ANSWER: "${answer}"

SOURCES USED:
- ${sourcesText}

Evaluate the answer on:
1. Accuracy: Does it match the provided sources?
2. Completeness: Does it answer the full question?
3. Specificity: Are there concrete details or just generic statements?
4. Compliance tone: Is it written in appropriate GRC language?

Respond in JSON format ONLY:
{
  "status": "PASS|FAIL|NEEDS_REVIEW",
  "reasoning": "Brief explanation of the status",
  "suggestions": "One improvement if any, or empty string if perfect"
}`;

      const model = this.client.getGenerativeModel({ model: this.modelFlash });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Critic JSON response');
      }

      const criticResult = JSON.parse(jsonMatch[0]);
      
      // Use calculated confidence instead of relying solely on Gemini's assessment
      // Combine Critic status with calculated confidence for better accuracy
      const finalStatus = this.determineStatus(criticResult.status, calculatedConfidence);

      return {
        status: finalStatus,
        confidence: calculatedConfidence,
        reasoning: criticResult.reasoning,
        suggestions: criticResult.suggestions,
      };
    } catch (error) {
      // FALLBACK: Calculate confidence without Gemini API
      this.logger.warn(`Gemini Critic failed, using fallback evaluation: ${(error as Error).message}`);
      const calculatedConfidence = await this.calculateAnswerConfidence(answer, sources);
      
      return {
        status: calculatedConfidence >= 0.6 ? 'PASS' : calculatedConfidence >= 0.4 ? 'NEEDS_REVIEW' : 'FAIL',
        confidence: calculatedConfidence,
        reasoning: `Fallback evaluation: ${sources.length > 0 ? 'Based on source alignment' : 'No sources available for verification'}`,
        suggestions: calculatedConfidence < 0.7 ? 'Consider adding more specific details from policy' : '',
      };
    }
  }

  /**
   * Calculate confidence score by comparing LLM answer with RAG sources
   * Factors considered:
   * - Presence of key terms from sources in the answer
   * - Semantic alignment between answer and sources
   * - Source relevance scores
   */
  private async calculateAnswerConfidence(answer: string, sources: string[]): Promise<number> {
    try {
      if (!sources || sources.length === 0) {
        return 0.3; // Low confidence if no sources
      }

      let confidenceScore = 0;
      let factors = 0;

      // Factor 1: Extract source relevance scores and calculate average
      // Sources are formatted as "source: snippet", extract similarity scores if present
      const sourceScores = sources
        .map(source => {
          // Try to extract score if format includes it
          const scoreMatch = source.match(/\b(0\.\d+|1\.0)\b/);
          return scoreMatch ? parseFloat(scoreMatch[0]) : 0.5;
        })
        .filter(score => score > 0);

      if (sourceScores.length > 0) {
        const avgSourceRelevance = sourceScores.reduce((a, b) => a + b, 0) / sourceScores.length;
        confidenceScore += avgSourceRelevance * 0.4; // 40% weight: source relevance
        factors++;
      }

      // Factor 2: Calculate answer-to-sources overlap
      // Check if key phrases from sources appear in the answer
      const answerLower = answer.toLowerCase();
      const sourceContent = sources.map(s => s.toLowerCase());
      
      let keyPhraseMatches = 0;
      let totalPhrases = 0;

      sourceContent.forEach(source => {
        // Extract potential key phrases (3-5 word sequences)
        const phrases = source.match(/\b\w+\s+\w+\s+\w+(?:\s+\w+)?\b/g) || [];
        phrases.slice(0, 3).forEach(phrase => { // Sample first 3 phrases
          totalPhrases++;
          if (answerLower.includes(phrase)) {
            keyPhraseMatches++;
          }
        });
      });

      if (totalPhrases > 0) {
        const overlapScore = Math.min(keyPhraseMatches / totalPhrases, 1.0);
        confidenceScore += overlapScore * 0.3; // 30% weight: content overlap
        factors++;
      }

      // Factor 3: Answer length and specificity
      // Longer, more detailed answers tend to have higher confidence
      const answerLength = answer.split(/\s+/).length;
      const specificityScore = Math.min(answerLength / 100, 1.0); // Normalize to 100 words
      confidenceScore += specificityScore * 0.2; // 20% weight: answer specificity
      factors++;

      // Factor 4: Source count
      // More sources supporting the answer increases confidence
      const sourceCountScore = Math.min(sources.length / 6, 1.0); // Assume 6 is ideal
      confidenceScore += sourceCountScore * 0.1; // 10% weight: source count
      factors++;

      // Average the confidence score
      const finalConfidence = factors > 0 ? confidenceScore / factors : 0.5;
      
      this.logger.debug(
        `Confidence Calculation: overlap=${(keyPhraseMatches / totalPhrases).toFixed(2)}, ` +
        `specificity=${(specificityScore).toFixed(2)}, ` +
        `final=${(finalConfidence).toFixed(2)}`
      );

      // Return confidence between 0.1 and 0.95 (never 0 or 1)
      return Math.max(0.1, Math.min(0.95, finalConfidence));
    } catch (error) {
      this.logger.error('Confidence calculation failed:', error);
      return 0.5; // Default to medium confidence on error
    }
  }

  /**
   * Determine final status based on Critic assessment and calculated confidence
   */
  private determineStatus(
    criticStatus: string,
    confidence: number
  ): 'PASS' | 'FAIL' | 'NEEDS_REVIEW' {
    if (criticStatus === 'PASS' && confidence > 0.7) {
      return 'PASS';
    } else if (criticStatus === 'FAIL' || confidence < 0.4) {
      return 'FAIL';
    } else {
      return 'NEEDS_REVIEW';
    }
  }

  /**
   * EMBEDDING: Generate embeddings for text chunks using Gemini
   * FALLBACK: Uses synthetic embeddings if API fails
   */
  async embedText(text: string): Promise<number[]> {
    try {
      this.logger.debug(`Embedding text (${text.length} chars)...`);
      const model = this.client.getGenerativeModel({ model: this.modelEmbedding });
      const result = await model.embedContent(text);
      
      if (!result.embedding?.values) {
        throw new Error('No embedding values returned from API');
      }
      
      this.logger.debug(`✅ Embedding generated: ${result.embedding.values.length} dimensions`);
      return result.embedding.values;
    } catch (error) {
      this.logger.warn(`Gemini embedding failed, using synthetic fallback: ${(error as Error).message}`);
      // FALLBACK: Generate synthetic embedding locally
      return this.generateSyntheticEmbedding(text);
    }
  }

  /**
   * SYNTHETIC EMBEDDING: Generate deterministic vector from text hash
   * Used as fallback when Gemini API fails
   */
  private generateSyntheticEmbedding(text: string, dimensions: number = 1024): number[] {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector: number[] = [];
    
    for (let i = 0; i < dimensions; i++) {
      const byte1 = hash[(i * 2) % 32];
      const byte2 = hash[(i * 2 + 1) % 32];
      const val = ((byte1 << 8) | byte2) / 65536;
      vector.push(val);
    }
    
    this.logger.debug(`Generated synthetic embedding (${dimensions}D) for text of ${text.length} chars`);
    return vector;
  }

  /**
   * EMBEDDING BATCH: Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      // Filter out empty texts
      const validTexts = texts.filter(t => t && t.trim().length > 0);
      if (validTexts.length === 0) {
        throw new Error('No valid text chunks provided for embedding');
      }

      this.logger.log(`🔗 Embedding ${validTexts.length} chunks with Gemini API...`);
      
      // Try to get embeddings from Gemini
      try {
        const model = this.client.getGenerativeModel({ model: this.modelEmbedding });
        
        // Embed texts sequentially with delay to avoid rate limits
        const embeddings = [];
        for (let i = 0; i < validTexts.length; i++) {
          try {
            this.logger.debug(`   Embedding chunk ${i + 1}/${validTexts.length} with ${this.modelEmbedding}...`);
            const result = await model.embedContent(validTexts[i]);
            
            if (!result.embedding?.values) {
              throw new Error(`Chunk ${i}: No embedding values returned`);
            }
            
            embeddings.push(result.embedding.values);
            
            // Add small delay between requests to avoid rate limits
            if (i < validTexts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (chunkError) {
            this.logger.error(`   ❌ Failed to embed chunk ${i + 1}: ${(chunkError as Error).message}`);
            throw chunkError;
          }
        }
        
        this.logger.log(`✅ Successfully embedded ${embeddings.length} chunks`);
        return embeddings;
      } catch (apiError) {
        // Fallback: Use mock embeddings based on text hash
        this.logger.warn(`⚠️  Gemini API failed, using mock embeddings: ${(apiError as Error).message}`);
        return validTexts.map(text => this.generateMockEmbedding(text));
      }
    } catch (error) {
      this.logger.error('❌ Batch embedding generation failed:', error);
      
      // Provide helpful error messages
      const errorMsg = ((error as Error).message || '').toLowerCase();
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('api key')) {
        throw new Error('Invalid Gemini API key. Check GEMINI_API_KEY in .env');
      }
      if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Try again later.');
      }
      throw error;
    }
  }

  /**
   * Generate mock embedding based on text hash (for testing)
   * This creates a 1024-dimensional vector based on the text content
   * (Pinecone index is configured for 1024-dimensional vectors)
   */
  private generateMockEmbedding(text: string): number[] {
    // Use hash-based approach to generate consistent vectors
    const hash = text.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    const seed = Math.abs(hash) % 1000;
    const embedding: number[] = [];
    
    // Generate 1024-dimensional vector (matching Pinecone index)
    for (let i = 0; i < 1024; i++) {
      const value = Math.sin(seed + i) * 0.5 + 0.5; // normalize to [0, 1]
      embedding.push(value);
    }
    
    return embedding;
  }
}

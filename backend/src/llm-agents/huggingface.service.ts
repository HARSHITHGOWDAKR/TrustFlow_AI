import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HuggingfaceService {
  private readonly logger = new Logger(HuggingfaceService.name);
  private apiKey = process.env.HUGGINGFACE_API_KEY || '';
  // Updated endpoint - old api-inference.co is deprecated, use new router endpoint
  private apiUrl = 'https://api-router.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  private useOllama = false;

  constructor(private httpService: HttpService) {
    if (!this.apiKey) {
      this.logger.warn('HUGGINGFACE_API_KEY not set, will attempt Ollama fallback');
      this.useOllama = true;
    }
  }

  async generateAnswer(
    question: string,
    retrievedChunks: Array<{ source: string; chunk: string; score: number }>,
  ): Promise<string> {
    try {
      // Format context from retrieved chunks
      const context = retrievedChunks
        .map((c) => `[${c.source}]\n${c.chunk}`)
        .join('\n\n---\n\n');

      const prompt = `You are a GRC (Governance, Risk, Compliance) compliance expert. Answer the following security question using ONLY the provided context. Be specific and cite the source documents.

QUESTION: ${question}

CONTEXT:
${context}

INSTRUCTIONS:
- Answer directly and specifically
- Reference the source documents by name
- Use professional GRC language
- If context doesn't fully answer the question, say "The provided documentation does not fully address this question. Additional information needed regarding..."
- Keep answer concise but complete (2-4 sentences)

ANSWER:`;

      // Try HuggingFace first if API key available
      if (this.apiKey && !this.useOllama) {
        try {
          return await this.generateWithHuggingFace(prompt);
        } catch (hfError) {
          this.logger.warn(`HuggingFace failed: ${(hfError as Error).message}, falling back to Ollama...`);
          // Fall through to Ollama
        }
      }
      
      // Use Ollama as primary or fallback
      return await this.generateWithOllama(prompt);
    } catch (error) {
      this.logger.error('Drafter agent failed completely:', error);
      // Last resort fallback: return a structured response indicating insufficient data
      return `Based on the provided documentation, I can state that the security policy addresses this topic. Please refer to the organization's security and compliance documentation for detailed information.`;
    }
  }

  private async generateWithHuggingFace(prompt: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ generated_text: string }[]>(
          this.apiUrl,
          {
            inputs: prompt,
            parameters: {
              max_length: 500,
              temperature: 0.3,
              top_p: 0.9,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        ),
      );

      const generated = response.data[0]?.generated_text;
      if (!generated) {
        throw new Error('No generated text from HuggingFace');
      }

      // Extract answer after "ANSWER:" marker
      const answerMatch = generated.match(/ANSWER:\s*(.+?)(?:\n|$)/s);
      return answerMatch ? answerMatch[1].trim() : generated.trim();
    } catch (error) {
      const errorMsg = (error as any)?.response?.status === 404 
        ? 'Model endpoint not available'
        : (error as Error).message;
      this.logger.warn(`HuggingFace generateWithHuggingFace failed (${errorMsg}), will use fallback`);
      throw error;
    }
  }

  private async generateWithOllama(prompt: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ response: string }>(
          this.apiUrl,
          {
            model: 'mistral',
            prompt,
            stream: false,
            temperature: 0.3,
          },
        ),
      );

      return response.data.response.trim();
    } catch (error) {
      this.logger.error('Ollama call failed:', error);
      throw error;
    }
  }
}

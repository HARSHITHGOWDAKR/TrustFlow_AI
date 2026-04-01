import { Injectable, Logger } from '@nestjs/common';
import { AnalyzeDocumentCommand, TextractClient } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

@Injectable()
export class AwsIntegrationService {
  private readonly logger = new Logger(AwsIntegrationService.name);
  private readonly textractClient = new TextractClient({});
  private readonly bedrockClient = new BedrockRuntimeClient({});

  async parseDocumentWithTextract(buffer: Buffer) {
    try {
      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: buffer },
        FeatureTypes: ['TABLES', 'FORMS'],
      });

      const response = await this.textractClient.send(command);
      const blocks = response.Blocks ?? [];

      const textBlocks = blocks.filter((block) => block.BlockType === 'LINE');
      const pageText = textBlocks.map((block) => block.Text).filter(Boolean).join('\n');

      const tableBlocks = blocks.filter((block) => block.BlockType === 'TABLE');
      const tables = tableBlocks.map((table) => ({ id: table.Id, rowCount: table.RowIndex, columnCount: table.ColumnIndex }));

      return { text: pageText, tables, raw: response };
    } catch (error) {
      this.logger.error('Textract extract error', error as Error);
      if ((error as any).name === 'ThrottlingException') {
        throw new Error('Textract service limit exceeded. Please retry with backoff.');
      }
      throw error;
    }
  }

  private async streamToString(stream: any): Promise<string> {
    if (!stream) return '';
    if (typeof stream === 'string') return stream;
    if (Buffer.isBuffer(stream)) return stream.toString('utf-8');
    if (stream instanceof Uint8Array) return Buffer.from(stream).toString('utf-8');
    if (typeof stream?.transformToString === 'function') {
      return stream.transformToString();
    }

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
      } else if (typeof chunk === 'number') {
        chunks.push(Buffer.from([chunk]));
      } else if (chunk?.value && chunk.value instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk.value));
      } else {
        this.logger.warn(`Unsupported Bedrock stream chunk type: ${typeof chunk}`);
      }
    }

    return Buffer.concat(chunks).toString('utf-8');
  }

  private async invokeBedrockModel(modelId: string, payload: object) {
    try {
      const body = JSON.stringify(payload);
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body,
      });

      const response = await this.bedrockClient.send(command);
      const textBody = await this.streamToString(response.body);
      if (!textBody) throw new Error('No response body from Bedrock model');

      try {
        return JSON.parse(textBody);
      } catch (e) {
        this.logger.warn('Bedrock response is not JSON, returning raw body');
        return { outputText: textBody };
      }
    } catch (error) {
      this.logger.error(`Bedrock invokeModel failed for ${modelId}`, error as Error);
      if ((error as any).name === 'ThrottlingException') {
        throw new Error('Bedrock service limit exceeded. Please retry with backoff.');
      }
      throw error;
    }
  }

  async generateEmbeddings(text: string, dimensions = 1024) {
    const result = await this.invokeBedrockModel('amazon.titan-embed-text-v2:0', {
      inputText: text,
      dimensions,
      normalize: true,
    });

    if (!result?.embedding) {
      throw new Error('Unexpected Bedrock Titan embedding response format');
    }

    if (!Array.isArray(result.embedding) || result.embedding.length !== dimensions) {
      throw new Error(`Embedding dimension mismatch. Expected ${dimensions}`);
    }

    return result.embedding;
  }

  async generateDraftAnswer(prompt: string) {
    const result = await this.invokeBedrockModel('anthropic.claude-3-5-sonnet-20240620-v1:0', {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const contentText = Array.isArray(result?.content)
      ? result.content
          .map((block: { text?: string }) => block?.text ?? '')
          .join('\n')
          .trim()
      : '';

    const output = (contentText || result?.outputText || result?.output || '').trim();
    if (!output) {
      throw new Error('Unexpected Bedrock Claude response format');
    }

    return output;
  }
}

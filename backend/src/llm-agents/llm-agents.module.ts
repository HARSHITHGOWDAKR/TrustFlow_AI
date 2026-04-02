import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeminiService } from './gemini.service';
import { PineconeService } from './pinecone.service';
import { HuggingfaceService } from './huggingface.service';
import { AgentsService } from './agents.service';

@Module({
  imports: [HttpModule],
  providers: [
    GeminiService,
    PineconeService,
    HuggingfaceService,
    AgentsService,
  ],
  exports: [GeminiService, PineconeService, HuggingfaceService, AgentsService],
})
export class LlmAgentsModule {}

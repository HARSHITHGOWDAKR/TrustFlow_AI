// Status enum for questions
export enum QuestionItemStatus {
  PENDING = "PENDING",
  DRAFTED = "DRAFTED",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Question item response
export interface QuestionItemResponse {
  id: number;
  projectId: number;
  question: string;
  answer: string | null;
  status: QuestionItemStatus;
  confidence: number | null;
  citations: string | null;
  createdAt: string;
  updatedAt: string;
}

// Project response
export interface ProjectResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: QuestionItemResponse[];
}

// Create project request
export interface CreateProjectRequestDto {
  name: string;
  description?: string;
  questions: Array<{
    question: string;
  }>;
}

// Upload questionnaire response
export interface UploadQuestionnaireResponse {
  project: ProjectResponse;
  questionsCount: number;
}

// Review item (for frontend display)
export interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: QuestionItemStatus;
  confidence: number | null;
  citations: string | null;
}

// Review data response
export interface ReviewDataResponse {
  projectId: number;
  questions: ReviewItem[];
}

// Update question status request
export interface UpdateQuestionStatusDto {
  status: QuestionItemStatus;
  editedAnswer?: string; // Allow inline editing during review
}

// Export response
export interface ExportResponse {
  items: Array<{
    question: string;
    finalAnswer: string;
    status: QuestionItemStatus;
  }>;
}

// Knowledge base feed request (for PDF ingestion)
export interface KnowledgeBaseFeedDto {
  projectId: number;
  source: string; // PDF filename or URL
}

// Embedding result
export interface EmbeddingResult {
  chunk: string;
  vector: number[];
  source: string;
  similarity?: number;
}

// Draft job result
export interface DraftJobResult {
  processed: number;
  needsReview: number;
  drafted: number;
}

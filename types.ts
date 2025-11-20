export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface TechnicalAnalysis {
  markdown: string;
}

export interface GenerationResult {
  originalImage: string;
  generatedImage: string | null;
  analysis: string | null;
}

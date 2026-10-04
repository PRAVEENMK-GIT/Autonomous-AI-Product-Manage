export type SourceType = "feedback" | "survey" | "competitor";
export type DocStatus = "pending" | "processing" | "processed" | "failed";
export type Sentiment = "positive" | "negative" | "neutral" | "mixed";
export type ReviewStatus = "ai_draft" | "edited";
export type ReportStatus = "draft" | "approved";

export interface CompetitorDetails {
  features: string[];
  pricing: string[];
  strengths: string[];
  weaknesses: string[];
  moves: string[];
}

export interface RawDocument {
  id: string;
  sourceType: SourceType;
  text: string;
  rating?: number | null;
  externalRef?: string | null;
  textHash: string;
  status: DocStatus;
  errorMessage?: string | null;
  isDuplicate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  documentId: string;
  sourceType: SourceType;
  sentiment: Sentiment;
  themes: string[];
  painPoints: string[];
  featureRequests: string[];
  competitorMentions: string[];
  competitor?: CompetitorDetails | null;
  summary: string;
  model: string;
  promptVersion: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeExample {
  documentId: string;
  quote: string;
}

export interface ThemeStat {
  theme: string;
  count: number;
  totalDocs: number;
  examples: ThemeExample[];
}

export interface Report {
  id: string;
  title: string;
  topThemes: ThemeStat[];
  briefMarkdown: string;
  sourceDocCount: number;
  status: ReportStatus;
  approvedAt?: string | null;
  model: string;
  promptVersion: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

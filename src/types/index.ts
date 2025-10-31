// ============================================================================
// Core Types for PluralView MVP
// ============================================================================

// ----------------------------------------------------------------------------
// Database Schema Types
// ----------------------------------------------------------------------------

export interface Analysis {
  id: string;
  created_at: string;
  topic: string;
  cached: boolean;
  cache_age_minutes?: number;
}

export interface Perspective {
  id: string;
  analysis_id: string;
  perspective_type: PerspectiveType;
  content: string;
  sources: Source[];
  average_trust_score: number;
  bias_detected?: BiasDetection | null;
  created_at: string;
}

export interface ReflectiveQuestion {
  id: string;
  analysis_id: string;
  question: string;
  order_index: number;
  created_at: string;
}

export interface CostLog {
  id: string;
  created_at: string;
  analysis_id?: string;
  operation_type: OperationType;
  model: AIModel;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  perspective_type?: PerspectiveType;
  success: boolean;
  error_message?: string;
}

export interface SourceFeedback {
  id: string;
  created_at: string;
  analysis_id: string;
  source_url: string;
  feedback_type: 'relevant' | 'not_relevant';
  user_id?: string;
}

// ----------------------------------------------------------------------------
// Perspective Types
// ----------------------------------------------------------------------------

export type PerspectiveType =
  | 'technical'
  | 'popular'
  | 'institutional'
  | 'academic'
  | 'conservative'
  | 'progressive';

export const PERSPECTIVE_NAMES: Record<PerspectiveType, string> = {
  technical: 'Técnica',
  popular: 'Popular',
  institutional: 'Institucional',
  academic: 'Acadêmica',
  conservative: 'Conservadora',
  progressive: 'Progressista',
};

// ----------------------------------------------------------------------------
// Source and Trust Score Types
// ----------------------------------------------------------------------------

export interface Source {
  url: string;
  title: string;
  snippet: string;
  published_date?: string;
  score?: number;
  trust_score?: number;
  trust_level?: TrustLevel;
}

export interface TrustScore {
  score: number;
  level: TrustLevel;
  factors: TrustScoreFactors;
}

export type TrustLevel = 'high' | 'medium' | 'low-medium' | 'low';

export interface TrustScoreFactors {
  domainType: number;
  httpsBonus: number;
  recencyBonus: number;
  contentQuality: number;
  metadataBonus: number;
  redFlagPenalty: number;
}

// ----------------------------------------------------------------------------
// Bias Detection Types
// ----------------------------------------------------------------------------

export interface BiasDetection {
  types: BiasType[];
  description: string;
}

export type BiasType =
  | 'ideological'
  | 'conflict_of_interest'
  | 'methodological'
  | 'underrepresentation'
  | 'unstated_assumptions';

export const BIAS_TYPE_NAMES: Record<BiasType, string> = {
  ideological: 'Ideológico/Político',
  conflict_of_interest: 'Conflitos de Interesse',
  methodological: 'Limitações Metodológicas',
  underrepresentation: 'Sub-representação de Perspectivas',
  unstated_assumptions: 'Premissas Não Declaradas',
};

// ----------------------------------------------------------------------------
// API Types
// ----------------------------------------------------------------------------

export type AIModel =
  | 'claude-3-5-haiku-20241022'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo';

export type OperationType =
  | 'perspective_generation'
  | 'source_filtering'
  | 'question_generation'
  | 'perspective_comparison'
  | 'bias_detection';

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface AnalyzeRequest {
  topic: string;
}

export interface AnalyzeResponse {
  analysisId: string;
  topic: string;
  perspectives: PerspectiveResponse[];
  questions: string[];
  cached?: boolean;
  cacheAgeMinutes?: number;
}

export interface PerspectiveResponse {
  type: PerspectiveType;
  name: string;
  content: string;
  sources: Source[];
  averageTrustScore: number;
  biasDetected?: BiasDetection;
}

export interface ComparePerspectivesRequest {
  analysisId: string;
  perspectiveTypes: PerspectiveType[];
}

export interface ComparePerspectivesResponse {
  comparison: PerspectiveComparison;
}

export interface PerspectiveComparison {
  selectedPerspectives: PerspectiveType[];
  consensus: string[];
  divergences: string[];
  contradictions: string[];
  synthesis: string;
}

export interface FeedbackSourceRequest {
  analysisId: string;
  sourceUrl: string;
  feedbackType: 'relevant' | 'not_relevant';
}

export interface CostStatsRequest {
  period: '24h' | '7d' | '30d' | '90d';
}

export interface CostStatsResponse {
  period: string;
  totalCost: number;
  totalRequests: number;
  averageCostPerRequest: number;
  byModel: ModelStats[];
  byOperation: OperationStats[];
  topAnalyses: TopAnalysis[];
  trend: TrendData;
}

export interface ModelStats {
  model: AIModel;
  totalCost: number;
  requests: number;
  averageCost: number;
  percentage: number;
}

export interface OperationStats {
  operation: OperationType;
  totalCost: number;
  requests: number;
  averageCost: number;
}

export interface TopAnalysis {
  id: string;
  topic: string;
  cost: number;
  date: string;
}

export interface TrendData {
  change: number;
  direction: 'up' | 'down' | 'stable';
}

// ----------------------------------------------------------------------------
// Temporal Query Types
// ----------------------------------------------------------------------------

export interface TemporalQuery {
  originalQuery: string;
  enhancedQuery: string;
  timeRange?: {
    from: Date;
    to: Date;
  };
  detected: boolean;
}

// ----------------------------------------------------------------------------
// Component Props Types
// ----------------------------------------------------------------------------

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

export interface PerspectiveRadarChartProps {
  perspectives: PerspectiveResponse[];
}

export interface ExportButtonProps {
  analysisId: string;
  topic: string;
  perspectives: PerspectiveResponse[];
  questions: string[];
}

export interface InstallPWAButtonProps {
  className?: string;
}

// ----------------------------------------------------------------------------
// Hook Return Types
// ----------------------------------------------------------------------------

export interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  promptInstall: () => void;
  updateAvailable: boolean;
}

export interface UseStreamingAnalysisReturn {
  data: Partial<AnalyzeResponse> | null;
  error: Error | null;
  isLoading: boolean;
  startAnalysis: (topic: string) => Promise<void>;
  reset: () => void;
  progress: number;
  perspectives: PerspectiveResponse[];
  questions: string[];
  totalPerspectives: number;
}

// ----------------------------------------------------------------------------
// Validation Schema Types
// ----------------------------------------------------------------------------

export interface ValidatedTopicInput {
  topic: string;
}

export interface ValidatedComparisonInput {
  analysisId: string;
  perspectiveTypes: PerspectiveType[];
}

export interface ValidatedFeedbackInput {
  analysisId: string;
  sourceUrl: string;
  feedbackType: 'relevant' | 'not_relevant';
}

// ----------------------------------------------------------------------------
// Error Types
// ----------------------------------------------------------------------------

export interface APIError {
  error: string;
  details?: string;
  statusCode: number;
}

export interface RateLimitError extends APIError {
  retryAfter: number;
}

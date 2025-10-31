import { z, ZodSchema } from 'zod';

/**
 * Schemas de validação com Zod
 * Previne injection attacks e garante integridade dos dados
 */

// Schema para análise de tópicos
export const analyzeSchema = z.object({
  topic: z.string()
    .min(3, 'Tópico deve ter no mínimo 3 caracteres')
    .max(500, 'Tópico deve ter no máximo 500 caracteres')
    .trim()
    .refine(
      (val) => !/[<>{}[\]\\]/g.test(val),
      'Tópico contém caracteres inválidos'
    )
});

// Schema para comparação de perspectivas
export const comparePerspectivesSchema = z.object({
  perspectives: z.array(
    z.object({
      type: z.string().min(1),
      content: z.string().min(1)
    })
  ).min(2, 'Mínimo de 2 perspectivas necessárias')
   .max(6, 'Máximo de 6 perspectivas'),
  topic: z.string().min(1).max(500)
});

// Schema para feedback de fontes
export const feedbackSourceSchema = z.object({
  analysisId: z.string().uuid('ID de análise inválido'),
  perspectiveType: z.enum([
    'tecnica',
    'popular',
    'institucional',
    'academica',
    'conservadora',
    'progressista'
  ]),
  sourceUrl: z.string().url('URL inválida').max(2048),
  feedback: z.enum(['relevant', 'not_relevant'])
});

// Schema para ID de análise
export const analysisIdSchema = z.object({
  id: z.string().uuid('ID inválido')
});

/**
 * Resultado da validação
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper para validar dados e retornar erro formatado
 * @param schema - Schema Zod
 * @param data - Dados a serem validados
 * @returns Resultado da validação
 */
export function validateData<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errors };
    }
    return { success: false, error: 'Validation error' };
  }
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param str - String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onerror=, etc)
    .substring(0, 10000); // Limite de tamanho
}

/**
 * Sanitiza objeto recursivamente
 * @param obj - Objeto a ser sanitizado
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

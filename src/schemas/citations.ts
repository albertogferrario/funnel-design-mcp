import { z } from "zod";

export const CitationSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  accessedAt: z.string().datetime(),
  relevantFields: z.array(z.string()),
});

export type Citation = z.infer<typeof CitationSchema>;

export const ResearchMetadataSchema = z.object({
  citations: z.array(CitationSchema).optional(),
  researchedAt: z.string().datetime().optional(),
  researchModel: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  rawContent: z.string().optional(),
});

export type ResearchMetadata = z.infer<typeof ResearchMetadataSchema>;

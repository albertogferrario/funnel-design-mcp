import { z } from "zod";
import {
  setOpenAIApiKey,
  getOpenAIApiKey,
  executeDeepResearch,
  type DeepResearchModel,
} from "../openai/client.js";
import {
  generateResearchPrompt,
  SYSTEM_PROMPT,
  type FrameworkType,
  type ResearchContext,
} from "../openai/prompts.js";
import { parseResearchResult, type Citation } from "../openai/parser.js";
import { createEntity } from "../storage/index.js";
import type {
  AidaFunnel,
  ContentFunnel,
  ConversionFunnel,
  CustomerJourney,
} from "../schemas/index.js";

export const configureOpenAISchema = z.object({
  apiKey: z.string().describe("OpenAI API key for Deep Research"),
});

export async function configureOpenAI(
  args: z.infer<typeof configureOpenAISchema>
): Promise<{ success: boolean; message: string }> {
  setOpenAIApiKey(args.apiKey);
  return {
    success: true,
    message: "OpenAI API key configured successfully",
  };
}

export async function checkOpenAIConfig(): Promise<{
  configured: boolean;
  source: string | null;
}> {
  const key = getOpenAIApiKey();
  if (!key) {
    return { configured: false, source: null };
  }
  return {
    configured: true,
    source: process.env.OPENAI_API_KEY ? "environment" : "runtime",
  };
}

export const deepResearchSchema = z.object({
  projectId: z.string().describe("Project to associate research with"),
  frameworkType: z
    .enum([
      "aida-funnel",
      "content-funnel",
      "conversion-funnel",
      "customer-journey",
    ])
    .describe("Framework type to research"),
  context: z
    .object({
      businessDescription: z
        .string()
        .describe("Description of the business/product (required)"),
      industry: z.string().optional().describe("Industry sector"),
      geography: z.string().optional().describe("Target geography"),
      targetCustomers: z
        .string()
        .optional()
        .describe("Target customer description"),
      productOrService: z
        .string()
        .optional()
        .describe("Product or service details"),
      competitors: z
        .array(z.string())
        .optional()
        .describe("Known competitors to include"),
    })
    .describe("Research context"),
  model: z
    .enum(["o3-deep-research-2025-06-26", "o4-mini-deep-research-2025-06-26"])
    .default("o4-mini-deep-research-2025-06-26")
    .describe("Model to use (mini is faster and cheaper, default)"),
});

export interface DeepResearchResponse {
  frameworkType: FrameworkType;
  rawContent: string;
  parsedData: Record<string, unknown>;
  citations: Citation[];
  confidence: number;
  missingFields: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
  };
}

export async function deepResearch(
  args: z.infer<typeof deepResearchSchema>
): Promise<DeepResearchResponse> {
  const userPrompt = generateResearchPrompt(
    args.frameworkType as FrameworkType,
    args.context as ResearchContext
  );

  const result = await executeDeepResearch({
    model: args.model as DeepResearchModel,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  });

  const parsed = parseResearchResult(
    args.frameworkType as FrameworkType,
    result.content,
    result.citations
  );

  const estimatedCostUSD = (result.usage.totalTokens / 1000) * 0.015;

  return {
    frameworkType: args.frameworkType as FrameworkType,
    rawContent: result.content,
    parsedData: parsed.data,
    citations: parsed.citations,
    confidence: parsed.confidence,
    missingFields: parsed.missingFields,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
      estimatedCostUSD: Math.round(estimatedCostUSD * 100) / 100,
    },
  };
}

export const populateFrameworkSchema = z.object({
  projectId: z.string().describe("Project ID to create entity in"),
  frameworkType: z
    .enum([
      "aida-funnel",
      "content-funnel",
      "conversion-funnel",
      "customer-journey",
    ])
    .describe("Framework type to populate"),
  name: z.string().describe("Name for the new entity"),
  description: z.string().optional().describe("Optional description"),
  researchData: z
    .record(z.unknown())
    .describe("Parsed research data from deep_research tool"),
  citations: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        accessedAt: z.string(),
        relevantFields: z.array(z.string()),
      })
    )
    .describe("Citations from deep_research tool"),
  researchModel: z.string().optional().describe("Model used for research"),
  confidence: z.number().optional().describe("Confidence score from research"),
});

export interface PopulateFrameworkResponse {
  entityId: string;
  type: string;
  name: string;
  citationCount: number;
}

export async function populateFramework(
  args: z.infer<typeof populateFrameworkSchema>
): Promise<PopulateFrameworkResponse> {
  const researchMetadata = {
    citations: args.citations,
    researchedAt: new Date().toISOString(),
    researchModel: args.researchModel,
    confidence: args.confidence,
  };

  let entity;

  switch (args.frameworkType) {
    case "aida-funnel": {
      const data = args.researchData as {
        attention?: { channels?: Array<{ channel: string }>; hooks?: Array<{ hook: string }> };
        interest?: { contentTypes?: Array<{ type: string; purpose: string }> };
        desire?: { benefits?: Array<{ benefit: string }>; socialProof?: Array<{ type: string; content: string }> };
        action?: { primaryCta?: { text: string }; secondaryCtas?: Array<{ text: string }> };
      };

      entity = await createEntity<AidaFunnel>(args.projectId, {
        type: "aida-funnel",
        name: args.name,
        description: args.description,
        attention: {
          channels: data.attention?.channels || [],
        },
        interest: {
          contentTypes: data.interest?.contentTypes || [],
        },
        desire: {
          benefits: data.desire?.benefits || [],
          socialProof: data.desire?.socialProof?.map(sp => ({
            type: sp.type as "testimonial" | "case-study" | "review" | "endorsement" | "statistic",
            content: sp.content,
          })),
        },
        action: {
          primaryCta: data.action?.primaryCta || { text: "Get Started" },
          secondaryCtas: data.action?.secondaryCtas,
        },
        researchMetadata,
      });
      break;
    }

    case "content-funnel": {
      const data = args.researchData as {
        tofu?: { goal?: string; contentTypes?: Array<{ type: string; topic: string }> };
        mofu?: { goal?: string; contentTypes?: Array<{ type: string; topic: string }>; leadMagnets?: Array<{ name: string; type: string }> };
        bofu?: { goal?: string; contentTypes?: Array<{ type: string; topic: string }> };
      };

      entity = await createEntity<ContentFunnel>(args.projectId, {
        type: "content-funnel",
        name: args.name,
        description: args.description,
        tofu: {
          goal: data.tofu?.goal || "Generate awareness",
          contentTypes: data.tofu?.contentTypes || [],
        },
        mofu: {
          goal: data.mofu?.goal || "Nurture leads",
          contentTypes: data.mofu?.contentTypes || [],
          leadMagnets: data.mofu?.leadMagnets,
        },
        bofu: {
          goal: data.bofu?.goal || "Convert leads",
          contentTypes: data.bofu?.contentTypes || [],
        },
        researchMetadata,
      });
      break;
    }

    case "conversion-funnel": {
      const data = args.researchData as {
        stages?: Array<{ name: string; description?: string; conversionRate?: number }>;
        trafficSources?: Array<{ source: string }>;
        bottlenecks?: Array<{ stage: string; issue: string }>;
      };

      entity = await createEntity<ConversionFunnel>(args.projectId, {
        type: "conversion-funnel",
        name: args.name,
        description: args.description,
        stages: data.stages || [],
        trafficSources: data.trafficSources,
        bottlenecks: data.bottlenecks,
        researchMetadata,
      });
      break;
    }

    case "customer-journey": {
      const data = args.researchData as {
        stages?: Array<{
          name: string;
          customerGoal: string;
          touchpoints: Array<{ channel: string; interaction: string }>;
          painPoints?: string[];
          opportunities?: string[];
        }>;
        momentsOfTruth?: Array<{ stage: string; moment: string }>;
      };

      entity = await createEntity<CustomerJourney>(args.projectId, {
        type: "customer-journey",
        name: args.name,
        description: args.description,
        stages: data.stages || [],
        momentsOfTruth: data.momentsOfTruth,
        researchMetadata,
      });
      break;
    }

    default:
      throw new Error(`Unknown framework type: ${args.frameworkType}`);
  }

  return {
    entityId: entity.id,
    type: entity.type,
    name: entity.name,
    citationCount: args.citations.length,
  };
}

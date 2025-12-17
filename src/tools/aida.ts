import { z } from "zod";
import { createEntity, getEntity, updateEntity, listEntitiesByType } from "../storage/index.js";
import type { AidaFunnel } from "../schemas/index.js";

export const createAidaFunnelSchema = z.object({
  projectId: z.string().describe("The project ID to add this funnel to"),
  name: z.string().describe("Name for this AIDA funnel"),
  description: z.string().optional().describe("Optional description"),

  attention: z.object({
    channels: z.array(z.object({
      channel: z.string().describe("Marketing channel (e.g., social media, search, display)"),
      tactic: z.string().optional().describe("Specific tactic for this channel"),
      budget: z.string().optional().describe("Budget allocation"),
      expectedReach: z.string().optional().describe("Expected audience reach"),
    })).describe("Channels used to capture attention"),
    hooks: z.array(z.object({
      hook: z.string().describe("Attention-grabbing hook or headline"),
      format: z.enum(["headline", "visual", "video", "audio", "interactive"]).optional(),
    })).optional().describe("Hooks to capture attention"),
    targetAudience: z.string().optional().describe("Target audience description"),
  }).describe("How do you capture initial attention?"),

  interest: z.object({
    contentTypes: z.array(z.object({
      type: z.string().describe("Content type (blog, video, infographic, etc.)"),
      purpose: z.string().optional().describe("Purpose of this content"),
      format: z.string().optional().describe("Format details"),
    })).describe("Content types to build interest"),
    engagementTactics: z.array(z.string()).optional().describe("Tactics to increase engagement"),
    valueProposition: z.string().optional().describe("Core value proposition message"),
    painPointsAddressed: z.array(z.string()).optional().describe("Pain points your content addresses"),
  }).describe("How do you build and maintain interest?"),

  desire: z.object({
    socialProof: z.array(z.object({
      type: z.enum(["testimonial", "case-study", "review", "endorsement", "statistic"]),
      content: z.string().describe("The social proof content"),
    })).optional().describe("Social proof elements"),
    benefits: z.array(z.object({
      benefit: z.string().describe("Key benefit"),
      emotionalTrigger: z.string().optional().describe("Emotional trigger this benefit creates"),
    })).describe("Benefits that create desire"),
    urgencyTactics: z.array(z.string()).optional().describe("Urgency and scarcity tactics"),
    objectionHandling: z.array(z.object({
      objection: z.string().describe("Common objection"),
      response: z.string().describe("How to handle this objection"),
    })).optional().describe("How to handle objections"),
  }).describe("How do you create desire for your offering?"),

  action: z.object({
    primaryCta: z.object({
      text: z.string().describe("Primary CTA text"),
      destination: z.string().optional().describe("Where the CTA leads"),
      placement: z.string().optional().describe("Where the CTA is placed"),
    }).describe("Primary call-to-action"),
    secondaryCtas: z.array(z.object({
      text: z.string().describe("Secondary CTA text"),
      destination: z.string().optional().describe("Where it leads"),
    })).optional().describe("Secondary CTAs"),
    frictionReducers: z.array(z.string()).optional().describe("Elements that reduce conversion friction"),
    conversionGoal: z.string().optional().describe("The conversion goal"),
    expectedConversionRate: z.string().optional().describe("Expected conversion rate"),
  }).describe("How do you drive action/conversion?"),

  metrics: z.object({
    awarenessKpis: z.array(z.string()).optional().describe("KPIs for awareness stage"),
    engagementKpis: z.array(z.string()).optional().describe("KPIs for engagement"),
    conversionKpis: z.array(z.string()).optional().describe("KPIs for conversion"),
  }).optional().describe("Key performance indicators"),
});

export async function createAidaFunnel(
  args: z.infer<typeof createAidaFunnelSchema>
): Promise<AidaFunnel> {
  return createEntity<AidaFunnel>(args.projectId, {
    type: "aida-funnel",
    name: args.name,
    description: args.description,
    attention: args.attention,
    interest: args.interest,
    desire: args.desire,
    action: args.action,
    metrics: args.metrics,
  });
}

export const updateAidaFunnelSchema = z.object({
  entityId: z.string().describe("The funnel ID to update"),
  name: z.string().optional().describe("Updated name"),
  description: z.string().optional().describe("Updated description"),
  attention: createAidaFunnelSchema.shape.attention.optional(),
  interest: createAidaFunnelSchema.shape.interest.optional(),
  desire: createAidaFunnelSchema.shape.desire.optional(),
  action: createAidaFunnelSchema.shape.action.optional(),
  metrics: createAidaFunnelSchema.shape.metrics,
});

export async function updateAidaFunnel(
  args: z.infer<typeof updateAidaFunnelSchema>
): Promise<AidaFunnel> {
  const existing = await getEntity<AidaFunnel>(args.entityId);
  if (!existing) {
    throw new Error(`AIDA Funnel ${args.entityId} not found`);
  }

  const updated: AidaFunnel = {
    ...existing,
    name: args.name ?? existing.name,
    description: args.description ?? existing.description,
    attention: args.attention ?? existing.attention,
    interest: args.interest ?? existing.interest,
    desire: args.desire ?? existing.desire,
    action: args.action ?? existing.action,
    metrics: args.metrics ?? existing.metrics,
  };

  return updateEntity(updated);
}

export async function getAidaFunnel(entityId: string): Promise<AidaFunnel | null> {
  return getEntity<AidaFunnel>(entityId);
}

export async function listAidaFunnels(projectId: string): Promise<AidaFunnel[]> {
  const entities = await listEntitiesByType(projectId, "aida-funnel");
  return entities as AidaFunnel[];
}

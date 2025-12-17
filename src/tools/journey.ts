import { z } from "zod";
import { createEntity, getEntity, updateEntity, listEntitiesByType } from "../storage/index.js";
import type { CustomerJourney } from "../schemas/index.js";

export const createCustomerJourneySchema = z.object({
  projectId: z.string().describe("The project ID to add this journey to"),
  name: z.string().describe("Name for this customer journey"),
  description: z.string().optional().describe("Optional description"),
  personaReference: z.string().optional().describe("Reference to associated persona"),

  stages: z.array(z.object({
    name: z.string().describe("Stage name (e.g., Awareness, Consideration, Purchase, Retention)"),
    description: z.string().optional().describe("Stage description"),
    customerGoal: z.string().describe("What the customer is trying to achieve"),
    duration: z.string().optional().describe("Typical duration of this stage"),

    touchpoints: z.array(z.object({
      channel: z.string().describe("Channel (website, email, phone, in-store, etc.)"),
      interaction: z.string().describe("Description of the interaction"),
      owner: z.string().optional().describe("Team/person responsible"),
    })).describe("Customer touchpoints at this stage"),

    emotions: z.object({
      feeling: z.string().describe("How the customer feels"),
      intensity: z.enum(["very-positive", "positive", "neutral", "negative", "very-negative"]).optional(),
    }).optional().describe("Customer emotions"),

    painPoints: z.array(z.string()).optional().describe("Pain points at this stage"),
    opportunities: z.array(z.string()).optional().describe("Opportunities for improvement"),
    keyQuestions: z.array(z.string()).optional().describe("Questions customers have"),
  })).describe("Journey stages"),

  momentsOfTruth: z.array(z.object({
    stage: z.string().describe("Stage where this moment occurs"),
    moment: z.string().describe("Description of the moment"),
    importance: z.enum(["critical", "important", "moderate"]).optional().describe("Importance level"),
    currentExperience: z.string().optional().describe("Current experience at this moment"),
    desiredExperience: z.string().optional().describe("Desired experience"),
  })).optional().describe("Critical moments of truth"),

  channels: z.array(z.object({
    name: z.string().describe("Channel name"),
    role: z.string().optional().describe("Role of this channel in the journey"),
    effectiveness: z.enum(["high", "medium", "low"]).optional().describe("Effectiveness rating"),
  })).optional().describe("Channels used across the journey"),

  improvements: z.array(z.object({
    stage: z.string().describe("Stage to improve"),
    improvement: z.string().describe("Improvement description"),
    priority: z.enum(["high", "medium", "low"]).optional().describe("Priority level"),
    effort: z.enum(["high", "medium", "low"]).optional().describe("Effort required"),
    expectedImpact: z.string().optional().describe("Expected impact"),
  })).optional().describe("Planned improvements"),
});

export async function createCustomerJourney(
  args: z.infer<typeof createCustomerJourneySchema>
): Promise<CustomerJourney> {
  return createEntity<CustomerJourney>(args.projectId, {
    type: "customer-journey",
    name: args.name,
    description: args.description,
    personaReference: args.personaReference,
    stages: args.stages,
    momentsOfTruth: args.momentsOfTruth,
    channels: args.channels,
    improvements: args.improvements,
  });
}

export const updateCustomerJourneySchema = z.object({
  entityId: z.string().describe("The journey ID to update"),
  name: z.string().optional().describe("Updated name"),
  description: z.string().optional().describe("Updated description"),
  personaReference: z.string().optional().describe("Updated persona reference"),
  stages: createCustomerJourneySchema.shape.stages.optional(),
  momentsOfTruth: createCustomerJourneySchema.shape.momentsOfTruth,
  channels: createCustomerJourneySchema.shape.channels,
  improvements: createCustomerJourneySchema.shape.improvements,
});

export async function updateCustomerJourney(
  args: z.infer<typeof updateCustomerJourneySchema>
): Promise<CustomerJourney> {
  const existing = await getEntity<CustomerJourney>(args.entityId);
  if (!existing) {
    throw new Error(`Customer Journey ${args.entityId} not found`);
  }

  const updated: CustomerJourney = {
    ...existing,
    name: args.name ?? existing.name,
    description: args.description ?? existing.description,
    personaReference: args.personaReference ?? existing.personaReference,
    stages: args.stages ?? existing.stages,
    momentsOfTruth: args.momentsOfTruth ?? existing.momentsOfTruth,
    channels: args.channels ?? existing.channels,
    improvements: args.improvements ?? existing.improvements,
  };

  return updateEntity(updated);
}

export async function getCustomerJourney(entityId: string): Promise<CustomerJourney | null> {
  return getEntity<CustomerJourney>(entityId);
}

export async function listCustomerJourneys(projectId: string): Promise<CustomerJourney[]> {
  const entities = await listEntitiesByType(projectId, "customer-journey");
  return entities as CustomerJourney[];
}

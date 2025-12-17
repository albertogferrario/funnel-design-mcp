import { z } from "zod";
import { ResearchMetadataSchema } from "./citations.js";

export const BaseEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  researchMetadata: ResearchMetadataSchema.optional(),
});

// AIDA Funnel - Attention, Interest, Desire, Action
export const AidaFunnelSchema = z.object({
  ...BaseEntitySchema.shape,
  type: z.literal("aida-funnel"),
  name: z.string(),
  description: z.string().optional(),

  attention: z.object({
    channels: z.array(z.object({
      channel: z.string(),
      tactic: z.string().optional(),
      budget: z.string().optional(),
      expectedReach: z.string().optional(),
    })),
    hooks: z.array(z.object({
      hook: z.string(),
      format: z.enum(["headline", "visual", "video", "audio", "interactive"]).optional(),
    })).optional(),
    targetAudience: z.string().optional(),
  }),

  interest: z.object({
    contentTypes: z.array(z.object({
      type: z.string(),
      purpose: z.string().optional(),
      format: z.string().optional(),
    })),
    engagementTactics: z.array(z.string()).optional(),
    valueProposition: z.string().optional(),
    painPointsAddressed: z.array(z.string()).optional(),
  }),

  desire: z.object({
    socialProof: z.array(z.object({
      type: z.enum(["testimonial", "case-study", "review", "endorsement", "statistic"]),
      content: z.string(),
    })).optional(),
    benefits: z.array(z.object({
      benefit: z.string(),
      emotionalTrigger: z.string().optional(),
    })),
    urgencyTactics: z.array(z.string()).optional(),
    objectionHandling: z.array(z.object({
      objection: z.string(),
      response: z.string(),
    })).optional(),
  }),

  action: z.object({
    primaryCta: z.object({
      text: z.string(),
      destination: z.string().optional(),
      placement: z.string().optional(),
    }),
    secondaryCtas: z.array(z.object({
      text: z.string(),
      destination: z.string().optional(),
    })).optional(),
    frictionReducers: z.array(z.string()).optional(),
    conversionGoal: z.string().optional(),
    expectedConversionRate: z.string().optional(),
  }),

  metrics: z.object({
    awarenessKpis: z.array(z.string()).optional(),
    engagementKpis: z.array(z.string()).optional(),
    conversionKpis: z.array(z.string()).optional(),
  }).optional(),
});

// TOFU/MOFU/BOFU Content Funnel
export const ContentFunnelSchema = z.object({
  ...BaseEntitySchema.shape,
  type: z.literal("content-funnel"),
  name: z.string(),
  description: z.string().optional(),

  tofu: z.object({
    goal: z.string(),
    audience: z.string().optional(),
    contentTypes: z.array(z.object({
      type: z.string(),
      topic: z.string(),
      format: z.string().optional(),
      distributionChannel: z.string().optional(),
    })),
    keywords: z.array(z.string()).optional(),
    cta: z.string().optional(),
    successMetrics: z.array(z.string()).optional(),
  }),

  mofu: z.object({
    goal: z.string(),
    nurturingStrategy: z.string().optional(),
    contentTypes: z.array(z.object({
      type: z.string(),
      topic: z.string(),
      format: z.string().optional(),
      gatingStrategy: z.enum(["gated", "ungated", "partial"]).optional(),
    })),
    leadMagnets: z.array(z.object({
      name: z.string(),
      type: z.string(),
      valueProposition: z.string().optional(),
    })).optional(),
    emailSequences: z.array(z.object({
      name: z.string(),
      emails: z.number(),
      goal: z.string().optional(),
    })).optional(),
    successMetrics: z.array(z.string()).optional(),
  }),

  bofu: z.object({
    goal: z.string(),
    contentTypes: z.array(z.object({
      type: z.string(),
      topic: z.string(),
      format: z.string().optional(),
    })),
    salesEnablement: z.array(z.object({
      asset: z.string(),
      useCase: z.string().optional(),
    })).optional(),
    conversionTactics: z.array(z.string()).optional(),
    pricingStrategy: z.string().optional(),
    successMetrics: z.array(z.string()).optional(),
  }),

  contentCalendar: z.array(z.object({
    stage: z.enum(["tofu", "mofu", "bofu"]),
    contentPiece: z.string(),
    publishDate: z.string().optional(),
    owner: z.string().optional(),
    status: z.enum(["planned", "in-progress", "review", "published"]).optional(),
  })).optional(),
});

// Conversion Funnel with stage metrics
export const ConversionFunnelSchema = z.object({
  ...BaseEntitySchema.shape,
  type: z.literal("conversion-funnel"),
  name: z.string(),
  description: z.string().optional(),

  stages: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    entryCriteria: z.string().optional(),
    exitCriteria: z.string().optional(),
    volume: z.number().optional(),
    conversionRate: z.number().min(0).max(100).optional(),
    averageTimeInStage: z.string().optional(),
    keyActions: z.array(z.string()).optional(),
    dropOffReasons: z.array(z.string()).optional(),
    optimizationNotes: z.string().optional(),
  })),

  trafficSources: z.array(z.object({
    source: z.string(),
    medium: z.string().optional(),
    volume: z.number().optional(),
    qualityScore: z.number().min(0).max(100).optional(),
    cost: z.string().optional(),
    conversionRate: z.number().min(0).max(100).optional(),
  })).optional(),

  overallMetrics: z.object({
    totalVisitors: z.number().optional(),
    totalConversions: z.number().optional(),
    overallConversionRate: z.number().min(0).max(100).optional(),
    averageDealValue: z.string().optional(),
    customerAcquisitionCost: z.string().optional(),
    timeToConversion: z.string().optional(),
  }).optional(),

  bottlenecks: z.array(z.object({
    stage: z.string(),
    issue: z.string(),
    impact: z.enum(["high", "medium", "low"]).optional(),
    proposedSolution: z.string().optional(),
  })).optional(),
});

// Customer Journey Map
export const CustomerJourneySchema = z.object({
  ...BaseEntitySchema.shape,
  type: z.literal("customer-journey"),
  name: z.string(),
  description: z.string().optional(),
  personaReference: z.string().optional(),

  stages: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    customerGoal: z.string(),
    duration: z.string().optional(),

    touchpoints: z.array(z.object({
      channel: z.string(),
      interaction: z.string(),
      owner: z.string().optional(),
    })),

    emotions: z.object({
      feeling: z.string(),
      intensity: z.enum(["very-positive", "positive", "neutral", "negative", "very-negative"]).optional(),
    }).optional(),

    painPoints: z.array(z.string()).optional(),
    opportunities: z.array(z.string()).optional(),
    keyQuestions: z.array(z.string()).optional(),
  })),

  momentsOfTruth: z.array(z.object({
    stage: z.string(),
    moment: z.string(),
    importance: z.enum(["critical", "important", "moderate"]).optional(),
    currentExperience: z.string().optional(),
    desiredExperience: z.string().optional(),
  })).optional(),

  channels: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    effectiveness: z.enum(["high", "medium", "low"]).optional(),
  })).optional(),

  improvements: z.array(z.object({
    stage: z.string(),
    improvement: z.string(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    effort: z.enum(["high", "medium", "low"]).optional(),
    expectedImpact: z.string().optional(),
  })).optional(),
});

// Project container
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()).optional(),

  entities: z.array(z.object({
    id: z.string(),
    type: z.enum([
      "aida-funnel",
      "content-funnel",
      "conversion-funnel",
      "customer-journey",
    ]),
  })),
});

// Type exports
export type AidaFunnel = z.infer<typeof AidaFunnelSchema>;
export type ContentFunnel = z.infer<typeof ContentFunnelSchema>;
export type ConversionFunnel = z.infer<typeof ConversionFunnelSchema>;
export type CustomerJourney = z.infer<typeof CustomerJourneySchema>;
export type Project = z.infer<typeof ProjectSchema>;

export type EntityType =
  | AidaFunnel
  | ContentFunnel
  | ConversionFunnel
  | CustomerJourney;

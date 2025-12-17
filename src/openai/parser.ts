import type { RawCitation } from "./client.js";
import type { FrameworkType } from "./prompts.js";

export interface Citation {
  id: string;
  title: string;
  url: string;
  accessedAt: string;
  relevantFields: string[];
}

export interface ParsedResearchResult {
  data: Record<string, unknown>;
  citations: Citation[];
  confidence: number;
  missingFields: string[];
  rawContent: string;
}

function generateCitationId(): string {
  return `cit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function processCitations(rawCitations: RawCitation[]): Citation[] {
  const now = new Date().toISOString();
  const seen = new Set<string>();

  return rawCitations
    .filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    })
    .map((c) => ({
      id: generateCitationId(),
      title: c.title,
      url: c.url,
      accessedAt: now,
      relevantFields: [],
    }));
}

function extractListItems(text: string, sectionHeader: string): string[] {
  const sectionPattern = new RegExp(
    `##?\\s*${sectionHeader}[^#]*?(?=##|$)`,
    "is"
  );
  const sectionMatch = text.match(sectionPattern);
  if (!sectionMatch) return [];

  const items: string[] = [];
  const listPattern = /[-*]\s+\*?\*?([^*\n]+)\*?\*?/g;
  let match;

  while ((match = listPattern.exec(sectionMatch[0])) !== null) {
    const item = match[1].trim();
    if (item.length > 0 && item.length < 200) {
      items.push(item);
    }
  }

  return items;
}

function extractSection(text: string, sectionHeader: string): string {
  const sectionPattern = new RegExp(
    `##?\\s*(?:${sectionHeader})[:\\s]*([^#]*?)(?=##|$)`,
    "is"
  );
  const match = text.match(sectionPattern);
  return match && match[1] ? match[1].trim() : "";
}

function extractPercentage(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]) : undefined;
}

export function parseAidaFunnelResearch(
  content: string,
  rawCitations: RawCitation[]
): ParsedResearchResult {
  const citations = processCitations(rawCitations);
  const missingFields: string[] = [];

  const attentionSection = extractSection(content, "Attention");
  const interestSection = extractSection(content, "Interest");
  const desireSection = extractSection(content, "Desire");
  const actionSection = extractSection(content, "Action");

  const channels = extractListItems(content, "Channels|Attention").slice(0, 5);
  const hooks = extractListItems(content, "Hooks|Headlines").slice(0, 5);
  const contentTypes = extractListItems(content, "Content|Interest").slice(0, 5);
  const benefits = extractListItems(content, "Benefits|Desire").slice(0, 5);
  const socialProof = extractListItems(content, "Social Proof").slice(0, 5);
  const ctas = extractListItems(content, "CTA|Action|Call").slice(0, 5);

  if (channels.length === 0) missingFields.push("attention.channels");
  if (contentTypes.length === 0) missingFields.push("interest.contentTypes");
  if (benefits.length === 0) missingFields.push("desire.benefits");
  if (ctas.length === 0) missingFields.push("action.ctas");

  let confidence = 100;
  confidence -= missingFields.length * 15;
  if (citations.length === 0) confidence -= 10;

  return {
    data: {
      attention: {
        channels: channels.map(ch => ({ channel: ch })),
        hooks: hooks.map(h => ({ hook: h })),
      },
      interest: {
        contentTypes: contentTypes.map(ct => ({ type: ct, purpose: "" })),
      },
      desire: {
        benefits: benefits.map(b => ({ benefit: b })),
        socialProof: socialProof.map(sp => ({ type: "testimonial", content: sp })),
      },
      action: {
        primaryCta: { text: ctas[0] || "Get Started" },
        secondaryCtas: ctas.slice(1).map(c => ({ text: c })),
      },
    },
    citations,
    confidence: Math.max(0, confidence),
    missingFields,
    rawContent: content,
  };
}

export function parseContentFunnelResearch(
  content: string,
  rawCitations: RawCitation[]
): ParsedResearchResult {
  const citations = processCitations(rawCitations);
  const missingFields: string[] = [];

  const tofuContent = extractListItems(content, "TOFU|Top of Funnel|Awareness").slice(0, 5);
  const mofuContent = extractListItems(content, "MOFU|Middle of Funnel|Consideration").slice(0, 5);
  const bofuContent = extractListItems(content, "BOFU|Bottom of Funnel|Decision").slice(0, 5);
  const leadMagnets = extractListItems(content, "Lead Magnet").slice(0, 5);

  if (tofuContent.length === 0) missingFields.push("tofu.contentTypes");
  if (mofuContent.length === 0) missingFields.push("mofu.contentTypes");
  if (bofuContent.length === 0) missingFields.push("bofu.contentTypes");

  let confidence = 100;
  confidence -= missingFields.length * 15;
  if (citations.length === 0) confidence -= 10;

  return {
    data: {
      tofu: {
        goal: "Generate awareness and attract visitors",
        contentTypes: tofuContent.map(ct => ({ type: ct, topic: "" })),
      },
      mofu: {
        goal: "Nurture leads and build consideration",
        contentTypes: mofuContent.map(ct => ({ type: ct, topic: "" })),
        leadMagnets: leadMagnets.map(lm => ({ name: lm, type: "download" })),
      },
      bofu: {
        goal: "Convert leads to customers",
        contentTypes: bofuContent.map(ct => ({ type: ct, topic: "" })),
      },
    },
    citations,
    confidence: Math.max(0, confidence),
    missingFields,
    rawContent: content,
  };
}

export function parseConversionFunnelResearch(
  content: string,
  rawCitations: RawCitation[]
): ParsedResearchResult {
  const citations = processCitations(rawCitations);
  const missingFields: string[] = [];

  const stages = extractListItems(content, "Stages|Funnel").slice(0, 6);
  const trafficSources = extractListItems(content, "Traffic Sources|Sources").slice(0, 5);
  const bottlenecks = extractListItems(content, "Bottleneck|Drop-off").slice(0, 5);
  const optimizations = extractListItems(content, "Optimization|Improve").slice(0, 5);

  const conversionRate = extractPercentage(content);

  if (stages.length === 0) missingFields.push("stages");

  let confidence = 100;
  confidence -= missingFields.length * 20;
  if (citations.length === 0) confidence -= 10;

  return {
    data: {
      stages: stages.map((name, i) => ({
        name,
        description: "",
        conversionRate: conversionRate ? conversionRate / (i + 1) : undefined,
      })),
      trafficSources: trafficSources.map(src => ({ source: src })),
      bottlenecks: bottlenecks.map(bn => ({
        stage: "Unknown",
        issue: bn,
      })),
    },
    citations,
    confidence: Math.max(0, confidence),
    missingFields,
    rawContent: content,
  };
}

export function parseCustomerJourneyResearch(
  content: string,
  rawCitations: RawCitation[]
): ParsedResearchResult {
  const citations = processCitations(rawCitations);
  const missingFields: string[] = [];

  const stages = extractListItems(content, "Stage|Journey").slice(0, 6);
  const touchpoints = extractListItems(content, "Touchpoint|Channel").slice(0, 10);
  const painPoints = extractListItems(content, "Pain Point|Frustration").slice(0, 5);
  const opportunities = extractListItems(content, "Opportunit|Improve").slice(0, 5);
  const momentsOfTruth = extractListItems(content, "Moment.*Truth|Critical").slice(0, 5);

  if (stages.length === 0) missingFields.push("stages");

  let confidence = 100;
  confidence -= missingFields.length * 20;
  if (citations.length === 0) confidence -= 10;

  return {
    data: {
      stages: stages.map(name => ({
        name,
        customerGoal: "Complete this stage successfully",
        touchpoints: touchpoints.slice(0, 3).map(tp => ({
          channel: tp,
          interaction: "",
        })),
        painPoints: painPoints.slice(0, 2),
        opportunities: opportunities.slice(0, 2),
      })),
      momentsOfTruth: momentsOfTruth.map(mot => ({
        stage: "Unknown",
        moment: mot,
      })),
    },
    citations,
    confidence: Math.max(0, confidence),
    missingFields,
    rawContent: content,
  };
}

export function parseResearchResult(
  framework: FrameworkType,
  content: string,
  rawCitations: RawCitation[]
): ParsedResearchResult {
  switch (framework) {
    case "aida-funnel":
      return parseAidaFunnelResearch(content, rawCitations);
    case "content-funnel":
      return parseContentFunnelResearch(content, rawCitations);
    case "conversion-funnel":
      return parseConversionFunnelResearch(content, rawCitations);
    case "customer-journey":
      return parseCustomerJourneyResearch(content, rawCitations);
    default:
      return {
        data: {},
        citations: processCitations(rawCitations),
        confidence: 0,
        missingFields: ["unknown-framework"],
        rawContent: content,
      };
  }
}

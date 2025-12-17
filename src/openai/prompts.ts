export interface ResearchContext {
  businessDescription: string;
  industry?: string;
  geography?: string;
  targetCustomers?: string;
  productOrService?: string;
  competitors?: string[];
}

export type FrameworkType =
  | "aida-funnel"
  | "content-funnel"
  | "conversion-funnel"
  | "customer-journey";

export const SYSTEM_PROMPT = `You are an expert marketing strategist and funnel optimization specialist. Your task is to provide accurate, data-driven insights with proper citations.

Guidelines:
- Always cite sources for numerical data and statistics
- Use recent data (prefer sources from the last 2 years)
- Be specific with numbers and conversion rates
- Acknowledge uncertainty when data is limited
- Structure your response clearly with headers and bullet points
- Focus on actionable marketing strategies`;

export function generateResearchPrompt(
  framework: FrameworkType,
  context: ResearchContext
): string {
  const prompts: Record<FrameworkType, (ctx: ResearchContext) => string> = {
    "aida-funnel": (ctx) => `
Research marketing strategies for an AIDA funnel: ${ctx.businessDescription}

Industry: ${ctx.industry || "Not specified - please identify"}
Target Customers: ${ctx.targetCustomers || "Identify primary customer segments"}
Geography: ${ctx.geography || "Global"}

Provide comprehensive AIDA funnel research:

## Attention Stage
- Most effective channels to capture attention in this industry
- Average CPM/CPC for each channel
- Successful attention-grabbing hooks and headlines
- Best performing ad formats
- Target audience demographics and where they spend time

## Interest Stage
- Content types that build interest (with engagement rates)
- Industry benchmarks for engagement
- Pain points and problems to address
- Value proposition messaging that resonates
- Content formats that work (video, blog, infographic, etc.)

## Desire Stage
- Social proof strategies that work in this industry
- Key benefits customers care about most
- Emotional triggers that drive purchase intent
- Common objections and how to handle them
- Urgency and scarcity tactics (ethical approaches)

## Action Stage
- Effective CTA strategies and copy examples
- Conversion rate benchmarks for this industry
- Friction reducers that improve conversion
- Optimal landing page elements
- Post-conversion strategies

## Metrics & Benchmarks
- Industry benchmarks for awareness metrics (impressions, reach, CTR)
- Engagement benchmarks (time on page, scroll depth, video completion)
- Conversion benchmarks (landing page conversion, email signup, purchase)

Cite sources for all statistics and benchmarks.
`,

    "content-funnel": (ctx) => `
Research content marketing funnel strategies for: ${ctx.businessDescription}

Industry: ${ctx.industry || "Not specified - please identify"}
Target Customers: ${ctx.targetCustomers || "Identify primary customer segments"}

Provide comprehensive TOFU/MOFU/BOFU content funnel research:

## Top of Funnel (TOFU) - Awareness
- Content types that generate awareness (with performance data)
- SEO keywords and search volume data
- Social media content strategies
- Distribution channels and their effectiveness
- CTAs that convert visitors to leads
- Success metrics and industry benchmarks

## Middle of Funnel (MOFU) - Consideration
- Lead magnet types that work in this industry
- Gated vs ungated content strategies
- Email nurturing sequence best practices
- Average email open rates and click rates for the industry
- Content that builds trust and educates
- Lead scoring approaches

## Bottom of Funnel (BOFU) - Decision
- Content that converts leads to customers
- Sales enablement materials that work
- Pricing presentation strategies
- Demo/trial optimization strategies
- Case study and testimonial best practices
- ROI calculators and decision tools

## Content Production
- Recommended content mix ratios (TOFU:MOFU:BOFU)
- Content production frequency benchmarks
- Resource requirements (team size, budget)
- Content repurposing strategies

## Metrics & KPIs
- Traffic and impression benchmarks
- Lead generation benchmarks
- MQL to SQL conversion rates
- Content attribution models

Cite sources for all statistics and benchmarks.
`,

    "conversion-funnel": (ctx) => `
Research conversion funnel optimization for: ${ctx.businessDescription}

Industry: ${ctx.industry || "Not specified - please identify"}
Product/Service: ${ctx.productOrService || ctx.businessDescription}

Provide comprehensive conversion funnel analysis:

## Funnel Stages
For each typical stage (Awareness → Interest → Consideration → Intent → Evaluation → Purchase):
- Stage definition and entry criteria
- Industry benchmark conversion rates between stages
- Average time in stage
- Key actions users take
- Common drop-off reasons
- Optimization strategies

## Traffic Sources
- Best performing traffic sources for this industry
- CAC (Customer Acquisition Cost) by channel
- Traffic quality indicators
- Attribution model recommendations

## Conversion Rate Optimization
- A/B testing strategies that work
- Landing page best practices
- Form optimization tips
- Checkout/signup flow optimization
- Mobile vs desktop conversion differences
- Page load speed impact on conversions

## Drop-off Analysis
- Typical bottlenecks in this industry
- User research methods to identify issues
- Solutions for common problems
- Technical optimizations

## Metrics & Benchmarks
- Industry conversion rate benchmarks (by stage)
- Average deal value / order value
- Customer acquisition cost benchmarks
- Time to conversion averages
- Funnel visualization best practices

Cite sources for all statistics and benchmarks.
`,

    "customer-journey": (ctx) => `
Research customer journey mapping for: ${ctx.businessDescription}

Industry: ${ctx.industry || "Not specified - please identify"}
Target Customers: ${ctx.targetCustomers || "Identify primary customer segments"}

Provide comprehensive customer journey research:

## Journey Stages
For each stage (Awareness → Consideration → Purchase → Retention → Advocacy):

### Stage Details
- What customers are trying to accomplish
- Typical duration of this stage
- Key touchpoints and channels
- Customer emotions and feelings
- Pain points and frustrations
- Questions customers have
- Content and information they seek

## Touchpoint Analysis
- All channels customers interact with
- Effectiveness of each touchpoint
- Integration between channels
- Omnichannel experience best practices

## Moments of Truth
- Critical decision points in the journey
- What makes or breaks the experience
- Industry examples of excellent moments
- Recovery strategies for negative moments

## Emotional Journey
- Emotional peaks and valleys
- How competitors handle emotional moments
- Emotional triggers for purchase decisions
- Post-purchase emotional management

## Improvement Opportunities
- Common journey gaps in this industry
- Quick wins vs long-term improvements
- Technology enablers
- Personalization strategies

## Best Practices
- Journey mapping methodologies
- Customer feedback integration
- Journey analytics and measurement
- Continuous improvement frameworks

Cite sources for all statistics and best practices.
`,
  };

  return prompts[framework](context);
}

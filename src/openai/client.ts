import OpenAI from "openai";

let runtimeApiKey: string | undefined;

export function setOpenAIApiKey(key: string): void {
  runtimeApiKey = key;
}

export function getOpenAIApiKey(): string | undefined {
  return runtimeApiKey || process.env.OPENAI_API_KEY;
}

export function getOpenAIClient(): OpenAI {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new OpenAIConfigError(
      "OpenAI API key not configured. Set OPENAI_API_KEY environment variable or use configure_openai tool.",
      "API_KEY_MISSING"
    );
  }
  return new OpenAI({ apiKey });
}

export class OpenAIConfigError extends Error {
  constructor(
    message: string,
    public code: "API_KEY_MISSING" | "API_ERROR" | "RATE_LIMIT" | "PARSE_ERROR" | "TIMEOUT"
  ) {
    super(message);
    this.name = "OpenAIConfigError";
  }
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || (error.status >= 500 && error.status < 600);
  }
  if (error instanceof Error) {
    return error.message.includes("ECONNRESET") ||
           error.message.includes("ETIMEDOUT") ||
           error.message.includes("ENOTFOUND");
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error;
      }

      const jitter = Math.random() * 0.3 * delay;
      const waitTime = Math.min(delay + jitter, config.maxDelayMs);

      console.error(
        `OpenAI request failed (attempt ${attempt + 1}/${config.maxRetries + 1}), ` +
        `retrying in ${Math.round(waitTime)}ms...`
      );

      await sleep(waitTime);
      delay *= config.backoffMultiplier;
    }
  }

  throw lastError;
}

export type DeepResearchModel =
  | "o3-deep-research-2025-06-26"
  | "o4-mini-deep-research-2025-06-26";

export interface DeepResearchOptions {
  model: DeepResearchModel;
  systemPrompt: string;
  userPrompt: string;
}

export interface RawCitation {
  title: string;
  url: string;
  startIndex: number;
  endIndex: number;
}

export interface DeepResearchResult {
  content: string;
  citations: RawCitation[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export async function executeDeepResearch(
  options: DeepResearchOptions,
  retryConfig?: Partial<RetryConfig>
): Promise<DeepResearchResult> {
  const client = getOpenAIClient();
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  const response = await withRetry(
    () =>
      client.responses.create({
        model: options.model,
        input: [
          {
            role: "developer",
            content: [{ type: "input_text", text: options.systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: options.userPrompt }],
          },
        ],
        tools: [{ type: "web_search_preview" }],
      }),
    config
  );

  const outputItems = response.output || [];
  let content = "";
  const citations: RawCitation[] = [];

  for (const item of outputItems) {
    if (item.type === "message" && item.content) {
      for (const contentItem of item.content) {
        if (contentItem.type === "output_text") {
          content += contentItem.text;

          const annotations = contentItem.annotations || [];
          for (const annotation of annotations) {
            if (annotation.type === "url_citation") {
              citations.push({
                title: annotation.title || "Untitled",
                url: annotation.url,
                startIndex: annotation.start_index,
                endIndex: annotation.end_index,
              });
            }
          }
        }
      }
    }
  }

  return {
    content,
    citations,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      totalTokens:
        (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    },
  };
}

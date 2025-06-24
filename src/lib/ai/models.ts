import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { LanguageModel, wrapLanguageModel } from "ai";
import { gemmaToolMiddleware } from "@ai-sdk-tool/parser";
import { openrouter } from "@openrouter/ai-sdk-provider";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

export const allModels = {
  openai: {
    "4o-mini": openai("gpt-4o-mini", {}),
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "4o": openai("gpt-4o"),
    "o4-mini": openai("o4-mini", {
      reasoningEffort: "medium",
    }),
  },
  google: {
    "gemini-2.5-flash": google("gemini-2.5-flash-preview-04-17"),
    "gemini-2.5-pro": google("gemini-2.5-pro-preview-05-06"),
  },
  anthropic: {
    "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-latest"),
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-latest"),
  },
  xai: {
    "grok-2": xai("grok-2-1212"),
    "grok-3-mini": xai("grok-3-mini-latest"),
    "grok-3": xai("grok-3-latest"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": wrapLanguageModel({
      model: ollama("gemma3:4b", {
        simulateStreaming: true,
      }),
      middleware: gemmaToolMiddleware,
    }),
    "gemma3:12b": wrapLanguageModel({
      model: ollama("gemma3:12b"),
      middleware: gemmaToolMiddleware,
    }),
  },
  openRouter: {
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
  },
} as const;

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return [
    allModels.openai["o4-mini"],
    allModels.google["gemini-2.0-thinking"],
    allModels.xai["grok-3"],
    allModels.xai["grok-3-mini"],
    allModels.google["gemini-2.0-thinking"],
    allModels.ollama["gemma3:1b"],
    allModels.openRouter["qwen3-8b:free"],
    allModels.openRouter["qwen3-14b:free"],
  ].includes(model);
};

export const DEFAULT_MODEL = "4o";

const fallbackModel = allModels.openai[DEFAULT_MODEL];

export const customModelProvider = {
  modelsInfo: Object.keys(allModels).map((provider) => {
    return {
      provider,
      models: Object.keys(allModels[provider]).map((name) => {
        return {
          name,
          isToolCallUnsupported: isToolCallUnsupportedModel(
            allModels[provider][name],
          ),
        };
      }),
    };
  }),
  getModel: (model?: string): LanguageModel => {
    return (Object.values(allModels).find((models) => {
      return models[model!];
    })?.[model!] ?? fallbackModel) as LanguageModel;
  },
};

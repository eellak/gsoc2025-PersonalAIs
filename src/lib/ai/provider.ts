import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Message } from 'ai';
import { createQwen } from 'qwen-ai-provider';
import { fetch, ProxyAgent } from 'undici';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const dispatcher = new ProxyAgent('http://127.0.0.1:7890')

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  fetch: async (req, options) => {
    let res =  await fetch(req, {
      ...options, dispatcher
    });
    return res;
  }
});

const qwen = createQwen({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

export const ModelProvider = {
    "gpt-o3-mini": openai('o3-mini'),
    "gpt-4o": openai('gpt-4o'),
    "gpt-4-turbo": openai('gpt-4-turbo'),
    "gpt-3.5-turbo-1106": openai('gpt-3.5-turbo-1106'),  // support multi-tools
    "qwen-vl-plus": qwen('qwen-vl-plus'),  // not support FC
    "qwen-vl-max": qwen('qwen-vl-max'),  // not support FC
    "qwen2.5-7b-instruct": qwen("qwen2.5-7b-instruct")  // support FC, but single-tool
}

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
    "openai": openai('o3-mini'),
    "qwen": qwen('qwen-vl-plus'),
}

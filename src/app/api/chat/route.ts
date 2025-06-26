import { streamText, Message, experimental_createMCPClient, generateText } from 'ai';
import { ModelProvider } from '@/lib/ai/provider';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("Received messages:", messages);

  const configPath = path.resolve(process.cwd(), 'mcp_servers_config.yaml');
  let mcpConfig: any = {};
  let client: any;
  let clientTools: Record<string, any> = {};
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    mcpConfig = yaml.load(fileContent) || {};
    if (mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0) {
      for (const [server_name, server] of Object.entries(mcpConfig.mcpServers)) {
        const s = server as any;
        console.log('server name:', server_name);
        console.log('type:', s.type);
        console.log('command:', s.command);
        console.log('args:', s.args);
        if (s.type === 'stdio') {
          const stdioTransport = new StdioClientTransport({
            command: s.command,
            args: [...s.args],
          });
          client = await experimental_createMCPClient({
            transport: stdioTransport,
          });
          const toolSetOne = await client.tools();
          const tools = {
            ...toolSetOne,
          };
          clientTools = {
            ...clientTools,
            ...tools,
          }
        } else {
          console.error(`Unsupported server type: ${s.type}`);
          continue;
        }
      }
    } else {
      console.log('mcp_servers_config.yaml is empty or there are no mcpServers');
    }
  } catch (err) {
    console.error('Read mcp_servers_config.yaml error:', err);
  }
  console.log('clientTools:', clientTools);

  const result = streamText({
    model: ModelProvider['qwen2.5-7b-instruct'],
    // model: ModelProvider['gpt-3.5-turbo-1106'],
    messages,
    tools: clientTools,
    toolCallStreaming: true,
    system: `You are a helpful assistant. When using tools, you MUST:
1. Process and analyze the tool results
2. Incorporate the tool results into your response
3. Provide meaningful responses based on the tool results
4. Never return empty content
5. You can call multiple tools in a single response if needed.`,
  });

  return result.toDataStreamResponse({
    getErrorMessage: error => {
      if (error instanceof Error) {
        return error.message;
      }
      console.error(error);
      return 'An unknown error occurred.';
    },
  });
}



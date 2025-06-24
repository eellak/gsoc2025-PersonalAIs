import type {
  MCPServerConfig,
  MCPSseConfig,
  MCPStdioConfig,
} from "app-types/mcp";

/**
 * Type guard to check if an object is potentially a valid stdio config
 */
export function isMaybeStdioConfig(config: unknown): config is MCPStdioConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "command" in config && typeof config.command === "string";
}

/**
 * Type guard to check if an object is potentially a valid SSE config
 */
export function isMaybeSseConfig(config: unknown): config is MCPSseConfig {
  if (typeof config !== "object" || config === null) {
    return false;
  }
  return "url" in config && typeof config.url === "string";
}

/**
 * Type guard for MCP server config (either stdio or SSE)
 */
export function isMaybeMCPServerConfig(
  config: unknown,
): config is MCPServerConfig {
  return isMaybeStdioConfig(config) || isMaybeSseConfig(config);
}

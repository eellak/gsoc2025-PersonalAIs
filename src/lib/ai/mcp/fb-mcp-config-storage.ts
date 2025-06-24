import type { MCPServerConfig } from "app-types/mcp";
import { dirname } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import type {
  MCPClientsManager,
  MCPConfigStorage,
} from "./create-mcp-clients-manager";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { createDebounce } from "lib/utils";
import equal from "fast-deep-equal";
import logger from "logger";
import { MCP_CONFIG_PATH } from "lib/ai/mcp/config-path";

/**
 * Creates a file-based implementation of MCPServerStorage
 */
export function createFileBasedMCPConfigsStorage(
  path?: string,
): MCPConfigStorage {
  const configPath = path || MCP_CONFIG_PATH;
  const configs: Map<string, MCPServerConfig> = new Map();
  let watcher: FSWatcher | null = null;
  const debounce = createDebounce();

  /**
   * Persists the current config map to the file system
   */
  async function saveToFile(): Promise<void> {
    const dir = dirname(configPath);
    await mkdir(dir, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify(Object.fromEntries(configs), null, 2),
      "utf-8",
    );
  }
  /**
   * Initializes storage by reading existing config or creating empty file
   */
  async function init(manager: MCPClientsManager): Promise<void> {
    // Stop existing watcher if any
    if (watcher) {
      await watcher.close();
      watcher = null;
    }
    // Read config file
    try {
      const configText = await readFile(configPath, { encoding: "utf-8" });
      const config = JSON.parse(configText ?? "{}");
      configs.clear();
      Object.entries(config).forEach(([name, serverConfig]) => {
        configs.set(name, serverConfig as MCPServerConfig);
      });
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Create empty config file if doesn't exist
        await saveToFile();
      } else if (err instanceof SyntaxError) {
        throw new Error(
          `Config file ${configPath} has invalid JSON: ${err.message}`,
        );
      } else {
        throw err;
      }
    }

    // Setup file watcher
    watcher = chokidar.watch(configPath, {
      persistent: true,
      awaitWriteFinish: true,
      ignoreInitial: true,
    });

    watcher.on("change", () =>
      debounce(async () => {
        {
          try {
            // Read the updated file
            const configText = await readFile(configPath, {
              encoding: "utf-8",
            });
            if (
              equal(JSON.parse(configText ?? "{}"), Object.fromEntries(configs))
            ) {
              return;
            }

            await manager.cleanup();
            await manager.init();
          } catch (err) {
            logger.error("Error detecting config file change:", err);
          }
        }
      }, 1000),
    );
  }

  return {
    init,
    async loadAll(): Promise<Record<string, MCPServerConfig>> {
      return Object.fromEntries(configs);
    },
    // Saves a configuration with the given name
    async save(name: string, config: MCPServerConfig): Promise<void> {
      configs.set(name, config);
      await saveToFile();
    },
    // Deletes a configuration by name
    async delete(name: string): Promise<void> {
      configs.delete(name);
      await saveToFile();
    },

    // Checks if a configuration exists
    async has(name: string): Promise<boolean> {
      return configs.has(name);
    },
  };
}

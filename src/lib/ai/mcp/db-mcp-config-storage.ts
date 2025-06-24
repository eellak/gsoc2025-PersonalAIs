import type { MCPServerConfig } from "app-types/mcp";
import type {
  MCPClientsManager,
  MCPConfigStorage,
} from "./create-mcp-clients-manager";
import { mcpRepository } from "lib/db/repository";
import logger from "logger";
import { createDebounce } from "lib/utils";
import equal from "fast-deep-equal";
export function createDbBasedMCPConfigsStorage(): MCPConfigStorage {
  // In-memory cache for configs
  const configs: Map<string, MCPServerConfig> = new Map();

  let manager: MCPClientsManager;

  const debounce = createDebounce();

  // Loads all enabled server configs from the database into the in-memory cache
  async function saveToCacheFromDb() {
    try {
      const servers = await mcpRepository.selectAllServers();
      configs.clear();
      servers.forEach((server) => {
        configs.set(server.name, server.config);
      });
    } catch (error) {
      logger.error("Failed to load MCP configs from database:", error);
    }
  }

  // Initializes the manager with configs from the database
  async function init(_manager: MCPClientsManager): Promise<void> {
    manager = _manager;
  }

  async function checkAndRefreshClients() {
    let shouldRefresh = false;
    await saveToCacheFromDb();
    const dbConfigs = Array.from(configs.entries())
      .map(([name, config]) => {
        return {
          name,
          config,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const managerConfigs = manager
      .getClients()
      .map((client) => {
        const info = client.getInfo();
        return {
          name: info.name,
          config: info.config,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (dbConfigs.length !== managerConfigs.length) {
      shouldRefresh = true;
    }

    if (!equal(dbConfigs, managerConfigs)) {
      shouldRefresh = true;
    }

    if (shouldRefresh) {
      const refreshPromises = dbConfigs.map(({ name, config }) => {
        const managerConfig = manager
          .getClients()
          .find((c) => c.getInfo().name === name)
          ?.getInfo();
        if (!managerConfig) {
          return manager.addClient(name, config);
        }
        if (
          !equal(managerConfig.config, config) &&
          managerConfig.status === "connected"
        ) {
          return manager.refreshClient(name, config);
        }
      });
      const deletePromises = managerConfigs
        .filter((c) => {
          const dbConfig = dbConfigs.find((c2) => c2.name === c.name);
          return !dbConfig;
        })
        .map((c) => manager.removeClient(c.name));
      await Promise.all([...refreshPromises, ...deletePromises]);
    }
  }

  setInterval(() => debounce(checkAndRefreshClients, 5000), 60000).unref();

  return {
    init,
    async loadAll(): Promise<Record<string, MCPServerConfig>> {
      // Always load the latest configs from the database
      await saveToCacheFromDb();
      return Object.fromEntries(configs);
    },
    async save(name: string, config: MCPServerConfig): Promise<void> {
      try {
        const existingServer = await mcpRepository.selectServerByName(name);
        if (existingServer) {
          await mcpRepository.updateServer(existingServer.id, { config });
        } else {
          await mcpRepository.insertServer({ name, config });
        }
        configs.set(name, config);
      } catch (error) {
        logger.error(`Failed to save MCP config "${name}" to database:`, error);
        throw error;
      }
    },
    async delete(name: string): Promise<void> {
      try {
        const server = await mcpRepository.selectServerByName(name);
        if (server) {
          await mcpRepository.deleteServer(server.id);
        }
        configs.delete(name);
      } catch (error) {
        logger.error(
          `Failed to delete MCP config "${name}" from database:",`,
          error,
        );
        throw error;
      }
    },
    async has(name: string): Promise<boolean> {
      return configs.has(name);
    },
  };
}

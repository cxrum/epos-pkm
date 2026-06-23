import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { AppConfig, Workspace } from "../app/appState";
import { randomUUID } from "crypto";

export interface RawWorkspace {
  id: string;
  absolutePath: string;
}

export interface WorkspaceLocalConfig {
  title: string;
}

export interface RawAppConfig {
  workspaces: RawWorkspace[];
  selectedWorkspace: string;
}

export class RawAppStateService {
  private configPath: string;
  private config: RawAppConfig | null = null;

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    console.log(this.configPath);
  }

  private async loadConfig(): Promise<RawAppConfig> {
    if (existsSync(this.configPath)) {
      try {
        const rawData = await fs.readFile(this.configPath, "utf-8");
        return JSON.parse(rawData) as RawAppConfig;
      } catch (error) {
        console.error("File read error. Created a new config:", error);
      }
    }

    const defaultConfig: RawAppConfig = {
      workspaces: [],
      selectedWorkspace: "",
    };

    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  private async saveConfig(data: RawAppConfig): Promise<void> {
    try {
      const dirPath = path.dirname(this.configPath);
      await fs.mkdir(dirPath, { recursive: true });

      await fs.writeFile(
        this.configPath,
        JSON.stringify(data, null, 2),
        "utf-8",
      );

      console.log(
        `[Success] Конфіг успішно збережено за шляхом: ${this.configPath}`,
      );
    } catch (error) {
      console.error(`[Error] Помилка запису в ${this.configPath}:`, error);
    }
  }

  private async readLocalConfig(
    absolutePath: string,
  ): Promise<WorkspaceLocalConfig | null> {
    try {
      const workspaceConfigPath = path.join(absolutePath, ".workspace");
      const rawData = await fs.readFile(workspaceConfigPath, "utf-8");
      return JSON.parse(rawData) as WorkspaceLocalConfig;
    } catch {
      return null;
    }
  }

  private async saveWorkspaceLocalConfig(
    absolutePath: string,
    localConfig: WorkspaceLocalConfig,
  ): Promise<void> {
    const workspaceConfigPath = path.join(absolutePath, ".workspace");

    try {
      await fs.writeFile(
        workspaceConfigPath,
        JSON.stringify(localConfig, null, 2),
        "utf-8",
      );
      console.log(
        `[Success] Локальний конфіг воркспейсу збережено: ${workspaceConfigPath}`,
      );
    } catch (error) {
      console.error(
        `[Error] Помилка запису локального конфігу в ${workspaceConfigPath}:`,
        error,
      );
      throw error;
    }
  }

  private async syncWorkspaces(): Promise<Workspace[]> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const validWorkspaces: Workspace[] = [];
    const rawWorkspaces: RawWorkspace[] = [];
    let configChanged = false;

    for (const raw of this.config.workspaces) {
      const localConfig = await this.readLocalConfig(raw.absolutePath);

      if (localConfig) {
        validWorkspaces.push({
          id: raw.id,
          absolutePath: raw.absolutePath,
          title: localConfig.title,
        } as Workspace);
        rawWorkspaces.push(raw);
      } else {
        configChanged = true;
        if (this.config.selectedWorkspace === raw.id) {
          this.config.selectedWorkspace = "";
        }
      }
    }

    if (configChanged) {
      this.config.workspaces = rawWorkspaces;
      await this.saveConfig(this.config);
    }

    return validWorkspaces;
  }

  public async getWorkspaces(): Promise<Workspace[]> {
    return await this.syncWorkspaces();
  }

  public async selectWorkspace(id: string): Promise<Workspace> {
    const validWorkspaces = await this.syncWorkspaces();
    const workspace = validWorkspaces.find((w) => w.id === id);

    if (!workspace) {
      throw new Error(`Workspace з id "${id}" не знайдено`);
    }

    this.config!.selectedWorkspace = id;
    await this.saveConfig(this.config!);

    return workspace;
  }

  public async getSelectedWorkspace(): Promise<Workspace | undefined> {
    const validWorkspaces = await this.syncWorkspaces();

    return validWorkspaces.find(
      (it) => it.id === this.config!.selectedWorkspace,
    );
  }

  public async hotReload(): Promise<AppConfig> {
    this.config = await this.loadConfig();
    const validWorkspaces = await this.syncWorkspaces();

    return {
      selectedWorkspace: this.config!.selectedWorkspace,
      workspaces: validWorkspaces,
    };
  }

  public getSelectedWorkspacePath(): string | undefined {
    if (!this.config) {
      return undefined;
    }

    const workspace = this.config.workspaces.find(
      (it) => it.id === this.config!.selectedWorkspace,
    );

    return workspace?.absolutePath;
  }

  public async loadWorkspace(absolutePath: string): Promise<Workspace> {
    const localConfig = await this.readLocalConfig(absolutePath);

    if (!localConfig) {
      throw new Error("INVALID_WORKSPACE");
    }

    if (!this.config) {
      this.config = await this.loadConfig();
    }

    let rawWorkspace = this.config.workspaces.find(
      (w) => w.absolutePath === absolutePath,
    );

    if (!rawWorkspace) {
      rawWorkspace = {
        id: randomUUID(),
        absolutePath: absolutePath,
      };
      this.config.workspaces.push(rawWorkspace);
    }

    this.config.selectedWorkspace = rawWorkspace.id;
    await this.saveConfig(this.config);

    return {
      id: rawWorkspace.id,
      absolutePath: rawWorkspace.absolutePath,
      title: localConfig.title,
    } as Workspace;
  }

  public async createWorkspace(
    title: string,
    absolutePath: string,
  ): Promise<Workspace> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const newWorkspace: RawWorkspace = {
      id: randomUUID(),
      absolutePath: absolutePath,
    };

    const localConfig: WorkspaceLocalConfig = {
      title: title,
    };

    try {
      await this.saveWorkspaceLocalConfig(
        newWorkspace.absolutePath,
        localConfig,
      );

      this.config.workspaces.push(newWorkspace);
      this.config.selectedWorkspace = newWorkspace.id;
      await this.saveConfig(this.config);

      return {
        id: newWorkspace.id,
        absolutePath: newWorkspace.absolutePath,
        title: localConfig.title,
      } as Workspace;
    } catch (error) {
      throw new Error("Failed to create workspace");
    }
  }
}

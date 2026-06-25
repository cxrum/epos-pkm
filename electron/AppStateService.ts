import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import {
  AppConfig,
  AppStateApi,
  WorkspaceConf,
  WorkspaceEntry,
} from "../app/appState";
import { randomUUID } from "crypto";

interface Workspace {
  id: string;
  absolutePath: string;
  title: string;
}

interface RawAppConfig {
  workspaces: WorkspaceEntry[];
  selectedWorkspace: string;
}

export class RawAppStateService implements AppStateApi {
  private configPath: string;
  private config: RawAppConfig | null = null;

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    console.log(this.configPath);
  }

  private mapConfig(raw: RawAppConfig): AppConfig {
    return {
      selectedWorkspace: raw.selectedWorkspace,
    };
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

  async hotReload(): Promise<AppConfig> {
    if (this.config) {
      return this.mapConfig(this.config);
    }
    const conf = await this.loadConfig();
    return this.mapConfig(conf);
  }

  private async readLocalConfig(
    absolutePath: string,
  ): Promise<WorkspaceConf | null> {
    try {
      const workspaceConfigPath = path.join(absolutePath, ".workspace");
      const rawData = await fs.readFile(workspaceConfigPath, "utf-8");
      return JSON.parse(rawData) as WorkspaceConf;
    } catch (e) {
      return null;
    }
  }

  private async saveWorkspaceConf(
    absolutePath: string,
    localConfig: WorkspaceConf,
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

  private mapWorkspaceToLocal(w: Workspace): WorkspaceConf {
    return {
      id: w.id,
      title: w.title,
    };
  }

  private mapWorkspaceToLocalMap(w: Workspace[]): WorkspaceConf[] {
    return w.map((it) => this.mapWorkspaceToLocal(it));
  }

  private mapWorkspaceToGlobal(w: Workspace): WorkspaceEntry {
    return {
      id: w.id,
      absolutePath: w.absolutePath,
    };
  }

  private mapWorkspaceToGlobalMap(w: Workspace[]): WorkspaceEntry[] {
    return w.map((it) => this.mapWorkspaceToGlobal(it));
  }

  private async syncWorkspaces(): Promise<Workspace[]> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const validWorkspaces: Workspace[] = [];
    const WorkspaceEntrys: WorkspaceEntry[] = [];
    let configChanged = false;

    for (const raw of this.config.workspaces) {
      const localConfig = await this.readLocalConfig(raw.absolutePath);

      if (localConfig) {
        validWorkspaces.push({
          id: raw.id,
          absolutePath: raw.absolutePath,
          title: localConfig.title,
        });
        WorkspaceEntrys.push(raw);
      } else {
        configChanged = true;
        if (this.config.selectedWorkspace === raw.id) {
          this.config.selectedWorkspace = "";
        }
      }
    }

    if (configChanged) {
      this.config.workspaces = WorkspaceEntrys;
      await this.saveConfig(this.config);
    }

    return validWorkspaces;
  }

  public async getWorkspaces(): Promise<WorkspaceEntry[]> {
    const res = await this.syncWorkspaces();
    return this.mapWorkspaceToGlobalMap(res);
  }

  public async getLocalWorkspace(
    id: string,
  ): Promise<WorkspaceConf | undefined> {
    const res = (await this.syncWorkspaces()).find((it) => it.id === id);
    if (!res) {
      return undefined;
    }

    return this.mapWorkspaceToLocal(res);
  }

  public async selectWorkspace(id: string): Promise<WorkspaceConf> {
    const validWorkspaces = await this.syncWorkspaces();
    const workspace = validWorkspaces.find((w) => w.id === id);

    if (!workspace) {
      throw new Error(`Workspace з id "${id}" не знайдено`);
    }

    this.config!.selectedWorkspace = id;
    await this.saveConfig(this.config!);

    return this.mapWorkspaceToLocal(workspace);
  }

  public async getSelectedWorkspace(): Promise<WorkspaceConf | undefined> {
    const validWorkspaces = await this.syncWorkspaces();
    const res = validWorkspaces.find(
      (it) => it.id === this.config!.selectedWorkspace,
    );
    if (!res) {
      return undefined;
    }
    return this.mapWorkspaceToLocal(res);
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

  public async loadWorkspace(absolutePath: string): Promise<WorkspaceConf> {
    const _path = path.join(absolutePath);
    const localConfig = await this.readLocalConfig(_path);

    if (!localConfig) {
      throw new Error("INVALID_WORKSPACE");
    }

    if (!this.config) {
      this.config = await this.loadConfig();
    }

    let WorkspaceEntry = this.config.workspaces.find(
      (w) => w.absolutePath === absolutePath,
    );

    if (!WorkspaceEntry) {
      WorkspaceEntry = {
        id: randomUUID(),
        absolutePath: absolutePath,
      };
      this.config.workspaces.push(WorkspaceEntry);
    }

    await this.saveConfig(this.config);

    return {
      id: WorkspaceEntry.id,
      title: localConfig.title,
    };
  }

  public async createWorkspace(
    title: string,
    absolutePath: string,
  ): Promise<WorkspaceConf> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const newWorkspace: WorkspaceEntry = {
      id: randomUUID(),
      absolutePath: absolutePath,
    };

    const localConfig: WorkspaceConf = {
      title: title,
      id: newWorkspace.id,
    };

    try {
      await this.saveWorkspaceConf(newWorkspace.absolutePath, localConfig);

      this.config.workspaces.push(newWorkspace);
      await this.saveConfig(this.config);

      return {
        id: newWorkspace.id,
        title: localConfig.title,
      } as WorkspaceConf;
    } catch (error) {
      throw new Error("Failed to create workspace");
    }
  }
}

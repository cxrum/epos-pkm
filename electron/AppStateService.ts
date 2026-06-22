import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { AppConfig, Workspace } from "../app/appState";

export interface RawTab {
  id: string;
}

export interface RawAppStateConfig {
  savedTabs: RawTab[];
}

export interface RawWorkspace {
  id: string;
  title: string;
  absolutePath: string;
  state: RawAppStateConfig;
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

  private toFrontendWorkspace(rawWorkspace: RawWorkspace): Workspace {
    const { absolutePath, ...safeWorkspace } = rawWorkspace;
    return safeWorkspace as Workspace;
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

  public async getWorkspaces(): Promise<Workspace[]> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    return this.config.workspaces.map((w) => this.toFrontendWorkspace(w));
  }

  public async selectWorkspace(id: string): Promise<Workspace> {
    if (!this.config) this.config = await this.loadConfig();

    const workspace = this.config.workspaces.find((w) => w.id === id);
    if (!workspace) {
      throw new Error(`Workspace з id "${id}" не знайдено`);
    }

    this.config.selectedWorkspace = id;
    await this.saveConfig(this.config);

    return this.toFrontendWorkspace(workspace);
  }

  public getSelectedWorkspace(): Workspace | undefined {
    if (!this.config) {
      return undefined;
    }

    const workspace = this.config.workspaces.find(
      (it) => it.id === this.config!.selectedWorkspace,
    );

    return workspace ? this.toFrontendWorkspace(workspace) : undefined;
  }

  public async hotReload(): Promise<AppConfig> {
    this.config = await this.loadConfig();

    return {
      selectedWorkspace: this.config.selectedWorkspace,
      workspaces: this.config.workspaces.map((w) =>
        this.toFrontendWorkspace(w),
      ),
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
}

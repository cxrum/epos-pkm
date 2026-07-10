import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync, type Dirent } from "fs";
import {
  AppConfig,
  AppStateApi,
  WorkspaceConf,
  WorkspaceEntry,
} from "../app/appState";
import { randomUUID } from "crypto";

interface LegacyWorkspaceEntry {
  id: string;
  absolutePath: string;
}

interface WorkspaceRecord {
  id: string;
  absolutePath: string;
  relativePath: string;
  title: string;
}

interface RawAppConfig {
  workspacesRootPath: string;
  selectedWorkspace: string;
  customSyncServerUrl: string | null;
}

interface LegacyRawAppConfig extends Partial<RawAppConfig> {
  workspaces?: LegacyWorkspaceEntry[];
}

export class RawAppStateService implements AppStateApi {
  private configPath: string;
  private config: RawAppConfig | null = null;
  private readonly defaultSyncServerUrl: string;
  private selectedWorkspaceAbsolutePath: string | undefined;

  constructor(defaultSyncServerUrl: string) {
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.defaultSyncServerUrl = defaultSyncServerUrl.replace(/\/+$/, "");
  }

  private mapConfig(raw: RawAppConfig): AppConfig {
    return {
      workspacesRootPath: raw.workspacesRootPath,
      selectedWorkspace: raw.selectedWorkspace,
      customSyncServerUrl: raw.customSyncServerUrl,
    };
  }

  private normalizeSyncServerUrl(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }

    const trimmed = url.trim().replace(/\/+$/, "");
    return trimmed.length ? trimmed : null;
  }

  private applyDefaults(raw: Partial<RawAppConfig>): RawAppConfig {
    return {
      workspacesRootPath: this.normalizeWorkspacePath(
        raw.workspacesRootPath ?? "",
      ),
      selectedWorkspace: raw.selectedWorkspace ?? "",
      customSyncServerUrl: this.normalizeSyncServerUrl(
        raw.customSyncServerUrl ?? null,
      ),
    };
  }

  private normalizeWorkspacePath(targetPath: string): string {
    if (!targetPath.trim()) {
      return "";
    }

    return path.resolve(targetPath.trim());
  }

  private toPosixRelativePath(targetPath: string): string {
    const normalized = path.normalize(targetPath);
    if (normalized === "") {
      return ".";
    }

    return normalized.replace(/\\/g, "/");
  }

  private getLegacyWorkspaceRoot(
    workspaces: LegacyWorkspaceEntry[],
  ): string {
    const absolutePaths = workspaces
      .map((workspace) => path.resolve(workspace.absolutePath))
      .filter((workspacePath) => workspacePath.length > 0);

    if (absolutePaths.length === 0) {
      return "";
    }

    if (absolutePaths.length === 1) {
      return path.dirname(absolutePaths[0]);
    }

    const segments = absolutePaths[0].split(path.sep);

    for (const absolutePath of absolutePaths.slice(1)) {
      const currentSegments = absolutePath.split(path.sep);
      let commonLength = 0;

      while (
        commonLength < segments.length &&
        commonLength < currentSegments.length &&
        segments[commonLength] === currentSegments[commonLength]
      ) {
        commonLength += 1;
      }

      segments.splice(commonLength);

      if (segments.length === 0) {
        break;
      }
    }

    if (segments.length === 0) {
      return "";
    }

    return segments.join(path.sep);
  }

  private migrateLegacyConfig(raw: LegacyRawAppConfig): RawAppConfig {
    if (raw.workspacesRootPath) {
      return this.applyDefaults(raw);
    }

    const rootPath = this.getLegacyWorkspaceRoot(raw.workspaces ?? []);
    return this.applyDefaults({
      ...raw,
      workspacesRootPath: rootPath,
    });
  }

  private async loadConfig(): Promise<RawAppConfig> {
    if (existsSync(this.configPath)) {
      try {
        const rawData = await fs.readFile(this.configPath, "utf-8");
        const parsed = JSON.parse(rawData) as LegacyRawAppConfig;
        const migrated = this.migrateLegacyConfig(parsed);

        if (
          JSON.stringify(parsed) !==
          JSON.stringify(migrated)
        ) {
          await this.saveConfig(migrated);
        }

        return migrated;
      } catch (error) {
        console.error("File read error. Created a new config:", error);
      }
    }

    const defaultConfig = this.applyDefaults({});

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

  async getSyncServerUrl(): Promise<string> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    return this.config.customSyncServerUrl ?? this.defaultSyncServerUrl;
  }

  async setSyncServerUrl(url: string | null): Promise<string> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    this.config.customSyncServerUrl = this.normalizeSyncServerUrl(url);
    await this.saveConfig(this.config);

    return this.config.customSyncServerUrl ?? this.defaultSyncServerUrl;
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

  private mapWorkspaceToLocal(w: WorkspaceRecord): WorkspaceConf {
    return {
      id: w.id,
      title: w.title,
    };
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private async scanWorkspaces(
    rootPath: string,
  ): Promise<WorkspaceRecord[]> {
    const normalizedRoot = this.normalizeWorkspacePath(rootPath);
    if (!normalizedRoot) {
      return [];
    }

    const discovered: WorkspaceRecord[] = [];

    const traverse = async (currentPath: string): Promise<void> => {
      let entries: Dirent[];
      try {
        entries = await fs.readdir(currentPath, { withFileTypes: true });
      } catch {
        return;
      }

      const localConfig = await this.readLocalConfig(currentPath);
      if (localConfig) {
        const relativePath = path.relative(normalizedRoot, currentPath);
        discovered.push({
          id: localConfig.id,
          absolutePath: currentPath,
          relativePath: this.toPosixRelativePath(
            relativePath === "" ? "." : relativePath,
          ),
          title: localConfig.title,
        });
        return;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        await traverse(path.join(currentPath, entry.name));
      }
    };

    await traverse(normalizedRoot);

    discovered.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    );

    return discovered;
  }

  private async syncWorkspaces(): Promise<WorkspaceRecord[]> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const rootPath = this.config.workspacesRootPath;
    if (!rootPath) {
      if (this.config.selectedWorkspace) {
        this.config.selectedWorkspace = "";
        await this.saveConfig(this.config);
      }

      return [];
    }

    const validWorkspaces = await this.scanWorkspaces(rootPath);
    let configChanged = false;

    if (
      this.config.selectedWorkspace &&
      !validWorkspaces.some(
        (workspace) => workspace.id === this.config!.selectedWorkspace,
      )
    ) {
      this.config.selectedWorkspace = "";
      this.selectedWorkspaceAbsolutePath = undefined;
      configChanged = true;
    }

    const selectedWorkspace = validWorkspaces.find(
      (workspace) => workspace.id === this.config!.selectedWorkspace,
    );
    this.selectedWorkspaceAbsolutePath = selectedWorkspace?.absolutePath;

    if (configChanged) {
      await this.saveConfig(this.config);
    }

    return validWorkspaces;
  }

  public async getWorkspaces(): Promise<WorkspaceEntry[]> {
    const res = await this.syncWorkspaces();
    return res.map((workspace) => ({
      id: workspace.id,
      relativePath: workspace.relativePath,
    }));
  }

  public async getLocalWorkspace(
    id: string,
  ): Promise<WorkspaceConf | undefined> {
    const res = (await this.syncWorkspaces()).find((it) => it.id === id);
    if (!res) {
      return undefined;
    }

    return {
      id: res.id,
      title: res.title,
    };
  }

  public async selectWorkspace(id: string): Promise<WorkspaceConf> {
    const validWorkspaces = await this.syncWorkspaces();
    const workspace = validWorkspaces.find((w) => w.id === id);

    if (!workspace) {
      throw new Error(`Workspace з id "${id}" не знайдено`);
    }

    this.config!.selectedWorkspace = id;
    await this.saveConfig(this.config!);

    return {
      id: workspace.id,
      title: workspace.title,
    };
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
    return this.selectedWorkspaceAbsolutePath;
  }

  public async loadWorkspace(rootPath: string): Promise<WorkspaceConf> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    this.config.workspacesRootPath = this.normalizeWorkspacePath(rootPath);
    await this.saveConfig(this.config);

    const workspaces = await this.syncWorkspaces();
    const selectedWorkspace = workspaces.find(
      (workspace) => workspace.id === this.config!.selectedWorkspace,
    );

    if (selectedWorkspace) {
      return {
        id: selectedWorkspace.id,
        title: selectedWorkspace.title,
      };
    }

    const firstWorkspace = workspaces[0];
    if (firstWorkspace) {
      return {
        id: firstWorkspace.id,
        title: firstWorkspace.title,
      };
    }

    return {
      id: "",
      title: "",
    };
  }

  public async createWorkspace(
    title: string,
    rootPath: string,
  ): Promise<WorkspaceConf> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const normalizedRootPath = this.normalizeWorkspacePath(rootPath);
    this.config.workspacesRootPath = normalizedRootPath;

    const sanitizedTitle = title
      .trim()
      .replace(/[<>:"|?*\\/]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/^\.+$/, "")
      .trim();
    const workspaceFolderName = sanitizedTitle.length ? sanitizedTitle : "workspace";

    let workspaceAbsolutePath = path.join(
      normalizedRootPath,
      workspaceFolderName,
    );
    let suffix = 1;

    while (await this.pathExists(workspaceAbsolutePath)) {
      workspaceAbsolutePath = path.join(
        normalizedRootPath,
        `${workspaceFolderName}-${suffix}`,
      );
      suffix += 1;
    }

    const newWorkspace: WorkspaceRecord = {
      id: randomUUID(),
      absolutePath: workspaceAbsolutePath,
      relativePath: this.toPosixRelativePath(
        path.relative(normalizedRootPath, workspaceAbsolutePath) || ".",
      ),
      title,
    };

    const localConfig: WorkspaceConf = {
      title: title,
      id: newWorkspace.id,
    };

    try {
      await fs.mkdir(newWorkspace.absolutePath, { recursive: true });
      await this.saveWorkspaceConf(newWorkspace.absolutePath, localConfig);

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

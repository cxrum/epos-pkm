import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync, type Dirent } from "fs";
import {
  AppConfig,
  AppStateApi,
  WorkspaceConf,
  WorkspaceEntry,
  WorkspaceSelection,
} from "../app/appState";
import { randomUUID } from "crypto";

interface LegacyWorkspaceEntry {
  id: string;
  absolutePath: string;
}

interface RawWorkspaceDiskConfig {
  id: string;
  title: string;
  state?: unknown;
  [key: string]: unknown;
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

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json");
  }

  private getDefaultWorkspacesRootPath(): string {
    return path.join(app.getPath("documents"), "Epos", "Workspaces");
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
        raw.workspacesRootPath ?? this.getDefaultWorkspacesRootPath(),
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

  private normalizeWorkspaceTitle(title: string): string {
    const normalizedTitle = title.trim().length ? title.trim() : "Untitled";
    const sanitized = normalizedTitle
      .replace(/[<>:"|?*\\/]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/^\.+$/, "")
      .trim();

    return sanitized.length ? sanitized : "Untitled";
  }

  private getWorkspaceSuffix(id: string): string {
    return id.replace(/-/g, "").slice(0, 8) || randomUUID().replace(/-/g, "").slice(0, 8);
  }

  private getWorkspaceFolderBase(title: string): string {
    return this.normalizeWorkspaceTitle(title);
  }

  private getWorkspaceFolderName(title: string, id: string, unique: boolean): string {
    const base = this.getWorkspaceFolderBase(title);
    return unique ? `${base}_${this.getWorkspaceSuffix(id)}` : base;
  }

  private async buildWorkspacePath(
    rootPath: string,
    title: string,
    id: string,
    shouldUseSuffix: boolean,
    fallbackPath?: string,
  ): Promise<string> {
    const baseName = this.getWorkspaceFolderBase(title);
    const preferredName = shouldUseSuffix
      ? this.getWorkspaceFolderName(title, id, true)
      : baseName;
    const preferredPath = path.join(rootPath, preferredName);

    if (fallbackPath && path.resolve(fallbackPath) === path.resolve(preferredPath)) {
      return preferredPath;
    }

    if (!(await this.pathExists(preferredPath))) {
      return preferredPath;
    }

    if (!shouldUseSuffix) {
      const suffixedPath = path.join(
        rootPath,
        this.getWorkspaceFolderName(title, id, true),
      );
      if (!(await this.pathExists(suffixedPath))) {
        return suffixedPath;
      }
      return suffixedPath;
    }

    return preferredPath;
  }

  private async reconcileWorkspaceFolders(rootPath: string): Promise<WorkspaceRecord[]> {
    const workspaces = await this.scanWorkspaces(rootPath);
    const groups = new Map<string, WorkspaceRecord[]>();

    for (const workspace of workspaces) {
      const base = this.getWorkspaceFolderBase(workspace.title);
      const group = groups.get(base) ?? [];
      group.push(workspace);
      groups.set(base, group);
    }

    const renames = workspaces
      .map((workspace) => {
        const base = this.getWorkspaceFolderBase(workspace.title);
        const group = groups.get(base) ?? [];
        const shouldUseSuffix = group.length > 1;
        const desiredName = this.getWorkspaceFolderName(
          workspace.title,
          workspace.id,
          shouldUseSuffix,
        );
        const desiredPath = path.join(rootPath, desiredName);

        return {
          workspace,
          desiredPath,
        };
      })
      .filter(({ workspace, desiredPath }) =>
        path.resolve(workspace.absolutePath) !== path.resolve(desiredPath),
      );

    if (renames.length === 0) {
      return workspaces;
    }

    const tempMoves = renames.map(({ workspace, desiredPath }) => ({
      workspace,
      desiredPath,
      tempPath: path.join(
        rootPath,
        `.__tmp__${workspace.id.replace(/-/g, "")}_${randomUUID().replace(/-/g, "")}`,
      ),
    }));

    for (const move of tempMoves) {
      await fs.rename(move.workspace.absolutePath, move.tempPath);
      move.workspace.absolutePath = move.tempPath;
    }

    for (const move of tempMoves) {
      await fs.rename(move.tempPath, move.desiredPath);
      move.workspace.absolutePath = move.desiredPath;
    }

    return await this.scanWorkspaces(rootPath);
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

    return this.config.customSyncServerUrl ?? "";
  }

  async setSyncServerUrl(url: string | null): Promise<string> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    this.config.customSyncServerUrl = this.normalizeSyncServerUrl(url);
    await this.saveConfig(this.config);

    return this.config.customSyncServerUrl ?? "";
  }

  private async readLocalConfig(
    absolutePath: string,
  ): Promise<RawWorkspaceDiskConfig | null> {
    try {
      const workspaceConfigPath = path.join(absolutePath, ".workspace");
      const rawData = await fs.readFile(workspaceConfigPath, "utf-8");
      const parsed = JSON.parse(rawData) as RawWorkspaceDiskConfig;

      if (
        !parsed ||
        typeof parsed.id !== "string" ||
        typeof parsed.title !== "string"
      ) {
        return null;
      }

      return parsed;
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
      const current = await this.readLocalConfig(absolutePath);
      const nextConfig: RawWorkspaceDiskConfig = {
        ...(current ?? {}),
        ...localConfig,
        id: localConfig.id,
        title: localConfig.title,
      };

      await fs.writeFile(
        workspaceConfigPath,
        JSON.stringify(nextConfig, null, 2),
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

  private async ensureWorkspaceArtifacts(
    absolutePath: string,
    localConfig: WorkspaceConf,
  ): Promise<void> {
    const workspaceRootObject = {
      id: "-1",
      typeId: "sys:workspace",
      title: "root",
      content: {},
      order: [],
      properties: {
        isContainer: {
          id: "isContainer",
          title: "isContainer",
          type: "boolean",
          value: true,
        },
      },
    };

    await fs.mkdir(absolutePath, { recursive: true });
    await this.saveWorkspaceConf(absolutePath, localConfig);

    const rootFilePath = path.join(absolutePath, "root.json");
    if (!(await this.pathExists(rootFilePath))) {
      await fs.writeFile(
        rootFilePath,
        JSON.stringify(workspaceRootObject, null, 2),
        "utf-8",
      );
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

  private async repairDuplicateWorkspaceIds(
    workspaces: WorkspaceRecord[],
  ): Promise<WorkspaceRecord[]> {
    const seen = new Set<string>();
    const repaired: WorkspaceRecord[] = [];
    let changed = false;

    for (const workspace of workspaces) {
      const existing = seen.has(workspace.id);
      if (!existing) {
        seen.add(workspace.id);
        repaired.push(workspace);
        continue;
      }

      const nextId = randomUUID();
      changed = true;
      const updatedWorkspace: WorkspaceRecord = {
        ...workspace,
        id: nextId,
      };
      await this.saveWorkspaceConf(workspace.absolutePath, {
        id: updatedWorkspace.id,
        title: updatedWorkspace.title,
      });
      repaired.push(updatedWorkspace);
    }

    if (changed) {
      console.warn(
        "Detected duplicate workspace ids on disk and repaired the later copies.",
      );
    }

    return repaired;
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

    const validWorkspaces = await this.repairDuplicateWorkspaceIds(
      await this.scanWorkspaces(rootPath),
    );
    let configChanged = false;

    if (
      this.config.selectedWorkspace &&
      !validWorkspaces.some(
        (workspace) => workspace.id === this.config!.selectedWorkspace,
      )
    ) {
      this.config.selectedWorkspace = "";
      configChanged = true;
    }

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

  public async getWorkspacesRootPath(): Promise<string> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    return this.config.workspacesRootPath;
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

  public async clearSelectedWorkspace(): Promise<void> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    if (!this.config.selectedWorkspace) {
      return;
    }

    this.config.selectedWorkspace = "";
    await this.saveConfig(this.config);
  }

  public async getSelectedWorkspace(): Promise<WorkspaceSelection | undefined> {
    const validWorkspaces = await this.syncWorkspaces();
    const res = validWorkspaces.find(
      (it) => it.id === this.config!.selectedWorkspace,
    );
    if (!res) {
      return undefined;
    }
    return {
      id: res.id,
      title: res.title,
      relativePath: res.relativePath,
    };
  }

  public getWorkspacesRootPathSync(): string | undefined {
    if (!this.config) {
      return this.getDefaultWorkspacesRootPath();
    }

    return this.config.workspacesRootPath || undefined;
  }

  public async selectWorkspacesRoot(
    rootPath: string,
  ): Promise<WorkspaceConf | undefined> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const normalizedRootPath = this.normalizeWorkspacePath(rootPath);
    if (!normalizedRootPath) {
      throw new Error("Workspace root path is empty");
    }

    const previousRootPath = this.config.workspacesRootPath;
    if (previousRootPath === normalizedRootPath) {
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

      return undefined;
    }

    if (previousRootPath) {
      const relativeToCurrent = path.relative(previousRootPath, normalizedRootPath);
      if (
        relativeToCurrent &&
        !relativeToCurrent.startsWith("..") &&
        !path.isAbsolute(relativeToCurrent)
      ) {
        throw new Error("Selected root cannot be inside the current root");
      }
    }

    try {
      await fs.mkdir(normalizedRootPath, { recursive: true });

      if (previousRootPath && (await this.pathExists(previousRootPath))) {
        const previousWorkspaces = await this.scanWorkspaces(previousRootPath);

        for (const workspace of previousWorkspaces) {
          const relativeToWorkspace = path.relative(
            workspace.absolutePath,
            normalizedRootPath,
          );
          if (
            relativeToWorkspace &&
            !relativeToWorkspace.startsWith("..") &&
            !path.isAbsolute(relativeToWorkspace)
          ) {
            throw new Error(
              "Selected root cannot be inside an existing workspace",
            );
          }
        }

        const targetEntries = await fs.readdir(normalizedRootPath);
        if (targetEntries.length > 0) {
          throw new Error("Selected root must be empty");
        }

        await fs.rmdir(normalizedRootPath);
        await fs.rename(previousRootPath, normalizedRootPath);
      }

      this.config.workspacesRootPath = normalizedRootPath;
      await this.saveConfig(this.config);
    } catch (error) {
      console.error("Failed to move workspace root", error);
      throw error;
    }

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

    return undefined;
  }

  public async createWorkspace(title: string): Promise<WorkspaceConf> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const normalizedRootPath = this.config.workspacesRootPath;
    if (!normalizedRootPath) {
      throw new Error("Workspace root path is not set");
    }

    const normalizedTitle = this.normalizeWorkspaceTitle(title);
    const id = randomUUID();
    const existing = await this.syncWorkspaces();
    const workspaceAbsolutePath = await this.buildWorkspacePath(
      normalizedRootPath,
      normalizedTitle,
      id,
      existing.some(
        (workspace) =>
          this.getWorkspaceFolderBase(workspace.title) === normalizedTitle,
      ),
    );

    const newWorkspace: WorkspaceRecord = {
      id,
      absolutePath: workspaceAbsolutePath,
      relativePath: this.toPosixRelativePath(
        path.relative(normalizedRootPath, workspaceAbsolutePath) || ".",
      ),
      title: normalizedTitle,
    };

    const localConfig: WorkspaceConf = {
      title: normalizedTitle,
      id: newWorkspace.id,
    };

    try {
      await this.ensureWorkspaceArtifacts(
        newWorkspace.absolutePath,
        localConfig,
      );
      await this.saveConfig(this.config);

      return {
        id: newWorkspace.id,
        title: localConfig.title,
      } as WorkspaceConf;
    } catch (error) {
      throw new Error("Failed to create workspace");
    }
  }

  public async upsertWorkspace(
    workspace: WorkspaceConf,
  ): Promise<WorkspaceConf | undefined> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const normalizedRootPath = this.config.workspacesRootPath;
    if (!normalizedRootPath) {
      throw new Error("Workspace root path is not set");
    }

    const normalizedTitle = this.normalizeWorkspaceTitle(workspace.title);
    const existing = await this.syncWorkspaces();
    const match = existing.find((entry) => entry.id === workspace.id);

    if (match) {
      const workspaceAbsolutePath = await this.buildWorkspacePath(
        normalizedRootPath,
        normalizedTitle,
        workspace.id,
        existing.some(
          (entry) =>
            entry.id !== workspace.id &&
            this.getWorkspaceFolderBase(entry.title) === normalizedTitle,
        ),
        match.absolutePath,
      );

      if (path.resolve(match.absolutePath) !== path.resolve(workspaceAbsolutePath)) {
        await fs.mkdir(path.dirname(workspaceAbsolutePath), { recursive: true });
        await fs.rename(match.absolutePath, workspaceAbsolutePath);
      }

      if (
        match.title !== normalizedTitle ||
        path.resolve(match.absolutePath) !== path.resolve(workspaceAbsolutePath)
      ) {
        await this.saveWorkspaceConf(workspaceAbsolutePath, {
          id: match.id,
          title: normalizedTitle,
        });
      }

      return {
        id: match.id,
        title: normalizedTitle,
      };
    }

    const workspaceAbsolutePath = await this.buildWorkspacePath(
      normalizedRootPath,
      normalizedTitle,
      workspace.id,
      existing.some(
        (entry) =>
          this.getWorkspaceFolderBase(entry.title) === normalizedTitle,
      ),
    );

    try {
      await this.ensureWorkspaceArtifacts(workspaceAbsolutePath, {
        id: workspace.id,
        title: normalizedTitle,
      });
      await this.saveConfig(this.config);

      return {
        id: workspace.id,
        title: normalizedTitle,
      };
    } catch (error) {
      console.error("Failed to upsert workspace", error);
      throw error;
    }
  }

  public async renameWorkspace(
    id: string,
    title: string,
  ): Promise<WorkspaceConf> {
    const result = await this.upsertWorkspace({ id, title });
    if (!result) {
      throw new Error("Failed to rename workspace");
    }

    return result;
  }

  public async deleteWorkspace(id: string): Promise<void> {
    if (!this.config) {
      this.config = await this.loadConfig();
    }

    const normalizedRootPath = this.config.workspacesRootPath;
    if (!normalizedRootPath) {
      throw new Error("Workspace root path is not set");
    }

    const existing = await this.syncWorkspaces();
    const target = existing.find((entry) => entry.id === id);
    if (!target) {
      throw new Error(`Workspace з id "${id}" не знайдено`);
    }

    await fs.rm(target.absolutePath, { recursive: true, force: true });

    if (this.config.selectedWorkspace === id) {
      this.config.selectedWorkspace = "";
      await this.saveConfig(this.config);
    }
  }
}

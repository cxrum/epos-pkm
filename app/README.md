# Epos PKM Client
Electron + Vue client for the local-first Epos PKM workspace.

## Sync Behavior

- Authentication enables encrypted cross-device sync.
- The renderer runs a background sync loop every 30 seconds.
- Workspace JSON files are synchronized as encrypted, bounded file-op batches. Local `.workspace`
  metadata stays on the device so workspace ids and titles do not leak into shared sync content.
- Workspace discovery uses a separate encrypted catalog sync stream so devices can learn about
  workspaces created on other machines without exposing titles to the server. The client now
  pushes the full local workspace catalog snapshot when it changes, so the chooser can refresh
  even if a device missed earlier incremental updates.
- Workspaces are discovered relative to the selected workspace root directory; the renderer never needs absolute OS paths.
- The sync request cursor is the last remote update id the client has already applied.
  `after_cursor` asks the server for only newer updates from that stream.
- Local saves still happen immediately; sync only mirrors them to the server.

## Configuration

- Set the sync server URL in app settings.
- Leave the field empty to use the default server from `EPOS_API_URL`.

## Authentication

- Login and registration can keep a session in memory even when secure OS storage is unavailable.
- The `Remember for 30 days` checkbox only persists refresh tokens when secure storage is available.
- If secure storage is unavailable, the app falls back to a session-only login and shows a warning with steps to enable a keyring or secret-service provider on Linux.

## Development

```bash
yarn
yarn serve:front
```

The Electron shell uses the same local workspace files as the sync layer, so the app stays usable offline.
On first run, select a workspace root directory. Then add workspaces by name inside that root.
Remote-only workspaces discovered through catalog sync are materialized locally through Electron
before their content sync runs.
Use the app menu `File -> Select Workspaces` or `Cmd/Ctrl+Shift+O` to return to the chooser.

# Epos PKM Client

Electron + Vue client for the local-first Epos PKM workspace.

## Sync Behavior

- Authentication enables encrypted cross-device sync.
- The renderer runs a background sync loop every 30 seconds.
- Workspace JSON files and `.workspace` metadata are synchronized as encrypted CRDT updates.
- Local saves still happen immediately; sync only mirrors them to the server.

## Configuration

- Set the sync server URL in app settings.
- Leave the field empty to use the default server from `EPOS_API_URL`.

## Development

```bash
yarn
yarn serve:front
```

The Electron shell uses the same local workspace files as the sync layer, so the app stays usable offline.

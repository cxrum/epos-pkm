# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Authentication

- Login and registration can keep a session in memory even when secure OS storage is unavailable.
- The `Remember for 30 days` checkbox only persists refresh tokens when secure storage is available.
- If secure storage is unavailable, the app falls back to a session-only login and shows a warning with steps to enable a keyring or secret-service provider on Linux.

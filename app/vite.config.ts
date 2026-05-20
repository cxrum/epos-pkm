import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
    build: {
        outDir: './../dist',
        chunkSizeWarningLimit: 1000,
    },
    base: mode == 'development' ? '' : './',
    plugins: [
      vue(),
      tailwindcss(),
    ],
    server: {
        port: 3000,
    },
    resolve:{
        alias:{
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
}));
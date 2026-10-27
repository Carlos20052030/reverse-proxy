import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api-keys': 'http://127.0.0.1:8081',
            '/bookmarks': 'http://127.0.0.1:8081',
            '/auth': 'http://127.0.0.1:8081',
            '/webhooks': 'http://127.0.0.1:8081',
        }
    }
})
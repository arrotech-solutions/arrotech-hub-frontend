import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiUrl = env.VITE_API_URL || '';

    // Create a regular expression for caching API calls based on VITE_API_URL
    let apiUrlPattern: RegExp;
    if (apiUrl) {
        // Escape special regex characters in the API URL
        const escapedUrl = apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        apiUrlPattern = new RegExp(`^${escapedUrl}/.*`, 'i');
    } else {
        // Fallback to caching relative API paths (e.g., /auth/..., /api/...)
        apiUrlPattern = /^\/(auth|api|payments|subscription)\/.*/i;
    }

    return {
        plugins: [
            react(),
            tsconfigPaths(),
            // PWA: offline caching + installable app
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'favicon.svg', 'favicon.png'],
                manifest: {
                    name: 'Arrotech Hub',
                    short_name: 'Hub',
                    description: 'Unified inbox, calendar, tasks, and workflow automation.',
                    theme_color: '#1E1033',
                    background_color: '#FAF8FC',
                    display: 'standalone',
                    start_url: '/',
                    icons: [
                        { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
                        { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
                    ],
                },
                workbox: {
                    // Cache JS/CSS/HTML and fonts
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                    runtimeCaching: [
                        {
                            // Cache API calls with network-first strategy
                            urlPattern: apiUrlPattern,
                            handler: 'NetworkFirst',
                            options: {
                                cacheName: 'api-cache',
                                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                            },
                        },
                        {
                            // Cache Google Fonts with cache-first strategy
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts',
                                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            },
                        },
                    ],
                },
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 3000,
        },
        build: {
            outDir: 'build',
            // Disable sourcemaps in production (prevents source exposure + smaller bundles)
            sourcemap: mode === 'development',
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    }
                },
            },
        },
    };
});

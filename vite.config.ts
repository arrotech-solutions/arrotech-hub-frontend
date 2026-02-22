import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        tsconfigPaths(),
        // PWA: offline caching + installable app
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png'],
            manifest: {
                name: 'Arrotech Hub',
                short_name: 'Hub',
                description: 'Unified inbox, calendar, tasks, and workflow automation.',
                theme_color: '#7C3AED',
                background_color: '#0F172A',
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
                        urlPattern: /^https:\/\/mini-hub\.fly\.dev\/.*/i,
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
                manualChunks: {
                    // Split React core into its own chunk (rarely changes, cached long-term)
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // Split UI libraries
                    'ui-vendor': ['lucide-react', 'recharts', 'react-hot-toast', 'clsx'],
                    // Split utility libraries
                    'utils-vendor': ['axios', 'react-hook-form', 'react-helmet-async'],
                },
            },
        },
    },
}));

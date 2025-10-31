import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {URL} from "node:url";
import {fileURLToPath} from 'url'
import {ElementPlusResolver} from "unplugin-vue-components/resolvers";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

const pathSrc = fileURLToPath(new URL('./src', import.meta.url))
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver({
                importStyle: "sass"
            })]
        }),
        Components({
            resolvers: [ElementPlusResolver({
                importStyle: "sass"
            })]
        })
    ],
    resolve: {
        alias: {
            '@': pathSrc
        },
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.d.ts',
            '.ts',
            '.tsx',
            '.vue'
        ]
    },
    css: {
        preprocessorMaxWorkers: true,
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
                additionalData: `@use "@/assets/css/variables" as *;`
            }
        }
    },
    server: {
        host: '0.0.0.0',
        port: 8080,
        proxy: {
            "/api": "http://127.0.0.1:6810"
            // "/api": "https://www.apocfly.com"
        }
    },
    build: {
        chunkSizeWarningLimit: "1024",
        rollupOptions: {
            output: {
                manualChunks: {
                    'vue': ['vue', 'vue-router', 'vue-toastification'],
                    'element-plus': ['element-plus'],
                    'element-plus-icon': ['@element-plus/icons-vue'],
                    'ol': ['ol', 'ol-mapbox-style'],
                    'apis': [
                        "./src/api/activity.js",
                        "./src/api/announcement.js",
                        "./src/api/client.js",
                        "./src/api/controller.js",
                        "./src/api/file.js",
                        "./src/api/flightplan.js",
                        "./src/api/request.js",
                        "./src/api/server.js",
                        "./src/api/ticket.js",
                        "./src/api/user.js",
                        "./src/api/utils.js"
                    ],
                    'utils': ['./src/utils/message.js', './src/utils/permission.js', './src/utils/utils.js']
                },
                entryFileNames: 'js/[name].[hash].js',
                chunkFileNames: 'js/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        }
    },
    esbuild: {
        supported: {
            "top-level-await": true
        },
        drop: [
            'debugger'
        ]
    }
})
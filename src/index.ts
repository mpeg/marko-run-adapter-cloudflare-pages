import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { spawnServer } from '@marko/run/vite'
import type { Adapter } from '@marko/run/adapter'
import { watch, build } from './builder'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const wrangler = async (command: string[], port: number, ...args: any[]) => {
    return await spawnServer(
        'wrangler',
        [...command, './dist', '--live-reload', `--port=${port}`, ...args], // TODO: kinda ugly that ./dist is hardcoded, can I get it from the resolved vite config?
        port,
        {},
        process.cwd(),
        Infinity, // TODO: waitForServer seems to fail to find port, bug?
        'inherit'
    )
}

export default function cfPagesAdapter(): Adapter {
    return {
        name: 'cloudflare-pages-adapter',

        viteConfig(config) {
            if (config.build?.ssr) {
                return {
                    resolve: {
                        dedupe: ['marko'],
                        conditions: ['worker']
                    },
                    ssr: {
                        target: 'webworker',
                        noExternal: true
                    },
                    build: {
                        rollupOptions: {
                            output: {
                                entryFileNames: '_worker.js'
                            }
                        }
                    }
                }
            }
        },

        getEntryFile() {
            return path.join(__dirname, 'default-edge-entry')
        },

        async startDev(_, config, options) {
            await build(config)
            await watch(['./src'], build, config)
            return await wrangler(['pages', 'dev'], options.port || 3000, ...options.args)
        },

        async startPreview(_, options) {
            return await wrangler(['pages', 'dev'], options.port || 3000, ...options.args)
        },

        async buildEnd(_, _routes, builtEntries) {
            const entry = builtEntries[0]
            const distDir = path.dirname(entry)
            const hasRoutesFile = existsSync(path.join(distDir, '_routes.json'))
            if (!hasRoutesFile) {
                await fs.writeFile(
                    path.join(distDir, '_routes.json'),
                    JSON.stringify({
                        version: 1,
                        include: ['/*'],
                        exclude: ['/assets/*', '/favicon.ico']
                    })
                )
            }
        }
    }
}

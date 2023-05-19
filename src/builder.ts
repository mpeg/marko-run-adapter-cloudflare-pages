import path from 'path'
import chokidar from 'chokidar'
import { build as viteBuild, type InlineConfig } from 'vite'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const watch = <T extends (...args: any[]) => any>(
    folders: string[],
    fn: T,
    ...args: Parameters<T>
) => {
    chokidar
        .watch(folders, {
            ignoreInitial: true
        })
        .on('all', async () => {
            await Promise.resolve(fn(...args))
        })
}

export const build = async (config: InlineConfig) => {
    await viteBuild({
        ...config,
        logLevel: 'error',
        build: { ssr: path.join(__dirname, 'default-edge-entry') }
    })
    await viteBuild({
        ...config,
        logLevel: 'error'
    })
}

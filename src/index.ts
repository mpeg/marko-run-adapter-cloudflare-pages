import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import baseAdapter, { type Adapter } from "@marko/run/adapter";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default function cfPagesAdapter(): Adapter {
    const { startDev } = baseAdapter();

    return {
        name: "cloudflare-pages-adapter",

        viteConfig(config) {
            if (config.build?.ssr) {
                return {
                    resolve: {
                        dedupe: ["marko"],
                        conditions: ["worker"],
                    },
                    ssr: {
                        target: "webworker",
                        noExternal: true,
                    },

                };
            }
        },

        getEntryFile() {
            return path.join(__dirname, "default-edge-entry");
        },

        startDev,

        async buildEnd(_, _routes, builtEntries) {
            const entry = builtEntries[0];
            const distDir = path.dirname(entry);
            await fs.rename(path.join(distDir, "index.mjs"), path.join(distDir, "_worker.js"))
            await fs.writeFile(path.join(distDir, "_routes.json"), JSON.stringify({
                "version": 1,
                "include": ["/*"],
                "exclude": ["/assets/*"]
            }))
        }
    }
}
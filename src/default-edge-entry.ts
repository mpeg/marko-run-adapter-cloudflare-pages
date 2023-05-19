import { fetch } from '@marko/run/router'
import type { Fetcher } from '@cloudflare/workers-types'

interface CloudflarePagesPlatform {
    ASSETS: Fetcher
}

export default {
    fetch: async function (request: Request, context: CloudflarePagesPlatform) {
        return await fetch<CloudflarePagesPlatform>(request, context)
    }
}

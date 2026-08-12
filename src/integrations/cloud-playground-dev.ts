import type { AstroIntegration } from 'astro'
import { mkdir, readdir, readFile, unlink, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'

const SAVE_PATH = '/__cloud_playground/save'
const LIST_PATH = '/__cloud_playground/list'
const DELETE_PATH = '/__cloud_playground/delete'
const GET_PATH = '/__cloud_playground/get'

const ID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function resolveSafeFile(dir: string, id: string): string | null {
  if (!ID_SLUG.test(id)) return null
  const file = path.resolve(dir, `${id}.json`)
  const normalizedDir = path.resolve(dir)
  if (!file.startsWith(normalizedDir + path.sep)) return null
  return file
}

function sendJson(res: import('http').ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'snapshot'
  )
}

/**
 * Dev-only Cloud Playground integration.
 * Adds Vite middleware to save/list/get/delete JSON snapshots under
 * src/content/data/scenes/playground/. No effect on static builds.
 */
export default function cloudPlaygroundDev(): AstroIntegration {
  return {
    name: 'cloud-playground-dev',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        const projectRoot = path.resolve(server.config.root || process.cwd())
        const dir = path.join(projectRoot, 'src', 'content', 'data', 'scenes', 'playground')

        logger.info(`Cloud Playground middleware ready → ${dir}`)

        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url || ''
          const urlObj = new URL(rawUrl, 'http://localhost')
          const url = urlObj.pathname

          if (
            url !== SAVE_PATH &&
            url !== LIST_PATH &&
            url !== DELETE_PATH &&
            url !== GET_PATH
          ) {
            next()
            return
          }

          try {
            await mkdir(dir, { recursive: true })

            if (url === LIST_PATH && req.method === 'GET') {
              const entries = await readdir(dir)
              const files = []
              for (const name of entries) {
                if (!name.endsWith('.json')) continue
                const full = path.join(dir, name)
                try {
                  const raw = await readFile(full, 'utf8')
                  const data = JSON.parse(raw) as Record<string, unknown>
                  const st = await stat(full)
                  files.push({
                    id: typeof data.id === 'string' ? data.id : name.replace(/\.json$/, ''),
                    name: typeof data.name === 'string' ? data.name : name,
                    pageId: typeof data.pageId === 'string' ? data.pageId : undefined,
                    sectionId: typeof data.sectionId === 'string' ? data.sectionId : undefined,
                    mtime: st.mtime.toISOString(),
                  })
                } catch {
                  // skip corrupt files
                }
              }
              sendJson(res, 200, { files })
              return
            }

            if (url === GET_PATH && req.method === 'GET') {
              const id = urlObj.searchParams.get('id') || ''
              const file = resolveSafeFile(dir, id)
              if (!file) {
                sendJson(res, 400, { ok: false, error: 'Invalid id' })
                return
              }
              try {
                const raw = await readFile(file, 'utf8')
                sendJson(res, 200, JSON.parse(raw))
              } catch (err) {
                const code = (err as NodeJS.ErrnoException).code
                if (code === 'ENOENT') {
                  sendJson(res, 404, { ok: false, error: 'Not found' })
                  return
                }
                throw err
              }
              return
            }

            if (url === DELETE_PATH && req.method === 'POST') {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}') as { id?: string }
              const id = typeof body.id === 'string' ? body.id : ''
              const file = resolveSafeFile(dir, id)
              if (!file) {
                sendJson(res, 400, { ok: false, error: 'Invalid id' })
                return
              }
              try {
                await unlink(file)
                sendJson(res, 200, { ok: true, id })
              } catch (err) {
                const code = (err as NodeJS.ErrnoException).code
                if (code === 'ENOENT') {
                  sendJson(res, 404, { ok: false, error: 'Not found' })
                  return
                }
                throw err
              }
              return
            }

            if (url === SAVE_PATH && req.method === 'POST') {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}') as Record<string, unknown>

              let id = typeof body.id === 'string' ? body.id.trim() : ''
              const name = typeof body.name === 'string' ? body.name.trim() : ''
              if (!name) {
                sendJson(res, 400, { ok: false, error: 'name is required' })
                return
              }
              if (!id) id = slugifyName(name)
              if (!ID_SLUG.test(id)) {
                sendJson(res, 400, { ok: false, error: 'id must be a lowercase slug (a-z0-9-)' })
                return
              }

              const file = resolveSafeFile(dir, id)
              if (!file) {
                sendJson(res, 400, { ok: false, error: 'Invalid id path' })
                return
              }

              const includeCamera = Boolean(body.includeCamera)
              const includeColors = Boolean(body.includeColors)

              const point = {
                id,
                name,
                pageId: typeof body.pageId === 'string' ? body.pageId : undefined,
                sectionId: typeof body.sectionId === 'string' ? body.sectionId : undefined,
                includeCamera,
                includeColors,
                ...(includeCamera && body.camera ? { camera: body.camera } : {}),
                ...(includeColors && body.clouds ? { clouds: body.clouds } : {}),
                ...(includeColors && body.lighting ? { lighting: body.lighting } : {}),
                createdAt:
                  typeof body.createdAt === 'string'
                    ? body.createdAt
                    : new Date().toISOString(),
              }

              await writeFile(file, `${JSON.stringify(point, null, 2)}\n`, 'utf8')
              logger.info(`Cloud Playground saved ${id}.json`)
              sendJson(res, 200, {
                ok: true,
                id,
                path: `src/content/data/scenes/playground/${id}.json`,
              })
              return
            }

            sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          } catch (err) {
            logger.error(`Cloud Playground middleware error: ${String(err)}`)
            sendJson(res, 500, { ok: false, error: String(err) })
          }
        })
      },
    },
  }
}

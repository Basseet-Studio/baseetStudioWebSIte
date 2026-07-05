/** Cloudscape runtime debug — logs + on-screen panel. Enabled in dev or ?sceneDebug=1 */

const LOG_MAX = 48
const logs: string[] = []

export interface SceneDebugSnapshot {
  progress: number
  anchorId: string | null
  camera: { position: number[]; target: number[]; fov: number }
  clouds: { density?: number; skyColor?: string }
  objects: Array<{ id: string; loaded: boolean; visible: boolean }>
  fps?: number
  frame?: number
}

let lastPanelUpdate = 0
const PANEL_THROTTLE_MS = 100

export function isSceneDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (import.meta.env.DEV) return true
  if (new URLSearchParams(location.search).has('sceneDebug')) return true
  try {
    return localStorage.getItem('baseet:scene:debug') === '1'
  } catch {
    return false
  }
}

export function sceneLog(category: string, message: string, data?: unknown): void {
  if (!isSceneDebugEnabled()) return
  const stamp = new Date().toISOString().slice(11, 19)
  const line = `${stamp} [${category}] ${message}`
  logs.push(line)
  if (logs.length > LOG_MAX) logs.shift()
  if (data !== undefined) {
    console.log(`[cloudscape] ${line}`, data)
  } else {
    console.log(`[cloudscape] ${line}`)
  }
  flushLogPanel()
}

export function sceneWarn(category: string, message: string, data?: unknown): void {
  if (!isSceneDebugEnabled()) return
  const stamp = new Date().toISOString().slice(11, 19)
  const line = `${stamp} [${category}] ${message}`
  logs.push(line)
  if (logs.length > LOG_MAX) logs.shift()
  console.warn(`[cloudscape] ${line}`, data ?? '')
  flushLogPanel()
}

function flushLogPanel(): void {
  const el = document.getElementById('scene-debug-log')
  if (!el) return
  el.textContent = logs.slice(-12).join('\n')
}

export function showSceneDebugPanel(): void {
  const root = document.getElementById('scene-debug')
  if (root) root.hidden = false
}

export function updateSceneDebugPanel(snapshot: SceneDebugSnapshot): void {
  if (!isSceneDebugEnabled()) return
  const now = performance.now()
  if (now - lastPanelUpdate < PANEL_THROTTLE_MS) return
  lastPanelUpdate = now

  showSceneDebugPanel()

  const set = (sel: string, text: string) => {
    const el = document.querySelector(`[data-scene-${sel}]`)
    if (el) el.textContent = text
  }

  set('progress', (snapshot.progress * 100).toFixed(1))
  set('anchor', snapshot.anchorId || '—')
  set('cam-z', snapshot.camera.position[2]?.toFixed(2) ?? '—')
  set(
    'cam-pos',
    snapshot.camera.position.map((n) => n.toFixed(1)).join(', '),
  )
  set('density', String(snapshot.clouds.density ?? '—'))
  set(
    'objects',
    snapshot.objects.length
      ? snapshot.objects.map((o) => `${o.id}:${o.loaded ? 'L' : 'l'}${o.visible ? 'V' : 'v'}`).join(' ')
      : 'none',
  )
  if (snapshot.fps !== undefined) set('fps', snapshot.fps.toFixed(0))

  const win = window as Window & { __baseetScene?: SceneDebugSnapshot }
  win.__baseetScene = snapshot

  if (snapshot.anchorId) {
    document.querySelectorAll('[data-scroll-anchor]').forEach((el) => {
      el.classList.toggle(
        'is-active-anchor',
        el.getAttribute('data-scroll-anchor') === snapshot.anchorId,
      )
    })
  }
}

export function logShaderInfo(material: { vertexShader: string; fragmentShader: string }): void {
  sceneLog('shader', `vertex ${material.vertexShader.length}b, fragment ${material.fragmentShader.length}b`)
}

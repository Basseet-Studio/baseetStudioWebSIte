import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type * as THREE from 'three'
import type { CloudDepth, ObjectCommands, SceneObject, ScrollAnchor } from './types'
import { sceneLog, sceneWarn } from './scene-debug'

export const WORLD_SCALE = 0.4
const MAX_CONCURRENT_LOADS = 2

interface RegistryEntry {
  config: SceneObject
  loaded: boolean
  loading: boolean
  group: THREE.Group | null
}

export interface ObjectRegistry {
  registerAll: (objects?: SceneObject[]) => void
  unloadWhere: (predicate: (obj: SceneObject) => boolean) => void
  queuePreload: (objects?: SceneObject[]) => void
  queueLoad: (id: string) => void
  onScrollProgress: (progress: number) => void
  applyVisibility: (commands?: ObjectCommands) => void
  setAnchorIndex: (anchors?: ScrollAnchor[]) => void
  all: () => SceneObject[]
  getParentGroup: () => THREE.Group
  getDebugEntries: () => Array<{ id: string; loaded: boolean; visible: boolean }>
  getGroupsByDepth: () => { behind: THREE.Group[]; middle: THREE.Group[]; in_front: THREE.Group[] }
  setModelsVisibleForDepthPass: (pass: CloudDepth | 'all') => void
}

export function createObjectRegistry(deps: {
  THREE: typeof THREE
  GLTFLoader: typeof GLTFLoader
  parentGroup: THREE.Group
}): ObjectRegistry {
  const entries = new Map<string, RegistryEntry>()
  let loadQueue: string[] = []
  let activeLoads = 0
  let anchorsById = new Map<string, number>()

  function setAnchorIndex(anchors?: ScrollAnchor[]): void {
    anchorsById = new Map()
    for (const a of anchors || []) {
      anchorsById.set(a.id, a.atScrollProgress)
    }
  }

  function registerAll(objects?: SceneObject[]): void {
    for (const obj of objects || []) {
      if (!entries.has(obj.id)) {
        entries.set(obj.id, {
          config: obj,
          loaded: false,
          loading: false,
          group: null,
        })
      } else {
        entries.get(obj.id)!.config = obj
      }
    }
  }

  function disposeEntry(entry: RegistryEntry): void {
    if (!entry.group) return
    entry.group.parent?.remove(entry.group)
    entry.group.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m?.dispose())
      }
    })
    entry.group = null
    entry.loaded = false
    entry.loading = false
  }

  function unloadWhere(predicate: (obj: SceneObject) => boolean): void {
    for (const [id, entry] of entries) {
      if (!predicate(entry.config)) continue
      disposeEntry(entry)
      entries.delete(id)
    }
  }

  function queueLoad(id: string): void {
    const entry = entries.get(id)
    if (!entry || entry.loaded || entry.loading) return
    loadQueue.push(id)
    drainQueue()
  }

  function drainQueue(): void {
    while (activeLoads < MAX_CONCURRENT_LOADS && loadQueue.length > 0) {
      const id = loadQueue.shift()!
      loadOne(id)
    }
  }

  function loadOne(id: string): void {
    const entry = entries.get(id)
    if (!entry || entry.loaded || entry.loading) return

    entry.loading = true
    activeLoads += 1

    const wrapper = new deps.THREE.Group()
    wrapper.name = id
    wrapper.visible = false
    wrapper.userData.cloudDepth = entry.config.cloudDepth
    wrapper.userData._scrollVisible = false
    deps.parentGroup.add(wrapper)
    entry.group = wrapper

    const loader = new deps.GLTFLoader()
    loader.load(
      entry.config.url,
      (gltf) => {
        const cfg = entry.config
        const scene = gltf.scene
        if (cfg.normalize !== false) {
          const box = new deps.THREE.Box3().setFromObject(scene)
          const size = new deps.THREE.Vector3()
          box.getSize(size)
          const longest = Math.max(size.x, size.y, size.z, 0.0001)
          const normalizeScale = 2 / longest
          const center = new deps.THREE.Vector3()
          box.getCenter(center)
          scene.position.sub(center)
          const inner = new deps.THREE.Group()
          inner.add(scene)
          inner.scale.setScalar(normalizeScale)
          wrapper.add(inner)
        } else {
          wrapper.add(scene)
        }

        applyTransform(wrapper, cfg.transform)
        entry.loaded = true
        entry.loading = false
        activeLoads -= 1
        sceneLog('object', `loaded ${id} scale=${cfg.transform.scale}`)
        drainQueue()
      },
      undefined,
      (err) => {
        sceneWarn('object', `failed ${id}`, err)
        entry.loading = false
        activeLoads -= 1
        drainQueue()
      },
    )
  }

  function applyTransform(
    group: THREE.Group,
    transform: SceneObject['transform'],
  ): void {
    if (!transform) return
    const p = transform.position || [0, 0, 0]
    group.position.set(p[0], p[1], p[2])
    group.rotation.y = ((transform.rotationY || 0) * Math.PI) / 180
    group.scale.setScalar(transform.scale ?? 1)
  }

  function maybeTriggerLoad(entry: RegistryEntry, progress: number): void {
    const loadAt = entry.config.loadAt
    if (!loadAt || entry.loaded || entry.loading) return

    if (loadAt.type === 'progress' && typeof loadAt.at === 'number') {
      if (progress >= loadAt.at - (loadAt.preloadMargin || 0)) {
        queueLoad(entry.config.id)
      }
    }

    if (loadAt.type === 'anchor' && loadAt.anchorId) {
      const anchorP = anchorsById.get(loadAt.anchorId)
      if (anchorP === undefined) return
      const margin = loadAt.preloadMargin || 0
      if (loadAt.when === 'enter' && progress >= anchorP - margin) {
        queueLoad(entry.config.id)
      }
    }
  }

  function readCloudDepth(value: unknown): CloudDepth {
    if (value === 'behind' || value === 'middle' || value === 'in_front') return value
    return 'in_front'
  }

  function getGroupsByDepth(): {
    behind: THREE.Group[]
    middle: THREE.Group[]
    in_front: THREE.Group[]
  } {
    const behind: THREE.Group[] = []
    const middle: THREE.Group[] = []
    const in_front: THREE.Group[] = []

    for (const entry of entries.values()) {
      if (!entry.group || !entry.loaded) continue
      const depth = readCloudDepth(entry.group.userData.cloudDepth)
      if (depth === 'behind') behind.push(entry.group)
      else if (depth === 'middle') middle.push(entry.group)
      else in_front.push(entry.group)
    }

    return { behind, middle, in_front }
  }

  function setModelsVisibleForDepthPass(pass: CloudDepth | 'all'): void {
    for (const entry of entries.values()) {
      if (!entry.group) continue

      const scrollVisible = entry.group.userData._scrollVisible !== false
      const depth = readCloudDepth(entry.group.userData.cloudDepth)

      if (!scrollVisible) {
        entry.group.visible = false
        continue
      }

      if (pass === 'all') {
        entry.group.visible = true
        continue
      }

      entry.group.visible = depth === pass
    }
  }

  return {
    registerAll,
    unloadWhere,
    queuePreload(objects?: SceneObject[]) {
      registerAll(objects)
      for (const obj of objects || []) {
        if (obj.preload) queueLoad(obj.id)
      }
    },
    queueLoad,
    onScrollProgress(progress: number) {
      for (const entry of entries.values()) {
        maybeTriggerLoad(entry, progress)
      }
    },
    applyVisibility(commands?: ObjectCommands) {
      const show = new Set(commands?.show || [])
      const hide = new Set(commands?.hide || [])

      for (const [id, entry] of entries) {
        if (hide.has(id)) {
          if (entry.group) {
            entry.group.visible = false
            entry.group.userData._scrollVisible = false
          }
          continue
        }
        if (show.has(id)) {
          if (!entry.loaded && !entry.loading) queueLoad(id)
          if (entry.group) {
            entry.group.visible = true
            entry.group.userData._scrollVisible = true
          }
          continue
        }
        // Hide page-scoped objects when not explicitly shown (scroll-up fix)
        if (entry.group && entry.config.scope === 'page') {
          entry.group.visible = false
          entry.group.userData._scrollVisible = false
        }
      }
    },
    setAnchorIndex,
    all: () => [...entries.values()].map((e) => e.config),
    getParentGroup: () => deps.parentGroup,
    getDebugEntries: () =>
      [...entries.entries()].map(([id, e]) => ({
        id,
        loaded: e.loaded,
        visible: e.group?.visible ?? false,
      })),
    getGroupsByDepth,
    setModelsVisibleForDepthPass,
  }
}

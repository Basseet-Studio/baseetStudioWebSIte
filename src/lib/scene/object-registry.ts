import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type * as THREE from 'three'
import type {
  CloudDepth,
  ObjectCommands,
  ObjectTransform,
  SceneObject,
  ScrollAnchor,
} from './types'
import { sceneLog, sceneWarn } from './scene-debug'

export const WORLD_SCALE = 0.4

const MAX_CONCURRENT_LOADS = 2

interface RegistryEntry {
  config: SceneObject
  loaded: boolean
  loading: boolean
  group: THREE.Group | null
  /** Dev/playground override: render regardless of scroll anchor commands. */
  forceVisible: boolean
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
  /** Playground: read / live-edit an object's transform. */
  getTransform: (id: string) => ObjectTransform | null
  setTransform: (id: string, transform: Partial<ObjectTransform>) => void
  /** Playground: force an object visible (and loaded) regardless of scroll. */
  setForceVisible: (id: string, force: boolean) => void
  setNightAmount: (amount: number) => void
}

export function createObjectRegistry(deps: {
  THREE: typeof THREE
  GLTFLoader: typeof GLTFLoader
  parentGroup: THREE.Group
}): ObjectRegistry {
  const entries = new Map<string, RegistryEntry>()
  // BASEET_SCENE_MOBILE_V1
  const nightMaterials = new Map<THREE.MeshStandardMaterial, { color: THREE.Color; intensity: number }>()
  const nightAccentColor = new deps.THREE.Color('#ffd49a')
  let previousNight = -1
  function setNightAmount(amount: number): void {
    const night = Math.max(0, Math.min(1, amount))
    if (Math.abs(night - previousNight) < 0.01) return
    previousNight = night
    for (const [mat, base] of nightMaterials) {
      if (mat.emissiveMap) mat.emissive.copy(nightAccentColor)
      else mat.emissive.copy(base.color).lerp(nightAccentColor, night * 0.8)
      mat.emissiveIntensity = mat.emissiveMap ? night * 3.2 : base.intensity + night * 0.55
    }
  }
  let loadQueue: string[] = []
  let activeLoads = 0
  let anchorsById = new Map<string, number>()
  // Ids shown by the most recent applyVisibility() — so models that finish
  // loading after the scroll command still appear without needing a scroll.
  let lastShown = new Set<string>()

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
          forceVisible: false,
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
        mats.forEach((m) => { nightMaterials.delete(m as THREE.MeshStandardMaterial); m?.dispose() })
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
    if (loadQueue.includes(id)) return
    loadQueue.push(id)
    drainQueue()
  }

  function drainQueue(): void {
    while (activeLoads < MAX_CONCURRENT_LOADS && loadQueue.length > 0) {
      const id = loadQueue.shift()!
      loadOne(id)
    }
  }

  /** Softer glass, sharper textures at grazing angles. */
  function tuneMaterials(root: THREE.Object3D): void {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial
        const materialName = `${mesh.name} ${mat.name}`.toLowerCase()
          const facade = /window|glass|glazing|lantern|amber|globe|accent/.test(materialName)
          const ground = /ground|terrain|water|sea|ocean|mountain|landscape/.test(materialName)
          if (std.emissive && facade && !ground && !std.emissiveMap && std.map) {
            // BASEET_V3: fallback window mask for legacy GLBs.
            const canvas = document.createElement('canvas')
            canvas.width = 256; canvas.height = 256
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 256, 256)
              ctx.fillStyle = '#ffbc66'
              for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 12; col++) {
                  if (((row * 17 + col * 13) % 11) < 5) {
                    ctx.fillRect(col * 256 / 12 + 2, row * 32 + 5, 16, 21)
                  }
                }
              }
              const tex = new deps.THREE.CanvasTexture(canvas)
              tex.colorSpace = deps.THREE.SRGBColorSpace
              tex.wrapS = std.map.wrapS; tex.wrapT = std.map.wrapT
              tex.repeat.copy(std.map.repeat); tex.offset.copy(std.map.offset)
              tex.flipY = std.map.flipY
              std.emissiveMap = tex
              std.needsUpdate = true
            }
          }
          if (std.emissive && facade && !ground && !nightMaterials.has(std)) {
            nightMaterials.set(std, { color: std.emissive.clone(), intensity: std.emissiveIntensity ?? 1 })
            previousNight = -1
          }
          if (typeof std.metalness === 'number') std.metalness = Math.min(std.metalness, 0.25)
        if (typeof std.envMapIntensity === 'number') std.envMapIntensity = 0.45
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap'] as const) {
          const tex = (std as unknown as Record<string, THREE.Texture | null | undefined>)[key]
          if (tex) {
            tex.anisotropy = typeof window !== 'undefined' && (window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches) ? 2 : 8
            tex.needsUpdate = true
          }
        }
      }
    })
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
    wrapper.userData._scrollVisible = lastShown.has(id)
    deps.parentGroup.add(wrapper)
    entry.group = wrapper

    const loader = new deps.GLTFLoader()
    loader.load(
      typeof window !== 'undefined' && window.innerWidth <= 768 &&
        /(?:dubai|petronas)-skyline\.glb/.test(entry.config.url)
        ? entry.config.url.replace('-skyline.glb', '-skyline-mobile.glb')
        : entry.config.url,
      (gltf) => {
        const cfg = entry.config
        const scene = gltf.scene
        // BASEET_V2: terrain must not determine landmark scale or centering.
        scene.updateMatrixWorld(true)
        const landmarkBox = new deps.THREE.Box3()
        const referenceNames = id === 'petronas-skyline'
          ? /^(PetronasTower[12]|PetronasDetail)/i
          : id === 'dubai-skyline' ? /^(BurjKhalifa|BurjDetail)/i
          : /Kingdom|Faisaliah/i
        scene.traverse((node) => {
          if ((node as THREE.Mesh).isMesh && referenceNames.test(node.name)) {
            landmarkBox.union(new deps.THREE.Box3().setFromObject(node))
          }
        })
        const box = landmarkBox.isEmpty()
          ? new deps.THREE.Box3().setFromObject(scene) : landmarkBox
        const size = new deps.THREE.Vector3()
        box.getSize(size)
        const center = new deps.THREE.Vector3()
        box.getCenter(center)

        if (cfg.fitHeight === true) {
          // Height -> 2 units (x scale), base on the origin, centred in XZ.
          scene.position.x -= center.x
          scene.position.y -= box.min.y
          scene.position.z -= center.z
          const inner = new deps.THREE.Group()
          inner.add(scene)
          inner.scale.setScalar(2 / Math.max(size.y, 0.0001))
          wrapper.add(inner)
          const h = 2 * (cfg.transform.scale ?? 1) * WORLD_SCALE
          const k = h / Math.max(size.y, 0.0001)
          sceneLog(
            'object',
            `${id} world h=${h.toFixed(0)} w=${(size.x * k).toFixed(0)} d=${(size.z * k).toFixed(0)}`,
          )
        } else if (cfg.normalize !== false) {
          const longest = Math.max(size.x, size.y, size.z, 0.0001)
          scene.position.sub(center)
          const inner = new deps.THREE.Group()
          inner.add(scene)
          inner.scale.setScalar(2 / longest)
          wrapper.add(inner)
        } else {
          wrapper.add(scene)
        }

        tuneMaterials(scene)
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

  function applyTransform(group: THREE.Group, transform: SceneObject['transform']): void {
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
      const shown = entry.forceVisible || entry.group.userData._scrollVisible !== false
      if (!shown) continue
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
      const scrollVisible = entry.forceVisible || entry.group.userData._scrollVisible !== false
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

  function getTransform(id: string): ObjectTransform | null {
    const entry = entries.get(id)
    if (!entry) return null
    const t = entry.config.transform
    return {
      position: [...(t?.position || [0, 0, 0])] as [number, number, number],
      rotationY: t?.rotationY ?? 0,
      scale: t?.scale ?? 1,
    }
  }

  function setTransform(id: string, partial: Partial<ObjectTransform>): void {
    const entry = entries.get(id)
    if (!entry) return
    const current = getTransform(id)!
    const next: ObjectTransform = {
      position: (partial.position ?? current.position) as [number, number, number],
      rotationY: partial.rotationY ?? current.rotationY,
      scale: partial.scale ?? current.scale,
    }
    entry.config = { ...entry.config, transform: next }
    if (entry.group) applyTransform(entry.group, next)
  }

  function setForceVisible(id: string, force: boolean): void {
    const entry = entries.get(id)
    if (!entry) return
    entry.forceVisible = force
    if (force) queueLoad(id)
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
      lastShown = new Set([...show].filter((id) => !hide.has(id)))
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
    getTransform,
    setTransform,      setForceVisible,
      setNightAmount,
  }
}

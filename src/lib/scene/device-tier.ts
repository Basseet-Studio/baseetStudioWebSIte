export type DeviceTier = 'low' | 'medium' | 'high'

export interface CloudQualityPreset {
  tier: DeviceTier
  antialias: boolean
  renderScale: number
  renderScaleSteps: readonly number[]
  targetFps: number
  skipObjects: boolean
  shaderQuality: number
  lowFpsMs: number
  highFpsMs: number
}

interface NetworkInformation {
  saveData?: boolean
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function resolveDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high'
  const width = window.innerWidth
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 8
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  const saveData = Boolean(connection?.saveData)

  if (width < 720 || coarse || saveData || cores <= 4) return 'low'
  if (width < 1024) return 'medium'
  return 'high'
}

export function shouldSkipCloudscape(): boolean {
  return prefersReducedMotion() || !hasWebGL()
}

export function isLowPowerDevice(): boolean {
  return resolveDeviceTier() === 'low'
}

export function cloudQualityForTier(tier: DeviceTier = resolveDeviceTier()): CloudQualityPreset {
  if (tier === 'low') {
    return {
      tier,
      antialias: false,
      renderScale: 0.4,
      renderScaleSteps: [0.32, 0.4, 0.48],
      targetFps: 30,
      skipObjects: true,
      shaderQuality: 0.28,
      lowFpsMs: 1000,
      highFpsMs: 5000,
    }
  }
  if (tier === 'medium') {
    return {
      tier,
      antialias: false,
      renderScale: 0.55,
      renderScaleSteps: [0.45, 0.55, 0.65],
      targetFps: 45,
      skipObjects: true,
      shaderQuality: 0.48,
      lowFpsMs: 1000,
      highFpsMs: 5000,
    }
  }
  return {
    tier,
    antialias: true,
    renderScale: 1,
    renderScaleSteps: [0.75, 0.85, 1],
    targetFps: 60,
    skipObjects: false,
    shaderQuality: 1,
    lowFpsMs: 1000,
    highFpsMs: 5000,
  }
}

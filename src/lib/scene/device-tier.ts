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
      renderScale: 0.32,
      renderScaleSteps: [0.24, 0.28, 0.32],
      targetFps: 30,
      skipObjects: false,
      shaderQuality: 0.24,
      lowFpsMs: 1000,
      highFpsMs: 5000,
    }
  }
  if (tier === 'medium') {
    return {
      tier,
      antialias: false,
      renderScale: 0.45,
      renderScaleSteps: [0.34, 0.4, 0.45],
      targetFps: 30,
      skipObjects: false,
      shaderQuality: 0.48,
      lowFpsMs: 1000,
      highFpsMs: 5000,
    }
  }
  return {
    tier,
    antialias: true,
    renderScale: 0.85,
    renderScaleSteps: [0.6, 0.72, 0.85],
    targetFps: 60,
    skipObjects: false,
    shaderQuality: 1,
    lowFpsMs: 1000,
    highFpsMs: 5000,
  }
}

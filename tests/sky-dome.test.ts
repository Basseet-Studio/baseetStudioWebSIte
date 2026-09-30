import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  blendForHour,
  blendSkyLighting,
  directionToEquirectUv,
  equirectUvToDirection,
  worldDirFromTexDir,
  wrapHour,
  type SkyDomeVariant,
  type SkyLightingSample,
} from '../src/lib/scene/sky-dome-blend.ts'

const variants: SkyDomeVariant[] = [
  { id: 'sky-night-dark', hour: 0, placeholder: 'n-lo', full: 'n' },
  { id: 'sky-day-light', hour: 14, placeholder: 'd-lo', full: 'd' },
  { id: 'sky-day-dark', hour: 19, placeholder: 'e-lo', full: 'e' },
  { id: 'sky-night-light', hour: 21, placeholder: 'k-lo', full: 'k' },
]

/** Six period slots as written by scripts/skyscapes-process.mjs. */
const periodVariants: SkyDomeVariant[] = [
  { id: 'sky-night', hour: 0, placeholder: 'night-lo', full: 'night' },
  { id: 'sky-dawn', hour: 4.5, placeholder: 'dawn-lo', full: 'dawn' },
  { id: 'sky-morning', hour: 8, placeholder: 'morning-lo', full: 'morning' },
  { id: 'sky-day', hour: 14, placeholder: 'day-lo', full: 'day' },
  { id: 'sky-evening', hour: 19, placeholder: 'evening-lo', full: 'evening' },
  { id: 'sky-dusk', hour: 21, placeholder: 'dusk-lo', full: 'dusk' },
]

describe('wrapHour', () => {
  it('wraps 24 to 0 and negatives into 0–24', () => {
    assert.equal(wrapHour(24), 0)
    assert.equal(wrapHour(25.5), 1.5)
    assert.equal(wrapHour(-1), 23)
  })
})

describe('blendForHour', () => {
  it('returns null for an empty set', () => {
    assert.equal(blendForHour([], 12), null)
  })

  it('stays on a single variant', () => {
    const blend = blendForHour(variants.slice(0, 1), 14)
    assert.equal(blend?.a.id, 'sky-night-dark')
    assert.equal(blend?.b.id, 'sky-night-dark')
    assert.equal(blend?.t, 0)
  })

  it('starts a variant at its anchor hour (no hard cut from the previous)', () => {
    const blend = blendForHour(variants, 14)
    assert.equal(blend?.a.id, 'sky-day-light')
    assert.equal(blend?.b.id, 'sky-day-dark')
    assert.equal(blend?.t, 0)
  })

  it('lerps across dusk toward night rather than jumping', () => {
    const blend = blendForHour(variants, 20)
    assert.equal(blend?.a.id, 'sky-day-dark')
    assert.equal(blend?.b.id, 'sky-night-light')
    assert.ok(Math.abs((blend?.t ?? -1) - 0.5) < 1e-6)
  })

  it('wraps night-light into night-dark across midnight', () => {
    const blend = blendForHour(variants, 22.5)
    assert.equal(blend?.a.id, 'sky-night-light')
    assert.equal(blend?.b.id, 'sky-night-dark')
    assert.ok(Math.abs((blend?.t ?? -1) - 0.5) < 1e-6)
  })

  it('leans toward day-dark / night-light around evening', () => {
    const blend = blendForHour(variants, 19.6)
    assert.equal(blend?.a.id, 'sky-day-dark')
    assert.equal(blend?.b.id, 'sky-night-light')
    assert.ok((blend?.t ?? 0) > 0 && (blend?.t ?? 1) < 1)
  })
})

describe('blendForHour (six period slots)', () => {
  it('lands exactly on each anchor hour', () => {
    for (const variant of periodVariants) {
      const blend = blendForHour(periodVariants, variant.hour)
      assert.equal(blend?.a.id, variant.id, `hour ${variant.hour}`)
      assert.equal(blend?.t, 0, `hour ${variant.hour}`)
    }
  })

  it('blends morning into day halfway at hour 11', () => {
    const blend = blendForHour(periodVariants, 11)
    assert.equal(blend?.a.id, 'sky-morning')
    assert.equal(blend?.b.id, 'sky-day')
    assert.ok(Math.abs((blend?.t ?? -1) - 0.5) < 1e-6)
  })

  it('wraps dusk into night across midnight', () => {
    const blend = blendForHour(periodVariants, 23)
    assert.equal(blend?.a.id, 'sky-dusk')
    assert.equal(blend?.b.id, 'sky-night')
    assert.ok(Math.abs((blend?.t ?? -1) - 2 / 3) < 1e-6)
  })

  it('blends night into dawn in the early morning', () => {
    const blend = blendForHour(periodVariants, 2)
    assert.equal(blend?.a.id, 'sky-night')
    assert.equal(blend?.b.id, 'sky-dawn')
    assert.ok(Math.abs((blend?.t ?? -1) - 2 / 4.5) < 1e-6)
  })
})

describe('equirect mapping', () => {
  it('round-trips u/v through direction and back', () => {
    const samples: Array<[number, number]> = [
      [0.5, 0.5],
      [0.0, 0.5],
      [0.25, 0.4],
      [0.75, 0.3],
      [0.1, 0.62],
      [0.9, 0.45],
    ]
    for (const [u, v] of samples) {
      const d = equirectUvToDirection(u, v)
      const len = Math.hypot(d[0], d[1], d[2])
      assert.ok(Math.abs(len - 1) < 1e-9, `unit direction for u=${u} v=${v}`)
      const back = directionToEquirectUv(d)
      assert.ok(Math.abs(back.u - u) < 1e-9 || Math.abs(Math.abs(back.u - u) - 1) < 1e-9, `u for ${u}`)
      assert.ok(Math.abs(back.v - v) < 1e-9, `v for ${v}`)
    }
  })

  it('maps the horizon band to near-horizontal directions', () => {
    const d = equirectUvToDirection(0.5, 0.51)
    assert.ok(Math.abs(d[1]) < 0.04)
    assert.ok(d[1] > 0)
  })
})

describe('worldDirFromTexDir', () => {
  it('is the identity at yaw 0', () => {
    const d: [number, number, number] = [0.3, 0.5, 0.8]
    const world = worldDirFromTexDir(d, 0)
    assert.deepEqual(world, d)
  })

  it('inverts the shader yaw rotation', () => {
    // GLSL: d = vec3(rd.x*cy - rd.z*sy, rd.y, rd.x*sy + rd.z*cy)
    const yaw = 1.23
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    const tex: [number, number, number] = [0.2, 0.6, -0.77]
    const world = worldDirFromTexDir(tex, yaw)
    const roundTrip: [number, number, number] = [
      world[0] * cy - world[2] * sy,
      world[1],
      world[0] * sy + world[2] * cy,
    ]
    for (let i = 0; i < 3; i++) {
      assert.ok(Math.abs(roundTrip[i] - tex[i]) < 1e-9, `axis ${i}`)
    }
  })
})

describe('blendSkyLighting', () => {
  const a: SkyLightingSample = {
    sunDir: [1, 0, 0],
    sunColor: [1, 0.9, 0.8],
    zenith: [0.2, 0.4, 0.9],
    horizon: [0.7, 0.8, 0.9],
    sunStrength: 0.8,
  }
  const b: SkyLightingSample = {
    sunDir: [0, 0, 1],
    sunColor: [0.5, 0.6, 1],
    zenith: [0.05, 0.08, 0.25],
    horizon: [0.3, 0.35, 0.5],
    sunStrength: 0.2,
  }

  const channels: Array<keyof Omit<SkyLightingSample, 'sunDir' | 'sunStrength'>> = [
    'sunColor',
    'zenith',
    'horizon',
  ]

  function expectClose(
    actual: SkyLightingSample,
    expected: SkyLightingSample,
    label: string,
  ) {
    for (const key of channels) {
      for (let i = 0; i < 3; i++) {
        assert.ok(
          Math.abs(actual[key][i] - expected[key][i]) < 1e-9,
          `${label} ${key}[${i}]`,
        )
      }
    }
    assert.ok(Math.abs(actual.sunStrength - expected.sunStrength) < 1e-9, `${label} strength`)
    for (let i = 0; i < 3; i++) {
      assert.ok(
        Math.abs(actual.sunDir[i] - expected.sunDir[i]) < 1e-9,
        `${label} sunDir[${i}]`,
      )
    }
  }

  it('returns a unchanged at t=0 and b at t=1', () => {
    expectClose(blendSkyLighting(a, b, 0), a, 't=0')
    expectClose(blendSkyLighting(a, b, 1), b, 't=1')
  })

  it('returns the same object when both slots share a sample', () => {
    assert.equal(blendSkyLighting(a, a, 0.5), a)
  })

  it('lerps colors, strength and sun direction at t=0.5', () => {
    const mid = blendSkyLighting(a, b, 0.5)
    for (const key of channels) {
      for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(mid[key][i] - (a[key][i] + b[key][i]) / 2) < 1e-9, key)
      }
    }
    assert.ok(Math.abs(mid.sunStrength - 0.5) < 1e-9)
    // (1,0,0) -> (0,0,1) midpoint normalized: 1/sqrt(2) each in x/z
    assert.ok(Math.abs(mid.sunDir[0] - Math.SQRT1_2) < 1e-9)
    assert.ok(Math.abs(mid.sunDir[2] - Math.SQRT1_2) < 1e-9)
    assert.ok(Math.abs(mid.sunDir[1]) < 1e-9)
  })

  it('clamps t outside 0–1', () => {
    expectClose(blendSkyLighting(a, b, -1), a, 't=-1')
    expectClose(blendSkyLighting(a, b, 2), b, 't=2')
  })
})

import type { CameraPose, SceneConfig } from '../../../lib/scene/types'
import { buildOrbitScene, type OrbitShot } from './world'

/**
 * Every page is a slice of the orbit around the visitor's landmark
 * (see world.ts). start / mid / end per page; edit a row to tune.
 *
 * Each page has ONE signature move at its mid point, alternating:
 *   services  rise ABOVE the top carpet, towers spearing through it
 *   projects  dive UNDER the mid deck
 *   clients   rise above the top carpet
 *   contact   dive under the mid deck
 * Heights stay out of the carpets (see world.ts) at the anchors themselves.
 */
function three(pageId: string, rows: Array<Omit<OrbitShot, 'id' | 'at'>>): OrbitShot[] {
  const ids = ['start', 'mid', 'end']
  const at = [0, 0.5, 1]
  return rows.map((r, i) => ({ ...r, id: `${pageId}-${ids[i]}`, at: at[i] }))
}

export const SERVICES_SHOTS = three('services', [
  { angle: 70, radius: 74, height: 9, lookY: 13, fov: 48 },
  { angle: 100, radius: 62, height: 21, lookY: 12, fov: 54 },
  { angle: 130, radius: 68, height: 8, lookY: 12, fov: 50 },
])

export const PROJECTS_SHOTS = three('projects', [
  { angle: 140, radius: 76, height: 7, lookY: 14, fov: 48 },
  { angle: 170, radius: 56, height: -6, lookY: 10, fov: 58 },
  { angle: 200, radius: 70, height: 9, lookY: 10, fov: 50 },
])

export const CLIENTS_SHOTS = three('clients', [
  { angle: 210, radius: 72, height: 8, lookY: 13, fov: 48 },
  { angle: 235, radius: 60, height: 20, lookY: 14, fov: 54 },
  { angle: 260, radius: 70, height: 7, lookY: 10, fov: 50 },
])

export const CONTACT_SHOTS = three('contact', [
  { angle: 270, radius: 74, height: 9, lookY: 12, fov: 48 },
  { angle: 290, radius: 58, height: -5, lookY: 12, fov: 56 },
  { angle: 310, radius: 72, height: 8, lookY: 12, fov: 50 },
])

export const DEFAULT_SHOTS = three('default', [
  { angle: 320, radius: 76, height: 8, lookY: 12, fov: 48 },
  { angle: 335, radius: 66, height: 10, lookY: 15, fov: 52 },
  { angle: 350, radius: 78, height: 9, lookY: 10, fov: 48 },
])

export const servicesSceneConfig: SceneConfig = buildOrbitScene('services', SERVICES_SHOTS)
export const projectsSceneConfig: SceneConfig = buildOrbitScene('projects', PROJECTS_SHOTS)
export const clientsSceneConfig: SceneConfig = buildOrbitScene('clients', CLIENTS_SHOTS)
export const contactSceneConfig: SceneConfig = buildOrbitScene('contact', CONTACT_SHOTS)
export const defaultThreeAnchorSceneConfig: SceneConfig = buildOrbitScene('default', DEFAULT_SHOTS)

// Kept for any old imports.
const cam = (c: SceneConfig, i: number): CameraPose => c.scrollAnchors[i].camera
export const servicesStartCamera = cam(servicesSceneConfig, 0)
export const servicesMidCamera = cam(servicesSceneConfig, 1)
export const servicesEndCamera = cam(servicesSceneConfig, 2)
export const clientsStartCamera = cam(clientsSceneConfig, 0)
export const clientsMidCamera = cam(clientsSceneConfig, 1)
export const clientsEndCamera = cam(clientsSceneConfig, 2)
export const contactStartCamera = cam(contactSceneConfig, 0)
export const contactMidCamera = cam(contactSceneConfig, 1)
export const contactEndCamera = cam(contactSceneConfig, 2)
export const projectsStartCamera = cam(projectsSceneConfig, 0)
export const projectsMidCamera = cam(projectsSceneConfig, 1)
export const projectsEndCamera = cam(projectsSceneConfig, 2)
export const defaultStartCamera = cam(defaultThreeAnchorSceneConfig, 0)
export const defaultMidCamera = cam(defaultThreeAnchorSceneConfig, 1)
export const defaultEndCamera = cam(defaultThreeAnchorSceneConfig, 2)

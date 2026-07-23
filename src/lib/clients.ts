// src/lib/clients.ts — locale-aware client data with EN fallback.
import type { Client, ClientsData, Lang } from '../types'
import { loadLocaleJson } from './content'
import { DEFAULT_LOCALE } from './locale'
import { getProject } from './projects'

export function getClientsData(lang: Lang = DEFAULT_LOCALE): ClientsData {
  return loadLocaleJson<ClientsData>(lang, 'clients.json')
}

export function getAllClients(lang: Lang = DEFAULT_LOCALE): Client[] {
  return getClientsData(lang).clients
}

export function getClient(id: string, lang: Lang = DEFAULT_LOCALE): Client | undefined {
  return getAllClients(lang).find((c) => c.id === id)
}

export function getClientIds(lang: Lang = DEFAULT_LOCALE): string[] {
  return getAllClients(lang).map((c) => c.id)
}

export function getClientMediaPath(clientId: string, filename: string): string {
  return `/images/clients/${clientId}/${filename}`
}

export function getClientsForProject(slug: string, lang: Lang = DEFAULT_LOCALE): Client[] {
  const project = getProject(slug, lang)
  if (!project?.clientIds?.length) return []
  const byId = Object.fromEntries(getAllClients(lang).map((c) => [c.id, c]))
  return project.clientIds.map((id) => byId[id]).filter((c): c is Client => Boolean(c))
}

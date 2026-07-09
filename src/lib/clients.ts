// src/lib/clients.ts
//
// Single entry point for client case-study data. All clients live in
// `src/content/data/clients.json`. Detail pages at `/clients/{id}/` use
// `getClient(id)`; the index page reads the full file directly or via
// `getAllClients()`.

import type { Client, ClientsData } from '../types'
import clientsDataRaw from '../content/data/clients.json'

const clientsData = clientsDataRaw as ClientsData

const clientsById: Record<string, Client> = {}
for (const client of clientsData.clients) {
  clientsById[client.id] = client
}

/** Full clients.json payload including page meta. */
export function getClientsData(): ClientsData {
  return clientsData
}

/** Ordered list of all clients. */
export function getAllClients(): Client[] {
  return clientsData.clients
}

/** Single client by id, or undefined if not found. */
export function getClient(id: string): Client | undefined {
  return clientsById[id]
}

/** All client ids — for static path generation. */
export function getClientIds(): string[] {
  return clientsData.clients.map((c) => c.id)
}

/** Resolve a media filename to its public URL under /images/clients/{id}/. */
export function getClientMediaPath(clientId: string, filename: string): string {
  return `/images/clients/${clientId}/${filename}`
}

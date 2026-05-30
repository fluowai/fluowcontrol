import type { ContainerState } from '../types/index.js'

interface DockerContainerResponse {
  id: string
  containerId: string
  name: string
  image: string
  status: string
  state: ContainerState
  ports: Array<{ hostPort: number; containerPort: number; protocol: string }>
  cpuPercent: number
  memoryUsageMb: number
  memoryLimitMb: number
  networkRxMb: number
  networkTxMb: number
  uptimeSeconds: number
  restartCount: number
  lastError: string | null
  collectedAt: string
}

interface HostMetricsResponse {
  hostName: string
  cpuPercent: number
  ramUsedGb: number
  ramTotalGb: number
  diskUsedGb: number
  diskTotalGb: number
  loadAverage: number[]
  uptimeSeconds: number
}

interface NetworkResponse {
  id: string
  name: string
  driver: string
  scope: string
  subnet: string
  gateway: string
  containers: number
}

interface VolumeResponse {
  name: string
  driver: string
  mountpoint: string
  size: number
  status: string
}

interface AgentError {
  error: string
  status: number
}

const AGENT_URL = process.env.FLUOW_AGENT_URL || 'http://localhost:3001'
const API_KEY = process.env.FLUOW_AGENT_API_KEY || ''

async function agentFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${AGENT_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    ...(options?.headers as Record<string, string>),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw Object.assign(new Error(body.error || `HTTP ${response.status}`), {
      status: response.status,
    } as AgentError)
  }

  return response.json() as Promise<T>
}

export async function getContainers(): Promise<DockerContainerResponse[]> {
  try {
    return await agentFetch<DockerContainerResponse[]>('/containers')
  } catch (error) {
    console.error('[DockerService] getContainers failed:', error)
    return []
  }
}

export async function getContainer(id: string): Promise<DockerContainerResponse | null> {
  try {
    return await agentFetch<DockerContainerResponse>(`/containers/${id}`)
  } catch (error) {
    console.error(`[DockerService] getContainer(${id}) failed:`, error)
    return null
  }
}

export async function getContainerLogs(id: string, lines?: number): Promise<string[]> {
  try {
    const query = lines !== undefined ? `?lines=${lines}` : ''
    return await agentFetch<string[]>(`/containers/${id}/logs${query}`)
  } catch (error) {
    console.error(`[DockerService] getContainerLogs(${id}) failed:`, error)
    return []
  }
}

export async function restartContainer(id: string): Promise<{ success: boolean }> {
  try {
    return await agentFetch<{ success: boolean }>(`/containers/${id}/restart`, { method: 'POST' })
  } catch (error) {
    console.error(`[DockerService] restartContainer(${id}) failed:`, error)
    return { success: false }
  }
}

export async function stopContainer(id: string): Promise<{ success: boolean }> {
  try {
    return await agentFetch<{ success: boolean }>(`/containers/${id}/stop`, { method: 'POST' })
  } catch (error) {
    console.error(`[DockerService] stopContainer(${id}) failed:`, error)
    return { success: false }
  }
}

export async function startContainer(id: string): Promise<{ success: boolean }> {
  try {
    return await agentFetch<{ success: boolean }>(`/containers/${id}/start`, { method: 'POST' })
  } catch (error) {
    console.error(`[DockerService] startContainer(${id}) failed:`, error)
    return { success: false }
  }
}

export async function getHostMetrics(): Promise<HostMetricsResponse | null> {
  try {
    return await agentFetch<HostMetricsResponse>('/host/metrics')
  } catch (error) {
    console.error('[DockerService] getHostMetrics failed:', error)
    return null
  }
}

export async function getNetworks(): Promise<NetworkResponse[]> {
  try {
    return await agentFetch<NetworkResponse[]>('/networks')
  } catch (error) {
    console.error('[DockerService] getNetworks failed:', error)
    return []
  }
}

export async function getVolumes(): Promise<VolumeResponse[]> {
  try {
    return await agentFetch<VolumeResponse[]>('/volumes')
  } catch (error) {
    console.error('[DockerService] getVolumes failed:', error)
    return []
  }
}

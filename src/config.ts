import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Config, HistoryEntry, ThemeName, UnitSystem } from './types.js'

const CONFIG_DIR = join(homedir(), '.config', 'weather-cli')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')
const HISTORY_PATH = join(CONFIG_DIR, 'history.json')
const MAX_HISTORY = 10

const DEFAULT_CONFIG: Config = {
  theme: 'nord',
  units: 'metric',
  defaultDays: 5,
}

let dirReady = false

async function ensureDir(): Promise<void> {
  if (dirReady) return
  await mkdir(CONFIG_DIR, { recursive: true })
  dirReady = true
}

export async function loadConfig(): Promise<Config> {
  await ensureDir()
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureDir()
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const config = await loadConfig()
  Object.assign(config, updates)
  await saveConfig(config)
  return config
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  await ensureDir()
  try {
    const raw = await readFile(HISTORY_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function saveHistory(entry: HistoryEntry): Promise<void> {
  await ensureDir()
  const history = await loadHistory()

  const existing = history.findIndex(
    (h) => h.name === entry.name && h.country === entry.country
  )

  if (existing !== -1) {
    history.splice(existing, 1)
  }

  history.unshift(entry)

  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY
  }

  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')
}

export async function clearHistory(): Promise<void> {
  await ensureDir()
  await writeFile(HISTORY_PATH, JSON.stringify([], null, 2), 'utf-8')
}

export function getConfigDir(): string {
  return CONFIG_DIR
}

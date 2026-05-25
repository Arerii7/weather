import { WMO_CODES } from '../types.js'

export function weatherIcon(code: number, isDay: boolean = true): string {
  const entry = WMO_CODES[code]
  if (!entry) return isDay ? '❓' : '❓'
  return entry.icon
}

export function weatherDescription(code: number): string {
  const entry = WMO_CODES[code]
  if (!entry) return 'Unknown'
  return entry.description
}

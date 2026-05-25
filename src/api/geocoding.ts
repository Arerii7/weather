import type { GeoResult } from '../types.js'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface GeoApiResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation: number
  country: string
  country_code: string
  admin1: string
  timezone: string
  population?: number
}

const FETCH_TIMEOUT = 10_000

async function apiFetch(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Check your internet connection.')
    }
    throw new Error('Unable to connect to weather service. Check your internet connection.')
  } finally {
    clearTimeout(timer)
  }
}

export async function searchCity(query: string, count: number = 5): Promise<GeoResult[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`

  const response = await apiFetch(url)
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`)
  }

  const data = await response.json() as { results?: GeoApiResult[] }

  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${query}" not found`)
  }

  return data.results.map((r: GeoApiResult): GeoResult => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    elevation: r.elevation,
    country: r.country,
    countryCode: r.country_code,
    admin1: r.admin1 ?? '',
    timezone: r.timezone,
    population: r.population,
  }))
}

export async function resolveCity(query: string): Promise<GeoResult> {
  const results = await searchCity(query, 5)
  return results[0]
}

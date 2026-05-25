import type { CurrentWeather, DailyForecast, WeatherData, UnitSystem } from '../types.js'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

interface CacheEntry {
  data: WeatherData
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
export let cacheTtl = 10 * 60 * 1000

function cacheKey(lat: number, lon: number, days: number, units: UnitSystem, timezone: string): string {
  return `${lat}:${lon}:${days}:${units}:${timezone}`
}

function getUnitParams(units: UnitSystem): string {
  switch (units) {
    case 'imperial':
      return 'temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'
    case 'scientific':
      return 'temperature_unit=celsius&wind_speed_unit=ms&precipitation_unit=mm'
    default:
      return 'temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm'
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
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

export async function fetchWeather(
  lat: number,
  lon: number,
  days: number = 5,
  units: UnitSystem = 'metric',
  timezone: string = 'auto',
  force: boolean = false
): Promise<WeatherData> {
  const key = cacheKey(lat, lon, days, units, timezone)

  if (!force) {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      return cached.data
    }
  }

  const unitParams = getUnitParams(units)

  const currentParams = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'pressure_msl',
    'cloud_cover',
    'uv_index',
    'precipitation',
    'is_day',
  ].join(',')

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_direction_10m_dominant',
    'sunrise',
    'sunset',
    'uv_index_max',
  ].join(',')

  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=${currentParams}` +
    `&daily=${dailyParams}` +
    `&${unitParams}` +
    `&timezone=${timezone}` +
    `&forecast_days=${days}`

  const response = await apiFetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Weather API error (${response.status}): ${text}`)
  }

  const raw = await response.json() as {
    latitude: number
    longitude: number
    elevation: number
    generationtime_ms: number
    timezone: string
    current: Record<string, number | string>
    current_units: Record<string, string>
    daily: Record<string, (number | string)[]>
    daily_units: Record<string, string>
  }

  const current: CurrentWeather = {
    temperature: raw.current.temperature_2m as number,
    apparentTemperature: raw.current.apparent_temperature as number,
    relativeHumidity: raw.current.relative_humidity_2m as number,
    weatherCode: raw.current.weather_code as number,
    windSpeed: raw.current.wind_speed_10m as number,
    windDirection: raw.current.wind_direction_10m as number,
    windGusts: raw.current.wind_gusts_10m as number,
    pressure: raw.current.pressure_msl as number,
    cloudCover: raw.current.cloud_cover as number,
    uvIndex: raw.current.uv_index as number,
    precipitation: raw.current.precipitation as number,
    isDay: (raw.current.is_day as number) === 1,
    time: raw.current.time as string,
  }

  const forecast: DailyForecast[] = []
  const timeArr = raw.daily.time as string[]

  for (let i = 0; i < timeArr.length; i++) {
    forecast.push({
      date: timeArr[i],
      weatherCode: (raw.daily.weather_code as number[])[i],
      tempMax: (raw.daily.temperature_2m_max as number[])[i],
      tempMin: (raw.daily.temperature_2m_min as number[])[i],
      precipitationSum: (raw.daily.precipitation_sum as number[])[i],
      precipitationProbability: (raw.daily.precipitation_probability_max as number[])[i],
      windSpeedMax: (raw.daily.wind_speed_10m_max as number[])[i],
      windDirectionDominant: (raw.daily.wind_direction_10m_dominant as number[])[i],
      sunrise: formatTime((raw.daily.sunrise as string[])[i]),
      sunset: formatTime((raw.daily.sunset as string[])[i]),
      uvIndexMax: (raw.daily.uv_index_max as number[])[i],
    })
  }

  const data: WeatherData = {
    location: '',
    country: '',
    countryCode: '',
    timezone: raw.timezone,
    elevation: raw.elevation,
    current,
    forecast,
    generationTimeMs: raw.generationtime_ms,
  }

  cache.set(key, { data, timestamp: Date.now() })

  return data
}

export function setCacheTtl(minutes: number): void {
  cacheTtl = minutes * 60 * 1000
}

export { formatTime }

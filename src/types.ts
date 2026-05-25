export type UnitSystem = 'metric' | 'imperial' | 'scientific'

export type ThemeName = 'nord' | 'mint' | 'daybreak' | 'midnight' | 'monochrome'

export interface Theme {
  name: ThemeName
  label: string
  accent: string
  primary: string
  secondary: string
  dim: string
  border: string
  tempHigh: string
  tempLow: string
  icon: string
}

export interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation: number
  country: string
  countryCode: string
  admin1: string
  timezone: string
  population?: number
}

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  relativeHumidity: number
  weatherCode: number
  windSpeed: number
  windDirection: number
  windGusts: number
  pressure: number
  cloudCover: number
  uvIndex: number
  precipitation: number
  isDay: boolean
  time: string
}

export interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipitationSum: number
  precipitationProbability: number
  windSpeedMax: number
  windDirectionDominant: number
  sunrise: string
  sunset: string
  uvIndexMax: number
}

export interface WeatherData {
  location: string
  country: string
  countryCode: string
  admin1?: string
  timezone: string
  elevation: number
  current: CurrentWeather
  forecast: DailyForecast[]
  generationTimeMs: number
}

export interface Config {
  theme: ThemeName
  units: UnitSystem
  defaultDays: number
  lastCity?: string
}

export interface HistoryEntry {
  name: string
  country: string
  countryCode: string
  admin1: string
  latitude: number
  longitude: number
  timezone: string
  lastViewed: string
}

export const WMO_CODES: Record<number, { icon: string; description: string }> = {
  0: { icon: '☀️', description: 'Clear sky' },
  1: { icon: '🌤', description: 'Mainly clear' },
  2: { icon: '⛅', description: 'Partly cloudy' },
  3: { icon: '☁️', description: 'Overcast' },
  45: { icon: '🌫', description: 'Foggy' },
  48: { icon: '🌫', description: 'Depositing rime fog' },
  51: { icon: '🌦', description: 'Light drizzle' },
  53: { icon: '🌦', description: 'Moderate drizzle' },
  55: { icon: '🌧', description: 'Dense drizzle' },
  56: { icon: '🌧', description: 'Light freezing drizzle' },
  57: { icon: '🌧', description: 'Dense freezing drizzle' },
  61: { icon: '🌧', description: 'Slight rain' },
  63: { icon: '🌧', description: 'Moderate rain' },
  65: { icon: '🌧', description: 'Heavy rain' },
  66: { icon: '🌧', description: 'Light freezing rain' },
  67: { icon: '🌧', description: 'Heavy freezing rain' },
  71: { icon: '🌨', description: 'Slight snow' },
  73: { icon: '🌨', description: 'Moderate snow' },
  75: { icon: '🌨', description: 'Heavy snow' },
  77: { icon: '🌨', description: 'Snow grains' },
  80: { icon: '🌦', description: 'Slight rain showers' },
  81: { icon: '🌧', description: 'Moderate rain showers' },
  82: { icon: '🌧', description: 'Violent rain showers' },
  85: { icon: '🌨', description: 'Slight snow showers' },
  86: { icon: '🌨', description: 'Heavy snow showers' },
  95: { icon: '⛈', description: 'Thunderstorm' },
  96: { icon: '⛈', description: 'Thunderstorm with slight hail' },
  99: { icon: '⛈', description: 'Thunderstorm with heavy hail' },
}

export const WIND_DIRECTIONS: Record<number, string> = {
  0: '↓', 45: '↙', 90: '←', 135: '↖',
  180: '↑', 225: '↗', 270: '→', 315: '↘',
}

export function getWindDirectionArrow(degrees: number): string {
  const index = Math.round(degrees / 45) % 8
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘']
  return arrows[index]
}

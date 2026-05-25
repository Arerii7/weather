import chalk from 'chalk'
import type { Theme, WeatherData, UnitSystem, HistoryEntry, Config, DailyForecast, CurrentWeather } from '../types.js'
import { getTheme } from '../themes/index.js'
import { getWindDirectionArrow } from '../types.js'
import { weatherIcon, weatherDescription } from './icons.js'
import { renderCurrent } from './conditions.js'
import { renderForecast } from './forecast.js'
import { renderDetails } from './details.js'

function formatTimeDisplay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function getUnitLabels(units: UnitSystem): { temp: string; speed: string; precip: string } {
  switch (units) {
    case 'imperial':
      return { temp: '°F', speed: 'mph', precip: 'in' }
    case 'scientific':
      return { temp: '°C', speed: 'm/s', precip: 'mm' }
    default:
      return { temp: '°C', speed: 'km/h', precip: 'mm' }
  }
}

export function renderJSON(data: WeatherData, units: UnitSystem): string {
  const flags = { wind: true, humidity: true, pressure: true, uv: true, sun: true, precip: true }
  const speedLabel = getUnitLabels(units).speed

  const obj = {
    location: {
      name: data.location,
      country: data.country,
      countryCode: data.countryCode,
      admin1: data.admin1 || null,
      timezone: data.timezone,
    },
    current: {
      temperature: data.current.temperature,
      feelsLike: data.current.apparentTemperature,
      humidity: data.current.relativeHumidity,
      weatherCode: data.current.weatherCode,
      description: weatherDescription(data.current.weatherCode),
      icon: weatherIcon(data.current.weatherCode, data.current.isDay),
      windSpeed: data.current.windSpeed,
      windDirection: data.current.windDirection,
      windArrow: getWindDirectionArrow(data.current.windDirection),
      windGusts: data.current.windGusts,
      pressure: data.current.pressure,
      cloudCover: data.current.cloudCover,
      uvIndex: data.current.uvIndex,
      precipitation: data.current.precipitation,
      isDay: data.current.isDay,
      time: data.current.time,
    },
    forecast: data.forecast.map((d: DailyForecast) => ({
      date: d.date,
      weatherCode: d.weatherCode,
      description: weatherDescription(d.weatherCode),
      icon: weatherIcon(d.weatherCode, true),
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      precipitationSum: d.precipitationSum,
      precipitationProbability: d.precipitationProbability,
      windSpeedMax: d.windSpeedMax,
      windDirectionDominant: d.windDirectionDominant,
      windArrow: getWindDirectionArrow(d.windDirectionDominant),
      sunrise: d.sunrise,
      sunset: d.sunset,
      uvIndexMax: d.uvIndexMax,
    })),
    meta: {
      units,
      generationTimeMs: data.generationTimeMs,
      source: 'Open-Meteo',
    },
  }
  return JSON.stringify(obj, null, 2)
}

const FORMAT_PRESETS: Record<string, string> = {
  '1': '%c %t  · %C',
  '2': '%c 🌡️%t 🌬️%w',
  '3': '%l: %c %t',
  '4': '%l: %c 🌡️%t 🌬️%w',
}

export function renderFormat(data: WeatherData, units: UnitSystem, format: string): string {
  const fmt = FORMAT_PRESETS[format] || format
  const speedLabel = getUnitLabels(units).speed

  const values: Record<string, string> = {
    'c': weatherIcon(data.current.weatherCode, data.current.isDay),
    'C': weatherDescription(data.current.weatherCode),
    't': `${Math.round(data.current.temperature)}°`,
    'f': `${Math.round(data.current.apparentTemperature)}°`,
    'h': `${data.current.relativeHumidity}%`,
    'w': `${getWindDirectionArrow(data.current.windDirection)} ${Math.round(data.current.windSpeed)} ${speedLabel}`,
    'p': `${data.current.precipitation.toFixed(1)}`,
    'P': `${Math.round(data.current.pressure)} hPa`,
    'u': `${data.current.uvIndex}`,
    'l': data.location,
  }

  let result = ''
  for (let i = 0; i < fmt.length; i++) {
    if (fmt[i] === '%' && i + 1 < fmt.length) {
      const key = fmt[i + 1]
      if (key === '%') {
        result += '%'
      } else {
        result += values[key] ?? `%${key}`
      }
      i++
    } else {
      result += fmt[i]
    }
  }
  return result
}

export function renderWeather(
  data: WeatherData,
  themeName: string,
  units: UnitSystem,
  hideIcon: boolean = false,
  detailToggles: { wind?: boolean; humidity?: boolean; pressure?: boolean; uv?: boolean; sun?: boolean; precip?: boolean } = {}
): string {
  const theme = getTheme(themeName)
  const unitLabels = getUnitLabels(units)
  const lines: string[] = []

  const timeStr = formatTimeDisplay(data.current.time)
  const flag = data.countryCode
    ? data.countryCode.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
    : ''

  const location = data.admin1
    ? `${data.location}, ${data.admin1}`
    : data.location

  lines.push('')
  lines.push(
    `  ${flag} ${chalk.hex(theme.primary).bold(location)}${data.country ? ', ' + data.country : ''}`
  )

  const speedUnit = unitLabels.speed

  lines.push(...renderCurrent(data.current, theme, hideIcon))
  lines.push(...renderForecast(data.forecast, theme, data.forecast.length, speedUnit, hideIcon))
  lines.push(...renderDetails(data.current, data.forecast, theme, speedUnit, detailToggles))

  lines.push(chalk.hex(theme.dim)(`  ${'─'.repeat(44)}`))
  lines.push(
    chalk.hex(theme.dim)(
      `  Updated ${timeStr} · ${data.generationTimeMs.toFixed(1)}ms · data from Open-Meteo`
    )
  )
  lines.push('')

  return lines.join('\n')
}

export function renderError(message: string): string {
  return `\n  ${chalk.red('✖')} ${message}\n`
}

export function renderHistory(
  entries: HistoryEntry[]
): string {
  if (entries.length === 0) {
    return '\n  No recent cities.\n'
  }

  const lines: string[] = ['', '  Recent Cities', '  ─────────────']

  for (const entry of entries) {
    const flag = entry.countryCode
      ? entry.countryCode.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
      : ''
    const date = new Date(entry.lastViewed)
    const timeStr = date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
    lines.push(
      `  ${chalk.dim('·')} ${flag} ${entry.name}, ${entry.country} ${chalk.dim(timeStr)}`
    )
  }
  lines.push('')
  return lines.join('\n')
}

export function renderConfig(config: Config, configPath: string): string {
  const lines = [
    '',
    '  Config',
    '  ──────',
    `  Theme:  ${config.theme}`,
    `  Units:  ${config.units}`,
    `  Days:   ${config.defaultDays}`,
    `  Path:   ${configPath}`,
  ]
  if (config.lastCity) {
    lines.push(`  Last:   ${config.lastCity}`)
  }
  lines.push('')
  return lines.join('\n')
}

import chalk from 'chalk'
import type { Theme, WeatherData, UnitSystem, HistoryEntry, Config, DailyForecast, CurrentWeather } from '../types.js'
import { getWindDirectionArrow, weatherIcon, weatherDescription } from '../types.js'
import { getTheme } from '../themes/index.js'

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

function renderCurrent(
  weather: CurrentWeather,
  theme: Theme,
  hideIcon: boolean = false
): string[] {
  const lines: string[] = []
  const icon = hideIcon ? '' : `${chalk.hex(theme.icon)(weatherIcon(weather.weatherCode))}  `
  const desc = weatherDescription(weather.weatherCode)
  const temp = Math.round(weather.temperature)
  const feelsLike = Math.round(weather.apparentTemperature)

  lines.push('')
  lines.push(
    `  ${icon}${chalk.hex(theme.primary).bold(`${temp}°`)}  ${chalk.hex(theme.secondary)('·')}  ${chalk.hex(theme.secondary)(desc)}  ${chalk.hex(theme.dim)(`Feels like ${feelsLike}°`)}`
  )
  lines.push('')

  return lines
}

function renderForecast(
  forecast: DailyForecast[],
  theme: Theme,
  days: number,
  speedUnit: string,
  hideIcon: boolean = false
): string[] {
  const lines: string[] = []

  const header = chalk.hex(theme.dim)(`  ──  ${days}-Day Forecast  ${'─'.repeat(Math.max(0, 34 - days.toString().length))}`)
  lines.push(header)

  for (const day of forecast) {
    const date = new Date(day.date)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekday = weekdays[date.getDay()]
    const dayNum = date.getDate()

    const icon = hideIcon ? '' : `${weatherIcon(day.weatherCode)}  `
    const high = chalk.hex(theme.tempHigh)(`${Math.round(day.tempMax)}°`)
    const low = chalk.hex(theme.tempLow)(`${Math.round(day.tempMin)}°`)
    const arrow = chalk.hex(theme.secondary)(getWindDirectionArrow(day.windDirectionDominant))
    const wind = chalk.hex(theme.secondary)(`${Math.round(day.windSpeedMax)} ${speedUnit}`)

    const dayLabel = chalk.hex(theme.primary)(`${weekday} ${dayNum}`)
    const precip = day.precipitationProbability > 0
      ? chalk.hex(theme.dim)(`  💧${Math.round(day.precipitationProbability)}%`)
      : ''

    lines.push(
      `  ${dayLabel}  ${icon}${high}/${low}  ${arrow} ${wind}${precip}`
    )
  }

  lines.push('')
  return lines
}

function renderDetails(
  current: CurrentWeather,
  forecast: DailyForecast[],
  theme: Theme,
  speedUnit: string,
  toggles: { wind?: boolean; humidity?: boolean; pressure?: boolean; uv?: boolean; sun?: boolean; precip?: boolean } = {}
): string[] {
  const lines: string[] = []
  const today = forecast[0]

  const show = {
    wind: toggles.wind ?? true,
    humidity: toggles.humidity ?? true,
    pressure: toggles.pressure ?? true,
    uv: toggles.uv ?? true,
    sun: toggles.sun ?? true,
    precip: toggles.precip ?? true,
  }

  const hasAny = show.wind || show.humidity || show.pressure || show.uv || show.sun || show.precip
  if (!hasAny) return []

  lines.push(chalk.hex(theme.dim)(`  ──  Details  ${'─'.repeat(34)}`))

  const humidity = chalk.hex(theme.primary)(`${current.relativeHumidity}%`)
  const pressure = chalk.hex(theme.primary)(`${Math.round(current.pressure)} hPa`)
  const uv = chalk.hex(theme.primary)(`${current.uvIndex}`)
  const cloud = chalk.hex(theme.primary)(`${current.cloudCover}%`)
  const precip = chalk.hex(theme.primary)(current.precipitation > 0 ? `${current.precipitation.toFixed(1)}` : '0')
  const windArrow = chalk.hex(theme.secondary)(getWindDirectionArrow(current.windDirection))
  const windGusts = chalk.hex(theme.primary)(`${Math.round(current.windGusts)} ${speedUnit}`)
  const windSpeed = chalk.hex(theme.primary)(`${Math.round(current.windSpeed)} ${speedUnit}`)
  const sunrise = today ? chalk.hex(theme.primary)(today.sunrise) : '--:--'
  const sunset = today ? chalk.hex(theme.primary)(today.sunset) : '--:--'

  const pad = 10

  function col(label: string, value: string): string {
    return `${chalk.hex(theme.dim)(label.padEnd(pad))}${value}`
  }

  const rows: string[] = []

  if (show.humidity) rows.push(`  ${col('Humidity', humidity.padEnd(8))}  ${show.wind ? col('Wind', `${windArrow} ${windSpeed}`) : ''}`)
  if (show.humidity) rows.push(`  ${col('Cloud', cloud.padEnd(8))}  ${show.wind ? col('Gusts', `${windArrow} ${windGusts}`) : ''}`)

  if (show.pressure) rows.push(`  ${col('Pressure', pressure.padEnd(8))}  ${show.uv ? col('UV Index', uv) : ''}`)
  if (show.precip) rows.push(`  ${col('Precip', `💧 ${precip}`.padEnd(8))}  ${col('', '')}`)
  if (show.sun) rows.push(`  ${col('', '')}  ${sunrise ? col('Sunrise', sunrise) : col('', '')}`)
  if (show.sun && sunset) rows.push(`  ${col('', '')}  ${col('Sunset', sunset)}`)

  for (const row of rows) {
    if (row.trim()) lines.push(row)
  }

  lines.push('')
  return lines
}

export function renderJSON(data: WeatherData, units: UnitSystem): string {
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
      icon: weatherIcon(data.current.weatherCode),
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
      icon: weatherIcon(d.weatherCode),
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
    'c': weatherIcon(data.current.weatherCode),
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

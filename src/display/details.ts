import chalk from 'chalk'
import type { Theme, CurrentWeather, DailyForecast } from '../types.js'
import { getWindDirectionArrow } from '../types.js'

export function renderDetails(
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
  if (show.precip) rows.push(`  ${col('Precip', `💧 ${precip}`.padEnd(8))}  ${show.sun && sunrise ? col('Sunrise', sunrise) : col('', '')}`)
  if (show.sun && sunset) rows.push(`  ${col('', '')}  ${col('Sunset', sunset)}`)

  for (const row of rows) {
    if (row.trim()) lines.push(row)
  }

  lines.push('')
  return lines
}

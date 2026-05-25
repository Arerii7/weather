import chalk from 'chalk'
import type { Theme, DailyForecast } from '../types.js'
import { weatherIcon } from './icons.js'
import { getWindDirectionArrow } from '../types.js'

export function renderForecast(
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

    const icon = hideIcon ? '' : `${weatherIcon(day.weatherCode, true)}  `
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

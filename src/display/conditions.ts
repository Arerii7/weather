import chalk from 'chalk'
import type { Theme, CurrentWeather } from '../types.js'
import { weatherIcon, weatherDescription } from './icons.js'

export function renderCurrent(
  weather: CurrentWeather,
  theme: Theme,
  hideIcon: boolean = false
): string[] {
  const lines: string[] = []
  const icon = hideIcon ? '' : `${chalk.hex(theme.icon)(weatherIcon(weather.weatherCode, weather.isDay))}  `
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

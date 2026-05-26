#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { resolveCity, fetchWeather, setCacheTtl } from './api/index.js'
import { loadConfig, updateConfig, loadHistory, saveHistory, clearHistory as clearHistoryStore, getConfigDir } from './config.js'
import { renderWeather, renderError, renderHistory, renderConfig, renderJSON, renderFormat } from './display/renderer.js'
import { getAllThemes, getTheme } from './themes/index.js'
import type { ThemeName, UnitSystem, GeoResult, WeatherData } from './types.js'

const VALID_THEMES = ['nord', 'mint', 'daybreak', 'midnight', 'monochrome'] as const
const VALID_UNITS: UnitSystem[] = ['metric', 'imperial', 'scientific']

function isValidTheme(v: string): v is ThemeName {
  return VALID_THEMES.includes(v as ThemeName)
}

function isValidUnit(v: string): v is UnitSystem {
  return VALID_UNITS.includes(v as UnitSystem)
}

const program = new Command()

program
  .name('weather')
  .description('Beautiful weather forecast in your terminal')
  .version('1.0.0')
  .argument('[city]', 'City name to get weather for')
  .option('-d, --days <number>', 'Number of forecast days (1-16)', parseInt)
  .option('-t, --theme <name>', 'Color theme')
  .option('-u, --units <system>', 'Unit system: metric, imperial, scientific')
  .option('-l, --lat <number>', 'Latitude (-90 to 90)', parseFloat)
  .option('-o, --lon <number>', 'Longitude (-180 to 180)', parseFloat)
  .option('-j, --json', 'Output as JSON')
  .option('-f, --format <format>', 'Output format (1-4 or custom %-string)')
  .option('--hide-icon', 'Hide weather emoji icons')
  .option('--no-wind', 'Hide wind information')
  .option('--no-humidity', 'Hide humidity information')
  .option('--no-pressure', 'Hide pressure information')
  .option('--no-uv', 'Hide UV index')
  .option('--no-sun', 'Hide sunrise/sunset times')
  .option('--no-precip', 'Hide precipitation information')
  .option('--no-cache', 'Bypass cache and force refresh')
  .option('--cache-ttl <minutes>', 'Cache time-to-live in minutes', parseInt)
  .option('--history', 'Show recent cities')
  .option('--clear-history', 'Clear recent cities history')
  .option('--config', 'Show current configuration')
  .option('--list-themes', 'List available themes')
  .option('--cache-dir', 'Show config directory path')

async function main(): Promise<void> {
  program.parse()
  const opts = program.opts()
  const city = program.args[0]

  const config = await loadConfig()

  if (opts.listThemes) {
    const themes = getAllThemes()
    console.log('')
    for (const [name, label] of themes) {
      const theme = getTheme(name)
      console.log(`  ${chalk.hex(theme.accent)('●')} ${chalk.hex(theme.primary)(name)}  ${chalk.hex(theme.secondary)(`(${label})`)}`)
    }
    console.log('')
    return
  }

  if (opts.config) {
    console.log(renderConfig(config, getConfigDir()))
    return
  }

  if (opts.cacheDir) {
    console.log(`\n  ${getConfigDir()}\n`)
    return
  }

  if (opts.clearHistory) {
    await clearHistoryStore()
    console.log(chalk.green('\n  ✓ History cleared\n'))
    return
  }

  if (opts.history && !city) {
    const historyList = await loadHistory()
    console.log(renderHistory(historyList))
    return
  }

  const hasCoords = opts.lat !== undefined && opts.lon !== undefined
  const hasCity = typeof city === 'string' && city.length > 0
  const willShowWeather = hasCoords || hasCity

  if (city !== undefined && !hasCity) {
    console.log(renderError('City name cannot be empty'))
    return
  }

  if (opts.theme) {
    if (!isValidTheme(opts.theme)) {
      console.log(renderError(`Unknown theme "${opts.theme}". Available: ${VALID_THEMES.join(', ')}`))
      return
    }
    await updateConfig({ theme: opts.theme })
    config.theme = opts.theme
  }

  if (opts.units) {
    if (!isValidUnit(opts.units)) {
      console.log(renderError(`Unknown unit system "${opts.units}". Use: metric, imperial, scientific`))
      return
    }
    await updateConfig({ units: opts.units })
    config.units = opts.units
  }

  const rawDays = opts.days
  let days: number
  if (rawDays !== undefined) {
    if (isNaN(rawDays) || rawDays < 1 || rawDays > 16) {
      console.log(renderError('Number of forecast days must be between 1 and 16'))
      return
    }
    days = rawDays
  } else {
    days = config.defaultDays
  }

  const force = !!opts.noCache
  if (opts.cacheTtl !== undefined) {
    if (isNaN(opts.cacheTtl) || opts.cacheTtl < 1) {
      console.log(renderError('Cache TTL must be a positive number'))
      return
    }
    setCacheTtl(opts.cacheTtl)
  }

  const detailToggles = {
    wind: opts.wind,
    humidity: opts.humidity,
    pressure: opts.pressure,
    uv: opts.uv,
    sun: opts.sun,
    precip: opts.precip,
  }

  const hideIcon = !!opts.hideIcon
  const useJson = !!opts.json
  const formatStr = opts.format

  if (formatStr && !willShowWeather) {
    console.log(renderError('Format mode requires a city or coordinates'))
    return
  }

  if (!willShowWeather) {
    if (opts.theme || opts.units) {
      if (opts.theme) console.log(chalk.green(`\n  ✓ Theme set to "${opts.theme}"\n`))
      if (opts.units) console.log(chalk.green(`\n  ✓ Units set to "${opts.units}"\n`))
      return
    }
  }

  const rawTheme = opts.theme ?? config.theme
  const rawUnits = opts.units ?? config.units
  const themeName: ThemeName = isValidTheme(rawTheme) ? rawTheme : 'nord'
  const units: UnitSystem = isValidUnit(rawUnits) ? rawUnits : 'metric'

  async function display(data: WeatherData): Promise<void> {
    data.location = geo.name
    data.country = geo.country
    data.countryCode = geo.countryCode
    data.admin1 = geo.admin1

    if (useJson) {
      console.log(renderJSON(data, units))
    } else if (formatStr) {
      console.log(renderFormat(data, units, formatStr))
    } else {
      console.log(renderWeather(data, themeName, units, hideIcon, detailToggles))
    }
  }

  let geo: GeoResult

  if (hasCoords) {
    if (isNaN(opts.lat) || isNaN(opts.lon) || opts.lat < -90 || opts.lat > 90 || opts.lon < -180 || opts.lon > 180) {
      console.log(renderError('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180'))
      return
    }
    geo = {
      id: 0,
      name: `${opts.lat}, ${opts.lon}`,
      latitude: opts.lat,
      longitude: opts.lon,
      elevation: 0,
      country: '',
      countryCode: '',
      admin1: '',
      timezone: 'auto',
    }
    const data = await fetchWeather(geo.latitude, geo.longitude, days, units, geo.timezone, force)
    await display(data)
    await saveHistory({ name: geo.name, country: geo.country, countryCode: geo.countryCode, admin1: geo.admin1, latitude: geo.latitude, longitude: geo.longitude, timezone: geo.timezone, lastViewed: new Date().toISOString() })
    await updateConfig({ lastCity: geo.name })
    return
  }

  if (hasCity) {
    try {
      geo = await resolveCity(city)
    } catch (err) {
      console.log(renderError(err instanceof Error ? err.message : String(err)))
      return
    }
    const data = await fetchWeather(geo.latitude, geo.longitude, days, units, geo.timezone, force)
    await display(data)
    await saveHistory({ name: geo.name, country: geo.country, countryCode: geo.countryCode, admin1: geo.admin1, latitude: geo.latitude, longitude: geo.longitude, timezone: geo.timezone, lastViewed: new Date().toISOString() })
    await updateConfig({ lastCity: geo.name })
    return
  }

  const history = await loadHistory()
  if (history.length > 0) {
    const last = history[0]
    geo = {
      id: 0,
      name: last.name,
      latitude: last.latitude,
      longitude: last.longitude,
      elevation: 0,
      country: last.country,
      countryCode: last.countryCode,
      admin1: last.admin1,
      timezone: last.timezone,
    }
    const data = await fetchWeather(geo.latitude, geo.longitude, days, units, geo.timezone, force)
    await display(data)
    await saveHistory({ name: geo.name, country: geo.country, countryCode: geo.countryCode, admin1: geo.admin1, latitude: geo.latitude, longitude: geo.longitude, timezone: geo.timezone, lastViewed: new Date().toISOString() })
    await updateConfig({ lastCity: geo.name })
    return
  }

  program.help()
}

main().catch((err) => {
  console.log(renderError(err instanceof Error ? err.message : String(err)))
  process.exit(1)
})

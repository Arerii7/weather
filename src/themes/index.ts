import type { Theme, ThemeName } from '../types.js'

const themes: Record<ThemeName, Theme> = {
  nord: {
    name: 'nord',
    label: 'Nord',
    accent: '#d4a5f5',
    primary: '#e8e8e8',
    secondary: '#a0a0a0',
    dim: '#585858',
    border: '#3a3a3a',
    tempHigh: '#ff9e64',
    tempLow: '#7dc4e4',
    icon: '#d4a5f5',
  },
  mint: {
    name: 'mint',
    label: 'Mint',
    accent: '#10a37f',
    primary: '#e8e8e8',
    secondary: '#a0a0a0',
    dim: '#585858',
    border: '#3a3a3a',
    tempHigh: '#ff9e64',
    tempLow: '#7dc4e4',
    icon: '#10a37f',
  },
  daybreak: {
    name: 'daybreak',
    label: 'Daybreak',
    accent: '#007aff',
    primary: '#1d1d1f',
    secondary: '#86868b',
    dim: '#c7c7cc',
    border: '#d2d2d7',
    tempHigh: '#ff6b35',
    tempLow: '#007aff',
    icon: '#007aff',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    accent: '#0a84ff',
    primary: '#f5f5f7',
    secondary: '#98989d',
    dim: '#48484a',
    border: '#38383a',
    tempHigh: '#ff9f4a',
    tempLow: '#64b5f6',
    icon: '#0a84ff',
  },
  monochrome: {
    name: 'monochrome',
    label: 'Monochrome',
    accent: '#ffffff',
    primary: '#ffffff',
    secondary: '#888888',
    dim: '#444444',
    border: '#333333',
    tempHigh: '#ffffff',
    tempLow: '#aaaaaa',
    icon: '#ffffff',
  },
}

export function getTheme(name: string): Theme {
  return themes[name as ThemeName] ?? themes['monochrome']
}

export function getAllThemes(): [ThemeName, string][] {
  return Object.entries(themes).map(([key, t]) => [key as ThemeName, t.label])
}

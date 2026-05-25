# weather

> Beautiful weather forecast in your terminal

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-blue)](package.json)

**weather** is a minimal, zero-dependency (except `chalk` + `commander`) CLI that
pulls 7-day forecasts from [Open-Meteo](https://open-meteo.com/) — a free, no-key
weather API. Pick from 5 themes, output as JSON, use custom `--format` strings,
and toggle individual info panels on/off.

---

## Demo

```text
$ weather Tokyo

  🇯🇵 Tokyo, Tokyo, Japan

  ⛅  17°  ·  Partly cloudy  Feels like 19°

  ──  5-Day Forecast  ─────────────────────────────────
  Tue 26  ☁️  26°/17°  ← 7 km/h  💧2%
  Wed 27  ⛅  27°/19°  ← 7 km/h  💧31%
  Thu 28  🌦  26°/21°  ↑ 8 km/h  💧53%
  Fri 29  🌦  32°/21°  ↓ 13 km/h  💧55%
  Sat 30  ☁️  27°/19°  ↑ 18 km/h  💧20%

  ──  Details  ──────────────────────────────────
  Humidity  98%       Wind      ↓ 3 km/h
  Cloud     77%       Gusts     ↓ 8 km/h
  Pressure  1015 hPa  UV Index  0
  Precip    💧 0      Sunrise   04:29
              Sunset    18:47

  ────────────────────────────────────────────
  Updated 03:00 · 316ms · data from Open-Meteo
```

---

## Install

```sh
git clone https://github.com/Arerii7/weather
cd weather
npm install && npm run build
npm link
```

Now `weather` is available globally. Rebuild with `npm run build` after pulling updates.

---

## Usage

```text
Usage: weather [options] [city]

Arguments:
  city                   City name (e.g. "Tokyo", "New York",
                         "Paris, FR") — last used city is
                         recalled if omitted

Options:
  -V, --version          Show version number
  -h, --help             Show help
  -d, --days <number>    Forecast days (1-16, default: 5)
  -t, --theme <name>     Color theme (nord, mint, daybreak,
                         midnight, monochrome)
  -u, --units <system>   Unit system (metric, imperial,
                         scientific)
  -l, --lat <number>     Latitude (-90 to 90)
  -o, --lon <number>     Longitude (-180 to 180)

  Output:
  -j, --json             Full JSON output
  -f, --format <fmt>     Custom format string or preset (1-4)
  --hide-icon            Remove weather emojis

  Toggles:
  --no-wind              Hide wind column
  --no-humidity          Hide humidity & cloud
  --no-pressure          Hide pressure
  --no-uv                Hide UV index
  --no-sun               Hide sunrise/sunset
  --no-precip            Hide precipitation

  Cache:
  --no-cache             Force fresh API request
  --cache-ttl <minutes>  Override cache lifetime (default: 10)

  Utility:
  --history              Recent cities
  --clear-history        Clear history
  --config               Show configuration
  --list-themes          Show all themes
  --cache-dir            Print config directory
```

---

## Features

### Themes

```text
$ weather Tokyo -t nord          $ weather Tokyo -t mint
$ weather Tokyo -t daybreak      $ weather Tokyo -t midnight
$ weather Tokyo -t monochrome
```

| Theme      | Accent | Mood        |
|------------|--------|-------------|
| `nord`     | Purple | Evening     |
| `mint`     | Green  | Fresh       |
| `daybreak` | Blue   | Light / Day |
| `midnight` | Indigo | Dark / Night|
| `monochrome`| Gray  | Minimal     |

### `--json` / `-j` — JSON output

```sh
$ weather Tokyo -j | jq '.current.temperature'
16.9
```

Full structured output with location, current conditions, 5‑day forecast,
and metadata. Pipe directly into `jq` or your own scripts.

### `--format` / `-f` — custom format strings

```sh
$ weather Tokyo -f 3
Tokyo: ⛅ 17°

$ weather Tokyo -f 'It is %t with %C in %l'
It is 17° with Partly cloudy in Tokyo
```

**Presets:**

| Preset | Output |
|--------|--------|
| `1` | `☀️ 32°  · Clear sky` |
| `2` | `☀️  🌡️32° 🌬️← 14 km/h` |
| `3` | `London: ☀️ 32°` |
| `4` | `London: ☀️ 🌡️32° 🌬️← 14 km/h` |

**`%`-placeholders:**

| Code | Value |
|------|-------|
| `%c` | Weather icon (emoji) |
| `%C` | Weather description |
| `%t` | Temperature |
| `%f` | Feels‑like |
| `%h` | Humidity |
| `%w` | Wind (arrow + speed + unit) |
| `%p` | Precipitation |
| `%P` | Pressure |
| `%u` | UV index |
| `%l` | Location name |
| `%%` | Literal `%` |

### Panel toggles

Hide what you don't need:

```sh
$ weather London --no-humidity --no-uv --no-precip

  🇬🇧 London, England, United Kingdom
  ☀️ 32° · Clear sky  Feels like 31°
  ── 5-Day Forecast ─────────────────────────────────
  Mon 25  ☀️ 34°/20°  ← 16 km/h
  ...
  ── Details ──────────────────────────────────
  Pressure  1029 hPa   Wind      ← 14 km/h
  Gusts     ← 32 km/h  Sunrise   04:55
                        Sunset    20:59
  ────────────────────────────────────────────
```

### Cache

```sh
$ weather London               # cached (10 min)
$ weather London --no-cache     # bypass cache
$ weather London --cache-ttl 30 # extend to 30 min
```

Results are cached in memory. `--no-cache` always fetches fresh data.

### Coordinates

```sh
$ weather --lat 48.85 --lon 2.35
🇫🇷 Paris, Île-de-France, France
```

### Error handling

```text
$ weather Asdfghjkl123
✖ City "Asdfghjkl123" not found

$ # network issue
✖ Unable to connect to weather service. Check your internet connection.
```

---

## About

- **Free API** — no API key needed, powered by [Open-Meteo](https://open-meteo.com/)
- **Minimal deps** — only `chalk` (colored output) + `commander` (CLI parsing)
- **Zero config** — run `weather London` and it just works
- **Config & history** stored in `~/.config/weather-cli/`
- **Configurable cache** — 10 minute default, adjustable via `--cache-ttl`

## License

MIT

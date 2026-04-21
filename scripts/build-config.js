#!/usr/bin/env node
/**
 * scripts/build-config.js
 *
 * Converts config/jurisdiction.yaml → src/config/jurisdiction.js
 * Run before `npm run build` or during `npm run dev` via the Vite plugin.
 *
 * Usage:
 *   node scripts/build-config.js
 *   node scripts/build-config.js config/my_city.yaml
 */

import fs   from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, "..")

// ── Simple YAML parser (handles the subset we use — no need for a dep) ────────
function parseYAML(text) {
  // Use js-yaml if available, otherwise fall back to JSON via python
  try {
    const { load } = await import("js-yaml").catch(() => null) || {}
    if (load) return load(text)
  } catch {}

  // Fallback: spawn python to parse
  const { execSync } = await import("child_process")
  const escaped = text.replace(/'/g, "'\\''")
  const result  = execSync(
    `python3 -c "import sys, yaml, json; print(json.dumps(yaml.safe_load(sys.stdin.read())))"`,
    { input: text, encoding: "utf8" }
  )
  return JSON.parse(result)
}

async function main() {
  const yamlPath = process.argv[2] ||
    path.join(ROOT, "config", "jurisdiction.yaml")
  const outPath  = path.join(ROOT, "src", "config", "jurisdiction.js")

  if (!fs.existsSync(yamlPath)) {
    console.warn(`⚠  No config found at ${yamlPath} — using NYC defaults`)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, generateDefault())
    return
  }

  const text = fs.readFileSync(yamlPath, "utf8")
  const cfg  = await parseYAML(text)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, generateJS(cfg))
  console.log(`✓ Config written to ${outPath}`)
}

function generateDefault() {
  return `// Auto-generated from config/jurisdiction.yaml (NYC defaults)
// Run: node scripts/build-config.js to regenerate
export const JURISDICTION = ${JSON.stringify(defaultNYC(), null, 2)}
`
}

function generateJS(cfg) {
  const j     = cfg.jurisdiction     || {}
  const nws   = cfg.nws             || {}
  const coops = cfg.coops_stations   || []
  const kb    = cfg.knowledge_base   || {}
  const mp    = cfg.map_points       || {}
  const soc   = cfg.socrata          || {}
  const noaa  = cfg.noaa            || {}
  const brand = cfg.branding         || {}

  return `// ─── Auto-generated from config/jurisdiction.yaml ───────────────────────────
// Run: node scripts/build-config.js to regenerate from YAML
// DO NOT EDIT — edit jurisdiction.yaml instead

export const JURISDICTION = ${JSON.stringify({
    name:        j.name        || "My City",
    short_name:  j.short_name  || "City",
    state:       j.state       || "NY",
    state_full:  j.state_full  || "New York",
    county:      j.county      || "",
    center:      [j.center_lat || 40.7128, j.center_lng || -74.006],
    bbox:        { north: j.bbox_north, south: j.bbox_south, east: j.bbox_east, west: j.bbox_west },
    zoom:        j.zoom_default || 11,
    timezone:    j.timezone    || "America/New_York",
  }, null, 2)};

export const NWS = ${JSON.stringify({
    office:      nws.office    || "OKX",
    grid_x:      nws.grid_x   || 33,
    grid_y:      nws.grid_y   || 37,
    alert_zone:  nws.alert_zone || "",
    obs_stations:nws.obs_stations || [],
    alert_url:   `https://api.weather.gov/alerts/active?area=${(j.state||"NY").toUpperCase()}`,
    forecast_url:`https://api.weather.gov/gridpoints/${nws.office||"OKX"}/${nws.grid_x||33},${nws.grid_y||37}/forecast`,
    hourly_url:  `https://api.weather.gov/gridpoints/${nws.office||"OKX"}/${nws.grid_x||33},${nws.grid_y||37}/forecast/hourly`,
    gridpoint_url:`https://api.weather.gov/gridpoints/${nws.office||"OKX"}/${nws.grid_x||33},${nws.grid_y||37}`,
  }, null, 2)};

export const COOPS_STATIONS = ${JSON.stringify(coops, null, 2)};

export const FLOOD_THRESHOLDS = ${JSON.stringify(
    Object.fromEntries(coops.map(s => [s.id, {name: s.name, ...(s.flood_thresholds||{})}])),
    null, 2
  )};

export const KNOWLEDGE_BASE = ${JSON.stringify({
    floodZones:             { label: "Flood Zones",             source: "FEMA / Local", data: kb.flood_zones || "" },
    evacZones:              { label: "Evacuation Zones",        source: "Local OEM",    data: kb.evac_zones  || "" },
    criticalInfrastructure: { label: "Critical Infrastructure", source: "Local OEM",    data: kb.critical_infrastructure || "" },
    hazardProfiles:         { label: "Hazard Profiles",         source: "Local HMP",    data: kb.hazard_profiles || "" },
    resources:              { label: "Contacts & Resources",    source: "Local OEM",    data: kb.resources  || "" },
  }, null, 2)};

export const MAP_LAYERS = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(mp).map(([key, cat]) => [key, {
        label:    cat.label    || key,
        color:    cat.color    || "#60a5fa",
        icon:     cat.icon     || "📍",
        features: (cat.features || []).map(f => ({
          name: f.name || "", lat: f.lat || 0, lng: f.lng || 0,
          note: f.note || "", borough: f.borough || ""
        }))
      }])
    ),
    null, 2
  )};

export const SOCRATA = ${JSON.stringify({
    domain:   soc.domain  || "data.cityofnewyork.us",
    presets:  soc.preset_datasets || [],
  }, null, 2)};

export const NOAA_STATES = ${JSON.stringify({
    alerts: noaa.alert_state || j.state || "NY",
    usgs:   noaa.usgs_state  || j.state || "NY",
    fema:   noaa.fema_state  || j.state || "NY",
  }, null, 2)};

export const BRANDING = ${JSON.stringify({
    appTitle:         brand.app_title    || "EMBER",
    appSubtitle:      brand.app_subtitle || "Emergency Management Body of Evidence & Resources",
    jurisdictionLine: brand.jurisdiction_line || `${j.short_name || j.name || "City"} JURISDICTION`,
    primaryColor:     brand.primary_color    || "#e8372c",
    logoEmoji:        brand.logo_emoji        || "🚨",
  }, null, 2)};
`
}

function defaultNYC() {
  return {
    name: "New York City", short_name: "NYC", state: "NY",
    center: [40.7128, -74.006], zoom: 10
  }
}

main().catch(console.error)

import { useState, useRef, useEffect, useCallback } from "react"

// ── All config and data inline — no module-level imports that can throw ───────

// Static import of jurisdiction config — generated at build time by scripts/build-config.js
import {
  JURISDICTION  as _J_raw,
  NWS           as _NWS_raw,
  KNOWLEDGE_BASE as _KB_raw,
  MAP_LAYERS    as _ML_raw,
  SOCRATA       as _SOC_raw,
  BRANDING      as _BR_raw,
  COOPS_STATIONS as _COOPS_raw,
} from "./config/jurisdiction.js"

const _J     = _J_raw     || {}
const _NWS   = _NWS_raw   || {}
const _KB    = _KB_raw    || {}
const _ML    = _ML_raw    || {}
const _SOC   = _SOC_raw   || {}
const _BR    = _BR_raw    || {}
const _COOPS = _COOPS_raw || []

const CFG = {
  name:       _J.name       || "New York City",
  shortName:  _J.short_name || "NYC",
  state:      _J.state      || "NY",
  center:     _J.center     || [40.7128, -74.006],
  zoom:       _J.zoom       || 10,
}
const NWS_ALERT_URL    = _NWS.alert_url    || `https://api.weather.gov/alerts/active?area=${CFG.state}`
const NWS_FORECAST_URL = _NWS.forecast_url || `https://api.weather.gov/gridpoints/OKX/33,37/forecast`
const SOCRATA_DOMAIN   = _SOC.domain       || "data.cityofnewyork.us"
const OLLAMA_HOST      = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OLLAMA_HOST  : null) || "https://ollama.com"
const OLLAMA_MODEL     = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OLLAMA_MODEL : null) || "gpt-oss:120b-cloud"
const OLLAMA_KEY       = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OLLAMA_API_KEY : null) || ""

// Default map layers (NYC hardcoded fallback if config not loaded)
const DEFAULT_MAP_LAYERS = {
  hospitals: { label:"Trauma Centers", color:"#f87171", icon:"🏥", features:[
    {name:"Bellevue Hospital",lat:40.7394,lng:-73.9754,note:"Level 1 Trauma | Manhattan"},
    {name:"Kings County Hospital",lat:40.6551,lng:-73.9444,note:"Level 1 Trauma | Brooklyn"},
    {name:"Lincoln Medical Center",lat:40.8168,lng:-73.9249,note:"Level 1 Trauma | Bronx"},
    {name:"Jamaica Hospital",lat:40.7003,lng:-73.7958,note:"Level 1 Trauma | Queens"},
    {name:"Staten Island University",lat:40.5766,lng:-74.1159,note:"Level 1 Trauma | SI"},
  ]},
  shelters: { label:"Evac Shelters", color:"#60a5fa", icon:"🏫", features:[
    {name:"Boys & Girls HS",lat:40.6797,lng:-73.9434,note:"Evac Center | Brooklyn"},
    {name:"Brandeis HS",lat:40.7960,lng:-73.9804,note:"Evac Center | Manhattan"},
    {name:"August Martin HS",lat:40.6719,lng:-73.7770,note:"Evac Center | Queens"},
    {name:"Lehman HS",lat:40.8780,lng:-73.8985,note:"Evac Center | Bronx"},
  ]},
  gauges: { label:"Stream Gauges", color:"#4ade80", icon:"📡", features:[
    {name:"Battery Park Tidal Gauge",lat:40.7003,lng:-74.0141,note:"NOAA 8518750 — primary NYC surge gauge"},
    {name:"Kings Point Tidal Gauge",lat:40.8105,lng:-73.7659,note:"NOAA 8516945 — Long Island Sound"},
    {name:"Sandy Hook, NJ",lat:40.4669,lng:-74.0094,note:"NOAA 8531680 — outer harbor"},
  ]},
  eoc: { label:"EOC / Command", color:"#facc15", icon:"🏛", features:[
    {name:"NYC EOC",lat:40.6967,lng:-73.9896,note:"Primary EOC — 165 Cadman Plaza East"},
    {name:"FEMA Region 2",lat:40.7143,lng:-74.0071,note:"26 Federal Plaza"},
  ]},
  floodRisk: { label:"Flood Risk Areas", color:"#fb923c", icon:"💧", features:[
    {name:"Red Hook, Brooklyn",lat:40.6745,lng:-74.0097,note:"Zone AE — flooded Sandy 2012"},
    {name:"Coney Island",lat:40.5755,lng:-73.9707,note:"Zone AE — 10ft+ surge Sandy"},
    {name:"Rockaway Peninsula",lat:40.5874,lng:-73.8261,note:"Zone VE/AE — highest surge risk"},
    {name:"Howard Beach",lat:40.6570,lng:-73.8378,note:"Zone AE — interior flood risk"},
    {name:"Lower Manhattan",lat:40.7074,lng:-74.0104,note:"Zone AE — subway/utility risk"},
  ]},
}
const MAP_LAYERS = (Object.keys(_ML).length > 0) ? _ML : DEFAULT_MAP_LAYERS

const DEFAULT_KB = {
  floodZones:{"label":"Flood Zones","source":"FEMA / NYC OEM","data":"Zone A: High-risk coastal/tidal — Lower Manhattan, Red Hook, Rockaway Peninsula, Staten Island east shore.\nZone AE: Special Flood Hazard Areas — Coney Island, Howard Beach, Broad Channel.\nZone VE: Coastal high-hazard with wave action — Far Rockaway, Breezy Point, Sea Gate.\nPost-Sandy 2012: ~88,000 buildings damaged; $19B damage."},
  evacZones:{"label":"Evacuation Zones","source":"NYC OEM","data":"Zone 1: Mandatory evacuation Cat 1+ hurricanes. Rockaways, Coney Island, Red Hook waterfront.\nZone 2: Advised Cat 2+. Zones 3–6: progressively lower risk inland.\nShelters: 30+ hurricane evacuation centers, ~600,000 capacity.\nContraflow: FDR Drive, BQE, Staten Island Expressway."},
  criticalInfrastructure:{"label":"Critical Infrastructure","source":"NYC OEM / CISA","data":"Hospitals: 11 Level 1 Trauma Centers — Bellevue, Kings County, Lincoln, Jamaica, Staten Island University.\nPower: ConEd East River substations critical. Underground feeders flooded during Sandy.\nSubway: 245 miles track, 472 stations. 52 stations in flood zones."},
  hazardProfiles:{"label":"Hazard Profiles","source":"NYC OEM HMP 2023","data":"HURRICANES: Sandy 2012 Cat 1 — $19B damage. Primary risk: storm surge.\nEXTREME HEAT: 115–150 deaths/year. Protocol at Heat Index ≥100°F.\nFLOODING: Ida 2021 — 13 deaths in basement apartments.\nWINTER STORMS: Jonas 2016 — 27 inches, travel ban."},
  resources:{"label":"Contacts & Resources","source":"NYC OEM","data":"NYC OEM: 718-422-8700 | nyc.gov/oem\nFDNY: 911 | 718-999-2000 | NYPD: 911 | 646-610-5000\nNWS OKX: 631-924-0517 | Con Edison: 1-800-75-CONED\nNotify NYC: nyc.gov/notifynyc"},
}
const KNOWLEDGE_BASE = (Object.keys(_KB).length > 0) ? _KB : DEFAULT_KB

const BRANDING = {
  appTitle: _BR.appTitle || "EMBER",
  jurisdictionLine: _BR.jurisdictionLine || `${CFG.shortName} EMERGENCY MANAGEMENT`,
  primaryColor: _BR.primaryColor || "#e8372c",
}

const LIVE_ENDPOINTS = [
  {name:`NWS Alerts — ${CFG.state}`,url:NWS_ALERT_URL,type:"weather"},
  {name:`NWS Forecast — ${CFG.shortName}`,url:NWS_FORECAST_URL,type:"forecast"},
  {name:"USGS Stream Gauges",url:`https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=${CFG.state.toLowerCase()}&parameterCd=00065&siteStatus=active`,type:"flood"},
  {name:"FEMA Disasters",url:`https://www.fema.gov/api/open/v2/disasterDeclarationsSummaries?state=${CFG.state}&$top=10&$orderby=declarationDate%20desc`,type:"fema"},
]

const KB_MODULES = [
  {id:"floodZones",label:"FLOOD ZONES"},
  {id:"evacZones",label:"EVAC ZONES"},
  {id:"criticalInfrastructure",label:"INFRASTRUCTURE"},
  {id:"hazardProfiles",label:"HAZARDS"},
  {id:"resources",label:"CONTACTS"},
]
const MAP_LAYER_TOGGLES = [
  {id:"floodRisk",label:"FLOOD RISK",color:"#fb923c"},
  {id:"gauges",label:"GAUGES",color:"#4ade80"},
  {id:"shelters",label:"SHELTERS",color:"#60a5fa"},
  {id:"hospitals",label:"TRAUMA CTR",color:"#f87171"},
  {id:"eoc",label:"EOC / CMD",color:"#facc15"},
]
const QUICK_QUERIES = [
  "Storm surge risk — Lower Manhattan",
  "Zone 1 evacuation assets at risk from Cat 2 hurricane",
  "Trauma centers and hospital surge capacity",
  `Current NWS weather alerts for ${CFG.shortName}`,
  "Heat emergency protocol — thresholds and cooling centers",
  "Flash flood response — basement apartment risk",
  "Critical infrastructure in FEMA Zone AE",
  "What are the current water levels at Battery Park?",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchLiveData(ep) {
  try {
    const r = await fetch(ep.url, { signal: AbortSignal.timeout(7000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return { success:true, data:await r.json(), name:ep.name, type:ep.type }
  } catch(e) { return { success:false, error:e.message, name:ep.name, type:ep.type } }
}

function summarizeAPIData(r) {
  if (!r.success) return `[${r.name}: unavailable — ${r.error}]`
  const d = r.data
  try {
    if (r.type === "weather" && d?.features) {
      const alerts = d.features.slice(0,3).map(f=>`${f.properties?.event} — ${(f.properties?.headline||"").substring(0,80)}`).join("; ")
      return `NWS Alerts (${CFG.state}): ${d.features.length} active. ${alerts || "None"}`
    }
    if (r.type === "forecast" && d?.properties?.periods) {
      return "NWS Forecast: " + d.properties.periods.slice(0,3).map(p=>`${p.name}: ${p.shortForecast}, ${p.temperature}°${p.temperatureUnit}`).join("; ")
    }
    if (r.type === "flood" && d?.value?.timeSeries) {
      return "USGS Gauges: " + d.value.timeSeries.slice(0,4).map(ts=>`${ts.sourceInfo?.siteName}: ${ts.values?.[0]?.value?.[0]?.value||"N/A"} ft`).join("; ")
    }
    return `[${r.name}: received]`
  } catch { return `[${r.name}: parse error]` }
}

function buildContext(files, apiResults, activeKB) {
  let ctx = `=== ${CFG.name.toUpperCase()} EMERGENCY MANAGEMENT KNOWLEDGE BASE ===\n\n`
  for (const [key, mod] of Object.entries(KNOWLEDGE_BASE)) {
    if (activeKB.includes(key)) ctx += `--- ${mod.label} [${mod.source}] ---\n${mod.data}\n\n`
  }
  if (apiResults.length) {
    ctx += `--- LIVE API DATA (${new Date().toUTCString()}) ---\n`
    apiResults.forEach(r => { ctx += summarizeAPIData(r) + "\n" })
    ctx += "\n"
  }
  if (files.length) {
    ctx += "--- UPLOADED DOCUMENTS ---\n"
    files.forEach(f => { ctx += `[${f.name}]\n${f.content.substring(0,4000)}\n\n` })
  }
  return ctx
}

async function* streamOllama(messages, context, signal) {
  if (!OLLAMA_KEY) {
    yield `⚠ No Ollama API key set.\n\nAdd VITE_OLLAMA_API_KEY to your Vercel environment variables.\nGet a key at: https://ollama.com/settings/keys`
    return
  }
  const system = `You are EMBER — Emergency Management Body of Evidence & Resources — an AI for ${CFG.name} emergency managers.\n\nKNOWLEDGE BASE:\n${context}\n\nRULES: Lead with critical info. Cite sources [NYC OEM] [NWS] [FEMA] [USGS]. Be concise. Never hallucinate.`
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${OLLAMA_KEY}`},
    body: JSON.stringify({ model:OLLAMA_MODEL, stream:true, messages:[{role:"system",content:system},...messages.slice(-10)] }),
    signal,
  })
  if (!res.ok) { yield `⚠ Ollama error ${res.status}: ${await res.text().catch(()=>"")}` ; return }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ""
  while (true) {
    const {done, value} = await reader.read()
    if (done) break
    buf += dec.decode(value, {stream:true})
    const lines = buf.split("\n") ; buf = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      try { const obj = JSON.parse(line) ; if (obj.message?.content) yield obj.message.content ; if (obj.done) return } catch {}
    }
  }
}

// ── Full NOAA endpoint catalogue ──────────────────────────────────────────────
const NOAA_ENDPOINTS = [
  // NWS
  {id:"nws_alerts",    cat:"NWS",    color:"#60a5fa", icon:"🌩", name:`Active Alerts — ${CFG.state}`,          url: NWS_ALERT_URL,                                                                                          mapKey:true},
  {id:"nws_alerts_sv", cat:"NWS",    color:"#60a5fa", icon:"🌩", name:"Extreme/Severe Alerts",                 url:`https://api.weather.gov/alerts/active?area=${CFG.state}&severity=Extreme,Severe&status=Actual`,         mapKey:true},
  {id:"nws_forecast",  cat:"NWS",    color:"#60a5fa", icon:"🌩", name:`7-Day Forecast — ${CFG.shortName}`,     url: NWS_FORECAST_URL},
  {id:"nws_hourly",    cat:"NWS",    color:"#60a5fa", icon:"🌩", name:"Hourly Forecast",                       url:`${NWS_FORECAST_URL}/hourly`},
  {id:"nws_grid",      cat:"NWS",    color:"#60a5fa", icon:"🌩", name:"Wind & Precip Grid",                    url:`https://api.weather.gov/gridpoints/${_NWS.office||"OKX"}/${_NWS.grid_x||33},${_NWS.grid_y||37}`},
  {id:"nws_obs_knyc",  cat:"NWS",    color:"#60a5fa", icon:"🌩", name:"Observations — Central Park",           url:"https://api.weather.gov/stations/KNYC/observations/latest",                                              mapKey:true},
  {id:"nws_obs_kjfk",  cat:"NWS",    color:"#60a5fa", icon:"🌩", name:"Observations — JFK Airport",            url:"https://api.weather.gov/stations/KJFK/observations/latest",                                              mapKey:true},
  // CO-OPS
  {id:"coops_battery", cat:"CO-OPS", color:"#34d399", icon:"🌊", name:"Water Level — The Battery",             url:"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=recent&station=8518750&product=water_level&datum=MLLW&time_zone=lst_ldt&units=english&format=json&application=EMBER", mapKey:true},
  {id:"coops_preds",   cat:"CO-OPS", color:"#34d399", icon:"🌊", name:"Tidal Predictions — Battery 48h",       url:"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&range=48&station=8518750&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&format=json&application=EMBER"},
  {id:"coops_kings",   cat:"CO-OPS", color:"#34d399", icon:"🌊", name:"Water Level — Kings Point",             url:"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8516945&product=water_level&datum=MLLW&time_zone=lst_ldt&units=english&format=json&application=EMBER", mapKey:true},
  {id:"coops_sandy",   cat:"CO-OPS", color:"#34d399", icon:"🌊", name:"Water Level — Sandy Hook",              url:"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8531680&product=water_level&datum=MLLW&time_zone=lst_ldt&units=english&format=json&application=EMBER", mapKey:true},
  {id:"coops_wind",    cat:"CO-OPS", color:"#34d399", icon:"🌊", name:"Wind — The Battery",                    url:"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8518750&product=wind&time_zone=lst_ldt&units=english&format=json&application=EMBER"},
  // SPC / SWPC
  {id:"spc_watches",   cat:"SPC",    color:"#f87171", icon:"⚡", name:"Active SPC Watches",                    url:"https://www.spc.noaa.gov/products/watch/ActiveWW.txt",                                                  text:true},
  {id:"spc_day1",      cat:"SPC",    color:"#f87171", icon:"⚡", name:"Day 1 Convective Outlook",              url:"https://www.spc.noaa.gov/products/outlook/day1otlk.txt",                                                text:true},
  {id:"swpc_alerts",   cat:"SWPC",   color:"#a78bfa", icon:"☀️", name:"Space Weather Alerts",                  url:"https://services.swpc.noaa.gov/products/alerts.json"},
  {id:"swpc_kp",       cat:"SWPC",   color:"#a78bfa", icon:"☀️", name:"Planetary K-Index",                     url:"https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"},
]

function summarizeNOAA(result) {
  if (!result?.ok) return result?.preview || "fetch failed"
  const d = result.data
  const ep = result.ep
  try {
    if (result.text) return String(d).substring(0, 300)
    if (d?.features && ep?.id?.includes("alert")) {
      const active = d.features.filter(f => f.properties?.status === "Actual")
      return `${active.length} active alert(s):\n` + active.slice(0,5).map(f => `  • ${f.properties?.event} (${f.properties?.severity}): ${(f.properties?.headline||"").substring(0,80)}`).join("\n")
    }
    if (d?.properties?.periods) return d.properties.periods.slice(0,4).map(p => `${p.name}: ${p.shortForecast}, ${p.temperature}°${p.temperatureUnit}`).join("\n")
    if (d?.data && ep?.id?.startsWith("coops_")) {
      const last = d.data[d.data.length - 1]
      const meta = d.metadata || {}
      return `${meta.name || ep.name}\nLatest: ${last?.v || "?"} ft MLLW @ ${last?.t || "?"}`
    }
    if (d?.predictions) return d.predictions.slice(0,6).map(p => `${p.type==="H"?"HIGH":"low "} ${p.v}ft @ ${p.t}`).join("\n")
    if (Array.isArray(d)) return `${d.length} records. First: ${JSON.stringify(d[0]).substring(0,120)}`
    return JSON.stringify(d).substring(0, 300)
  } catch(e) { return "parse error: " + e.message }
}

// ── Map component ─────────────────────────────────────────────────────────────

function MapPanel({ activeLayers, showRadar, showWind, liveReadings={}, onMarkerClick }) {
  const mapRef    = useRef(null)
  const leafRef   = useRef(null)
  const layerRefs = useRef({})
  const radarRef  = useRef(null)
  const windRef   = useRef(null)
  const [ready, setReady] = useState(false)
  const [radarTs, setRadarTs] = useState(null)

  useEffect(() => {
    if (leafRef.current) return
    import("leaflet").then(({default: L}) => {
      const map = L.map(mapRef.current, { center: CFG.center, zoom: CFG.zoom, zoomControl:true })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:'&copy; OpenStreetMap &copy; CARTO', maxZoom:19, subdomains:"abcd"
      }).addTo(map)

      // Radar
      const epoch5 = Math.floor(Date.now()/300000)
      const radarLayer = L.tileLayer(
        `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${epoch5}`,
        { opacity:0.65, attribution:'NEXRAD &copy; Iowa State MESONET' }
      )
      radarRef.current = radarLayer
      setRadarTs(new Date().toLocaleTimeString())

      // Wind group
      windRef.current = L.layerGroup()

      // Marker layers
      for (const [key, layer] of Object.entries(MAP_LAYERS)) {
        const group = L.layerGroup()
        const features = Array.isArray(layer.features) ? layer.features : []
        const color = layer.color || "#60a5fa"
        const icon  = layer.icon  || "📍"
        const label = layer.label || key
        features.forEach(f => {
          if (!f.lat || !f.lng) return
          const mk = L.marker([f.lat, f.lng], {
            icon: L.divIcon({
              className:"", iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
              html:`<div style="width:28px;height:28px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;box-shadow:0 0 8px ${color}44">${icon}</div>`
            })
          })
          mk.bindPopup(`<div style="font-family:monospace;font-size:12px"><b style="color:${color}">${icon} ${f.name}</b><br><span style="color:#aac;font-size:11px">${f.note||""}</span></div>`)
          mk.on("click", () => onMarkerClick?.({...f, layerLabel:label, color}))
          group.addLayer(mk)
        })
        layerRefs.current[key] = group
      }

      leafRef.current = map
      setReady(true)
    }).catch(e => console.error("Leaflet init failed:", e))
  }, [])

  // Layer visibility
  useEffect(() => {
    if (!ready || !leafRef.current) return
    const map = leafRef.current
    for (const [key, group] of Object.entries(layerRefs.current)) {
      activeLayers.includes(key) ? map.hasLayer(group)||group.addTo(map) : map.hasLayer(group)&&map.removeLayer(group)
    }
  }, [activeLayers, ready])

  // Radar
  useEffect(() => {
    if (!ready || !leafRef.current || !radarRef.current) return
    const map = leafRef.current
    showRadar ? map.hasLayer(radarRef.current)||radarRef.current.addTo(map) : map.hasLayer(radarRef.current)&&map.removeLayer(radarRef.current)
  }, [showRadar, ready])

  // Wind obs
  useEffect(() => {
    if (!ready || !showWind || !leafRef.current || !windRef.current) return
    const map = leafRef.current
    windRef.current.addTo(map)
    const STATIONS = [
      {id:"KNYC",name:"Central Park",lat:40.7789,lng:-73.9692},
      {id:"KJFK",name:"JFK Airport",lat:40.6413,lng:-73.7781},
      {id:"KEWR",name:"Newark",lat:40.6895,lng:-74.1745},
      {id:"KLGA",name:"LaGuardia",lat:40.7772,lng:-73.8726},
    ]
    Promise.all(STATIONS.map(s =>
      fetch(`https://api.weather.gov/stations/${s.id}/observations/latest`, {signal:AbortSignal.timeout(6000),headers:{"User-Agent":"EMBER/1.0"}})
        .then(r=>r.ok?r.json():null).then(d=>{
          if (!d) return null
          const p = d.properties
          return {...s,
            speedMph: p.windSpeed?.value!=null ? Math.round(p.windSpeed.value*0.621371) : null,
            gustMph:  p.windGust?.value!=null  ? Math.round(p.windGust.value*0.621371)  : null,
            dirDeg:   p.windDirection?.value   ?? null,
            desc:     p.textDescription        ?? "",
          }
        }).catch(()=>null)
    )).then(obs => {
      import("leaflet").then(({default:L}) => {
        windRef.current?.clearLayers()
        obs.filter(Boolean).forEach(o => {
          if (o.speedMph==null||o.dirDeg==null) return
          const color = o.speedMph<15?"#4ade80":o.speedMph<25?"#facc15":o.speedMph<40?"#fb923c":"#f87171"
          const toDir = (o.dirDeg+180)%360
          const mk = L.marker([o.lat,o.lng], {icon:L.divIcon({
            className:"", iconSize:[50,40], iconAnchor:[25,20],
            html:`<div style="display:flex;flex-direction:column;align-items:center;gap:1px"><div style="font-size:20px;transform:rotate(${toDir}deg);filter:drop-shadow(0 0 3px ${color}88)">↑</div><div style="font-size:9px;font-family:monospace;font-weight:700;color:${color};background:#07090dcc;padding:1px 3px;border-radius:2px">${o.speedMph}${o.gustMph?`g${o.gustMph}`:""}mph</div></div>`
          })})
          mk.bindPopup(`<div style="font-family:monospace;font-size:11px"><b style="color:${color}">${o.id} — ${o.name}</b><br>Wind: ${o.speedMph}mph from ${o.dirDeg}°${o.gustMph?` (gusts ${o.gustMph}mph)`:""}<br>${o.desc}</div>`)
          windRef.current?.addLayer(mk)
        })
      })
    })
  }, [showWind, ready])

  // Live readings → update gauge popups
  useEffect(() => {
    if (!ready || !Object.keys(liveReadings).length) return
    import("leaflet").then(({default:L}) => {
      const gaugeGroup = layerRefs.current.gauges
      if (!gaugeGroup) return
      gaugeGroup.eachLayer(mk => {
        const f = mk._emberFeature
        if (!f) return
        const key = Object.keys(liveReadings).find(k => !k.startsWith("__") && (k.toLowerCase().includes(f.name.split(",")[0].toLowerCase().split(" ")[0]) || f.name.toLowerCase().includes(k.toLowerCase().split(" at ")[0])))
        const reading = key ? liveReadings[key] : null
        if (!reading) return
        const statusColor = {flood:"#f87171",elevated:"#facc15",normal:"#4ade80"}[reading.status]||"#4ade80"
        mk.setPopupContent(`<div style="font-family:monospace;font-size:11px"><b style="color:${statusColor}">📡 ${f.name}</b><br><span style="color:#aac">${f.note}</span><br><br><b style="color:${statusColor}">${reading.level} ${reading.unit}</b> <span style="color:#556;font-size:9px">${(reading.status||"").toUpperCase()}</span><br><span style="color:#446;font-size:9px">${reading.source} · live</span></div>`)
        mk.setIcon(L.divIcon({className:"",iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16],html:`<div style="width:28px;height:28px;border-radius:50%;background:${statusColor}22;border:2px solid ${statusColor};display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;box-shadow:0 0 8px ${statusColor}44">📡</div>`}))
      })
    })
  }, [liveReadings, ready])

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <div ref={mapRef} style={{width:"100%",height:"100%"}} />
      {radarTs && showRadar && (
        <div style={{position:"absolute",bottom:28,left:10,zIndex:1000,background:"#07090dcc",color:"#60a5fa",fontFamily:"monospace",fontSize:9,padding:"2px 8px",borderRadius:4,border:"1px solid #60a5fa33",pointerEvents:"none"}}>
          📡 NEXRAD · {radarTs}
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages]         = useState([{role:"assistant",content:`${BRANDING.appTitle} initialized — ${CFG.name}\nBackend: Ollama Cloud · ${OLLAMA_MODEL}${!OLLAMA_KEY?" · ⚠ NO API KEY SET":""}\n\nKnowledge base loaded · Map ready · ESRI search available\nClick a map marker or type a query to begin.`}])
  const [input, setInput]               = useState("")
  const [streaming, setStreaming]       = useState(false)
  const [activeKB, setActiveKB]         = useState(["floodZones","evacZones","criticalInfrastructure","hazardProfiles","resources"])
  const [activeMapLayers, setActiveLayers] = useState(["floodRisk","hospitals","shelters","gauges","eoc"])
  const [showRadar, setShowRadar]       = useState(true)
  const [showWind, setShowWind]         = useState(true)
  const [files, setFiles]               = useState([])
  const [esriItems, setEsriItems]       = useState([])
  const [noaaItems, setNoaaItems]       = useState([])
  const [apiResults, setApiResults]     = useState([])
  const [apiStatus, setApiStatus]       = useState("idle")
  const [fetching, setFetching]         = useState(false)
  const [rightTab, setRightTab]         = useState("chat")
  const [noaaCat, setNoaaCat]           = useState("ALL")
  const [noaaCache, setNoaaCache]       = useState({})
  const [showQuick, setShowQuick]       = useState(false)
  const [mapWidth, setMapWidth]         = useState(42)
  const [liveReadings, setLiveReadings] = useState({})
  const abortRef   = useRef(null)
  const fileInputRef = useRef(null)
  const endRef     = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages])

  const fetchAPIs = async () => {
    setFetching(true)
    const results = await Promise.all(LIVE_ENDPOINTS.map(fetchLiveData))
    setApiResults(results)
    setApiStatus(results.some(r=>r.success)?"live":"error")
    // Extract live readings for map
    const readings = {}
    for (const r of results) {
      if (!r.success) continue
      if (r.type==="flood" && r.data?.value?.timeSeries) {
        for (const ts of r.data.value.timeSeries) {
          const site = ts.sourceInfo?.siteName||""
          const val  = ts.values?.[0]?.value?.[0]?.value
          if (val!=null) readings[site] = {level:parseFloat(val).toFixed(2),unit:"ft",source:"USGS",status:parseFloat(val)>10?"flood":parseFloat(val)>5?"elevated":"normal"}
        }
      }
    }
    setLiveReadings(readings)
    setFetching(false)
  }

  const sendQuery = useCallback(async (override) => {
    const q = (override||input).trim()
    if (!q||streaming) return
    setInput("") ; setShowQuick(false) ; setRightTab("chat")
    const userMsg = {role:"user",content:q}
    setMessages(p=>[...p,userMsg])
    setStreaming(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const ctx = buildContext(files, apiResults, activeKB)
      + (noaaItems.length ? "--- NOAA DATA ---\n"+noaaItems.map(i=>i.content).join("\n\n")+"\n\n" : "")
      + (esriItems.length ? "--- ESRI LAYERS ---\n"+esriItems.map(i=>i.content).join("\n\n")+"\n" : "")
    const msgs = [...messages, userMsg].map(m=>({role:m.role,content:m.content}))
    let full = ""
    setMessages(p=>[...p,{role:"assistant",content:"▋"}])
    try {
      for await (const token of streamOllama(msgs, ctx, abortRef.current.signal)) {
        full += token
        setMessages(p=>[...p.slice(0,-1),{role:"assistant",content:full+"▋"}])
      }
    } catch(e) {
      if (e.name!=="AbortError") full += `\n\n⚠ Error: ${e.message}`
    }
    setMessages(p=>[...p.slice(0,-1),{role:"assistant",content:full}])
    setStreaming(false)
  }, [input, streaming, messages, files, apiResults, activeKB, noaaItems, esriItems])

  const ingestFile = useCallback(file => {
    const reader = new FileReader()
    reader.onload = e => setFiles(p=>[...p,{name:file.name,content:e.target.result}])
    reader.readAsText(file)
  }, [])

  // ── Styles ────────────────────────────────────────────────────────────────
  const pill = (label, active, onClick, color="#4ade80") => (
    <button key={label} onClick={onClick} style={{padding:"2px 9px",borderRadius:10,fontSize:9,fontWeight:700,border:`1px solid ${active?color+"66":"#1a1e28"}`,background:active?color+"15":"transparent",color:active?color:"#334",cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.05em",transition:"all 0.1s"}}>
      {label}
    </button>
  )

  const statusDot = (ok, label) => (
    <span style={{display:"flex",alignItems:"center",gap:4}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:ok===true?"#4ade80":ok===false?"#f87171":"#334",flexShrink:0,boxShadow:ok===true?"0 0 6px #4ade8088":ok===false?"0 0 6px #f8717188":"none"}}/>
      <span style={{color:ok===true?"#4ade80":ok===false?"#f87171":"#334"}}>{label}</span>
    </span>
  )

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#07090d",color:"#e0e0e8",fontFamily:"'IBM Plex Mono',monospace",overflow:"hidden"}}>

      {/* Header */}
      <div style={{flexShrink:0,padding:"10px 18px",borderBottom:"1px solid #111820",background:"#090c12",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,background:BRANDING.primaryColor,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff"}}>E</div>
          <span style={{fontWeight:700,letterSpacing:"0.14em",fontSize:14,color:"#fff"}}>{BRANDING.appTitle}</span>
          <span style={{fontSize:9,color:"#2a2e3a",letterSpacing:"0.06em"}}>{BRANDING.jurisdictionLine} · v2.0</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center",fontSize:9.5}}>
          {statusDot(true,"ACTIVE")}
          {statusDot(!!OLLAMA_KEY, OLLAMA_KEY?`OLLAMA · ${OLLAMA_MODEL}`:"NO API KEY")}
          {statusDot(apiStatus==="live"?true:apiStatus==="error"?false:null, apiStatus==="live"?"FEEDS LIVE":apiStatus==="error"?"FEED ERR":"FEEDS IDLE")}
        </div>
      </div>

      {!OLLAMA_KEY && (
        <div style={{flexShrink:0,background:"#1a0808",borderBottom:"1px solid #3a1010",padding:"5px 18px",fontSize:10,color:"#f87171"}}>
          ⚠ No Ollama API key — set VITE_OLLAMA_API_KEY in Vercel environment variables · <a href="https://ollama.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{color:"#f87171"}}>Get key</a>
        </div>
      )}

      {/* Control rail */}
      <div style={{flexShrink:0,padding:"6px 18px",borderBottom:"1px solid #0f1218",background:"#090c12",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:8.5,color:"#2a2e3a",fontWeight:700,letterSpacing:"0.1em",marginRight:3}}>KB</span>
        {KB_MODULES.map(m => pill(m.label, activeKB.includes(m.id), ()=>setActiveKB(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])))}
        <div style={{width:1,height:14,background:"#1a1e28",margin:"0 4px"}}/>
        <span style={{fontSize:8.5,color:"#2a2e3a",fontWeight:700,letterSpacing:"0.1em",marginRight:3}}>MAP</span>
        {MAP_LAYER_TOGGLES.map(m => pill(m.label, activeMapLayers.includes(m.id), ()=>setActiveLayers(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id]), m.color))}
        <div style={{width:1,height:14,background:"#1a1e28",margin:"0 4px"}}/>
        <span style={{fontSize:8.5,color:"#2a2e3a",fontWeight:700,letterSpacing:"0.1em",marginRight:3}}>WX</span>
        {pill("NEXRAD RADAR", showRadar, ()=>setShowRadar(p=>!p), "#3b82f6")}
        {pill("WIND OBS", showWind, ()=>setShowWind(p=>!p), "#4ade80")}
        <div style={{marginLeft:"auto",display:"flex",gap:7}}>
          <button onClick={fetchAPIs} disabled={fetching} style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,fontWeight:700,border:"1.5px solid #4ade8044",background:"transparent",color:"#4ade80",cursor:"pointer",fontFamily:"inherit",opacity:fetching?0.5:1}}>
            {fetching?"↺…":"↺ LIVE FEEDS"}
          </button>
          <button onClick={()=>fileInputRef.current?.click()} style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,fontWeight:700,border:"1.5px solid #60a5fa44",background:"transparent",color:"#60a5fa",cursor:"pointer",fontFamily:"inherit"}}>⬆ INGEST</button>
          <input ref={fileInputRef} type="file" multiple accept=".txt,.csv,.json,.geojson,.md" onChange={e=>Array.from(e.target.files).forEach(ingestFile)} style={{display:"none"}}/>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}>

        {/* Map panel */}
        <div style={{width:`${mapWidth}%`,flexShrink:0,borderRight:"1px solid #111820",position:"relative"}}>
          <MapPanel activeLayers={activeMapLayers} showRadar={showRadar} showWind={showWind} liveReadings={liveReadings} onMarkerClick={m=>{setRightTab("chat");sendQuery(`Tell me about emergency considerations for ${m.name} — ${m.note}`)}} />
          {/* Resize handle */}
          <div onMouseDown={e=>{
            const startX=e.clientX,startW=mapWidth
            const onMove=ev=>{const dx=ev.clientX-startX;setMapWidth(Math.max(25,Math.min(65,startW+dx/window.innerWidth*100)))}
            const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp)}
            document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp)
          }} style={{position:"absolute",top:0,right:0,width:6,height:"100%",cursor:"col-resize",zIndex:10,background:"transparent"}} />
        </div>

        {/* Right panel */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0}}>

          {/* Tab bar */}
          <div style={{flexShrink:0,display:"flex",borderBottom:"1px solid #111820",background:"#090c12"}}>
            {[{id:"chat",label:"💬 CHAT"},{id:"noaa",label:"📡 NOAA"},{id:"esri",label:"⊕ ESRI"}].map(t=>(
              <button key={t.id} onClick={()=>setRightTab(t.id)} style={{padding:"8px 18px",background:rightTab===t.id?"#0d1117":"transparent",color:rightTab===t.id?"#e0e0e8":"#334",border:"none",borderBottom:rightTab===t.id?"2px solid #4ade80":"2px solid transparent",fontFamily:"inherit",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:"0.06em"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Chat tab */}
          {rightTab==="chat" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
                {messages.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{flexShrink:0,width:22,height:22,borderRadius:"50%",background:m.role==="assistant"?"#e8372c15":"#60a5fa15",border:`1px solid ${m.role==="assistant"?"#e8372c44":"#60a5fa44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,marginTop:1}}>
                      {m.role==="assistant"?"E":"U"}
                    </div>
                    <div style={{flex:1,fontSize:12,lineHeight:1.65,color:m.role==="assistant"?"#d0d0dc":"#a0b0cc",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={endRef}/>
              </div>

              {/* Quick queries */}
              <div style={{flexShrink:0,padding:"6px 18px",borderTop:"1px solid #0f1218"}}>
                <button onClick={()=>setShowQuick(p=>!p)} style={{fontSize:9,color:"#334",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                  {showQuick?"▾":"▸"} Quick Queries
                </button>
                {showQuick && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                    {QUICK_QUERIES.map((q,i)=>(
                      <button key={i} onClick={()=>sendQuery(q)} style={{padding:"3px 10px",borderRadius:4,fontSize:9.5,border:"1px solid #1a1e28",background:"#0d1117",color:"#556",cursor:"pointer",fontFamily:"inherit"}}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{flexShrink:0,padding:"10px 18px",borderTop:"1px solid #111820",display:"flex",gap:8}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendQuery())} placeholder={`Incident type + location… e.g. 'Cat 2 hurricane at Coney Island'`} style={{flex:1,background:"#0d1117",border:"1px solid #1a1e28",borderRadius:6,padding:"8px 12px",color:"#e0e0e8",fontFamily:"inherit",fontSize:12,outline:"none"}}/>
                <button onClick={()=>streaming?abortRef.current?.abort():sendQuery()} style={{padding:"8px 16px",borderRadius:6,background:streaming?"#1a0808":"#e8372c",border:"none",color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {streaming?"◼ STOP":"▶ SEND"}
                </button>
              </div>
            </div>
          )}

          {/* NOAA tab — full endpoint list */}
          {rightTab==="noaa" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{flexShrink:0,padding:"12px 18px 8px",borderBottom:"1px solid #111820"}}>
                <div style={{color:"#4ade80",fontWeight:700,marginBottom:4}}>📡 NOAA Data Stack</div>
                <div style={{fontSize:9.5,color:"#556"}}>NWS · CO-OPS · SPC · SWPC · No API key required · Fetched data auto-added to KB</div>
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {["ALL","NWS","CO-OPS","SPC","SWPC"].map(cat=>(
                    <button key={cat} onClick={()=>setNoaaCat(cat)} style={{padding:"2px 10px",borderRadius:10,fontSize:9,fontWeight:700,border:`1px solid ${noaaCat===cat?"#4ade8066":"#1a1e28"}`,background:noaaCat===cat?"#4ade8015":"transparent",color:noaaCat===cat?"#4ade80":"#334",cursor:"pointer",fontFamily:"inherit"}}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"10px 18px"}}>
                {NOAA_ENDPOINTS.filter(ep=>noaaCat==="ALL"||ep.cat===noaaCat).map(ep=>(
                  <NOAAEndpointRow key={ep.id} ep={ep} cached={noaaCache[ep.id]} onFetch={result=>{
                    setNoaaCache(p=>({...p,[ep.id]:result}))
                    if (result.ok) {
                      const summary = summarizeNOAA(result)
                      const content = `[NOAA: ${ep.name}]\nFetched: ${new Date().toLocaleTimeString()}\nSource: ${ep.url}\n\n${summary}`
                      setNoaaItems(p=>{
                        const existing = p.findIndex(x=>x.itemId===ep.id)
                        const entry = {name:`NOAA: ${ep.name}`,itemId:ep.id,content,mapKey:ep.mapKey||false}
                        if (existing>=0){const n=[...p];n[existing]=entry;return n}
                        return [...p,entry]
                      })
                    }
                  }}/>
                ))}
                {noaaItems.length>0 && (
                  <div style={{marginTop:12,borderTop:"1px solid #111820",paddingTop:10}}>
                    <div style={{fontSize:9.5,color:"#4ade80",fontWeight:700,marginBottom:6}}>{noaaItems.length} feed(s) in KB · auto-updated on fetch:</div>
                    {noaaItems.map((item,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:9.5,color:item.mapKey?"#34d399":"#4ade80",background:item.mapKey?"#34d39912":"#4ade8012",padding:"2px 8px",borderRadius:10,border:`1px solid ${item.mapKey?"#34d39933":"#4ade8033"}`}}>
                          {item.mapKey?"🗺 ":""}{item.name.substring(0,44)}
                        </span>
                        <button onClick={()=>setNoaaItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:10}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ESRI tab — simplified inline */}
          {rightTab==="esri" && (
            <ESRIPanel onInject={item=>{
              setEsriItems(p=>p.find(x=>x.itemId===item.itemId)?p:[...p,item])
              setMessages(p=>[...p,{role:"assistant",content:`✓ ESRI layer added: ${item.name}. Try: "What does this layer cover?"`}])
              setRightTab("chat")
            }} esriItems={esriItems} onRemove={i=>setEsriItems(p=>p.filter((_,j)=>j!==i))}/>
          )}

        </div>
      </div>
    </div>
  )
}

// ── NOAA row component ────────────────────────────────────────────────────────
function NOAAEndpointRow({ep, cached, onFetch}) {
  const [loading, setLoading] = useState(false)

  const doFetch = async () => {
    setLoading(true)
    try {
      const r = await fetch(ep.url, {signal:AbortSignal.timeout(10000),headers:{"User-Agent":"EMBER/1.0"}})
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const ct = r.headers.get("content-type")||""
      const isText = ep.text || ct.includes("text/plain")
      const data = isText ? await r.text() : await r.json()
      const ts = new Date().toLocaleTimeString()
      onFetch({ok:true, data, text:isText, ep, ts, preview: isText ? String(data).substring(0,150) : JSON.stringify(data).substring(0,150)})
    } catch(e) {
      onFetch({ok:false, error:e.message, ep})
    }
    setLoading(false)
  }

  const color = ep.color || "#4ade80"
  const isInKB = !!cached?.ok

  return (
    <div style={{marginBottom:8,padding:"8px 10px",background:"#0d1117",border:`1px solid ${isInKB?"#1e2e20":"#1a1e28"}`,borderLeft:`3px solid ${color}`,borderRadius:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
        <div>
          <span style={{fontSize:10,color:"#dde",fontWeight:700}}>{ep.icon} {ep.name}</span>
          {ep.mapKey && <span style={{marginLeft:6,fontSize:8,padding:"1px 5px",borderRadius:8,background:"#34d39912",color:"#34d399",border:"1px solid #34d39933"}}>🗺 MAP</span>}
          {isInKB && <span style={{marginLeft:4,fontSize:8,padding:"1px 5px",borderRadius:8,background:"#4ade8012",color:"#4ade80",border:"1px solid #4ade8033"}}>✓ KB</span>}
        </div>
        {cached && <span style={{fontSize:8,color:cached.ok?"#4ade80":"#f87171",flexShrink:0}}>{"● "+(cached.ok?"OK @ "+(cached.ts||""):"ERR")}</span>}
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        <button onClick={doFetch} disabled={loading} style={{padding:"2px 10px",borderRadius:4,fontSize:9,border:`1px solid ${color}33`,background:"transparent",color,cursor:"pointer",fontFamily:"inherit",opacity:loading?0.5:1}}>
          {loading?"…":"▶ Fetch"}
        </button>
        <a href={ep.url} target="_blank" rel="noopener noreferrer" style={{padding:"2px 8px",borderRadius:4,fontSize:9,border:"1px solid #1a1e28",color:"#556",textDecoration:"none"}}>↗</a>
      </div>
      {cached?.preview && <div style={{marginTop:5,fontSize:9,color:color+"88",fontFamily:"monospace",wordBreak:"break-all"}}>{cached.preview.substring(0,100)}{cached.preview.length>100?"…":""}</div>}
    </div>
  )
}

// ── ESRI panel component ──────────────────────────────────────────────────────
function ESRIPanel({onInject, esriItems, onRemove}) {
  const [query, setQuery]     = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal]     = useState(0)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({f:"json",q:`${query} access:public`,num:"8",sortField:"relevance",sortOrder:"desc"})
      const r = await fetch(`https://www.arcgis.com/sharing/rest/search?${params}`, {signal:AbortSignal.timeout(10000)})
      const d = await r.json()
      setResults(d.results||[])
      setTotal(d.total||0)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const injectedIds = new Set(esriItems.map(i=>i.itemId))

  return (
    <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
      <div style={{color:"#a78bfa",fontWeight:700,marginBottom:8}}>⊕ ESRI / Living Atlas</div>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search ArcGIS Online…" style={{flex:1,background:"#0d1117",border:"1px solid #1a1e28",borderRadius:4,padding:"6px 10px",color:"#e0e0e8",fontFamily:"inherit",fontSize:11,outline:"none"}}/>
        <button onClick={search} disabled={loading} style={{padding:"6px 14px",borderRadius:4,fontSize:10,border:"1px solid #a78bfa33",background:"transparent",color:"#a78bfa",cursor:"pointer",fontFamily:"inherit",opacity:loading?0.5:1}}>
          {loading?"…":"🔍 Search"}
        </button>
      </div>
      {total>0 && <div style={{fontSize:9,color:"#334",marginBottom:8}}>{total.toLocaleString()} results</div>}
      {results.map(item=>(
        <div key={item.id} style={{marginBottom:8,padding:"8px 10px",background:"#0d1117",border:"1px solid #1a1e28",borderRadius:6}}>
          <div style={{display:"flex",gap:4,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:"#60a5fa12",color:"#60a5fa",border:"1px solid #60a5fa22"}}>{item.type}</span>
            {"esri" in (item.owner||"").toLowerCase() && <span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:"#a78bfa12",color:"#a78bfa",border:"1px solid #a78bfa22"}}>Living Atlas</span>}
            {injectedIds.has(item.id) && <span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:"#4ade8012",color:"#4ade80",border:"1px solid #4ade8022"}}>✓ In KB</span>}
          </div>
          <div style={{fontSize:10.5,color:"#dde",fontWeight:700,marginBottom:2}}>{item.title}</div>
          <div style={{fontSize:9.5,color:"#556",marginBottom:6}}>{(item.snippet||"").substring(0,120)}</div>
          <div style={{display:"flex",gap:5}}>
            {!injectedIds.has(item.id) ? (
              <button onClick={()=>{
                const tags = (item.tags||[]).join(", ")
                const content = `[ESRI: ${item.title}]\nType: ${item.type}\nOwner: ${item.owner}\nSnippet: ${item.snippet||""}\nTags: ${tags}\nURL: ${item.url||""}\nItem ID: ${item.id}`
                onInject({name:`ESRI: ${item.title}`,itemId:item.id,content})
              }} style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,border:"1px solid #a78bfa33",background:"transparent",color:"#a78bfa",cursor:"pointer",fontFamily:"inherit"}}>
                + Add to KB
              </button>
            ) : (
              <button disabled style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,border:"1px solid #33334433",background:"transparent",color:"#334",fontFamily:"inherit"}}>✓ In KB</button>
            )}
            <a href={`https://www.arcgis.com/home/item.html?id=${item.id}`} target="_blank" rel="noopener noreferrer" style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,border:"1px solid #33334433",color:"#556",textDecoration:"none"}}>↗ AGOL</a>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{padding:"2px 10px",borderRadius:4,fontSize:9.5,border:"1px solid #33334433",color:"#556",textDecoration:"none"}}>↗ Service</a>}
          </div>
        </div>
      ))}
      {esriItems.length>0 && (
        <div style={{marginTop:16,borderTop:"1px solid #111820",paddingTop:12}}>
          <div style={{fontSize:9.5,color:"#a78bfa",fontWeight:700,marginBottom:6}}>{esriItems.length} layer(s) in KB:</div>
          {esriItems.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:9.5,color:"#a78bfa",background:"#a78bfa12",padding:"2px 8px",borderRadius:10,border:"1px solid #a78bfa33"}}>{item.name.substring(0,40)}</span>
              <button onClick={()=>onRemove(i)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:10}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

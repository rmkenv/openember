// Auto-generated from config/jurisdiction.yaml — do not edit directly
// Run: node scripts/build-config.js to regenerate

export const JURISDICTION = {
  "name": "New York City",
  "short_name": "NYC",
  "state": "NY",
  "state_full": "New York",
  "county": "New York County",
  "center": [
    40.7128,
    -74.006
  ],
  "bbox": {
    "north": 41.0,
    "south": 40.4,
    "east": -73.7,
    "west": -74.3
  },
  "zoom": 10,
  "timezone": "America/New_York"
};

export const NWS = {
  "office": "OKX",
  "grid_x": 33,
  "grid_y": 37,
  "alert_zone": "NYZ178",
  "obs_stations": [
    {
      "id": "KNYC",
      "name": "Central Park",
      "lat": 40.7789,
      "lng": -73.9692
    },
    {
      "id": "KJFK",
      "name": "JFK Airport",
      "lat": 40.6413,
      "lng": -73.7781
    },
    {
      "id": "KEWR",
      "name": "Newark",
      "lat": 40.6895,
      "lng": -74.1745
    },
    {
      "id": "KLGA",
      "name": "LaGuardia",
      "lat": 40.7772,
      "lng": -73.8726
    }
  ],
  "alert_url": "https://api.weather.gov/alerts/active?area=NY",
  "forecast_url": "https://api.weather.gov/gridpoints/OKX/33,37/forecast",
  "hourly_url": "https://api.weather.gov/gridpoints/OKX/33,37/forecast/hourly",
  "gridpoint_url": "https://api.weather.gov/gridpoints/OKX/33,37"
};

export const COOPS_STATIONS = [
  {
    "id": "8518750",
    "name": "The Battery",
    "lat": 40.7003,
    "lng": -74.0141,
    "is_primary": true,
    "flood_thresholds": {
      "action": 4.5,
      "minor": 5.5,
      "moderate": 6.5,
      "major": 8.5
    }
  },
  {
    "id": "8516945",
    "name": "Kings Point",
    "lat": 40.8105,
    "lng": -73.7659,
    "flood_thresholds": {
      "action": 4.5,
      "minor": 5.5,
      "moderate": 6.5,
      "major": 8.5
    }
  },
  {
    "id": "8531680",
    "name": "Sandy Hook",
    "lat": 40.4669,
    "lng": -74.0094,
    "flood_thresholds": {
      "action": 4.5,
      "minor": 5.5,
      "moderate": 6.5,
      "major": 8.5
    }
  },
  {
    "id": "8518995",
    "name": "Governors Island",
    "lat": 40.69,
    "lng": -74.0167,
    "flood_thresholds": {
      "action": 4.5,
      "minor": 5.5,
      "moderate": 6.5,
      "major": 8.5
    }
  }
];

export const FLOOD_THRESHOLDS = {
  "8518750": {
    "name": "The Battery",
    "action": 4.5,
    "minor": 5.5,
    "moderate": 6.5,
    "major": 8.5
  },
  "8516945": {
    "name": "Kings Point",
    "action": 4.5,
    "minor": 5.5,
    "moderate": 6.5,
    "major": 8.5
  },
  "8531680": {
    "name": "Sandy Hook",
    "action": 4.5,
    "minor": 5.5,
    "moderate": 6.5,
    "major": 8.5
  },
  "8518995": {
    "name": "Governors Island",
    "action": 4.5,
    "minor": 5.5,
    "moderate": 6.5,
    "major": 8.5
  }
};

export const KNOWLEDGE_BASE = {
  "floodZones": {
    "label": "Flood Zones",
    "source": "FEMA / Local",
    "data": "Zone A: High-risk coastal/tidal flood areas \u2014 Lower Manhattan, Red Hook (Brooklyn), Rockaway Peninsula (Queens), Staten Island east shore.\nZone AE: Special Flood Hazard Areas \u2014 Coney Island, Howard Beach, Broad Channel, southern Staten Island.\nZone VE: Coastal high-hazard with wave action \u2014 Far Rockaway, Breezy Point, Sea Gate.\nZone X (shaded): Moderate flood risk, 0.2% annual chance.\nPost-Sandy (2012): ~88,000 buildings damaged; $19B in damage.\n"
  },
  "evacZones": {
    "label": "Evacuation Zones",
    "source": "Local OEM",
    "data": "Zone 1: Mandatory evacuation Cat 1+ hurricanes. Rockaways, Coney Island, South Beach SI, Red Hook waterfront.\nZone 2: Evacuation advised Cat 2+. Zones 3-6: progressively lower risk inland.\nShelters: 30+ hurricane evacuation centers, ~600,000 primary capacity.\nContraflow: FDR Drive, BQE, Staten Island Expressway.\n"
  },
  "criticalInfrastructure": {
    "label": "Critical Infrastructure",
    "source": "Local OEM",
    "data": "Hospitals: 11 Level 1 Trauma Centers \u2014 Bellevue (Manhattan), Kings County (Brooklyn), Lincoln (Bronx), Staten Island University, Jamaica (Queens).\nPower: ConEd East River substations critical. Underground feeders in Lower Manhattan flooded during Sandy.\nSubway: 245 miles track, 472 stations. 52 stations in flood zones.\nWater: DEP 14 reservoirs, 2 city tunnels. Newtown Creek & North River WWTPs flooded in Sandy.\nAirports: JFK (Zone A/AE), LaGuardia (Zone A).\n"
  },
  "hazardProfiles": {
    "label": "Hazard Profiles",
    "source": "Local HMP",
    "data": "HURRICANES: Sandy (2012, Cat 1) \u2014 $19B damage. Primary risk: storm surge.\nEXTREME HEAT: 115-150 deaths/year. Protocol at Heat Index >= 100F. 500+ cooling centers.\nFLOODING: Ida 2021 \u2014 13 deaths in basement apartments. 22,000+ miles combined sewer.\nWINTER STORMS: Jonas 2016 \u2014 27 inches, travel ban. 2,300 Sanitation plows.\nEARTHQUAKE: Low risk. Historical 1884 M5.5. Unreinforced masonry stock pre-1930.\nTERRORISM/HAZMAT: Highest-risk US city (DHS). JTTF, NYPD Intelligence, FDNY HazMat.\n"
  },
  "resources": {
    "label": "Contacts & Resources",
    "source": "Local OEM",
    "data": "NYC OEM: 718-422-8700 | nyc.gov/oem | EOC: 165 Cadman Plaza East, Brooklyn\nFDNY: 911 | 718-999-2000 | NYPD: 911 | 646-610-5000\nNYC Health: 311 | FEMA Region 2: 212-680-3600\nNWS OKX: 631-924-0517 | Con Edison: 1-800-75-CONED\nNotify NYC: nyc.gov/notifynyc\n"
  }
};

export const MAP_LAYERS = {
  "hospitals": {
    "label": "Trauma Centers",
    "color": "#f87171",
    "icon": "\ud83c\udfe5",
    "features": [
      {
        "name": "Bellevue Hospital",
        "lat": 40.7394,
        "lng": -73.9754,
        "note": "Level 1 Trauma | Manhattan",
        "borough": ""
      },
      {
        "name": "Kings County Hospital",
        "lat": 40.6551,
        "lng": -73.9444,
        "note": "Level 1 Trauma | Brooklyn",
        "borough": ""
      },
      {
        "name": "Lincoln Medical Center",
        "lat": 40.8168,
        "lng": -73.9249,
        "note": "Level 1 Trauma | Bronx",
        "borough": ""
      },
      {
        "name": "Jamaica Hospital",
        "lat": 40.7003,
        "lng": -73.7958,
        "note": "Level 1 Trauma | Queens",
        "borough": ""
      },
      {
        "name": "Staten Island University",
        "lat": 40.5766,
        "lng": -74.1159,
        "note": "Level 1 Trauma | Staten Island",
        "borough": ""
      },
      {
        "name": "Maimonides Medical Center",
        "lat": 40.6356,
        "lng": -73.9985,
        "note": "Level 1 Trauma | Brooklyn",
        "borough": ""
      }
    ]
  },
  "shelters": {
    "label": "Evac Shelters",
    "color": "#60a5fa",
    "icon": "\ud83c\udfeb",
    "features": [
      {
        "name": "Boys & Girls HS",
        "lat": 40.6797,
        "lng": -73.9434,
        "note": "Evac Center | Brooklyn",
        "borough": ""
      },
      {
        "name": "Brandeis HS",
        "lat": 40.796,
        "lng": -73.9804,
        "note": "Evac Center | Manhattan",
        "borough": ""
      },
      {
        "name": "August Martin HS",
        "lat": 40.6719,
        "lng": -73.777,
        "note": "Evac Center | Queens",
        "borough": ""
      },
      {
        "name": "PS 14 Staten Island",
        "lat": 40.6285,
        "lng": -74.0754,
        "note": "Evac Center | Zone 1",
        "borough": ""
      },
      {
        "name": "Lehman HS",
        "lat": 40.878,
        "lng": -73.8985,
        "note": "Evac Center | Bronx",
        "borough": ""
      }
    ]
  },
  "gauges": {
    "label": "Stream Gauges",
    "color": "#4ade80",
    "icon": "\ud83d\udce1",
    "features": [
      {
        "name": "Battery Park Tidal Gauge",
        "lat": 40.7003,
        "lng": -74.0141,
        "note": "NOAA 8518750 \u2014 primary NYC surge gauge",
        "borough": ""
      },
      {
        "name": "Kings Point Tidal Gauge",
        "lat": 40.8105,
        "lng": -73.7659,
        "note": "NOAA 8516945 \u2014 Long Island Sound",
        "borough": ""
      },
      {
        "name": "Jamaica Bay (Inwood)",
        "lat": 40.6226,
        "lng": -73.7576,
        "note": "NOAA tidal \u2014 Zone A monitoring",
        "borough": ""
      },
      {
        "name": "Sandy Hook, NJ",
        "lat": 40.4669,
        "lng": -74.0094,
        "note": "NOAA 8531680 \u2014 outer harbor reference",
        "borough": ""
      }
    ]
  },
  "eoc": {
    "label": "EOC / Command",
    "color": "#facc15",
    "icon": "\ud83c\udfdb",
    "features": [
      {
        "name": "NYC EOC",
        "lat": 40.6967,
        "lng": -73.9896,
        "note": "Primary EOC \u2014 165 Cadman Plaza East",
        "borough": ""
      },
      {
        "name": "Pier 92 Backup",
        "lat": 40.7671,
        "lng": -74.0029,
        "note": "Backup EOC / Mass Casualty staging",
        "borough": ""
      },
      {
        "name": "FEMA Region 2",
        "lat": 40.7143,
        "lng": -74.0071,
        "note": "26 Federal Plaza",
        "borough": ""
      }
    ]
  },
  "flood_risk": {
    "label": "Flood Risk Areas",
    "color": "#fb923c",
    "icon": "\ud83d\udca7",
    "features": [
      {
        "name": "Red Hook, Brooklyn",
        "lat": 40.6745,
        "lng": -74.0097,
        "note": "Zone AE \u2014 flooded Sandy 2012",
        "borough": ""
      },
      {
        "name": "Coney Island",
        "lat": 40.5755,
        "lng": -73.9707,
        "note": "Zone AE \u2014 10ft+ surge Sandy",
        "borough": ""
      },
      {
        "name": "Rockaway Peninsula",
        "lat": 40.5874,
        "lng": -73.8261,
        "note": "Zone VE/AE \u2014 highest surge risk",
        "borough": ""
      },
      {
        "name": "Howard Beach",
        "lat": 40.657,
        "lng": -73.8378,
        "note": "Zone AE \u2014 interior flood risk",
        "borough": ""
      },
      {
        "name": "South Beach, SI",
        "lat": 40.5842,
        "lng": -74.0783,
        "note": "Zone AE \u2014 major Sandy impact",
        "borough": ""
      },
      {
        "name": "Lower Manhattan (FiDi)",
        "lat": 40.7074,
        "lng": -74.0104,
        "note": "Zone AE \u2014 subway/utility risk",
        "borough": ""
      },
      {
        "name": "Breezy Point",
        "lat": 40.5587,
        "lng": -73.929,
        "note": "Zone VE \u2014 wave action",
        "borough": ""
      }
    ]
  }
};

export const SOCRATA = {
  "domain": "data.cityofnewyork.us",
  "presets": [
    {
      "id": "fhrw-4uyv",
      "name": "311 Service Requests",
      "agency": "311",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "complaint_type",
      "color": "#60a5fa",
      "icon": "\ud83d\udcde",
      "desc": "Real-time 311 complaints"
    },
    {
      "id": "nuhi-jiwk",
      "name": "FDNY Incidents",
      "agency": "FDNY",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "incident_type_desc",
      "color": "#f87171",
      "icon": "\ud83d\ude92",
      "desc": "FDNY incident data"
    },
    {
      "id": "2bnn-yakx",
      "name": "NYC Cooling Centers",
      "agency": "DOHMH",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "site_name",
      "color": "#34d399",
      "icon": "\u2744\ufe0f",
      "desc": "Active cooling center locations"
    },
    {
      "id": "uqnk-2pcv",
      "name": "Hurricane Evacuation Centers",
      "agency": "OEM",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "facility_name",
      "color": "#facc15",
      "icon": "\ud83c\udfeb",
      "desc": "Designated hurricane evacuation shelters"
    },
    {
      "id": "43nn-pn8y",
      "name": "NYPD Incidents",
      "agency": "NYPD",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "ofns_desc",
      "color": "#a78bfa",
      "icon": "\ud83d\ude94",
      "desc": "NYPD incident reports"
    },
    {
      "id": "5uac-w243",
      "name": "NYCHA Developments",
      "agency": "NYCHA",
      "lat_col": "latitude",
      "lng_col": "longitude",
      "label_col": "development",
      "color": "#fb923c",
      "icon": "\ud83c\udfe2",
      "desc": "NYCHA public housing developments"
    }
  ]
};

export const NOAA_STATES = {
  "alerts": "NY",
  "usgs": "NY",
  "fema": "NY"
};

export const BRANDING = {
  "appTitle": "EMBER",
  "appSubtitle": "Emergency Management Body of Evidence & Resources",
  "jurisdictionLine": "NYC JURISDICTION",
  "primaryColor": "#e8372c",
  "logoEmoji": "\ud83d\udea8"
};

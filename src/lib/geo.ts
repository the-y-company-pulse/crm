// Distance from Göteborg ("fågelvägen") for towns around the open leadership
// program's venue. Coordinates are municipality/town centres, accurate to a
// couple of km — enough for a 5–10 mil radius. Client-safe.

const GOTEBORG: [number, number] = [57.7089, 11.9746]

// lowercase town name → [lat, lon]
const PLACES: Record<string, [number, number]> = {
  // Göteborg and districts
  "göteborg": GOTEBORG, "gothenburg": GOTEBORG, "västra frölunda": [57.652, 11.911],
  "hisings kärra": [57.79, 11.99], "hisingen": [57.73, 11.93], "torslanda": [57.72, 11.77],
  "angered": [57.79, 12.05], "askim": [57.63, 11.93], "högsbo": [57.66, 11.94],
  "sävedalen": [57.733, 12.068], "mölndal": [57.656, 12.014], "kållered": [57.61, 12.05],
  "lindome": [57.578, 12.075], "partille": [57.739, 12.106], "mölnlycke": [57.659, 12.119],
  "härryda": [57.659, 12.119], "landvetter": [57.687, 12.209], "kungälv": [57.871, 11.98],
  "ytterby": [57.86, 11.92], "lerum": [57.77, 12.269], "floda": [57.81, 12.36],
  "öckerö": [57.71, 11.65], "hönö": [57.69, 11.65], "kungsbacka": [57.487, 12.076],
  "onsala": [57.42, 12.02], "ale": [57.893, 12.068], "nödinge": [57.893, 12.068],
  "älvängen": [57.957, 12.118], "surte": [57.82, 12.01], "bohus": [57.85, 12.02],
  // Bohuslän / Fyrbodal
  "stenungsund": [58.07, 11.818], "stora höga": [58.016, 11.835], "tjörn": [58.02, 11.55],
  "skärhamn": [58.02, 11.55], "orust": [58.237, 11.672], "henån": [58.237, 11.672],
  "ljungskile": [58.225, 11.92], "uddevalla": [58.349, 11.938], "lysekil": [58.275, 11.436],
  "munkedal": [58.473, 11.678], "sotenäs": [58.362, 11.255], "kungshamn": [58.362, 11.255],
  "tanum": [58.723, 11.325], "tanumshede": [58.723, 11.325], "strömstad": [58.937, 11.171],
  "färgelanda": [58.567, 11.993], "dals-ed": [58.912, 11.93], "mellerud": [58.7, 12.453],
  "bengtsfors": [59.03, 12.227], "åmål": [59.051, 12.703], "trollhättan": [58.284, 12.288],
  "vänersborg": [58.38, 12.323], "lilla edet": [58.133, 12.123], "grästorp": [58.333, 12.68],
  // Sjuhärad / Alingsås
  "alingsås": [57.93, 12.533], "vårgårda": [58.034, 12.808], "herrljunga": [58.078, 13.025],
  "borås": [57.721, 12.94], "bollebygd": [57.669, 12.57], "ulricehamn": [57.792, 13.414],
  "mark": [57.508, 12.693], "kinna": [57.508, 12.693], "skene": [57.487, 12.645],
  "svenljunga": [57.495, 13.11], "tranemo": [57.485, 13.35], "sandared": [57.71, 12.79],
  "viskafors": [57.63, 12.85], "fristad": [57.82, 13.01],
  // Skaraborg
  "vara": [58.262, 12.957], "nossebro": [58.188, 12.719], "essunga": [58.188, 12.719],
  "lidköping": [58.505, 13.157], "götene": [58.528, 13.494], "skara": [58.386, 13.438],
  "falköping": [58.175, 13.551], "skövde": [58.39, 13.846], "mariestad": [58.71, 13.823],
  "tidaholm": [58.18, 13.958], "hjo": [58.304, 14.287], "tibro": [58.419, 14.163],
  "töreboda": [58.706, 14.124], "karlsborg": [58.535, 14.507],
  // Halland
  "varberg": [57.106, 12.25], "falkenberg": [56.905, 12.491], "halmstad": [56.674, 12.857],
  "laholm": [56.512, 13.043], "hyltebruk": [56.997, 13.239], "hylte": [56.997, 13.239],
  "veddige": [57.27, 12.32], "frillesås": [57.32, 12.16],
  // Jönköpings län
  "gislaved": [57.304, 13.54], "gnosjö": [57.358, 13.737], "värnamo": [57.186, 14.04],
  "vaggeryd": [57.498, 14.147], "jönköping": [57.783, 14.161], "huskvarna": [57.786, 14.302],
  "habo": [57.907, 14.073], "mullsjö": [57.917, 13.88], "anderstorp": [57.28, 13.63],
}

function haversineKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

// "Lilla Edet/Trollhättan", "Göteborg m.fl.", "Borlänge / Göteborg" → nearest known place
export function distanceFromGoteborgKm(city: string | null | undefined): number | null {
  if (!city) return null
  const parts = city
    .toLowerCase()
    .replace(/m\.fl\.?|kommun|\(.*?\)/g, " ")
    .split(/[/,;&+]| och /)
    .map((p) => p.trim())
    .filter(Boolean)
  let best: number | null = null
  for (const p of parts) {
    const coords = PLACES[p]
    if (!coords) continue
    const d = Math.round(haversineKm(GOTEBORG, coords))
    if (best == null || d < best) best = d
  }
  return best
}

// Stored override (from the harvest or a human) wins over the city lookup
export function companyDistanceKm(c: { distanceKm?: number | null; city?: string | null }) {
  return c.distanceKm ?? distanceFromGoteborgKm(c.city)
}

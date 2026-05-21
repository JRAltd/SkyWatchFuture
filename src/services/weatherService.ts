/**
 * Weather Service using Open-Meteo API
 * No API key required for basic usage.
 */

export interface WeatherData {
  current: {
    temp: number;
    description: string;
    windSpeed: number;
    humidity: number;
    uvIndex: number;
    pressure: number;
    visibility: number;
    isDay: boolean;
    weatherCode: number;
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  locationName: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  pop: number; // probability of precipitation
}

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m,uv_index,visibility&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const data = await response.json();

  // Get location name via reverse geocoding (optional, but nice)
  let locationName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  try {
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const geoData = await geoResponse.json();
    locationName = geoData.display_name.split(',')[0] || geoData.address?.city || geoData.address?.town || locationName;
  } catch (e) {
    console.error("Geocoding failed", e);
  }

  return {
    current: {
      temp: data.current.temperature_2m,
      description: WEATHER_CODES[data.current.weather_code] || "Unknown",
      windSpeed: data.current.wind_speed_10m,
      humidity: data.current.relative_humidity_2m,
      uvIndex: data.current.uv_index,
      pressure: data.current.surface_pressure,
      visibility: data.current.visibility / 1000, // convert to km
      isDay: data.current.is_day === 1,
      weatherCode: data.current.weather_code,
    },
    hourly: data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
      time,
      temp: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
    })),
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: data.daily.temperature_2m_max[i],
      minTemp: data.daily.temperature_2m_min[i],
      weatherCode: data.daily.weather_code[i],
      pop: data.daily.precipitation_probability_max[i],
    })),
    locationName,
  };
}

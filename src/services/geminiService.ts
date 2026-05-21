import { GoogleGenAI } from "@google/genai";
import { WeatherData } from "./weatherService";

const API_KEY = process.env.GEMINI_API_KEY || "";

export async function getWeatherInsights(
  weather: WeatherData, 
  tempUnit: 'c' | 'f' = 'f', 
  windUnit: 'kmh' | 'mph' | 'kn' = 'mph'
) {
  if (!API_KEY) return "AI Insights unavailable (API Key missing).";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Convert temperature for prompt matching user units
    const displayTemp = tempUnit === 'f' 
      ? (weather.current.temp * 9/5) + 32 
      : weather.current.temp;

    // Convert wind speed for prompt matching user units
    let displayWind = weather.current.windSpeed;
    if (windUnit === 'mph') {
      displayWind = weather.current.windSpeed * 0.621371;
    } else if (windUnit === 'kn') {
      displayWind = weather.current.windSpeed * 0.539957;
    }

    const tempSymbol = tempUnit === 'f' ? '°F' : '°C';
    const windSymbol = windUnit;

    const prompt = `
      You are a futuristic weather assistant. Based on this weather data, provide a very concise, 2-sentence "Tactical Outlook" for the user. 
      Current Temp: ${Math.round(displayTemp)}${tempSymbol}
      Condition: ${weather.current.description}
      Wind: ${Math.round(displayWind)} ${windSymbol}
      Precipitation Risk (Next 24h): ${Math.max(...weather.daily.map(d => d.pop))}%
      
      Keep it brief, authoritative, and slightly futuristic in tone. Mention the current temperature and wind speed in the provided units (${tempSymbol} and ${windSymbol}) in your sentences.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error scanning atmospheric patterns. Check back later.";
  }
}

// ============================================================================
// Hourly Weather Sample Data
// Comprehensive weather scenarios for testing and development
// ============================================================================

import type { WeatherForecast } from '../WeatherCard/WeatherContext';

// ============================================================================
// Helper Function
// ============================================================================

interface GenerateForecastOptions {
  startDate: Date;
  hours: number;
  conditions: string[];
  tempRange: [number, number];
  cloudCoverage?: number;
  precipitation?: number;
  windSpeed?: number;
  windBearing?: number;
  humidity?: number;
  uvIndex?: number;
}

function generateHourlyForecast(options: GenerateForecastOptions): WeatherForecast[] {
  const {
    startDate,
    hours,
    conditions,
    tempRange,
    cloudCoverage = 50,
    precipitation = 0,
    windSpeed = 5,
    windBearing = 180,
    humidity = 50,
    uvIndex = 2,
  } = options;
  
  const forecast: WeatherForecast[] = [];
  const [minTemp, maxTemp] = tempRange;
  
  for (let i = 0; i < hours; i++) {
    const date = new Date(startDate);
    date.setHours(date.getHours() + i);
    
    // Vary temperature through the day with sine wave
    const hourOfDay = date.getHours();
    const tempFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI);
    const temp = minTemp + (maxTemp - minTemp) * Math.max(0, tempFactor);
    
    forecast.push({
      datetime: date.toISOString(),
      condition: conditions[i % conditions.length],
      temperature: Math.round(temp),
      cloud_coverage: cloudCoverage,
      precipitation: precipitation,
      precipitation_probability: precipitation > 0 ? 80 : 10,
      wind_speed: windSpeed,
      wind_bearing: windBearing,
      humidity: humidity + (precipitation > 0 ? 20 : 0),
      uv_index: uvIndex,
    });
  }
  
  return forecast;
}

// ============================================================================
// Weather Scenarios
// ============================================================================

// Base date for all scenarios
const BASE_DATE = new Date('2026-01-24T08:00:00');

// ----------------------------------------------------------------------------
// 1. SUNNY DAY Scenarios
// ----------------------------------------------------------------------------

export const sunnySkyHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny'],
  tempRange: [85, 100],
  cloudCoverage: 5,
  precipitation: 0,
  windSpeed: 7,
  humidity: 40,
  uvIndex: 9,
});

export const sunnySkyMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny'],
  tempRange: [55, 75],
  cloudCoverage: 5,
  precipitation: 0,
  windSpeed: 6,
  humidity: 50,
  uvIndex: 6,
});

export const sunnySkyCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny'],
  tempRange: [15, 35],
  cloudCoverage: 5,
  precipitation: 0,
  windSpeed: 8,
  humidity: 60,
  uvIndex: 3,
});

// ----------------------------------------------------------------------------
// 2. CLOUDY DAY Scenarios
// ----------------------------------------------------------------------------

export const cloudySkyHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['cloudy'],
  tempRange: [85, 95],
  cloudCoverage: 90,
  precipitation: 0,
  windSpeed: 5,
  humidity: 55,
  uvIndex: 4,
});

export const cloudySkyMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['cloudy'],
  tempRange: [55, 68],
  cloudCoverage: 95,
  precipitation: 0,
  windSpeed: 6,
  humidity: 65,
  uvIndex: 2,
});

export const cloudySkyCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['cloudy'],
  tempRange: [15, 30],
  cloudCoverage: 100,
  precipitation: 0,
  windSpeed: 10,
  humidity: 75,
  uvIndex: 1,
});

// ----------------------------------------------------------------------------
// 3. RAINY DAY Scenarios
// ----------------------------------------------------------------------------

export const rainyDayHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['rainy'],
  tempRange: [85, 92],
  cloudCoverage: 100,
  precipitation: 0.8,
  windSpeed: 12,
  humidity: 80,
  uvIndex: 2,
});

export const rainyDayMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['rainy'],
  tempRange: [55, 65],
  cloudCoverage: 100,
  precipitation: 1.2,
  windSpeed: 14,
  humidity: 85,
  uvIndex: 1,
});

export const rainyDayCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['rainy'],
  tempRange: [35, 42],
  cloudCoverage: 100,
  precipitation: 0.6,
  windSpeed: 15,
  humidity: 90,
  uvIndex: 0,
});

// ----------------------------------------------------------------------------
// 4. SNOWY DAY Scenarios
// ----------------------------------------------------------------------------

export const snowyDayHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['snowy'],
  tempRange: [85, 95], // Unrealistic but following requirements
  cloudCoverage: 100,
  precipitation: 0.3,
  windSpeed: 8,
  humidity: 70,
  uvIndex: 2,
});

export const snowyDayMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['snowy'],
  tempRange: [55, 65], // Unrealistic but following requirements
  cloudCoverage: 100,
  precipitation: 0.5,
  windSpeed: 10,
  humidity: 75,
  uvIndex: 1,
});

export const snowyDayCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['snowy'],
  tempRange: [15, 28],
  cloudCoverage: 100,
  precipitation: 0.8,
  windSpeed: 12,
  humidity: 85,
  uvIndex: 0,
});

// ----------------------------------------------------------------------------
// 5. MIXED (Sun, Clouds, Rain) Scenarios
// ----------------------------------------------------------------------------

export const mixedRainHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'rainy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [85, 98],
  cloudCoverage: 60,
  precipitation: 0.4,
  windSpeed: 10,
  humidity: 60,
  uvIndex: 5,
});

export const mixedRainMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'rainy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [55, 72],
  cloudCoverage: 55,
  precipitation: 0.5,
  windSpeed: 12,
  humidity: 65,
  uvIndex: 4,
});

export const mixedRainCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'rainy', 'rainy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [15, 38],
  cloudCoverage: 65,
  precipitation: 0.3,
  windSpeed: 14,
  humidity: 70,
  uvIndex: 2,
});

// ----------------------------------------------------------------------------
// 6. MIXED (Sun, Clouds, Snow) Scenarios
// ----------------------------------------------------------------------------

export const mixedSnowHot = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'snowy', 'snowy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [85, 95], // Unrealistic but following requirements
  cloudCoverage: 55,
  precipitation: 0.2,
  windSpeed: 9,
  humidity: 55,
  uvIndex: 4,
});

export const mixedSnowMild = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'snowy', 'snowy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [55, 68], // Unrealistic but following requirements
  cloudCoverage: 60,
  precipitation: 0.3,
  windSpeed: 11,
  humidity: 60,
  uvIndex: 3,
});

export const mixedSnowCold = generateHourlyForecast({
  startDate: new Date(BASE_DATE),
  hours: 12,
  conditions: ['sunny', 'sunny', 'partlycloudy', 'partlycloudy', 'cloudy', 'cloudy', 'snowy', 'snowy', 'cloudy', 'partlycloudy', 'partlycloudy', 'sunny'],
  tempRange: [15, 32],
  cloudCoverage: 70,
  precipitation: 0.6,
  windSpeed: 13,
  humidity: 75,
  uvIndex: 1,
});

// ----------------------------------------------------------------------------
// 7. SUNSET Scenarios
// ----------------------------------------------------------------------------

export const sunsetHot = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(14); // Start at 2pm
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    // Transition from day to night around hour 18-20 (6-8pm)
    let condition = 'sunny';
    if (hour >= 18 && hour < 20) condition = 'partlycloudy';
    if (hour >= 20 || hour < 6) condition = 'clear-night';
    
    const temp = hour < 20 ? 95 - (hour - 14) * 2 : 80;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 18 ? 25 : 10,
      precipitation: 0,
      wind_speed: 6,
      wind_bearing: 270,
      humidity: 45,
      uv_index: hour < 18 ? 5 : 0,
    });
  }
  
  return forecast;
})();

export const sunsetMild = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(14);
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    let condition = 'sunny';
    if (hour >= 18 && hour < 20) condition = 'partlycloudy';
    if (hour >= 20 || hour < 6) condition = 'clear-night';
    
    const temp = hour < 20 ? 70 - (hour - 14) * 2 : 58;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 18 ? 30 : 10,
      precipitation: 0,
      wind_speed: 7,
      wind_bearing: 270,
      humidity: 55,
      uv_index: hour < 18 ? 4 : 0,
    });
  }
  
  return forecast;
})();

export const sunsetCold = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(14);
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    let condition = 'sunny';
    if (hour >= 18 && hour < 20) condition = 'partlycloudy';
    if (hour >= 20 || hour < 6) condition = 'clear-night';
    
    const temp = hour < 20 ? 32 - (hour - 14) * 1.5 : 20;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 18 ? 20 : 5,
      precipitation: 0,
      wind_speed: 8,
      wind_bearing: 270,
      humidity: 60,
      uv_index: hour < 18 ? 2 : 0,
    });
  }
  
  return forecast;
})();

// ----------------------------------------------------------------------------
// 8. SUNRISE Scenarios
// ----------------------------------------------------------------------------

export const sunriseHot = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(2); // Start at 2am
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    // Transition from night to day around hour 6-8
    let condition = 'clear-night';
    if (hour >= 6 && hour < 8) condition = 'partlycloudy';
    if (hour >= 8) condition = 'sunny';
    
    const temp = hour < 6 ? 75 : 75 + (hour - 6) * 3;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 6 && hour < 8 ? 25 : 5,
      precipitation: 0,
      wind_speed: 5,
      wind_bearing: 90,
      humidity: 50,
      uv_index: hour < 6 ? 0 : (hour - 6) * 1.5,
    });
  }
  
  return forecast;
})();

export const sunriseMild = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(2);
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    let condition = 'clear-night';
    if (hour >= 6 && hour < 8) condition = 'partlycloudy';
    if (hour >= 8) condition = 'sunny';
    
    const temp = hour < 6 ? 50 : 50 + (hour - 6) * 3;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 6 && hour < 8 ? 30 : 10,
      precipitation: 0,
      wind_speed: 6,
      wind_bearing: 90,
      humidity: 60,
      uv_index: hour < 6 ? 0 : (hour - 6) * 1.2,
    });
  }
  
  return forecast;
})();

export const sunriseCold = (() => {
  const startHour = new Date(BASE_DATE);
  startHour.setHours(2);
  const forecast: WeatherForecast[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(startHour);
    date.setHours(date.getHours() + i);
    const hour = date.getHours();
    
    let condition = 'clear-night';
    if (hour >= 6 && hour < 8) condition = 'partlycloudy';
    if (hour >= 8) condition = 'sunny';
    
    const temp = hour < 6 ? 10 : 10 + (hour - 6) * 3;
    
    forecast.push({
      datetime: date.toISOString(),
      condition,
      temperature: Math.round(temp),
      cloud_coverage: hour >= 6 && hour < 8 ? 20 : 5,
      precipitation: 0,
      wind_speed: 7,
      wind_bearing: 90,
      humidity: 65,
      uv_index: hour < 6 ? 0 : (hour - 6) * 0.8,
    });
  }
  
  return forecast;
})();

// ============================================================================
// Organized Export
// ============================================================================

export const allScenarios = {
  sunny: { hot: sunnySkyHot, mild: sunnySkyMild, cold: sunnySkyCold },
  cloudy: { hot: cloudySkyHot, mild: cloudySkyMild, cold: cloudySkyCold },
  rainy: { hot: rainyDayHot, mild: rainyDayMild, cold: rainyDayCold },
  snowy: { hot: snowyDayHot, mild: snowyDayMild, cold: snowyDayCold },
  mixedRain: { hot: mixedRainHot, mild: mixedRainMild, cold: mixedRainCold },
  mixedSnow: { hot: mixedSnowHot, mild: mixedSnowMild, cold: mixedSnowCold },
  sunset: { hot: sunsetHot, mild: sunsetMild, cold: sunsetCold },
  sunrise: { hot: sunriseHot, mild: sunriseMild, cold: sunriseCold },
};

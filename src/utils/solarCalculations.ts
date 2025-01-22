// Helper functions
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

function calculateDayAngle(dayOfYear: number): number {
  return 2 * Math.PI * (dayOfYear - 1) / 365;
}

// Constants
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export interface SolarPosition {
  azimuth: number;   // Vädersträck (compass direction)
  altitude: number;  // Höjd (height above horizon)
}

function calculateSolarDeclination(dayOfYear: number): number {
  // Solar declination angle (δ) using Spencer's formula
  const x = 2 * Math.PI * (dayOfYear - 1) / 365;
  return 0.006918 - 0.399912 * Math.cos(x) + 0.070257 * Math.sin(x) 
         - 0.006758 * Math.cos(2 * x) + 0.000907 * Math.sin(2 * x) 
         - 0.002697 * Math.cos(3 * x) + 0.001480 * Math.sin(3 * x);
}

function calculateEquationOfTime(dayOfYear: number): number {
  // Equation of time using Spencer's formula (in minutes)
  const x = 2 * Math.PI * (dayOfYear - 1) / 365;
  return 229.18 * (0.000075 + 0.001868 * Math.cos(x) - 0.032077 * Math.sin(x) 
                   - 0.014615 * Math.cos(2 * x) - 0.040849 * Math.sin(2 * x));
}

// Core solar position calculation function
export function calculateSolarPosition(latitude: number, longitude: number, date: Date): SolarPosition {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate solar declination (in radians)
  const declination = calculateSolarDeclination(dayOfYear);
  
  // Calculate equation of time (in minutes)
  const eot = calculateEquationOfTime(dayOfYear);
  
  // Calculate true solar time
  const localHour = date.getHours() + date.getMinutes() / 60;
  const standardMeridian = Math.floor(longitude / 15) * 15;
  const timeCorrection = 4 * (longitude - standardMeridian) + eot; // 4 minutes per degree
  const solarTime = localHour + timeCorrection / 60;
  
  // Calculate hour angle (ω)
  const hourAngle = (solarTime - 12) * 15;
  
  // Convert angles to radians
  const latRad = toRadians(latitude);
  const hourAngleRad = toRadians(hourAngle);
  
  // Calculate solar altitude
  const sinAltitude = 
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngleRad);
  const altitude = toDegrees(Math.asin(sinAltitude));
  
  // If the sun is below the horizon, return negative altitude
  if (altitude < 0) {
    return {
      azimuth: 0,
      altitude: altitude
    };
  }
  
  // Calculate solar azimuth
  const cosAzimuth = (Math.sin(declination) - Math.sin(latRad) * sinAltitude) /
                     (Math.cos(latRad) * Math.cos(Math.asin(sinAltitude)));
  let azimuth = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosAzimuth))));
  
  // Adjust azimuth based on hour angle
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }
  
  return {
    azimuth: azimuth,
    altitude: altitude
  };
}

// Calculate analemma points for a specific time
export function calculateAnalemmaPoints(
  latitude: number,
  longitude: number,
  time: string
): SolarPosition[] {
  const points: SolarPosition[] = [];
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const year = now.getFullYear();
  
  // Calculate sun position for each day of the year
  for (let dayOfYear = 1; dayOfYear <= 365; dayOfYear++) {
    const date = new Date(year, 0, dayOfYear);
    date.setHours(hours, minutes, 0, 0);
    const position = calculateSolarPosition(latitude, longitude, date);
    
    // Only add points where the sun is above the horizon
    if (position.altitude > 0) {
      points.push(position);
    }
  }
  
  return points;
} 
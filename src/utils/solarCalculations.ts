// Helper functions
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

export interface SolarPosition {
  azimuth: number;   // Vädersträck (compass direction)
  altitude: number;  // Höjd (height above horizon)
}

// Calculate solar declination using Spencer's formula
function calculateSolarDeclination(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return -23.45 * Math.cos(b);
}

// Calculate equation of time (in minutes)
function calculateEquationOfTime(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

// Core solar position calculation function
export function calculateSolarPosition(latitude: number, longitude: number, date: Date): SolarPosition {
  // Get day of year (1-366)
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

  // Convert latitude to radians
  const latRad = toRadians(latitude);

  // Calculate solar declination
  const declination = toRadians(calculateSolarDeclination(dayOfYear));

  // Calculate equation of time correction (in minutes)
  const eot = calculateEquationOfTime(dayOfYear);

  // Calculate true solar time
  const localTime = date.getHours() + date.getMinutes() / 60;
  const longitudeCorrection = longitude / 15; // Convert longitude to hours
  const solarTime = localTime + (eot / 60) + longitudeCorrection;

  // Calculate hour angle (15° per hour from solar noon)
  const hourAngle = toRadians((solarTime - 12) * 15);

  // Calculate solar altitude
  const sinAltitude = Math.sin(latRad) * Math.sin(declination) + 
                     Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = toDegrees(Math.asin(sinAltitude));

  // Calculate solar azimuth
  const cosAzimuth = (Math.sin(declination) - Math.sin(latRad) * sinAltitude) / 
                     (Math.cos(latRad) * Math.cos(Math.asin(sinAltitude)));
  let azimuth = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosAzimuth))));

  // Adjust azimuth based on hour angle
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }

  return { azimuth, altitude };
}

// Calculate analemma points for a specific time
export function calculateAnalemmaPoints(latitude: number, longitude: number, timeStr: string): SolarPosition[] {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const points: SolarPosition[] = [];
  
  // Calculate positions for each day of the year
  for (let dayOfYear = 1; dayOfYear <= 365; dayOfYear++) {
    const date = new Date(new Date().getFullYear(), 0, dayOfYear);
    date.setHours(hours, minutes);
    
    const position = calculateSolarPosition(latitude, longitude, date);
    points.push(position);
  }
  
  return points;
} 
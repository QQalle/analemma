// Constants
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export interface SolarPosition {
  azimuth: number;   // Vädersträck (compass direction)
  altitude: number;  // Höjd (height above horizon)
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Convert radians to degrees
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

function calculateSolarDeclination(dayOfYear: number): number {
  // Simpler formula for solar declination
  const d = dayOfYear;
  return -23.45 * Math.cos((360 / 365) * (d + 10) * DEG_TO_RAD);
}

function calculateEquationOfTime(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

// Get timezone offset for a location based on longitude
function getTimezoneOffsetFromLongitude(longitude: number): number {
  // Each timezone is roughly 15 degrees wide (360/24)
  // Round to nearest timezone to handle edge cases
  const timeZone = Math.round(longitude / 15);
  return timeZone;
}

export function calculateSolarPosition(
  latitude: number,
  longitude: number,
  time: string,
  dayOfYear: number
): SolarPosition {
  // Parse time string to get hours and minutes
  const [hours, minutes] = time.split(':').map(Number);
  
  // Get the timezone offset for this location
  const locationOffset = getTimezoneOffsetFromLongitude(longitude);
  
  // Convert location's local time to UTC
  const localDecimalTime = hours + minutes / 60;
  const utcTime = localDecimalTime - locationOffset;

  // Calculate solar declination
  const declination = calculateSolarDeclination(dayOfYear);

  // Calculate equation of time adjustment
  const eot = calculateEquationOfTime(dayOfYear);

  // Calculate true solar time
  const longitudeCorrection = longitude * 4; // 4 minutes per degree
  const timeCorrection = eot + longitudeCorrection;
  const solarTime = utcTime + timeCorrection / 60;

  // Calculate hour angle (15° per hour from solar noon)
  const hourAngle = (solarTime - 12) * 15;

  // Convert latitude and hour angle to radians
  const latRad = latitude * DEG_TO_RAD;
  const hourAngleRad = hourAngle * DEG_TO_RAD;
  const declinationRad = declination * DEG_TO_RAD;

  // Calculate solar altitude
  const sinAltitude = 
    Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const altitude = Math.asin(sinAltitude) * RAD_TO_DEG;

  // Calculate solar azimuth
  let azimuth;
  const cosAzimuth = 
    (Math.sin(declinationRad) - Math.sin(latRad) * sinAltitude) /
    (Math.cos(latRad) * Math.cos(Math.asin(sinAltitude)));
  
  if (hourAngle < 0) {
    azimuth = Math.acos(cosAzimuth) * RAD_TO_DEG;
  } else {
    azimuth = 360 - Math.acos(cosAzimuth) * RAD_TO_DEG;
  }

  // Debug logging
  if (dayOfYear % 30 === 0) {
    console.log(`Day ${dayOfYear}, Location Time ${time} (UTC${locationOffset >= 0 ? '+' : ''}${locationOffset}):`, {
      declination,
      hourAngle,
      altitude,
      azimuth,
    });
  }

  return {
    azimuth: (azimuth + 360) % 360,
    altitude: Math.max(0, altitude)
  };
}

export function calculateAnalemmaPoints(
  latitude: number,
  longitude: number,
  time: string
): SolarPosition[] {
  const points: SolarPosition[] = [];
  
  // Calculate sun position for each day of the year
  for (let dayOfYear = 1; dayOfYear <= 365; dayOfYear++) {
    const position = calculateSolarPosition(latitude, longitude, time, dayOfYear);
    
    // Only add points where the sun is above the horizon
    if (position.altitude > 0) {
      points.push(position);
    }
  }

  // Debug logging
  console.log(`Generated ${points.length} points for ${time} at ${latitude}°N, ${longitude}°E`);
  if (points.length > 0) {
    console.log('First point:', points[0]);
    console.log('Last point:', points[points.length - 1]);
  }
  
  return points;
} 
/**
 * Philippines Coordinates Data
 * 
 * This file contains coordinate data for Philippine regions, provinces, and cities
 * Used to enable geographic-based features in PanicSense
 */

export const regionCoordinates: Record<string, [number, number]> = {
  // Unknown location fallback
  "Unknown": [12.8797, 121.7740], // Center of Philippines
  
  // Major regions
  "Luzon": [16.0, 121.0],
  "Visayas": [11.0, 124.0],
  "Mindanao": [7.5, 125.0],
  
  // Administrative regions
  "NCR": [14.5995, 120.9842],
  "CAR": [17.3502, 121.0815],
  "Region I": [16.0183, 120.5717],
  "Region II": [16.9754, 121.8107],
  "Region III": [15.4825, 120.7164],
  "Region IV-A": [14.1008, 121.0794],
  "Region IV-B": [9.8349, 118.7384],
  "Region V": [13.4213, 123.4136],
  "Region VI": [11.0049, 122.5373],
  "Region VII": [10.3157, 123.8854],
  "Region VIII": [11.2543, 125.0000],
  "Region IX": [8.1530, 123.2662],
  "Region X": [8.4542, 124.6319],
  "Region XI": [7.0707, 125.6087],
  "Region XII": [6.2706, 125.0868],
  "Region XIII": [8.8015, 125.7407],
  "BARMM": [7.2191, 124.2392],
  
  // Metro Manila and surrounding provinces
  "Metro Manila": [14.5995, 120.9842],
  "Manila": [14.5995, 120.9842],
  "Batangas": [13.7565, 121.0583],
  "Rizal": [14.6042, 121.3035],
  "Taytay": [14.5762, 121.1324],
  "Taytay Rizal": [14.5762, 121.1324],
  "Taytay, Rizal": [14.5762, 121.1324],
  "Angono": [14.5409, 121.1533],
  "Angono Rizal": [14.5409, 121.1533],
  "angono rizal": [14.5409, 121.1533],
  "Imus": [14.4301, 120.9387],
  "Imus Cavite": [14.4301, 120.9387],
  "Imus, Cavite": [14.4301, 120.9387],
  "Bacoor": [14.4624, 120.9645],
  "Bacoor Cavite": [14.4624, 120.9645],
  "Bacoor, Cavite": [14.4624, 120.9645],
  "bacoor cavite": [14.4624, 120.9645],
  "Cavite": [14.2829, 120.8686],
  "Laguna": [14.2691, 121.4113],
  "Bulacan": [14.7969, 120.8787],
  "Pampanga": [15.0794, 120.6200],
  
  // Major cities
  "Quezon City": [14.6760, 121.0437],
  "Cebu City": [10.3157, 123.8854],
  "Cebu": [10.3157, 123.8854],
  "Davao": [7.0707, 125.6087],
  "Davao City": [7.0707, 125.6087],
  "Tacloban": [11.2543, 125.0000],
  "Tacloban City": [11.2543, 125.0000],
  "Baguio": [16.4023, 120.5960],
  "Baguio City": [16.4023, 120.5960],
  "Zamboanga": [6.9214, 122.0790],
  "Zamboanga City": [6.9214, 122.0790],
  "Cagayan de Oro": [8.4542, 124.6319],
  "General Santos": [6.1164, 125.1716],
  "General Santos City": [6.1164, 125.1716],
  
  // Metro Manila cities
  "Makati": [14.5547, 121.0244],
  "Makati City": [14.5547, 121.0244],
  "Pasig": [14.5764, 121.0851],
  "Pasig City": [14.5764, 121.0851],
  "Taguig": [14.5176, 121.0509],
  "Taguig City": [14.5176, 121.0509],
  "Marikina": [14.6507, 121.1029],
  "Marikina City": [14.6507, 121.1029],
  "Mandaluyong": [14.5794, 121.0359],
  "Mandaluyong City": [14.5794, 121.0359],
  "Pasay": [14.5378, 121.0014],
  "Pasay City": [14.5378, 121.0014],
  "Parañaque": [14.4793, 121.0198],
  "Parañaque City": [14.4793, 121.0198],
  "Paranaque": [14.4793, 121.0198],
  "Paranaque City": [14.4793, 121.0198],
  "Caloocan": [14.6499, 120.9809],
  "Caloocan City": [14.6499, 120.9809],
  "Muntinlupa": [14.4081, 121.0415],
  "Muntinlupa City": [14.4081, 121.0415],
  "San Juan": [14.6019, 121.0355],
  "San Juan City": [14.6019, 121.0355],
  "Las Piñas": [14.4453, 120.9833],
  "Las Pinas": [14.4453, 120.9833],
  "Las Pinas City": [14.4453, 120.9833],
  "Las Piñas City": [14.4453, 120.9833],
  "Valenzuela": [14.7011, 120.9830],
  "Valenzuela City": [14.7011, 120.9830],
  "Navotas": [14.6688, 120.9427],
  "Navotas City": [14.6688, 120.9427],
  "Malabon": [14.6681, 120.9574],
  "Malabon City": [14.6681, 120.9574],
  "Pateros": [14.5446, 121.0685],
  
  // Other major cities and locations
  "Angeles": [15.1450, 120.5887],
  "Angeles City": [15.1450, 120.5887],
  "Bacolod": [10.6713, 122.9511],
  "Bacolod City": [10.6713, 122.9511],
  "Iloilo": [10.7202, 122.5621],
  "Iloilo City": [10.7202, 122.5621],
  "Cabanatuan": [15.4886, 120.9691],
  "Cabanatuan City": [15.4886, 120.9691],
  "Boracay": [11.9804, 121.9189],
  "Palawan": [9.8349, 118.7384],
  "Bohol": [9.8500, 124.1435],
  "Leyte": [11.0105, 124.6514],
  "Samar": [11.5750, 124.9749],
  "Pangasinan": [15.8949, 120.2863],
  "Tarlac": [15.4755, 120.5963],
  "Cagayan": [17.6132, 121.7270],
  "Bicol": [13.4213, 123.4136],
  "Nueva Ecija": [15.5784, 120.9716],
  "Benguet": [16.4023, 120.5960],
  "Albay": [13.1776, 123.5280],
  "Zambales": [15.5082, 120.0697],
  
  // Common locations used in disaster reports
  "Meycauayan": [14.7345008, 120.9571635],
  "Meycuayan": [14.7345008, 120.9571635], // Common misspelling
  "Molino": [14.3476, 120.9735],
  "Molino 3": [14.3476, 120.9735],
  "Bulacan Province": [14.7969, 120.8787],
  "Cainta": [14.5764, 121.1196],
  "Cainta Rizal": [14.5764, 121.1196],
  "Tagaytay": [14.1151, 120.9633],
  "Tagaytay City": [14.1151, 120.9633],
  "Batanes": [20.4487, 121.9702],
  "Mindoro": [12.7987, 121.0143],
  "Marinduque": [13.4767, 121.9032],
  "Coron": [12.0055, 120.2041],
  "El Nido": [11.1800, 119.4132],
  "Sulu": [6.0474, 121.0000],
  "Tawi-Tawi": [5.1339, 119.9357],
  "Dinagat Islands": [10.1282, 125.6094],
  "Negros": [10.0901, 123.0244],
  "Siargao": [9.8482, 126.0458],
  "Sibuyan": [12.3965, 122.5683]
};

// Function to get coordinates for a specific region or location
export function getCoordinatesForLocation(location: string): [number, number] | null {
  if (!location) return null;
  
  // Check for direct match
  if (regionCoordinates[location]) {
    return regionCoordinates[location];
  }
  
  // Try case insensitive match
  const lowerLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(regionCoordinates)) {
    if (key.toLowerCase() === lowerLocation) {
      return coords;
    }
  }
  
  // Try partial match (for cities that may be written differently)
  for (const [key, coords] of Object.entries(regionCoordinates)) {
    if (key.toLowerCase().includes(lowerLocation) || 
        lowerLocation.includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}

// Default center coordinates for the Philippines map
export const PH_CENTER: [number, number] = [12.8797, 121.7740];

// Default zoom level for the Philippines map
export const DEFAULT_ZOOM = 7;
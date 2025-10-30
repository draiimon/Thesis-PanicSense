/**
 * Philippine Location API
 * 
 * A mock API service to provide Philippine location data
 * Used for location selection in PanicSense
 */

// Types for PSGC (Philippine Standard Geographic Code) entities
export type PSGCRegion = {
  code: string;
  name: string;
  regionName?: string;
}

export type PSGCProvince = {
  code: string;
  name: string;
  regionCode: string;
}

export type PSGCCity = {
  code: string;
  name: string;
  provinceCode: string;
  cityClass: 'HUC' | 'CC' | 'ICC';  // Highly Urbanized City, Component City, Independent Component City
}

export type PSGCMunicipality = {
  code: string;
  name: string;
  provinceCode: string;
}

// NCR is a special region in the Philippines (National Capital Region)
export const DEFAULT_REGION = 'NCR';

// Get all Philippine regions
export function getRegions(): PSGCRegion[] {
  return [
    { code: 'NCR', name: 'National Capital Region (NCR)', regionName: 'Metro Manila' },
    { code: 'CAR', name: 'Cordillera Administrative Region (CAR)', regionName: 'Cordillera' },
    { code: 'R1', name: 'Region I', regionName: 'Ilocos Region' },
    { code: 'R2', name: 'Region II', regionName: 'Cagayan Valley' },
    { code: 'R3', name: 'Region III', regionName: 'Central Luzon' },
    { code: 'R4A', name: 'Region IV-A', regionName: 'CALABARZON' },
    { code: 'R4B', name: 'Region IV-B', regionName: 'MIMAROPA' },
    { code: 'R5', name: 'Region V', regionName: 'Bicol Region' },
    { code: 'R6', name: 'Region VI', regionName: 'Western Visayas' },
    { code: 'R7', name: 'Region VII', regionName: 'Central Visayas' },
    { code: 'R8', name: 'Region VIII', regionName: 'Eastern Visayas' },
    { code: 'R9', name: 'Region IX', regionName: 'Zamboanga Peninsula' },
    { code: 'R10', name: 'Region X', regionName: 'Northern Mindanao' },
    { code: 'R11', name: 'Region XI', regionName: 'Davao Region' },
    { code: 'R12', name: 'Region XII', regionName: 'SOCCSKSARGEN' },
    { code: 'R13', name: 'Region XIII', regionName: 'Caraga' },
    { code: 'BARMM', name: 'Bangsamoro Autonomous Region in Muslim Mindanao', regionName: 'BARMM' }
  ];
}

// Get provinces by region
export function getProvinces(regionCode: string): PSGCProvince[] {
  // Special case for NCR which doesn't have provinces
  if (regionCode === 'NCR') {
    return [];
  }
  
  // For simplicity, returning only a few provinces per region
  const provincesByRegion: Record<string, PSGCProvince[]> = {
    'CAR': [
      { code: 'CAR-ABR', name: 'Abra', regionCode: 'CAR' },
      { code: 'CAR-APA', name: 'Apayao', regionCode: 'CAR' },
      { code: 'CAR-BEN', name: 'Benguet', regionCode: 'CAR' },
      { code: 'CAR-IFU', name: 'Ifugao', regionCode: 'CAR' },
      { code: 'CAR-KAL', name: 'Kalinga', regionCode: 'CAR' },
      { code: 'CAR-MOU', name: 'Mountain Province', regionCode: 'CAR' }
    ],
    'R1': [
      { code: 'R1-ILN', name: 'Ilocos Norte', regionCode: 'R1' },
      { code: 'R1-ILS', name: 'Ilocos Sur', regionCode: 'R1' },
      { code: 'R1-LUN', name: 'La Union', regionCode: 'R1' },
      { code: 'R1-PAN', name: 'Pangasinan', regionCode: 'R1' }
    ],
    'R2': [
      { code: 'R2-BTN', name: 'Batanes', regionCode: 'R2' },
      { code: 'R2-CAG', name: 'Cagayan', regionCode: 'R2' },
      { code: 'R2-ISA', name: 'Isabela', regionCode: 'R2' },
      { code: 'R2-NUV', name: 'Nueva Vizcaya', regionCode: 'R2' },
      { code: 'R2-QUI', name: 'Quirino', regionCode: 'R2' }
    ],
    'R3': [
      { code: 'R3-AUR', name: 'Aurora', regionCode: 'R3' },
      { code: 'R3-BAN', name: 'Bataan', regionCode: 'R3' },
      { code: 'R3-BUL', name: 'Bulacan', regionCode: 'R3' },
      { code: 'R3-NUE', name: 'Nueva Ecija', regionCode: 'R3' },
      { code: 'R3-PAM', name: 'Pampanga', regionCode: 'R3' },
      { code: 'R3-TAR', name: 'Tarlac', regionCode: 'R3' },
      { code: 'R3-ZAM', name: 'Zambales', regionCode: 'R3' }
    ],
    'R4A': [
      { code: 'R4A-BAT', name: 'Batangas', regionCode: 'R4A' },
      { code: 'R4A-CAV', name: 'Cavite', regionCode: 'R4A' },
      { code: 'R4A-LAG', name: 'Laguna', regionCode: 'R4A' },
      { code: 'R4A-QUE', name: 'Quezon', regionCode: 'R4A' },
      { code: 'R4A-RIZ', name: 'Rizal', regionCode: 'R4A' }
    ],
    'R4B': [
      { code: 'R4B-MAD', name: 'Marinduque', regionCode: 'R4B' },
      { code: 'R4B-OCC', name: 'Occidental Mindoro', regionCode: 'R4B' },
      { code: 'R4B-ORI', name: 'Oriental Mindoro', regionCode: 'R4B' },
      { code: 'R4B-PAL', name: 'Palawan', regionCode: 'R4B' },
      { code: 'R4B-ROM', name: 'Romblon', regionCode: 'R4B' }
    ],
    'R5': [
      { code: 'R5-ALB', name: 'Albay', regionCode: 'R5' },
      { code: 'R5-CAM', name: 'Camarines Norte', regionCode: 'R5' },
      { code: 'R5-CAS', name: 'Camarines Sur', regionCode: 'R5' },
      { code: 'R5-CAT', name: 'Catanduanes', regionCode: 'R5' },
      { code: 'R5-MAS', name: 'Masbate', regionCode: 'R5' },
      { code: 'R5-SOR', name: 'Sorsogon', regionCode: 'R5' }
    ],
    'R6': [
      { code: 'R6-AKL', name: 'Aklan', regionCode: 'R6' },
      { code: 'R6-ANT', name: 'Antique', regionCode: 'R6' },
      { code: 'R6-CAP', name: 'Capiz', regionCode: 'R6' },
      { code: 'R6-GUI', name: 'Guimaras', regionCode: 'R6' },
      { code: 'R6-ILO', name: 'Iloilo', regionCode: 'R6' },
      { code: 'R6-NEG', name: 'Negros Occidental', regionCode: 'R6' }
    ],
    'R7': [
      { code: 'R7-BOH', name: 'Bohol', regionCode: 'R7' },
      { code: 'R7-CEB', name: 'Cebu', regionCode: 'R7' },
      { code: 'R7-NEG', name: 'Negros Oriental', regionCode: 'R7' },
      { code: 'R7-SIQ', name: 'Siquijor', regionCode: 'R7' }
    ],
    'R8': [
      { code: 'R8-BIL', name: 'Biliran', regionCode: 'R8' },
      { code: 'R8-EAS', name: 'Eastern Samar', regionCode: 'R8' },
      { code: 'R8-LEY', name: 'Leyte', regionCode: 'R8' },
      { code: 'R8-NOR', name: 'Northern Samar', regionCode: 'R8' },
      { code: 'R8-SMA', name: 'Samar', regionCode: 'R8' },
      { code: 'R8-SOU', name: 'Southern Leyte', regionCode: 'R8' }
    ],
    'R9': [
      { code: 'R9-ZAN', name: 'Zamboanga del Norte', regionCode: 'R9' },
      { code: 'R9-ZAS', name: 'Zamboanga del Sur', regionCode: 'R9' },
      { code: 'R9-ZAS', name: 'Zamboanga Sibugay', regionCode: 'R9' }
    ],
    'R10': [
      { code: 'R10-BUK', name: 'Bukidnon', regionCode: 'R10' },
      { code: 'R10-CAM', name: 'Camiguin', regionCode: 'R10' },
      { code: 'R10-LAN', name: 'Lanao del Norte', regionCode: 'R10' },
      { code: 'R10-MIS', name: 'Misamis Occidental', regionCode: 'R10' },
      { code: 'R10-MIO', name: 'Misamis Oriental', regionCode: 'R10' }
    ],
    'R11': [
      { code: 'R11-COM', name: 'Compostela Valley', regionCode: 'R11' },
      { code: 'R11-DAV', name: 'Davao del Norte', regionCode: 'R11' },
      { code: 'R11-DAS', name: 'Davao del Sur', regionCode: 'R11' },
      { code: 'R11-DAO', name: 'Davao Occidental', regionCode: 'R11' },
      { code: 'R11-DAE', name: 'Davao Oriental', regionCode: 'R11' }
    ],
    'R12': [
      { code: 'R12-NOR', name: 'North Cotabato', regionCode: 'R12' },
      { code: 'R12-SAR', name: 'Sarangani', regionCode: 'R12' },
      { code: 'R12-SOU', name: 'South Cotabato', regionCode: 'R12' },
      { code: 'R12-SUL', name: 'Sultan Kudarat', regionCode: 'R12' }
    ],
    'R13': [
      { code: 'R13-AGU', name: 'Agusan del Norte', regionCode: 'R13' },
      { code: 'R13-AGS', name: 'Agusan del Sur', regionCode: 'R13' },
      { code: 'R13-DIN', name: 'Dinagat Islands', regionCode: 'R13' },
      { code: 'R13-SUR', name: 'Surigao del Norte', regionCode: 'R13' },
      { code: 'R13-SUS', name: 'Surigao del Sur', regionCode: 'R13' }
    ],
    'BARMM': [
      { code: 'BARMM-BAS', name: 'Basilan', regionCode: 'BARMM' },
      { code: 'BARMM-LAN', name: 'Lanao del Sur', regionCode: 'BARMM' },
      { code: 'BARMM-MAG', name: 'Maguindanao', regionCode: 'BARMM' },
      { code: 'BARMM-SLU', name: 'Sulu', regionCode: 'BARMM' },
      { code: 'BARMM-TAW', name: 'Tawi-Tawi', regionCode: 'BARMM' }
    ]
  };
  
  return provincesByRegion[regionCode] || [];
}

// Get NCR cities (special case since NCR is directly subdivided into cities)
export function getNCRCities(): PSGCCity[] {
  return [
    { code: 'NCR-CAL', name: 'Caloocan City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-LAS', name: 'Las Piñas City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MAK', name: 'Makati City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MAL', name: 'Malabon City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MAN', name: 'Mandaluyong City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MNL', name: 'Manila City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MAR', name: 'Marikina City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-MUN', name: 'Muntinlupa City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-NAV', name: 'Navotas City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-PAR', name: 'Parañaque City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-PAS', name: 'Pasay City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-PSG', name: 'Pasig City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-PAT', name: 'Pateros', provinceCode: 'NCR', cityClass: 'HUC' }, // Special case - technically a municipality
    { code: 'NCR-QUE', name: 'Quezon City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-SJU', name: 'San Juan City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-TAG', name: 'Taguig City', provinceCode: 'NCR', cityClass: 'HUC' },
    { code: 'NCR-VAL', name: 'Valenzuela City', provinceCode: 'NCR', cityClass: 'HUC' }
  ];
}

// Get cities and municipalities by province
export function getCitiesAndMunicipalities(provinceCode: string): (PSGCCity | PSGCMunicipality)[] {
  // Special case for NCR
  if (provinceCode === 'NCR') {
    return getNCRCities();
  }
  
  // For simplicity, returning few cities/municipalities per province 
  // Here's a sample implementation for some provinces
  const citiesByProvince: Record<string, (PSGCCity | PSGCMunicipality)[]> = {
    'R3-BUL': [
      { code: 'R3-BUL-MAL', name: 'Malolos City', provinceCode: 'R3-BUL', cityClass: 'CC' },
      { code: 'R3-BUL-MEY', name: 'Meycauayan City', provinceCode: 'R3-BUL', cityClass: 'CC' },
      { code: 'R3-BUL-SJD', name: 'San Jose del Monte City', provinceCode: 'R3-BUL', cityClass: 'CC' },
      { code: 'R3-BUL-BAL', name: 'Balagtas', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-BOC', name: 'Bocaue', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-BUL', name: 'Bulacan', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-CAL', name: 'Calumpit', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-GUM', name: 'Guiguinto', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-HAG', name: 'Hagonoy', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-MAR', name: 'Marilao', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-OBA', name: 'Obando', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-PAO', name: 'Pandi', provinceCode: 'R3-BUL' },
      { code: 'R3-BUL-PAL', name: 'Plaridel', provinceCode: 'R3-BUL' }
    ],
    'R4A-CAV': [
      { code: 'R4A-CAV-BAC', name: 'Bacoor City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-CAV', name: 'Cavite City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-DAM', name: 'Dasmariñas City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-GEN', name: 'General Trias City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-IMU', name: 'Imus City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-TAG', name: 'Tagaytay City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-TRE', name: 'Trece Martires City', provinceCode: 'R4A-CAV', cityClass: 'CC' },
      { code: 'R4A-CAV-ALF', name: 'Alfonso', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-AMO', name: 'Amadeo', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-CAR', name: 'Carmona', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-GEA', name: 'General Emilio Aguinaldo', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-IND', name: 'Indang', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-KAW', name: 'Kawit', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-MAG', name: 'Magallanes', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-MAR', name: 'Maragondon', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-MEN', name: 'Mendez', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-NAC', name: 'Naic', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-NOV', name: 'Noveleta', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-ROS', name: 'Rosario', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-SIL', name: 'Silang', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-TAN', name: 'Tanza', provinceCode: 'R4A-CAV' },
      { code: 'R4A-CAV-TER', name: 'Ternate', provinceCode: 'R4A-CAV' }
    ],
    'R4A-RIZ': [
      { code: 'R4A-RIZ-ANT', name: 'Antipolo City', provinceCode: 'R4A-RIZ', cityClass: 'HUC' },
      { code: 'R4A-RIZ-ANG', name: 'Angono', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-BAR', name: 'Baras', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-BIN', name: 'Binangonan', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-CAI', name: 'Cainta', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-CAR', name: 'Cardona', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-JAL', name: 'Jala-Jala', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-MOC', name: 'Morong', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-PIL', name: 'Pililla', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-ROD', name: 'Rodriguez', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-SMA', name: 'San Mateo', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-TAL', name: 'Taytay', provinceCode: 'R4A-RIZ' },
      { code: 'R4A-RIZ-TER', name: 'Teresa', provinceCode: 'R4A-RIZ' }
    ],
    'R4A-LAG': [
      { code: 'R4A-LAG-BIN', name: 'Biñan City', provinceCode: 'R4A-LAG', cityClass: 'CC' },
      { code: 'R4A-LAG-CAB', name: 'Cabuyao City', provinceCode: 'R4A-LAG', cityClass: 'CC' },
      { code: 'R4A-LAG-CAL', name: 'Calamba City', provinceCode: 'R4A-LAG', cityClass: 'CC' },
      { code: 'R4A-LAG-SAN', name: 'San Pablo City', provinceCode: 'R4A-LAG', cityClass: 'CC' },
      { code: 'R4A-LAG-SPL', name: 'Santa Rosa City', provinceCode: 'R4A-LAG', cityClass: 'CC' },
      { code: 'R4A-LAG-BAY', name: 'Bay', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-CAL', name: 'Calauan', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-LOS', name: 'Los Baños', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-MAG', name: 'Magdalena', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-NAG', name: 'Nagcarlan', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-PAG', name: 'Pagsanjan', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-PAK', name: 'Pakil', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-PAN', name: 'Pangil', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-PIL', name: 'Pila', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-STA', name: 'Santa Cruz', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-SIN', name: 'Siniloan', provinceCode: 'R4A-LAG' },
      { code: 'R4A-LAG-VIC', name: 'Victoria', provinceCode: 'R4A-LAG' }
    ]
  };
  
  return citiesByProvince[provinceCode] || [];
}
/**
 * Comprehensive list of Philippine administrative regions and major cities
 */

// Regions
export const philippineRegions = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Region I (Ilocos Region)",
  "Region II (Cagayan Valley)",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)",
  "Region IV-B (MIMAROPA)",
  "Region V (Bicol Region)",
  "Region VI (Western Visayas)",
  "Region VII (Central Visayas)",
  "Region VIII (Eastern Visayas)",
  "Region IX (Zamboanga Peninsula)",
  "Region X (Northern Mindanao)",
  "Region XI (Davao Region)",
  "Region XII (SOCCSKSARGEN)",
  "Region XIII (Caraga)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
];

// Major cities by region
export const philippineCities = {
  "National Capital Region (NCR)": [
    "Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Parañaque",
    "Pasay", "Caloocan", "Muntinlupa", "Marikina", "Las Piñas", "Mandaluyong",
    "San Juan", "Valenzuela", "Navotas", "Malabon", "Pateros"
  ],
  "Cordillera Administrative Region (CAR)": [
    "Baguio City", "Tabuk", "La Trinidad", "Bangued", "Bontoc", "Lagawe", "Kabugao"
  ],
  "Region I (Ilocos Region)": [
    "Laoag City", "San Fernando City (La Union)", "Vigan City", "Dagupan City", 
    "Alaminos City", "Urdaneta City", "San Carlos City (Pangasinan)"
  ],
  "Region II (Cagayan Valley)": [
    "Tuguegarao City", "Santiago City", "Cauayan City", "Ilagan City", "Bayombong", "Cabarroguis", "Basco"
  ],
  "Region III (Central Luzon)": [
    "San Fernando City (Pampanga)", "Angeles City", "Olongapo City", "Balanga City", 
    "Malolos City", "Tarlac City", "Cabanatuan City", "Palayan City"
  ],
  "Region IV-A (CALABARZON)": [
    "Calamba City", "Batangas City", "Lipa City", "Lucena City", "Antipolo City", 
    "Tagaytay City", "Dasmariñas City", "Santa Rosa City", "Biñan City"
  ],
  "Region IV-B (MIMAROPA)": [
    "Calapan City", "Puerto Princesa City", "Boac", "Mamburao", "Romblon", "Odiongan"
  ],
  "Region V (Bicol Region)": [
    "Legazpi City", "Naga City", "Sorsogon City", "Masbate City", "Virac", "Daet", "Iriga City"
  ],
  "Region VI (Western Visayas)": [
    "Iloilo City", "Bacolod City", "Roxas City", "Kalibo", "San Jose de Buenavista", "Jordan"
  ],
  "Region VII (Central Visayas)": [
    "Cebu City", "Mandaue City", "Lapu-Lapu City", "Tagbilaran City", "Toledo City", 
    "Dumaguete City", "Bogo City", "Tanjay City"
  ],
  "Region VIII (Eastern Visayas)": [
    "Tacloban City", "Ormoc City", "Catbalogan City", "Borongan City", "Calbayog City", 
    "Maasin City", "Catarman"
  ],
  "Region IX (Zamboanga Peninsula)": [
    "Zamboanga City", "Dipolog City", "Pagadian City", "Dapitan City", "Isabela City"
  ],
  "Region X (Northern Mindanao)": [
    "Cagayan de Oro City", "Iligan City", "Valencia City", "Malaybalay City", 
    "Oroquieta City", "Ozamiz City", "Tangub City", "Gingoog City"
  ],
  "Region XI (Davao Region)": [
    "Davao City", "Tagum City", "Panabo City", "Mati City", "Digos City", "Island Garden City of Samal"
  ],
  "Region XII (SOCCSKSARGEN)": [
    "General Santos City", "Koronadal City", "Tacurong City", "Kidapawan City", 
    "Cotabato City", "Alabel"
  ],
  "Region XIII (Caraga)": [
    "Butuan City", "Surigao City", "Bislig City", "Tandag City", "Cabadbaran City", "Bayugan City"
  ],
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": [
    "Cotabato City", "Marawi City", "Lamitan City", "Jolo", "Bongao", "Isabela City"
  ]
};

// Combined flat list of all locations for simple dropdowns
export const allPhilippineLocations = [
  ...philippineRegions,
  ...Object.values(philippineCities).flat()
];

// Generate location tree for hierarchical selection
export const philippineLocationTree = philippineRegions.map(region => ({
  region,
  cities: philippineCities[region as keyof typeof philippineCities] || []
}));

// Default location
export const defaultLocation = "National Capital Region (NCR)";
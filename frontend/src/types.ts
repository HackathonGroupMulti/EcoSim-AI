export type BiomeType = 'grassland' | 'forest' | 'desert' | 'tundra' | 'wetland' | 'mountain';

export type DietType = 'herbivore' | 'carnivore' | 'omnivore' | 'producer';

export interface Species {
  name: string;
  population: number;
  diet: DietType;
  prey: string[];
  predators: string[];
  preferred_biome: BiomeType;
  reproduction_rate: number;
  territory_size: number;
}

export interface Tile {
  x: number;
  y: number;
  biome: BiomeType;
  elevation: number;
  water_level: number;
  vegetation: number;
  species_present: string[];
}

export interface EcosystemState {
  turn: number;
  grid_size: number;
  tiles: Tile[];
  species: Species[];
  season: string;
  temperature: number;
  events_log: string[];
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface SimulationEvent {
  description: string;
  affected_species: string[];
  affected_tiles: TileCoord[];
  severity: 'low' | 'medium' | 'high';
}

export interface SimulationResult {
  new_state: EcosystemState;
  events: SimulationEvent[];
  narration: string;
  warnings: string[];
}

export interface InterventionRequest {
  action: string;
  details?: string;
}

// Biome colors for 3D rendering
export const BIOME_COLORS: Record<BiomeType, string> = {
  grassland: '#8b7355',
  forest: '#2d5a3d',
  desert: '#c4a35a',
  tundra: '#a8b5c4',
  wetland: '#4a6670',
  mountain: '#5a5a6e',
};

// Species icons/emojis for UI
export const SPECIES_ICONS: Record<string, string> = {
  'Grass': '🌿',
  'Oak Tree': '🌳',
  'Rabbit': '🐰',
  'Deer': '🦌',
  'Fox': '🦊',
  'Wolf': '🐺',
  'Hawk': '🦅',
  'Frog': '🐸',
  'Bear': '🐻',
  'default': '🔵',
};

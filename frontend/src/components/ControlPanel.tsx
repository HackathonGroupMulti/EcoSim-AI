import { useState } from 'react';

interface ControlPanelProps {
  temperature: number;
  season: string;
  selectedTile: [number, number] | null;
  onAdvanceTurn: (intervention?: { action: string; details?: string }) => void;
  isLoading: boolean;
}

const INTERVENTION_TYPES = [
  { value: '', label: 'No intervention' },
  { value: 'introduce_species', label: 'Introduce Species' },
  { value: 'remove_species', label: 'Remove Species' },
  { value: 'natural_disaster', label: 'Trigger Disaster' },
  { value: 'change_climate', label: 'Climate Event' },
  { value: 'calamity', label: '💀 CALAMITY' },
];

const SPECIES_OPTIONS = [
  'Wolf', 'Bear', 'Deer', 'Rabbit', 'Fox', 'Hawk', 'Eagle', 'Salmon', 'Beaver'
];

const DISASTER_OPTIONS = [
  'Wildfire', 'Flood', 'Drought', 'Disease Outbreak', 'Harsh Winter'
];

const CLIMATE_OPTIONS = [
  'Temperature Rise', 'Temperature Drop', 'Heavy Rainfall', 'Extended Dry Season'
];

const CALAMITY_OPTIONS = [
  'Meteor Strike',
  'Volcanic Eruption',
  'Toxic Algae Bloom',
  'Invasive Swarm (Locusts)',
  'Mysterious Plague',
  'Earthquake & Tsunami',
  'Nuclear Fallout',
  'Alien Abduction of Top Predators',
  'Zombie Outbreak',
  'Spontaneous Combustion Event',
];

export default function ControlPanel({
  temperature,
  season,
  selectedTile,
  onAdvanceTurn,
  isLoading,
}: ControlPanelProps) {
  const [interventionType, setInterventionType] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const getSecondaryOptions = () => {
    switch (interventionType) {
      case 'introduce_species':
      case 'remove_species':
        return SPECIES_OPTIONS;
      case 'natural_disaster':
        return DISASTER_OPTIONS;
      case 'change_climate':
        return CLIMATE_OPTIONS;
      case 'calamity':
        return CALAMITY_OPTIONS;
      default:
        return [];
    }
  };

  const handleAdvance = () => {
    if (!interventionType || !selectedOption) {
      onAdvanceTurn();
    } else {
      let action = '';
      let details = '';

      switch (interventionType) {
        case 'introduce_species':
          action = `Introduce ${selectedOption} to the ecosystem`;
          if (selectedTile) {
            details = `at tile (${selectedTile[0]}, ${selectedTile[1]})`;
          }
          break;
        case 'remove_species':
          action = `Remove all ${selectedOption} from the ecosystem`;
          break;
        case 'natural_disaster':
          action = `Trigger a ${selectedOption}`;
          if (selectedTile) {
            details = `centered at tile (${selectedTile[0]}, ${selectedTile[1]})`;
          }
          break;
        case 'change_climate':
          action = `${selectedOption} affects the ecosystem`;
          break;
        case 'calamity':
          action = `CALAMITY: ${selectedOption} devastates the ecosystem!`;
          details = 'This is a catastrophic event with severe consequences for all species.';
          break;
      }

      onAdvanceTurn({ action, details });
    }

    // Reset selections after advancing
    setInterventionType('');
    setSelectedOption('');
  };

  const secondaryOptions = getSecondaryOptions();

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-lg p-4 space-y-4">
      <div className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
        Environment
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800 rounded p-3">
          <div className="text-xs text-zinc-500">Temperature</div>
          <div className="text-lg font-semibold">{temperature.toFixed(1)}°C</div>
        </div>
        <div className="bg-zinc-800 rounded p-3">
          <div className="text-xs text-zinc-500">Season</div>
          <div className="text-lg font-semibold capitalize">{season}</div>
        </div>
      </div>

      {/* Selected Tile */}
      {selectedTile && (
        <div className="bg-cyan-900/30 border border-cyan-700/50 rounded p-3">
          <div className="text-xs text-cyan-400">Selected Tile</div>
          <div className="text-sm font-medium">
            Position: ({selectedTile[0]}, {selectedTile[1]})
          </div>
        </div>
      )}

      <div className="border-t border-zinc-700 pt-4">
        <div className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Intervention
        </div>

        {/* Intervention Type */}
        <div className="space-y-3">
          <select
            value={interventionType}
            onChange={(e) => {
              setInterventionType(e.target.value);
              setSelectedOption('');
            }}
            className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            {INTERVENTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Secondary Selection */}
          {secondaryOptions.length > 0 && (
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select...</option>
              {secondaryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Advance Button */}
      <button
        onClick={handleAdvance}
        disabled={isLoading}
        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <span>▶</span>
            Advance Turn
          </>
        )}
      </button>
    </div>
  );
}

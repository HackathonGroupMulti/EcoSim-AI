import type { Species } from '../types';
import { SPECIES_ICONS } from '../types';

interface SpeciesPanelProps {
  species: Species[];
}

function getPopulationColor(current: number, diet: string): string {
  if (diet === 'producer') return 'text-green-400';
  if (current < 10) return 'text-red-400';
  if (current < 30) return 'text-yellow-400';
  return 'text-zinc-200';
}

function formatPopulation(pop: number): string {
  if (pop >= 10000) return `${(pop / 1000).toFixed(1)}k`;
  if (pop >= 1000) return `${(pop / 1000).toFixed(1)}k`;
  return pop.toString();
}

export default function SpeciesPanel({ species }: SpeciesPanelProps) {
  const sortedSpecies = [...species].sort((a, b) => {
    // Sort by diet type: producers first, then herbivores, then carnivores
    const dietOrder = { producer: 0, herbivore: 1, omnivore: 2, carnivore: 3 };
    return dietOrder[a.diet] - dietOrder[b.diet];
  });

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-lg p-4">
      <div className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
        Species
      </div>

      <div className="space-y-2">
        {sortedSpecies.map((s) => {
          const icon = SPECIES_ICONS[s.name] || SPECIES_ICONS.default;
          const popColor = getPopulationColor(s.population, s.diet);
          const isExtinct = s.population === 0;

          return (
            <div
              key={s.name}
              className={`flex items-center justify-between py-1.5 px-2 rounded ${
                isExtinct ? 'bg-red-900/20 opacity-50' : 'hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className={`text-sm ${isExtinct ? 'line-through' : ''}`}>
                  {s.name}
                </span>
              </div>
              <div className={`font-mono text-sm ${popColor}`}>
                {isExtinct ? 'EXTINCT' : formatPopulation(s.population)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend - matches 3D marker colors */}
      <div className="mt-4 pt-3 border-t border-zinc-700">
        <div className="text-xs text-zinc-500 mb-2">Map Markers</div>
        <div className="text-xs text-zinc-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00FF00' }}></span>
            <span>Producers (plants)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00BFFF' }}></span>
            <span>Herbivores</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF0000' }}></span>
            <span>Carnivores</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF8C00' }}></span>
            <span>Omnivores</span>
          </div>
        </div>
      </div>
    </div>
  );
}

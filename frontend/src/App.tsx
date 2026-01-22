import { useState, useEffect, useCallback } from 'react';
import type { EcosystemState, SimulationEvent } from './types';
import { createEcosystem, advanceTurn, loadEcosystem } from './api';
import Header from './components/Header';
import EcosystemViewport from './components/EcosystemViewport';
import ControlPanel from './components/ControlPanel';
import SpeciesPanel from './components/SpeciesPanel';
import EventLog from './components/EventLog';

// Save file format
interface SaveFile {
  version: 1;
  savedAt: string;
  ecosystem: EcosystemState;
  events: SimulationEvent[];
  narration: string;
}

function App() {
  const [ecosystem, setEcosystem] = useState<EcosystemState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [narration, setNarration] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Initialize ecosystem on mount
  useEffect(() => {
    initializeEcosystem();
  }, []);

  const initializeEcosystem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = await createEcosystem(8);
      setEcosystem(state);
      setNarration('A new ecosystem has been created. Click "Advance Turn" to begin the simulation.');
    } catch (err) {
      setError('Failed to connect to backend. Make sure the server is running on localhost:8000');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceTurn = async (intervention?: { action: string; details?: string }) => {
    if (!ecosystem) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await advanceTurn(intervention);
      setEcosystem(result.new_state);
      setEvents(result.events);
      setNarration(result.narration);
      setWarnings(result.warnings);
    } catch (err) {
      setError('Failed to advance simulation. Check the backend logs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save ecosystem to file
  const handleSave = () => {
    if (!ecosystem) return;

    const saveData: SaveFile = {
      version: 1,
      savedAt: new Date().toISOString(),
      ecosystem,
      events,
      narration,
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosim-turn${ecosystem.turn}-${ecosystem.season}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load ecosystem from file
  const handleLoad = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      let saveData: SaveFile;

      try {
        saveData = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file');
      }

      // Check if it's our save format or raw ecosystem state
      let ecosystemToLoad: EcosystemState;

      if (saveData.version && saveData.ecosystem) {
        // It's our save format
        ecosystemToLoad = saveData.ecosystem;
      } else if ((saveData as unknown as EcosystemState).species && (saveData as unknown as EcosystemState).tiles) {
        // It's a raw ecosystem state (maybe exported differently)
        ecosystemToLoad = saveData as unknown as EcosystemState;
      } else {
        throw new Error('Invalid save file format - missing required data');
      }

      // Load into backend
      const loadedState = await loadEcosystem(ecosystemToLoad);
      setEcosystem(loadedState);
      setEvents(saveData.events || []);
      setNarration(saveData.narration || 'Save file loaded successfully!');
      setWarnings([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load: ${errorMessage}`);
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!ecosystem && isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-zinc-400">Initializing ecosystem...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !ecosystem) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={initializeEcosystem}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ecosystem) return null;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      <Header
        turn={ecosystem.turn}
        season={ecosystem.season}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main 3D Viewport */}
        <div className="flex-1 relative">
          <EcosystemViewport
            species={ecosystem.species}
            season={ecosystem.season}
          />
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 z-20 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg p-2 transition-all lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Right Sidebar - Responsive overlay on mobile, fixed on desktop */}
        <div
          className={`
            fixed lg:relative inset-y-0 right-0 z-10
            w-80 max-w-[85vw] p-4 flex flex-col gap-4 overflow-y-auto
            bg-zinc-950 lg:bg-transparent
            border-l border-zinc-800 lg:border-0
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0
          `}
        >
          <ControlPanel
            temperature={ecosystem.temperature}
            season={ecosystem.season}
            selectedTile={null}
            onAdvanceTurn={handleAdvanceTurn}
            isLoading={isLoading}
          />

          <SpeciesPanel species={ecosystem.species} />

          <div className="flex-1 min-h-48">
            <EventLog
              events={events}
              narration={narration}
              warnings={warnings}
            />
          </div>
        </div>

        {/* Backdrop overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[5] lg:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default App;

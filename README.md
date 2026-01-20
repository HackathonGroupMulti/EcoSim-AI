# EcoSim AI

**AI-Powered Ecosystem Simulator** - Watch nature evolve, collapse, or thrive based on your decisions.

Built with Google Gemini for the Google AI Hackathon.

## What is this?

EcoSim AI is an interactive 3D ecosystem simulator where an AI (Google Gemini) acts as the "game master" of nature. Every turn, the AI calculates predator-prey dynamics, seasonal changes, population growth, and environmental events - then narrates what happened in natural language.

**Watch as:**
- Wolves hunt deer, foxes chase rabbits
- Plants grow and spread across the terrain
- Seasons change the landscape
- Your interventions ripple through the food chain
- Calamities devastate (or reshape) the ecosystem

## Features

- **3D Island Visualization** - Beautiful terrain with dynamic water, sky, and species markers
- **AI-Driven Simulation** - Gemini calculates realistic ecosystem dynamics each turn
- **Visual Ecosystem Health** - Sky turns apocalyptic and water becomes murky as the ecosystem degrades
- **Species Tracking** - Color-coded markers show where animals and plants are thriving
- **User Interventions** - Introduce species, trigger disasters, or unleash calamities
- **Natural Language Narration** - The AI explains what's happening in the ecosystem

## Calamity Mode

Feeling destructive? Trigger catastrophic events:
- Meteor Strike
- Volcanic Eruption
- Zombie Outbreak
- Alien Abduction of Top Predators
- ...and more

## Tech Stack

**Frontend:**
- React + TypeScript
- Three.js / React Three Fiber
- Custom GLSL shaders for terrain and water
- Tailwind CSS

**Backend:**
- Python / FastAPI
- Google Gemini API (structured output)
- Pydantic schemas

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google AI API key

### Backend
```bash
cd backend
pip install -r requirements.txt
echo "GOOGLE_API_KEY=your_key_here" > .env
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and start simulating!

## How It Works

1. **Initialization** - Gemini generates a balanced starting ecosystem with producers, herbivores, and carnivores
2. **Each Turn** - The AI receives the current state and calculates:
   - Population changes based on food availability
   - Predator-prey interactions
   - Seasonal effects on reproduction
   - Random events (births, deaths, migrations)
3. **Visualization** - The 3D view updates to reflect:
   - Species populations (colored dots on terrain)
   - Ecosystem health (sky color, water clarity)
   - Seasonal tinting of terrain

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create` | POST | Create a new ecosystem |
| `/advance` | POST | Advance simulation by one turn |
| `/state` | GET | Get current ecosystem state |

## License

MIT

---

*Built for the Google AI Hackathon*

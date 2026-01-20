"""
Ecosystem Simulation Engine powered by Gemini 3.
Handles world state management and AI-driven simulation.
"""

import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import (
    EcosystemState,
    SimulationResult,
    UserIntervention,
    Species,
    Tile,
    BiomeType,
    DietType,
)

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are an advanced ecosystem simulation engine. Your role is to realistically simulate the consequences of time passing and user interventions on a virtual ecosystem.

You must follow ecological principles:
- Predator-prey dynamics (Lotka-Volterra style relationships)
- Carrying capacity limits based on territory and resources
- Seasonal effects on reproduction and survival
- Food chain cascades (removing a species affects others)
- Migration patterns based on resource availability
- Competition between species with similar niches

When advancing the simulation:
1. Calculate population changes based on food availability, predation, and reproduction
2. Update species territories based on population density
3. Apply environmental effects (seasons, weather)
4. Generate realistic events (droughts, migrations, disease outbreaks)
5. Warn about extinction risks or ecological collapse

Be scientifically grounded but make it engaging. The user should feel like they're observing a living world."""


def create_initial_ecosystem(grid_size: int = 8) -> EcosystemState:
    """Create a starting ecosystem with default species and terrain."""

    tiles = []
    for x in range(grid_size):
        for y in range(grid_size):
            # Simple terrain generation - varies by position
            if x < grid_size // 3:
                biome = BiomeType.FOREST
                elevation = 30 + (y * 5)
                water = 60
                vegetation = 80
            elif x < 2 * grid_size // 3:
                biome = BiomeType.GRASSLAND
                elevation = 20
                water = 40
                vegetation = 50
            else:
                biome = BiomeType.WETLAND if y < grid_size // 2 else BiomeType.MOUNTAIN
                elevation = 10 if y < grid_size // 2 else 70
                water = 90 if y < grid_size // 2 else 20
                vegetation = 40 if y < grid_size // 2 else 20

            tiles.append(Tile(
                x=x,
                y=y,
                biome=biome,
                elevation=elevation,
                water_level=water,
                vegetation=vegetation,
                species_present=[]
            ))

    # Starting species
    species = [
        Species(
            name="Grass",
            population=10000,
            diet=DietType.PRODUCER,
            prey=[],
            predators=["Rabbit", "Deer"],
            preferred_biome=BiomeType.GRASSLAND,
            reproduction_rate=1.5,
            territory_size=0.01
        ),
        Species(
            name="Oak Tree",
            population=500,
            diet=DietType.PRODUCER,
            prey=[],
            predators=["Deer"],
            preferred_biome=BiomeType.FOREST,
            reproduction_rate=0.1,
            territory_size=1.0
        ),
        Species(
            name="Rabbit",
            population=200,
            diet=DietType.HERBIVORE,
            prey=["Grass"],
            predators=["Fox", "Hawk"],
            preferred_biome=BiomeType.GRASSLAND,
            reproduction_rate=0.8,
            territory_size=0.5
        ),
        Species(
            name="Deer",
            population=50,
            diet=DietType.HERBIVORE,
            prey=["Grass", "Oak Tree"],
            predators=["Wolf"],
            preferred_biome=BiomeType.FOREST,
            reproduction_rate=0.3,
            territory_size=5.0
        ),
        Species(
            name="Fox",
            population=30,
            diet=DietType.CARNIVORE,
            prey=["Rabbit"],
            predators=["Wolf"],
            preferred_biome=BiomeType.GRASSLAND,
            reproduction_rate=0.25,
            territory_size=8.0
        ),
        Species(
            name="Wolf",
            population=15,
            diet=DietType.CARNIVORE,
            prey=["Deer", "Fox", "Rabbit"],
            predators=[],
            preferred_biome=BiomeType.FOREST,
            reproduction_rate=0.15,
            territory_size=20.0
        ),
        Species(
            name="Hawk",
            population=20,
            diet=DietType.CARNIVORE,
            prey=["Rabbit"],
            predators=[],
            preferred_biome=BiomeType.MOUNTAIN,
            reproduction_rate=0.2,
            territory_size=15.0
        ),
        Species(
            name="Frog",
            population=100,
            diet=DietType.OMNIVORE,
            prey=["Grass"],
            predators=["Hawk"],
            preferred_biome=BiomeType.WETLAND,
            reproduction_rate=0.6,
            territory_size=0.2
        ),
    ]

    # Distribute species across tiles based on preferred biomes
    for tile in tiles:
        for sp in species:
            if tile.biome == sp.preferred_biome:
                tile.species_present.append(sp.name)

    return EcosystemState(
        turn=0,
        grid_size=grid_size,
        tiles=tiles,
        species=species,
        season="spring",
        temperature=15.0,
        events_log=["Ecosystem initialized. The world awakens."]
    )


async def advance_simulation(
    current_state: EcosystemState,
    intervention: UserIntervention | None = None
) -> SimulationResult:
    """
    Advance the ecosystem by one turn using Gemini 3 for reasoning.
    Optionally apply a user intervention.
    """

    prompt_parts = [
        f"Current ecosystem state (Turn {current_state.turn}):\n",
        f"Season: {current_state.season}, Temperature: {current_state.temperature}°C\n\n",
        "Species populations:\n"
    ]

    for sp in current_state.species:
        prompt_parts.append(
            f"- {sp.name}: {sp.population} (eats: {sp.prey}, eaten by: {sp.predators})\n"
        )

    prompt_parts.append(f"\nGrid summary ({current_state.grid_size}x{current_state.grid_size}):\n")

    # Summarize biomes
    biome_counts = {}
    for tile in current_state.tiles:
        biome_counts[tile.biome] = biome_counts.get(tile.biome, 0) + 1
    for biome, count in biome_counts.items():
        prompt_parts.append(f"- {biome.value}: {count} tiles\n")

    if intervention:
        prompt_parts.append(f"\n**USER INTERVENTION**: {intervention.action}")
        if intervention.details:
            prompt_parts.append(f" ({intervention.details})")
        prompt_parts.append("\n")

    prompt_parts.append("""
Advance the simulation by one turn. Consider:
1. How populations change based on predator-prey relationships
2. Seasonal effects (next season if appropriate)
3. Any natural events (storms, disease, migration)
4. Effects of the user intervention if provided

Return the complete new state with updated populations, any new events, and a narrative summary.""")

    prompt = "".join(prompt_parts)

    response = await client.aio.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            thinking_config=types.ThinkingConfig(thinking_level="medium"),
            response_mime_type="application/json",
            response_schema=SimulationResult,
        ),
    )

    result = SimulationResult.model_validate_json(response.text)
    result.new_state.turn = current_state.turn + 1

    # Update tiles based on species changes (Gemini doesn't manage tiles directly)
    result.new_state.tiles = update_tiles_from_state(
        current_state.tiles,
        result.new_state.species,
        result.new_state.season
    )

    return result


def update_tiles_from_state(
    tiles: list[Tile],
    species: list[Species],
    season: str
) -> list[Tile]:
    """
    Update tile vegetation and species_present based on the new species state.
    This derives visual changes from Gemini's species population decisions.
    """
    # Build lookup of species by preferred biome
    species_by_biome: dict[BiomeType, list[Species]] = {}
    for sp in species:
        if sp.preferred_biome not in species_by_biome:
            species_by_biome[sp.preferred_biome] = []
        species_by_biome[sp.preferred_biome].append(sp)

    # Calculate total producer (plant) population for vegetation scaling
    total_plants = sum(sp.population for sp in species if sp.diet == DietType.PRODUCER)
    max_plants = 15000  # Baseline for full vegetation

    updated_tiles = []
    for tile in tiles:
        new_tile = tile.model_copy()

        # Update species_present based on which species prefer this biome
        new_tile.species_present = []
        biome_species = species_by_biome.get(tile.biome, [])
        for sp in biome_species:
            if sp.population > 0:
                new_tile.species_present.append(sp.name)

        # Update vegetation based on producer populations in this biome type
        biome_producers = [sp for sp in biome_species if sp.diet == DietType.PRODUCER]
        if biome_producers:
            producer_pop = sum(sp.population for sp in biome_producers)
            # Scale vegetation 0-100 based on population
            new_tile.vegetation = min(100, max(5, int(producer_pop / max_plants * 100 * 1.5)))

        # Seasonal effects on vegetation
        if season == "winter":
            new_tile.vegetation = max(10, int(new_tile.vegetation * 0.6))
        elif season == "spring":
            new_tile.vegetation = min(100, int(new_tile.vegetation * 1.2))
        elif season == "summer":
            new_tile.vegetation = min(100, int(new_tile.vegetation * 1.1))
        # fall: no change

        # Herbivore grazing reduces vegetation slightly
        biome_herbivores = [sp for sp in biome_species if sp.diet == DietType.HERBIVORE]
        herbivore_pop = sum(sp.population for sp in biome_herbivores)
        grazing_impact = min(20, int(herbivore_pop / 50))
        new_tile.vegetation = max(5, new_tile.vegetation - grazing_impact)

        updated_tiles.append(new_tile)

    return updated_tiles


async def chat_about_ecosystem(
    current_state: EcosystemState,
    user_message: str
) -> str:
    """
    Have a conversation about the ecosystem without advancing time.
    Answer questions, explain dynamics, suggest interventions.
    """

    state_summary = f"""Current ecosystem (Turn {current_state.turn}, {current_state.season}):
Species: {', '.join(f"{s.name}({s.population})" for s in current_state.species)}
"""

    prompt = f"""{state_summary}

User question: {user_message}

Provide a helpful, scientifically-grounded response about this ecosystem.
If the user is asking what they should do, suggest interesting interventions.
Keep responses concise but informative."""

    response = await client.aio.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            thinking_config=types.ThinkingConfig(thinking_level="low"),
        ),
    )

    return response.text

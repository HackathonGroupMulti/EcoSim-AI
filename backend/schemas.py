"""
Pydantic schemas for the Ecosystem Simulator.
Defines the structure of world state, species, and simulation events.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class BiomeType(str, Enum):
    GRASSLAND = "grassland"
    FOREST = "forest"
    DESERT = "desert"
    TUNDRA = "tundra"
    WETLAND = "wetland"
    MOUNTAIN = "mountain"


class DietType(str, Enum):
    HERBIVORE = "herbivore"
    CARNIVORE = "carnivore"
    OMNIVORE = "omnivore"
    PRODUCER = "producer"  # Plants


class Species(BaseModel):
    """A species in the ecosystem."""
    name: str = Field(description="Name of the species")
    population: int = Field(description="Current population count", ge=0)
    diet: DietType = Field(description="What this species eats")
    prey: list[str] = Field(default=[], description="Species this one hunts/eats")
    predators: list[str] = Field(default=[], description="Species that hunt this one")
    preferred_biome: BiomeType = Field(description="Ideal habitat for this species")
    reproduction_rate: float = Field(description="Base reproduction rate per turn", ge=0, le=2)
    territory_size: float = Field(description="Territory per individual (arbitrary units)", ge=0)


class Tile(BaseModel):
    """A single tile in the ecosystem grid."""
    x: int = Field(description="X coordinate")
    y: int = Field(description="Y coordinate")
    biome: BiomeType = Field(description="Type of biome")
    elevation: float = Field(description="Height of terrain", ge=0, le=100)
    water_level: float = Field(description="Water availability 0-100", ge=0, le=100)
    vegetation: float = Field(description="Plant density 0-100", ge=0, le=100)
    species_present: list[str] = Field(default=[], description="Species names on this tile")


class EcosystemState(BaseModel):
    """Complete state of the ecosystem at a point in time."""
    turn: int = Field(description="Current simulation turn", ge=0)
    grid_size: int = Field(description="Size of the grid (grid_size x grid_size)")
    tiles: list[Tile] = Field(description="All tiles in the ecosystem")
    species: list[Species] = Field(description="All species in the ecosystem")
    season: str = Field(description="Current season: spring, summer, fall, winter")
    temperature: float = Field(description="Average temperature in celsius")
    events_log: list[str] = Field(default=[], description="Recent events that occurred")


class TileCoord(BaseModel):
    """A tile coordinate."""
    x: int = Field(description="X coordinate")
    y: int = Field(description="Y coordinate")


class SimulationEvent(BaseModel):
    """An event that occurred during simulation."""
    description: str = Field(description="What happened")
    affected_species: list[str] = Field(default=[], description="Species impacted")
    affected_tiles: list[TileCoord] = Field(default=[], description="Tile coordinates affected")
    severity: str = Field(description="low, medium, or high impact")


class SimulationResult(BaseModel):
    """Result of advancing the simulation one turn."""
    new_state: EcosystemState = Field(description="Updated ecosystem state")
    events: list[SimulationEvent] = Field(description="Events that occurred this turn")
    narration: str = Field(description="Natural language summary of what happened")
    warnings: list[str] = Field(default=[], description="Potential issues like extinction risk")


class UserIntervention(BaseModel):
    """A user action to modify the ecosystem."""
    action: str = Field(description="What the user wants to do")
    details: Optional[str] = Field(default=None, description="Additional context")

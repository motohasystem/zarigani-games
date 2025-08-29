# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Game Overview

This is "ゴブリンアドベンチャー" (Goblin Adventure), a top-view HTML5 Canvas action-adventure game where the player controls a character named ユヅキ (Yuzuki) fighting against goblins and a powerful boss.

## Running the Game

- Open `index.html` in a web browser
- The game uses `game-with-sprites.js` as the main game engine
- No build process required - it's a client-side HTML5 game

## Core Architecture

### Game Structure
- **index.html**: Main game page with UI elements and audio tags
- **game-with-sprites.js**: Complete game engine with sprites support
- **game.js**: Basic version without sprite graphics (fallback)
- **sprites.html**: Tool for generating character sprites
- **sprites-items.html**: Tool for generating item and obstacle sprites

### Key Components

#### Game State Management
- `game` object: Global game state (camera, enemy count, victory/defeat states)
- `player` object: Player stats, position, level progression
- State machine: start screen → gameplay → game over/victory

#### Entity System
- `Enemy` class: Handles 4 enemy types (sword, stone, arrow, boss) with distinct AI patterns
- `player` object: WASD movement, mouse click attacks, leveling system
- Collision detection between entities, walls, and projectiles

#### Sprite System
- Asset loading with fallbacks for missing images
- `drawSprite()` function handles sprite rendering with flipping
- Graceful degradation to colored rectangles if sprites fail to load

#### Level Progression
- Player gains experience by defeating enemies (1 exp per enemy)
- Level up every 3 enemies defeated
- Each level increases attack damage (+5), range (+10), and max HP (+20)
- Attack visual effects become more elaborate with higher levels

#### Boss Combat System
- Boss has 2000 HP (10x normal enemies)
- Two attack patterns based on distance:
  - **Near range (<120px)**: Melee spinning attack (30 damage) or 8-directional shockwave
  - **Far range (<400px)**: Enhanced meteor rain that scales with player level
- Complex visual effects for boss attacks including rotating arc attacks and particle effects

### Audio System
- Modular sound system with graceful fallbacks
- Required audio files in `resource/` directory:
  - `attack.mp3/ogg`: Player attack sound
  - `damage.mp3/ogg`: Player damage sound  
  - `heal.mp3/ogg`: Health potion pickup
  - `enemy_hit.mp3/ogg`: Enemy damage sound
  - `level_up.mp3/ogg`: Level up sound
  - `victory.mp3/ogg`: Victory sound
  - `game_over.mp3/ogg`: Game over sound
  - `bgm.mp3/ogg`: Background music (loops)

### Map System
- 60x40 tile grid (4x larger than single screen)
- Procedurally placed obstacles (walls and rocks) with collision detection
- Camera follows player with boundary constraints
- Health potions scattered throughout map

## Resource Files

### Required Sprites (in `resource/` folder)
- `player.png`: Main character (Yuzuki)
- `goblin.png`: Regular enemies
- `boss.png`: Boss enemy
- `potion.png`: Health recovery items
- `wall.png`: Stone wall obstacles
- `rock.png`: Rock obstacles

### Controls
- **WASD**: Player movement
- **Mouse click**: Attack nearest enemy within range
- Attack has cooldown and visual arc effect that becomes more elaborate with level progression

## Development Notes

### Adding New Enemy Types
- Extend the `Enemy` class constructor with new type checks
- Add corresponding AI behavior in the `update()` method
- Update sprite loading system and drawing logic

### Modifying Game Balance
- Player stats are centralized in the `player` object
- Enemy stats defined in `Enemy` constructor
- Level progression formula in `levelUp()` function
- Attack range and damage calculations in `attack()` function

### Visual Effects System
- Attack effects scale with player level (colors change, particles added)
- Boss has unique melee attack visualization with rotating arcs
- Projectile effects differentiate between normal shots and boss shockwaves
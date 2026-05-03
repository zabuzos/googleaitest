/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClassType, Weapon } from './constants';

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
  name?: string;
  radius: number;
  health: number;
  maxHealth: number;
  angle: number; // in radians
  team: 'NATO' | 'MAFIA';
  animalType: string;
  isDead: boolean;
}

export interface Player extends Entity {
  xp: number;
  level: number;
  classType: ClassType;
  primaryWeapon: Weapon;
  sidearmWeapon: Weapon;
  gadgetWeapon: Weapon;
  activeWeaponType: 'PRIMARY' | 'SIDEARM' | 'GADGET';
  isGadgetOn: boolean; // For laser designator
  primaryAmmo: number;
  sidearmAmmo: number;
  gadgetAmmo: number;
  isReloading: boolean;
  lastFired: number;
  abilityLastUsed: number;
  moveSpeed: number;
  vehicleId: string | null;
  stats: {
    killsByWeapon: Record<string, number>;
  };
  unlockedWeapons: string[];
  unlockedAttachments: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetWeaponId: string;
  targetKills: number;
  rewardWeaponId?: string;
  rewardAttachmentId?: string;
}

export interface AIEntity extends Entity {
  targetId: string | null;
  weapon: Weapon;
  gadgetWeapon?: Weapon;
  lastFired: number;
  primaryAmmo: number;
  sidearmAmmo: number;
  gadgetAmmo: number;
  isReloading: boolean;
  state: 'WANDER' | 'CHASE' | 'ATTACK';
  classType?: ClassType;
}

export interface Projectile extends Point {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  ownerId: string;
  team: 'NATO' | 'MAFIA';
  range: number;
  distanceTraveled: number;
  isExplosive?: boolean;
}

export interface Particle extends Point {
  id: string;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface Obstacle extends Point {
  id: string;
  width: number;
  height: number;
  type: 'CRATE' | 'WALL' | 'BARREL';
}

export interface CapturePoint extends Point {
  id: string;
  name?: string;
  radius: number;
  team: 'NATO' | 'MAFIA' | 'NEUTRAL';
  progress: number; // -1 to 1 (MAFIA to NATO)
  captureSpeed: number;
}

export interface Deployable extends Point {
  id: string;
  type: 'MED_CRATE' | 'TURRET' | 'AP_MINE';
  team: 'NATO' | 'MAFIA';
  radius: number;
  life: number; // how long it lasts
  ownerId: string;
}

export interface GameState {
  player: Player;
  enemies: AIEntity[];
  teammates: AIEntity[];
  capturePoints: CapturePoint[];
  deployables: Deployable[];
  projectiles: Projectile[];
  particles: Particle[];
  obstacles: Obstacle[];
  difficulty: number;
  score: number;
  matchWinner: 'NATO' | 'MAFIA' | null;
  isPaused: boolean;
  camera: Point;
}

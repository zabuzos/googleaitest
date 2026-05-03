/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ClassType {
  ASSAULT = 'Assault',
  ENGINEER = 'Engineer',
  SUPPORT = 'Support',
  RECON = 'Recon',
  SHOCK_TROOP = 'Shock Troop',
}

export enum WeaponType {
  PRIMARY = 'Primary',
  SIDEARM = 'Sidearm',
  GADGET = 'Gadget',
  VEHICLE = 'Vehicle',
}

export enum AttachmentType {
  SIGHT = 'Sight',
  UNDERBARREL = 'Underbarrel',
  MUZZLE = 'Muzzle',
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  damageMod: number; // additive multiplier (e.g. 0.1 for +10%)
  fireRateMod: number; // additive multiplier
  reloadTimeMod: number; // additive multiplier (e.g. -0.2 for -20% time)
  spreadMod: number; // additive multiplier
  unlockLevel: number;
  unlockChallengeId?: string;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number; // ms between shots
  ammoCapacity: number;
  reloadTime: number; // ms
  velocity: number;
  spread: number;
  unlockLevel: number;
  attachments?: {
    [K in AttachmentType]?: string; // attachment id
  };
}

export interface ClassInfo {
  type: ClassType;
  name: string;
  animal: string;
  mafiaAnimal: string; // New field for Mafia team
  description: string;
  abilityName: string;
  abilityDescription: string;
  cooldown: number; // ms
  image?: string;
  mafiaImage?: string;
}

export const CLASSES: Record<ClassType, ClassInfo> = {
  [ClassType.ASSAULT]: {
    type: ClassType.ASSAULT,
    name: 'Assault',
    animal: 'Jack Russell Terrier',
    mafiaAnimal: 'Coyote',
    description: 'High-mobility frontline combatant specializing in aggressive maneuvers.',
    abilityName: 'Combat Stim',
    abilityDescription: 'Burst of speed and fire rate for 5 seconds.',
    cooldown: 15000,
    image: 'https://raw.githubusercontent.com/potuzhnik/cdsdf/main/cfe15e64-6db9-4bf9-b63e-b0d80cbb00d4-removebg-preview.png',
  },
  [ClassType.ENGINEER]: {
    type: ClassType.ENGINEER,
    name: 'Engineer',
    animal: 'Raccoon',
    mafiaAnimal: 'Bulldog',
    description: 'Defensive specialist capable of area denial and vehicle maintenance.',
    abilityName: 'Sentry Turret',
    abilityDescription: 'Deploy an automated turret to cover your flank.',
    cooldown: 25000,
    image: 'https://github.com/potuzhnik/asd/blob/main/1e0fba43-750f-4533-b047-f82bc0a85ead-removebg-preview.png?raw=true',
  },
  [ClassType.SUPPORT]: {
    type: ClassType.SUPPORT,
    name: 'Support',
    animal: 'Capybara',
    mafiaAnimal: 'Bear',
    description: 'Tactical logistics expert focused on unit cohesion and healing.',
    abilityName: 'Aura of Chill',
    abilityDescription: 'Heals nearby teammates over time.',
    cooldown: 12000,
    image: 'https://raw.githubusercontent.com/potuzhnik/cdsdf/main/021f845d-f638-43e5-b129-3a8babb7a974-removebg-preview%20%281%29.png',
  },
  [ClassType.RECON]: {
    type: ClassType.RECON,
    name: 'Recon',
    animal: 'Hedgehog',
    mafiaAnimal: 'Snake',
    description: 'Intelligence specialist providing vital battlefield awareness.',
    abilityName: 'Radar Pulse',
    abilityDescription: 'Reveals all enemies in a large radius.',
    cooldown: 10000,
    image: 'https://github.com/potuzhnik/cdsdf/blob/main/%D0%B7%D0%B0%D0%B2%D0%B0%D0%BD%D1%82%D0%B0%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F.png?raw=true',
  },
  [ClassType.SHOCK_TROOP]: {
    type: ClassType.SHOCK_TROOP,
    name: 'Shock Troop',
    animal: 'Penguin',
    mafiaAnimal: 'Rat',
    description: 'Frontline breacher that excels in close quarters and explosive dominance.',
    abilityName: 'High-Impact Grenade',
    abilityDescription: 'Throw a fragmentation grenade that deals massive area damage.',
    cooldown: 8000,
    image: 'https://raw.githubusercontent.com/potuzhnik/cdsdf/main/5991c3ef-855b-4c41-988e-a559b43951fe-removebg-preview%20%281%29.png',
    mafiaImage: 'https://raw.githubusercontent.com/potuzhnik/cdsdf/main/23b540d1-b844-4204-85b1-d66fc3c3540f-removebg-preview%20%281%29.png',
  },
};

export const ATTACHMENTS: Attachment[] = [
  // Sights
  { id: 'red_dot', name: 'Red Dot', type: AttachmentType.SIGHT, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.3, unlockLevel: 2 },
  { id: 'holo', name: 'Holographic', type: AttachmentType.SIGHT, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.4, unlockLevel: 4 },
  { id: 'acog', name: 'ACOG x4', type: AttachmentType.SIGHT, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.6, unlockLevel: 7 },
  { id: 'thermal', name: 'Thermal Scope', type: AttachmentType.SIGHT, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.5, unlockLevel: 1, unlockChallengeId: 'recon_master' },
  
  // Underbarrels
  { id: 'grip', name: 'Vertical Grip', type: AttachmentType.UNDERBARREL, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.2, unlockLevel: 3 },
  { id: 'laser', name: 'Laser Sight', type: AttachmentType.UNDERBARREL, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.3, unlockLevel: 6 },
  { id: 'angled_grip', name: 'Angled Grip', type: AttachmentType.UNDERBARREL, damageMod: 0, fireRateMod: 0.1, reloadTimeMod: 0, spreadMod: -0.15, unlockLevel: 1, unlockChallengeId: 'speed_demon' },
  
  // Muzzles
  { id: 'suppressor', name: 'Suppressor', type: AttachmentType.MUZZLE, damageMod: -0.1, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.1, unlockLevel: 5 },
  { id: 'compensator', name: 'Compensator', type: AttachmentType.MUZZLE, damageMod: 0, fireRateMod: 0, reloadTimeMod: 0, spreadMod: -0.25, unlockLevel: 8 },
  { id: 'heavy_barrel', name: 'Heavy Barrel', type: AttachmentType.MUZZLE, damageMod: 0.2, fireRateMod: -0.1, reloadTimeMod: 0, spreadMod: -0.05, unlockLevel: 1, unlockChallengeId: 'heavy_hitter' },
];

export const WEAPONS: Weapon[] = [
  {
    id: 'humvee_mg',
    name: 'Humvee MG',
    type: WeaponType.VEHICLE,
    damage: 25,
    fireRate: 80,
    ammoCapacity: 100,
    reloadTime: 4000,
    velocity: 15,
    spread: 0.15,
    unlockLevel: 1,
  },
  {
    id: 'm4a1',
    name: 'M4A1',
    type: WeaponType.PRIMARY,
    damage: 20,
    fireRate: 100,
    ammoCapacity: 30,
    reloadTime: 2000,
    velocity: 12,
    spread: 0.12,
    unlockLevel: 1,
  },
  {
    id: 'mp5',
    name: 'MP5',
    type: WeaponType.PRIMARY,
    damage: 15,
    fireRate: 70,
    ammoCapacity: 30,
    reloadTime: 1500,
    velocity: 10,
    spread: 0.15,
    unlockLevel: 1,
  },
  {
    id: 'ak12',
    name: 'AK-12',
    type: WeaponType.PRIMARY,
    damage: 25,
    fireRate: 150,
    ammoCapacity: 30,
    reloadTime: 2500,
    velocity: 11,
    spread: 0.14,
    unlockLevel: 3,
  },
  {
    id: 'hk416',
    name: 'HK-416',
    type: WeaponType.PRIMARY,
    damage: 22,
    fireRate: 80,
    ammoCapacity: 30,
    reloadTime: 1800,
    velocity: 13,
    spread: 0.11,
    unlockLevel: 5,
  },
  {
    id: 'usp',
    name: 'USP',
    type: WeaponType.SIDEARM,
    damage: 18,
    fireRate: 250,
    ammoCapacity: 12,
    reloadTime: 1200,
    velocity: 9,
    spread: 0.08,
    unlockLevel: 1,
  },
  {
    id: 'm1911',
    name: 'M1911',
    type: WeaponType.SIDEARM,
    damage: 22,
    fireRate: 350,
    ammoCapacity: 7,
    reloadTime: 1400,
    velocity: 9,
    spread: 0.09,
    unlockLevel: 2,
  },
  {
    id: 'rpg',
    name: 'RPG-7',
    type: WeaponType.GADGET,
    damage: 100,
    fireRate: 3000,
    ammoCapacity: 1,
    reloadTime: 3000,
    velocity: 8,
    spread: 0.1,
    unlockLevel: 1,
  },
  {
    id: 'm320',
    name: 'M320 GL',
    type: WeaponType.GADGET,
    damage: 60,
    fireRate: 2000,
    ammoCapacity: 1,
    reloadTime: 2500,
    velocity: 7,
    spread: 0.15,
    unlockLevel: 1,
  },
  {
    id: 'medcrate',
    name: 'Med Crate',
    type: WeaponType.GADGET,
    damage: 0,
    fireRate: 10000,
    ammoCapacity: 1,
    reloadTime: 5000,
    velocity: 0,
    spread: 0,
    unlockLevel: 1,
  },
  {
    id: 'ap_mine',
    name: 'AP Mine',
    type: WeaponType.GADGET,
    damage: 80,
    fireRate: 3000,
    ammoCapacity: 3,
    reloadTime: 5000,
    velocity: 0,
    spread: 0,
    unlockLevel: 1,
  },
  {
    id: 'car816',
    name: 'CAR 816',
    type: WeaponType.PRIMARY,
    damage: 18,
    fireRate: 83.33,
    ammoCapacity: 30,
    reloadTime: 1800,
    velocity: 12.5,
    spread: 0.13,
    unlockLevel: 999, // Unlocked via challenge
  },
  {
    id: 'g36c',
    name: 'G36C',
    type: WeaponType.PRIMARY,
    damage: 24,
    fireRate: 71.43,
    ammoCapacity: 30,
    reloadTime: 1600,
    velocity: 13.5,
    spread: 0.10,
    unlockLevel: 999, // Unlocked via challenge
  },
  {
    id: 'ak5d',
    name: 'AK 5D',
    type: WeaponType.PRIMARY,
    damage: 23,
    fireRate: 76.9, // 13/s
    ammoCapacity: 30,
    reloadTime: 1200,
    velocity: 13,
    spread: 0.07,
    unlockLevel: 12,
  },
  {
    id: 'qbz95b',
    name: 'QBZ-95B',
    type: WeaponType.PRIMARY,
    damage: 21,
    fireRate: 62.5, // 16/s
    ammoCapacity: 30,
    reloadTime: 1300,
    velocity: 14,
    spread: 0.09,
    unlockLevel: 999, // Unlocked via challenge
  },
  {
    id: 'famas_f2',
    name: 'FAMAS F2',
    type: WeaponType.PRIMARY,
    damage: 26,
    fireRate: 400, // Burst delay
    ammoCapacity: 25,
    reloadTime: 1600,
    velocity: 16,
    spread: 0.08,
    unlockLevel: 999, // Unlocked via challenge
  },
  {
    id: 'saiga12k',
    name: 'Saiga 12K',
    type: WeaponType.GADGET,
    damage: 15,
    fireRate: 400,
    ammoCapacity: 8,
    reloadTime: 1600,
    velocity: 15,
    spread: 0.25,
    unlockLevel: 1,
  },
];

export interface Vehicle {
  id: string;
  name: string;
  description: string;
  speed: number;
  healthBonus: number;
  weaponId: string;
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'humvee',
    name: 'Humvee',
    description: 'Armored transport with mounted Machine Gun.',
    speed: 7,
    healthBonus: 150,
    weaponId: 'humvee_mg',
  }
];

export const XP_PER_LEVEL = 1000;
export const XP_PER_KILL = 150;

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetWeaponId: string;
  targetKills: number;
  rewardWeaponId?: string;
  rewardAttachmentId?: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'm4a1_expert',
    title: 'M4A1 Expert',
    description: 'Destroy 30 enemies with M4A1',
    targetWeaponId: 'm4a1',
    targetKills: 30,
    rewardWeaponId: 'car816',
  },
  {
    id: 'recon_master',
    title: 'Recon Master',
    description: 'Kill 20 enemies with HK-416 to unlock Thermal Scope',
    targetWeaponId: 'hk416',
    targetKills: 20,
    rewardAttachmentId: 'thermal',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Kill 25 enemies with MP5 to unlock Angled Grip',
    targetWeaponId: 'mp5',
    targetKills: 25,
    rewardAttachmentId: 'angled_grip',
  },
  {
    id: 'heavy_hitter',
    title: 'Heavy Hitter',
    description: 'Kill 40 enemies with AK-12 to unlock Heavy Barrel',
    targetWeaponId: 'ak12',
    targetKills: 40,
    rewardAttachmentId: 'heavy_barrel',
  },
  {
    id: 'hk416_specialist',
    title: 'HK-416 Specialist',
    description: '100 kills with HK-416',
    targetWeaponId: 'hk416',
    targetKills: 100,
    rewardWeaponId: 'g36c',
  },
  {
    id: 'penguin_assault',
    title: 'The Penguin Assault',
    description: '50 kills with Saiga 12K',
    targetWeaponId: 'saiga12k',
    targetKills: 50,
    rewardWeaponId: 'famas_f2',
  },
  {
    id: 'assault_glory',
    title: 'Assault Glory',
    description: '200 kills with Shock Troop or Assault class',
    targetWeaponId: 'any_assault', // Special handling in code
    targetKills: 200,
    rewardWeaponId: 'qbz95b',
  }
];

export const PLAYER_SPEED = 4;
export const ENEMY_SPEED = 2.5;
export const TEAMMATE_SPEED = 3;
export const MAP_SIZE = 5000;
export const NATO_BASE = { x: 500, y: 500 };
export const MAFIA_BASE = { x: 4500, y: 4500 };

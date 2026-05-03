/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Target, 
  Wrench, 
  Eye, 
  Crosshair, 
  Zap, 
  Skull, 
  Trophy,
  Flame,
  ChevronRight,
  User,
  Settings,
  Lock,
  Pause,
  Play,
  ArrowLeft,
  Flag,
  Truck,
  Check
} from 'lucide-react';
import { 
  ClassType, 
  WeaponType, 
  AttachmentType,
  CLASSES, 
  WEAPONS, 
  ATTACHMENTS,
  PLAYER_SPEED, 
  ENEMY_SPEED, 
  TEAMMATE_SPEED,
  XP_PER_LEVEL,
  XP_PER_KILL,
  MAP_SIZE,
  NATO_BASE,
  MAFIA_BASE,
  CHALLENGES,
  VEHICLES
} from './constants';
import { Player, AIEntity, GameState, Projectile, Particle, Point, CapturePoint } from './types';
import { auth, signIn } from './lib/firebase';
import * as multiplayer from './services/multiplayerService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// --- Utility Functions ---

const distance = (p1: Point, p2: Point) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);

const getAngle = (p1: Point, p2: Point) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

const circleRectCollision = (circle: Point & { radius: number }, rect: Point & { width: number, height: number }) => {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) < (circle.radius * circle.radius);
};

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassType>(ClassType.SUPPORT);
  const [selectedTeam, setSelectedTeam] = useState<'NATO' | 'MAFIA'>('NATO');
  const [selectedPrimary, setSelectedPrimary] = useState(WEAPONS.find(w => w.id === 'm4a1')!);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [matchId, setMatchId] = useState(0);
  const [isSingleplayer, setIsSingleplayer] = useState(false);
  const [gameMode, setGameMode] = useState<'LOBBY' | 'CAPTURE_PREP' | 'CAPTURE' | 'CAMPAIGN' | 'CHALLENGES'>('LOBBY');
  const [isEditingWeapon, setIsEditingWeapon] = useState<string | null>(null);
  const [weaponAttachments, setWeaponAttachments] = useState<Record<string, Record<string, string | null>>>({});
  const [playerStats, setPlayerStats] = useState({ killsByWeapon: {} as Record<string, number> });
  const [unlockedWeapons, setUnlockedWeapons] = useState<string[]>([]);
  const [unlockedAttachments, setUnlockedAttachments] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    await signIn();
  };

  const startGame = () => {
    setGameStarted(true);
    setGameMode('LOBBY');
  };

  const getModifiedWeapon = (weapon: (typeof WEAPONS)[0]) => {
    const attachments = weaponAttachments[weapon.id] || {};
    let damage = weapon.damage;
    let fireRate = weapon.fireRate;
    let reloadTime = weapon.reloadTime;
    let spread = weapon.spread;

    Object.entries(attachments).forEach(([type, attachmentId]) => {
      if (!attachmentId) return;
      const att = ATTACHMENTS.find(a => a.id === attachmentId);
      if (att) {
        damage *= (1 + att.damageMod);
        fireRate /= (1 + att.fireRateMod);
        reloadTime *= (1 + att.reloadTimeMod);
        spread *= (1 + att.spreadMod);
      }
    });

    return {
      ...weapon,
      damage: Math.round(damage),
      fireRate: Math.round(fireRate),
      reloadTime: Math.round(reloadTime),
      spread,
      attachments
    };
  };

  const primaryWithAttachments = useMemo(() => getModifiedWeapon(selectedPrimary), [selectedPrimary, weaponAttachments]);

  const handleLevelUp = (newXp: number, newLevel: number) => {
    setXp(newXp);
    setLevel(newLevel);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-gradient-to-t from-black to-transparent" />
          <motion.div 
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-8"
        >
          <div className="flex justify-center mb-4">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
               className="w-24 h-24 bg-orange-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.4)]"
             >
               <Zap size={48} className="text-white fill-current" />
             </motion.div>
          </div>
          <div className="space-y-2">
            <h1 className="text-8xl font-black italic tracking-tightest uppercase bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-none">
              Animal NATO
            </h1>
            <p className="text-orange-500 font-bold uppercase tracking-[0.5em] text-sm italic">Tactical Animal Warfare</p>
          </div>
          
          {currentUser ? (
            <button 
              onClick={() => setGameStarted(true)}
              className="px-16 py-6 bg-white text-black font-black uppercase italic tracking-tighter text-3xl transition-all hover:bg-orange-500 hover:text-white transform hover:scale-105 active:scale-95 shadow-xl"
            >
              Enter Warzone
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-16 py-6 bg-orange-600 text-white font-black uppercase italic tracking-tighter text-3xl transition-all hover:bg-orange-500 transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-4 mx-auto"
            >
              <User size={32} />
              Login with Google
            </button>
          )}

          <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">V1.0 Operational Status: Stable</p>
        </motion.div>
      </div>
    );
  }

  if (gameMode === 'LOBBY') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-sans selection:bg-orange-500/30">
        <header className="p-8 flex justify-between items-center border-b border-white/5 bg-[#0d0d0f]">
          <button onClick={() => setGameStarted(false)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Title</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">Mission Command</h1>
          </div>
          <div className="w-24"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-5xl font-black tracking-tighter uppercase italic">Select Operation</h2>
            <p className="text-white/40 uppercase tracking-[0.3em] text-sm">Strategic Deployment Options</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <button 
              onClick={() => setGameMode('CAPTURE_PREP')}
              className="relative group overflow-hidden rounded-2xl border border-white/10 bg-[#121215] aspect-video flex flex-col items-center justify-center p-8 transition-all hover:border-orange-500/50 hover:bg-orange-500/10 shadow-lg shadow-black/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <div className="z-20 text-center space-y-6 w-full px-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto group-hover:bg-orange-600 transition-all shadow-inner">
                  <Flag className="text-white" size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors">Capture the Point</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Strategic Tactical Engagement</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-block px-4 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    Live Operation
                  </div>
                  <div className="w-full py-4 bg-orange-600 text-white font-black uppercase italic tracking-tighter text-xl rounded-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-lg shadow-orange-600/20">
                    Deploy Now
                  </div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setGameMode('CHALLENGES')}
              className="relative group overflow-hidden rounded-2xl border border-white/10 bg-[#121215] aspect-video flex flex-col items-center justify-center p-8 transition-all hover:border-orange-500/50 hover:bg-orange-500/10 shadow-lg shadow-black/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <div className="z-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto group-hover:bg-orange-600 transition-colors shadow-inner">
                  <Trophy className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Challenges</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Special Operator Objectives</p>
                </div>
                <div className="inline-block px-4 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                  Weapon Unlocks
                </div>
              </div>
            </button>

            <button 
              disabled
              className="relative group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] aspect-video flex flex-col items-center justify-center p-8 grayscale opacity-50 cursor-not-allowed"
            >
              <div className="z-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Skull className="text-white/20" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white/20">Campaign</h3>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mt-1">Single-Player Narrative (Planned: 1 Character)</p>
                </div>
                <div className="inline-block px-4 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                  Coming Soon
                </div>
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (gameMode === 'CHALLENGES') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-sans selection:bg-orange-500/30">
        <header className="p-8 flex justify-between items-center border-b border-white/5 bg-[#0d0d0f]">
          <button onClick={() => setGameMode('LOBBY')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Mission Control</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">Objectives</h1>
          </div>
          <div className="w-24"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="text-center space-y-4 mb-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">Combat Challenges</h2>
            <p className="text-white/40 uppercase tracking-[0.3em] text-sm">Earn elite equipment by proving your skill</p>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-12 w-full custom-scrollbar snap-x snap-mandatory px-4">
            {CHALLENGES.map(challenge => {
              const currentKills = playerStats.killsByWeapon[challenge.targetWeaponId] || 0;
              const progress = Math.min(100, (currentKills / challenge.targetKills) * 100);
              const isComplete = currentKills >= challenge.targetKills;
              const rewardWeapon = challenge.rewardWeaponId ? WEAPONS.find(w => w.id === challenge.rewardWeaponId) : null;
              const rewardAttachment = challenge.rewardAttachmentId ? ATTACHMENTS.find(a => a.id === challenge.rewardAttachmentId) : null;

              return (
                <div 
                  key={challenge.id} 
                  className="min-w-[450px] snap-center p-8 rounded-2xl border-2 border-white/5 bg-[#121215] flex flex-col gap-6 transition-all hover:border-white/20 group relative overflow-hidden"
                >
                  {isComplete && (
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                  )}
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">Tactical Objective</span>
                      </div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{challenge.title}</h3>
                      <p className="text-white/40 text-[11px] uppercase tracking-widest leading-relaxed pt-2">{challenge.description}</p>
                    </div>
                    {isComplete ? (
                      <div className="p-2 bg-green-500 text-white rounded-lg shadow-lg shadow-green-500/20">
                        <Trophy size={20} />
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                        <span className="text-sm font-black italic text-white/80 font-mono">{currentKills} <span className="text-xs text-white/40">/ {challenge.targetKills}</span></span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 z-10">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                      <span>Completion Status</span>
                      <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${isComplete ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]'}`}
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between z-10">
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Asset Unlocked</div>
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded bg-white/5 ${isComplete ? 'text-green-400' : 'text-orange-500'}`}>
                          <Zap size={16} />
                        </div>
                        <span className="text-lg font-black italic uppercase tracking-tighter text-white/90">
                          {rewardWeapon?.name || rewardAttachment?.name || 'Classified'}
                        </span>
                      </div>
                    </div>
                    {isComplete && (
                      <div className="text-[10px] font-black uppercase italic tracking-tighter text-green-500 bg-green-500/10 px-3 py-1 rounded border border-green-500/20">
                        Operational
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center gap-4 text-white/20">
             <span className="text-[10px] uppercase font-bold tracking-[0.3em] animate-pulse">Swipe to Browse Objectives</span>
          </div>
        </main>
      </div>
    );
  }
  if (gameMode === 'CAPTURE_PREP') {
    return (
      <div className="h-screen bg-[#0a0a0b] text-white flex flex-col font-sans selection:bg-orange-500/30 overflow-hidden">
        <header className="p-6 flex justify-between items-center border-b border-white/5 bg-[#0d0d0f] shrink-0">
          <button onClick={() => setGameMode('LOBBY')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exit Prep</span>
          </button>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Level</div>
              <div className="text-sm font-mono font-bold text-orange-400 leading-tight">{level}</div>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-right">
              <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Experience</div>
              <div className="text-sm font-mono font-bold leading-tight">{xp} / {XP_PER_LEVEL}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto custom-scrollbar bg-[#0d0d0f]/50">
          <div className="max-w-6xl mx-auto px-6 py-10 pb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-none mb-2">
                Unit Deployment
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-6 bg-orange-500/30" />
                <p className="text-orange-500/80 uppercase tracking-[0.4em] text-[8px] font-black font-mono">Mission: Global Secure</p>
                <div className="h-[1px] w-6 bg-orange-500/30" />
              </div>
            </div>

            <div className="space-y-12">
              {/* Category 0: Side Selection */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-red-500 pl-4 py-0.5">
                  <div>
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-white/90">Factions</h3>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Declare your Allegiance</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTeam('NATO')}
                    className={`relative p-8 rounded-2xl transition-all border-2 group overflow-hidden ${
                      selectedTeam === 'NATO' 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 rounded-xl ${selectedTeam === 'NATO' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}>
                        <Shield size={32} />
                      </div>
                      <div className="text-right">
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Animal NATO</h4>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Global Peacekeepers</p>
                      </div>
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">Highly trained domestic and forest animals equipped with Western armament.</p>
                  </button>

                  <button
                    onClick={() => setSelectedTeam('MAFIA')}
                    className={`relative p-8 rounded-2xl transition-all border-2 group overflow-hidden ${
                      selectedTeam === 'MAFIA' 
                      ? 'bg-red-600/10 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 rounded-xl ${selectedTeam === 'MAFIA' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40'}`}>
                        <Skull size={32} />
                      </div>
                      <div className="text-right">
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Rat & Bear Mafia</h4>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Underworld Syndicate</p>
                      </div>
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">Ruthless predators and street-wise rodents utilizing heavy-duty survival gear.</p>
                  </button>
                </div>
              </section>

              {/* Category 1: Specializations */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-orange-500 pl-4 py-0.5">
                  <div>
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-white/90">Specialization</h3>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Select Operator Type</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.values(CLASSES).map((cls) => (
                    <button
                      key={cls.type}
                      onClick={() => setSelectedClass(cls.type)}
                      className={`relative p-5 rounded-xl transition-all border-2 text-left group overflow-hidden ${
                        selectedClass === cls.type 
                        ? 'bg-orange-600/10 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {selectedClass === cls.type && (
                        <div className="absolute top-0 right-0 p-2">
                          <Check size={12} className="text-orange-500" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden ${selectedClass === cls.type ? 'bg-orange-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}>
                          {cls.image ? (
                            <img src={cls.image} alt={cls.animal} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <>
                              {cls.type === ClassType.ASSAULT && <Zap size={20} />}
                              {cls.type === ClassType.ENGINEER && <Wrench size={20} />}
                              {cls.type === ClassType.SUPPORT && <Shield size={20} />}
                              {cls.type === ClassType.RECON && <Eye size={20} />}
                              {cls.type === ClassType.SHOCK_TROOP && <Flame size={20} />}
                            </>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black italic uppercase tracking-tighter text-white">{cls.type}</h4>
                          <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                            {selectedTeam === 'NATO' ? cls.animal : cls.mafiaAnimal}
                          </span>
                        </div>
                      </div>
                      <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{cls.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Category 2: Armament */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-white pl-4 py-0.5">
                  <div>
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-white/90">Primary Armament</h3>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Lethal Engagement Options</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {WEAPONS.filter(w => w.type === WeaponType.PRIMARY).map((weapon) => {
                    const modified = getModifiedWeapon(weapon);
                    const isLockedByLevel = level < weapon.unlockLevel;
                    const isLockedByChallenge = weapon.unlockLevel > 500 && !unlockedWeapons.includes(weapon.id);
                    const isLocked = isLockedByLevel || isLockedByChallenge;
                    
                    return (
                      <div
                        key={weapon.id}
                        className={`relative group rounded-lg border transition-all overflow-hidden ${
                          isLocked ? 'opacity-30 bg-black/40 border-dashed border-white/5 grayscale pointer-events-none' :
                          selectedPrimary.id === weapon.id 
                          ? 'bg-white/5 border-white shadow-[0_10px_20px_rgba(255,255,255,0.05)]' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10 cursor-pointer'
                        }`}
                        onClick={() => !isLocked && setSelectedPrimary(weapon)}
                      >
                        <div className="p-4 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-black italic uppercase tracking-tighter text-white leading-none">{weapon.name}</h4>
                              <p className="text-[8px] font-mono tracking-widest text-white/20 uppercase mt-0.5">NATO Issue</p>
                            </div>
                            {!isLocked && selectedPrimary.id === weapon.id && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest text-white/40">
                                <span>DMG</span>
                                <span className="font-mono">{Math.round(modified.damage)}</span>
                              </div>
                              <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${(weapon.damage / 40) * 100}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest text-white/40">
                                <span>ROF</span>
                                <span className="font-mono">{Math.round(1000/modified.fireRate)}/s</span>
                              </div>
                              <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(150 / weapon.fireRate) * 100}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex items-center justify-between">
                            {isLocked ? (
                              <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">
                                {isLockedByChallenge ? 'LOCKED' : `LVL ${weapon.unlockLevel}`}
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingWeapon(weapon.id);
                                }}
                                className="text-[8px] flex items-center gap-1 font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                              >
                                <Settings size={10} /> Attachments
                              </button>
                            )}
                            {selectedPrimary.id === weapon.id && !isLocked && (
                              <span className="text-[8px] font-black text-white/20 italic uppercase">Equipped</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Category 3: Vehicles */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-blue-500 pl-4 py-0.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black italic uppercase tracking-tighter text-white/90">Motorized Support</h3>
                    <div className="bg-blue-600/20 px-2 py-0.5 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/20">
                      Tier 1
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Infantry Option */}
                  <button
                    onClick={() => setSelectedVehicleId(null)}
                    className={`relative p-4 rounded-lg transition-all border text-left group ${
                      selectedVehicleId === null 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center mb-3 text-white/20">
                      <User size={16} />
                    </div>
                    <h4 className="text-sm font-black italic uppercase tracking-tighter text-white mb-1">On Foot</h4>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest">Infiltration</p>
                  </button>

                  {VEHICLES.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`relative p-4 rounded-lg transition-all border text-left group ${
                        selectedVehicleId === vehicle.id 
                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center transition-all ${selectedVehicleId === vehicle.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/20'}`}>
                          <Truck size={16} />
                        </div>
                      </div>
                      <h4 className="text-sm font-black italic uppercase tracking-tighter text-white mb-1">{vehicle.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 text-[8px] font-bold">SPD+</span>
                        <span className="text-green-400 text-[8px] font-bold">HP+</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Sticky Bottom Deployment Bar */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent backdrop-blur-sm border-t border-white/5 z-40">
           <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
             <div className="hidden sm:flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest mb-0.5">Primary</span>
                  <span className="text-lg font-black italic uppercase tracking-tighter text-white leading-none">{selectedPrimary.name}</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-white/30 tracking-widest mb-0.5">Class</span>
                  <span className="text-lg font-black italic uppercase tracking-tighter text-white leading-none">{selectedClass}</span>
                </div>
             </div>
             
             <div className="flex-1 sm:flex-initial flex items-center gap-3">
                <button 
                  onClick={() => {
                    setIsSingleplayer(true);
                    setGameMode('CAPTURE');
                  }}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-tighter text-xl rounded-lg border border-white/10 transition-all flex items-center gap-2 group"
                >
                  <User size={18} className="group-hover:scale-110 transition-transform" />
                  VS BOTS
                </button>
                <button 
                  onClick={() => {
                    setIsSingleplayer(false);
                    setGameMode('CAPTURE');
                  }}
                  className="flex-1 sm:w-[300px] bg-orange-600 hover:bg-orange-500 text-white font-black uppercase italic tracking-tighter text-2xl py-4 rounded-lg transition-all shadow-[0_10px_30px_rgba(234,88,12,0.3)] flex items-center justify-center gap-3 group active:scale-[0.98] animate-pulse"
                >
                  Deploy
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
           </div>
        </div>

        <AnimatePresence>
          {isEditingWeapon && (
            <WeaponCustomizer 
              weaponId={isEditingWeapon}
              level={level}
              unlockedAttachments={unlockedAttachments}
              currentAttachments={weaponAttachments[isEditingWeapon] || {}}
              onClose={() => setIsEditingWeapon(null)}
              onUpdate={(attachments) => setWeaponAttachments(prev => ({...prev, [isEditingWeapon]: attachments}))}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <GameContainer 
      selectedClass={selectedClass} 
      selectedTeam={selectedTeam}
      gameMode={gameMode}
      isSingleplayer={isSingleplayer}
      selectedPrimary={primaryWithAttachments} 
      selectedVehicleId={selectedVehicleId}
      setSelectedVehicleId={setSelectedVehicleId}
      level={level}
      initialXp={xp}
      initialLevel={level}
      matchId={matchId}
      weaponAttachments={weaponAttachments}
      playerStats={playerStats}
      unlockedWeapons={unlockedWeapons}
      unlockedAttachments={unlockedAttachments}
      setPlayerStats={setPlayerStats}
      setUnlockedWeapons={setUnlockedWeapons}
      setUnlockedAttachments={setUnlockedAttachments}
      onUpdateProgression={handleLevelUp}
      onNextMatch={() => setMatchId(prev => prev + 1)}
      onQuit={() => {
        setIsSingleplayer(false);
        setGameMode('LOBBY');
      }}
    />
  );
}

// --- Weapon Customizer Modal ---

interface WeaponCustomizerProps {
  weaponId: string;
  level: number;
  unlockedAttachments: string[];
  currentAttachments: Record<string, string | null>;
  onClose: () => void;
  onUpdate: (attachments: Record<string, string | null>) => void;
}

function WeaponCustomizer({ weaponId, level, unlockedAttachments, currentAttachments, onClose, onUpdate }: WeaponCustomizerProps) {
  const weapon = WEAPONS.find(w => w.id === weaponId)!;

  const toggleAttachment = (attId: string, type: AttachmentType) => {
    const next = { ...currentAttachments };
    if (next[type] === attId) {
      delete next[type];
    } else {
      next[type] = attId;
    }
    onUpdate(next);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase">{weapon.name} Customization</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest">Level {level} Operator</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Skull size={24} className="text-white/40 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.values(AttachmentType).map(type => (
            <div key={type} className="space-y-4">
              <div className="flex items-center gap-2 border-l-2 border-orange-500 pl-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">{type}</h4>
              </div>
              <div className="space-y-2">
                {ATTACHMENTS.filter(a => a.type === type).map(att => {
                  const isLockedByLevel = level < att.unlockLevel;
                  const isLockedByChallenge = att.unlockChallengeId && !unlockedAttachments.includes(att.id);
                  const isLocked = isLockedByLevel || isLockedByChallenge;
                  
                  const isSelected = currentAttachments[type] === att.id;
                  return (
                    <button
                      key={att.id}
                      disabled={isLocked}
                      onClick={() => toggleAttachment(att.id, type)}
                      className={`w-full text-left p-4 rounded border transition-all relative ${
                        isLocked ? 'opacity-30 grayscale cursor-not-allowed border-white/5' :
                        isSelected ? 'bg-orange-600/20 border-orange-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{att.name}</span>
                        {isLocked && <Lock size={12} className="text-white/40" />}
                      </div>
                      <div className="space-y-1">
                        {att.spreadMod !== 0 && <div className="text-[10px] text-blue-400 font-mono">Accuracy: {att.spreadMod < 0 ? '+' : '-'}{Math.abs(Math.round(att.spreadMod * 100))}%</div>}
                        {att.damageMod !== 0 && <div className="text-[10px] text-green-400 font-mono">Damage: {att.damageMod > 0 ? '+' : ''}{Math.round(att.damageMod * 100)}%</div>}
                        {att.fireRateMod !== 0 && <div className="text-[10px] text-yellow-400 font-mono">Rate of Fire: {att.fireRateMod > 0 ? '+' : ''}{Math.round(att.fireRateMod * 100)}%</div>}
                        {att.reloadTimeMod !== 0 && <div className="text-[10px] text-orange-400 font-mono">Reload Speed: {att.reloadTimeMod < 0 ? '+' : '-'}{Math.abs(Math.round(att.reloadTimeMod * 100))}%</div>}
                      </div>
                      {isLocked && (
                        <div className="mt-2 text-[9px] font-bold text-orange-500 uppercase">
                          {isLockedByChallenge ? 'CHALLENGE REWARD' : `Unlocks at Lv. ${att.unlockLevel}`}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest text-xs rounded transition-all"
          >
            Confirm Loadout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Minimap Component ---

interface MinimapProps {
  gameState: GameState;
  remotePlayers: any[];
}

function Minimap({ gameState, remotePlayers }: MinimapProps) {
  const { player, enemies, teammates } = gameState;
  const size = 180;
  const scale = size / MAP_SIZE;

  return (
    <div className="bg-black/80 backdrop-blur border border-white/10 rounded-lg overflow-hidden relative pointer-events-none" style={{ width: size, height: size }}>
      {/* Map Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full border border-orange-500/20 grid grid-cols-4 grid-rows-4">
          {[...Array(16)].map((_, i) => <div key={i} className="border border-white/5" />)}
        </div>
      </div>
      
      {/* Capture Points */}
      {gameState.capturePoints.map(cp => (
        <div 
          key={cp.id} 
          className={`absolute rounded-full border ${cp.team === 'NATO' ? 'border-blue-500 bg-blue-500/20' : cp.team === 'MAFIA' ? 'border-red-500 bg-red-500/20' : 'border-white/20'}`}
          style={{ 
            left: (cp.x - cp.radius) * scale, 
            top: (cp.y - cp.radius) * scale, 
            width: cp.radius * 2 * scale, 
            height: cp.radius * 2 * scale 
          }} 
        />
      ))}
      
      {/* Entities */}
      {gameState.obstacles.map(o => (
        <div 
          key={o.id} 
          className="absolute bg-white/20" 
          style={{ 
            left: o.x * scale, 
            top: o.y * scale, 
            width: Math.max(2, o.width * scale), 
            height: Math.max(2, o.height * scale) 
          }} 
        />
      ))}
      {teammates.filter(t => !t.isDead).map(t => (
        <div 
          key={t.id} 
          className="absolute w-1 h-1 bg-blue-500 rounded-full" 
          style={{ left: t.x * scale, top: t.y * scale, transform: 'translate(-50%, -50%)' }} 
        />
      ))}
      {enemies.filter(e => !e.isDead).map(e => (
        <div 
          key={e.id} 
          className="absolute w-1 h-1 bg-red-500 rounded-full" 
          style={{ left: e.x * scale, top: e.y * scale, transform: 'translate(-50%, -50%)' }} 
        />
      ))}
      {remotePlayers.filter(p => !p.isDead && typeof p.x === 'number' && typeof p.y === 'number').map(p => (
        <div 
          key={p.id} 
          className={`absolute w-2 h-2 rounded-full border border-white/40 ${p.team === 'NATO' ? 'bg-blue-400 shadow-[0_0_4px_#60a5fa]' : 'bg-red-400 shadow-[0_0_4px_#f87171]'}`}
          style={{ 
            left: p.x * scale, 
            top: p.y * scale, 
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }} 
        />
      ))}
      <div 
        className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_rgba(249,115,22,1)]" 
        style={{ left: player.x * scale, top: player.y * scale, transform: 'translate(-50%, -50%)' }} 
      />

      {/* Map Borders */}
      <div className="absolute inset-0 border border-red-500/30 pointer-events-none" />
    </div>
  );
}

// --- Game Engine Container ---

interface GameContainerProps {
  selectedClass: ClassType;
  selectedTeam: 'NATO' | 'MAFIA';
  gameMode: string;
  isSingleplayer: boolean;
  selectedPrimary: typeof WEAPONS[0];
  selectedVehicleId: string | null;
  level: number;
  initialXp: number;
  initialLevel: number;
  matchId: number;
  weaponAttachments: Record<string, Record<string, string | null>>;
  playerStats: { killsByWeapon: Record<string, number> };
  unlockedWeapons: string[];
  unlockedAttachments: string[];
  setSelectedVehicleId: React.Dispatch<React.SetStateAction<string | null>>;
  setPlayerStats: React.Dispatch<React.SetStateAction<{ killsByWeapon: Record<string, number> }>>;
  setUnlockedWeapons: React.Dispatch<React.SetStateAction<string[]>>;
  setUnlockedAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateProgression: (xp: number, level: number) => void;
  onNextMatch: () => void;
  onQuit: () => void;
}

function GameContainer({ 
  selectedClass, 
  selectedTeam,
  gameMode,
  selectedPrimary: initialPrimary, 
  selectedVehicleId,
  initialXp, 
  initialLevel, 
  matchId, 
  weaponAttachments, 
  playerStats,
  unlockedWeapons,
  unlockedAttachments,
  setSelectedVehicleId,
  setPlayerStats,
  setUnlockedWeapons,
  setUnlockedAttachments,
  onUpdateProgression, 
  onNextMatch, 
  onQuit,
  isSingleplayer
}: GameContainerProps & { isSingleplayer: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const capyImg = useRef<HTMLImageElement | null>(null);
  const raccoonImg = useRef<HTMLImageElement | null>(null);
  const hedgehogImg = useRef<HTMLImageElement | null>(null);
  const penguinImg = useRef<HTMLImageElement | null>(null);
  const ratImg = useRef<HTMLImageElement | null>(null);
  const dogImg = useRef<HTMLImageElement | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const gameStateRef = useRef<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [currentXp, setCurrentXp] = useState(initialXp);
  const [currentClass, setCurrentClass] = useState(selectedClass);
  const [currentPrimary, setCurrentPrimary] = useState(initialPrimary);
  const [remotePlayers, setRemotePlayers] = useState<any[]>([]);
  const remotePlayersRef = useRef<any[]>([]);
  const isPausedRef = useRef(isPaused);
  const matchDocId = `match-${matchId}`; 
  const isHost = useRef(false);
  const [generatedPlayerId] = useState(() => auth.currentUser?.uid || 'anon-' + Math.random().toString(36).substring(2, 9));
  const playerIdRef = useRef<string>(generatedPlayerId);
  useEffect(() => {
    playerIdRef.current = generatedPlayerId;
  }, [generatedPlayerId]);
  const keys = useRef<Set<string>>(new Set());
  const mouse = useRef<Point & { down: boolean }>({ x: 0, y: 0, down: false });
  const lastSyncTimeRef = useRef(0);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Load assets
  useEffect(() => {
    const img = new Image();
    img.src = CLASSES[ClassType.SUPPORT].image!;
    img.onload = () => {
      capyImg.current = img;
    };
    img.onerror = () => {
      console.error("Failed to load Capybara image from:", img.src);
    };

    const rImg = new Image();
    rImg.src = CLASSES[ClassType.ENGINEER].image!;
    rImg.onload = () => {
      raccoonImg.current = rImg;
    };

    const hImg = new Image();
    hImg.src = "https://github.com/potuzhnik/cdsdf/blob/main/%D0%B7%D0%B0%D0%B2%D0%B0%D0%BD%D1%82%D0%B0%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F.png?raw=true";
    hImg.crossOrigin = "anonymous";
    hImg.onload = () => {
      hedgehogImg.current = hImg;
    };

     const pImg = new Image();
    pImg.src = CLASSES[ClassType.SHOCK_TROOP].image!;
    pImg.onload = () => {
      console.log("Penguin image loaded successfully", pImg.src);
      penguinImg.current = pImg;
    };
    pImg.onerror = () => {
      console.error("Failed to load Penguin image from:", pImg.src);
    };

    const ratLdr = new Image();
    ratLdr.src = CLASSES[ClassType.SHOCK_TROOP].mafiaImage!;
    ratLdr.onload = () => {
      console.log("Rat image loaded successfully", ratLdr.src);
      ratImg.current = ratLdr;
    };
    ratLdr.onerror = () => {
      console.error("Failed to load Rat image from:", ratLdr.src);
    };

    const dogLdr = new Image();
    dogLdr.src = CLASSES[ClassType.ASSAULT].image!;
    dogLdr.onload = () => {
      console.log("Dog image loaded successfully", dogLdr.src);
      dogImg.current = dogLdr;
    };
    dogLdr.onerror = () => {
      console.error("Failed to load Dog image from:", dogLdr.src);
    };
  }, []);

  const resetMatch = () => {
    onNextMatch();
  };

  const getGadgetForClass = (cls: ClassType) => {
    switch(cls) {
      case ClassType.ASSAULT: return WEAPONS.find(w => w.id === 'm320')!;
      case ClassType.ENGINEER: return WEAPONS.find(w => w.id === 'rpg')!;
      case ClassType.SUPPORT: return WEAPONS.find(w => w.id === 'medcrate')!;
      case ClassType.RECON: return WEAPONS.find(w => w.id === 'ap_mine')!;
      case ClassType.SHOCK_TROOP: return WEAPONS.find(w => w.id === 'saiga12k')!;
      default: return WEAPONS.find(w => w.id === 'ap_mine')!;
    }
  };

  // Initialize Game Logic
  useEffect(() => {
    const sidearm = WEAPONS.find(w => w.id === 'usp')!;
    const initialState: GameState = {
      player: {
        id: playerIdRef.current,
        x: selectedTeam === 'NATO' ? NATO_BASE.x : MAFIA_BASE.x,
        y: selectedTeam === 'NATO' ? NATO_BASE.y : MAFIA_BASE.y,
        radius: selectedVehicleId ? 35 : 20,
        health: 100 + (selectedVehicleId ? (VEHICLES.find(v => v.id === selectedVehicleId)?.healthBonus || 0) : 0),
        maxHealth: 100 + (selectedVehicleId ? (VEHICLES.find(v => v.id === selectedVehicleId)?.healthBonus || 0) : 0),
        angle: selectedTeam === 'NATO' ? 0 : Math.PI,
        team: selectedTeam,
        animalType: selectedTeam === 'NATO' ? CLASSES[currentClass].animal : CLASSES[currentClass].mafiaAnimal,
        isDead: false,
        xp: currentXp,
        level: currentLevel,
        classType: currentClass,
        primaryWeapon: selectedVehicleId ? (WEAPONS.find(w => w.id === (VEHICLES.find(v => v.id === selectedVehicleId)?.weaponId))!) : currentPrimary,
        sidearmWeapon: sidearm,
        gadgetWeapon: getGadgetForClass(currentClass),
        activeWeaponType: 'PRIMARY',
        isGadgetOn: false,
        primaryAmmo: selectedVehicleId ? (WEAPONS.find(w => w.id === (VEHICLES.find(v => v.id === selectedVehicleId)?.weaponId))?.ammoCapacity || 0) : currentPrimary.ammoCapacity,
        sidearmAmmo: sidearm.ammoCapacity,
        gadgetAmmo: getGadgetForClass(currentClass).ammoCapacity,
        isReloading: false,
        lastFired: 0,
        abilityLastUsed: 0,
        moveSpeed: selectedVehicleId ? (VEHICLES.find(v => v.id === selectedVehicleId)?.speed || PLAYER_SPEED) : PLAYER_SPEED,
        vehicleId: selectedVehicleId,
        stats: playerStats,
        unlockedWeapons: unlockedWeapons,
        unlockedAttachments: unlockedAttachments,
      },
      enemies: [],
      teammates: [],
      capturePoints: [],
      deployables: [],
      projectiles: [],
      particles: [],
      obstacles: [],
      difficulty: 1,
      score: 0,
      matchWinner: null,
      isPaused: false,
      camera: { x: selectedTeam === 'NATO' ? NATO_BASE.x : MAFIA_BASE.x, y: selectedTeam === 'NATO' ? NATO_BASE.y : MAFIA_BASE.y },
    };

    // Add Capture Points
    initialState.capturePoints = [
      { id: 'alpha', x: MAP_SIZE * 0.3, y: MAP_SIZE * 0.3, name: 'ALPHA', radius: 120, team: 'NEUTRAL', progress: 0, captureSpeed: 0.005 },
      { id: 'bravo', x: MAP_SIZE / 2, y: MAP_SIZE / 2, name: 'BRAVO', radius: 120, team: 'NEUTRAL', progress: 0, captureSpeed: 0.005 },
      { id: 'charlie', x: MAP_SIZE * 0.7, y: MAP_SIZE * 0.7, name: 'CHARLIE', radius: 120, team: 'NEUTRAL', progress: 0, captureSpeed: 0.005 },
    ];

    // Add obstacles
    for (let i = 0; i < 60; i++) {
       const type = Math.random() > 0.6 ? 'CRATE' : (Math.random() > 0.5 ? 'WALL' : 'BARREL');
       const width = type === 'WALL' ? (Math.random() > 0.5 ? 160 : 50) : 60;
       const height = type === 'WALL' ? (width === 160 ? 50 : 160) : 60;
       const x = Math.random() * (MAP_SIZE - 200) + 100;
       const y = Math.random() * (MAP_SIZE - 200) + 100;
       if (distance({x, y}, NATO_BASE) < 400 || distance({x, y}, MAFIA_BASE) < 400) { i--; continue; }
       initialState.obstacles.push({ id: `obs-${i}`, x, y, width, height, type: type as any });
    }

    // Add initial bots
    const allyTeam = selectedTeam;
    const enemyTeam = selectedTeam === 'NATO' ? 'MAFIA' : 'NATO';
    const allyBase = allyTeam === 'NATO' ? NATO_BASE : MAFIA_BASE;
    const enemyBase = allyTeam === 'NATO' ? MAFIA_BASE : NATO_BASE;

    initialState.teammates = [ClassType.ASSAULT, ClassType.RECON, ClassType.ENGINEER, ClassType.SHOCK_TROOP].map((type, i) => ({
      id: `ally-bot-${i}`,
      x: allyBase.x + (Math.random() - 0.5) * 300,
      y: allyBase.y + (Math.random() - 0.5) * 300,
      radius: 20,
      health: 100,
      maxHealth: 100,
      angle: allyTeam === 'NATO' ? 0 : Math.PI,
      team: allyTeam,
      animalType: allyTeam === 'NATO' ? CLASSES[type].animal : CLASSES[type].mafiaAnimal,
      isDead: false,
      targetId: null,
      weapon: WEAPONS[0],
      gadgetWeapon: getGadgetForClass(type),
      lastFired: 0,
      primaryAmmo: WEAPONS[0].ammoCapacity,
      sidearmAmmo: WEAPONS.find(w => w.id === 'usp')!.ammoCapacity,
      gadgetAmmo: getGadgetForClass(type).ammoCapacity,
      isReloading: false,
      state: 'WANDER',
      classType: type,
    }));

    for (let i = 0; i < 10; i++) {
        const animalType = enemyTeam === 'MAFIA' ? (Math.random() > 0.3 ? 'Rat' : 'Bear') : (Math.random() > 0.5 ? 'Cat' : 'Dog');
        const r = Math.random();
        const gadget = r > 0.75 ? WEAPONS.find(w => w.id === 'rpg')! : (r > 0.5 ? WEAPONS.find(w => w.id === 'm320')! : (r > 0.25 ? WEAPONS.find(w => w.id === 'medcrate')! : WEAPONS.find(w => w.id === 'ap_mine')!));
        
        initialState.enemies.push({
            id: `enemy-bot-${i}`,
            x: enemyBase.x + (Math.random() - 0.5) * 500,
            y: enemyBase.y + (Math.random() - 0.5) * 500,
            radius: (animalType === 'Bear' || animalType === 'Dog') ? 30 : 18,
            health: (animalType === 'Bear' || animalType === 'Dog') ? 150 : 50,
            maxHealth: (animalType === 'Bear' || animalType === 'Dog') ? 150 : 50,
            angle: enemyTeam === 'MAFIA' ? Math.PI : 0,
            team: enemyTeam,
            animalType: animalType,
            isDead: false,
            targetId: null,
            weapon: WEAPONS[Math.floor(Math.random() * 2)],
            gadgetWeapon: gadget,
            lastFired: 0,
            primaryAmmo: 30,
            sidearmAmmo: 15,
            gadgetAmmo: gadget.ammoCapacity,
            isReloading: false,
            state: 'CHASE',
        });
    }

    // Only initialize if we're not already in a match or if gameMode just changed to PREP
    if (gameMode !== 'CAPTURE_PREP' && gameMode !== 'LOBBY' && gameStateRef.current) return;

    setGameState(initialState);
    gameStateRef.current = initialState;
  }, [matchId, selectedTeam, selectedClass, selectedVehicleId, gameMode]); 

  useEffect(() => {
    if (gameMode !== 'CAPTURE') return;

    // Determine starting position based on team bases
    const startPos = selectedTeam === 'NATO' ? NATO_BASE : MAFIA_BASE;

    // Join match
    const p: Player = {
      ...gameStateRef.current!.player,
      id: playerIdRef.current,
      name: auth.currentUser?.displayName || 'Warrior'
    };
    
    multiplayer.joinMatch(matchDocId, p);

    if (isSingleplayer) return;

    const unsubMatch = multiplayer.listenToMatch(matchDocId, (matchData) => {
      if (matchData && matchData.capturePoints) {
        setGameState(prev => {
          if (!prev) return null;
          const next = { ...prev };
          // Sync capture points from server
          next.capturePoints = matchData.capturePoints.map((cp: any) => {
            const existing = prev.capturePoints.find(point => point.id === cp.id);
            return { ...existing, ...cp };
          });
          gameStateRef.current = next;
          return next;
        });
      }
    }, (error: any) => {
      if (error.message.includes('Quota exceeded')) {
        setQuotaExceeded(true);
      }
    });

    const unsubPlayers = multiplayer.listenToPlayers(matchDocId, (players) => {
      console.log(`Synced Peers for ${matchDocId}:`, players.length);
      const myId = playerIdRef.current;
      const filtered = players.filter(pl => pl.id !== myId);
      setRemotePlayers(filtered);
      remotePlayersRef.current = filtered;
    }, (error: any) => {
      if (error.message.includes('Quota exceeded')) {
        setQuotaExceeded(true);
      }
    });

    const unsubProjectiles = multiplayer.listenToProjectiles(matchDocId, (projectiles) => {
      setGameState(prev => {
        if (!prev) return null;
        const next = { ...prev };
        const myId = playerIdRef.current;
        projectiles.forEach(proj => {
          if (proj.ownerId !== myId && !next.projectiles.find(pr => pr.id === proj.id)) {
            next.projectiles.push({
              ...proj,
              vx: Math.cos(proj.angle) * 15,
              vy: Math.sin(proj.angle) * 15,
              distanceTraveled: 0,
              range: 800
            });
          }
        });
        gameStateRef.current = next;
        return next;
      });
    }, (error: any) => {
       if (error.message.includes('Quota exceeded')) {
        setQuotaExceeded(true);
      }
    });

    const unsubDeployables = multiplayer.listenToDeployables(matchDocId, (remoteDeployables) => {
      setGameState(prev => {
        if (!prev) return null;
        const next = { ...prev };
        const myId = playerIdRef.current;
        
        remoteDeployables.forEach(rd => {
          if (rd.ownerId !== myId) {
             const existingIdx = next.deployables.findIndex(d => d.id === rd.id);
             if (existingIdx === -1) {
               next.deployables.push({
                 id: rd.id,
                 x: rd.x,
                 y: rd.y,
                 type: rd.type,
                 team: rd.team,
                 radius: rd.radius,
                 life: rd.life,
                 ownerId: rd.ownerId
               });
             } else {
               // Update existing
               next.deployables[existingIdx].life = rd.life;
             }
          }
        });

        // Cleanup removed ones
        next.deployables = next.deployables.filter(d => {
          if (d.ownerId === myId) return true;
          return remoteDeployables.find(rd => rd.id === d.id);
        });

        gameStateRef.current = next;
        return next;
      });
    }, (error: any) => {
       if (error.message.includes('Quota exceeded')) {
        setQuotaExceeded(true);
      }
    });

    return () => {
      unsubMatch();
      unsubPlayers();
      unsubProjectiles();
      unsubDeployables();
    };
  }, [gameMode, selectedTeam, selectedClass, auth.currentUser, matchId]);

  const getModifiedWeaponLocal = (weapon: (typeof WEAPONS)[0]) => {
    const attachments = weaponAttachments[weapon.id] || {};
    let damage = weapon.damage;
    let fireRate = weapon.fireRate;
    let reloadTime = weapon.reloadTime;
    let spread = weapon.spread;

    Object.entries(attachments).forEach(([_, attachmentId]) => {
      if (!attachmentId) return;
      const att = ATTACHMENTS.find(a => a.id === attachmentId);
      if (att) {
        damage *= (1 + att.damageMod);
        fireRate /= (1 + att.fireRateMod);
        reloadTime *= (1 + att.reloadTimeMod);
        spread *= (1 + att.spreadMod);
      }
    });

    return {
      ...weapon,
      damage: Math.round(damage),
      fireRate: Math.round(fireRate),
      reloadTime: Math.round(reloadTime),
      spread,
      attachments
    };
  };

  const revive = (newClass: ClassType, newPrimaryBase: typeof WEAPONS[0], newVehicleId: string | null) => {
    const newPrimary = getModifiedWeaponLocal(newPrimaryBase);
    setCurrentClass(newClass);
    setCurrentPrimary(newPrimary);
    setIsPaused(false);
    setGameState(prev => {
      if (!prev) return null;
      const vehicle = newVehicleId ? VEHICLES.find(v => v.id === newVehicleId) : null;
      const weapon = vehicle ? (WEAPONS.find(w => w.id === vehicle.weaponId)!) : newPrimary;
      
      const startPos = selectedTeam === 'NATO' ? NATO_BASE : MAFIA_BASE;
      const animalType = selectedTeam === 'NATO' ? CLASSES[newClass].animal : CLASSES[newClass].mafiaAnimal;

      const next: GameState = {
        ...prev,
        player: {
          ...prev.player,
          x: startPos.x + (Math.random() - 0.5) * 100,
          y: startPos.y + (Math.random() - 0.5) * 100,
          health: 100 + (vehicle?.healthBonus || 0),
          maxHealth: 100 + (vehicle?.healthBonus || 0),
          isDead: false,
          team: selectedTeam,
          classType: newClass,
          primaryWeapon: weapon,
          gadgetWeapon: getGadgetForClass(newClass),
          activeWeaponType: 'PRIMARY',
          animalType: animalType,
          primaryAmmo: weapon.ammoCapacity,
          sidearmAmmo: WEAPONS.find(w => w.id === 'usp')!.ammoCapacity,
          gadgetAmmo: getGadgetForClass(newClass).ammoCapacity,
          isReloading: false,
          lastFired: 0,
          abilityLastUsed: 0,
          moveSpeed: vehicle?.speed || PLAYER_SPEED,
          vehicleId: newVehicleId,
          radius: newVehicleId ? 35 : 20,
        },
        camera: {
          ...prev.camera,
          x: startPos.x,
          y: startPos.y
        }
      };
      
      gameStateRef.current = next;
      return next;
    });
  };

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      if (e.key === 'Escape') setIsPaused(prev => !prev);
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    const handleMouseDown = () => (mouse.current.down = true);
    const handleMouseUp = () => (mouse.current.down = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Main Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const gameLoop = (time: number) => {
      const currentGameState = gameStateRef.current;
      if (!currentGameState) {
         frameId = requestAnimationFrame(gameLoop);
         return;
      }
      
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;
      
      if (!isPausedRef.current) {
        try {
          update(dt, time, currentGameState);
          draw(time);
        } catch (err) {
          console.error("Game loop error:", err);
        }
      }

      frameId = requestAnimationFrame(gameLoop);
    };

    const update = (dt: number, time: number, prev: GameState) => {
      // Synchronous update on Ref-based state
      const next = { ...prev };
      const { player, enemies, teammates, projectiles, particles, capturePoints, camera, deployables } = next;
      const currentRemotePlayers = remotePlayersRef.current;

      if (!player.isDead) {
        // 1. Player Movement & Logic
        let dx = 0;
        let dy = 0;
        if (keys.current.has('w')) dy -= 1;
        if (keys.current.has('s')) dy += 1;
        if (keys.current.has('a')) dx -= 1;
        if (keys.current.has('d')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const mag = Math.sqrt(dx*dx + dy*dy);
          const nextX = player.x + (dx / mag) * player.moveSpeed;
          const nextY = player.y + (dy / mag) * player.moveSpeed;
          
          let collisionX = false;
          let collisionY = false;
          
          for (const obs of next.obstacles) {
            if (circleRectCollision({ x: nextX, y: player.y, radius: player.radius }, obs)) collisionX = true;
            if (circleRectCollision({ x: player.x, y: nextY, radius: player.radius }, obs)) collisionY = true;
          }

          if (!collisionX) player.x = nextX;
          if (!collisionY) player.y = nextY;
        }

        // Map Clamping
        player.x = Math.max(player.radius, Math.min(MAP_SIZE - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(MAP_SIZE - player.radius, player.y));

        // Player Aim
        const centerX = (canvasRef.current?.width || 0) / 2;
        const centerY = (canvasRef.current?.height || 0) / 2;
        player.angle = Math.atan2(mouse.current.y - centerY, mouse.current.x - centerX);

        // Weapon Switch
        if (!player.vehicleId) {
          if (keys.current.has('1')) player.activeWeaponType = 'PRIMARY';
          if (keys.current.has('2')) player.activeWeaponType = 'SIDEARM';
          if (keys.current.has('3')) {
            player.activeWeaponType = 'GADGET';
          }
        } else {
          player.activeWeaponType = 'PRIMARY'; // Force primary if in vehicle
        }

        // Shooting
        const weapon = player.activeWeaponType === 'PRIMARY' ? player.primaryWeapon : (player.activeWeaponType === 'SIDEARM' ? player.sidearmWeapon : player.gadgetWeapon);
        const ammoKey = player.activeWeaponType === 'PRIMARY' ? 'primaryAmmo' : (player.activeWeaponType === 'SIDEARM' ? 'sidearmAmmo' : 'gadgetAmmo');
        
        if (mouse.current.down && !player.isReloading && time > player.lastFired + weapon.fireRate) {
          if (player[ammoKey] > 0) {
            if (weapon.id === 'ap_mine') {
              player[ammoKey]--;
              player.lastFired = time;
              const mineId = `mine-${time}-${Math.random()}`;
              const mineData = {
                id: mineId,
                x: player.x,
                y: player.y,
                type: 'AP_MINE' as const,
                team: player.team,
                radius: 120,
                life: 60000,
                ownerId: player.id
              };
              next.deployables.push(mineData);
              if (!isSingleplayer) {
                multiplayer.deployDeployable(matchDocId, mineData).catch(err => {
                  if (err.message.includes('Quota exceeded')) {
                    setQuotaExceeded(true);
                  }
                });
              }
            } else {
              player.lastFired = time;
              if (weapon.id === 'medcrate') {
                player[ammoKey]--;
                const medId = `med-${time}-${Math.random()}`;
                const medData = {
                  id: medId,
                  x: player.x,
                  y: player.y,
                  type: 'MED_CRATE' as const,
                  team: player.team,
                  radius: 120,
                  life: 15000,
                  ownerId: player.id
                };
                next.deployables.push(medData);
                if (!isSingleplayer) {
                  multiplayer.deployDeployable(matchDocId, medData).catch(err => {
                    if (err.message.includes('Quota exceeded')) {
                      setQuotaExceeded(true);
                    }
                  });
                }
              } else if (weapon.id === 'famas_f2') {
                // 3-round burst
                player.lastFired = time;
                let burstCount = 0;
                const burstInterval = setInterval(() => {
                  if (burstCount >= 3 || player[ammoKey] <= 0) {
                    clearInterval(burstInterval);
                    return;
                  }
                  player[ammoKey]--;
                  const spreadAngle = (Math.random() - 0.5) * weapon.spread;
                  const angle = player.angle + spreadAngle;
                  projectiles.push({
                    id: `p-famas-${time}-${burstCount}`,
                    x: player.x + Math.cos(player.angle) * 25,
                    y: player.y + Math.sin(player.angle) * 25,
                    vx: Math.cos(angle) * weapon.velocity,
                    vy: Math.sin(angle) * weapon.velocity,
                    damage: weapon.damage,
                    ownerId: player.id,
                    team: player.team,
                    range: 800,
                    distanceTraveled: 0,
                  });
                  burstCount++;
                }, 60); // 60ms between bullets in burst
              } else if (weapon.id === 'saiga12k') {
                // Shotgun burst: 6 pellets
                player.lastFired = time;
                player[ammoKey]--;
                for (let i = 0; i < 6; i++) {
                  const pelletSpread = (Math.random() - 0.5) * weapon.spread * 1.5;
                  const angle = player.angle + pelletSpread;
                  projectiles.push({
                    id: `p-shot-${time}-${i}-${Math.random()}`,
                    x: player.x + Math.cos(player.angle) * 25,
                    y: player.y + Math.sin(player.angle) * 25,
                    vx: Math.cos(angle) * (weapon.velocity || 12),
                    vy: Math.sin(angle) * (weapon.velocity || 12),
                    damage: weapon.damage,
                    ownerId: player.id,
                    team: player.team,
                    range: 350, // Shotgun falloff
                    distanceTraveled: 0,
                  });
                }
              } else {
                // Spawn Projectile
                player[ammoKey]--;
                player.lastFired = time;
                const spreadAngle = (Math.random() - 0.5) * weapon.spread;
                const angle = player.angle + spreadAngle;
                const projX = player.x + Math.cos(player.angle) * 25;
                const projY = player.y + Math.sin(player.angle) * 25;
                
                projectiles.push({
                  id: `p-${time}-${Math.random()}`,
                  x: projX,
                  y: projY,
                  vx: Math.cos(angle) * (weapon.velocity || 15),
                  vy: Math.sin(angle) * (weapon.velocity || 15),
                  damage: weapon.damage,
                  ownerId: player.id,
                  team: player.team,
                  range: 800,
                  distanceTraveled: 0,
                  isExplosive: weapon.type === WeaponType.GADGET && (weapon.id === 'rpg' || weapon.id === 'm320'),
                });

                multiplayer.fireProjectile(matchDocId, {
                  ownerId: player.id,
                  team: player.team,
                  x: projX,
                  y: projY,
                  angle: angle,
                  damage: weapon.damage
                }).catch(err => {
                  if (err.message.includes('Quota exceeded')) {
                    setQuotaExceeded(true);
                  }
                });
              }
            }
          } else if (weapon.id !== 'ap_mine') {
            // Auto reload
            player.isReloading = true;
          }
        }

        if (player.isReloading) {
          if (time > player.lastFired + weapon.reloadTime) {
            player.isReloading = false;
            player[ammoKey] = weapon.ammoCapacity;
          }
        }

        // Manual Reload
        if (keys.current.has('r') && !player.isReloading && player[ammoKey] < weapon.ammoCapacity) {
          player.isReloading = true;
          player.lastFired = time;
        }

        // Ability
        const clsInfo = CLASSES[player.classType];
        if (keys.current.has('q') && !player.vehicleId && time > player.abilityLastUsed + clsInfo.cooldown) {
          player.abilityLastUsed = time;
          // Ability Effects
          if (player.classType === ClassType.SHOCK_TROOP) {
            // Throw high-impact grenade
            projectiles.push({
              id: `grenade-${time}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(player.angle) * 12,
              vy: Math.sin(player.angle) * 12,
              damage: 150,
              ownerId: player.id,
              team: player.team,
              range: 500,
              distanceTraveled: 0,
              isExplosive: true,
            });
            // Throw particle
            for(let i=0; i<5; i++) {
              particles.push({
                id: `gr-${Math.random()}`,
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0.5,
                color: '#444',
                size: 2,
              });
            }
          } else if (player.classType === ClassType.SUPPORT) {
            // Healing aura visual
            for(let i=0; i<20; i++) {
              particles.push({
                id: `heal-${Math.random()}`,
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: '#4ade80',
                size: Math.random() * 5,
              });
            }
            player.health = Math.min(player.maxHealth, player.health + 30);
          } else if (player.classType === ClassType.ASSAULT) {
            // Combat Stim: Speed and Fire Rate boost for 5s
            // In a real implementation we'd track buffs, but here we can just boost temporary speed
            // and we'll handle the fire rate in the shooting section by checking time
            player.moveSpeed *= 1.5;
            setTimeout(() => {
              if (gameStateRef.current) gameStateRef.current.player.moveSpeed /= 1.5;
            }, 5000);
            
            for(let i=0; i<15; i++) {
              particles.push({
                id: `stim-${Math.random()}`,
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0.5,
                color: '#f97316',
                size: 2,
              });
            }
          } else if (player.classType === ClassType.RECON) {
            // Radar Pulse: Reveal enemies
            // In this game bots/enemies are always known in the state, but we could highlight them
            for(let i=0; i<60; i++) {
              const angle = (i / 60) * Math.PI * 2;
              particles.push({
                id: `pulse-${i}-${time}`,
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                life: 2,
                color: '#3b82f6',
                size: 2,
              });
            }
          } else if (player.classType === ClassType.ENGINEER) {
            // Sentry Turret
            deployables.push({
              id: `turret-${time}`,
              x: player.x + Math.cos(player.angle) * 50,
              y: player.y + Math.sin(player.angle) * 50,
              type: 'TURRET' as const,
              team: player.team,
              radius: 40,
              life: 30000,
              ownerId: player.id
            });
          }
        }
      }

      // Camera follow (Outside the if block to ensure it updates even after death/revive)
      if (!isNaN(player.x) && !isNaN(player.y)) {
        camera.x += (player.x - camera.x) * 0.1;
        camera.y += (player.y - camera.y) * 0.1;
      }


      // 2. AI Respawning
      const maxEnemies = 12 + Math.floor(next.difficulty / 3);
      const allyTeam = selectedTeam;
      const enemyTeam = selectedTeam === 'NATO' ? 'MAFIA' : 'NATO';
      const allyBase = allyTeam === 'NATO' ? NATO_BASE : MAFIA_BASE;
      const enemyBase = allyTeam === 'NATO' ? MAFIA_BASE : NATO_BASE;

        if (enemies.length < maxEnemies) {
          const animalType = enemyTeam === 'MAFIA' ? (Math.random() > 0.3 ? 'Rat' : 'Bear') : (Math.random() > 0.5 ? 'Cat' : 'Dog');
          const r = Math.random();
          const gadget = r > 0.75 ? WEAPONS.find(w => w.id === 'rpg')! : (r > 0.5 ? WEAPONS.find(w => w.id === 'm320')! : (r > 0.25 ? WEAPONS.find(w => w.id === 'medcrate')! : WEAPONS.find(w => w.id === 'ap_mine')!));
          
          enemies.push({
            id: `enemy-${time}-${Math.random()}`,
            x: enemyBase.x + (Math.random() - 0.5) * 400,
            y: enemyBase.y + (Math.random() - 0.5) * 400,
            radius: (animalType === 'Bear' || animalType === 'Dog') ? 30 : 18,
            health: (animalType === 'Bear' || animalType === 'Dog') ? 150 : 50,
            maxHealth: (animalType === 'Bear' || animalType === 'Dog') ? 150 : 50,
            angle: enemyTeam === 'MAFIA' ? Math.PI : 0,
            team: enemyTeam as any,
            animalType: animalType,
            isDead: false,
            targetId: null,
            weapon: WEAPONS[Math.floor(Math.random() * 2)],
            gadgetWeapon: gadget,
            lastFired: 0,
            primaryAmmo: 30,
            sidearmAmmo: 15,
            gadgetAmmo: gadget.ammoCapacity,
            isReloading: false,
            state: 'CHASE',
          });
        }

        if (teammates.length < 6) {
          const classTypes = Object.values(ClassType);
          const type = classTypes[Math.floor(Math.random() * classTypes.length)];
          const getGadgetForAI = (cls: ClassType) => {
            switch(cls) {
              case ClassType.ASSAULT: return WEAPONS.find(w => w.id === 'm320')!;
              case ClassType.ENGINEER: return WEAPONS.find(w => w.id === 'rpg')!;
              case ClassType.SUPPORT: return WEAPONS.find(w => w.id === 'medcrate')!;
              case ClassType.RECON: return WEAPONS.find(w => w.id === 'ap_mine')!;
              case ClassType.SHOCK_TROOP: return WEAPONS.find(w => w.id === 'saiga12k')!;
              default: return WEAPONS.find(w => w.id === 'ap_mine')!;
            }
          };
          teammates.push({
            id: `teammate-${time}-${Math.random()}`,
            x: allyBase.x + (Math.random() - 0.5) * 400,
            y: allyBase.y + (Math.random() - 0.5) * 400,
            radius: 20,
            health: 100,
            maxHealth: 100,
            angle: allyTeam === 'NATO' ? 0 : Math.PI,
            team: allyTeam as any,
            animalType: allyTeam === 'NATO' ? CLASSES[type].animal : CLASSES[type].mafiaAnimal,
            isDead: false,
            targetId: null,
            weapon: WEAPONS[0],
            gadgetWeapon: getGadgetForAI(type),
            lastFired: 0,
            primaryAmmo: WEAPONS[0].ammoCapacity,
            sidearmAmmo: WEAPONS.find(w => w.id === 'usp')!.ammoCapacity,
            gadgetAmmo: getGadgetForAI(type).ammoCapacity,
            isReloading: false,
            state: 'WANDER',
            classType: type,
          });
        }

        // 3. AI Behavior
        [...enemies, ...teammates].forEach(ai => {
          if (ai.isDead) return;

          // Target Selection
          const allUnits = [player, ...teammates, ...enemies, ...currentRemotePlayers];
          const potentialTargets = allUnits.filter(u => u.team !== ai.team);
          let minDist = 1200;
          let newTarget = null;
          potentialTargets.forEach(t => {
            const d = distance(ai, t);
            if (d < minDist && !t.isDead) {
              minDist = d;
              newTarget = t;
            }
          });

          if (newTarget) {
            ai.angle = getAngle(ai, newTarget);
            if (minDist > 300) {
              const vx = Math.cos(ai.angle) * (ai.team === 'NATO' ? TEAMMATE_SPEED : ENEMY_SPEED);
              const vy = Math.sin(ai.angle) * (ai.team === 'NATO' ? TEAMMATE_SPEED : ENEMY_SPEED);
              
              const nextX = ai.x + vx;
              const nextY = ai.y + vy;

              let collision = false;
              for (const obs of next.obstacles) {
                if (circleRectCollision({ x: nextX, y: nextY, radius: ai.radius }, obs)) {
                  collision = true;
                  break;
                }
              }

              if (!collision) {
                ai.x = nextX;
                ai.y = nextY;
              } else {
                ai.angle += 0.5;
              }
            } else {
              // AI Shooting Logic
              const useGadget = Math.random() < 0.1 && ai.gadgetWeapon;
              const activeWep = useGadget ? ai.gadgetWeapon! : ai.weapon;

              if (time > ai.lastFired + activeWep.fireRate) {
                ai.lastFired = time;
                if (activeWep.id === 'medcrate') {
                  next.deployables.push({
                    id: `med-${time}-${Math.random()}`,
                    x: ai.x,
                    y: ai.y,
                    type: 'MED_CRATE',
                    team: ai.team,
                    radius: 120,
                    life: 15000,
                    ownerId: ai.id,
                  });
                } else if (activeWep.id === 'ap_mine') {
                  // AI deploy mine
                  if (Math.random() < 0.05) { // Slow deploy for AI
                    next.deployables.push({
                      id: `ai-mine-${time}-${Math.random()}`,
                      x: ai.x,
                      y: ai.y,
                      type: 'AP_MINE',
                      team: ai.team,
                      radius: 120,
                      life: 60000,
                      ownerId: ai.id,
                    });
                    ai.gadgetAmmo--;
                  }
                } else {
                  const aiSpread = activeWep.spread || 0.1;
                  const angle = ai.angle + (Math.random() - 0.5) * aiSpread;
                  projectiles.push({
                    id: `p-${time}-${Math.random()}`,
                    x: ai.x,
                    y: ai.y,
                    vx: Math.cos(angle) * (activeWep.velocity || 15),
                    vy: Math.sin(angle) * (activeWep.velocity || 15),
                    damage: activeWep.damage,
                    ownerId: ai.id,
                    team: ai.team,
                    range: 800,
                    distanceTraveled: 0,
                    isExplosive: activeWep.type === WeaponType.GADGET && (activeWep.id === 'rpg' || activeWep.id === 'm320'),
                  });
                }
              }
            }
          } else {
            // Move towards opponent center if no target
            const targetBase = ai.team === 'NATO' ? MAFIA_BASE : NATO_BASE;
            ai.angle = getAngle(ai, targetBase);
            ai.x += Math.cos(ai.angle) * 1.5;
            ai.y += Math.sin(ai.angle) * 1.5;
          }
        });

        // 4. Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.distanceTraveled += Math.sqrt(p.vx*p.vx + p.vy*p.vy);

          if (p.distanceTraveled > p.range) {
            projectiles.splice(i, 1);
            continue;
          }

          // Obstacle Collision
          let hitObs = false;
          for (const obs of next.obstacles) {
            if (p.x > obs.x && p.x < obs.x + obs.width && p.y > obs.y && p.y < obs.y + obs.height) {
              hitObs = true;
              break;
            }
          }

          // Entity Collision
          const currentRemotePlayers = remotePlayersRef.current;
          const allUnits = [player, ...teammates, ...enemies, ...currentRemotePlayers];
          const targets = allUnits.filter(u => u.team !== p.team);
          let hitEnt = null;
          for (const t of targets) {
            if (!t.isDead && distance(p, t) < t.radius) {
              hitEnt = t;
              break;
            }
          }

          if (hitObs || hitEnt) {
            if (p.isExplosive) {
              for (let j = 0; j < 20; j++) {
                particles.push({
                  id: `exp-${Math.random()}`,
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 12,
                  vy: (Math.random() - 0.5) * 12,
                  life: 0.8 + Math.random() * 0.4,
                  color: Math.random() > 0.3 ? '#ff6600' : '#ffff00',
                  size: Math.random() * 8 + 4,
                });
              }
              const blastRadius = 150;
              allUnits.forEach(target => {
                if (target.isDead) return;
                const d = distance(p, target);
                if (d < blastRadius) {
                  const damageMult = 1 - (d / blastRadius);
                  target.health -= p.damage * damageMult;
                  if (target.health <= 0) {
                    target.isDead = true;
                    if (p.ownerId === 'player') {
                      next.score += 100;
                      player.xp += XP_PER_KILL;

                      // Challenge Tracking
                      const currentWepId = player.activeWeaponType === 'PRIMARY' ? player.primaryWeapon.id : 
                                           (player.activeWeaponType === 'SIDEARM' ? player.sidearmWeapon.id : player.gadgetWeapon.id);
                      
                      // Special case for 'any_assault' challenge tracking
                      if (player.classType === ClassType.ASSAULT || player.classType === ClassType.SHOCK_TROOP) {
                        const assaultKills = (player.stats.killsByWeapon['any_assault'] || 0) + 1;
                        player.stats.killsByWeapon['any_assault'] = assaultKills;
                      }

                      const newKills = (player.stats.killsByWeapon[currentWepId] || 0) + 1;
                      player.stats.killsByWeapon[currentWepId] = newKills;
                      
                      // Check for unlocks
                      CHALLENGES.forEach(c => {
                        if (c.targetWeaponId === currentWepId && newKills >= c.targetKills) {
                          if (c.rewardWeaponId && !player.unlockedWeapons.includes(c.rewardWeaponId)) {
                            player.unlockedWeapons.push(c.rewardWeaponId);
                          }
                          if (c.rewardAttachmentId && !player.unlockedAttachments.includes(c.rewardAttachmentId)) {
                            player.unlockedAttachments.push(c.rewardAttachmentId);
                          }
                        }
                      });
                      
                      setPlayerStats({ killsByWeapon: { ...player.stats.killsByWeapon } });
                      setUnlockedWeapons([...player.unlockedWeapons]);
                      setUnlockedAttachments([...player.unlockedAttachments]);

                      if (player.xp >= XP_PER_LEVEL) {
                        player.level++;
                        player.xp -= XP_PER_LEVEL;
                      }
                      onUpdateProgression(player.xp, player.level);
                    }
                  }
                }
              });
            } else if (hitEnt) {
              hitEnt.health -= p.damage;
              for(let j=0; j<5; j++) {
                particles.push({
                  id: `b-${Math.random()}`,
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 1,
                  color: '#ef4444',
                  size: Math.random() * 4,
                });
              }
              if (hitEnt.health <= 0) {
                hitEnt.isDead = true;
                if (p.ownerId === 'player') {
                  next.score += 100;
                  player.xp += XP_PER_KILL;

                  // Challenge Tracking
                  const currentWepId = player.activeWeaponType === 'PRIMARY' ? player.primaryWeapon.id : 
                                       (player.activeWeaponType === 'SIDEARM' ? player.sidearmWeapon.id : player.gadgetWeapon.id);
                  const newKills = (player.stats.killsByWeapon[currentWepId] || 0) + 1;
                  player.stats.killsByWeapon[currentWepId] = newKills;
                  
                  // Check for unlocks
                  CHALLENGES.forEach(c => {
                    if (c.targetWeaponId === currentWepId && newKills >= c.targetKills) {
                      if (c.rewardWeaponId && !player.unlockedWeapons.includes(c.rewardWeaponId)) {
                        player.unlockedWeapons.push(c.rewardWeaponId);
                      }
                      if (c.rewardAttachmentId && !player.unlockedAttachments.includes(c.rewardAttachmentId)) {
                        player.unlockedAttachments.push(c.rewardAttachmentId);
                      }
                    }
                  });
                  
                  setPlayerStats({ killsByWeapon: { ...player.stats.killsByWeapon } });
                  setUnlockedWeapons([...player.unlockedWeapons]);
                  setUnlockedAttachments([...player.unlockedAttachments]);

                  if (player.xp >= XP_PER_LEVEL) {
                    player.level++;
                    player.xp -= XP_PER_LEVEL;
                  }
                  onUpdateProgression(player.xp, player.level);
                }
              }
            } else if (hitObs) {
              for(let j=0; j<3; j++) {
                particles.push({
                  id: `imp-${Math.random()}`,
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  life: 0.5 + Math.random() * 0.5,
                  color: '#666',
                  size: 1 + Math.random() * 2,
                });
              }
            }
            projectiles.splice(i, 1);
            continue;
          }
        }

        // 5. Cleanup Dead
        next.enemies = enemies.filter(e => !e.isDead);
        next.teammates = teammates.filter(t => !t.isDead);

        // 6. Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.02;
          if (p.life <= 0) particles.splice(i, 1);
        }

        // 7. Deployables
        for (let i = next.deployables.length - 1; i >= 0; i--) {
          const d = next.deployables[i];
          d.life -= 16.6; 
          
          if (d.type === 'MED_CRATE') {
            const healedUnits = [...next.teammates, next.player, ...next.enemies].filter(u => !u.isDead && distance(u, d) < d.radius);
            healedUnits.forEach(u => {
              if (u.team === d.team) {
                u.health = Math.min(u.maxHealth, u.health + 0.1);
              }
            });
            if (time % 100 < 20) {
              particles.push({
                id: `heal-p-${Math.random()}`,
                x: d.x + (Math.random() - 0.5) * d.radius * 2,
                y: d.y + (Math.random() - 0.5) * d.radius * 2,
                vx: 0,
                vy: -Math.random() * 2,
                life: 0.8,
                color: '#4ade80',
                size: 2,
              });
            }
          }
          if (d.type === 'AP_MINE') {
            const allPossibleTargets = [...next.enemies, ...next.teammates, next.player, ...currentRemotePlayers];
            const targets = allPossibleTargets.filter(u => u && !u.isDead && u.team !== d.team && distance(u, d) < 60);
            if (targets.length > 0) {
              // DETONATE
              next.deployables.splice(i, 1);
              if (d.ownerId && d.id && !d.id.startsWith('ai-') && !d.id.startsWith('med-') && !d.id.startsWith('mine-local')) {
                // This is likely a synced mine, try to delete from firestore
                // We use d.id which should be the doc ID in firestore for remote mines
                multiplayer.deleteDeployable(matchDocId, d.id);
              }
              
              const blastRadius = 150;
              const damagedUnits = allPossibleTargets.filter(u => u && !u.isDead && u.team !== d.team && distance(u, d) < blastRadius);
              damagedUnits.forEach(u => {
                // If it's the local player, we can update health directly
                if (u.id === player.id) {
                  u.health = 0;
                  u.isDead = true;
                } else if (u.id.startsWith('enemy-') || u.id.startsWith('ally-')) {
                  // Bots
                  u.health = 0;
                  u.isDead = true;
                }
                // Note: We don't update remote player health directly here because they own their state.
                // In this multiplayer implementation, each player calculates their own damage taken from explosives
                // or we rely on the owner of the mine to broadcast damage (not currently implemented for mines).
                // Actually, if we're in multiplayer and a mine explodes, every player will see that explosion
                // and should check if they were hit.
              });

              for (let j = 0; j < 30; j++) {
                particles.push({
                  id: `mine-exp-${d.id}-${j}`,
                  x: d.x,
                  y: d.y,
                  vx: (Math.random() - 0.5) * 15,
                  vy: (Math.random() - 0.5) * 15,
                  life: 1,
                  color: j % 2 === 0 ? '#ef4444' : '#f59e0b',
                  size: 3 + Math.random() * 4,
                });
              }
              continue; // Skip the life removal since we already spliced it
            }
          }
          if (d.life <= 0) {
            next.deployables.splice(i, 1);
          }
        }

        // 6. Capture Points
        let pointsChanged = false;
        next.capturePoints.forEach(cp => {
          let natoCount = 0;
          let mafiaCount = 0;
          
          const currentRemotePlayers = remotePlayersRef.current;
          const allUnitsAtPoint = [player, ...teammates, ...enemies, ...currentRemotePlayers];
          allUnitsAtPoint.forEach(u => {
            if (!u.isDead && distance({x: u.x, y: u.y}, cp) < cp.radius) {
              if (u.team === 'NATO') natoCount++;
              else if (u.team === 'MAFIA') mafiaCount++;
            }
          });

          if (natoCount > mafiaCount) {
            cp.progress = Math.min(1, cp.progress + cp.captureSpeed);
            pointsChanged = true;
          } else if (mafiaCount > natoCount) {
            cp.progress = Math.max(-1, cp.progress - cp.captureSpeed);
            pointsChanged = true;
          }

          if (cp.progress >= 1) cp.team = 'NATO';
          else if (cp.progress <= -1) cp.team = 'MAFIA';
          else if (cp.progress === 0) cp.team = 'NEUTRAL';
        });

        // Multiplayer Sync Player State
        const now = performance.now();
        if (!isSingleplayer && now - lastSyncTimeRef.current > 200) { // Sync every 200ms (throttled for quota)
           lastSyncTimeRef.current = now;
           multiplayer.updatePlayerPos(matchDocId, playerIdRef.current, {
             x: player.x,
             y: player.y,
             angle: player.angle,
             health: player.health,
             team: player.team,
             animalType: player.animalType,
             radius: player.radius,
             vehicleId: (player as Player).vehicleId,
             name: auth.currentUser?.displayName || 'Warrior',
             isDead: player.isDead,
             isShooting: mouse.current.down,
             lastFired: player.lastFired
           }).catch(err => {
             if (err.message.includes('Quota exceeded')) {
               setQuotaExceeded(true);
             }
           });
        }

        // Sync Capture Points occasionally (mostly for late joiners)
        if (!isSingleplayer && pointsChanged && now % 500 < 50) { // Check every ~500ms
           multiplayer.syncCapturePoints(matchDocId, next.capturePoints);
        }

        // Update camera to follow player
        next.camera.x = player.x;
        next.camera.y = player.y;

        gameStateRef.current = next;
        setGameState(next); 
    };

    const draw = (time: number) => {
      const canvas = canvasRef.current;
      const currentGameState = gameStateRef.current;
      if (!canvas || !currentGameState) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = containerRef.current?.offsetWidth || 800;
      const containerHeight = containerRef.current?.offsetHeight || 600;
      
      if (canvas.width !== containerWidth) canvas.width = containerWidth;
      if (canvas.height !== containerHeight) canvas.height = containerHeight;

      const { player, enemies, teammates, projectiles, particles, camera } = currentGameState;
      
      // Safety check for critical values
      if (isNaN(camera.x) || isNaN(camera.y) || isNaN(player.x) || isNaN(player.y)) {
        console.warn("Invalid game state detected in draw loop");
        return;
      }

      const currentRemotePlayers = remotePlayersRef.current || [];
      
      const offX = canvas.width / 2 - camera.x;
      const offY = canvas.height / 2 - camera.y;

      // Draw Grid
      ctx.fillStyle = '#1b2413'; // Natural forest floor
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#25311b'; // Subtle grass patterns
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = (offX % gridSize); x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = (offY % gridSize); y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Laser Borders
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(offX, offY, MAP_SIZE, MAP_SIZE);

      // Debug Overlay (Top Left)
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 240, 110);
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`OPERATIONAL INTEL`, 20, 30);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(`MATCH : ${matchDocId}`, 20, 50);
      ctx.fillText(`MY ID : ${playerIdRef.current}`, 20, 65);
      ctx.fillText(`COORD : ${player.x.toFixed(0)}, ${player.y.toFixed(0)}`, 20, 80);
      ctx.fillText(`PEERS : ${currentRemotePlayers.length} ACTIVE`, 20, 95);
      ctx.fillText(`AI    : ${enemies.length} ENEMY | ${teammates.length} TEAM`, 20, 110);

      // Draw Capture Points
      currentGameState.capturePoints.forEach(cp => {
        const x = cp.x + offX;
        const y = cp.y + offY;

        // Outer glow/ring
        ctx.beginPath();
        ctx.arc(x, y, cp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = cp.team === 'NATO' ? 'rgba(59, 130, 246, 0.2)' : cp.team === 'MAFIA' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fillStyle = cp.team === 'NATO' ? '#3b82f6' : cp.team === 'MAFIA' ? '#ef4444' : '#333';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Progress Ring
        ctx.beginPath();
        ctx.arc(x, y, cp.radius - 10, -Math.PI/2, -Math.PI/2 + (Math.abs(cp.progress) * Math.PI * 2));
        ctx.strokeStyle = cp.progress > 0 ? '#3b82f6' : '#ef4444';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cp.id.toUpperCase(), x, y + 5);
      });

      // Draw Obstacles
      currentGameState.obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x + offX, obs.y + offY);
        
        if (obs.type === 'CRATE') {
          ctx.fillStyle = '#452c1e';
          ctx.fillRect(0, 0, obs.width, obs.height);
          ctx.strokeStyle = '#5d4037';
          ctx.lineWidth = 2;
          ctx.strokeRect(4, 4, obs.width - 8, obs.height - 8);
          ctx.strokeRect(2, 2, obs.width - 4, obs.height - 4);
        } else if (obs.type === 'WALL') {
          ctx.fillStyle = '#4a4a4a'; // Stone gray
          ctx.fillRect(0, 0, obs.width, obs.height);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 4;
          ctx.strokeRect(0, 0, obs.width, obs.height);
        } else if (obs.type === 'BARREL') {
          ctx.fillStyle = '#795548'; // Rusted brown
          ctx.beginPath();
          ctx.rect(0, 0, obs.width, obs.height);
          ctx.fill();
          ctx.strokeStyle = '#3e2723';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, obs.height * 0.3);
          ctx.lineTo(obs.width, obs.height * 0.3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, obs.height * 0.7);
          ctx.lineTo(obs.width, obs.height * 0.7);
          ctx.stroke();
        }
        
        ctx.restore();
      });

      [...teammates, ...enemies, ...currentRemotePlayers, player].forEach(e => {
        if (!e || typeof e.x !== 'number' || isNaN(e.x) || typeof e.y !== 'number' || isNaN(e.y)) return;
        if (e.isDead && e.id !== player.id) return; 

        // Ensure we have fallback values for synced players
        const radius = e.radius || 20;
        const maxHealth = e.maxHealth || 100;
        const animalType = e.animalType || 'Soldier';
        const vehicleId = (e as Player).vehicleId;

        ctx.save();
        ctx.translate(e.x + offX, e.y + offY);
        ctx.rotate(e.angle || 0);

        if (animalType === 'Capybara' && capyImg.current) {
          // Render the special military capybara image
          const scale = (radius * 3.8) / capyImg.current.height;
          ctx.rotate(Math.PI / 2); // Adjust image orientation to match rotation logic
          
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.0, radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(
            capyImg.current, 
            -capyImg.current.width * scale * 0.5, 
            -capyImg.current.height * scale * 0.5,
            capyImg.current.width * scale,
            capyImg.current.height * scale
          );
        } else if ((animalType === 'Jack Russell Terrier' || animalType === 'Dog') && dogImg.current) {
          // Render the Jack Russell Terrier Assault image
          const scale = (radius * 3.6) / dogImg.current.height;
          ctx.rotate(Math.PI / 2); 
          
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.0, radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(
            dogImg.current, 
            -dogImg.current.width * scale * 0.5, 
            -dogImg.current.height * scale * 0.5,
            dogImg.current.width * scale,
            dogImg.current.height * scale
          );
        } else if (animalType === 'Raccoon' && raccoonImg.current) {
          // Render the Engineer Raccoon image
          const scale = (radius * 3.2) / raccoonImg.current.height;
          ctx.rotate(Math.PI / 2); 
          ctx.drawImage(
            raccoonImg.current, 
            -raccoonImg.current.width * scale * 0.5, 
            -raccoonImg.current.height * scale * 0.5,
            raccoonImg.current.width * scale,
            raccoonImg.current.height * scale
          );
        } else if (animalType === 'Hedgehog' && hedgehogImg.current) {
          // Render the Recon Hedgehog image
          const scale = (radius * 2.8) / hedgehogImg.current.height; 
          ctx.rotate(Math.PI / 2); 
          ctx.drawImage(
            hedgehogImg.current, 
            -hedgehogImg.current.width * scale * 0.5, 
            -hedgehogImg.current.height * scale * 0.5,
            hedgehogImg.current.width * scale,
            hedgehogImg.current.height * scale
          );
        } else if (animalType === 'Penguin' && penguinImg.current) {
          // Render the Penguin Shock Troop image
          const scale = (radius * 3.8) / penguinImg.current.height; 
          ctx.rotate(Math.PI / 2); 
          
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.0, radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(
            penguinImg.current, 
            -penguinImg.current.width * scale * 0.5, 
            -penguinImg.current.height * scale * 0.5,
            penguinImg.current.width * scale,
            penguinImg.current.height * scale
          );
        } else if (animalType === 'Penguin') {
          // Penguin Rendering (Fallback)
          // Body
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * 1.1, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tummy
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 0.6, radius * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          // Beak
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(radius * 0.7, -4);
          ctx.lineTo(radius * 1.1, 0);
          ctx.lineTo(radius * 0.7, 4);
          ctx.fill();
        } else if (animalType === 'Rat' && ratImg.current) {
          // Render the Rat Shock Troop image
          const scale = (radius * 4.0) / ratImg.current.height; 
          ctx.rotate(Math.PI / 2); 
          
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.0, radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(
            ratImg.current, 
            -ratImg.current.width * scale * 0.5, 
            -ratImg.current.height * scale * 0.5,
            ratImg.current.width * scale,
            ratImg.current.height * scale
          );
        } else if (vehicleId === 'humvee') {
          // Draw Humvee
          ctx.fillStyle = '#2e3b23'; // Olive drab
          ctx.beginPath();
          ctx.rect(-radius * 1.5, -radius, radius * 3, radius * 2);
          ctx.fill();
          ctx.strokeStyle = '#1b2413';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Windshield
          ctx.fillStyle = '#81d4fa';
          ctx.fillRect(radius * 0.3, -radius * 0.7, radius * 0.4, radius * 1.4);

          // Turret
          ctx.fillStyle = '#1b2413';
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
          
          // Machine Gun Barrel
          ctx.fillStyle = '#000';
          ctx.fillRect(radius * 0.4, -3, radius * 1.2, 6);
        } else {
          // Default geometric rendering
          ctx.fillStyle = e.team === 'NATO' ? '#3b82f6' : '#991b1b';
          if (e.id === player.id) ctx.fillStyle = '#fb923c';
          
          ctx.beginPath();
          ctx.rect(-radius, -radius, radius*2, radius*2);
          ctx.fill();

          // High visibility border for players
          if (e.id === player.id || currentRemotePlayers.some((pr: any) => pr && pr.id === e.id)) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // Weapon
          ctx.fillStyle = '#333';
          ctx.fillRect(radius, -2, 15, 4);
        }

        // Health Bar (mini)
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(e.x + offX - radius, e.y + offY - radius - 10, radius*2, 4);
        ctx.fillStyle = e.team === 'NATO' ? '#3b82f6' : '#ef4444';
        ctx.fillRect(e.x + offX - radius, e.y + offY - radius - 10, (Math.max(0, e.health)/maxHealth) * radius*2, 4);
        
        ctx.fillStyle = e.team === 'NATO' ? '#93c5fd' : '#fca5a5';
        ctx.font = 'bold 11px Inter, system-ui';
        ctx.textAlign = 'center';
        const displayName = (e.id === player.id) ? "YOU" : (e.name || animalType || "Operator");
        ctx.fillText(displayName, e.x + offX, e.y + offY - radius - 15);
      });

      // Draw Projectiles
      ctx.fillStyle = '#fff';
      projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x + offX, p.y + offY, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + offX, p.y + offY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Deployables
      currentGameState.deployables.forEach(d => {
        if (d.type === 'MED_CRATE') {
          ctx.beginPath();
          ctx.arc(d.x + offX, d.y + offY, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Crate icon
          ctx.fillStyle = '#1b5e20';
          ctx.fillRect(d.x + offX - 10, d.y + offY - 10, 20, 20);
          ctx.fillStyle = '#fff';
          ctx.fillRect(d.x + offX - 8, d.y + offY - 2, 16, 4);
          ctx.fillRect(d.x + offX - 2, d.y + offY - 8, 4, 16);
        } else if (d.type === 'TURRET') {
          // Draw Turret Base
          ctx.fillStyle = '#444';
          ctx.beginPath();
          ctx.arc(d.x + offX, d.y + offY, 12, 0, Math.PI * 2);
          ctx.fill();
          // Draw Turret Head
          ctx.fillStyle = '#222';
          ctx.fillRect(d.x + offX - 5, d.y + offY - 15, 10, 20);
          ctx.strokeStyle = d.team === 'NATO' ? '#3b82f6' : '#ef4444';
          ctx.lineWidth = 1;
          ctx.strokeRect(d.x + offX - 5, d.y + offY - 15, 10, 20);
        } else if (d.type === 'AP_MINE') {
          // The marked area is only visible to allies
          if (d.team === currentGameState.player.team) {
            ctx.beginPath();
            ctx.arc(d.x + offX, d.y + offY, d.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Faint blue fill
            ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
            ctx.fill();
          }

          // Draw the Mine itself (tiny bit visible to all? usually yes to be fair, but let's stick to prompt)
          // Prompt says "marked only for allies", maybe the mine itself is also hidden? 
          // Usually mines are hidden for enemies.
          if (d.team === currentGameState.player.team) {
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.arc(d.x + offX, d.y + offY, 5, 0, Math.PI * 2);
            ctx.fill();
            // Blinking light
            if (Math.sin(performance.now() / 200) > 0) {
              ctx.fillStyle = '#60a5fa';
              ctx.beginPath();
              ctx.arc(d.x + offX, d.y + offY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // For enemies, it's hidden or very sneaky. 
            // We'll leave it invisible as per prompt "marked only for allies"
          }
        }
      });
    };

    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [matchId, selectedTeam]); // Restart loop when match or team changes

  const abilityInfo = gameState ? CLASSES[gameState.player.classType] : null;
  const abilityProgress = useMemo(() => {
    if (!gameState || !abilityInfo) return 0;
    // eslint-disable-next-line react-hooks/purity
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return Math.min(100, ((now - gameState.player.abilityLastUsed) / abilityInfo.cooldown) * 100);
  }, [gameState, abilityInfo]);

  if (!gameState) return null;

  const currentWeapon = gameState.player.activeWeaponType === 'PRIMARY' ? gameState.player.primaryWeapon : gameState.player.sidearmWeapon;

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      {/* Win Screen */}
      <AnimatePresence>
        {gameState.matchWinner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <h2 className={`text-8xl font-black italic tracking-tighter uppercase ${gameState.matchWinner === 'NATO' ? 'text-blue-500' : 'text-red-500'}`}>
                {gameState.matchWinner === 'NATO' ? 'Victory' : 'Defeat'}
              </h2>
              <p className="text-white/40 uppercase tracking-[0.5em] text-sm">Operation Success: All Points Controlled</p>
              <div className="flex justify-center gap-6">
                <button 
                  onClick={resetMatch}
                  className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
                >
                  Next Match
                </button>
                <button 
                  onClick={onQuit}
                  className="px-12 py-4 border border-white/20 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="bg-black/80 backdrop-blur border border-white/10 p-4 rounded-lg flex items-center gap-4">
              <div className="p-2 bg-orange-500 rounded text-white"><User size={20} /></div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Operator</div>
                <div className="text-sm font-bold uppercase italic">{gameState.player.animalType}</div>
              </div>
            </div>
            <div className="bg-black/80 backdrop-blur border border-white/10 p-4 rounded-lg flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Level</div>
                <div className="text-lg font-mono font-bold text-orange-400">{gameState.player.level}</div>
              </div>
              <div className="h-full w-[1px] bg-white/10" />
              <div className="w-48">
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">XP Progression</div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(gameState.player.xp / XP_PER_LEVEL) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            {isSingleplayer && (
              <div className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                Singleplayer Mode (Offline)
              </div>
            )}
            <div className="bg-black/80 backdrop-blur border border-white/10 px-6 py-2 rounded-full text-[10px] font-mono text-white/60 tracking-widest flex items-center gap-4 uppercase self-center">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE OPS</span>
              <div className="h-3 w-[1px] bg-white/10" />
              {gameState.capturePoints.map(cp => (
                <div key={cp.id} className="flex items-center gap-1.5">
                  <span className={cp.team === 'NATO' ? 'text-blue-400' : cp.team === 'MAFIA' ? 'text-red-400' : 'text-white/20'}>{cp.id}</span>
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${cp.progress > 0 ? 'bg-blue-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.abs(cp.progress) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
              <div className="h-3 w-[1px] bg-white/10" />
              <span>ENEMIES: {gameState.enemies.length}</span>
              <div className="h-3 w-[1px] bg-white/10" />
              <span>FPS: {fps}</span>
            </div>
            <Minimap gameState={gameState} remotePlayers={remotePlayers} />
          </div>
        </div>

        {/* Bottom UI */}
        <div className="flex justify-between items-end">
          {/* Health & Ability */}
          <div className="space-y-4">
            <div className="bg-black/80 backdrop-blur border border-white/10 p-6 rounded-xl w-80 space-y-3">
              <div className="flex justify-between items-end">
                <div className="p-1.5 bg-red-500/20 text-red-500 rounded"><Zap size={16} /></div>
                <div className="text-right">
                  <div className="text-2xl font-black italic tracking-tighter leading-none">{Math.ceil(gameState.player.health)}%</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Vital Signs</div>
                </div>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${(gameState.player.health / gameState.player.maxHealth) * 100}%` }} />
              </div>
            </div>

            <div className="bg-black/80 backdrop-blur border border-white/10 p-4 rounded-xl flex items-center gap-4 w-80">
              <div className={`p-3 rounded-lg flex items-center justify-center transition-all ${abilityProgress >= 100 ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-white/20'}`}>
                <span className="font-black text-xl italic uppercase">Q</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{abilityInfo.abilityName}</span>
                  <span className="text-[10px] font-mono text-white/40">{Math.floor(abilityProgress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: `${abilityProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Weapons */}
          <div className="bg-black/80 backdrop-blur border border-white/10 p-1 rounded-xl flex gap-1 pointer-events-auto">
             <div className={`p-6 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 min-w-[140px] ${gameState.player.activeWeaponType === 'PRIMARY' ? 'bg-white/10 border-white/20' : 'border-transparent opacity-40'}`}>
                <div className="text-[10px] font-black italic text-white/30 uppercase mb-2">Primary [1]</div>
                <div className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">{gameState.player.primaryWeapon.name}</div>
                <div className="text-xs font-mono text-orange-400 mt-2">{gameState.player.primaryAmmo} / {gameState.player.primaryWeapon.ammoCapacity}</div>
                <div className="flex gap-2 mt-1 opacity-40">
                  <div className="text-[8px] font-mono uppercase tracking-tighter">SPD: {(gameState.player.primaryWeapon.spread * 100).toFixed(1)}°</div>
                  <div className="text-[8px] font-mono uppercase tracking-tighter">RLD: {(gameState.player.primaryWeapon.reloadTime / 1000).toFixed(1)}s</div>
                </div>
             </div>
             <div className={`p-6 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 min-w-[140px] ${gameState.player.activeWeaponType === 'SIDEARM' ? 'bg-white/10 border-white/20' : 'border-transparent opacity-40'}`}>
                <div className="text-[10px] font-black italic text-white/30 uppercase mb-2">Sidearm [2]</div>
                <div className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">{gameState.player.sidearmWeapon.name}</div>
                <div className="text-xs font-mono text-orange-400 mt-2">{gameState.player.sidearmAmmo} / {gameState.player.sidearmWeapon.ammoCapacity}</div>
                <div className="flex gap-2 mt-1 opacity-40">
                  <div className="text-[8px] font-mono uppercase tracking-tighter">SPD: {(gameState.player.sidearmWeapon.spread * 100).toFixed(1)}°</div>
                  <div className="text-[8px] font-mono uppercase tracking-tighter">RLD: {(gameState.player.sidearmWeapon.reloadTime / 1000).toFixed(1)}s</div>
                </div>
             </div>
             <div className={`p-6 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 min-w-[140px] ${gameState.player.activeWeaponType === 'GADGET' ? 'bg-white/10 border-white/20' : 'border-transparent opacity-40'}`}>
                <div className="text-[10px] font-black italic text-white/30 uppercase mb-2">Gadget [3]</div>
                <div className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">{gameState.player.gadgetWeapon.name}</div>
                <div className="text-xs font-mono text-orange-400 mt-2">
                  {`${gameState.player.gadgetAmmo} / ${gameState.player.gadgetWeapon.ammoCapacity}`}
                </div>
                <div className="flex gap-2 mt-1 opacity-40">
                  <div className="text-[8px] font-mono uppercase tracking-tighter">{gameState.player.gadgetWeapon.id === 'medcrate' ? 'RANGE: 120' : `DMG: ${gameState.player.gadgetWeapon.damage}`}</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <AnimatePresence>
        {!isPaused && gameState.score === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-32 -translate-y-1/2 bg-black/40 backdrop-blur border-l-4 border-orange-500 p-8 space-y-6 max-w-sm pointer-events-none"
          >
            <h2 className="text-3xl font-black italic italic uppercase tracking-tighter">Tactical Intel</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-bold font-mono">WASD</div>
                <span className="text-xs uppercase font-bold text-white/60 tracking-widest">Movement</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-bold font-mono">MOUSE</div>
                <span className="text-xs uppercase font-bold text-white/60 tracking-widest">Aim & Shoot</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-bold font-mono">1 / 2</div>
                <span className="text-xs uppercase font-bold text-white/60 tracking-widest">Swap Weapon</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-bold font-mono font-bold text-orange-500">Q</div>
                <span className="text-xs uppercase font-bold text-white/60 tracking-widest">Class Ability</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-bold font-mono">R</div>
                <span className="text-xs uppercase font-bold text-white/60 tracking-widest">Reload</span>
              </div>
            </div>
            <p className="text-[10px] text-white/30 uppercase leading-relaxed pt-4 border-t border-white/5">Defeat enemy units to gain XP and unlock superior armaments from the NATO armory.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Menu */}
      <AnimatePresence>
        {quotaExceeded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] text-white p-8 text-center">
          <div className="max-w-md bg-zinc-900 border border-red-500/50 p-6 rounded-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-red-500 mb-4 uppercase tracking-tighter">Firestore Quota Exceeded</h2>
            <p className="mb-4 text-zinc-400">
              The application has reached its daily database operation limit. This is a common limit in AI Studio for high-frequency real-time apps.
            </p>
            <p className="mb-6 text-sm italic text-zinc-500">
              Your progress is safe. The quota will reset automatically tomorrow.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              TRY REFRESHING
            </button>
          </div>
        </div>
      )}

      {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0b]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 pointer-events-auto"
          >
            <div className="max-w-md w-full space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white/90">Tactical Pause</h2>
                <p className="text-orange-500 uppercase tracking-[0.4em] text-sm font-bold">Standard Operations Halted</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-white text-black font-black uppercase italic tracking-tighter text-2xl py-5 rounded-lg hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <Play className="fill-current" /> Resume Operation
                </button>
                <button 
                  onClick={onQuit}
                  className="w-full bg-white/5 text-white/40 border border-white/10 font-bold uppercase tracking-widest text-sm py-5 rounded-lg hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/40 transition-all flex items-center justify-center gap-3"
                >
                  <Skull size={18} /> Abort Mission
                </button>
              </div>
              
              <div className="pt-8 border-t border-white/5 flex justify-between items-center text-[10px] text-white/20 uppercase tracking-widest font-mono">
                <span>EST. SESSION: 10:24</span>
                <div className="h-1 w-1 bg-white/20 rounded-full" />
                <span>NATO-AUTH: SECURE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Death Screen / Revive Menu */}
      <AnimatePresence>
        {gameState.player.health <= 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 z-[100] pointer-events-auto overflow-y-auto"
          >
            <div className="max-w-4xl w-full space-y-8 py-10">
              <div className="text-center space-y-2">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white">REDEPLOYMENT</h2>
                <p className="text-red-500 uppercase tracking-[0.6em] text-sm font-bold">Killed in Action - NATO High Command is authorizing a new unit</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-l-2 border-orange-500 pl-3">Session Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-lg">
                      <div className="text-[10px] text-white/30 uppercase font-mono">Rank</div>
                      <div className="text-2xl font-black italic text-orange-500">LVL {gameState.player.level}</div>
                    </div>
                    <div className="bg-black/40 p-4 rounded-lg">
                      <div className="text-[10px] text-white/30 uppercase font-mono">Score</div>
                      <div className="text-2xl font-black italic text-white">{gameState.score}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-l-2 border-orange-500 pl-3">New Specialization</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.values(CLASSES).map((cls) => (
                          <button
                            key={cls.type}
                            onClick={() => setCurrentClass(cls.type)}
                            className={`p-4 rounded-lg border text-left transition-all ${currentClass === cls.type ? 'bg-orange-600/20 border-orange-500' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="font-bold text-sm tracking-tight">{cls.type}</div>
                            <div className="text-[10px] text-white/40 uppercase">{selectedTeam === 'NATO' ? cls.animal : cls.mafiaAnimal}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Weapons */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-l-2 border-orange-500 pl-3">Primary Armament</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                    {WEAPONS.filter(w => w.type === WeaponType.PRIMARY).map((weapon) => {
                      const isLockedByLevel = currentLevel < weapon.unlockLevel;
                      const isLockedByChallenge = weapon.unlockLevel > 500 && !unlockedWeapons.includes(weapon.id);
                      const isLocked = isLockedByLevel || isLockedByChallenge;
                      return (
                        <button
                          key={weapon.id}
                          disabled={isLocked}
                          onClick={() => setCurrentPrimary(weapon)}
                          className={`w-full flex justify-between items-center p-4 rounded-lg border transition-all ${
                            isLocked ? 'opacity-30' :
                            currentPrimary.id === weapon.id ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="font-bold italic uppercase text-xs">{weapon.name}</span>
                          {isLocked ? <Lock size={12} /> : <div className={`w-2 h-2 rounded-full ${currentPrimary.id === weapon.id ? 'bg-orange-500' : 'bg-white/10'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicles */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 border-l-2 border-blue-500 pl-3">Vehicle Support</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedVehicleId(null)}
                      className={`w-full flex justify-between items-center p-4 rounded-lg border transition-all ${
                        selectedVehicleId === null ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase italic">On Foot</span>
                      <User size={14} className={selectedVehicleId === null ? 'text-blue-400' : 'text-white/20'} />
                    </button>
                    {VEHICLES.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicleId(vehicle.id)}
                        className={`w-full flex justify-between items-center p-4 rounded-lg border transition-all ${
                          selectedVehicleId === vehicle.id ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase italic">{vehicle.name}</span>
                        <Truck size={14} className={selectedVehicleId === vehicle.id ? 'text-blue-400' : 'text-white/20'} />
                      </button>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[9px] text-white/20 uppercase leading-relaxed tracking-wider">Note: Selected vehicle will be deployed with unit reinforcements.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => revive(currentClass, currentPrimary, selectedVehicleId)}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase italic tracking-tighter text-3xl py-6 rounded-lg transition-all shadow-[0_10px_30px_rgba(234,88,12,0.3)] flex items-center justify-center gap-4"
                >
                  <Zap className="fill-current" /> Deploy Reinforcements
                </button>
                <button 
                  onClick={onQuit}
                  className="px-8 bg-white/5 hover:bg-white/10 text-white/40 font-bold uppercase tracking-widest text-xs border border-white/10 rounded-lg"
                >
                  Quit to Hub
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

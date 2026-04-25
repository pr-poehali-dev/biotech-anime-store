import { useEffect, useRef, useState, useCallback } from 'react';
import type { Player } from './usePlayer';

type Explosion = {
  id: number;
  x: number;
  y: number;
  type: 'blast' | 'smoke' | 'spark';
  size: number;
  born: number;
  life: number;
};

type UnitSprite = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'warrior' | 'sniper' | 'assault' | 'saboteur' | 'drone_op' | 'technician' | 'monster' | 'drone';
  emoji: string;
  faction: 'player' | 'enemy' | 'monster';
  hp: number;
  maxHp: number;
  state: 'move' | 'attack' | 'idle' | 'dead';
  target: { x: number; y: number } | null;
  attackCooldown: number;
  anim: number;
};

type Props = {
  player: Player;
  units: Array<{ id: number; type: string; hp: number; max_hp: number; attack: number }>;
  onCombatResult: (won: boolean, loot: Record<string, number>) => void;
  biome: string;
};

const UNIT_EMOJIS: Record<string, string> = {
  warrior: '⚔️', sniper: '🎯', assault: '🛡️', saboteur: '🗡️',
  drone_op: '📡', technician: '🔧', monster: '👾', drone: '🛸',
};

const BIOME_BG: Record<string, { sky: string; ground: string; accent: string }> = {
  temperate: { sky: '#1a3a5c', ground: '#2d5a27', accent: '#4a9e3f' },
  desert:    { sky: '#5c3a1a', ground: '#8b6914', accent: '#d4a017' },
  arctic:    { sky: '#1a2a4a', ground: '#6090c0', accent: '#90c0e0' },
  volcanic:  { sky: '#3a0a0a', ground: '#5a1a0a', accent: '#e05020' },
  jungle:    { sky: '#0a2a1a', ground: '#1a4a0a', accent: '#3a9020' },
  industrial:{ sky: '#1a1a2a', ground: '#3a3a4a', accent: '#606070' },
  ocean:     { sky: '#0a1a4a', ground: '#0a3a6a', accent: '#2060c0' },
  wasteland: { sky: '#2a2a1a', ground: '#4a3a1a', accent: '#6a5a2a' },
  swamp:     { sky: '#1a2a1a', ground: '#2a3a1a', accent: '#4a6a3a' },
  crystalline:{ sky:'#1a0a3a', ground: '#3a1a6a', accent: '#8a4ae0' },
};

let _eid = 0;
let _uid = 0;

function spawnEnemies(count: number, canvasW: number, canvasH: number): UnitSprite[] {
  const monsters = ['monster', 'monster', 'monster', 'drone'];
  return Array.from({ length: count }, () => {
    const t = monsters[Math.floor(Math.random() * monsters.length)] as UnitSprite['type'];
    return {
      id: _uid++,
      x: canvasW * 0.7 + Math.random() * canvasW * 0.25,
      y: canvasH * 0.3 + Math.random() * canvasH * 0.4,
      vx: 0, vy: 0,
      type: t,
      emoji: UNIT_EMOJIS[t] || '👾',
      faction: 'monster' as const,
      hp: 80 + Math.random() * 120,
      maxHp: 200,
      state: 'idle' as const,
      target: null,
      attackCooldown: 0,
      anim: Math.random() * Math.PI * 2,
    };
  });
}

function spawnPlayerUnits(units: Props['units'], canvasW: number, canvasH: number): UnitSprite[] {
  return units.slice(0, 8).map(u => ({
    id: _uid++,
    x: canvasW * 0.05 + Math.random() * canvasW * 0.2,
    y: canvasH * 0.25 + Math.random() * canvasH * 0.5,
    vx: 0, vy: 0,
    type: (u.type as UnitSprite['type']) || 'warrior',
    emoji: UNIT_EMOJIS[u.type] || '⚔️',
    faction: 'player' as const,
    hp: u.hp,
    maxHp: u.max_hp,
    state: 'idle' as const,
    target: null,
    attackCooldown: 0,
    anim: Math.random() * Math.PI * 2,
  }));
}

export default function PlanetBattleMap({ player, units, onCombatResult, biome }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    explosions: Explosion[];
    sprites: UnitSprite[];
    frame: number;
    battleActive: boolean;
    won: boolean | null;
  }>({ explosions: [], sprites: [], frame: 0, battleActive: false, won: null });
  const [battlePhase, setBattlePhase] = useState<'idle' | 'fighting' | 'won' | 'lost'>('idle');
  const animRef = useRef<number>(0);

  const bg = BIOME_BG[biome] || BIOME_BG.temperate;

  const addExplosion = useCallback((x: number, y: number, type: Explosion['type'] = 'blast') => {
    stateRef.current.explosions.push({
      id: _eid++, x, y, type, size: 20 + Math.random() * 30,
      born: stateRef.current.frame, life: type === 'blast' ? 18 : 30,
    });
  }, []);

  const startBattle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const enemies = spawnEnemies(4 + Math.floor(Math.random() * 4), W, H);
    const players = units.length > 0
      ? spawnPlayerUnits(units, W, H)
      : spawnPlayerUnits([{ id: 1, type: 'warrior', hp: 100, max_hp: 100, attack: 20 }], W, H);
    stateRef.current.sprites = [...players, ...enemies];
    stateRef.current.battleActive = true;
    stateRef.current.won = null;
    setBattlePhase('fighting');
  }, [units]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const drawBackground = () => {
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      skyGrad.addColorStop(0, bg.sky);
      skyGrad.addColorStop(1, bg.ground);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      groundGrad.addColorStop(0, bg.ground);
      groundGrad.addColorStop(1, bg.accent + '44');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // Stars (night sky)
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5) % 1) * W;
        const sy = ((i * 73.1) % 0.5) * H;
        const bright = 0.3 + (i % 5) * 0.12;
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // Terrain details
      ctx.fillStyle = bg.accent + '55';
      for (let i = 0; i < 6; i++) {
        const tx = (i / 6) * W + 20;
        const ty = H * 0.52;
        const tw = 30 + i * 12;
        const th = 15 + i * 5;
        ctx.beginPath();
        ctx.ellipse(tx, ty, tw, th, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Base silhouette (player side)
      ctx.fillStyle = '#2a3a4a';
      ctx.fillRect(0, H * 0.4, W * 0.12, H * 0.6);
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(W * 0.02, H * 0.3, W * 0.08, H * 0.15);
      // Enemy side
      ctx.fillStyle = '#3a1a1a';
      ctx.fillRect(W * 0.88, H * 0.4, W * 0.12, H * 0.6);
      ctx.fillStyle = '#2a0a0a';
      ctx.fillRect(W * 0.90, H * 0.28, W * 0.08, H * 0.15);
    };

    const drawUnit = (u: UnitSprite, frame: number) => {
      if (u.state === 'dead') return;
      const bobY = Math.sin(u.anim + frame * 0.08) * 3;
      const size = 22;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + size * 0.4 + 4, size * 0.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const barW = 28;
      const hpFrac = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(u.x - barW / 2, u.y - size - 10, barW, 4);
      ctx.fillStyle = hpFrac > 0.5 ? '#22c55e' : hpFrac > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(u.x - barW / 2, u.y - size - 10, barW * hpFrac, 4);

      // Faction circle
      const factionColor = u.faction === 'player' ? '#3b82f6' : '#ef4444';
      ctx.fillStyle = factionColor + '44';
      ctx.beginPath();
      ctx.arc(u.x, u.y + bobY, size + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = factionColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Emoji
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Attack flash
      if (u.state === 'attack') {
        ctx.shadowColor = factionColor;
        ctx.shadowBlur = 15;
      }
      ctx.fillText(u.emoji, u.x, u.y + bobY);
      ctx.shadowBlur = 0;
    };

    const drawExplosion = (e: Explosion, frame: number) => {
      const age = frame - e.born;
      const progress = age / e.life;
      if (progress >= 1) return;
      const alpha = 1 - progress;

      if (e.type === 'blast') {
        // Outer ring
        ctx.strokeStyle = `rgba(255,${150 + Math.floor(100 * (1-progress))},0,${alpha})`;
        ctx.lineWidth = 3 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * progress * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        // Inner glow
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * (1 - progress));
        grad.addColorStop(0, `rgba(255,220,0,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,80,0,${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(255,0,0,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * (1 - progress * 0.3), 0, Math.PI * 2);
        ctx.fill();
        // Sparks
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * 3;
          const dist = e.size * progress * 2;
          const sx = e.x + Math.cos(angle) * dist;
          const sy = e.y + Math.sin(angle) * dist * 0.6;
          ctx.fillStyle = `rgba(255,200,0,${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 + (1 - progress) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (e.type === 'smoke') {
        const smokeAlpha = alpha * 0.4;
        ctx.fillStyle = `rgba(180,180,180,${smokeAlpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y - progress * 20, e.size * progress * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'spark') {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const dist = e.size * progress * 1.5;
          ctx.strokeStyle = `rgba(255,255,100,${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(angle) * dist, e.y + Math.sin(angle) * dist * 0.5);
          ctx.stroke();
        }
      }
    };

    const drawBullet = (from: UnitSprite, to: { x: number; y: number }, progress: number) => {
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      ctx.fillStyle = from.faction === 'player' ? '#60a5fa' : '#f87171';
      ctx.shadowColor = from.faction === 'player' ? '#3b82f6' : '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Trail
      for (let t = 1; t <= 4; t++) {
        const tp = Math.max(0, progress - t * 0.04);
        const tx2 = from.x + (to.x - from.x) * tp;
        const ty2 = from.y + (to.y - from.y) * tp;
        ctx.fillStyle = `rgba(255,255,255,${0.15 * (4 - t)})`;
        ctx.beginPath();
        ctx.arc(tx2, ty2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const bullets: Array<{ from: UnitSprite; to: { x: number; y: number }; progress: number }> = [];

    const tick = () => {
      const s = stateRef.current;
      s.frame++;
      const frame = s.frame;

      // Clear
      ctx.clearRect(0, 0, W, H);
      drawBackground();

      // AI logic
      if (s.battleActive) {
        const players = s.sprites.filter(u => u.faction === 'player' && u.state !== 'dead');
        const enemies = s.sprites.filter(u => u.faction === 'monster' && u.state !== 'dead');

        if (players.length === 0 && enemies.length > 0) {
          s.battleActive = false; s.won = false;
          setBattlePhase('lost');
          onCombatResult(false, {});
        } else if (enemies.length === 0 && players.length > 0) {
          s.battleActive = false; s.won = true;
          setBattlePhase('won');
          const loot = { gold: 80 + Math.floor(Math.random() * 150), metal: 30 + Math.floor(Math.random() * 80), crystal: 10 + Math.floor(Math.random() * 60), bio: 40 + Math.floor(Math.random() * 100) };
          onCombatResult(true, loot);
        }

        s.sprites.forEach(u => {
          if (u.state === 'dead') return;
          u.anim += 0.05;
          u.attackCooldown = Math.max(0, u.attackCooldown - 1);

          const foes = u.faction === 'player' ? enemies : players;
          if (foes.length === 0) { u.state = 'idle'; return; }

          // Find nearest foe
          let nearest = foes[0];
          let nearestDist = Infinity;
          foes.forEach(f => {
            const d = Math.hypot(f.x - u.x, f.y - u.y);
            if (d < nearestDist) { nearestDist = d; nearest = f; }
          });

          const attackRange = u.type === 'sniper' ? 200 : 80;

          if (nearestDist < attackRange) {
            u.state = 'attack';
            if (u.attackCooldown === 0) {
              u.attackCooldown = 40 + Math.random() * 20;
              const dmg = 10 + Math.random() * 20;
              nearest.hp -= dmg;
              bullets.push({ from: u, to: { x: nearest.x, y: nearest.y }, progress: 0 });
              addExplosion(nearest.x, nearest.y, 'spark');
              if (nearest.hp <= 0) {
                nearest.state = 'dead';
                addExplosion(nearest.x, nearest.y, 'blast');
                addExplosion(nearest.x + 10, nearest.y - 10, 'smoke');
              }
            }
          } else {
            // Move toward foe
            u.state = 'move';
            const dx = nearest.x - u.x;
            const dy = nearest.y - u.y;
            const dist = Math.hypot(dx, dy);
            const speed = u.type === 'sniper' ? 0.8 : 1.4;
            u.x += (dx / dist) * speed;
            u.y += (dy / dist) * speed;
            // Bounce off edges
            u.x = Math.max(10, Math.min(W - 10, u.x));
            u.y = Math.max(H * 0.25, Math.min(H * 0.8, u.y));
          }
        });
      } else {
        // Idle patrol animation
        s.sprites.forEach(u => {
          u.anim += 0.04;
          u.x += Math.sin(u.anim * 0.3 + u.id) * 0.3;
          u.y += Math.cos(u.anim * 0.2 + u.id) * 0.15;
          u.x = Math.max(10, Math.min(W - 10, u.x));
          u.y = Math.max(H * 0.25, Math.min(H * 0.8, u.y));
        });
      }

      // Draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].progress += 0.12;
        if (bullets[i].progress >= 1) { bullets.splice(i, 1); continue; }
        drawBullet(bullets[i].from, bullets[i].to, bullets[i].progress);
      }

      // Draw units (sort by y for depth)
      const sorted = [...s.sprites].sort((a, b) => a.y - b.y);
      sorted.forEach(u => drawUnit(u, frame));

      // Draw explosions
      s.explosions = s.explosions.filter(e => frame - e.born < e.life);
      s.explosions.forEach(e => drawExplosion(e, frame));

      // Battle phase overlay
      if (battlePhase === 'won') {
        ctx.fillStyle = 'rgba(0,200,100,0.15)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 20;
        ctx.fillText('🏆 ПОБЕДА!', W / 2, H / 2);
        ctx.shadowBlur = 0;
      } else if (battlePhase === 'lost') {
        ctx.fillStyle = 'rgba(200,0,0,0.15)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.fillText('💀 ПОРАЖЕНИЕ', W / 2, H / 2);
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [biome, battlePhase, addExplosion, onCombatResult, bg]);

  // Idle sprites on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const initialSprites: UnitSprite[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: _uid++, x: W * 0.1 + i * 40, y: H * 0.6,
        vx: 0, vy: 0, type: 'warrior' as UnitSprite['type'], emoji: '⚔️',
        faction: 'player' as const, hp: 100, maxHp: 100, state: 'idle' as const,
        target: null, attackCooldown: 0, anim: i * 1.2,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: _uid++, x: W * 0.8 + i * 30, y: H * 0.55,
        vx: 0, vy: 0, type: 'monster' as UnitSprite['type'], emoji: '👾',
        faction: 'monster' as const, hp: 100, maxHp: 100, state: 'idle' as const,
        target: null, attackCooldown: 0, anim: i * 0.8 + 2,
      })),
    ];
    stateRef.current.sprites = initialSprites;
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10">
      <canvas
        ref={canvasRef}
        width={600}
        height={280}
        className="w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Controls overlay */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
        {battlePhase === 'idle' && (
          <button
            onClick={startBattle}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2 rounded-xl text-sm shadow-lg shadow-red-900/50 transition-all hover:scale-105 active:scale-95"
          >
            ⚔️ Начать бой!
          </button>
        )}
        {(battlePhase === 'won' || battlePhase === 'lost') && (
          <button
            onClick={() => { stateRef.current.sprites = []; stateRef.current.explosions = []; setBattlePhase('idle'); }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all"
          >
            🔄 Ещё раз
          </button>
        )}
        {battlePhase === 'fighting' && (
          <div className="bg-black/60 text-orange-400 font-bold px-4 py-1.5 rounded-xl text-sm animate-pulse">
            ⚔️ Идёт бой...
          </div>
        )}
      </div>
      {/* Phase indicator */}
      <div className="absolute top-2 right-3 text-xs text-white/40">
        {biome} · Планета
      </div>
    </div>
  );
}

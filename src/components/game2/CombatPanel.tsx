import { useState, useCallback } from 'react';
import { apiAction } from './api';
import type { Player } from './usePlayer';
import PlanetBattleMap from './PlanetBattleMap';

type Props = {
  player: Player;
  units: Array<{ id: number; type: string; hp: number; max_hp: number; attack: number }>;
  onRefresh: () => void;
  biome?: string;
};

const MONSTERS = [
  { id: 'scout_bot',   name: 'Разведывательный бот', emoji: '🤖', level: 1,  reward: '50-100💰',     energyCost: 15 },
  { id: 'wild_mech',   name: 'Дикий механоид',       emoji: '🦾', level: 3,  reward: '100-200💰',    energyCost: 20 },
  { id: 'rogue_tank',  name: 'Бесконтрольный танк',  emoji: '🚗', level: 5,  reward: '200-400💰',    energyCost: 25 },
  { id: 'alpha_robot', name: 'Альфа-робот',           emoji: '🤖', level: 8,  reward: '300-600💰',    energyCost: 30 },
  { id: 'colossus',    name: 'Колосс',                emoji: '🏗️', level: 12, reward: '500-1000💰',   energyCost: 40 },
  { id: 'void_beast',  name: 'Тварь Бездны',          emoji: '👾', level: 20, reward: 'Редкие детали', energyCost: 50 },
];

export default function CombatPanel({ player, units, onRefresh, biome = 'temperate' }: Props) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ won: boolean; loot: Record<string, number>; message: string } | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [pendingMonster, setPendingMonster] = useState<string | null>(null);

  const attack = useCallback(async (monsterId: string) => {
    setLoading(true); setMsg('');
    try {
      const r = await apiAction('attack', { target_type: 'monster', target_id: monsterId });
      setLastResult({ won: r.success, loot: r.loot || {}, message: r.message });
      onRefresh();
    } catch (e: unknown) {
      setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка'));
    } finally { setLoading(false); setPendingMonster(null); }
  }, [onRefresh]);

  // Callback от анимации — вызываем реальный API после завершения боя
  const handleCombatResult = useCallback((won: boolean, _loot: Record<string, number>) => {
    if (pendingMonster) {
      attack(pendingMonster);
    }
  }, [pendingMonster, attack]);

  const handleAttackClick = (monsterId: string) => {
    if (player.energy < 15) return;
    setPendingMonster(monsterId);
  };

  return (
    <div className="space-y-3">
      {/* Energy display */}
      <div className="bg-slate-800 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white font-bold text-sm">⚡ Энергия</span>
          <span className="text-blue-400 font-black">{player.energy}/1000</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all"
            style={{ width: `${(player.energy / 1000) * 100}%` }} />
        </div>
        <div className="text-slate-500 text-xs mt-1">+1 каждые 10 мин · Восстановить — в магазине</div>
      </div>

      {/* ANIMATED BATTLE MAP */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-sm font-bold">🗺️ Карта планеты</h3>
          <button onClick={() => setShowMap(m => !m)} className="text-slate-500 hover:text-white text-xs transition-colors">
            {showMap ? 'Свернуть ↑' : 'Развернуть ↓'}
          </button>
        </div>
        {showMap && (
          <PlanetBattleMap
            player={player}
            units={units}
            biome={biome}
            onCombatResult={handleCombatResult}
          />
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`rounded-2xl p-4 ${lastResult.won ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
          <div className={`font-bold text-sm mb-1 ${lastResult.won ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.won ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
          </div>
          <p className="text-white/80 text-xs">{lastResult.message}</p>
          {lastResult.won && Object.values(lastResult.loot).some(v => v > 0) && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {lastResult.loot.gold > 0 && <span className="text-yellow-400 text-xs font-bold">+{lastResult.loot.gold}💰</span>}
              {lastResult.loot.metal > 0 && <span className="text-slate-300 text-xs font-bold">+{lastResult.loot.metal}⚙️</span>}
              {lastResult.loot.crystal > 0 && <span className="text-purple-400 text-xs font-bold">+{lastResult.loot.crystal}💎</span>}
              {lastResult.loot.bio > 0 && <span className="text-green-400 text-xs font-bold">+{lastResult.loot.bio}🧬</span>}
            </div>
          )}
        </div>
      )}

      {msg && <div className="bg-red-500/10 text-red-400 rounded-xl px-3 py-2 text-sm">{msg}</div>}

      {/* Monster list */}
      <div className="space-y-2">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Выбрать противника</h3>
        {MONSTERS.map(m => {
          const canFight = player.energy >= m.energyCost;
          const isPending = pendingMonster === m.id;
          return (
            <button key={m.id}
              onClick={() => canFight && !loading && handleAttackClick(m.id)}
              disabled={!canFight || loading}
              className={`w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all
                ${isPending ? 'bg-orange-900/40 border border-orange-600 scale-[1.01]' : 'bg-slate-800 hover:bg-slate-700'}
                disabled:opacity-40`}>
              <div className="text-2xl">{m.emoji}</div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{m.name}</div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>Ур.{m.level}</span>
                  <span className="text-yellow-400/80">{m.reward}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isPending ? (
                  <div className="text-orange-400 text-xs font-bold animate-pulse">⚔️ В бою...</div>
                ) : (
                  <>
                    <div className="text-orange-400 font-bold text-xs">⚔️ Атака</div>
                    <div className="text-slate-500 text-[10px]">-{m.energyCost}⚡</div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {player.energy < 15 && (
        <div className="text-center text-yellow-400 text-sm bg-yellow-500/10 rounded-xl p-3">
          ⚡ Мало энергии. Ждите или купите в магазине.
        </div>
      )}
    </div>
  );
}

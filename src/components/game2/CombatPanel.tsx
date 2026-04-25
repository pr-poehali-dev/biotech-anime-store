import { useState } from 'react';
import { apiAction } from './api';
import type { Player } from './usePlayer';

type Props = {
  player: Player;
  onRefresh: () => void;
};

const MONSTERS = [
  { id: 'scout_bot', name: 'Разведывательный бот', emoji: '🤖', level: 1, reward: '50-100💰' },
  { id: 'wild_mech', name: 'Дикий механоид', emoji: '🦾', level: 3, reward: '100-200💰' },
  { id: 'rogue_tank', name: 'Бесконтрольный танк', emoji: '🚗', level: 5, reward: '200-400💰' },
  { id: 'alpha_robot', name: 'Альфа-робот', emoji: '🤖', level: 8, reward: '300-600💰' },
  { id: 'colossus', name: 'Колосс', emoji: '🏗️', level: 12, reward: '500-1000💰' },
  { id: 'void_beast', name: 'Тварь Бездны', emoji: '👾', level: 20, reward: 'Редкие детали' },
];

export default function CombatPanel({ player, onRefresh }: Props) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ won: boolean; loot: Record<string, number>; message: string } | null>(null);

  const attack = async (monsterId: string) => {
    setLoading(true); setMsg('');
    try {
      const r = await apiAction('attack', { target_type: 'monster', target_id: monsterId });
      setLastResult({ won: r.success, loot: r.loot || {}, message: r.message });
      onRefresh();
    } catch (e: unknown) {
      setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка'));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      {/* Energy display */}
      <div className="bg-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm">⚡ Энергия</span>
          <span className="text-blue-400 font-black">{player.energy}/1000</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all"
            style={{ width: `${(player.energy / 1000) * 100}%` }} />
        </div>
        <div className="text-slate-500 text-xs mt-1">+1 каждые 10 минут · Атака стоит 25⚡</div>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`rounded-2xl p-4 ${lastResult.won ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
          <div className={`font-bold text-sm mb-1 ${lastResult.won ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.won ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
          </div>
          <p className="text-white/80 text-xs">{lastResult.message}</p>
          {lastResult.won && Object.keys(lastResult.loot).length > 0 && (
            <div className="flex gap-3 mt-2">
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
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Враги на планете</h3>
        {MONSTERS.map(m => (
          <button key={m.id} onClick={() => attack(m.id)}
            disabled={loading || player.energy < 25}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl p-4 flex items-center gap-4 text-left transition-colors">
            <div className="text-3xl">{m.emoji}</div>
            <div className="flex-1">
              <div className="text-white font-bold text-sm">{m.name}</div>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>Ур.{m.level}</span>
                <span>Награда: {m.reward}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-bold text-sm">⚔️ Атаковать</div>
              <div className="text-slate-500 text-xs">-25⚡</div>
            </div>
          </button>
        ))}
      </div>

      {player.energy < 25 && (
        <div className="text-center text-yellow-400 text-sm bg-yellow-500/10 rounded-xl p-3">
          ⚡ Недостаточно энергии. Ждите восполнения или купите в магазине.
        </div>
      )}
    </div>
  );
}

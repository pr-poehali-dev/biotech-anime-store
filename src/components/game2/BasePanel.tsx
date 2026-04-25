import { useState } from 'react';
import { apiAction } from './api';
import type { Player } from './usePlayer';

type Base = {
  id: number; name: string; level: number; is_deployed: boolean;
  pos_x: number; pos_y: number; hp: number; max_hp: number;
  commander_level: number; commander_implants: Record<string, number>;
  defenses: Record<string, unknown>; production_queue: unknown[];
  planet_id: number | null;
};

type Props = {
  bases: Base[];
  player: Player;
  onRefresh: () => void;
};

const DEFENSES = [
  { id: 'towers', name: 'Стрелковая вышка', emoji: '🗼', cost: '300💰 200⚙️' },
  { id: 'anti_tank', name: 'Противотанк', emoji: '🚀', cost: '500💰 400⚙️ 100💎' },
  { id: 'anti_drone', name: 'Антидрон', emoji: '📡', cost: '400💰 300⚙️ 150💎' },
  { id: 'anti_rocket', name: 'Противоракета', emoji: '⚡', cost: '600💰 500⚙️' },
  { id: 'energy_dome', name: 'Энерго купол', emoji: '🔮', cost: '1000💰 300⚙️ 500💎' },
];

const COMMANDER_IMPLANTS = [
  { id: 'neural', name: 'Нейро-усилитель', emoji: '🧠' },
  { id: 'tactical', name: 'Тактический процессор', emoji: '💡' },
  { id: 'combat', name: 'Боевой интерфейс', emoji: '⚔️' },
  { id: 'network', name: 'Сетевой интегратор', emoji: '🌐' },
];

export default function BasePanel({ bases, player, onRefresh }: Props) {
  const [selectedBase, setSelectedBase] = useState<Base | null>(bases[0] || null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'info' | 'defense' | 'commander'>('info');

  const act = async (action: string, body: Record<string, unknown>) => {
    if (!selectedBase) return;
    setLoading(true); setMsg('');
    try {
      const r = await apiAction(action, { base_id: selectedBase.id, ...body });
      setMsg(r.message || '✅ Успешно!');
      onRefresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? '❌ ' + e.message : '❌ Ошибка');
    } finally { setLoading(false); }
  };

  if (!bases.length) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-4xl mb-3">🏭</div>
        <p>Нет баз. Высадитесь на планету чтобы начать.</p>
      </div>
    );
  }

  const base = selectedBase || bases[0];

  return (
    <div className="space-y-3">
      {/* Base selector */}
      {bases.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {bases.map(b => (
            <button key={b.id} onClick={() => setSelectedBase(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${selectedBase?.id === b.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Base card */}
      <div className="bg-slate-800 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏭</span>
              <div>
                <h3 className="text-white font-black">{base.name}</h3>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span>Ур. {base.level}</span>
                  <span className={base.is_deployed ? 'text-green-400' : 'text-yellow-400'}>
                    {base.is_deployed ? '🟢 Развёрнута' : '🟡 На ходу'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-400">Командир</div>
            <div className="text-yellow-400 font-bold">⭐ Ур. {base.commander_level}/200</div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>HP</span>
            <span>{base.hp}/{base.max_hp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(base.hp / base.max_hp) * 100}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(['info', 'defense', 'commander'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs rounded-lg font-bold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {t === 'info' ? '📋 Инфо' : t === 'defense' ? '🛡️ Защита' : '👤 Командир'}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => act(base.is_deployed ? 'deploy-base' : 'deploy-base', { deploy: !base.is_deployed })}
                disabled={loading}
                className={`py-2 rounded-xl text-xs font-bold transition-colors ${base.is_deployed ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                {base.is_deployed ? '📦 Свернуть' : '🏗️ Развернуть'}
              </button>
              <button onClick={() => act('upgrade-base', {})}
                disabled={loading || !base.is_deployed}
                className="py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors">
                ⬆️ Улучшить (Ур.{base.level + 1})
              </button>
            </div>
            <div className="text-xs text-slate-500 text-center">
              Стоимость улучшения: 💰{200 * base.level} ⚙️{150 * base.level} 💎{100 * base.level}
            </div>

            {/* Defenses summary */}
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-2">Текущая защита:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {base.defenses.towers as number > 0 && <span className="text-yellow-400">🗼×{base.defenses.towers as number}</span>}
                {base.defenses.energy_dome && <span className="text-blue-400">🔮Купол</span>}
                {base.defenses.anti_tank && <span className="text-red-400">🚀Антитанк</span>}
                {base.defenses.anti_drone && <span className="text-green-400">📡Антидрон</span>}
                {base.defenses.anti_rocket && <span className="text-purple-400">⚡Антиракета</span>}
                {!base.defenses.towers && !base.defenses.energy_dome && <span className="text-slate-500">Нет защиты</span>}
              </div>
            </div>
          </div>
        )}

        {tab === 'defense' && (
          <div className="space-y-2">
            {DEFENSES.map(d => (
              <button key={d.id} onClick={() => act('add-defense', { defense_type: d.id })}
                disabled={loading || !base.is_deployed}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-xl p-3 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{d.emoji}</span>
                  <div className="text-left">
                    <div className="text-white text-xs font-bold">{d.name}</div>
                    <div className="text-slate-400 text-[10px]">{d.cost}</div>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">+ Добавить</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'commander' && (
          <div className="space-y-2">
            <div className="bg-slate-700 rounded-xl p-3 mb-3">
              <div className="text-yellow-400 font-bold text-sm mb-1">👤 Командир базы</div>
              <div className="text-xs text-slate-400">Уровень: <span className="text-white font-bold">{base.commander_level}</span>/200</div>
              <div className="text-xs text-slate-400">Интегрирован в сеть базы</div>
              {Object.entries(base.commander_implants || {}).map(([k, v]) => (
                <div key={k} className="text-xs text-purple-400">✦ {k}: Ур.{v as number}</div>
              ))}
            </div>
            {COMMANDER_IMPLANTS.map(imp => (
              <button key={imp.id} onClick={() => act('upgrade-commander', { implant_type: imp.id })}
                disabled={loading || !base.is_deployed || base.commander_level >= 200}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-xl p-3 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{imp.emoji}</span>
                  <div className="text-left">
                    <div className="text-white text-xs font-bold">{imp.name}</div>
                    <div className="text-slate-400 text-[10px]">💰{500 + base.commander_level * 100} 💎{200 + base.commander_level * 50}</div>
                  </div>
                </div>
                <span className="text-yellow-400 text-xs">+1 ур.</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {msg && <div className={`rounded-xl px-3 py-2 text-sm ${msg.startsWith('❌') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{msg}</div>}
    </div>
  );
}

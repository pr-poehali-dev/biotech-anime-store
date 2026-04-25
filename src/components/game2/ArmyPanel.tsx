import { useState } from 'react';
import { apiAction } from './api';
import type { Player } from './usePlayer';

type Unit = {
  id: number; type: string; specialization: string; level: number;
  implants: string[]; weapon: string; hp: number; max_hp: number;
  attack: number; defense: number; is_alive: boolean; base_id: number | null;
};

type Props = {
  units: Unit[];
  player: Player;
  bases: Array<{ id: number; name: string; is_deployed: boolean }>;
  onRefresh: () => void;
};

const UNIT_TYPES = [
  { id: 'warrior', name: 'Воин', emoji: '⚔️', desc: 'Базовый боец' },
  { id: 'sniper', name: 'Снайпер', emoji: '🎯', desc: 'Имплант глаза' },
  { id: 'assault', name: 'Штурмовик', emoji: '🛡️', desc: 'Руки/ноги/корпус' },
  { id: 'saboteur', name: 'Диверсант', emoji: '🗡️', desc: 'Имплант позвоночника' },
  { id: 'drone_op', name: 'Оператор БПА', emoji: '📡', desc: 'Управление дронами' },
  { id: 'technician', name: 'Техник', emoji: '🔧', desc: 'Интеллект+техника' },
];

const IMPLANTS = [
  { id: 'eye_implant', name: 'Имплант глаза', emoji: '👁️', for: 'sniper' },
  { id: 'arm_implant', name: 'Имплант рук', emoji: '💪', for: 'assault' },
  { id: 'leg_implant', name: 'Имплант ног', emoji: '🦵', for: 'assault' },
  { id: 'armor_implant', name: 'Усиление корпуса', emoji: '🛡️', for: 'assault' },
  { id: 'spine_implant', name: 'Имплант позвоночника', emoji: '🦴', for: 'saboteur' },
  { id: 'comm_implant', name: 'Имплант связи', emoji: '📡', for: 'drone_op' },
  { id: 'tech_implant', name: 'Техно-имплант', emoji: '🔧', for: 'technician' },
  { id: 'brain_implant', name: 'Имплант интеллекта', emoji: '🧠', for: 'technician' },
];

const WEAPONS = [
  { id: 'pistol', name: 'Пистолет', emoji: '🔫', atk: '+5' },
  { id: 'rifle', name: 'Автомат', emoji: '🔫', atk: '+15' },
  { id: 'sniper_rifle', name: 'Снайперская', emoji: '🎯', atk: '+30' },
  { id: 'twin_mg', name: 'Спаренный пулемёт', emoji: '💥', atk: '+50' },
  { id: 'rocket', name: 'Ракетница', emoji: '🚀', atk: '+45' },
];

const SPEC_COLOR: Record<string, string> = {
  sniper: 'text-red-400', assault: 'text-orange-400',
  saboteur: 'text-purple-400', drone_op: 'text-cyan-400',
  technician: 'text-green-400', none: 'text-slate-400',
};

export default function ArmyPanel({ units, player, bases, onRefresh }: Props) {
  const [tab, setTab] = useState<'army' | 'recruit' | 'implants'>('army');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedBase, setSelectedBase] = useState(bases.find(b => b.is_deployed)?.id || bases[0]?.id);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const act = async (action: string, body: Record<string, unknown>) => {
    setLoading(true); setMsg('');
    try {
      const r = await apiAction(action, body);
      setMsg(r.message || '✅ Успешно!');
      onRefresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? '❌ ' + e.message : '❌ Ошибка');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(['army', 'recruit', 'implants'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs rounded-xl font-bold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {t === 'army' ? `⚔️ Армия (${units.length})` : t === 'recruit' ? '➕ Нанять' : '🔬 Импланты'}
          </button>
        ))}
      </div>

      {msg && <div className={`rounded-xl px-3 py-2 text-sm ${msg.startsWith('❌') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{msg}</div>}

      {tab === 'army' && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {units.length === 0 && <div className="text-center text-slate-500 py-6">Армия пуста. Наймите бойцов.</div>}
          {units.map(u => {
            const type = UNIT_TYPES.find(t => t.id === u.type);
            return (
              <button key={u.id} onClick={() => setSelectedUnit(s => s?.id === u.id ? null : u)}
                className={`w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-3 flex items-center gap-3 text-left transition-all ${selectedUnit?.id === u.id ? 'ring-1 ring-blue-500' : ''}`}>
                <span className="text-2xl">{type?.emoji || '⚔️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold">{type?.name || u.type}</span>
                    <span className={`text-[10px] font-bold ${SPEC_COLOR[u.specialization] || 'text-slate-400'}`}>{u.specialization !== 'none' ? u.specialization : ''}</span>
                  </div>
                  <div className="text-xs text-slate-400">⚔️{u.attack} 🛡️{u.defense} · {u.implants?.length || 0} имплантов</div>
                  <div className="h-1 bg-slate-700 rounded mt-1 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${(u.hp / u.max_hp) * 100}%` }} />
                  </div>
                </div>
                {u.implants?.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap max-w-[60px]">
                    {u.implants.slice(0, 4).map((imp, i) => <span key={i} className="text-xs">🔬</span>)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === 'recruit' && (
        <div className="space-y-3">
          {bases.length > 0 && (
            <div>
              <label className="text-slate-400 text-xs block mb-1">База для производства:</label>
              <select className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                value={selectedBase} onChange={e => setSelectedBase(Number(e.target.value))}>
                {bases.map(b => <option key={b.id} value={b.id}>{b.name} {b.is_deployed ? '(развёрнута)' : '(на ходу)'}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-2">
            {UNIT_TYPES.map(u => (
              <button key={u.id} onClick={() => act('train-unit', { unit_type: u.id, base_id: selectedBase })}
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl p-3 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{u.emoji}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-bold">{u.name}</div>
                    <div className="text-slate-400 text-xs">{u.desc}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">Нанять →</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'implants' && (
        <div className="space-y-3">
          {!selectedUnit && (
            <div className="text-slate-400 text-xs text-center py-3">
              Выберите солдата во вкладке «Армия»
            </div>
          )}
          {selectedUnit && (
            <>
              <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{UNIT_TYPES.find(t => t.id === selectedUnit.type)?.emoji}</span>
                <div>
                  <div className="text-white font-bold text-sm">{UNIT_TYPES.find(t => t.id === selectedUnit.type)?.name}</div>
                  <div className="text-slate-400 text-xs">{selectedUnit.implants?.length || 0} имплантов установлено</div>
                </div>
              </div>
              <div className="space-y-2">
                {IMPLANTS.map(imp => {
                  const has = selectedUnit.implants?.includes(imp.id);
                  return (
                    <button key={imp.id} onClick={() => !has && act('implant-unit', { unit_id: selectedUnit.id, implant: imp.id })}
                      disabled={loading || !!has}
                      className={`w-full rounded-xl p-3 flex items-center justify-between transition-colors ${has ? 'bg-green-900/30 border border-green-700' : 'bg-slate-800 hover:bg-slate-700'} disabled:opacity-60`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{imp.emoji}</span>
                        <div className="text-left">
                          <div className="text-white text-xs font-bold">{imp.name}</div>
                          <div className="text-slate-400 text-[10px]">Специализация: {imp.for}</div>
                        </div>
                      </div>
                      <span className={`text-xs ${has ? 'text-green-400' : 'text-slate-400'}`}>{has ? '✅' : 'Установить'}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

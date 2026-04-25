import { useState, useEffect } from 'react';
import { apiAlliances, apiLeaderboard, apiAction } from './api';
import type { Player } from './usePlayer';

type Alliance = {
  id: number; name: string; faction: string; emblem: string;
  description: string; members: number; leader_name: string;
};

type Props = {
  player: Player;
  onRefresh: () => void;
};

export default function AlliancePanel({ player, onRefresh }: Props) {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: number; nickname: string; faction: string; score: number; alliance: string | null }>>([]);
  const [tab, setTab] = useState<'alliances' | 'top' | 'create'>('alliances');
  const [form, setForm] = useState({ name: '', emblem: '⚔️', description: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiAlliances().then(setAlliances);
    apiLeaderboard().then(setLeaderboard);
  }, []);

  const EMBLEMS = ['⚔️', '🛡️', '🚀', '🤖', '🧬', '👑', '🔥', '⚡', '🌌', '💀'];

  const act = async (action: string, body: Record<string, unknown>) => {
    setLoading(true); setMsg('');
    try {
      const r = await apiAction(action, body);
      setMsg('✅ ' + (r.message || 'Успешно!'));
      const [a, l] = await Promise.all([apiAlliances(), apiLeaderboard()]);
      setAlliances(a); setLeaderboard(l);
      onRefresh();
    } catch (e: unknown) {
      setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка'));
    } finally { setLoading(false); }
  };

  const FACTION_COLOR: Record<string, string> = { human: 'text-green-400', tech: 'text-cyan-400', cyborg: 'text-purple-400' };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(['alliances', 'top', 'create'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs rounded-xl font-bold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {t === 'alliances' ? '🏰 Альянсы' : t === 'top' ? '🏆 Топ' : '➕ Создать'}
          </button>
        ))}
      </div>

      {msg && <div className={`rounded-xl px-3 py-2 text-sm ${msg.startsWith('❌') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{msg}</div>}

      {tab === 'alliances' && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {alliances.length === 0 && <div className="text-slate-500 text-center py-6">Альянсов ещё нет. Создайте первый!</div>}
          {alliances.map(a => (
            <div key={a.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{a.emblem}</span>
                  <div>
                    <div className="text-white font-bold text-sm">{a.name}</div>
                    <div className="text-slate-400 text-xs">{a.members} участников · {a.leader_name}</div>
                  </div>
                </div>
                <div className={`text-xs font-bold ${FACTION_COLOR[a.faction] || 'text-slate-400'}`}>{a.faction}</div>
              </div>
              {a.description && <p className="text-slate-400 text-xs mb-2">{a.description}</p>}
              {!player.alliance_id && (
                <button onClick={() => act('join-alliance', { alliance_id: a.id })}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
                  Вступить
                </button>
              )}
              {player.alliance_id === a.id && (
                <div className="text-center text-green-400 text-xs font-bold py-1">✅ Вы в этом альянсе</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'top' && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {leaderboard.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${p.id === player.id ? 'bg-blue-900/30 border border-blue-700' : 'bg-slate-800'}`}>
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black
                ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold truncate">{p.nickname}</div>
                <div className={`text-xs ${FACTION_COLOR[p.faction] || 'text-slate-400'}`}>{p.faction} {p.alliance ? `· ${p.alliance}` : ''}</div>
              </div>
              <div className="text-yellow-400 font-bold text-sm">{p.score.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <div className="space-y-3">
          {player.alliance_id ? (
            <div className="text-center text-yellow-400 text-sm py-4">Вы уже состоите в альянсе</div>
          ) : (
            <>
              <input className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Название альянса" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="text-slate-400 text-xs block mb-2">Эмблема:</label>
                <div className="flex gap-2 flex-wrap">
                  {EMBLEMS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emblem: e }))}
                      className={`text-2xl w-10 h-10 rounded-xl transition-all ${form.emblem === e ? 'bg-blue-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <textarea className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Описание альянса (необязательно)" rows={2}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div className="text-slate-400 text-xs">Стоимость создания: 💰1000</div>
              <button onClick={() => act('create-alliance', { name: form.name, emblem: form.emblem, description: form.description })}
                disabled={loading || !form.name}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black py-3 rounded-xl transition-colors">
                {loading ? '...' : '🏰 Создать альянс'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

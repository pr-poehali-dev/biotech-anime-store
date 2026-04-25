import type { Player } from './usePlayer';

type Props = {
  player: Player;
  onShop: () => void;
  onLogout: () => void;
};

const FACTION_EMOJI: Record<string, string> = { human: '🧬', tech: '🤖', cyborg: '⚡' };
const FACTION_NAME: Record<string, string> = { human: 'Люди', tech: 'Техника', cyborg: 'Киборги' };

export default function PlayerHUD({ player, onShop, onLogout }: Props) {
  return (
    <div className="bg-slate-900 border-b border-white/10 px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Player info */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-xl">{FACTION_EMOJI[player.faction] || '👤'}</span>
          <div>
            <div className="text-white font-black text-sm leading-tight">{player.nickname}</div>
            <div className="text-slate-500 text-[10px]">{FACTION_NAME[player.faction]} · {player.score.toLocaleString()} очков</div>
          </div>
        </div>

        {/* Resources */}
        <div className="flex gap-1.5 flex-1 flex-wrap">
          {[
            { v: player.energy, e: '⚡', c: 'text-blue-400', max: 1000 },
            { v: player.gold, e: '💰', c: 'text-yellow-400', max: null },
            { v: player.metal, e: '⚙️', c: 'text-slate-300', max: null },
            { v: player.crystal, e: '💎', c: 'text-purple-400', max: null },
            { v: player.bio_matter, e: '🧬', c: 'text-green-400', max: null },
          ].map(({ v, e, c, max }) => (
            <div key={e} className="bg-slate-800 rounded-lg px-2 py-1 flex items-center gap-1 min-w-fit">
              <span className="text-sm">{e}</span>
              <span className={`text-xs font-bold ${c}`}>{v}{max ? `/${max}` : ''}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button onClick={onShop}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-xl text-xs transition-colors">
            🛒 Магазин
          </button>
          <button onClick={onLogout}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors">
            Выйти
          </button>
        </div>
      </div>

      {/* Energy bar */}
      <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all"
          style={{ width: `${(player.energy / 1000) * 100}%` }} />
      </div>
    </div>
  );
}

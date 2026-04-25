import { type Resources } from "./gameData";

type Props = {
  resources: Resources;
  turn: number;
  score: number;
  factionEmoji: string;
  factionName: string;
  onEndTurn: () => void;
  onShop: () => void;
};

export default function ResourceBar({ resources, turn, score, factionEmoji, factionName, onEndTurn, onShop }: Props) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-2">
        <span className="text-2xl">{factionEmoji}</span>
        <div>
          <div className="text-white font-bold text-sm leading-tight">{factionName}</div>
          <div className="text-slate-400 text-xs">Ход {turn} · Очки: {score}</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap flex-1">
        {([
          { key: "gold", emoji: "💰", label: "Золото", color: "text-yellow-400" },
          { key: "food", emoji: "🌾", label: "Еда", color: "text-green-400" },
          { key: "iron", emoji: "⚙️", label: "Железо", color: "text-slate-300" },
          { key: "energy", emoji: "⚡", label: "Энергия", color: "text-blue-400" },
        ] as const).map(({ key, emoji, label, color }) => (
          <div key={key} className="bg-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5 min-w-[80px]">
            <span>{emoji}</span>
            <div>
              <div className={`font-bold text-sm ${color}`}>{resources[key]}</div>
              <div className="text-slate-500 text-[10px]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onShop}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-2 rounded-xl text-sm transition-colors"
        >
          🛒 Магазин
        </button>
        <button
          onClick={onEndTurn}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          ▶ Ход
        </button>
      </div>
    </div>
  );
}

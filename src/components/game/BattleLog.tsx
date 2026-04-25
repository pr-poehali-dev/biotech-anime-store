import { type BattleLog } from "./useGameState";

type Props = {
  log: BattleLog[];
};

const typeStyle: Record<string, string> = {
  attack: "text-orange-400",
  defense: "text-blue-400",
  info: "text-slate-300",
  win: "text-green-400",
  lose: "text-red-400",
};

export default function BattleLogPanel({ log }: Props) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 h-48 overflow-hidden">
      <h3 className="text-white font-black text-sm mb-2">📜 Летопись</h3>
      <div className="space-y-1 overflow-y-auto h-[calc(100%-2rem)]">
        {log.length === 0 && <div className="text-slate-500 text-xs">Ещё нет событий...</div>}
        {log.map((entry, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="text-slate-600 shrink-0">Ход {entry.turn}</span>
            <span className={typeStyle[entry.type] || "text-slate-300"}>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { type Territory } from "./gameData";

type Props = {
  territories: Territory[];
  selectedId: string | null;
  playerTerritories: string[];
  onSelect: (id: string) => void;
};

const ownerColor: Record<string, string> = {
  player: "#22c55e",
  enemy_1: "#ef4444",
  enemy_2: "#f97316",
  enemy_3: "#a855f7",
};

export default function GameMap({ territories, selectedId, playerTerritories, onSelect }: Props) {
  return (
    <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10" style={{ aspectRatio: "16/9" }}>
      {/* Background stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_#0f172a_60%,_#0a0a1a_100%)]" />
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white opacity-30"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${(i * 3.7) % 100}%`,
            top: `${(i * 7.3) % 100}%`,
          }}
        />
      ))}

      {/* Connections between territories */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {territories.map((t, i) =>
          territories.slice(i + 1, i + 3).map((t2) => (
            <line
              key={`${t.id}-${t2.id}`}
              x1={t.x} y1={t.y} x2={t2.x} y2={t2.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.3"
            />
          ))
        )}
      </svg>

      {/* Territory nodes */}
      {territories.map((t) => {
        const isPlayer = t.owner === "player";
        const isEnemy = t.owner?.startsWith("enemy");
        const isFree = !t.owner;
        const isSelected = selectedId === t.id;
        const color = t.owner ? ownerColor[t.owner] || "#888" : "#64748b";

        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            title={t.name}
          >
            <div
              className={`relative flex items-center justify-center rounded-full text-lg transition-all duration-200
                ${isSelected ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900" : "hover:scale-110"}
              `}
              style={{
                width: 42,
                height: 42,
                background: `radial-gradient(circle, ${color}33, ${color}88)`,
                border: `2px solid ${color}`,
                boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 6px ${color}66`,
              }}
            >
              <span>{t.emoji}</span>
              {t.troops > 0 && (
                <span
                  className="absolute -bottom-1 -right-1 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: color, fontSize: 9 }}
                >
                  {t.troops}
                </span>
              )}
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-white/60 pointer-events-none hidden group-hover:block bg-slate-900/80 px-1 rounded">
              {t.name}
            </div>
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-white/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Ваша</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Враг</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Свободная</span>
      </div>
    </div>
  );
}

import { FACTIONS, type Faction } from "./gameData";

type Props = {
  onSelect: (faction: Faction) => void;
};

export default function FactionSelect({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
          Эпоха Великих Держав
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Завоюй континент и покори звёзды. Выбери фракцию, которой будешь править.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {FACTIONS.map((faction) => (
          <button
            key={faction.id}
            onClick={() => onSelect(faction)}
            className={`bg-gradient-to-br ${faction.bgGradient} rounded-2xl p-6 text-left border border-white/10 hover:border-white/30 hover:scale-[1.02] transition-all duration-200 shadow-xl`}
          >
            <div className="text-4xl mb-3">{faction.emoji}</div>
            <h2 className="text-xl font-black mb-1">{faction.name}</h2>
            <p className="text-sm text-white/70 mb-4">{faction.description}</p>
            <div className="space-y-1">
              {faction.bonuses.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-400">✦</span>
                  {b}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-yellow-400">💰</div>
                <div>{faction.startResources.gold}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-green-400">🌾</div>
                <div>{faction.startResources.food}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-slate-300">⚙️</div>
                <div>{faction.startResources.iron}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-blue-400">⚡</div>
                <div>{faction.startResources.energy}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

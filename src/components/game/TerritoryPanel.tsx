import { TERRITORIES, type Territory } from "./gameData";
import { UNITS } from "./gameData";
import { type ArmyUnit } from "./useGameState";

type Props = {
  territory: Territory | null;
  army: ArmyUnit[];
  onAttack: (id: string) => void;
  onClose: () => void;
};

const RESOURCE_LABELS: Record<string, string> = {
  gold: "💰 Золото",
  food: "🌾 Еда",
  iron: "⚙️ Железо",
  energy: "⚡ Энергия",
};

export default function TerritoryPanel({ territory, army, onAttack, onClose }: Props) {
  if (!territory) return null;

  const isPlayer = territory.owner === "player";
  const isEnemy = territory.owner?.startsWith("enemy");
  const isFree = !territory.owner;

  const totalAttack = army.reduce((sum, a) => {
    const u = UNITS.find((u) => u.id === a.unitId);
    return sum + (u?.attack || 0) * a.count;
  }, 0);
  const totalUnits = army.reduce((sum, a) => sum + a.count, 0);
  const estDefense = (territory.troops || 0) * 8;
  const winChance = totalAttack > 0 ? Math.min(99, Math.round((totalAttack / (estDefense + 1)) * 60)) : 0;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-2xl mb-1">{territory.emoji}</div>
          <h3 className="text-white font-black text-base">{territory.name}</h3>
          <div className="text-slate-400 text-xs">
            {isPlayer ? "🟢 Ваша территория" : isEnemy ? "🔴 Вражеская" : "⚪ Нейтральная"}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800 rounded-xl p-2 text-center">
          <div className="text-xs text-slate-400">Ресурс</div>
          <div className="text-sm font-bold text-white">{RESOURCE_LABELS[territory.resource]}</div>
          <div className="text-xs text-slate-300">+{territory.resourceAmount}/ход</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-2 text-center">
          <div className="text-xs text-slate-400">Войска</div>
          <div className="text-2xl font-black text-white">{territory.troops}</div>
        </div>
      </div>

      {!isPlayer && (
        <div className="mb-3 bg-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 mb-1">Ваша армия: {totalUnits} воинов</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white">Атака: <span className="text-orange-400 font-bold">{totalAttack}</span></div>
            <div className="text-xs text-white">Защита врага: ~<span className="text-red-400 font-bold">{estDefense}</span></div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-slate-400 mb-1">Шанс победы: {winChance}%</div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${winChance > 60 ? "bg-green-500" : winChance > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${winChance}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {!isPlayer && (
        <button
          onClick={() => onAttack(territory.id)}
          disabled={totalUnits === 0}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${
            totalUnits > 0
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {totalUnits === 0 ? "Нет войск для атаки" : `⚔️ Атаковать ${territory.name}`}
        </button>
      )}

      {isPlayer && (
        <div className="text-center text-green-400 text-sm font-bold py-2">
          ✅ Эта территория под вашим контролем
        </div>
      )}
    </div>
  );
}

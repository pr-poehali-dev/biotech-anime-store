import { useState } from "react";
import { UNITS, type Unit, type Resources } from "./gameData";
import { type ArmyUnit } from "./useGameState";

type Props = {
  army: ArmyUnit[];
  resources: Resources;
  onTrain: (unit: Unit, count: number) => void;
};

export default function ArmyPanel({ army, resources, onTrain }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const getCount = (id: string) => counts[id] || 1;
  const canAfford = (unit: Unit, count: number) =>
    resources.gold >= unit.cost.gold * count &&
    resources.food >= unit.cost.food * count &&
    resources.iron >= unit.cost.iron * count &&
    resources.energy >= unit.cost.energy * count;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
      <h3 className="text-white font-black text-base mb-3">⚔️ Армия</h3>

      {/* Current army */}
      {army.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {army.map((a) => {
            const unit = UNITS.find((u) => u.id === a.unitId);
            if (!unit) return null;
            return (
              <div key={a.unitId} className="bg-slate-800 rounded-xl px-3 py-2 text-center min-w-[60px]">
                <div className="text-xl">{unit.emoji}</div>
                <div className="text-white text-xs font-bold">{a.count}</div>
                <div className="text-slate-400 text-[10px]">{unit.name}</div>
              </div>
            );
          })}
        </div>
      )}

      <h4 className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Нанять войска</h4>
      <div className="space-y-2">
        {UNITS.map((unit) => {
          const count = getCount(unit.id);
          const affordable = canAfford(unit, count);
          return (
            <div key={unit.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl">{unit.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold">{unit.name}</div>
                <div className="text-slate-400 text-[10px]">{unit.description}</div>
                <div className="flex gap-2 text-[10px] mt-1 flex-wrap">
                  {unit.cost.gold > 0 && <span className="text-yellow-400">💰{unit.cost.gold * count}</span>}
                  {unit.cost.food > 0 && <span className="text-green-400">🌾{unit.cost.food * count}</span>}
                  {unit.cost.iron > 0 && <span className="text-slate-300">⚙️{unit.cost.iron * count}</span>}
                  {unit.cost.energy > 0 && <span className="text-blue-400">⚡{unit.cost.energy * count}</span>}
                  <span className="text-orange-400">⚔️{unit.attack}</span>
                  <span className="text-cyan-400">🛡️{unit.defense}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCounts((c) => ({ ...c, [unit.id]: Math.max(1, getCount(unit.id) - 1) }))}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-bold transition-colors"
                >-</button>
                <span className="text-white text-sm w-5 text-center">{count}</span>
                <button
                  onClick={() => setCounts((c) => ({ ...c, [unit.id]: getCount(unit.id) + 1 }))}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm font-bold transition-colors"
                >+</button>
              </div>
              <button
                onClick={() => affordable && onTrain(unit, count)}
                disabled={!affordable}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  affordable
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                Нанять
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

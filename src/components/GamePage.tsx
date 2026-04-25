import { useState } from "react";
import { useGameState } from "./game/useGameState";
import { SHOP_ITEMS } from "./game/gameData";
import FactionSelect from "./game/FactionSelect";
import GameMap from "./game/GameMap";
import ResourceBar from "./game/ResourceBar";
import ArmyPanel from "./game/ArmyPanel";
import TerritoryPanel from "./game/TerritoryPanel";
import BattleLogPanel from "./game/BattleLog";
import GameShop from "./game/GameShop";
import VictoryScreen from "./game/VictoryScreen";

export default function GamePage() {
  const { state, selectFaction, endTurn, trainUnit, attack, selectTerritory, addResources, resetGame } = useGameState();
  const [showShop, setShowShop] = useState(false);

  if (state.phase === "select_faction") {
    return <FactionSelect onSelect={selectFaction} />;
  }

  if (state.phase === "victory" && state.player) {
    return (
      <VictoryScreen
        score={state.player.score}
        factionName={state.player.faction.name}
        factionEmoji={state.player.faction.emoji}
        turn={state.turn}
        onRestart={resetGame}
      />
    );
  }

  if (!state.player) return null;

  const selectedTerritory = state.selectedTerritory
    ? state.territories.find((t) => t.id === state.selectedTerritory) || null
    : null;

  const handlePurchase = (item: typeof SHOP_ITEMS[0]) => {
    if (item.resource === "gold") addResources({ gold: item.amount });
    else if (item.resource === "all") addResources({ gold: item.amount, food: item.amount, iron: item.amount, energy: item.amount });
    else if (item.resource === "unit") {
      // Dragon token — add dragon to army (via trainUnit mock with free cost)
      addResources({ gold: 500, food: 100, iron: 50, energy: 200 });
    } else if (item.resource === "territory") {
      addResources({ gold: 200 });
    }
    setShowShop(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="font-black text-sm bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          ⚔️ Эпоха Великих Держав
        </div>
        <button
          onClick={resetGame}
          className="text-slate-400 hover:text-white text-xs transition-colors"
        >
          ↩ Сменить фракцию
        </button>
      </div>

      <div className="container mx-auto px-3 py-4 max-w-6xl space-y-4">
        {/* Resource bar */}
        <ResourceBar
          resources={state.player.resources}
          turn={state.turn}
          score={state.player.score}
          factionEmoji={state.player.faction.emoji}
          factionName={state.player.faction.name}
          onEndTurn={endTurn}
          onShop={() => setShowShop(true)}
        />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map — takes 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <GameMap
              territories={state.territories}
              selectedId={state.selectedTerritory}
              playerTerritories={state.player.territories}
              onSelect={(id) => selectTerritory(state.selectedTerritory === id ? null : id)}
            />

            {/* Territory panel */}
            {selectedTerritory && (
              <TerritoryPanel
                territory={selectedTerritory}
                army={state.player.army}
                onAttack={attack}
                onClose={() => selectTerritory(null)}
              />
            )}

            {!selectedTerritory && (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-slate-400 text-sm">
                  Нажмите на территорию на карте, чтобы атаковать или посмотреть информацию
                </p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            <BattleLogPanel log={state.battleLog} />
            <ArmyPanel
              army={state.player.army}
              resources={state.player.resources}
              onTrain={trainUnit}
            />
          </div>
        </div>
      </div>

      {showShop && (
        <GameShop
          onClose={() => setShowShop(false)}
          onPurchase={handlePurchase}
          playerResources={state.player.resources}
        />
      )}
    </div>
  );
}
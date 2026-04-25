import { useState, useCallback } from "react";
import { FACTIONS, TERRITORIES, UNITS, type Resources, type Territory, type Faction, type Unit } from "./gameData";

export type GamePhase = "select_faction" | "playing" | "battle" | "victory";

export type ArmyUnit = {
  unitId: string;
  count: number;
};

export type PlayerState = {
  faction: Faction;
  resources: Resources;
  army: ArmyUnit[];
  territories: string[];
  turn: number;
  score: number;
};

export type BattleLog = {
  turn: number;
  message: string;
  type: "attack" | "defense" | "info" | "win" | "lose";
};

export type GameState = {
  phase: GamePhase;
  player: PlayerState | null;
  territories: Territory[];
  turn: number;
  battleLog: BattleLog[];
  selectedTerritory: string | null;
};

const initialTerritories = (): Territory[] =>
  TERRITORIES.map((t, i) => ({
    ...t,
    owner: i === 0 ? "player" : i < 3 ? `enemy_${i}` : null,
    troops: i === 0 ? 10 : i < 3 ? Math.floor(Math.random() * 15) + 5 : 0,
  }));

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: "select_faction",
    player: null,
    territories: initialTerritories(),
    turn: 1,
    battleLog: [],
    selectedTerritory: null,
  });

  const selectFaction = useCallback((faction: Faction) => {
    setState((s) => ({
      ...s,
      phase: "playing",
      player: {
        faction,
        resources: { ...faction.startResources },
        army: [{ unitId: "warrior", count: 5 }],
        territories: ["t1"],
        turn: 1,
        score: 0,
      },
      battleLog: [
        { turn: 1, message: `Вы выбрали фракцию «${faction.name}». Ваш путь к власти начинается!`, type: "info" },
      ],
    }));
  }, []);

  const endTurn = useCallback(() => {
    setState((s) => {
      if (!s.player) return s;
      const newRes = { ...s.player.resources };
      s.territories.forEach((t) => {
        if (t.owner === "player") {
          newRes[t.resource] = Math.min(9999, newRes[t.resource] + t.resourceAmount);
        }
      });
      // Enemy AI: random attack on adjacent territory
      const newTerritories = [...s.territories];
      const enemyTerr = newTerritories.filter((t) => t.owner?.startsWith("enemy"));
      const freeTerr = newTerritories.filter((t) => !t.owner);
      if (freeTerr.length > 0 && enemyTerr.length > 0 && Math.random() > 0.5) {
        const target = freeTerr[Math.floor(Math.random() * freeTerr.length)];
        const idx = newTerritories.findIndex((t) => t.id === target.id);
        newTerritories[idx] = { ...target, owner: "enemy_1", troops: Math.floor(Math.random() * 10) + 3 };
      }
      const newLog: BattleLog = {
        turn: s.turn + 1,
        message: `Ход ${s.turn + 1}: Собраны ресурсы с ваших территорий.`,
        type: "info",
      };
      return {
        ...s,
        turn: s.turn + 1,
        player: {
          ...s.player,
          resources: newRes,
          turn: s.player.turn + 1,
          score: s.player.score + s.player.territories.length * 10,
        },
        territories: newTerritories,
        battleLog: [newLog, ...s.battleLog].slice(0, 20),
      };
    });
  }, []);

  const trainUnit = useCallback((unit: Unit, count: number) => {
    setState((s) => {
      if (!s.player) return s;
      const totalCost: Resources = {
        gold: unit.cost.gold * count,
        food: unit.cost.food * count,
        iron: unit.cost.iron * count,
        energy: unit.cost.energy * count,
      };
      const r = s.player.resources;
      if (r.gold < totalCost.gold || r.food < totalCost.food || r.iron < totalCost.iron || r.energy < totalCost.energy) {
        return s;
      }
      const newArmy = [...s.player.army];
      const idx = newArmy.findIndex((a) => a.unitId === unit.id);
      if (idx >= 0) newArmy[idx] = { ...newArmy[idx], count: newArmy[idx].count + count };
      else newArmy.push({ unitId: unit.id, count });
      const log: BattleLog = { turn: s.turn, message: `Обучено ${count}x ${unit.name} ${unit.emoji}`, type: "info" };
      return {
        ...s,
        player: {
          ...s.player,
          resources: {
            gold: r.gold - totalCost.gold,
            food: r.food - totalCost.food,
            iron: r.iron - totalCost.iron,
            energy: r.energy - totalCost.energy,
          },
          army: newArmy,
        },
        battleLog: [log, ...s.battleLog].slice(0, 20),
      };
    });
  }, []);

  const attack = useCallback((territoryId: string) => {
    setState((s) => {
      if (!s.player) return s;
      const target = s.territories.find((t) => t.id === territoryId);
      if (!target || target.owner === "player") return s;

      const totalAttack = s.player.army.reduce((sum, a) => {
        const u = UNITS.find((u) => u.id === a.unitId);
        return sum + (u?.attack || 0) * a.count;
      }, 0);
      const defense = (target.troops || 1) * 8 + Math.floor(Math.random() * 20);
      const won = totalAttack > defense;

      const newTerritories = s.territories.map((t) =>
        t.id === territoryId
          ? { ...t, owner: won ? "player" : t.owner, troops: won ? Math.floor(totalAttack / 10) : Math.max(1, t.troops - 3) }
          : t
      );
      const newPlayerTerritories = won
        ? [...s.player.territories, territoryId]
        : s.player.territories;

      const log: BattleLog = {
        turn: s.turn,
        message: won
          ? `⚔️ Атака на «${target.name}» — ПОБЕДА! Территория захвачена.`
          : `💀 Атака на «${target.name}» — провалилась. Усилите армию.`,
        type: won ? "win" : "lose",
      };
      const allTerrOwned = newTerritories.filter((t) => t.owner === "player").length;
      const phase: GamePhase = allTerrOwned >= TERRITORIES.length ? "victory" : "playing";

      return {
        ...s,
        phase,
        territories: newTerritories,
        player: {
          ...s.player,
          territories: newPlayerTerritories,
          score: s.player.score + (won ? 50 : 0),
        },
        battleLog: [log, ...s.battleLog].slice(0, 20),
        selectedTerritory: null,
      };
    });
  }, []);

  const selectTerritory = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedTerritory: id }));
  }, []);

  const addResources = useCallback((resources: Partial<Resources>) => {
    setState((s) => {
      if (!s.player) return s;
      const r = s.player.resources;
      const log: BattleLog = { turn: s.turn, message: `🎁 Получены ресурсы из магазина!`, type: "info" };
      return {
        ...s,
        player: {
          ...s.player,
          resources: {
            gold: r.gold + (resources.gold || 0),
            food: r.food + (resources.food || 0),
            iron: r.iron + (resources.iron || 0),
            energy: r.energy + (resources.energy || 0),
          },
        },
        battleLog: [log, ...s.battleLog].slice(0, 20),
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({
      phase: "select_faction",
      player: null,
      territories: initialTerritories(),
      turn: 1,
      battleLog: [],
      selectedTerritory: null,
    });
  }, []);

  return { state, selectFaction, endTurn, trainUnit, attack, selectTerritory, addResources, resetGame };
}

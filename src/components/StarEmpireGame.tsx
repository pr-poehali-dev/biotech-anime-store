import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── ТИПЫ ───────────────────────────────────────────────────────────────────

type RaceId = "terrans" | "zephyrians" | "vorath" | "crystallids" | "necrons";
type BuildingId = "mine" | "solar" | "lab" | "shipyard" | "barracks" | "crystal_extractor" | "shield_gen" | "market";
type TechId = "plasma" | "shields" | "warp" | "nanobots" | "dark_matter" | "quantum";
type ShipId = "scout" | "fighter" | "cruiser" | "battleship" | "dreadnought";
type TabId = "colony" | "fleet" | "tech" | "battle" | "events";

interface Resources {
  metal: number;
  energy: number;
  crystals: number;
  population: number;
}

interface Building {
  id: BuildingId;
  name: string;
  icon: string;
  desc: string;
  level: number;
  maxLevel: number;
  cost: (lvl: number) => Partial<Resources>;
  production: (lvl: number) => Partial<Resources>;
}

interface Tech {
  id: TechId;
  name: string;
  icon: string;
  desc: string;
  researched: boolean;
  level: number;
  maxLevel: number;
  cost: Partial<Resources>;
  effect: string;
}

interface Ship {
  id: ShipId;
  name: string;
  icon: string;
  attack: number;
  defense: number;
  count: number;
  cost: Partial<Resources>;
}

interface GameEvent {
  id: number;
  text: string;
  type: "good" | "bad" | "neutral";
  reward?: Partial<Resources>;
}

interface Race {
  id: RaceId;
  name: string;
  icon: string;
  desc: string;
  bonus: string;
  color: string;
  bgGradient: string;
  resourceBonus: Partial<Resources>;
}

// ─── ДАННЫЕ ─────────────────────────────────────────────────────────────────

const RACES: Race[] = [
  {
    id: "terrans",
    name: "Терранцы",
    icon: "🌍",
    desc: "Потомки древней Земли, рассеянные по галактике. Универсальные воины и дипломаты.",
    bonus: "+20% к производству металла",
    color: "blue",
    bgGradient: "from-blue-900 via-blue-800 to-slate-900",
    resourceBonus: { metal: 20 },
  },
  {
    id: "zephyrians",
    name: "Зефирийцы",
    icon: "🌬️",
    desc: "Газообразные существа из туманностей. Мастера энергетических технологий.",
    bonus: "+30% к выработке энергии",
    color: "cyan",
    bgGradient: "from-cyan-900 via-teal-800 to-slate-900",
    resourceBonus: { energy: 30 },
  },
  {
    id: "vorath",
    name: "Воратх",
    icon: "🔥",
    desc: "Агрессивная раса из огненных миров. Непревзойдённые бойцы с мощным флотом.",
    bonus: "+25% к силе атаки флота",
    color: "red",
    bgGradient: "from-red-900 via-orange-800 to-slate-900",
    resourceBonus: { metal: 10 },
  },
  {
    id: "crystallids",
    name: "Кристаллиды",
    icon: "💎",
    desc: "Кремниевые существа из планет-кристаллов. Технологические гении.",
    bonus: "+40% к добыче кристаллов",
    color: "purple",
    bgGradient: "from-purple-900 via-violet-800 to-slate-900",
    resourceBonus: { crystals: 40 },
  },
  {
    id: "necrons",
    name: "Некроны",
    icon: "💀",
    desc: "Древние машины, пробудившиеся из вечного сна. Неуязвимы для обычного оружия.",
    bonus: "+35% к защите кораблей",
    color: "green",
    bgGradient: "from-emerald-900 via-green-800 to-slate-900",
    resourceBonus: { energy: 15, crystals: 15 },
  },
];

const BASE_BUILDINGS: Omit<Building, "level">[] = [
  {
    id: "mine",
    name: "Астероидная шахта",
    icon: "⛏️",
    desc: "Добывает металл из астероидного пояса",
    maxLevel: 10,
    cost: (l) => ({ metal: 100 * l, energy: 30 * l }),
    production: (l) => ({ metal: 15 * l }),
  },
  {
    id: "solar",
    name: "Солнечный реактор",
    icon: "☀️",
    desc: "Вырабатывает энергию из звёздного излучения",
    maxLevel: 10,
    cost: (l) => ({ metal: 80 * l, crystals: 20 * l }),
    production: (l) => ({ energy: 12 * l }),
  },
  {
    id: "lab",
    name: "Научная станция",
    icon: "🔬",
    desc: "Ускоряет исследование технологий",
    maxLevel: 8,
    cost: (l) => ({ metal: 150 * l, energy: 60 * l, crystals: 40 * l }),
    production: (l) => ({ crystals: 5 * l }),
  },
  {
    id: "shipyard",
    name: "Звёздная верфь",
    icon: "🚀",
    desc: "Строит боевые корабли",
    maxLevel: 8,
    cost: (l) => ({ metal: 200 * l, energy: 80 * l }),
    production: (l) => ({ metal: 5 * l }),
  },
  {
    id: "barracks",
    name: "Казармы пилотов",
    icon: "👨‍🚀",
    desc: "Обучает пилотов и солдат",
    maxLevel: 6,
    cost: (l) => ({ metal: 120 * l, energy: 40 * l }),
    production: (l) => ({ population: 3 * l }),
  },
  {
    id: "crystal_extractor",
    name: "Добытчик кристаллов",
    icon: "💎",
    desc: "Извлекает редкие кристаллы из мантии планеты",
    maxLevel: 8,
    cost: (l) => ({ metal: 180 * l, energy: 70 * l }),
    production: (l) => ({ crystals: 10 * l }),
  },
  {
    id: "shield_gen",
    name: "Планетарный щит",
    icon: "🛡️",
    desc: "Защищает колонию от орбитальных ударов",
    maxLevel: 5,
    cost: (l) => ({ metal: 300 * l, energy: 150 * l, crystals: 80 * l }),
    production: (l) => ({ energy: -5 * l }),
  },
  {
    id: "market",
    name: "Торговый хаб",
    icon: "🏪",
    desc: "Торгует с нейтральными цивилизациями",
    maxLevel: 5,
    cost: (l) => ({ metal: 100 * l, crystals: 50 * l }),
    production: (l) => ({ metal: 8 * l, crystals: 3 * l }),
  },
];

const BASE_TECHS: Omit<Tech, "researched" | "level">[] = [
  {
    id: "plasma",
    name: "Плазменное оружие",
    icon: "⚡",
    desc: "Высокотемпературные плазменные пушки",
    maxLevel: 3,
    cost: { crystals: 200, energy: 150 },
    effect: "+15% атака за уровень",
  },
  {
    id: "shields",
    name: "Силовые щиты",
    icon: "🔵",
    desc: "Энергетические барьеры для кораблей",
    maxLevel: 3,
    cost: { crystals: 180, energy: 200 },
    effect: "+15% защита за уровень",
  },
  {
    id: "warp",
    name: "Варп-двигатель",
    icon: "🌀",
    desc: "Прыжки через подпространство",
    maxLevel: 2,
    cost: { crystals: 350, metal: 200 },
    effect: "Разблокирует дальние миссии",
  },
  {
    id: "nanobots",
    name: "Нанороботы",
    icon: "🤖",
    desc: "Авторемонт кораблей в бою",
    maxLevel: 2,
    cost: { crystals: 300, energy: 100 },
    effect: "+10% регенерация HP",
  },
  {
    id: "dark_matter",
    name: "Тёмная материя",
    icon: "🌑",
    desc: "Использование тёмной материи как оружия",
    maxLevel: 1,
    cost: { crystals: 500, energy: 400, metal: 300 },
    effect: "+50% урон дредноутов",
  },
  {
    id: "quantum",
    name: "Квантовый компьютер",
    icon: "💻",
    desc: "Мгновенный анализ поля боя",
    maxLevel: 2,
    cost: { crystals: 250, metal: 150, energy: 120 },
    effect: "+20% производство всех ресурсов",
  },
];

const BASE_SHIPS: Omit<Ship, "count">[] = [
  { id: "scout",       name: "Разведчик",    icon: "🛸", attack: 5,   defense: 3,   cost: { metal: 50, energy: 20 } },
  { id: "fighter",     name: "Истребитель",  icon: "✈️", attack: 15,  defense: 10,  cost: { metal: 120, energy: 40 } },
  { id: "cruiser",     name: "Крейсер",      icon: "🚀", attack: 40,  defense: 30,  cost: { metal: 300, energy: 100, crystals: 50 } },
  { id: "battleship",  name: "Линкор",       icon: "⚔️", attack: 100, defense: 80,  cost: { metal: 600, energy: 200, crystals: 150 } },
  { id: "dreadnought", name: "Дредноут",     icon: "🌟", attack: 250, defense: 200, cost: { metal: 1200, energy: 400, crystals: 350 } },
];

const RANDOM_EVENTS: Omit<GameEvent, "id">[] = [
  { text: "Метеоритный дождь повредил шахты! Потеряно 50 металла.", type: "bad", reward: { metal: -50 } },
  { text: "Торговый конвой прибыл из дальней системы! +80 кристаллов.", type: "good", reward: { crystals: 80 } },
  { text: "Солнечная вспышка зарядила реакторы! +100 энергии.", type: "good", reward: { energy: 100 } },
  { text: "Пираты совершили набег на склады. Потеряно 60 металла и 30 энергии.", type: "bad", reward: { metal: -60, energy: -30 } },
  { text: "Открыт богатый астероид! +120 металла.", type: "good", reward: { metal: 120 } },
  { text: "Новые колонисты прибыли! +5 населения.", type: "good", reward: { population: 5 } },
  { text: "Вспышка болезни в колонии. -3 населения.", type: "bad", reward: { population: -3 } },
  { text: "Нейтральная цивилизация предложила торговлю. +40 кристаллов.", type: "good", reward: { crystals: 40 } },
  { text: "Космический шторм! Все реакторы работают в аварийном режиме. -50 энергии.", type: "bad", reward: { energy: -50 } },
  { text: "Учёные нашли артефакт! +100 кристаллов.", type: "good", reward: { crystals: 100 } },
];

const ENEMY_FLEETS = [
  { name: "Пираты Окраины",     icon: "🏴‍☠️", attack: 50,  defense: 30,  reward: { metal: 80,  crystals: 30  } },
  { name: "Рейдеры Туманности", icon: "👾",   attack: 120, defense: 90,  reward: { metal: 150, crystals: 80  } },
  { name: "Флот Изгнанников",   icon: "💀",   attack: 250, defense: 200, reward: { metal: 300, crystals: 150 } },
  { name: "Имперский Патруль",  icon: "🔱",   attack: 400, defense: 350, reward: { metal: 500, crystals: 250 } },
  { name: "Древний Страж",      icon: "🌑",   attack: 800, defense: 600, reward: { metal: 800, crystals: 400, energy: 300 } },
];

// ─── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ─────────────────────────────────────────────────

const canAfford = (res: Resources, cost: Partial<Resources>): boolean =>
  (res.metal >= (cost.metal ?? 0)) &&
  (res.energy >= (cost.energy ?? 0)) &&
  (res.crystals >= (cost.crystals ?? 0)) &&
  (res.population >= (cost.population ?? 0));

const subtract = (res: Resources, cost: Partial<Resources>): Resources => ({
  metal:      Math.max(0, res.metal      - (cost.metal      ?? 0)),
  energy:     Math.max(0, res.energy     - (cost.energy     ?? 0)),
  crystals:   Math.max(0, res.crystals   - (cost.crystals   ?? 0)),
  population: Math.max(0, res.population - (cost.population ?? 0)),
});

const add = (res: Resources, bonus: Partial<Resources>): Resources => ({
  metal:      Math.max(0, res.metal      + (bonus.metal      ?? 0)),
  energy:     Math.max(0, res.energy     + (bonus.energy     ?? 0)),
  crystals:   Math.max(0, res.crystals   + (bonus.crystals   ?? 0)),
  population: Math.max(0, res.population + (bonus.population ?? 0)),
});

const fmtCost = (cost: Partial<Resources>): string =>
  Object.entries(cost)
    .filter(([, v]) => v && v !== 0)
    .map(([k, v]) => `${v} ${k === "metal" ? "⛏️" : k === "energy" ? "⚡" : k === "crystals" ? "💎" : "👥"}`)
    .join(" ");

// ─── КОМПОНЕНТ ИГРЫ ───────────────────────────────────────────────────────────

export default function StarEmpireGame() {
  const [phase, setPhase] = useState<"intro" | "race" | "game">("intro");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [resources, setResources] = useState<Resources>({ metal: 500, energy: 300, crystals: 150, population: 10 });
  const [buildings, setBuildings] = useState<Building[]>(
    BASE_BUILDINGS.map((b) => ({ ...b, level: 0 }))
  );
  const [techs, setTechs] = useState<Tech[]>(
    BASE_TECHS.map((t) => ({ ...t, researched: false, level: 0 }))
  );
  const [ships, setShips] = useState<Ship[]>(
    BASE_SHIPS.map((s) => ({ ...s, count: 0 }))
  );
  const [activeTab, setActiveTab] = useState<TabId>("colony");
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [eventCounter, setEventCounter] = useState(0);
  const eventIdRef = useRef(0);

  // Тик — каждые 3 секунды
  useEffect(() => {
    if (phase !== "game") return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [phase]);

  // Производство ресурсов
  useEffect(() => {
    if (phase !== "game" || tick === 0) return;

    setResources((prev) => {
      let next = { ...prev };
      buildings.forEach((b) => {
        if (b.level > 0) {
          const prod = b.production(b.level);
          next = add(next, prod);
        }
      });

      // Бонус расы
      if (selectedRace) {
        const rb = selectedRace.resourceBonus;
        const bonus: Partial<Resources> = {};
        if (rb.metal)      bonus.metal      = Math.floor(rb.metal / 10);
        if (rb.energy)     bonus.energy     = Math.floor(rb.energy / 10);
        if (rb.crystals)   bonus.crystals   = Math.floor(rb.crystals / 10);
        if (rb.population) bonus.population = Math.floor(rb.population / 10);
        next = add(next, bonus);
      }

      // Бонус квантового компьютера
      const quantum = techs.find((t) => t.id === "quantum");
      if (quantum && quantum.level > 0) {
        const pct = quantum.level * 0.20;
        next.metal    = Math.floor(next.metal    * (1 + pct * 0.1));
        next.energy   = Math.floor(next.energy   * (1 + pct * 0.1));
        next.crystals = Math.floor(next.crystals * (1 + pct * 0.1));
      }

      return next;
    });

    // Случайное событие (10% шанс каждый тик)
    if (Math.random() < 0.1) {
      const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      const newEvent: GameEvent = { ...ev, id: ++eventIdRef.current };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setEventCounter((c) => c + 1);
      if (ev.reward) setResources((prev) => add(prev, ev.reward!));
    }

    setScore((s) => s + 1);
  }, [tick]);

  const upgradeBuilding = useCallback((bId: BuildingId) => {
    setBuildings((prev) => {
      const b = prev.find((x) => x.id === bId)!;
      if (b.level >= b.maxLevel) return prev;
      const cost = b.cost(b.level + 1);
      if (!canAfford(resources, cost)) return prev;
      setResources((r) => subtract(r, cost));
      return prev.map((x) => x.id === bId ? { ...x, level: x.level + 1 } : x);
    });
  }, [resources]);

  const researchTech = useCallback((tId: TechId) => {
    setTechs((prev) => {
      const t = prev.find((x) => x.id === tId)!;
      if (t.level >= t.maxLevel) return prev;
      const cost = { ...t.cost };
      if (t.level > 0) {
        Object.keys(cost).forEach((k) => {
          (cost as Record<string, number>)[k] = Math.floor((cost as Record<string, number>)[k] * 1.8);
        });
      }
      if (!canAfford(resources, cost)) return prev;
      setResources((r) => subtract(r, cost));
      return prev.map((x) => x.id === tId ? { ...x, level: x.level + 1, researched: true } : x);
    });
  }, [resources]);

  const buildShip = useCallback((sId: ShipId) => {
    const ship = ships.find((s) => s.id === sId)!;
    if (!canAfford(resources, ship.cost)) return;
    setResources((r) => subtract(r, ship.cost));
    setShips((prev) => prev.map((s) => s.id === sId ? { ...s, count: s.count + 1 } : s));
    setScore((sc) => sc + 5);
  }, [resources, ships]);

  const doBattle = useCallback((enemyIdx: number) => {
    const enemy = ENEMY_FLEETS[enemyIdx];
    const totalAttack  = ships.reduce((sum, s) => sum + s.attack  * s.count, 0);
    const totalDefense = ships.reduce((sum, s) => sum + s.defense * s.count, 0);

    const plasmaTech = techs.find((t) => t.id === "plasma");
    const shieldTech = techs.find((t) => t.id === "shields");
    const darkMatter = techs.find((t) => t.id === "dark_matter");
    const nanoTech   = techs.find((t) => t.id === "nanobots");

    let myAttack  = totalAttack;
    let myDefense = totalDefense;

    if (plasmaTech && plasmaTech.level > 0) myAttack  *= (1 + plasmaTech.level * 0.15);
    if (shieldTech && shieldTech.level > 0) myDefense *= (1 + shieldTech.level * 0.15);
    if (darkMatter && darkMatter.level > 0) myAttack  *= 1.5;
    if (nanoTech   && nanoTech.level > 0)   myDefense *= (1 + nanoTech.level * 0.10);

    if (selectedRace?.id === "vorath") myAttack  *= 1.25;
    if (selectedRace?.id === "necrons") myDefense *= 1.35;

    const log: string[] = [];
    log.push(`⚔️ Начало сражения с «${enemy.name}»!`);
    log.push(`Ваши силы — Атака: ${Math.floor(myAttack)}, Защита: ${Math.floor(myDefense)}`);
    log.push(`Противник — Атака: ${enemy.attack}, Защита: ${enemy.defense}`);

    const playerScore = myAttack * 0.6 + myDefense * 0.4;
    const enemyScore  = enemy.attack * 0.6 + enemy.defense * 0.4;
    const roll = Math.random() * 0.4 - 0.2;
    const win  = (playerScore + playerScore * roll) > enemyScore;

    if (win) {
      log.push("✅ ПОБЕДА! Вы разгромили противника!");
      log.push(`Получено: ${fmtCost(enemy.reward)}`);
      setResources((r) => add(r, enemy.reward));
      setScore((s) => s + 50 + enemyIdx * 30);
      const newEvent: GameEvent = {
        id: ++eventIdRef.current,
        text: `Победа над «${enemy.name}»! Получено ${fmtCost(enemy.reward)}`,
        type: "good",
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    } else {
      log.push("❌ ПОРАЖЕНИЕ! Ваш флот отступил.");
      const loss = Math.floor(ships.reduce((s, sh) => s + sh.count, 0) * 0.3);
      log.push(`Потеряно кораблей: ~${loss} единиц.`);
      setShips((prev) => prev.map((s) => ({ ...s, count: Math.max(0, Math.floor(s.count * 0.7)) })));
      const newEvent: GameEvent = {
        id: ++eventIdRef.current,
        text: `Поражение от «${enemy.name}». Флот понёс потери.`,
        type: "bad",
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    }

    setBattleLog(log);
  }, [ships, techs, selectedRace]);

  const startGame = (race: Race) => {
    setSelectedRace(race);
    setResources({
      metal:      500 + (race.resourceBonus.metal      ?? 0),
      energy:     300 + (race.resourceBonus.energy     ?? 0),
      crystals:   150 + (race.resourceBonus.crystals   ?? 0),
      population:  10 + (race.resourceBonus.population ?? 0),
    });
    setPhase("game");
  };

  const totalFleetPower = ships.reduce((s, sh) => s + (sh.attack + sh.defense) * sh.count, 0);

  // ── ЭКРАН ПРИВЕТСТВИЯ ────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center animate-fade-in">
          <div className="text-8xl mb-6">🌌</div>
          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Звёздная Федерация
          </h1>
          <p className="text-slate-400 text-lg mb-2">Космическая стратегия в реальном времени</p>
          <div className="flex flex-wrap justify-center gap-3 my-8 text-sm text-slate-400">
            {["5 уникальных рас", "8 зданий", "6 технологий", "5 типов кораблей", "Боевая система"].map((f) => (
              <span key={f} className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">{f}</span>
            ))}
          </div>
          <button
            onClick={() => setPhase("race")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl px-12 py-4 rounded-2xl transition-all hover:scale-105 shadow-2xl"
          >
            🚀 Начать игру
          </button>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-2xl mb-1">🏗️</div>
              <div className="text-xs text-slate-400">Стройте колонию, добывайте ресурсы</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-2xl mb-1">🔬</div>
              <div className="text-xs text-slate-400">Исследуйте технологии будущего</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="text-2xl mb-1">⚔️</div>
              <div className="text-xs text-slate-400">Создавайте флот и побеждайте врагов</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ВЫБОР РАСЫ ───────────────────────────────────────────────────────────────
  if (phase === "race") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">Выберите расу</h2>
            <p className="text-slate-400">Каждая раса имеет уникальные бонусы и стиль игры</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RACES.map((race) => (
              <button
                key={race.id}
                onClick={() => startGame(race)}
                className={`bg-gradient-to-br ${race.bgGradient} border border-white/10 rounded-2xl p-6 text-left hover:border-white/30 hover:scale-[1.02] transition-all group`}
              >
                <div className="text-5xl mb-3">{race.icon}</div>
                <div className="font-black text-xl mb-1">{race.name}</div>
                <div className="text-sm text-white/70 mb-3 leading-relaxed">{race.desc}</div>
                <div className="bg-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-yellow-300">
                  ⭐ {race.bonus}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-6">
            <button onClick={() => setPhase("intro")} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              ← Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ОСНОВНАЯ ИГРА ────────────────────────────────────────────────────────────
  const race = selectedRace!;
  const tabs: { id: TabId; label: string; icon: string; badge?: number }[] = [
    { id: "colony",  label: "Колония", icon: "🏗️" },
    { id: "fleet",   label: "Флот",    icon: "🚀" },
    { id: "tech",    label: "Наука",   icon: "🔬" },
    { id: "battle",  label: "Битвы",   icon: "⚔️" },
    { id: "events",  label: "События", icon: "📡", badge: eventCounter > 0 ? eventCounter : undefined },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${race.bgGradient} text-white`}>
      {/* HEADER */}
      <div className="bg-black/40 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{race.icon}</span>
              <div>
                <div className="font-black text-lg leading-none">{race.name}</div>
                <div className="text-xs text-white/50">Звёздная Федерация · Тик #{tick}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50">Рейтинг</div>
              <div className="font-black text-yellow-400">⭐ {score}</div>
            </div>
          </div>

          {/* Ресурсы */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "⛏️", label: "Металл",    value: resources.metal      },
              { icon: "⚡", label: "Энергия",   value: resources.energy     },
              { icon: "💎", label: "Кристаллы", value: resources.crystals   },
              { icon: "👥", label: "Население", value: resources.population },
            ].map((r) => (
              <div key={r.label} className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <div className="text-lg">{r.icon}</div>
                <div className="font-black text-sm">{r.value}</div>
                <div className="text-[10px] text-white/50">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-black/20 border-b border-white/10 px-4">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto py-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); if (t.id === "events") setEventCounter(0); }}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">

        {/* ── КОЛОНИЯ ── */}
        {activeTab === "colony" && (
          <div className="space-y-3">
            <h3 className="font-black text-xl mb-4">🏗️ Управление колонией</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buildings.map((b) => {
                const nextCost = b.level < b.maxLevel ? b.cost(b.level + 1) : null;
                const affordable = nextCost ? canAfford(resources, nextCost) : false;
                const maxed = b.level >= b.maxLevel;
                const prod = b.level > 0 ? b.production(b.level) : null;

                return (
                  <div key={b.id} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{b.icon}</span>
                        <div>
                          <div className="font-bold text-sm">{b.name}</div>
                          <div className="text-xs text-white/50">{b.desc}</div>
                          {prod && (
                            <div className="text-xs text-green-400 mt-1">
                              +{fmtCost(prod)}/тик
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-white/50 mb-1">Уровень</div>
                        <div className="font-black text-lg text-yellow-400">{b.level}<span className="text-white/30 text-sm">/{b.maxLevel}</span></div>
                      </div>
                    </div>

                    {/* Полоска уровня */}
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all"
                        style={{ width: `${(b.level / b.maxLevel) * 100}%` }}
                      />
                    </div>

                    {maxed ? (
                      <div className="text-center text-xs text-yellow-400 font-semibold py-1">✅ Максимальный уровень</div>
                    ) : (
                      <button
                        onClick={() => upgradeBuilding(b.id)}
                        disabled={!affordable}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          affordable
                            ? "bg-blue-500 hover:bg-blue-400 text-white"
                            : "bg-white/5 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        Улучшить → {nextCost ? fmtCost(nextCost) : ""}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ФЛОТ ── */}
        {activeTab === "fleet" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-xl">🚀 Звёздный флот</h3>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-sm">
                Боевая мощь: <span className="font-black text-yellow-400">{totalFleetPower}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ships.map((s) => (
                <div key={s.id} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-4xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold">{s.name}</div>
                      <div className="flex gap-3 text-xs text-white/60 mt-1">
                        <span>⚔️ Атака: {s.attack}</span>
                        <span>🛡️ Защита: {s.defense}</span>
                      </div>
                      <div className="text-xs text-white/40 mt-1">Стоимость: {fmtCost(s.cost)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">В строю</div>
                      <div className="font-black text-2xl text-cyan-400">{s.count}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buildShip(s.id)}
                    disabled={!canAfford(resources, s.cost)}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                      canAfford(resources, s.cost)
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                        : "bg-white/5 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    🔨 Построить корабль
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ТЕХНОЛОГИИ ── */}
        {activeTab === "tech" && (
          <div className="space-y-3">
            <h3 className="font-black text-xl mb-4">🔬 Исследования</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techs.map((t) => {
                const cost = t.level === 0
                  ? t.cost
                  : Object.fromEntries(Object.entries(t.cost).map(([k, v]) => [k, Math.floor((v as number) * 1.8)]));
                const affordable = t.level < t.maxLevel && canAfford(resources, cost);
                const maxed = t.level >= t.maxLevel;

                return (
                  <div key={t.id} className={`bg-white/10 rounded-2xl p-4 border transition-all ${t.researched ? "border-purple-400/40" : "border-white/10"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm">{t.name}</div>
                          {t.researched && <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">Изучено</span>}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">{t.desc}</div>
                        <div className="text-xs text-green-400 mt-1">✨ {t.effect}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-white/50">Ур.</div>
                        <div className="font-black text-lg text-purple-400">{t.level}<span className="text-white/30 text-sm">/{t.maxLevel}</span></div>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${(t.level / t.maxLevel) * 100}%` }}
                      />
                    </div>

                    {maxed ? (
                      <div className="text-center text-xs text-purple-400 font-semibold py-1">✅ Полностью исследовано</div>
                    ) : (
                      <button
                        onClick={() => researchTech(t.id)}
                        disabled={!affordable}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          affordable
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-white/5 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        🔬 Исследовать → {fmtCost(cost)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── БИТВЫ ── */}
        {activeTab === "battle" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-xl">⚔️ Боевые операции</h3>
              <div className="text-xs text-white/50">Мощь флота: <span className="text-yellow-400 font-bold">{totalFleetPower}</span></div>
            </div>

            {totalFleetPower === 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-center text-sm text-red-300">
                ⚠️ Ваш флот пуст! Постройте корабли во вкладке «Флот»
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENEMY_FLEETS.map((enemy, idx) => {
                const canFight = totalFleetPower > 0;
                const strength = enemy.attack + enemy.defense;
                const ratio = Math.min(1, totalFleetPower / strength);
                const winChance = Math.floor(ratio * 100);

                return (
                  <div key={idx} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-4xl">{enemy.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold">{enemy.name}</div>
                        <div className="flex gap-3 text-xs text-white/60 mt-1">
                          <span>⚔️ {enemy.attack}</span>
                          <span>🛡️ {enemy.defense}</span>
                        </div>
                        <div className="text-xs text-yellow-400 mt-1">Награда: {fmtCost(enemy.reward)}</div>
                      </div>
                    </div>

                    {/* Шанс победы */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/50">Шанс победы</span>
                        <span className={winChance >= 60 ? "text-green-400" : winChance >= 40 ? "text-yellow-400" : "text-red-400"}>
                          ~{winChance}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${winChance >= 60 ? "bg-green-500" : winChance >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${winChance}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => doBattle(idx)}
                      disabled={!canFight}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                        canFight
                          ? "bg-red-600 hover:bg-red-500 text-white"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      ⚔️ Атаковать
                    </button>
                  </div>
                );
              })}
            </div>

            {battleLog.length > 0 && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/10 mt-4">
                <div className="font-bold mb-3 text-sm">📋 Журнал сражения</div>
                <div className="space-y-1">
                  {battleLog.map((line, i) => (
                    <div key={i} className={`text-sm ${line.startsWith("✅") ? "text-green-400" : line.startsWith("❌") ? "text-red-400" : "text-white/70"}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── СОБЫТИЯ ── */}
        {activeTab === "events" && (
          <div>
            <h3 className="font-black text-xl mb-4">📡 Галактические события</h3>
            {events.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <div className="text-4xl mb-3">📡</div>
                <div>Пока тихо в секторе...</div>
                <div className="text-xs mt-1">События появляются по мере развития колонии</div>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`rounded-xl p-3 border text-sm ${
                      ev.type === "good"
                        ? "bg-green-500/10 border-green-500/30 text-green-300"
                        : ev.type === "bad"
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : "bg-white/5 border-white/10 text-white/70"
                    }`}
                  >
                    {ev.type === "good" ? "✅" : ev.type === "bad" ? "⚠️" : "ℹ️"} {ev.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="bg-black/30 border-t border-white/10 text-center py-3 text-xs text-white/30 mt-4">
        Звёздная Федерация · МТМ Маркет · Тик обновляется каждые 3 сек
      </div>
    </div>
  );
}

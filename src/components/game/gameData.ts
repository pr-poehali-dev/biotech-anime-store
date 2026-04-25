export type Faction = {
  id: string;
  name: string;
  description: string;
  color: string;
  bgGradient: string;
  emoji: string;
  bonuses: string[];
  startResources: Resources;
};

export type Resources = {
  gold: number;
  food: number;
  iron: number;
  energy: number;
};

export type Unit = {
  id: string;
  name: string;
  emoji: string;
  attack: number;
  defense: number;
  cost: Resources;
  description: string;
};

export type Territory = {
  id: string;
  name: string;
  x: number;
  y: number;
  owner: string | null;
  troops: number;
  resource: keyof Resources;
  resourceAmount: number;
  emoji: string;
};

export type Building = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: Resources;
  produces: Partial<Resources>;
  level: number;
};

export const FACTIONS: Faction[] = [
  {
    id: "iron_throne",
    name: "Железный Трон",
    description: "Древний дом со стальной армией. Правит огнём и мечом.",
    color: "#b91c1c",
    bgGradient: "from-red-900 via-red-800 to-stone-900",
    emoji: "⚔️",
    bonuses: ["Атака войск +20%", "Добыча железа +30%", "Стены крепости прочнее"],
    startResources: { gold: 500, food: 300, iron: 400, energy: 100 },
  },
  {
    id: "star_federation",
    name: "Звёздная Федерация",
    description: "Технологическая империя из глубин космоса. Наука — их оружие.",
    color: "#1d4ed8",
    bgGradient: "from-blue-900 via-indigo-800 to-slate-900",
    emoji: "🚀",
    bonuses: ["Энергия +50%", "Исследования быстрее", "Космические войска"],
    startResources: { gold: 400, food: 200, iron: 200, energy: 500 },
  },
  {
    id: "shadow_guild",
    name: "Теневая Гильдия",
    description: "Мастера шпионажа и торговли. Золото решает всё.",
    color: "#7c3aed",
    bgGradient: "from-purple-900 via-violet-800 to-slate-900",
    emoji: "🗡️",
    bonuses: ["Доход золота +40%", "Шпионаж", "Скрытые атаки"],
    startResources: { gold: 800, food: 250, iron: 150, energy: 200 },
  },
  {
    id: "forest_alliance",
    name: "Лесной Альянс",
    description: "Древние народы леса. Природа — их крепость.",
    color: "#15803d",
    bgGradient: "from-green-900 via-emerald-800 to-stone-900",
    emoji: "🌲",
    bonuses: ["Еда +50%", "Быстрое восстановление", "Лучники +30% урон"],
    startResources: { gold: 300, food: 600, iron: 200, energy: 150 },
  },
];

export const UNITS: Unit[] = [
  {
    id: "warrior",
    name: "Воин",
    emoji: "🗡️",
    attack: 10,
    defense: 8,
    cost: { gold: 50, food: 20, iron: 10, energy: 0 },
    description: "Базовый боец. Дёшев и надёжен.",
  },
  {
    id: "archer",
    name: "Лучник",
    emoji: "🏹",
    attack: 15,
    defense: 5,
    cost: { gold: 70, food: 25, iron: 5, energy: 0 },
    description: "Высокая атака, слабая защита.",
  },
  {
    id: "knight",
    name: "Рыцарь",
    emoji: "🛡️",
    attack: 18,
    defense: 20,
    cost: { gold: 150, food: 30, iron: 40, energy: 0 },
    description: "Тяжёлая броня, элитный воин.",
  },
  {
    id: "starship",
    name: "Звездолёт",
    emoji: "🛸",
    attack: 30,
    defense: 25,
    cost: { gold: 300, food: 0, iron: 100, energy: 150 },
    description: "Космическое оружие Федерации.",
  },
  {
    id: "dragon",
    name: "Дракон",
    emoji: "🐉",
    attack: 50,
    defense: 40,
    cost: { gold: 500, food: 100, iron: 50, energy: 200 },
    description: "Легендарное существо. Сметает врагов.",
  },
];

export const TERRITORIES: Territory[] = [
  { id: "t1", name: "Королевская гавань", x: 20, y: 30, owner: null, troops: 0, resource: "gold", resourceAmount: 80, emoji: "🏰" },
  { id: "t2", name: "Лихтерфельде", x: 45, y: 20, owner: null, troops: 0, resource: "iron", resourceAmount: 60, emoji: "⛏️" },
  { id: "t3", name: "Северный форт", x: 70, y: 15, owner: null, troops: 0, resource: "food", resourceAmount: 70, emoji: "🌾" },
  { id: "t4", name: "Звёздный порт", x: 80, y: 45, owner: null, troops: 0, resource: "energy", resourceAmount: 90, emoji: "⚡" },
  { id: "t5", name: "Тёмный лес", x: 60, y: 65, owner: null, troops: 0, resource: "food", resourceAmount: 85, emoji: "🌲" },
  { id: "t6", name: "Руины Древних", x: 35, y: 55, owner: null, troops: 0, resource: "gold", resourceAmount: 100, emoji: "🏛️" },
  { id: "t7", name: "Железные горы", x: 15, y: 65, owner: null, troops: 0, resource: "iron", resourceAmount: 95, emoji: "⛰️" },
  { id: "t8", name: "Пустошь Огня", x: 50, y: 80, owner: null, troops: 0, resource: "energy", resourceAmount: 75, emoji: "🔥" },
  { id: "t9", name: "Орбита Икс", x: 85, y: 75, owner: null, troops: 0, resource: "energy", resourceAmount: 110, emoji: "🌌" },
];

export const SHOP_ITEMS = [
  { id: "gold_pack_s", name: "Мешок золота", emoji: "💰", amount: 1000, resource: "gold", price: 99, description: "1000 единиц золота" },
  { id: "gold_pack_m", name: "Сундук золота", emoji: "🏆", amount: 5000, resource: "gold", price: 399, description: "5000 единиц золота — выгода 20%" },
  { id: "gold_pack_l", name: "Королевская казна", emoji: "👑", amount: 15000, resource: "gold", price: 999, description: "15000 золота — выгода 33%" },
  { id: "resources_pack", name: "Набор ресурсов", emoji: "🎒", amount: 2000, resource: "all", price: 299, description: "2000 каждого ресурса" },
  { id: "dragon_token", name: "Жетон дракона", emoji: "🐉", amount: 1, resource: "unit", price: 499, description: "Мгновенно получить дракона" },
  { id: "territory_claim", name: "Флаг завоевателя", emoji: "🚩", amount: 1, resource: "territory", price: 199, description: "Захватить любую территорию мгновенно" },
];

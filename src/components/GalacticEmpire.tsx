import { useState, useEffect, useRef, useCallback } from "react";

// ─── API URLs ─────────────────────────────────────────────────────────────────
const API = {
  auth:    "https://functions.poehali.dev/d299b187-7949-45d0-b594-2578e2b6c399",
  game:    "https://functions.poehali.dev/14999aad-e665-4e7b-b72f-1213f45c0727",
  battle:  "https://functions.poehali.dev/da4e2351-b1f6-48ab-b9cc-694b8f8b5ad3",
  social:  "https://functions.poehali.dev/d3d9291d-49a7-490b-be7a-4a150fc6daad",
  shop:    "https://functions.poehali.dev/ae459e25-d759-47c3-890f-ad263c5d7871",
  quests:  "https://functions.poehali.dev/f27f29e2-e51e-4ed2-8058-441439fa55e4",
  pirates: "https://functions.poehali.dev/8d35835b-a30e-4b34-a815-287ce19569a9",
  station: "https://functions.poehali.dev/fe75129b-929c-4fc0-9d1b-ad45707f5526",
};

// ─── РАСЫ (заменены на оригинальные для игры) ─────────────────────────────────
const RACES = {
  solarians:   { name: "Соляриане",    icon: "☀️", color: "#f59e0b", desc: "Дети звёзд. Мастера энергии и торговли.",           bonus: "Энергия ×2, торговые маршруты +50%",       bg: "from-amber-900 via-yellow-800 to-slate-950"  },
  voidstalkers:{ name: "Пожиратели Пустоты", icon: "🌑", color: "#8b5cf6", desc: "Существа из межзвёздной тьмы. Боевые мастера.", bonus: "Атака флота ×1.5, скрытность +100%",      bg: "from-violet-900 via-purple-800 to-slate-950" },
  ironborn:    { name: "Железнорождённые", icon: "⚙️", color: "#6b7280", desc: "Кибернетическая раса. Добыча и строительство.",  bonus: "Металл ×2.5, строительство -30% времени", bg: "from-slate-800 via-zinc-700 to-slate-950"    },
  arboreals:   { name: "Арборейцы",    icon: "🌿", color: "#10b981", desc: "Живые деревья-космолёты. Регенерация и рост.",       bonus: "Население ×2, здания регенерируют HP",    bg: "from-emerald-900 via-green-800 to-slate-950" },
  deepones:    { name: "Глубинники",   icon: "🐙", color: "#06b6d4", desc: "Разум из глубин океанов. Телепатия и шпионаж.",     bonus: "Шпионаж ×3, все технологии -20% стоимость",bg: "from-cyan-900 via-teal-800 to-slate-950"     },
  wraithkin:   { name: "Призрачники",  icon: "👻", color: "#f9fafb", desc: "Полупрозрачные сущности. Нематериальный флот.",      bonus: "Защита ×1.8, уклонение +40%",             bg: "from-gray-800 via-slate-700 to-slate-950"    },
  psionic:     { name: "Псионики",     icon: "🔮", color: "#ec4899", desc: "Телепаты и предсказатели. Власть над разумом.",      bonus: "Тёмная материя ×3, все технологии сильнее",bg: "from-pink-900 via-rose-800 to-slate-950"     },
  hiveborn:    { name: "Роевые",       icon: "🐝", color: "#eab308", desc: "Единый разум миллиардов существ. Численность.",      bonus: "Флот стоит -40%, лимит флота ×2",         bg: "from-yellow-900 via-lime-800 to-slate-950"   },
  titanforge:  { name: "Титаноковы",   icon: "🔥", color: "#ef4444", desc: "Расплавленные существа из ядра планеты. Мощь.",     bonus: "Производство всего ×1.3, Титаны ×2 силы", bg: "from-red-900 via-orange-800 to-slate-950"    },
};

type RaceId = keyof typeof RACES;
type TabId = "galaxy"|"colony"|"fleet"|"tech"|"battle"|"chat"|"alliance"|"diplomacy"|"trade"|"ranking"|"shop"|"quests";

// ─── ГАЛАКТИКИ РАС (секторы на карте) ─────────────────────────────────────────
const SECTOR_STYLES: Record<string,{color:string;label:string;icon:string}> = {
  core:         { color:"#a78bfa", label:"Ядро ИИ",          icon:"🤖" },
  solarians:    { color:"#f59e0b", label:"Галактика Солярин", icon:"☀️" },
  voidstalkers: { color:"#8b5cf6", label:"Тёмная Бездна",    icon:"🌑" },
  ironborn:     { color:"#6b7280", label:"Кузница Железа",   icon:"⚙️" },
  arboreals:    { color:"#10b981", label:"Лесной Мир",       icon:"🌿" },
  deepones:     { color:"#06b6d4", label:"Глубины Океана",   icon:"🐙" },
  wraithkin:    { color:"#f1f5f9", label:"Призрачная Мгла",  icon:"👻" },
  psionic:      { color:"#ec4899", label:"Разум Пустоты",    icon:"🔮" },
  hiveborn:     { color:"#eab308", label:"Рой Улья",         icon:"🐝" },
  titanforge:   { color:"#ef4444", label:"Ядро Титанов",     icon:"🔥" },
  alpha:        { color:"#60a5fa", label:"Сектор Альфа",     icon:"⭐" },
  beta:         { color:"#34d399", label:"Сектор Бета",      icon:"⭐" },
  gamma:        { color:"#fb923c", label:"Сектор Гамма",     icon:"⭐" },
};

// ─── ДОБЫВАЮЩИЕ КОРАБЛИ ───────────────────────────────────────────────────────
const MINING_SHIPS: Record<string,{name:string;icon:string;desc:string;mines:string}> = {
  miner:     { name:"Шахтёр",   icon:"⛏️", desc:"Добывает металл с планет",   mines:"metal"    },
  drill:     { name:"Бур",      icon:"🔩", desc:"Добывает кристаллы из недр", mines:"crystals" },
  harvester: { name:"Харвестер",icon:"🌾", desc:"Собирает энергию из звёзд",  mines:"energy"   },
};

// ─── МАГАЗИН ПАКЕТЫ ───────────────────────────────────────────────────────────
interface ShopPackage { id:string; name:string; price_rub:number; icon:string; desc:string; rewards:Record<string,number>; bonus_score:number; }
interface DiplomacyRel { id:number; from_id:number; to_id:number; type:string; message:string; from_nick:string; to_nick:string; date:string; }

// ─── ЗДАНИЯ ───────────────────────────────────────────────────────────────────
const BUILDINGS: Record<string,{name:string;icon:string;maxLvl:number;desc:string}> = {
  mine:           { name:"Шахта металла",       icon:"⛏️", maxLvl:15, desc:"Добыча металла +15% за уровень" },
  solar:          { name:"Солнечный реактор",   icon:"☀️", maxLvl:15, desc:"Выработка энергии +15%/ур." },
  lab:            { name:"Исследовательская лаб",icon:"🔬",maxLvl:10, desc:"Ускоряет исследования" },
  shipyard:       { name:"Звёздная верфь",      icon:"🚀", maxLvl:12, desc:"Строит корабли" },
  barracks:       { name:"Казармы пилотов",     icon:"👨‍🚀",maxLvl:10, desc:"Прирост населения" },
  crystal_mine:   { name:"Добытчик кристаллов", icon:"💎", maxLvl:12, desc:"Добыча кристаллов +20%/ур." },
  shield:         { name:"Планетарный щит",     icon:"🛡️", maxLvl:8,  desc:"Защита планеты от атак" },
  market:         { name:"Торговый хаб",        icon:"🏪", maxLvl:8,  desc:"Торговля с союзниками" },
  fuel_refinery:  { name:"Топливный завод",     icon:"⛽", maxLvl:10, desc:"Производство топлива" },
  dark_matter_lab:{ name:"Лаб. тёмной материи", icon:"🌑", maxLvl:5,  desc:"Сбор тёмной материи" },
};

// ─── ТЕХНОЛОГИИ ───────────────────────────────────────────────────────────────
const TECH_CATS: Record<string,{label:string;color:string}> = {
  economy:  { label:"Экономика",  color:"text-yellow-400" },
  military: { label:"Военное",    color:"text-red-400"    },
  expansion:{ label:"Экспансия",  color:"text-green-400"  },
  special:  { label:"Особые",     color:"text-purple-400" },
};

const TECHS: Record<string,{name:string;icon:string;cat:string;maxLvl:number;effect:string}> = {
  metal_mining:      { name:"Горное дело",          icon:"⛏️", cat:"economy",   maxLvl:5, effect:"Добыча металла +15%/ур." },
  energy_cells:      { name:"Энергоячейки",         icon:"⚡", cat:"economy",   maxLvl:5, effect:"Выработка энергии +15%/ур." },
  crystal_synthesis: { name:"Синтез кристаллов",    icon:"💎", cat:"economy",   maxLvl:4, effect:"Добыча кристаллов +20%/ур." },
  colonization:      { name:"Колонизация",           icon:"🪐", cat:"expansion", maxLvl:3, effect:"Открывает колонизационные корабли" },
  terraforming:      { name:"Терраформирование",     icon:"🌍", cat:"expansion", maxLvl:3, effect:"Колонизация любого типа планет" },
  warp_drive:        { name:"Варп-двигатель",        icon:"🌀", cat:"military",  maxLvl:4, effect:"Скорость флота +25%/ур." },
  plasma_cannons:    { name:"Плазменные пушки",      icon:"🔫", cat:"military",  maxLvl:5, effect:"Атака флота +15%/ур." },
  ion_shields:       { name:"Ионные щиты",           icon:"🔵", cat:"military",  maxLvl:5, effect:"Защита флота +15%/ур." },
  nanobots:          { name:"Нанороботы",            icon:"🤖", cat:"military",  maxLvl:3, effect:"Ремонт кораблей в бою +10%/ур." },
  dark_matter_weapon:{ name:"Оружие тёмной материи", icon:"🌑", cat:"military",  maxLvl:3, effect:"Атака +50%, открывает Титан" },
  espionage:         { name:"Шпионаж",               icon:"🕵️", cat:"special",   maxLvl:4, effect:"Шпионские миссии" },
  diplomacy:         { name:"Дипломатия",            icon:"🤝", cat:"special",   maxLvl:3, effect:"Торговые маршруты, союзы" },
  quantum_computing: { name:"Квантовые вычисления",  icon:"💻", cat:"special",   maxLvl:2, effect:"Все расчёты +30% эффективность" },
  ancient_tech:      { name:"Технологии Древних",    icon:"🏛️", cat:"special",   maxLvl:1, effect:"Разблокирует артефакты и реликвии" },
  deep_mining:       { name:"Глубинная добыча",      icon:"⛏️", cat:"economy",   maxLvl:5, effect:"Добывающие корабли +25%/ур." },
  drill_tech:        { name:"Технологии бурения",    icon:"🔩", cat:"economy",   maxLvl:4, effect:"Буры +40% скорость/ур." },
  automated_mining:  { name:"Автодобыча",            icon:"🤖", cat:"economy",   maxLvl:3, effect:"Автоматическая добыча каждый час" },
  dark_matter_drive: { name:"Двигатель тёмной материи",icon:"🌑",cat:"military", maxLvl:3, effect:"Скорость всех кораблей +50%/ур." },
};

// ─── КОРАБЛИ ──────────────────────────────────────────────────────────────────
const SHIPS: Record<string,{name:string;icon:string;atk:number;def:number;speed:number;mining?:boolean}> = {
  scout:       { name:"Разведчик",   icon:"🛸", atk:8,   def:5,   speed:150 },
  fighter:     { name:"Истребитель", icon:"✈️", atk:20,  def:15,  speed:120 },
  cruiser:     { name:"Крейсер",     icon:"🚀", atk:55,  def:45,  speed:90  },
  battleship:  { name:"Линкор",      icon:"⚔️", atk:140, def:110, speed:70  },
  dreadnought: { name:"Дредноут",    icon:"🌟", atk:350, def:280, speed:50  },
  titan:       { name:"Титан",       icon:"🔱", atk:900, def:750, speed:30  },
  carrier:     { name:"Авианосец",   icon:"🛥️", atk:200, def:350, speed:60  },
  stealth:     { name:"Невидимка",   icon:"👁️", atk:80,  def:30,  speed:180 },
  miner:       { name:"Шахтёр",      icon:"⛏️", atk:2,   def:10,  speed:60,  mining:true },
  drill:       { name:"Бур",         icon:"🔩", atk:1,   def:5,   speed:40,  mining:true },
  harvester:   { name:"Харвестер",   icon:"🌾", atk:3,   def:15,  speed:30,  mining:true },
};

// ─── ЗВЁЗДЫ ───────────────────────────────────────────────────────────────────
const STAR_COLORS: Record<string,string> = {
  yellow:    "#f59e0b", blue:      "#60a5fa", red_giant: "#ef4444",
  red_dwarf: "#f97316", white:     "#f1f5f9", neutron:   "#a78bfa",
};
const PLANET_COLORS: Record<string,string> = {
  terrestrial:"#22c55e", gas_giant:"#f97316", ice:"#93c5fd", desert:"#fbbf24",
  ocean:"#06b6d4",       lava:"#ef4444",      crystal:"#a78bfa", toxic:"#84cc16",
};

// ─── СТАТИЧНЫЙ ФОНОВЫЙ SVG ────────────────────────────────────────────────────
const STAR_BG = Array.from({length:200}).map((_,i)=>(
  <circle key={i}
    cx={(i*137.508)%800} cy={(i*97.3)%800}
    r={(i%3===0)?1.2:(i%5===0)?0.8:0.4}
    fill="white" opacity={(i%4===0)?0.5:(i%3===0)?0.3:0.15}/>
));

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────
interface Player {
  id:number; nickname:string; race:RaceId;
  metal:number; energy:number; crystals:number; population:number; fuel:number; dark_matter:number;
  score:number; rank_title:string; alliance_id:number|null; home_planet_id:number|null;
  colonies_count:number; total_fleet_power:number; battles_won:number; battles_lost:number;
}
interface System { id:number; name:string; pos_x:number; pos_y:number; star_type:string; star_size:number; sector:string; planet_count:number; }
interface Planet { id:number; name:string; star_system_id:number; pos_x:number; pos_y:number; planet_type:string; size:number; owner_id:number|null; owner_race:string|null; owner_nickname:string|null; is_ai_controlled:boolean; ai_fleet_tier:number; metal_richness:number; energy_richness:number; crystal_richness:number; special_resource:string|null; colony_id:number|null; }
interface Colony { id:number; planet_id:number; colony_name:string; is_capital:boolean; mine_level:number; solar_level:number; lab_level:number; shipyard_level:number; barracks_level:number; crystal_mine_level:number; shield_level:number; market_level:number; fuel_refinery_level:number; dark_matter_lab_level:number; metal_stored:number; energy_stored:number; crystals_stored:number; planet_name:string; }
interface Fleet { id:number; name:string; ships:Record<string,number>; total_attack:number; total_defense:number; current_planet_id:number|null; status:string; mission:string|null; planet_name:string|null; }
interface AnimFleet { id:number; fromX:number; fromY:number; toX:number; toY:number; progress:number; owner:boolean; race:string; name:string; }
interface SpyResult { success:boolean; target:string; report:Record<string,unknown>; msg:string; }
interface ChatMsg { id:number; player_id:number; nickname:string; race:string; message:string; created_at:string; }
interface Alliance { id:number; alliance_name:string; alliance_tag:string; emblem:string; alliance_desc:string; members_count:number; total_score:number; leader_name:string; is_recruiting:boolean; }
interface Quest { id:string; name:string; icon:string; cat:string; desc:string; progress:number; target:number; completed:boolean; claimed:boolean; pct:number; reward:Record<string,number>; }
interface PirateFleet { id:number; name:string; tier:number; ships:Record<string,number>; attack:number; defense:number; pos_x:number; pos_y:number; status:string; target_player_id:number|null; tech_level:number; }
interface CoreFleet   { id:number; name:string; ships:Record<string,number>; attack:number; defense:number; pos_x:number; pos_y:number; status:string; target_player_id:number|null; }
interface PirateWreck { id:number; pos_x:number; pos_y:number; metal:number; energy:number; crystals:number; fuel:number; }
interface AiEvent     { id:number; type:string; title:string; message:string; data:string; read:boolean; date:string; }
interface StationData { id:number; level:number; shipyard:number; defense:number; hangar:number; lab:number; hull_hp:number; max_hull_hp:number; docked_ships:Record<string,number>; }
interface WarehouseData { id:number; metal:number; energy:number; crystals:number; fuel:number; ore:number; alloy:number; components:number; capacity:number; level:number; }
interface ShipDef { name:string; icon:string; cat:string; atk:number; def:number; mining:number; cargo:number; salvage?:number; tech_req:string|null; cost:Record<string,number>; desc:string; }
interface PlanetMenu { planet:Planet; x:number; y:number; }  // контекстное меню на карте

// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────
async function api(url:string, opts?:{method?:string;body?:object;token?:string}) {
  const h:Record<string,string> = {"Content-Type":"application/json"};
  if (opts?.token) h["X-Auth-Token"] = opts.token;
  const r = await fetch(url, { method:opts?.method||"GET", headers:h, body:opts?.body?JSON.stringify(opts.body):undefined });
  return r.json();
}

function resIcon(k:string) { return k==="metal"?"⛏️":k==="energy"?"⚡":k==="crystals"?"💎":k==="population"?"👥":k==="fuel"?"⛽":"🌑"; }

// ═══════════════════════════════════════════════════════════════════════════════
export default function GalacticEmpire() {
  const [phase,     setPhase]     = useState<"auth"|"verify"|"choose_planet"|"game">("auth");
  const [authTab,   setAuthTab]   = useState<"login"|"register">("login");
  const [form,      setForm]      = useState({email:"",nickname:"",login:"",password:"",race:"solarians" as RaceId});
  const [authErr,   setAuthErr]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [token,     setToken]     = useState(()=>localStorage.getItem("ge_token")||"");
  const [player,    setPlayer]    = useState<Player|null>(null);
  const [pendingPid,setPendingPid]= useState<number|null>(null);
  const [pendingEmail,setPendingEmail]=useState("");
  const [pendingRace,setPendingRace]=useState<RaceId>("solarians");
  const [pendingNick,setPendingNick]=useState("");
  const [verifyCode,setVerifyCode]= useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [availPlanets,setAvailPlanets]=useState<Planet[]>([]);
  const [selStartPlanet,setSelStartPlanet]=useState<Planet|null>(null);

  const [tab,       setTab]       = useState<TabId>("galaxy");
  const [systems,   setSystems]   = useState<System[]>([]);
  const [planets,   setPlanets]   = useState<Planet[]>([]);
  const [colonies,  setColonies]  = useState<Colony[]>([]);
  const [fleets,    setFleets]    = useState<Fleet[]>([]);
  const [techMap,   setTechMap]   = useState<Record<string,number>>({});
  const [leaderboard,setLeaderboard]=useState<{id:number;nickname:string;race:string;score:number;rank_title:string;alliance:string|null;battles_won:number}[]>([]);

  const [selSystem, setSelSystem] = useState<System|null>(null);
  const [sysDetail, setSysDetail] = useState<{planets:Planet[];players_in_system:unknown[]}|null>(null);
  const [selPlanet, setSelPlanet] = useState<Planet|null>(null);
  const [selColony, setSelColony] = useState<Colony|null>(null);

  const [chatTab,   setChatTab]   = useState<"global"|"alliance">("global");
  const [chatMsgs,  setChatMsgs]  = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLast,  setChatLast]  = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [myAlliance,setMyAlliance]= useState<Alliance|null>(null);
  const [allianceForm,setAllianceForm]=useState({name:"",tag:"",emblem:"⚔️",desc:""});
  const [allianceMsg,setAllianceMsg]=useState("");

  const [tradeOffers,setTradeOffers]=useState<{id:number;seller_nickname:string;sell_res:string;sell_amt:number;buy_res:string;buy_amt:number}[]>([]);
  const [tradeForm,setTradeForm]=useState({sell_resource:"metal",sell_amount:100,buy_resource:"crystals",buy_amount:50});
  const [tradeMsg,setTradeMsg]=useState("");

  const [battleReports,setBattleReports]=useState<{id:number;attacker:string;defender:string;result:string;attacker_wins:boolean;created_at:string}[]>([]);
  const [battleTarget,setBattleTarget]=useState<Planet|null>(null);
  const [battleFleetId,setBattleFleetId]=useState<number|null>(null);
  const [battleLog,setBattleLog]=useState<string[]>([]);
  const [buildMsg,setBuildMsg]=useState("");

  // ── ПИРАТЫ И ЯДРО ─────────────────────────────────────────────────────────
  const [pirateFleets,  setPirateFleets]  = useState<PirateFleet[]>([]);
  const [coreFleet,     setCoreFleet]     = useState<CoreFleet|null>(null);
  const [pirateWrecks,  setPirateWrecks]  = useState<PirateWreck[]>([]);
  const [aiEvents,      setAiEvents]      = useState<AiEvent[]>([]);
  const [unreadEvents,  setUnreadEvents]  = useState(0);
  const [showEvents,    setShowEvents]    = useState(false);
  const [piratesMsg,    setPiratesMsg]    = useState("");
  const pirateTickRef = useRef<number>(0);

  // ── ЕЖЕДНЕВНЫЕ ЗАДАНИЯ ────────────────────────────────────────────────────
  const [quests,       setQuests]       = useState<Quest[]>([]);
  const [questsStreak, setQuestsStreak] = useState(0);
  const [questsMsg,    setQuestsMsg]    = useState("");
  const [questsDone,   setQuestsDone]   = useState(0);
  const [newQuestBadge,setNewQuestBadge]= useState(false);

  // ── ТУТОРИАЛ ──────────────────────────────────────────────────────────────
  const [tutStep, setTutStep] = useState<number>(() => {
    const saved = localStorage.getItem("ge_tut");
    return saved ? parseInt(saved) : 0;
  });
  const [tutVisible, setTutVisible] = useState(true);
  const closeTut = () => { setTutVisible(false); localStorage.setItem("ge_tut","done"); };
  const nextTut = (n: number) => { setTutStep(n); localStorage.setItem("ge_tut", String(n)); };

  // ── МАГАЗИН ───────────────────────────────────────────────────────────────
  const [shopPackages, setShopPackages] = useState<ShopPackage[]>([]);
  const [shopMsg,      setShopMsg]      = useState("");
  const [shopHistory,  setShopHistory]  = useState<{name:string;rewards:Record<string,number>;date:string}[]>([]);

  // ── ДИПЛОМАТИЯ ────────────────────────────────────────────────────────────
  const [diploPlayers,  setDiploPlayers]  = useState<{id:number;nickname:string;race:string;score:number}[]>([]);
  const [diploRels,     setDiploRels]     = useState<DiplomacyRel[]>([]);
  const [diploTarget,   setDiploTarget]   = useState<number|null>(null);
  const [diploMsg,      setDiploMsg]      = useState("");
  const [diploAction,   setDiploAction]   = useState<"war"|"trade_union"|"peace">("peace");

  // ── ПОИСК КОЛОНИЙ ─────────────────────────────────────────────────────────
  const [colonySearch, setColonySearch] = useState("");

  // ── ОРБИТАЛЬНАЯ СТАНЦИЯ ───────────────────────────────────────────────────
  const [stationData,   setStationData]   = useState<StationData|null>(null);
  const [warehouseData, setWarehouseData] = useState<WarehouseData|null>(null);
  const [stationPlanet, setStationPlanet] = useState<number|null>(null);
  const [stationMsg,    setStationMsg]    = useState("");
  const [shipDefs,      setShipDefs]      = useState<Record<string,ShipDef>>({});
  const [unlockedShips, setUnlockedShips] = useState<string[]>([]);
  const [shipTechs,     setShipTechs]     = useState<Record<string,{name:string;icon:string;cost:Record<string,number>;unlocks:string}>>({});
  const [stationTab,    setStationTab]    = useState<"station"|"ships"|"warehouse"|"factory"|"tech">("station");
  const [showStation,   setShowStation]   = useState(false);

  // ── КОНТЕКСТНОЕ МЕНЮ ПЛАНЕТЫ ──────────────────────────────────────────────
  const [planetMenu, setPlanetMenu] = useState<PlanetMenu|null>(null);

  // ── ДОБЫЧА КОРАБЛЯМИ ──────────────────────────────────────────────────────
  const [mineFleetId,  setMineFleetId]  = useState<number|null>(null);
  const [minePlanetId, setMinePlanetId] = useState<number|null>(null);
  const [mineMsg,      setMineMsg]      = useState("");

  // ── КАРТА: pan/zoom ────────────────────────────────────────────────────────
  const svgRef      = useRef<SVGSVGElement>(null);
  const mapWrapRef  = useRef<HTMLDivElement>(null);
  const isPanning   = useRef(false);
  const didDrag     = useRef(false);
  const panStart    = useRef({x:0,y:0,tx:0,ty:0});
  const [mapTx, setMapTx] = useState(0);
  const [mapTy, setMapTy] = useState(0);
  const [mapScale, setMapScale] = useState(0.28);

  // ── МИНИ-КАРТА ────────────────────────────────────────────────────────────
  const WORLD = 2400; // полный размер карты мира
  const MINI  = 160;  // размер мини-карты в px
  const miniScale = MINI / WORLD; // 0.0667

  // ── АНИМИРОВАННЫЕ ФЛОТЫ ────────────────────────────────────────────────────
  const [animFleets, setAnimFleets] = useState<AnimFleet[]>([]);
  const animRef = useRef<number>(0);
  const animFleetsRef = useRef<AnimFleet[]>([]);

  // ── ШПИОНАЖ ───────────────────────────────────────────────────────────────
  const [spyPanel, setSpyPanel] = useState(false);
  const [spyTarget, setSpyTarget] = useState<Planet|null>(null);
  const [spyType, setSpyType]   = useState<"resources"|"fleet"|"buildings">("resources");
  const [spyResult, setSpyResult] = useState<SpyResult|null>(null);
  const [spyLoading, setSpyLoading] = useState(false);

  const raceData = (player ? RACES[player.race as RaceId] : null) ?? RACES.solarians;

  // ── АВТО-ВХОД ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    api(`${API.auth}?action=me`, {token}).then(d => {
      if (d.player?.id) { setPlayer(d.player); setPhase("game"); }
      else { localStorage.removeItem("ge_token"); setToken(""); }
    }).catch(()=>{});
  }, []);

  // ── ЗАГРУЗКА ГАЛАКТИКИ ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="galaxy") return;
    api(`${API.game}?action=galaxy`, {token}).then(d => {
      if (d.systems) setSystems(d.systems);
      if (d.planets) setPlanets(d.planets);
    });
  }, [phase, tab]);

  // ── ЗАГРУЗКА КОЛОНИЙ ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="colony") return;
    api(`${API.game}?action=colonies`, {token}).then(d => { if (d.colonies) setColonies(d.colonies); });
  }, [phase, tab]);

  // ── ЗАГРУЗКА ФЛОТОВ ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="fleet") return;
    api(`${API.game}?action=fleets`, {token}).then(d => { if (d.fleets) setFleets(d.fleets); });
  }, [phase, tab]);

  // ── ЗАГРУЗКА ТЕХНОЛОГИЙ ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="tech") return;
    api(`${API.game}?action=techs`, {token}).then(d => { if (d.techs) setTechMap(d.techs); });
  }, [phase, tab]);

  // ── ЧАТ ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="chat") return;
    const load = async () => {
      const url = chatTab==="global"
        ? `${API.social}?action=chat_global&since=${chatLast}`
        : `${API.social}?action=chat_alliance&since=${chatLast}`;
      const d = await api(url, {token}).catch(()=>null);
      if (!d?.messages) return;
      if (chatLast===0) setChatMsgs(d.messages);
      else if (d.messages.length) setChatMsgs(p=>[...p,...d.messages].slice(-120));
      if (d.messages.length) setChatLast(d.messages[d.messages.length-1].id);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [phase, tab, chatTab]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; }, [chatMsgs]);

  // ── АЛЬЯНСЫ ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="alliance") return;
    api(`${API.social}?action=alliances`, {token}).then(d => { if (d.alliances) setAlliances(d.alliances); });
    if (player?.alliance_id) api(`${API.social}?action=my_alliance`, {token}).then(d => { if (d.alliance) setMyAlliance(d.alliance); });
  }, [phase, tab]);

  // ── ТОРГОВЛЯ ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="trade") return;
    api(`${API.social}?action=trade_market`, {token}).then(d => { if (d.trades) setTradeOffers(d.trades); });
  }, [phase, tab]);

  // ── БОЕВЫЕ ОТЧЁТЫ ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="battle") return;
    api(`${API.battle}?action=battle_reports`, {token}).then(d => { if (d.reports) setBattleReports(d.reports); });
  }, [phase, tab]);

  // ── РЕЙТИНГ ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="ranking") return;
    api(`${API.auth}?action=leaderboard`, {token}).then(d => { if (d.leaderboard) setLeaderboard(d.leaderboard); });
  }, [phase, tab]);

  // ── ДЕТАЛИ СИСТЕМЫ ─────────────────────────────────────────────────────────
  const loadSystem = useCallback(async (sys:System) => {
    setSelSystem(sys);
    const d = await api(`${API.game}?action=system&id=${sys.id}`, {token});
    setSysDetail(d);
    setSelPlanet(null);
  }, [token]);

  // ── АНИМАЦИЯ ФЛОТОВ: запускаем демо-флоты по системам ─────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="galaxy" || systems.length<2) return;
    // Генерируем несколько анимированных флотов между случайными системами
    const makeFleet = (id:number): AnimFleet => {
      const a = systems[Math.floor(Math.random()*systems.length)];
      const b = systems[Math.floor(Math.random()*systems.length)];
      const races = Object.keys(RACES);
      return {
        id, fromX:a.pos_x, fromY:a.pos_y,
        toX:b.pos_x, toY:b.pos_y,
        progress: Math.random(),
        owner: Math.random()>0.6,
        race: races[Math.floor(Math.random()*races.length)],
        name: ["Флот-α","Флот-β","Армада","Рейдер","Патруль"][Math.floor(Math.random()*5)],
      };
    };
    const fleet = Array.from({length:8}, (_,i)=>makeFleet(i));
    animFleetsRef.current = fleet;
    setAnimFleets([...fleet]);

    let last = performance.now();
    const tick = (now:number) => {
      const dt = (now-last)/1000;
      last = now;
      animFleetsRef.current = animFleetsRef.current.map(f=>{
        const p = f.progress + dt*0.06;
        if (p>=1) {
          // Перезапустить с новой случайной точки
          const a = systems[Math.floor(Math.random()*systems.length)];
          const b = systems[Math.floor(Math.random()*systems.length)];
          return {...f, fromX:a.pos_x, fromY:a.pos_y, toX:b.pos_x, toY:b.pos_y, progress:0, owner:Math.random()>0.6};
        }
        return {...f, progress:p};
      });
      setAnimFleets([...animFleetsRef.current]);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, tab, systems]);

  // ── PAN/ZOOM handlers ──────────────────────────────────────────────────────
  const onSvgMouseDown = useCallback((e:React.MouseEvent) => {
    if (e.button!==0) return;
    isPanning.current = true;
    didDrag.current = false;
    panStart.current = {x:e.clientX, y:e.clientY, tx:mapTx, ty:mapTy};
    (e.currentTarget as SVGElement).style.cursor = "grabbing";
  },[mapTx, mapTy]);

  const onSvgMouseMove = useCallback((e:React.MouseEvent) => {
    if (!isPanning.current) return;
    // Скорость перемещения = 2× (не делим на mapScale — движение 1:1 с мышью)
    const dx = (e.clientX - panStart.current.x) * 2;
    const dy = (e.clientY - panStart.current.y) * 2;
    if (Math.abs(dx)>4 || Math.abs(dy)>4) didDrag.current = true;
    setMapTx(panStart.current.tx + dx);
    setMapTy(panStart.current.ty + dy);
  },[]);

  const onSvgMouseUp = useCallback((e:React.MouseEvent) => {
    isPanning.current = false;
    (e.currentTarget as SVGElement).style.cursor = "grab";
  },[]);

  const onSvgWheel = useCallback((e:React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.28 : 0.78;
    const svgEl = svgRef.current;
    if (!svgEl) { setMapScale(s => Math.min(10, Math.max(0.1, s*factor))); return; }
    const rect = svgEl.getBoundingClientRect();
    // Зум относительно позиции курсора
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMapScale(prev => {
      const next = Math.min(10, Math.max(0.1, prev * factor));
      const ratio = next / prev;
      setMapTx(tx => mouseX - (mouseX - tx) * ratio);
      setMapTy(ty => mouseY - (mouseY - ty) * ratio);
      return next;
    });
  },[]);

  const resetMap = () => { setMapTx(0); setMapTy(0); setMapScale(0.28); };

  // ── ШПИОНАЖ ───────────────────────────────────────────────────────────────
  async function doSpy() {
    if (!spyTarget) return;
    setSpyLoading(true); setSpyResult(null);
    // Шпионаж через empire-battle endpoint
    const d = await api(API.battle, {method:"POST", token, body:{
      action:"spy", target_planet_id: spyTarget.id, spy_type: spyType
    }}).catch(()=>null);
    setSpyLoading(false);
    if (!d || d.error) {
      // Симуляция если бэкенд не поддерживает
      const success = Math.random()>0.3;
      setSpyResult({
        success,
        target: spyTarget.name,
        msg: success ? "Агент успешно внедрён!" : "Агент провалился. Противник усилил охрану.",
        report: success ? {
          metal:    Math.floor(Math.random()*5000),
          energy:   Math.floor(Math.random()*4000),
          crystals: Math.floor(Math.random()*2000),
          fleet_power: Math.floor(Math.random()*10000),
          shield_level: Math.floor(Math.random()*8),
        } : {},
      });
    } else {
      setSpyResult(d);
    }
  }

  // ── ЗАГРУЗКА МАГАЗИНА ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="shop") return;
    api(`${API.shop}?action=catalog`).then(d => { if (d.packages) setShopPackages(d.packages); });
    api(`${API.shop}?action=history`, {token}).then(d => { if (d.history) setShopHistory(d.history); });
  }, [phase, tab]);

  // ── ЗАГРУЗКА ДИПЛОМАТИИ ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="game" || tab!=="diplomacy") return;
    api(`${API.social}?action=players_list`, {token}).then(d => { if (d.players) setDiploPlayers(d.players); });
    api(`${API.social}?action=my_diplomacy`, {token}).then(d => { if (d.relations) setDiploRels(d.relations); });
  }, [phase, tab]);

  // ── ЗАГРУЗКА КВЕСТОВ ─────────────────────────────────────────────────────
  const loadQuests = useCallback(() => {
    api(`${API.quests}?action=my_quests`, {token}).then(d => {
      if (d.quests) {
        setQuests(d.quests);
        setQuestsStreak(d.streak||0);
        setQuestsDone(d.completed_today||0);
        const unclaimed = d.quests.filter((q:Quest)=>q.completed && !q.claimed).length;
        setNewQuestBadge(unclaimed > 0);
      }
    });
  }, [token]);

  useEffect(() => {
    if (phase!=="game") return;
    loadQuests(); // Загружаем при входе в игру чтобы показать badge
  }, [phase]);

  useEffect(() => {
    if (phase!=="game" || tab!=="quests") return;
    loadQuests();
  }, [phase, tab]);

  // ── ПИРАТЫ: загрузка состояния и тик ─────────────────────────────────────
  const loadPirateState = useCallback(() => {
    api(`${API.pirates}?action=state`, {token}).then(d => {
      if (d.pirates)  setPirateFleets(d.pirates);
      if (d.core)     setCoreFleet(d.core);
      if (d.wrecks)   setPirateWrecks(d.wrecks);
      if (typeof d.unread_events === 'number') setUnreadEvents(d.unread_events);
    });
  }, [token]);

  useEffect(() => {
    if (phase !== "game") return;
    loadPirateState();
    // Тик пиратов каждые 30 секунд
    const doTick = () => {
      api(API.pirates, {method:"POST", token, body:{action:"tick"}}).then(()=>loadPirateState());
    };
    doTick();
    pirateTickRef.current = window.setInterval(doTick, 30000);
    return () => clearInterval(pirateTickRef.current);
  }, [phase]);

  // Загрузка событий
  const loadEvents = useCallback(() => {
    api(`${API.pirates}?action=events`, {token}).then(d => {
      if (d.events) setAiEvents(d.events);
    });
  }, [token]);

  const readAllEvents = async () => {
    await api(API.pirates, {method:"POST", token, body:{action:"read_event"}});
    setUnreadEvents(0);
    setAiEvents(e=>e.map(ev=>({...ev, read:true})));
  };

  const salvageWreck = async (wreck_id:number) => {
    const d = await api(API.pirates, {method:"POST", token, body:{action:"salvage", wreck_id}});
    if (d.error) { setPiratesMsg("❌ "+d.error); return; }
    setPiratesMsg("✅ "+d.message);
    setPlayer(p=>p?{...p,metal:(p.metal||0)+d.metal,energy:(p.energy||0)+d.energy,
      crystals:(p.crystals||0)+d.crystals,fuel:(p.fuel||0)+d.fuel}:p);
    loadPirateState();
  };

  const requestCoreHelp = async () => {
    const d = await api(API.pirates, {method:"POST", token, body:{action:"request_core_help"}});
    if (d.error) { setPiratesMsg("❌ "+d.error); return; }
    setPiratesMsg("✅ "+d.message);
    loadPirateState();
  };

  // ── ОРБИТАЛЬНАЯ СТАНЦИЯ ───────────────────────────────────────────────────
  const loadStation = useCallback(async (planet_id:number) => {
    const d = await api(`${API.station}?action=get&planet_id=${planet_id}`, {token});
    if (d.station !== undefined) { setStationData(d.station); setShipDefs(d.ships||{}); setUnlockedShips(d.unlocked_ships||[]); setShipTechs(d.ship_techs||{}); }
    if (d.warehouse !== undefined) setWarehouseData(d.warehouse);
    setStationPlanet(planet_id);
  }, [token]);

  const buildStation = async (planet_id:number) => {
    const d = await api(API.station, {method:"POST", token, body:{action:"build", planet_id}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) loadStation(planet_id);
  };

  const upgradeModule = async (planet_id:number, module:string) => {
    const d = await api(API.station, {method:"POST", token, body:{action:"upgrade", planet_id, module}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) { loadStation(planet_id); setPlayer(p=>p?{...p,metal:p.metal-1,energy:p.energy-1,crystals:p.crystals-1}:p); }
  };

  const buildShipStation = async (planet_id:number, ship_type:string, count:number) => {
    const d = await api(API.station, {method:"POST", token, body:{action:"build_ship_station", planet_id, ship_type, count}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) { loadStation(planet_id); api(`${API.game}?action=fleets`,{token}).then(dd=>{if(dd.fleets)setFleets(dd.fleets);}); }
  };

  const researchShipTech = async (tech_id:string) => {
    if (!stationPlanet) return;
    const d = await api(API.station, {method:"POST", token, body:{action:"research_ship_tech", tech_id}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) loadStation(stationPlanet);
  };

  const processOre = async (planet_id:number) => {
    const d = await api(API.station, {method:"POST", token, body:{action:"process_ore", planet_id}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) loadStation(planet_id);
  };

  const depositWarehouse = async (planet_id:number, resource:string, amount:number) => {
    const d = await api(API.station, {method:"POST", token, body:{action:"warehouse_deposit", planet_id, resource, amount}});
    setStationMsg(d.error ? "❌ "+d.error : "✅ "+d.message);
    if (!d.error) { loadStation(planet_id); setPlayer(p=>p?{...p}:p); }
  };

  // ── ЗАБРАТЬ НАГРАДУ ───────────────────────────────────────────────────────
  async function claimQuest(quest_id:string) {
    setQuestsMsg("");
    const d = await api(API.quests, {method:"POST", token, body:{action:"claim", quest_id}});
    if (d.error) { setQuestsMsg("❌ "+d.error); return; }
    setQuestsMsg("✅ "+d.message);
    if (d.reward) setPlayer(p=>p?{...p,
      metal:       (p.metal||0)       + (d.reward.metal||0),
      energy:      (p.energy||0)      + (d.reward.energy||0),
      crystals:    (p.crystals||0)    + (d.reward.crystals||0),
      fuel:        (p.fuel||0)        + (d.reward.fuel||0),
      dark_matter: (p.dark_matter||0) + (d.reward.dark_matter||0),
    }:p);
    loadQuests();
  }

  // ── КУПИТЬ ПАКЕТ ─────────────────────────────────────────────────────────
  async function buyPackage(pkg_id:string) {
    setShopMsg("⏳ Обработка...");
    const d = await api(API.shop, {method:"POST", token, body:{action:"buy", package_id:pkg_id}});
    if (d.error) { setShopMsg("❌ "+d.error); return; }
    setShopMsg("✅ "+d.message);
    if (d.rewards) setPlayer(p=>p?{...p,
      metal:    (p.metal||0)    + (d.rewards.metal||0),
      energy:   (p.energy||0)   + (d.rewards.energy||0),
      crystals: (p.crystals||0) + (d.rewards.crystals||0),
      fuel:     (p.fuel||0)     + (d.rewards.fuel||0),
      dark_matter:(p.dark_matter||0)+(d.rewards.dark_matter||0),
    }:p);
  }

  // ── КОЛОНИЗАЦИЯ ───────────────────────────────────────────────────────────
  async function doColonize(fleet_id:number, planet_id:number) {
    const d = await api(API.game, {method:"POST", token, body:{action:"colonize", fleet_id, planet_id}});
    if (d.error) { setBattleLog(["❌ "+d.error]); return; }
    setBattleLog(["✅ Планета "+d.planet+" колонизирована! Создана колония #"+d.colony_id]);
    setPlayer(p=>p?{...p, colonies_count:(p.colonies_count||0)+1}:p);
  }

  // ── ОТПРАВИТЬ ФЛОТ К ПЛАНЕТЕ ─────────────────────────────────────────────
  async function sendFleetTo(fleet_id:number, planet_id:number) {
    const d = await api(API.game, {method:"POST", token, body:{action:"send_fleet", fleet_id, target_planet_id:planet_id, mission:"defend"}});
    if (d.error) { setBattleLog(["❌ "+d.error]); return; }
    setBattleLog(["🚀 Флот отправлен! Прибытие через ~"+d.travel_time_min+" мин."]);
    setFleets(prev=>prev.map(f=>f.id===fleet_id?{...f,status:"moving"}:f));
  }

  // ── ДОБЫЧА КОРАБЛЯМИ ─────────────────────────────────────────────────────
  async function doMine() {
    if (!mineFleetId || !minePlanetId) return;
    const d = await api(API.game, {method:"POST", token, body:{action:"mine_resources", fleet_id:mineFleetId, planet_id:minePlanetId}});
    if (d.error) { setMineMsg("❌ "+d.error); return; }
    setMineMsg(`✅ Добыто: ⛏️${d.metal} ⚡${d.energy} 💎${d.crystals}`);
    setPlayer(p=>p?{...p, metal:(p.metal||0)+d.metal, energy:(p.energy||0)+d.energy, crystals:(p.crystals||0)+d.crystals}:p);
  }

  // ── ДИПЛОМАТИЯ: отправить ─────────────────────────────────────────────────
  async function sendDiplo() {
    if (!diploTarget) return;
    const actionMap = {war:"declare_war", trade_union:"propose_trade_union", peace:"propose_peace"};
    const d = await api(API.social, {method:"POST", token, body:{
      action: actionMap[diploAction], target_player_id: diploTarget, message: diploMsg
    }});
    if (d.error) { setDiploMsg("❌ "+d.error); return; }
    setDiploMsg(diploAction==="war"?"⚔️ Война объявлена!":diploAction==="trade_union"?"🤝 Предложение отправлено!":"🕊️ Мир предложен!");
    api(`${API.social}?action=my_diplomacy`,{token}).then(r=>{if(r.relations)setDiploRels(r.relations);});
  }

  // ── AUTH ───────────────────────────────────────────────────────────────────
  async function handleAuth() {
    setAuthErr(""); setLoading(true);
    try {
      const body = authTab==="register"
        ? {action:"register", login:form.login, nickname:form.nickname, email:form.email, password:form.password, race:form.race}
        : {action:"login", login:form.login, password:form.password};
      const d = await api(API.auth, {method:"POST", body});
      if (d.error) { setAuthErr(d.error); return; }

      if (d.status === "verify_email") {
        setPendingPid(d.player_id); setPendingEmail(d.email);
        if (authTab==="register") { setPendingRace(form.race); setPendingNick(form.nickname); }
        setPhase("verify");
        return;
      }
      if (d.status === "choose_planet") {
        setPendingPid(d.player_id); setPendingRace(d.race); setPendingNick(d.nickname);
        const pl = await api(`${API.auth}?action=available_planets&race=${d.race}`, {});
        setAvailPlanets(pl.planets || []);
        setPhase("choose_planet");
        return;
      }

      localStorage.setItem("ge_token", d.token);
      setToken(d.token);
      setPlayer(d.player);
      setPhase("game");
    } catch { setAuthErr("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  async function handleVerifyCode() {
    if (!pendingPid || verifyCode.length !== 6) { setVerifyErr("Введите 6-значный код"); return; }
    setVerifyErr(""); setLoading(true);
    try {
      const d = await api(API.auth, {method:"POST", body:{action:"verify_email", player_id:pendingPid, code:verifyCode}});
      if (d.error) { setVerifyErr(d.error); return; }
      const pl = await api(`${API.auth}?action=available_planets&race=${d.race}`, {});
      setAvailPlanets(pl.planets || []);
      setPendingRace(d.race); setPendingNick(d.nickname);
      setPhase("choose_planet");
    } catch { setVerifyErr("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  async function handleResendCode() {
    if (!pendingPid) return;
    const d = await api(API.auth, {method:"POST", body:{action:"resend_code", player_id:pendingPid}});
    setVerifyErr(d.message || "Код отправлен повторно");
  }

  async function handleChoosePlanet() {
    if (!pendingPid || !selStartPlanet) { setVerifyErr("Выберите планету"); return; }
    setVerifyErr(""); setLoading(true);
    try {
      const d = await api(API.auth, {method:"POST", body:{action:"choose_planet", player_id:pendingPid, planet_id:selStartPlanet.id}});
      if (d.error) { setVerifyErr(d.error); return; }
      localStorage.setItem("ge_token", d.token);
      setToken(d.token);
      setPlayer(d.player);
      setPhase("game");
    } catch { setVerifyErr("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("ge_token"); setToken(""); setPlayer(null); setPhase("auth");
    setPendingPid(null); setVerifyCode(""); setSelStartPlanet(null);
  }

  // ── УЛУЧШИТЬ ЗДАНИЕ ────────────────────────────────────────────────────────
  async function upgradeBuilding(colony_id:number, building:string) {
    setBuildMsg("");
    const d = await api(API.game, {method:"POST", token, body:{action:"upgrade_building", colony_id, building}});
    if (d.error) { setBuildMsg("❌ "+d.error); return; }
    setBuildMsg("✅ "+d.message);
    setPlayer(p=>p?{...p, metal:d.resources.metal, energy:d.resources.energy, crystals:d.resources.crystals}:p);
    setColonies(prev=>prev.map(c=>c.id===colony_id?{...c, [`${building}_level`]:(d.new_level||1)}:c));
  }

  // ── ИССЛЕДОВАНИЕ ───────────────────────────────────────────────────────────
  async function doResearch(tech_id:string) {
    const d = await api(API.game, {method:"POST", token, body:{action:"research", tech_id}});
    if (d.error) { setBuildMsg("❌ "+d.error); return; }
    setBuildMsg("✅ "+d.message);
    setTechMap(prev=>({...prev,[tech_id]:(prev[tech_id]||0)+1}));
    setPlayer(p=>p?{...p, ...d.resources}:p);
  }

  // ── СТРОИТЬ КОРАБЛЬ ────────────────────────────────────────────────────────
  async function buildShip(colony_id:number, ship_type:string, count:number) {
    const d = await api(API.game, {method:"POST", token, body:{action:"build_ship", colony_id, ship_type, count}});
    if (d.error) { setBuildMsg("❌ "+d.error); return; }
    setBuildMsg("✅ "+d.message);
    setPlayer(p=>p?{...p,...d.resources}:p);
  }

  // ── АТАКА ──────────────────────────────────────────────────────────────────
  async function doAttack(fleet_id:number, planet_id:number) {
    const d = await api(API.battle, {method:"POST", token, body:{action:"attack", fleet_id, planet_id}});
    if (d.error) { setBattleLog(["❌ "+d.error]); return; }
    const log:string[] = [
      `⚔️ Атака на планету!`,
      `Атака: ${d.attacker_attack} vs Защита: ${d.defender_defense}`,
      d.result==="victory" ? "✅ ПОБЕДА! Планета захвачена!" : "❌ Поражение. Флот отступил.",
    ];
    if (d.loot) log.push(`Добыча: ⛏️${d.loot.metal||0} ⚡${d.loot.energy||0} 💎${d.loot.crystals||0}`);
    setBattleLog(log);
    if (d.resources) setPlayer(p=>p?{...p,...d.resources}:p);
    api(`${API.battle}?action=battle_reports`, {token}).then(r=>{ if(r.reports) setBattleReports(r.reports); });
  }

  // ── ЧАТ ОТПРАВКА ──────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim()) return;
    const d = await api(API.social, {method:"POST", token, body:{action:"chat_send", channel:chatTab, message:chatInput}});
    if (d.sent) {
      setChatMsgs(p=>[...p,{id:d.id,player_id:player!.id,nickname:player!.nickname,race:player!.race,message:chatInput,created_at:"сейчас"}]);
      setChatInput("");
    }
  }

  // ── АЛЬЯНС ДЕЙСТВИЯ ────────────────────────────────────────────────────────
  async function createAlliance() {
    const d = await api(API.social,{method:"POST",token,body:{action:"create_alliance",name:allianceForm.name,tag:allianceForm.tag,emblem:allianceForm.emblem,description:allianceForm.desc}});
    if (d.error) { setAllianceMsg("❌ "+d.error); return; }
    setAllianceMsg("✅ Альянс создан!"); setPlayer(p=>p?{...p,alliance_id:d.alliance_id}:p);
    api(`${API.social}?action=alliances`,{token}).then(r=>{if(r.alliances)setAlliances(r.alliances);});
  }
  async function joinAlliance(id:number) {
    const d = await api(API.social,{method:"POST",token,body:{action:"join_alliance",alliance_id:id}});
    if (d.error) { setAllianceMsg("❌ "+d.error); return; }
    setAllianceMsg("✅ Вы вступили в альянс!"); setPlayer(p=>p?{...p,alliance_id:id}:p);
  }
  async function leaveAlliance() {
    const d = await api(API.social,{method:"POST",token,body:{action:"leave_alliance"}});
    if (d.left) { setAllianceMsg("✅ Покинули альянс."); setPlayer(p=>p?{...p,alliance_id:null}:p); setMyAlliance(null); }
  }

  // ── ТОРГОВЛЯ ───────────────────────────────────────────────────────────────
  async function createTrade() {
    const d = await api(API.social,{method:"POST",token,body:{action:"create_trade",...tradeForm}});
    if (d.error) { setTradeMsg("❌ "+d.error); return; }
    setTradeMsg("✅ Предложение создано!");
    api(`${API.social}?action=trade_market`,{token}).then(r=>{if(r.trades)setTradeOffers(r.trades);});
  }
  async function acceptTrade(trade_id:number) {
    const d = await api(API.social,{method:"POST",token,body:{action:"accept_trade",trade_id}});
    if (d.error) { setTradeMsg("❌ "+d.error); return; }
    setTradeMsg("✅ Сделка совершена!"); setPlayer(p=>p?{...p,...d.resources}:p);
    api(`${API.social}?action=trade_market`,{token}).then(r=>{if(r.trades)setTradeOffers(r.trades);});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ЭКРАН ПОДТВЕРЖДЕНИЯ EMAIL
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase==="verify") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📧</div>
            <h2 className="text-2xl font-black mb-2">Подтвердите email</h2>
            <p className="text-slate-400 text-sm">
              Мы отправили 6-значный код на<br/>
              <span className="text-blue-400 font-semibold">{pendingEmail}</span>
            </p>
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Код из письма</label>
            <input
              value={verifyCode}
              onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e=>e.key==="Enter"&&handleVerifyCode()}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          {verifyErr && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-2.5 mb-4">{verifyErr}</div>}
          <button onClick={handleVerifyCode} disabled={loading || verifyCode.length!==6}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold transition disabled:opacity-50 mb-3">
            {loading ? "⏳ Проверяем..." : "✅ Подтвердить"}
          </button>
          <div className="flex justify-between items-center">
            <button onClick={handleResendCode} className="text-xs text-slate-400 hover:text-white transition">
              Отправить код повторно
            </button>
            <button onClick={()=>setPhase("auth")} className="text-xs text-slate-500 hover:text-white transition">
              ← Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ЭКРАН ВЫБОРА СТАРТОВОЙ ПЛАНЕТЫ
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase==="choose_planet") {
    const raceData = RACES[pendingRace] || {icon:"🌌", name:pendingRace};
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">{raceData.icon}</div>
            <h2 className="text-2xl font-black mb-1">Выберите стартовую планету</h2>
            <p className="text-slate-400 text-sm">
              Командор <span className="text-purple-400 font-bold">{pendingNick}</span>,<br/>
              выберите планету — здесь будет основана столица вашей империи.<br/>
              В стартовый флот включён <span className="text-green-400 font-bold">корабль Колонист 🛸</span> для будущих колоний.
            </p>
          </div>
          {availPlanets.length === 0 && (
            <div className="text-center text-white/40 py-8">⏳ Загружаем доступные планеты...</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto mb-4">
            {availPlanets.map(p=>{
              const metalPct = Math.round((p.metal_richness || 1) * 100);
              const energyPct = Math.round((p.energy_richness || 1) * 100);
              const typeIcons: Record<string,string> = {terrestrial:'🌍',desert:'🏜️',ocean:'🌊',ice:'❄️',volcanic:'🌋',jungle:'🌿',gas_giant:'🌀',barren:'🪨'};
              return (
                <button key={p.id} onClick={()=>setSelStartPlanet(p)}
                  className={`text-left p-3 rounded-xl border transition-all ${selStartPlanet?.id===p.id?"border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20":"border-white/10 hover:border-white/30 bg-white/5"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{typeIcons[p.planet_type]||'🪐'}</span>
                    <div className="font-bold text-xs truncate leading-tight">{p.name}</div>
                  </div>
                  <div className="text-[9px] text-white/40 mb-1 capitalize">{p.biome} · размер {p.size}</div>
                  <div className="flex gap-1.5 text-[9px]">
                    <span className={metalPct >= 120 ? "text-yellow-400" : "text-white/50"}>⛏️{metalPct}%</span>
                    <span className={energyPct >= 120 ? "text-cyan-400" : "text-white/50"}>⚡{energyPct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          {selStartPlanet && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4 text-sm">
              <span className="font-bold text-purple-300">Выбрана:</span> {selStartPlanet.name}
              <span className="text-white/50 ml-2">· {selStartPlanet.biome} · размер {selStartPlanet.size}</span>
            </div>
          )}
          {verifyErr && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-2.5 mb-4">{verifyErr}</div>}
          <button onClick={handleChoosePlanet} disabled={loading || !selStartPlanet}
            className="w-full py-3 bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500 rounded-xl font-bold transition disabled:opacity-50">
            {loading ? "⏳ Основываем империю..." : "🪐 Основать столицу здесь!"}
          </button>
          <div className="mt-3 text-center">
            <div className="text-[10px] text-white/30">Стартовый флот: 🚀 Разведчик + 🛸 Колонист</div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ЭКРАН АВТОРИЗАЦИИ
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase==="auth") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Звёздный фон */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({length:80}).map((_,i)=>(
            <div key={i} className="absolute rounded-full bg-white" style={{
              left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
              width:`${Math.random()*2+0.5}px`, height:`${Math.random()*2+0.5}px`,
              opacity: Math.random()*0.6+0.2,
            }}/>
          ))}
        </div>

        <div className="relative z-10 max-w-lg w-full">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">🌌</div>
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
              Галактическая<br/>Империя
            </h1>
            <p className="text-slate-400">Реальное время · 9 рас · Миллиарды миров</p>
            <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
              {["🪐 Колонизируй планеты","⚔️ Сражайся за ресурсы","🤝 Создавай альянсы","🔬 Исследуй технологии"].map(f=>(
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex gap-2 mb-5">
              {(["login","register"] as const).map(m=>(
                <button key={m} onClick={()=>setAuthTab(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${authTab===m?"bg-blue-600 text-white shadow-lg shadow-blue-500/20":"bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  {m==="login"?"🔑 Войти":"🚀 Регистрация"}
                </button>
              ))}
            </div>

            {authTab==="register" && <>
              <div className="mb-3">
                <label className="text-xs text-slate-400 mb-1 block">Почта</label>
                <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                  placeholder="commander@galaxy.net" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
              </div>
              <div className="mb-3">
                <label className="text-xs text-slate-400 mb-1 block">Логин</label>
                <input value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}
                  placeholder="admiral_nova" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
              </div>
              <div className="mb-3">
                <label className="text-xs text-slate-400 mb-1 block">Никнейм (имя в игре)</label>
                <input value={form.nickname} onChange={e=>setForm(f=>({...f,nickname:e.target.value}))}
                  placeholder="Адмирал Нова" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
              </div>
              <div className="mb-4">
                <label className="text-xs text-slate-400 mb-2 block">Выберите расу</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(RACES) as [RaceId,typeof RACES[RaceId]][]).map(([id,r])=>(
                    <button key={id} onClick={()=>setForm(f=>({...f,race:id}))}
                      className={`text-left px-2 py-2 rounded-xl border text-xs transition-all ${form.race===id?"border-blue-400 bg-blue-500/20":"border-white/10 hover:border-white/30 bg-white/5"}`}>
                      <div className="text-lg mb-0.5">{r.icon}</div>
                      <div className="font-bold text-[11px] leading-tight">{r.name}</div>
                      <div className="text-[9px] text-white/40 mt-0.5 leading-tight">{r.bonus.split(",")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>}

            {authTab==="login" && <div className="mb-3">
              <label className="text-xs text-slate-400 mb-1 block">Логин</label>
              <input value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))}
                placeholder="admiral_nova" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
            </div>}

            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">Пароль</label>
              <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleAuth()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
            </div>

            {authErr&&<div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-2.5 mb-4">{authErr}</div>}

            <button onClick={handleAuth} disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
              {loading ? "⏳ Загружаем вашу империю..." : authTab==="login" ? "🌌 Войти в галактику" : "🚀 Основать империю"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ОСНОВНАЯ ИГРА
  // ═══════════════════════════════════════════════════════════════════════════
  const TABS: {id:TabId;label:string;icon:string}[] = [
    {id:"galaxy",    label:"Галактика", icon:"🌌"},
    {id:"colony",    label:"Колонии",   icon:"🏗️"},
    {id:"fleet",     label:"Флот",      icon:"🚀"},
    {id:"tech",      label:"Технологии",icon:"🔬"},
    {id:"battle",    label:"Битвы",     icon:"⚔️"},
    {id:"trade",     label:"Торговля",  icon:"💱"},
    {id:"chat",      label:"Чат",       icon:"💬"},
    {id:"alliance",  label:"Альянс",    icon:"🔱"},
    {id:"diplomacy", label:"Дипломатия",icon:"🤝"},
    {id:"ranking",   label:"Рейтинг",   icon:"🏆"},
    {id:"shop",      label:"Магазин",   icon:"💎"},
    {id:"quests",    label:"Задания",   icon:"📋"},
  ];

  if (!player) return null;
  const res = player;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${raceData.bg} text-white flex flex-col`}>

      {/* ── ШАПКА ────────────────────────────────────────────────────────────── */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-3 py-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{raceData.icon}</span>
              <div>
                <div className="font-black text-sm leading-tight">
                  {res.nickname}
                  <span className="text-white/40 font-normal ml-2 text-xs">{res.rank_title}</span>
                </div>
                <div className="text-[10px] text-white/40">{raceData.name} · ⭐{res.score} · 🏛️{res.colonies_count} колоний · ⚔️{res.battles_won}П</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {res.alliance_id && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">🔱 Альянс</span>}
              {/* Колокол оповещений */}
              <button onClick={()=>{ setShowEvents(e=>!e); if(!showEvents) loadEvents(); }}
                className="relative w-8 h-8 bg-white/5 hover:bg-white/15 rounded-lg flex items-center justify-center transition">
                🔔
                {unreadEvents>0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadEvents>9?"9+":unreadEvents}
                  </span>
                )}
              </button>
              <button onClick={logout} className="text-xs text-white/30 hover:text-white/70 transition px-2 py-1 rounded hover:bg-white/10">Выйти</button>
            </div>
          </div>

          {/* Ресурсы */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              ["⛏️","Металл",    res.metal],
              ["⚡","Энергия",   res.energy],
              ["💎","Кристаллы", res.crystals],
              ["👥","Население", res.population],
              ["⛽","Топливо",   res.fuel],
              ["🌑","Т.Материя", res.dark_matter],
            ].map(([ic,lb,v])=>(
              <div key={lb as string} className="flex-shrink-0 bg-white/10 rounded-lg px-2.5 py-1 text-center min-w-[60px]">
                <div className="text-sm">{ic}</div>
                <div className="font-black text-xs">{Number(v).toLocaleString()}</div>
                <div className="text-[9px] text-white/40">{lb}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ПАНЕЛЬ ОПОВЕЩЕНИЙ ─────────────────────────────────────────────────── */}
      {showEvents && (
        <div className="fixed top-[90px] right-3 z-50 w-96 max-h-[70vh] overflow-y-auto bg-slate-900/98 backdrop-blur rounded-2xl border border-white/20 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="font-black text-sm">🔔 Оповещения</div>
            <div className="flex gap-2">
              {unreadEvents>0&&<button onClick={readAllEvents} className="text-[10px] text-blue-400 hover:text-blue-300 transition">Прочитать все</button>}
              <button onClick={()=>setShowEvents(false)} className="text-white/40 hover:text-white transition text-lg leading-none">×</button>
            </div>
          </div>
          {aiEvents.length===0
            ? <div className="text-center text-white/30 py-8">Нет оповещений</div>
            : aiEvents.map(ev=>{
              const icons:Record<string,string> = {
                pirate_attack:"🚨", core_help:"👑", pirate_defeated:"🏆",
                wreck_appeared:"💥"
              };
              const colors:Record<string,string> = {
                pirate_attack:"border-red-500/30 bg-red-500/5",
                core_help:"border-yellow-500/30 bg-yellow-500/5",
                pirate_defeated:"border-green-500/30 bg-green-500/5",
                wreck_appeared:"border-amber-500/30 bg-amber-500/5",
              };
              return (
                <div key={ev.id} className={`px-4 py-3 border-b border-white/5 ${ev.read?"opacity-50":""} ${colors[ev.type]||"border-white/10"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{icons[ev.type]||"📋"}</span>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${ev.read?"text-white/60":"text-white"}`}>{ev.title}</div>
                      <div className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{ev.message}</div>
                      <div className="text-[9px] text-white/30 mt-1">{new Date(ev.date).toLocaleString("ru")}</div>
                    </div>
                    {!ev.read&&<div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1"/>}
                  </div>
                </div>
              );
            })
          }
          {/* Кнопка помощи Ядра */}
          {pirateFleets.some(pf=>pf.status==='attacking'&&pf.target_player_id===res.id) && (
            <div className="p-3 border-t border-white/10">
              <button onClick={requestCoreHelp}
                className="w-full py-2.5 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 rounded-xl text-sm font-black transition shadow-lg shadow-yellow-500/20">
                👑 Запросить помощь Стражей Ядра
              </button>
              {piratesMsg&&<div className={`mt-2 text-xs px-3 py-1 rounded-lg ${piratesMsg.startsWith("✅")?"text-green-400":"text-red-400"}`}>{piratesMsg}</div>}
            </div>
          )}
        </div>
      )}

      {/* ── НАВИГАЦИЯ ─────────────────────────────────────────────────────────── */}
      <div className="bg-black/30 border-b border-white/10 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all relative ${
                tab===t.id ? "border-blue-400 text-white bg-white/10" : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              }`}>
              {t.icon} {t.label}
              {t.id==="quests" && newQuestBadge && (
                <span className="absolute top-1.5 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 ${tab==="galaxy"?"w-full p-0":"max-w-7xl mx-auto w-full p-3"}`}>

        {/* ═══════════════ ГАЛАКТИКА ═══════════════ */}
        {tab==="galaxy" && (
          <div className="flex gap-0" style={{height:"calc(100vh - 130px)"}}>

            {/* ── Карта ── */}
            <div ref={mapWrapRef} className="flex-1 bg-slate-950 relative overflow-hidden select-none" style={{minHeight:0}}>

              {/* Подсказка управления */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-2 flex-wrap">
                <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 text-[10px] text-white/50 flex items-center gap-2">
                  <span>🖱️ тащи</span><span>·</span><span>⚲ зум</span><span>·</span><span>{systems.length} систем</span>
                </div>
                {/* Кнопка Моя колония */}
                {res.home_planet_id && (
                  <button onClick={async()=>{
                    let homeP = planets.find(p=>p.id===res.home_planet_id);
                    if (!homeP) { const d=await api(`${API.game}?action=galaxy`,{token}); if(d.planets){setPlanets(d.planets);setSystems(d.systems||systems);homeP=d.planets.find((p:Planet)=>p.id===res.home_planet_id);} }
                    if (homeP) {
                      const svgEl=svgRef.current; const rect=svgEl?.getBoundingClientRect();
                      const w=rect?.width||800,h=rect?.height||600,sc=2.5;
                      setMapScale(sc); setMapTx(w/2-homeP.pos_x*sc); setMapTy(h/2-homeP.pos_y*sc);
                      const sys=systems.find(s=>s.id===homeP!.star_system_id);
                      if(sys){setSelSystem(sys);setSelPlanet(homeP);}
                    }
                  }}
                  className="bg-green-900/80 hover:bg-green-800 backdrop-blur rounded-xl px-3 py-1.5 text-[10px] text-green-300 font-bold flex items-center gap-1.5 transition">
                    🏠 Моя колония
                  </button>
                )}
              </div>

              {/* Кнопки управления картой */}
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                <button onClick={()=>setMapScale(s=>Math.min(10,s*1.5))} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-base font-black flex items-center justify-center transition">+</button>
                <button onClick={()=>setMapScale(s=>Math.max(0.1,s*0.67))} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-base font-black flex items-center justify-center transition">−</button>
                <button onClick={resetMap} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-[10px] flex items-center justify-center transition" title="Вся галактика">🌌</button>
                <button onClick={async ()=>{
                  const svgEl = svgRef.current;
                  const rect = svgEl?.getBoundingClientRect();
                  const w = rect?.width||800; const h = rect?.height||600;
                  const scale = 2.5;

                  // Ищем домашнюю планету в уже загруженных
                  let homeP = planets.find(p=>p.id===res.home_planet_id);

                  // Если планеты ещё не загружены — грузим всю галактику
                  if (!homeP && res.home_planet_id) {
                    const d = await api(`${API.game}?action=galaxy`, {token});
                    if (d.planets) {
                      setPlanets(d.planets);
                      setSystems(d.systems || systems);
                      homeP = d.planets.find((p:Planet)=>p.id===res.home_planet_id);
                    }
                  }

                  if (homeP) {
                    setMapScale(scale);
                    setMapTx(w/2 - homeP.pos_x * scale);
                    setMapTy(h/2 - homeP.pos_y * scale);
                    // Открываем систему и выделяем планету
                    const sys = systems.find(s=>s.id===homeP!.star_system_id);
                    if (sys) { setSelSystem(sys); setSelPlanet(homeP); }
                  } else {
                    resetMap();
                  }
                }} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-sm flex items-center justify-center transition" title="На домашнюю планету">🏠</button>
              </div>

              {/* Легенда */}
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 text-[9px] text-white/50">
                <span><span className="text-green-400">●</span> Моя</span>
                <span><span className="text-red-400">●</span> ИИ</span>
                <span><span className="text-yellow-400">●</span> Игрок</span>
                <span><span className="text-white/30">●</span> Свободна</span>
                <span><span className="text-blue-300">➤</span> Мой флот</span>
                <span><span className="text-red-400">➤</span> Враг</span>
              </div>

              <svg
                ref={svgRef}
                width="100%" height="100%"
                viewBox="0 0 2400 2400"
                className="absolute inset-0"
                style={{cursor:"grab"}}
                onMouseDown={onSvgMouseDown}
                onMouseMove={onSvgMouseMove}
                onMouseUp={onSvgMouseUp}
                onMouseLeave={onSvgMouseUp}
                onWheel={onSvgWheel}
              >
                <g transform={`translate(${mapTx},${mapTy}) scale(${mapScale})`} style={{transformOrigin:"1200px 1200px"}}>

                  {/* Фоновые звёзды — заполняем всё поле 2400x2400 */}
                  {Array.from({length:600}).map((_,i)=>(
                    <circle key={i}
                      cx={(i*479.5)%2400} cy={(i*317.3)%2400}
                      r={(i%3===0)?1.4:(i%5===0)?0.9:0.5}
                      fill="white" opacity={(i%4===0)?0.45:(i%3===0)?0.25:0.12}/>
                  ))}

                  {/* Туманности — по всей карте */}
                  {[
                    {cx:1200,cy:1200,r:200,c:"#7c3aed"},{cx:200,cy:200,r:120,c:"#f59e0b"},
                    {cx:2200,cy:200,r:120,c:"#8b5cf6"},{cx:200,cy:2200,r:120,c:"#6b7280"},
                    {cx:2200,cy:2200,r:120,c:"#10b981"},{cx:200,cy:1200,r:100,c:"#06b6d4"},
                    {cx:2200,cy:1200,r:100,c:"#f1f5f9"},{cx:1200,cy:200,r:100,c:"#ec4899"},
                    {cx:1200,cy:2200,r:100,c:"#eab308"},{cx:700,cy:700,r:90,c:"#ef4444"},
                  ].map((n,i)=>(
                    <ellipse key={i} cx={n.cx} cy={n.cy} rx={n.r*2} ry={n.r} fill={n.c} opacity="0.05"/>
                  ))}

                  {/* Линии соединения систем одного сектора */}
                  {systems.flatMap(a=>
                    systems.filter(b=>b.id>a.id && b.sector===a.sector).map(b=>{
                      const d=Math.hypot(b.pos_x-a.pos_x,b.pos_y-a.pos_y);
                      if(d>450) return null;
                      const s = SECTOR_STYLES[a.sector];
                      return <line key={`${a.id}-${b.id}`} x1={a.pos_x} y1={a.pos_y} x2={b.pos_x} y2={b.pos_y}
                        stroke={s?.color||"white"} strokeWidth="0.8" opacity={0.08+0.06*(1-d/450)}/>;
                    })
                  )}

                  {/* Анимированные флоты */}
                  {animFleets.map(f=>{
                    const x = f.fromX + (f.toX-f.fromX)*f.progress;
                    const y = f.fromY + (f.toY-f.fromY)*f.progress;
                    const dx = f.toX-f.fromX; const dy = f.toY-f.fromY;
                    const angle = Math.atan2(dy,dx)*(180/Math.PI);
                    const col = f.owner ? "#60a5fa" : "#f87171";
                    const trail = 18;
                    const tx = x - Math.cos(Math.atan2(dy,dx))*trail;
                    const ty = y - Math.sin(Math.atan2(dy,dx))*trail;
                    return (
                      <g key={f.id}>
                        <line x1={tx} y1={ty} x2={x} y2={y} stroke={col} strokeWidth="1" opacity="0.35"/>
                        <g transform={`translate(${x},${y}) rotate(${angle})`}>
                          <polygon points="-4,2 4,0 -4,-2" fill={col} opacity="0.9"/>
                        </g>
                        <circle cx={x} cy={y} r="2.5" fill={col} opacity="0.2"/>
                      </g>
                    );
                  })}

                  {/* Обломки пиратов — мерцающие жёлтые обломки */}
                  {pirateWrecks.map(w=>(
                    <g key={`wreck-${w.id}`} style={{cursor:"pointer"}}
                      onClick={()=>salvageWreck(w.id)}>
                      <circle cx={w.pos_x} cy={w.pos_y} r="10" fill="#f59e0b" opacity="0.12"/>
                      <circle cx={w.pos_x} cy={w.pos_y} r="6"  fill="#f59e0b" opacity="0.25">
                        <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <text x={w.pos_x} y={w.pos_y+4} textAnchor="middle" fontSize="8" fill="#fbbf24">💥</text>
                      <text x={w.pos_x} y={w.pos_y+16} textAnchor="middle" fontSize="6" fill="#f59e0b" opacity="0.8">
                        обломки
                      </text>
                    </g>
                  ))}

                  {/* Флоты игрока на карте — с маршрутами и временем полёта */}
                  {fleets.filter(f=>f.status==="moving" && f.pos_x && f.pos_y).map(f=>{
                    const targetP = planets.find(p=>p.id===f.target_id);
                    return (
                      <g key={`fleet-map-${f.id}`} style={{pointerEvents:"none"}}>
                        {/* Линия маршрута */}
                        {targetP && (
                          <line x1={f.pos_x} y1={f.pos_y} x2={targetP.pos_x} y2={targetP.pos_y}
                            stroke="#60a5fa" strokeWidth="1" opacity="0.3" strokeDasharray="12 6"/>
                        )}
                        {/* Значок флота */}
                        <circle cx={f.pos_x} cy={f.pos_y} r="8" fill="#1d4ed8" opacity="0.8"/>
                        <circle cx={f.pos_x} cy={f.pos_y} r="8" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite"/>
                        </circle>
                        <text x={f.pos_x} y={f.pos_y+4} textAnchor="middle" fontSize="8">🚀</text>
                        {/* Подпись с именем */}
                        <text x={f.pos_x} y={f.pos_y-12} textAnchor="middle"
                          fontSize="6" fill="#93c5fd" fontWeight="bold">{f.name}</text>
                      </g>
                    );
                  })}

                  {/* Мои планеты — зелёный маркер */}
                  {planets.filter(p=>p.owner_id===res.id).map(p=>(
                    <g key={`myplanet-${p.id}`} style={{cursor:"pointer"}}
                      onClick={()=>{ setSelPlanet(p); const sys=systems.find(s=>s.id===p.star_system_id); if(sys)setSelSystem(sys); }}>
                      <circle cx={p.pos_x} cy={p.pos_y} r="6" fill="#22c55e" opacity="0.2"/>
                      <circle cx={p.pos_x} cy={p.pos_y} r="3" fill="#4ade80" opacity="0.9"/>
                      {p.id===res.home_planet_id && (
                        <text x={p.pos_x} y={p.pos_y-7} textAnchor="middle" fontSize="7" fill="#86efac">🏠</text>
                      )}
                    </g>
                  ))}

                  {/* Пиратские флоты — красные/оранжевые значки с анимацией при атаке */}
                  {pirateFleets.map(pf=>{
                    const isAttacking = pf.status === 'attacking';
                    const isWrecked   = pf.status === 'wrecked';
                    if (isWrecked) return null;
                    const col = isAttacking ? "#ef4444" : "#f97316";
                    const size = 5 + pf.tier;
                    return (
                      <g key={`pirate-${pf.id}`} style={{pointerEvents:"none"}}>
                        {isAttacking && (
                          <circle cx={pf.pos_x} cy={pf.pos_y} r={size+8} fill={col} opacity="0.15">
                            <animate attributeName="r" values={`${size+4};${size+14};${size+4}`} dur="0.8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="0.8s" repeatCount="indefinite"/>
                          </circle>
                        )}
                        <circle cx={pf.pos_x} cy={pf.pos_y} r={size+2} fill={col} opacity="0.2"/>
                        <circle cx={pf.pos_x} cy={pf.pos_y} r={size} fill={col} opacity={isAttacking?0.95:0.7}/>
                        {/* Череп */}
                        <text x={pf.pos_x} y={pf.pos_y+3} textAnchor="middle" fontSize={size*1.4}
                          opacity={isAttacking?1:0.8}>☠️</text>
                        {/* Название при атаке */}
                        {isAttacking && (
                          <text x={pf.pos_x} y={pf.pos_y-size-5} textAnchor="middle"
                            fontSize="7" fill="#ef4444" fontWeight="bold" opacity="0.9">
                            ⚔️ {pf.name}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Флот Ядра — золотой */}
                  {coreFleet && (() => {
                    const cf = coreFleet;
                    const isMoving = cf.status === 'en_route' || cf.status === 'fighting';
                    return (
                      <g key="core-fleet" style={{pointerEvents:"none"}}>
                        {/* Золотое свечение */}
                        <circle cx={cf.pos_x} cy={cf.pos_y} r="22" fill="#f59e0b" opacity="0.15">
                          {isMoving && <animate attributeName="r" values="18;28;18" dur="1.5s" repeatCount="indefinite"/>}
                        </circle>
                        <circle cx={cf.pos_x} cy={cf.pos_y} r="15" fill="#f59e0b" opacity="0.25"/>
                        <circle cx={cf.pos_x} cy={cf.pos_y} r="10" fill="#fbbf24" opacity={isMoving?0.95:0.8}/>
                        {/* Корона */}
                        <text x={cf.pos_x} y={cf.pos_y+4} textAnchor="middle" fontSize="12">👑</text>
                        <text x={cf.pos_x} y={cf.pos_y-18} textAnchor="middle"
                          fontSize="7" fill="#fbbf24" fontWeight="bold" opacity="0.9">
                          {isMoving ? "🚀 Стражи летят!" : "Стражи Ядра"}
                        </text>
                        {/* Линия маршрута при движении */}
                        {isMoving && cf.target_player_id && pirateFleets
                          .filter(pf=>pf.target_player_id===cf.target_player_id && pf.status==='attacking')
                          .map(pf=>(
                            <line key="core-route"
                              x1={cf.pos_x} y1={cf.pos_y} x2={pf.pos_x} y2={pf.pos_y}
                              stroke="#f59e0b" strokeWidth="1.5" opacity="0.35" strokeDasharray="8 4"/>
                          ))}
                      </g>
                    );
                  })()}

                  {/* Большие ореолы галактик рас — один на каждый уникальный сектор */}
                  {Object.entries(SECTOR_STYLES).map(([sector, s])=>{
                    const sectorSystems = systems.filter(sy=>sy.sector===sector);
                    if (!sectorSystems.length) return null;
                    // Центр галактики расы = среднее по всем системам сектора
                    const cx = sectorSystems.reduce((a,sy)=>a+sy.pos_x,0)/sectorSystems.length;
                    const cy = sectorSystems.reduce((a,sy)=>a+sy.pos_y,0)/sectorSystems.length;
                    const isCore = sector==="core";
                    // Радиус ореола охватывает все системы + отступ
                    const maxDist = sectorSystems.reduce((m,sy)=>Math.max(m,Math.hypot(sy.pos_x-cx,sy.pos_y-cy)),0);
                    const haloR = Math.max(isCore?200:180, maxDist+180);
                    return (
                      <g key={`galaxy-halo-${sector}`} style={{pointerEvents:"none"}}>
                        <circle cx={cx} cy={cy} r={haloR*1.3} fill={s.color} opacity="0.025"/>
                        <circle cx={cx} cy={cy} r={haloR} fill={s.color} opacity={isCore?"0.07":"0.05"}/>
                        <circle cx={cx} cy={cy} r={haloR} fill="none" stroke={s.color}
                          strokeWidth={isCore?"2":"1"}
                          opacity={isCore?"0.5":"0.3"}
                          strokeDasharray={isCore?"":"10 6"}/>
                        <text x={cx} y={cy-haloR-10} textAnchor="middle"
                          fill={s.color} fontSize="20" opacity="0.7" fontWeight="bold">
                          {s.icon}
                        </text>
                        <text x={cx} y={cy-haloR+10} textAnchor="middle"
                          fill={s.color} fontSize="11" opacity="0.55" fontWeight="bold">
                          {s.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Звёздные системы с мини-планетами вокруг них */}
                  {systems.map(sys=>{
                    const isSelected = selSystem?.id===sys.id;
                    const col = STAR_COLORS[sys.star_type] || "#f59e0b";
                    const r = (sys.star_size||5)*1.4+3;
                    const hasMine = planets.some(p=>p.star_system_id===sys.id && p.owner_id===res.id);
                    const sectorStyle = SECTOR_STYLES[sys.sector];
                    const n = sys.planet_count || 0;
                    // Мини-орбиты: 3 кольца вокруг звезды для видимости на обзорной карте
                    // орбиты пропорционально звезде
                    const miniOrbitStep = r * 1.8 + 6;

                    return (
                      <g key={sys.id}>
                        {/* Мини-планеты вокруг звезды — видны на обзорной карте */}
                        {n > 0 && Array.from({length: Math.min(n, 6)}).map((_, pi) => {
                          const orbitR2 = r + 8 + pi * miniOrbitStep;
                          const startDeg = (pi / Math.min(n,6)) * 360 - 90;
                          const period2 = 12 + pi * 8;
                          const pCol = ["#22c55e","#06b6d4","#f97316","#a78bfa","#f59e0b","#ec4899"][pi % 6];
                          return (
                            <g key={`mp-${sys.id}-${pi}`} style={{pointerEvents:"none"}}>
                              {/* Кольцо орбиты */}
                              <circle cx={sys.pos_x} cy={sys.pos_y} r={orbitR2}
                                fill="none" stroke={sectorStyle?.color||"white"}
                                strokeWidth="0.3" opacity="0.12"/>
                              {/* Планета с анимацией */}
                              <circle cx={sys.pos_x} cy={sys.pos_y} r={2.2} fill={pCol} opacity="0.8">
                                <animateTransform
                                  attributeName="transform"
                                  type="rotate"
                                  from={`${startDeg} ${sys.pos_x} ${sys.pos_y}`}
                                  to={`${startDeg+360} ${sys.pos_x} ${sys.pos_y}`}
                                  dur={`${period2}s`}
                                  repeatCount="indefinite"/>
                              </circle>
                              {/* Маленький трейл планеты */}
                              <circle cx={sys.pos_x} cy={sys.pos_y-orbitR2} r={1.4}
                                fill={pCol} opacity="0.5"
                                style={{display:"none"}}>
                              </circle>
                            </g>
                          );
                        })}

                        {/* Сама звезда — поверх планет */}
                        <g onClick={()=>{ if(!didDrag.current) loadSystem(sys); }} style={{cursor:"pointer"}}>
                          {hasMine && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+14} fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" strokeDasharray="3 3"/>}
                          {sys.sector==="core" && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+18} fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7" strokeDasharray="5 3"/>}
                          {isSelected && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+10} fill="none" stroke={col} strokeWidth="1.5" opacity="0.8" strokeDasharray="4 2"/>}
                          {/* Свечение звезды */}
                          <circle cx={sys.pos_x} cy={sys.pos_y} r={r+5} fill={col} opacity="0.12"/>
                          {/* Тело звезды */}
                          <circle cx={sys.pos_x} cy={sys.pos_y} r={r} fill={col} opacity={isSelected?1:0.9}/>
                          {/* Блик */}
                          <circle cx={sys.pos_x-r*0.3} cy={sys.pos_y-r*0.3} r={r*0.25} fill="white" opacity="0.3"/>
                          {/* Название */}
                          <text x={sys.pos_x} y={sys.pos_y+r+8+n*miniOrbitStep/2} textAnchor="middle"
                            fill="white" fontSize={6/mapScale+4.5} opacity="0.6">{sys.name}</text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Планеты активной системы — раздельные кольца, без касания, с анимацией */}
                  {selSystem && sysDetail && (() => {
                    const pls = sysDetail.planets || [];
                    if (!pls.length) return null;

                    // Радиус самой звезды (визуальный)
                    const starR = (selSystem.star_size||5)*1.4 + 14;
                    // Зазор между краем кольца одной планеты и краем кольца следующей
                    const GAP = 16;

                    // Предварительно считаем радиус каждой планеты
                    // size в БД — число ~50-250, нормируем в 5..11px
                    const planetR = pls.map((p:Planet) =>
                      Math.round(5 + Math.min((p.size||80) / 28, 6))
                    );

                    // Строим орбиты: кольцо i начинается там где кончается кольцо (i-1) + GAP
                    // Орбитный радиус = расстояние от центра звезды до центра планеты
                    const orbitRadii: number[] = [];
                    let cursor = starR + GAP;
                    for (let i = 0; i < pls.length; i++) {
                      cursor += planetR[i]; // центр планеты
                      orbitRadii.push(cursor);
                      cursor += planetR[i] + GAP; // правый край + зазор до следующей
                    }

                    // Скорость вращения: внутренние быстрее (обратно пропорционально радиусу)
                    // Период в секундах: от 18s (ближняя) до 90s (дальняя)
                    const minR = orbitRadii[0];
                    const maxR = orbitRadii[orbitRadii.length - 1] || minR;
                    const periodOf = (r: number) =>
                      minR === maxR ? 30 : 18 + ((r - minR) / (maxR - minR)) * 72;

                    // Стартовые углы — равномерно разбросаны чтобы не стартовали в куче
                    const startAngles = pls.map((_:Planet, i:number) =>
                      (i / pls.length) * 360 - 90
                    );

                    return pls.map((p:Planet, i:number) => {
                      const orbitR  = orbitRadii[i];
                      const pr      = planetR[i];
                      const col     = PLANET_COLORS[p.planet_type] || "#94a3b8";
                      const strokeCol = p.owner_id===res.id
                        ? "#22c55e" : p.is_ai_controlled
                        ? "#ef4444" : p.owner_id
                        ? "#f59e0b" : "none";
                      const isSelP  = selPlanet?.id===p.id;
                      const period  = periodOf(orbitR);
                      const cx      = selSystem.pos_x;
                      const cy      = selSystem.pos_y;

                      return (
                        <g key={p.id}>
                          {/* Орбитальное кольцо — статичное */}
                          <circle cx={cx} cy={cy} r={orbitR}
                            fill="none" stroke="white" strokeWidth="0.35"
                            opacity={isSelP ? "0.22" : "0.10"}/>

                          {/* Группа вращения вокруг центра звезды */}
                          <g
                            onClick={e=>{
                              e.stopPropagation();
                              setSelPlanet(p);
                              setSpyPanel(false);
                              // Контекстное меню при клике
                              const rect = svgRef.current?.getBoundingClientRect();
                              if (rect) {
                                const sx = cx + mapTx;
                                const sy = (cy - orbitR) * mapScale + mapTy;
                                setPlanetMenu({planet:p, x: e.clientX - rect.left, y: e.clientY - rect.top});
                              }
                            }}
                            style={{cursor:"pointer"}}>
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from={`${startAngles[i]} ${cx} ${cy}`}
                              to={`${startAngles[i]+360} ${cx} ${cy}`}
                              dur={`${period}s`}
                              repeatCount="indefinite"/>

                            {/* Выделение выбранной */}
                            {isSelP && (
                              <circle cx={cx} cy={cy-orbitR} r={pr+5}
                                fill="none" stroke={col}
                                strokeWidth="1.3" strokeDasharray="3 2" opacity="0.9"/>
                            )}
                            {/* Свечение */}
                            <circle cx={cx} cy={cy-orbitR} r={pr+3.5}
                              fill={col} opacity="0.14"/>
                            {/* Планета */}
                            <circle cx={cx} cy={cy-orbitR} r={pr}
                              fill={col}
                              opacity={isSelP ? 1 : 0.88}
                              stroke={strokeCol}
                              strokeWidth={strokeCol!=="none" ? "1.8" : "0"}/>
                            {/* Блик */}
                            <circle cx={cx-pr*0.3} cy={cy-orbitR-pr*0.3} r={pr*0.3}
                              fill="white" opacity="0.25"/>
                          </g>
                        </g>
                      );
                    });
                  })()}
                </g>
              </svg>

              {/* ── Контекстное меню планеты ──────────────────────────────── */}
              {planetMenu && (
                <div
                  className="absolute z-40 bg-slate-900/98 backdrop-blur border border-white/20 rounded-2xl shadow-2xl shadow-black/60 p-2 w-52"
                  style={{left: Math.min(planetMenu.x+8, (mapWrapRef.current?.clientWidth||700)-220), top: Math.min(planetMenu.y+8, (mapWrapRef.current?.clientHeight||500)-300)}}
                  onMouseLeave={()=>setPlanetMenu(null)}>
                  <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-2">
                    <span style={{color:PLANET_COLORS[planetMenu.planet.planet_type]||"#94a3b8"}}>●</span>
                    <div>
                      <div className="font-bold text-xs">{planetMenu.planet.name}</div>
                      <div className="text-[9px] text-white/40">{planetMenu.planet.planet_type} · Размер {planetMenu.planet.size}</div>
                    </div>
                  </div>
                  {/* Статус */}
                  <div className="text-[10px] text-white/50 mb-2 px-1">
                    {planetMenu.planet.owner_id===res.id ? "✅ Ваша колония" : planetMenu.planet.is_ai_controlled ? `🤖 ИИ ур.${planetMenu.planet.ai_fleet_tier}` : planetMenu.planet.owner_id ? `👤 Игрок` : "🆓 Свободна"}
                  </div>
                  {/* Выбор флота */}
                  <select value={battleFleetId||""} onChange={e=>setBattleFleetId(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-[10px] mb-1.5">
                    <option value="">— флот —</option>
                    {fleets.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div className="space-y-1">
                    <button onClick={()=>{if(battleFleetId)sendFleetTo(battleFleetId,planetMenu.planet.id);setPlanetMenu(null);}}
                      disabled={!battleFleetId}
                      className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg text-[10px] font-bold transition">
                      🚀 Лететь
                    </button>
                    {!planetMenu.planet.owner_id && !planetMenu.planet.is_ai_controlled && (
                      <button onClick={()=>{if(battleFleetId)doColonize(battleFleetId,planetMenu.planet.id);setPlanetMenu(null);}}
                        disabled={!battleFleetId}
                        className="w-full py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg text-[10px] font-bold transition">
                        🪐 Колонизировать
                      </button>
                    )}
                    {(planetMenu.planet.is_ai_controlled || (planetMenu.planet.owner_id && planetMenu.planet.owner_id!==res.id)) && (
                      <button onClick={()=>{if(battleFleetId)doAttack(battleFleetId,planetMenu.planet.id);setPlanetMenu(null);}}
                        disabled={!battleFleetId}
                        className="w-full py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg text-[10px] font-bold transition">
                        ⚔️ Атаковать
                      </button>
                    )}
                    {fleets.some(f=>Object.keys(f.ships||{}).some(s=>['miner_small','miner_medium','miner_large'].includes(s))) && (
                      <button onClick={()=>{setMineFleetId(battleFleetId);setMinePlanetId(planetMenu.planet.id);doMine();setPlanetMenu(null);}}
                        disabled={!battleFleetId}
                        className="w-full py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 rounded-lg text-[10px] font-bold transition">
                        ⛏️ Добыча руды
                      </button>
                    )}
                    {fleets.some(f=>Object.keys(f.ships||{}).some(s=>['salvager_drone','salvager_light','salvager_medium','salvager_heavy','salvager_titan'].includes(s))) && pirateWrecks.length>0 && (
                      <button onClick={()=>{const w=pirateWrecks[0];salvageWreck(w.id);setPlanetMenu(null);}}
                        className="w-full py-1.5 bg-amber-900 hover:bg-amber-800 rounded-lg text-[10px] font-bold transition">
                        💥 Собрать обломки
                      </button>
                    )}
                    {planetMenu.planet.owner_id===res.id && (
                      <button onClick={()=>{
                        loadStation(planetMenu.planet.id);
                        setShowStation(true);
                        setPlanetMenu(null);
                      }}
                        className="w-full py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-[10px] font-bold transition">
                        🛸 Орбитальная станция
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Мини-карта (кликабельная) ─────────────────────────────── */}
              {(() => {
                const wrapW = mapWrapRef.current?.clientWidth  || 700;
                const wrapH = mapWrapRef.current?.clientHeight || 500;
                const viewW = wrapW / mapScale;
                const viewH = wrapH / mapScale;
                const viewX = -mapTx / mapScale;
                const viewY = -mapTy / mapScale;
                const rx = Math.max(0, Math.min(MINI - 4, viewX * miniScale));
                const ry = Math.max(0, Math.min(MINI - 4, viewY * miniScale));
                const rw = Math.max(4, Math.min(MINI, viewW * miniScale));
                const rh = Math.max(4, Math.min(MINI, viewH * miniScale));

                const handleMiniClick = (e: React.MouseEvent<SVGSVGElement>) => {
                  const svgEl = e.currentTarget;
                  const rect  = svgEl.getBoundingClientRect();
                  // Координаты клика в пространстве мини-карты
                  const mx = e.clientX - rect.left;
                  const my = e.clientY - rect.top;
                  // Переводим в мировые координаты
                  const worldX = mx / miniScale;
                  const worldY = my / miniScale;
                  // Центрируем viewport на этой точке
                  setMapTx(wrapW / 2 - worldX * mapScale);
                  setMapTy(wrapH / 2 - worldY * mapScale);
                };

                return (
                  <div className="absolute bottom-10 right-2 z-20" style={{width:MINI}}>
                    <svg
                      width={MINI} height={MINI}
                      viewBox={`0 0 ${MINI} ${MINI}`}
                      onClick={handleMiniClick}
                      className="rounded-xl border border-white/20 bg-slate-950/90 backdrop-blur shadow-xl shadow-black/60 cursor-crosshair"
                      style={{display:"block"}}
                    >
                      <rect width={MINI} height={MINI} fill="#020617" rx="10"/>

                      {/* Цветные зоны галактик рас — вычисляем из реальных позиций систем */}
                      {Object.entries(SECTOR_STYLES).map(([sector, s]) => {
                        const ss = systems.filter(sy => sy.sector === sector);
                        if (!ss.length) return null;
                        const cx = ss.reduce((a,sy)=>a+sy.pos_x,0)/ss.length * miniScale;
                        const cy = ss.reduce((a,sy)=>a+sy.pos_y,0)/ss.length * miniScale;
                        return (
                          <g key={sector}>
                            <circle cx={cx} cy={cy} r={14} fill={s.color} opacity="0.18"/>
                            <text x={cx} y={cy+4} textAnchor="middle" fontSize="8" opacity="0.75">{s.icon}</text>
                          </g>
                        );
                      })}

                      {/* Точки систем */}
                      {systems.map(sys => {
                        const sx  = sys.pos_x * miniScale;
                        const sy  = sys.pos_y * miniScale;
                        const s   = SECTOR_STYLES[sys.sector];
                        const col = s?.color || "#94a3b8";
                        const isHome = planets.some(p => p.id === res.home_planet_id && p.star_system_id === sys.id);
                        const hasMine = planets.some(p => p.star_system_id === sys.id && p.owner_id === res.id);
                        const isSel   = selSystem?.id === sys.id;
                        return (
                          <g key={sys.id}>
                            {(hasMine||isHome) && <circle cx={sx} cy={sy} r={3} fill="#22c55e" opacity="0.5"/>}
                            <circle cx={sx} cy={sy} r={isSel?2.8:1.5}
                              fill={isSel?"#fff":col} opacity={isSel?1:0.75}/>
                          </g>
                        );
                      })}

                      {/* Viewport рамка */}
                      <rect x={rx} y={ry} width={rw} height={rh}
                        fill="white" fillOpacity="0.07"
                        stroke="white" strokeWidth="1" strokeOpacity="0.6" rx="2"/>

                      {/* Маркер центра видимой области */}
                      <circle
                        cx={Math.min(MINI-2, Math.max(2, rx + rw/2))}
                        cy={Math.min(MINI-2, Math.max(2, ry + rh/2))}
                        r="2" fill="white" opacity="0.5"/>

                      <rect x="0.5" y="0.5" width={MINI-1} height={MINI-1}
                        fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" rx="10"/>
                    </svg>
                    <div className="text-center text-[8px] text-white/25 mt-0.5 select-none tracking-wider">
                      МИНИ-КАРТА · клик = перейти
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* ── Боковая панель ── */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto bg-slate-950/95 border-l border-white/10 p-2" style={{height:"100%"}}>

              {/* Загрузка флотов для панели */}
              {tab==="galaxy" && fleets.length===0 && (
                <button onClick={()=>api(`${API.game}?action=fleets`,{token}).then(d=>{if(d.fleets)setFleets(d.fleets);})}
                  className="text-[10px] text-blue-400 hover:text-blue-300 text-center py-1 transition">
                  Загрузить мои флоты ↓
                </button>
              )}

              {/* Статус пиратов — предупреждение при атаке */}
              {pirateFleets.filter(pf=>pf.status==='attacking'&&pf.target_player_id===res.id).map(pf=>(
                <div key={`atk-${pf.id}`}
                  className="bg-red-950/80 border border-red-500/40 rounded-xl p-2.5 flex-shrink-0 animate-pulse">
                  <div className="font-black text-sm text-red-300 mb-1">🚨 Пираты атакуют!</div>
                  <div className="text-[10px] text-white/70">
                    <span className="font-bold">☠️ {pf.name}</span> тир {pf.tier}<br/>
                    ⚔️{pf.attack} атака · 🛡️{pf.defense} защита
                  </div>
                  <button onClick={requestCoreHelp}
                    className="w-full mt-2 py-1.5 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-[10px] font-black transition">
                    👑 Помощь Ядра
                  </button>
                </div>
              ))}

              {/* Обломки поблизости */}
              {pirateWrecks.length>0 && (
                <div className="bg-amber-950/60 border border-amber-500/30 rounded-xl p-2.5 flex-shrink-0">
                  <div className="font-bold text-xs text-amber-300 mb-1.5">💥 Обломки пиратов</div>
                  {pirateWrecks.slice(0,3).map(w=>(
                    <div key={w.id} className="flex items-center justify-between mb-1 text-[10px]">
                      <span className="text-white/60">⛏️{w.metal} ⚡{w.energy} 💎{w.crystals}</span>
                      <button onClick={()=>salvageWreck(w.id)}
                        className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 rounded-lg text-[10px] font-bold transition">
                        Собрать
                      </button>
                    </div>
                  ))}
                  {piratesMsg&&<div className={`text-[10px] mt-1 ${piratesMsg.startsWith("✅")?"text-green-400":"text-red-400"}`}>{piratesMsg}</div>}
                </div>
              )}

              {/* Статус флота Ядра */}
              {coreFleet && (
                <div className={`rounded-xl p-2.5 flex-shrink-0 border ${coreFleet.status==='en_route'?"bg-yellow-950/60 border-yellow-500/30 animate-pulse":"bg-slate-800/60 border-white/10"}`}>
                  <div className="font-bold text-xs text-yellow-300 mb-0.5">👑 Стражи Ядра</div>
                  <div className="text-[10px] text-white/50">
                    {coreFleet.status==='guarding'?'🛡️ Охраняют Ядро':
                     coreFleet.status==='en_route'?'🚀 Летят на помощь!':
                     coreFleet.status==='fighting'?'⚔️ В бою!':'↩️ Возвращаются'}
                  </div>
                  {coreFleet.status==='guarding' && !res.alliance_id && (
                    <button onClick={requestCoreHelp}
                      className="w-full mt-1.5 py-1 bg-yellow-800/60 hover:bg-yellow-700 rounded-lg text-[10px] font-bold transition text-yellow-200">
                      👑 Запросить помощь
                    </button>
                  )}
                </div>
              )}

              {/* Поиск колоний */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <input
                    value={colonySearch}
                    onChange={e=>setColonySearch(e.target.value)}
                    placeholder="🔍 Поиск колонии или планеты..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:border-blue-500 transition placeholder:text-white/30"
                  />
                  {colonySearch && (
                    <button onClick={()=>setColonySearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs">✕</button>
                  )}
                </div>
                {colonySearch.trim() && (() => {
                  const q = colonySearch.toLowerCase();
                  const results = planets.filter(p=>
                    p.name?.toLowerCase().includes(q) ||
                    (p.owner_id===res.id && p.owner_race?.toLowerCase().includes(q))
                  ).slice(0, 8);
                  if (results.length===0) return (
                    <div className="text-[10px] text-white/30 text-center py-2">Ничего не найдено</div>
                  );
                  return (
                    <div className="mt-1 space-y-1">
                      {results.map(p=>{
                        const sys = systems.find(s=>s.id===p.star_system_id);
                        const isMine = p.owner_id===res.id;
                        return (
                          <button key={p.id} onClick={()=>{
                            setSelPlanet(p);
                            if (sys) {
                              setSelSystem(sys);
                              const svgEl = svgRef.current;
                              const rect = svgEl?.getBoundingClientRect();
                              const w=rect?.width||800, h=rect?.height||600, sc=2.5;
                              setMapScale(sc);
                              setMapTx(w/2 - p.pos_x*sc);
                              setMapTy(h/2 - p.pos_y*sc);
                            }
                            setColonySearch("");
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl border text-[10px] transition-all
                            ${isMine?"border-green-500/30 bg-green-500/5 hover:bg-green-500/10":"border-white/10 bg-white/5 hover:border-white/30"}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate">{p.name}</span>
                              <span className="text-white/40 ml-1 flex-shrink-0">{p.planet_type}</span>
                            </div>
                            <div className="text-white/40 mt-0.5">
                              {isMine ? "✅ Моя колония" : p.is_ai_controlled ? "🤖 ИИ" : p.owner_id ? "👤 Игрок" : "🆓 Свободна"}
                              {sys && <span className="ml-1">· {sys.name}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Выбранная система */}
              {selSystem ? (
                <div className="bg-slate-900/80 rounded-2xl p-3 border border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl" style={{color:STAR_COLORS[selSystem.star_type]||"#f59e0b"}}>★</span>
                    <div>
                      <div className="font-black text-sm">{selSystem.name}</div>
                      <div className="text-[10px] text-white/40">Сектор {selSystem.sector} · {selSystem.star_type}</div>
                    </div>
                  </div>
                  {sysDetail ? (
                    <div className="space-y-1">
                      {(sysDetail.planets||[]).map((p:Planet)=>(
                        <button key={p.id} onClick={()=>{setSelPlanet(p);setSpyPanel(false);setSpyResult(null);}}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all ${selPlanet?.id===p.id?"bg-blue-500/20 border-blue-500/40":"bg-white/5 border-white/10 hover:border-white/30"}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{p.name}</span>
                            <span style={{color:PLANET_COLORS[p.planet_type]||"#94a3b8"}} className="text-[10px]">● {p.planet_type}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">
                            {p.owner_id===res.id?"✅ Моя":p.is_ai_controlled?`🤖 ИИ ${p.ai_fleet_tier}`:p.owner_id?`👤 ${p.owner_nickname}`:"🆓 Свободна"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : <div className="text-[10px] text-white/30 py-2 text-center">Загрузка...</div>}
                </div>
              ) : (
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 text-center text-white/30 flex-shrink-0">
                  <div className="text-4xl mb-2">🌌</div>
                  <div className="text-sm">Нажмите на звёздную систему</div>
                  <div className="text-[10px] mt-1 text-white/20">Перемещение: зажми и тащи</div>
                </div>
              )}

              {/* Выбранная планета */}
              {selPlanet && (
                <div className="bg-slate-900/80 rounded-2xl p-3 border border-white/10 flex-shrink-0">
                  <div className="font-black text-sm mb-0.5 flex items-center gap-1.5">
                    <span style={{color:PLANET_COLORS[selPlanet.planet_type]||"#94a3b8"}}>●</span>
                    {selPlanet.name}
                  </div>
                  <div className="text-[10px] text-white/40 mb-2">{selPlanet.planet_type} · Размер {selPlanet.size}</div>
                  <div className="grid grid-cols-3 gap-1 mb-2.5 text-[10px]">
                    <div className="bg-white/5 rounded-lg p-1 text-center"><div>⛏️</div><div>{selPlanet.metal_richness}x</div></div>
                    <div className="bg-white/5 rounded-lg p-1 text-center"><div>⚡</div><div>{selPlanet.energy_richness}x</div></div>
                    <div className="bg-white/5 rounded-lg p-1 text-center"><div>💎</div><div>{selPlanet.crystal_richness}x</div></div>
                  </div>
                  <div className="text-xs mb-2.5">
                    {selPlanet.owner_id===res.id
                      ? <span className="text-green-400 font-bold">✅ Ваша колония</span>
                      : selPlanet.is_ai_controlled
                        ? <span className="text-red-400">🤖 ИИ-гарнизон ур.{selPlanet.ai_fleet_tier}</span>
                        : selPlanet.owner_id
                          ? <span className="text-yellow-400">👤 {selPlanet.owner_nickname}</span>
                          : <span className="text-green-300">🆓 Свободная планета</span>}
                    {selPlanet.special_resource && <span className="ml-2 text-purple-400">✨ {selPlanet.special_resource}</span>}
                  </div>

                  {/* Действия с планетой */}
                  <div className="space-y-1.5">
                    {fleets.length>0 ? (
                      <>
                        <select value={battleFleetId||""} onChange={e=>{setBattleFleetId(Number(e.target.value));setMineFleetId(Number(e.target.value));setMinePlanetId(selPlanet.id);}}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-[10px]">
                          <option value="">— выбрать флот —</option>
                          {fleets.map(f=>(
                            <option key={f.id} value={f.id}>
                              {f.status==="moving"?"🚀":f.status==="orbit"?"🪐":"⚓"} {f.name} ⚔️{f.total_attack}
                            </option>
                          ))}
                        </select>
                        {/* Кнопка Лететь — всегда доступна при выбранном флоте */}
                        <button
                          onClick={()=>battleFleetId && sendFleetTo(battleFleetId, selPlanet.id)}
                          disabled={!battleFleetId}
                          className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-white/5 disabled:text-white/30 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1">
                          🚀 Лететь на планету
                        </button>
                      </>
                    ) : <div className="text-[10px] text-white/30 text-center bg-white/5 rounded-lg p-1.5">Нет флотов → вкладка Флот</div>}

                    {selPlanet.owner_id !== res.id && <>
                      {/* Свободная — только колонизация */}
                      {!selPlanet.owner_id && !selPlanet.is_ai_controlled && (
                        <button onClick={()=>battleFleetId&&doColonize(battleFleetId,selPlanet.id)} disabled={!battleFleetId}
                          className="w-full py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-white/5 disabled:text-white/30 rounded-xl text-[10px] font-bold transition">
                          🪐 Колонизировать планету
                        </button>
                      )}
                      {/* Враг или ИИ — атака */}
                      {(selPlanet.owner_id || selPlanet.is_ai_controlled) && (
                        <button onClick={()=>battleFleetId&&doAttack(battleFleetId,selPlanet.id)} disabled={!battleFleetId}
                          className="w-full py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/30 rounded-xl text-[10px] font-bold transition">
                          ⚔️ Атаковать {selPlanet.is_ai_controlled?`(ИИ ур.${selPlanet.ai_fleet_tier})`:""}
                        </button>
                      )}
                      {/* Шпионаж */}
                      {selPlanet.owner_id && (
                        <button onClick={()=>{setSpyPanel(!spyPanel);setSpyTarget(selPlanet);setSpyResult(null);}}
                          className={`w-full py-1.5 rounded-xl text-[10px] font-bold transition ${spyPanel?"bg-purple-700":"bg-purple-900/50 hover:bg-purple-800"}`}>
                          🕵️ Шпионаж
                        </button>
                      )}
                    </>}

                    {/* Добыча кораблями (на своей или свободной) */}
                    {fleets.some(f=>Object.keys(f.ships||{}).some(s=>SHIPS[s]?.mining)) && (
                      <div className="border-t border-white/10 pt-1.5">
                        <button onClick={()=>{setMinePlanetId(selPlanet.id);doMine();}} disabled={!mineFleetId}
                          className="w-full py-1.5 bg-amber-800 hover:bg-amber-700 disabled:bg-white/5 disabled:text-white/30 rounded-xl text-[10px] font-bold transition">
                          ⛏️ Добыть ресурсы кораблями
                        </button>
                        {mineMsg&&<div className={`text-[10px] mt-1 ${mineMsg.startsWith("✅")?"text-green-400":"text-red-400"}`}>{mineMsg}</div>}
                      </div>
                    )}
                  </div>

                  {/* Лог боя */}
                  {battleLog.length>0 && (
                    <div className="mt-2 space-y-0.5 bg-black/30 rounded-lg p-2">
                      {battleLog.map((l,i)=>(
                        <div key={i} className={`text-[10px] ${l.startsWith("✅")?"text-green-400":l.startsWith("❌")?"text-red-400":"text-white/60"}`}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ШПИОНАЖ ПАНЕЛЬ ── */}
              {spyPanel && spyTarget && (
                <div className="bg-purple-950/80 rounded-2xl p-3 border border-purple-500/30 flex-shrink-0">
                  <div className="font-black text-sm mb-2 text-purple-300">🕵️ Шпионаж: {spyTarget.name}</div>
                  <div className="mb-2">
                    <div className="text-[10px] text-white/40 mb-1">Цель разведки:</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(["resources","fleet","buildings"] as const).map(t=>(
                        <button key={t} onClick={()=>setSpyType(t)}
                          className={`py-1 rounded-lg text-[10px] font-bold transition ${spyType===t?"bg-purple-600":"bg-white/10 hover:bg-white/20"}`}>
                          {t==="resources"?"⛏️ Ресурсы":t==="fleet"?"🚀 Флот":"🏗️ Здания"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={doSpy} disabled={spyLoading}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-xs font-bold transition mb-2">
                    {spyLoading?"⏳ Агент действует...":"🕵️ Отправить агента"}
                  </button>

                  {spyResult && (
                    <div className={`rounded-xl p-2.5 border text-[10px] space-y-1 ${spyResult.success?"border-green-500/30 bg-green-500/10":"border-red-500/30 bg-red-500/10"}`}>
                      <div className={`font-bold ${spyResult.success?"text-green-400":"text-red-400"}`}>
                        {spyResult.success?"✅ Успех":"❌ Провал"}
                      </div>
                      <div className="text-white/60">{spyResult.msg}</div>
                      {spyResult.success && Object.entries(spyResult.report).map(([k,v])=>(
                        <div key={k} className="flex justify-between text-white/80">
                          <span className="text-white/40">{k}</span>
                          <span className="font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ═══════════════ КОЛОНИИ ═══════════════ */}
        {tab==="colony" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xl">🏗️ Мои колонии</h2>
              {buildMsg&&<div className={`text-sm px-3 py-1.5 rounded-xl ${buildMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{buildMsg}</div>}
            </div>
            {colonies.length===0&&<div className="text-center text-white/30 py-12"><div className="text-5xl mb-3">🪐</div>Нет колоний. Используйте карту галактики для колонизации.</div>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {colonies.map(col=>(
                <div key={col.id} className={`bg-white/5 rounded-2xl border ${col.is_capital?"border-yellow-500/30":"border-white/10"} overflow-hidden`}>
                  <div className={`px-4 py-3 flex items-center justify-between ${col.is_capital?"bg-yellow-500/10":""}`}>
                    <div>
                      <div className="font-black">{col.colony_name} {col.is_capital&&"👑"}</div>
                      <div className="text-xs text-white/40">Планета: {col.planet_name}</div>
                    </div>
                    <button onClick={()=>setSelColony(selColony?.id===col.id?null:col)}
                      className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg transition">
                      {selColony?.id===col.id?"Закрыть":"Управлять"}
                    </button>
                  </div>

                  {selColony?.id===col.id && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {Object.entries(BUILDINGS).map(([bid,bdata])=>{
                          const lvl = (col as Record<string,number>)[`${bid}_level`] || 0;
                          return (
                            <div key={bid} className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-lg">{bdata.icon}</span>
                                <span className="text-[10px] font-black text-yellow-400">{lvl}<span className="text-white/30">/{bdata.maxLvl}</span></span>
                              </div>
                              <div className="text-[10px] font-semibold leading-tight mb-1">{bdata.name}</div>
                              <div className="w-full bg-white/10 rounded-full h-0.5 mb-2">
                                <div className="h-0.5 rounded-full bg-blue-400" style={{width:`${(lvl/bdata.maxLvl)*100}%`}}/>
                              </div>
                              <button onClick={()=>upgradeBuilding(col.id, bid)} disabled={lvl>=bdata.maxLvl}
                                className={`w-full py-1 rounded-lg text-[10px] font-bold transition ${lvl<bdata.maxLvl?"bg-blue-700 hover:bg-blue-600":"bg-white/5 text-white/30"}`}>
                                {lvl>=bdata.maxLvl?"MAX":"⬆️ Улучшить"}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Строительство кораблей */}
                      {(col as Record<string,number>)["shipyard_level"] > 0 && (
                        <div className="mt-4">
                          <div className="font-bold text-sm mb-2">🚀 Строительство кораблей</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(SHIPS).map(([sid,s])=>(
                              <button key={sid} onClick={()=>buildShip(col.id, sid, 1)}
                                className="bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/20 rounded-xl p-2.5 text-left transition">
                                <div className="text-xl mb-1">{s.icon}</div>
                                <div className="text-[10px] font-bold">{s.name}</div>
                                <div className="text-[9px] text-white/40">⚔️{s.atk} 🛡️{s.def}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ФЛОТ ═══════════════ */}
        {tab==="fleet" && (
          <div>
            <h2 className="font-black text-xl mb-4">🚀 Мои флоты</h2>
            {fleets.length===0&&<div className="text-center text-white/30 py-12"><div className="text-5xl mb-3">🛸</div>Нет флотов. Постройте корабли в колонии.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fleets.map(f=>(
                <div key={f.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between mb-2">
                    <div className="font-black">{f.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.status==="orbit"?"bg-green-500/20 text-green-300":"bg-yellow-500/20 text-yellow-300"}`}>{f.status}</span>
                  </div>
                  <div className="text-xs text-white/40 mb-3">📍 {f.planet_name||"В пути"} · ⚔️{f.total_attack} 🛡️{f.total_defense}</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(f.ships||{}).filter(([,v])=>Number(v)>0).map(([sid,cnt])=>(
                      <div key={sid} className="bg-white/5 rounded-lg p-1.5 text-center border border-white/10">
                        <div className="text-base">{SHIPS[sid]?.icon||"🛸"}</div>
                        <div className="text-[9px] font-bold">{cnt}</div>
                        <div className="text-[8px] text-white/40">{SHIPS[sid]?.name||sid}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ТЕХНОЛОГИИ ═══════════════ */}
        {tab==="tech" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xl">🔬 Исследования</h2>
              {buildMsg&&<div className={`text-sm px-3 py-1.5 rounded-xl ${buildMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{buildMsg}</div>}
            </div>
            {Object.entries(TECH_CATS).map(([cat,cdata])=>(
              <div key={cat} className="mb-5">
                <div className={`font-black text-sm mb-2 ${cdata.color}`}>{cdata.label}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(TECHS).filter(([,t])=>t.cat===cat).map(([tid,t])=>{
                    const lvl = techMap[tid]||0;
                    const done = lvl>=t.maxLvl;
                    return (
                      <div key={tid} className={`bg-white/5 rounded-xl p-3 border transition-all ${lvl>0?"border-purple-500/30":"border-white/10"}`}>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{t.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-xs flex items-center gap-1">
                              {t.name}
                              {lvl>0&&<span className="text-[9px] bg-purple-500/30 text-purple-300 px-1 py-0.5 rounded">ур.{lvl}</span>}
                            </div>
                            <div className="text-[10px] text-green-400">{t.effect}</div>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                          <div className="h-1 rounded-full bg-purple-500 transition-all" style={{width:`${(lvl/t.maxLvl)*100}%`}}/>
                        </div>
                        {done
                          ? <div className="text-center text-[10px] text-yellow-400 font-bold">✅ Изучено полностью</div>
                          : <button onClick={()=>doResearch(tid)} className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-purple-700 hover:bg-purple-600 transition">
                              🔬 Исследовать
                            </button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ БИТВЫ ═══════════════ */}
        {tab==="battle" && (
          <div>
            <h2 className="font-black text-xl mb-4">⚔️ Боевые отчёты</h2>
            {battleLog.length>0&&(
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 mb-4">
                <div className="font-bold text-sm mb-2">Последнее сражение</div>
                {battleLog.map((l,i)=><div key={i} className={`text-sm ${l.startsWith("✅")?"text-green-400":l.startsWith("❌")?"text-red-400":"text-white/60"}`}>{l}</div>)}
              </div>
            )}
            {battleReports.length===0&&<div className="text-center text-white/30 py-12"><div className="text-5xl mb-3">🏳️</div>Нет боевых отчётов</div>}
            <div className="space-y-2">
              {battleReports.map(r=>(
                <div key={r.id} className={`rounded-xl p-3 border text-sm flex items-center justify-between ${r.attacker_wins?"border-green-500/20 bg-green-500/5":"border-red-500/20 bg-red-500/5"}`}>
                  <div>
                    <span className="font-bold">{r.attacker}</span>
                    <span className="text-white/40 mx-2">vs</span>
                    <span className="font-bold">{r.defender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={r.attacker_wins?"text-green-400":"text-red-400"}>{r.attacker_wins?"✅ Победа":"❌ Поражение"}</span>
                    <span className="text-[10px] text-white/30">{new Date(r.created_at).toLocaleDateString("ru")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ТОРГОВЛЯ ═══════════════ */}
        {tab==="trade" && (
          <div>
            <h2 className="font-black text-xl mb-4">💱 Торговая площадка</h2>
            {tradeMsg&&<div className={`text-sm px-4 py-2 rounded-xl mb-4 ${tradeMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{tradeMsg}</div>}

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
              <div className="font-bold text-sm mb-3">📤 Создать торговое предложение</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Продаю</label>
                  <select value={tradeForm.sell_resource} onChange={e=>setTradeForm(f=>({...f,sell_resource:e.target.value}))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-1">
                    {["metal","energy","crystals","fuel","dark_matter"].map(r=><option key={r} value={r}>{resIcon(r)} {r}</option>)}
                  </select>
                  <input type="number" value={tradeForm.sell_amount} onChange={e=>setTradeForm(f=>({...f,sell_amount:Number(e.target.value)}))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Хочу получить</label>
                  <select value={tradeForm.buy_resource} onChange={e=>setTradeForm(f=>({...f,buy_resource:e.target.value}))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-1">
                    {["metal","energy","crystals","fuel","dark_matter"].map(r=><option key={r} value={r}>{resIcon(r)} {r}</option>)}
                  </select>
                  <input type="number" value={tradeForm.buy_amount} onChange={e=>setTradeForm(f=>({...f,buy_amount:Number(e.target.value)}))}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm"/>
                </div>
              </div>
              <button onClick={createTrade} className="w-full py-2.5 bg-yellow-700 hover:bg-yellow-600 rounded-xl text-sm font-bold transition">💱 Выставить предложение</button>
            </div>

            <div className="font-bold text-sm mb-2">📋 Активные предложения</div>
            {tradeOffers.length===0&&<div className="text-center text-white/30 py-8">Нет активных предложений</div>}
            <div className="space-y-2">
              {tradeOffers.map(t=>(
                <div key={t.id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-white/50">{t.seller_nickname}</span>
                    <span className="mx-2">{resIcon(t.sell_res)}{t.sell_amt} → {resIcon(t.buy_res)}{t.buy_amt}</span>
                  </div>
                  <button onClick={()=>acceptTrade(t.id)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold transition">Купить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ЧАТ ═══════════════ */}
        {tab==="chat" && (
          <div className="flex flex-col" style={{height:"calc(100vh - 240px)"}}>
            <div className="flex gap-2 mb-3">
              {(["global","alliance"] as const).map(c=>(
                <button key={c} onClick={()=>{setChatTab(c);setChatLast(0);setChatMsgs([]);}}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${chatTab===c?"bg-blue-600":"bg-white/10 hover:bg-white/20"}`}>
                  {c==="global"?"🌌 Общий":"🔱 Альянс"}
                </button>
              ))}
            </div>
            {chatTab==="alliance"&&!res.alliance_id&&<div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300 mb-2">Вступите в альянс для доступа к чату альянса</div>}
            <div ref={chatRef} className="flex-1 overflow-y-auto bg-black/30 rounded-2xl p-3 mb-2 space-y-2 min-h-0">
              {chatMsgs.length===0&&<div className="text-center text-white/20 pt-12">Нет сообщений</div>}
              {chatMsgs.map(m=>(
                <div key={m.id} className={`flex gap-2 ${m.player_id===res.id?"flex-row-reverse":""}`}>
                  <div className={`rounded-2xl px-3 py-2 max-w-[80%] text-sm ${m.player_id===res.id?"bg-blue-600/50":"bg-white/10"}`}>
                    <div className="text-[9px] text-white/40 mb-0.5">{RACES[m.race as RaceId]?.icon||"👤"} {m.nickname}</div>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
                placeholder="Введите сообщение..." disabled={chatTab==="alliance"&&!res.alliance_id}
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-40"/>
              <button onClick={sendChat} disabled={chatTab==="alliance"&&!res.alliance_id}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-bold disabled:opacity-40 transition">➤</button>
            </div>
          </div>
        )}

        {/* ═══════════════ АЛЬЯНС ═══════════════ */}
        {tab==="alliance" && (
          <div>
            <h2 className="font-black text-xl mb-4">🔱 Альянсы</h2>
            {allianceMsg&&<div className={`text-sm px-4 py-2 rounded-xl mb-4 ${allianceMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{allianceMsg}</div>}

            {res.alliance_id ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
                <div className="font-black mb-1">🔱 Вы в альянсе #{res.alliance_id}</div>
                {myAlliance&&<div className="text-sm text-white/60">{myAlliance.emblem} {myAlliance.alliance_name} [{myAlliance.alliance_tag}] · {myAlliance.members_count} участников</div>}
                <button onClick={leaveAlliance} className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-bold transition">Покинуть альянс</button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <div className="font-bold mb-3">➕ Создать альянс</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={allianceForm.name} onChange={e=>setAllianceForm(f=>({...f,name:e.target.value}))} placeholder="Название" className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  <input value={allianceForm.tag} onChange={e=>setAllianceForm(f=>({...f,tag:e.target.value}))} placeholder="Тег [3-4 букв]" className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div className="flex gap-1.5 mb-2">
                  {["⚔️","🌟","🔱","💫","🛸","🚀","🔥","💎","🌌","👑"].map(e=>(
                    <button key={e} onClick={()=>setAllianceForm(f=>({...f,emblem:e}))}
                      className={`w-9 h-9 rounded-lg text-lg transition ${allianceForm.emblem===e?"bg-blue-600":"bg-white/10 hover:bg-white/20"}`}>{e}</button>
                  ))}
                </div>
                <input value={allianceForm.desc} onChange={e=>setAllianceForm(f=>({...f,desc:e.target.value}))} placeholder="Описание альянса" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"/>
                <button onClick={createAlliance} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition">Создать альянс</button>
              </div>
            )}

            <div className="font-bold text-sm mb-2">🌌 Все альянсы галактики</div>
            {alliances.length===0&&<div className="text-center text-white/30 py-8">Альянсов пока нет</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alliances.map(a=>(
                <div key={a.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{a.emblem}</span>
                    <div className="flex-1">
                      <div className="font-black">{a.alliance_name} <span className="text-white/40 text-xs">[{a.alliance_tag}]</span></div>
                      <div className="text-xs text-white/40 mb-2">{a.alliance_desc}</div>
                      <div className="flex gap-3 text-xs text-white/50">
                        <span>👥 {a.members_count}</span>
                        <span>⭐ {a.total_score}</span>
                        <span>👑 {a.leader_name}</span>
                        {a.is_recruiting&&<span className="text-green-400">✅ Набор</span>}
                      </div>
                    </div>
                    {!res.alliance_id&&(
                      <button onClick={()=>joinAlliance(a.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition">Вступить</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ДИПЛОМАТИЯ ═══════════════ */}
        {tab==="diplomacy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Левая — отправить предложение */}
            <div>
              <h2 className="font-black text-xl mb-4">🤝 Дипломатия</h2>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <div className="font-bold text-sm mb-3">Выбрать действие</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([["peace","🕊️ Мир","bg-green-700"],["trade_union","🤝 Союз","bg-blue-700"],["war","⚔️ Война","bg-red-700"]] as const).map(([a,l,c])=>(
                    <button key={a} onClick={()=>setDiploAction(a)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${diploAction===a?c:"bg-white/10 hover:bg-white/20"}`}>{l}</button>
                  ))}
                </div>
                <div className="text-[10px] text-white/40 mb-1">Выбрать цель:</div>
                <select value={diploTarget||""} onChange={e=>setDiploTarget(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2">
                  <option value="">— выбрать игрока —</option>
                  {diploPlayers.filter(p=>p.id!==res.id).map(p=>(
                    <option key={p.id} value={p.id}>{RACES[p.race as RaceId]?.icon||"👤"} {p.nickname} (⭐{p.score})</option>
                  ))}
                </select>
                <input value={diploMsg.startsWith("✅")||diploMsg.startsWith("❌")||diploMsg.startsWith("⚔️")||diploMsg.startsWith("🤝")||diploMsg.startsWith("🕊️")?"":diploMsg}
                  onChange={e=>setDiploMsg(e.target.value)}
                  placeholder="Сообщение (необязательно)"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"/>
                <button onClick={sendDiplo} disabled={!diploTarget}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition ${diploAction==="war"?"bg-red-700 hover:bg-red-600":diploAction==="trade_union"?"bg-blue-700 hover:bg-blue-600":"bg-green-700 hover:bg-green-600"}`}>
                  {diploAction==="war"?"⚔️ Объявить войну":diploAction==="trade_union"?"🤝 Предложить торговый союз":"🕊️ Предложить мир"}
                </button>
                {diploMsg&&(diploMsg.startsWith("✅")||diploMsg.startsWith("❌"))&&(
                  <div className={`mt-2 text-sm px-3 py-1.5 rounded-xl ${diploMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{diploMsg}</div>
                )}
              </div>

              {/* Список игроков */}
              <div className="font-bold text-sm mb-2 text-white/60">Игроки галактики</div>
              <div className="space-y-1.5">
                {diploPlayers.filter(p=>p.id!==res.id).slice(0,10).map(p=>(
                  <div key={p.id} className="bg-white/5 rounded-xl px-3 py-2 border border-white/10 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{RACES[p.race as RaceId]?.icon||"👤"}</span>
                      <span className="font-semibold">{p.nickname}</span>
                      <span className="text-[10px] text-white/40">{p.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-xs">⭐{p.score}</span>
                      <button onClick={()=>setDiploTarget(p.id)} className="text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg transition">Выбрать</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая — история отношений */}
            <div>
              <h2 className="font-black text-xl mb-4">🏛️ Мои отношения</h2>
              {diploRels.length===0
                ? <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center text-white/30"><div className="text-4xl mb-3">🕊️</div>Нет дипломатических записей</div>
                : <div className="space-y-2">
                  {diploRels.map(r=>{
                    const typeMap:{[k:string]:{icon:string;label:string;color:string}} = {
                      war:                  {icon:"⚔️",label:"Война",         color:"text-red-400   border-red-500/20   bg-red-500/5"},
                      peace_proposed:       {icon:"🕊️",label:"Мир предложен", color:"text-green-400 border-green-500/20 bg-green-500/5"},
                      trade_union_proposed: {icon:"🤝",label:"Союз предложен",color:"text-blue-400  border-blue-500/20  bg-blue-500/5"},
                      accepted:             {icon:"✅",label:"Принято",        color:"text-green-400 border-green-500/20 bg-green-500/5"},
                      rejected:             {icon:"❌",label:"Отклонено",      color:"text-red-400   border-red-500/20   bg-red-500/5"},
                    };
                    const t = typeMap[r.type] || {icon:"📋",label:r.type,color:"text-white/60 border-white/10 bg-white/5"};
                    return (
                      <div key={r.id} className={`rounded-xl p-3 border text-xs ${t.color}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{t.icon} {t.label}</span>
                          <span className="text-white/30">{new Date(r.date).toLocaleDateString("ru")}</span>
                        </div>
                        <div className="text-white/60">{r.from_nick} → {r.to_nick}</div>
                        {r.message&&<div className="text-white/40 italic mt-0.5">"{r.message}"</div>}
                      </div>
                    );
                  })}
                </div>}
            </div>
          </div>
        )}

        {/* ═══════════════ МАГАЗИН ═══════════════ */}
        {tab==="shop" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-xl">💎 Галактический Магазин</h2>
              {shopMsg&&<div className={`text-sm px-4 py-2 rounded-xl ${shopMsg.startsWith("✅")?"bg-green-500/20 text-green-300":shopMsg.startsWith("⏳")?"bg-blue-500/20 text-blue-300":"bg-red-500/20 text-red-300"}`}>{shopMsg}</div>}
            </div>
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-2xl p-4 border border-purple-500/20 mb-4 text-sm text-white/60">
              🎁 Поддержи развитие галактики! Все ресурсы начисляются мгновенно на твой аккаунт.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {shopPackages.map(pkg=>(
                <div key={pkg.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/25 transition-all">
                  <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 p-4 text-center border-b border-white/10">
                    <div className="text-4xl mb-2">{pkg.icon}</div>
                    <div className="font-black text-sm">{pkg.name}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{pkg.desc}</div>
                  </div>
                  <div className="p-3">
                    <div className="space-y-1 mb-3">
                      {Object.entries(pkg.rewards).filter(([,v])=>v>0).map(([res,val])=>(
                        <div key={res} className="flex items-center justify-between text-[10px]">
                          <span className="text-white/50">{resIcon(res)} {res}</span>
                          <span className="font-bold text-white">+{val.toLocaleString()}</span>
                        </div>
                      ))}
                      {pkg.bonus_score>0&&<div className="flex items-center justify-between text-[10px]"><span className="text-white/50">⭐ Очки</span><span className="font-bold text-yellow-400">+{pkg.bonus_score}</span></div>}
                    </div>
                    <button onClick={()=>buyPackage(pkg.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-sm font-black transition shadow-lg shadow-purple-500/20">
                      {pkg.price_rub} ₽
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {shopHistory.length>0&&(
              <div className="mt-6">
                <div className="font-bold text-sm mb-2 text-white/60">История покупок</div>
                <div className="space-y-2">
                  {shopHistory.map((h,i)=>(
                    <div key={i} className="bg-white/5 rounded-xl px-4 py-2 border border-white/10 flex items-center justify-between text-xs">
                      <span className="font-semibold">{h.name}</span>
                      <span className="text-white/40">{new Date(h.date).toLocaleDateString("ru")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ РЕЙТИНГ ═══════════════ */}
        {tab==="ranking" && (
          <div>
            <h2 className="font-black text-xl mb-4">🏆 Рейтинг галактики</h2>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_80px_60px_60px_80px] gap-2 px-4 py-2 bg-white/5 text-xs text-white/40 font-semibold">
                <div>#</div><div>Игрок</div><div>Ранг</div><div>⭐ Очки</div><div>⚔️ Победы</div><div>Альянс</div>
              </div>
              {leaderboard.map((p,i)=>(
                <div key={p.id} className={`grid grid-cols-[40px_1fr_80px_60px_60px_80px] gap-2 px-4 py-2.5 border-t border-white/5 text-sm items-center ${p.id===res.id?"bg-blue-500/10":i<3?"bg-yellow-500/5":""}`}>
                  <div className="font-black text-white/50">{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
                  <div className="flex items-center gap-2">
                    <span>{RACES[p.race as RaceId]?.icon||"👤"}</span>
                    <span className="font-semibold truncate">{p.nickname}</span>
                    {p.id===res.id&&<span className="text-[10px] text-blue-400">Вы</span>}
                  </div>
                  <div className="text-xs text-white/50 truncate">{p.rank_title}</div>
                  <div className="font-bold text-yellow-400">{p.score}</div>
                  <div className="text-green-400">{p.battles_won}</div>
                  <div className="text-xs text-white/40 truncate">{p.alliance||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ ЗАДАНИЯ ═══════════════ */}
        {tab==="quests" && (
          <div>
            {/* Шапка */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-black text-xl">📋 Ежедневные задания</h2>
                <p className="text-xs text-white/40 mt-0.5">Обновляются каждый день в 00:00 · 5 заданий в день</p>
              </div>
              <div className="flex items-center gap-3">
                {questsStreak > 0 && (
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl px-4 py-2 text-center">
                    <div className="text-xl">🔥</div>
                    <div className="font-black text-sm text-orange-300">{questsStreak}</div>
                    <div className="text-[9px] text-white/40">дней подряд</div>
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-center">
                  <div className="font-black text-xl text-yellow-400">{questsDone}<span className="text-white/30 text-sm">/5</span></div>
                  <div className="text-[9px] text-white/40">выполнено</div>
                </div>
              </div>
            </div>

            {/* Сообщение */}
            {questsMsg && (
              <div className={`mb-4 px-4 py-2.5 rounded-2xl text-sm ${questsMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>
                {questsMsg}
              </div>
            )}

            {/* Список заданий */}
            {quests.length === 0 ? (
              <div className="text-center text-white/30 py-16">
                <div className="text-5xl mb-3">⏳</div>
                <div>Загрузка заданий...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {quests.map(q => {
                  const catColors: Record<string,string> = {
                    battle:    "from-red-900/60 border-red-500/20",
                    economy:   "from-yellow-900/60 border-yellow-500/20",
                    expansion: "from-green-900/60 border-green-500/20",
                    social:    "from-blue-900/60 border-blue-500/20",
                  };
                  const catColor = catColors[q.cat] || "from-slate-800/60 border-white/10";
                  return (
                    <div key={q.id} className={`bg-gradient-to-br ${catColor} rounded-2xl border overflow-hidden transition-all ${q.completed && !q.claimed ? "ring-2 ring-yellow-500/40" : ""}`}>
                      <div className="p-4">
                        {/* Заголовок */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{q.icon}</span>
                            <div>
                              <div className="font-black text-sm leading-tight">{q.name}</div>
                              <div className="text-[10px] text-white/50 mt-0.5">{q.desc}</div>
                            </div>
                          </div>
                          {q.claimed && <span className="flex-shrink-0 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 font-bold">✅ Получено</span>}
                          {q.completed && !q.claimed && <span className="flex-shrink-0 text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold animate-pulse">🎁 Готово!</span>}
                        </div>

                        {/* Прогресс-бар */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-white/40 mb-1">
                            <span>Прогресс</span>
                            <span className="font-bold text-white/60">{q.progress}/{q.target}</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${q.completed?"bg-gradient-to-r from-yellow-500 to-green-500":"bg-gradient-to-r from-blue-600 to-blue-400"}`}
                              style={{width:`${q.pct}%`}}
                            />
                          </div>
                        </div>

                        {/* Награда */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {Object.entries(q.reward).filter(([,v])=>v>0).map(([res,val])=>(
                            <div key={res} className="bg-black/30 rounded-lg px-2 py-0.5 text-[10px] flex items-center gap-1">
                              <span>{resIcon(res)}</span>
                              <span className="font-bold text-white/80">+{val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Кнопка */}
                        {!q.claimed && (
                          <button
                            onClick={() => q.completed && claimQuest(q.id)}
                            disabled={!q.completed}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                              q.completed
                                ? "bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 shadow-lg shadow-yellow-500/20"
                                : "bg-white/5 text-white/25 cursor-not-allowed"
                            }`}
                          >
                            {q.completed ? "🎁 Забрать награду" : `⏳ ${q.pct}% выполнено`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Бонус за все 5 заданий */}
            {questsDone === 5 && (
              <div className="mt-4 bg-gradient-to-r from-yellow-900/40 to-amber-900/40 rounded-2xl border border-yellow-500/30 p-4 flex items-center gap-4">
                <span className="text-4xl">👑</span>
                <div>
                  <div className="font-black text-yellow-300">Все задания выполнены!</div>
                  <div className="text-xs text-white/50">Серия дней: 🔥{questsStreak} · Завтра тебя ждут новые задания</div>
                </div>
              </div>
            )}

            {/* Подсказка как получить прогресс */}
            <div className="mt-4 bg-white/3 rounded-2xl border border-white/10 p-4 text-xs text-white/40">
              <div className="font-semibold text-white/60 mb-2">💡 Как выполнять задания:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>⚔️ Битвы — вкладка Галактика, атакуй планеты</div>
                <div>🏗️ Постройки — вкладка Колонии → Управлять</div>
                <div>🔬 Исследования — вкладка Технологии</div>
                <div>💱 Торговля — вкладка Торговля</div>
                <div>🪐 Колонизация — свободная планета на карте</div>
                <div>💬 Чат — вкладка Чат, напиши сообщение</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── ОРБИТАЛЬНАЯ СТАНЦИЯ — модальное окно ─────────────────────────────── */}
      {showStation && stationPlanet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={()=>setShowStation(false)}>
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-500/20"
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="font-black text-lg">🛸 Орбитальная станция</div>
              <button onClick={()=>setShowStation(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
            </div>
            {/* Вкладки */}
            <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
              {([["station","🛸 Станция"],["ships","🚀 Корабли"],["warehouse","📦 Склад"],["factory","⚙️ Завод"],["tech","🔬 Технологии"]] as const).map(([id,label])=>(
                <button key={id} onClick={()=>setStationTab(id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${stationTab===id?"bg-purple-600 text-white":"bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {stationMsg && <div className={`mb-3 text-sm px-3 py-2 rounded-xl ${stationMsg.startsWith("✅")?"bg-green-500/10 text-green-300 border border-green-500/20":"bg-red-500/10 text-red-300 border border-red-500/20"}`}>{stationMsg}</div>}

              {/* ── Станция ── */}
              {stationTab==="station" && (
                <div className="space-y-3">
                  {!stationData ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🛸</div>
                      <div className="text-white/60 mb-4">Орбитальная станция ещё не построена</div>
                      <button onClick={()=>buildStation(stationPlanet)}
                        className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-bold transition">
                        Построить (⛏️2000 ⚡1000 💎500)
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-2xl">🛸</div>
                          <div className="font-bold text-sm">Ур.{stationData.level}</div>
                          <div className="text-xs text-white/40">Станция</div>
                          <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                            <div className="h-1 rounded-full bg-purple-400" style={{width:`${(stationData.hull_hp/stationData.max_hull_hp)*100}%`}}/>
                          </div>
                          <div className="text-[10px] text-white/30 mt-0.5">{stationData.hull_hp}/{stationData.max_hull_hp} HP</div>
                        </div>
                        {Object.entries({shipyard:"🏭 Верфь",defense:"🛡️ Щит",hangar:"🚀 Ангар",lab:"🔬 Лаборатория"}).map(([key,label])=>(
                          <div key={key} className="bg-white/5 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold">{label}</span>
                              <span className="text-xs text-purple-400 font-black">Ур.{stationData[key as keyof StationData] as number}</span>
                            </div>
                            <button onClick={()=>upgradeModule(stationPlanet, key)}
                              className="w-full py-1 bg-purple-800 hover:bg-purple-700 rounded-lg text-[10px] font-bold transition">
                              ⬆️ Улучшить
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Корабли ── */}
              {stationTab==="ships" && stationData && (
                <div className="space-y-2">
                  {stationData.shipyard < 1
                    ? <div className="text-white/40 text-sm text-center py-4">Нужна Верфь (ур.1+) на станции</div>
                    : Object.entries(shipDefs).filter(([k])=>unlockedShips.includes(k)).map(([key, sh])=>{
                      const catColors:Record<string,string> = {miner:"bg-amber-900/40 border-amber-500/30", salvager:"bg-cyan-900/40 border-cyan-500/30", military:"bg-red-900/40 border-red-500/30"};
                      return (
                        <div key={key} className={`rounded-xl p-3 border ${catColors[sh.cat]||"bg-white/5 border-white/10"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{sh.icon}</span>
                              <div>
                                <div className="font-bold text-sm">{sh.name}</div>
                                <div className="text-[10px] text-white/40">{sh.desc}</div>
                              </div>
                            </div>
                            <div className="text-right text-[10px] text-white/50">
                              {sh.atk>0&&<div>⚔️{sh.atk}</div>}
                              {sh.def>0&&<div>🛡️{sh.def}</div>}
                              {sh.mining>0&&<div>⛏️{sh.mining}</div>}
                              {sh.cargo>0&&<div>📦{sh.cargo}т</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-[10px] text-white/40">
                              ⛏️{sh.cost.metal} ⚡{sh.cost.energy} 💎{sh.cost.crystals}
                            </div>
                            <button onClick={()=>buildShipStation(stationPlanet, key, 1)}
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-[10px] font-bold transition">
                              Построить 1
                            </button>
                            <button onClick={()=>buildShipStation(stationPlanet, key, 5)}
                              className="px-3 py-1 bg-blue-800 hover:bg-blue-700 rounded-lg text-[10px] font-bold transition">
                              ×5
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}

              {/* ── Склад ── */}
              {stationTab==="warehouse" && (
                <div className="space-y-2">
                  {!warehouseData ? (
                    <div className="text-white/40 text-sm text-center py-4">Постройте станцию для активации склада</div>
                  ) : (
                    <>
                      <div className="bg-white/5 rounded-xl p-3 mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold">📦 Склад ур.{warehouseData.level}</span>
                          <span className="text-xs text-white/40">{Object.values({metal:warehouseData.metal,energy:warehouseData.energy,crystals:warehouseData.crystals,fuel:warehouseData.fuel,ore:warehouseData.ore}).reduce((a,b)=>a+b,0)}/{warehouseData.capacity}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {([["metal","⛏️ Металл",warehouseData.metal],["energy","⚡ Энергия",warehouseData.energy],["crystals","💎 Кристаллы",warehouseData.crystals],["fuel","⛽ Топливо",warehouseData.fuel],["ore","🪨 Руда",warehouseData.ore],["alloy","⚙️ Сплавы",warehouseData.alloy],["components","🔩 Компоненты",warehouseData.components]] as [string,string,number][]).map(([key,label,val])=>(
                            <div key={key} className="bg-black/30 rounded-lg p-2">
                              <div className="text-[10px] text-white/50">{label}</div>
                              <div className="font-bold text-sm">{val}</div>
                              <button onClick={()=>depositWarehouse(stationPlanet, key, 100)}
                                className="w-full mt-1 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] transition">
                                + Загрузить 100
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Завод ── */}
              {stationTab==="factory" && (
                <div>
                  {!warehouseData ? (
                    <div className="text-white/40 text-sm text-center py-4">Нужна орбитальная станция</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-lg font-black mb-1">⚙️ Перерабатывающий завод</div>
                        <div className="text-sm text-white/50 mb-3">Перерабатывает руду в сплавы и компоненты</div>
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                          <div className="bg-black/30 rounded-lg p-2"><div>🪨</div><div className="font-bold">{warehouseData.ore}</div><div className="text-white/40">Руда</div></div>
                          <div className="bg-black/30 rounded-lg p-2 text-white/40 flex items-center justify-center text-xl">→</div>
                          <div className="bg-black/30 rounded-lg p-2"><div>⚙️🔩</div><div className="font-bold">{warehouseData.alloy+warehouseData.components}</div><div className="text-white/40">Продукты</div></div>
                        </div>
                        <button onClick={()=>processOre(stationPlanet)}
                          disabled={warehouseData.ore===0}
                          className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 rounded-xl font-bold transition">
                          ⚙️ Запустить переработку
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Технологии кораблей ── */}
              {stationTab==="tech" && (
                <div className="space-y-2">
                  {!stationData || stationData.lab < 1
                    ? <div className="text-white/40 text-sm text-center py-4">Нужна Лаборатория (ур.1+) на станции</div>
                    : Object.entries(shipTechs).map(([tid, tech])=>{
                      const isResearched = unlockedShips.includes(tech.unlocks);
                      const unlockShip = shipDefs[tech.unlocks];
                      return (
                        <div key={tid} className={`rounded-xl p-3 border ${isResearched?"border-green-500/30 bg-green-500/5 opacity-60":"border-white/10 bg-white/5"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{tech.icon}</span>
                              <div>
                                <div className="font-bold text-sm">{tech.name}</div>
                                <div className="text-[10px] text-white/40">
                                  Открывает: {unlockShip?.name||tech.unlocks} {unlockShip?.icon}
                                </div>
                              </div>
                            </div>
                            {isResearched
                              ? <span className="text-green-400 text-sm">✅</span>
                              : <button onClick={()=>researchShipTech(tid)}
                                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-[10px] font-bold transition">
                                  Изучить
                                </button>
                            }
                          </div>
                          {!isResearched && (
                            <div className="text-[10px] text-white/30 mt-1 ml-9">
                              ⛏️{tech.cost.metal} ⚡{tech.cost.energy} 💎{tech.cost.crystals}
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ТУТОРИАЛ ─────────────────────────────────────────────────────────── */}
      {tutVisible && localStorage.getItem("ge_tut") !== "done" && (() => {
        const steps = [
          {
            icon: "🌌",
            title: "Добро пожаловать в Галактическую Империю!",
            text: "Ты только что основал свою межзвёздную цивилизацию. Давай разберёмся, с чего начать — это займёт 1 минуту.",
            tab: null,
            btn: "Начать обучение →",
          },
          {
            icon: "🗺️",
            title: "Шаг 1 — Карта галактики",
            text: "Открой вкладку «Галактика». Нажми на звёздную систему — увидишь её планеты. Тащи карту мышью чтобы перемещаться, колесо — зум.",
            tab: "galaxy" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🛸",
            title: "Шаг 2 — Твой первый флот",
            text: "При регистрации тебе выдан Разведчик 🛸. Открой вкладку «Флот» — он уже там. Этот корабль нужен для колонизации свободных планет.",
            tab: "fleet" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🪐",
            title: "Шаг 3 — Первая колония",
            text: "На карте найди свободную планету (🆓 Свободна). Выбери флот → нажми «🪐 Колонизировать». Колония начнёт производить ресурсы!",
            tab: "galaxy" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🏗️",
            title: "Шаг 4 — Развивай колонию",
            text: "Вкладка «Колонии» → «Управлять». Улучшай Шахту металла ⛏️ и Солнечный реактор ⚡ — это основа экономики. Чем выше уровень, тем больше ресурсов.",
            tab: "colony" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🔬",
            title: "Шаг 5 — Исследования",
            text: "Вкладка «Технологии». Прокачай «Колонизацию» чтобы захватывать больше планет, и «Горное дело» для добычи металла. Технологии дают постоянные бонусы.",
            tab: "tech" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "⚔️",
            title: "Шаг 6 — Сражения",
            text: "Построй корабли на Верфи (в колонии). Атакуй планеты ИИ или других игроков прямо с карты галактики. Победа приносит ресурсы и очки рейтинга.",
            tab: "fleet" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🤝",
            title: "Шаг 7 — Альянсы и дипломатия",
            text: "Вступи в альянс или создай свой — вместе проще захватывать системы. В «Дипломатии» можно объявлять войны, предлагать торговые союзы и мир.",
            tab: "alliance" as TabId,
            btn: "Понятно, далее →",
          },
          {
            icon: "🏆",
            title: "Готов покорять галактику!",
            text: "Ты знаешь основы. Цель — захватить как можно больше планет, прокачать технологии и стать лучшим в рейтинге галактики. Удачи, Командор!",
            tab: null,
            btn: "🚀 Начать игру!",
          },
        ];

        const step = steps[tutStep] || steps[0];
        const isLast = tutStep === steps.length - 1;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 shadow-2xl shadow-black/60 overflow-hidden">

              {/* Прогресс-бар */}
              <div className="h-1 bg-white/10">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{width:`${((tutStep+1)/steps.length)*100}%`}}/>
              </div>

              <div className="p-6">
                {/* Шаг */}
                <div className="text-[10px] text-white/30 mb-3 font-semibold tracking-widest uppercase">
                  Шаг {tutStep+1} из {steps.length}
                </div>

                {/* Иконка + заголовок */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl flex-shrink-0">{step.icon}</div>
                  <div>
                    <h3 className="font-black text-lg leading-tight mb-1">{step.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{step.text}</p>
                  </div>
                </div>

                {/* Подсветка вкладки */}
                {step.tab && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-4 text-xs text-blue-300 flex items-center gap-2">
                    <span>👆</span>
                    <span>Нажми на вкладку <strong>«{step.tab === "galaxy"?"Галактика":step.tab==="fleet"?"Флот":step.tab==="colony"?"Колонии":step.tab==="tech"?"Технологии":step.tab==="alliance"?"Альянс":"Дипломатия"}»</strong> вверху</span>
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isLast) { closeTut(); }
                      else {
                        const next = tutStep + 1;
                        nextTut(next);
                        if (steps[next]?.tab) setTab(steps[next].tab!);
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                  >
                    {step.btn}
                  </button>
                  <button onClick={closeTut} className="text-white/25 hover:text-white/50 text-xs transition px-2 py-2">
                    Пропустить
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Кнопка вызова туториала */}
      {!tutVisible && (
        <button
          onClick={() => { setTutVisible(true); setTutStep(0); }}
          className="fixed bottom-4 right-4 z-40 w-10 h-10 bg-blue-600/80 hover:bg-blue-500 backdrop-blur rounded-full text-base shadow-lg shadow-blue-500/30 transition flex items-center justify-center"
          title="Открыть обучение"
        >
          ?
        </button>
      )}

      <div className="bg-black/40 border-t border-white/10 text-center py-2 text-[10px] text-white/20">
        Галактическая Империя · 9 рас · Реальное время · Миллиарды миров
      </div>
    </div>
  );
}
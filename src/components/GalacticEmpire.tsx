import { useState, useEffect, useRef, useCallback } from "react";

// ─── API URLs ─────────────────────────────────────────────────────────────────
const API = {
  auth:   "https://functions.poehali.dev/d299b187-7949-45d0-b594-2578e2b6c399",
  game:   "https://functions.poehali.dev/14999aad-e665-4e7b-b72f-1213f45c0727",
  battle: "https://functions.poehali.dev/da4e2351-b1f6-48ab-b9cc-694b8f8b5ad3",
  social: "https://functions.poehali.dev/d3d9291d-49a7-490b-be7a-4a150fc6daad",
  shop:   "https://functions.poehali.dev/ae459e25-d759-47c3-890f-ad263c5d7871",
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
type TabId = "galaxy"|"colony"|"fleet"|"tech"|"battle"|"chat"|"alliance"|"diplomacy"|"trade"|"ranking"|"shop";

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
  const [phase,  setPhase]  = useState<"auth"|"game">("auth");
  const [authTab,setAuthTab]= useState<"login"|"register">("login");
  const [form,   setForm]   = useState({email:"",nickname:"",login:"",password:"",race:"solarians" as RaceId});
  const [authErr,setAuthErr]= useState("");
  const [loading,setLoading]= useState(false);
  const [token,  setToken]  = useState(()=>localStorage.getItem("ge_token")||"");
  const [player, setPlayer] = useState<Player|null>(null);

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

  // ── ДОБЫЧА КОРАБЛЯМИ ──────────────────────────────────────────────────────
  const [mineFleetId,  setMineFleetId]  = useState<number|null>(null);
  const [minePlanetId, setMinePlanetId] = useState<number|null>(null);
  const [mineMsg,      setMineMsg]      = useState("");

  // ── КАРТА: pan/zoom ────────────────────────────────────────────────────────
  const svgRef      = useRef<SVGSVGElement>(null);
  const isPanning   = useRef(false);
  const didDrag     = useRef(false);
  const panStart    = useRef({x:0,y:0,tx:0,ty:0});
  const [mapTx, setMapTx] = useState(0);
  const [mapTy, setMapTy] = useState(0);
  const [mapScale, setMapScale] = useState(1);

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
      if (d.id) { setPlayer(d); setPhase("game"); }
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
    const dx = (e.clientX - panStart.current.x)/mapScale;
    const dy = (e.clientY - panStart.current.y)/mapScale;
    if (Math.abs(dx)>3 || Math.abs(dy)>3) didDrag.current = true;
    setMapTx(panStart.current.tx + dx);
    setMapTy(panStart.current.ty + dy);
  },[mapScale]);

  const onSvgMouseUp = useCallback((e:React.MouseEvent) => {
    isPanning.current = false;
    (e.currentTarget as SVGElement).style.cursor = "grab";
  },[]);

  const onSvgWheel = useCallback((e:React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setMapScale(s => Math.min(4, Math.max(0.3, s*factor)));
  },[]);

  const resetMap = () => { setMapTx(0); setMapTy(0); setMapScale(1); };

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
        ? {action:"register", login:form.login, nickname:form.nickname, password:form.password, race:form.race}
        : {action:"login", login:form.login, password:form.password};
      const d = await api(API.auth, {method:"POST", body});
      if (d.error) { setAuthErr(d.error); return; }
      localStorage.setItem("ge_token", d.token);
      setToken(d.token);
      const p = authTab==="register" ? await api(`${API.auth}?action=me`,{token:d.token}) : d.player;
      setPlayer(p); setPhase("game");
    } catch { setAuthErr("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("ge_token"); setToken(""); setPlayer(null); setPhase("auth");
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
  ];

  const res = player!;

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
            <div className="flex items-center gap-3">
              {res.alliance_id && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">🔱 Альянс</span>}
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

      {/* ── НАВИГАЦИЯ ─────────────────────────────────────────────────────────── */}
      <div className="bg-black/30 border-b border-white/10 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                tab===t.id ? "border-blue-400 text-white bg-white/10" : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-3">

        {/* ═══════════════ ГАЛАКТИКА ═══════════════ */}
        {tab==="galaxy" && (
          <div className="flex gap-3" style={{minHeight:"78vh"}}>

            {/* ── Карта ── */}
            <div className="flex-1 bg-slate-950 rounded-2xl border border-white/10 relative overflow-hidden select-none" style={{minHeight:"500px"}}>

              {/* Подсказка управления */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 text-[10px] text-white/50 flex items-center gap-2">
                  <span>🖱️ тащи</span><span>·</span><span>⚲ колесо = зум</span><span>·</span><span>{systems.length} систем</span>
                </div>
              </div>

              {/* Кнопки управления картой */}
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                <button onClick={()=>setMapScale(s=>Math.min(4,s*1.2))} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-base font-black flex items-center justify-center transition">+</button>
                <button onClick={()=>setMapScale(s=>Math.max(0.3,s*0.83))} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-base font-black flex items-center justify-center transition">−</button>
                <button onClick={resetMap} className="w-8 h-8 bg-black/60 hover:bg-white/20 rounded-lg text-white text-[10px] flex items-center justify-center transition" title="Сбросить вид">⊙</button>
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
                viewBox="0 0 800 800"
                className="absolute inset-0"
                style={{cursor:"grab"}}
                onMouseDown={onSvgMouseDown}
                onMouseMove={onSvgMouseMove}
                onMouseUp={onSvgMouseUp}
                onMouseLeave={onSvgMouseUp}
                onWheel={onSvgWheel}
              >
                <g transform={`translate(${mapTx},${mapTy}) scale(${mapScale})`} style={{transformOrigin:"400px 400px"}}>

                  {/* Фоновые звёзды */}
                  {STAR_BG}

                  {/* Туманности (декор) */}
                  {[{cx:200,cy:600,r:80,c:"#4f46e5"},{cx:600,cy:200,r:60,c:"#7e22ce"},{cx:650,cy:650,r:50,c:"#0f766e"}].map((n,i)=>(
                    <ellipse key={i} cx={n.cx} cy={n.cy} rx={n.r} ry={n.r*0.6} fill={n.c} opacity="0.04"/>
                  ))}

                  {/* Линии соединения близких систем */}
                  {systems.flatMap(a=>
                    systems.filter(b=>b.id>a.id).map(b=>{
                      const d=Math.hypot(b.pos_x-a.pos_x,b.pos_y-a.pos_y);
                      if(d>200) return null;
                      return <line key={`${a.id}-${b.id}`} x1={a.pos_x} y1={a.pos_y} x2={b.pos_x} y2={b.pos_y} stroke="white" strokeWidth="0.3" opacity={0.06+0.04*(1-d/200)}/>;
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

                  {/* Ореолы галактик рас */}
                  {systems.map(sys=>{
                    const s = SECTOR_STYLES[sys.sector];
                    if (!s) return null;
                    const isCore = sys.sector==="core";
                    return (
                      <g key={`halo-${sys.id}`} style={{pointerEvents:"none"}}>
                        <circle cx={sys.pos_x} cy={sys.pos_y} r={isCore?60:45} fill={s.color} opacity={isCore?"0.12":"0.07"}/>
                        <circle cx={sys.pos_x} cy={sys.pos_y} r={isCore?60:45} fill="none" stroke={s.color} strokeWidth={isCore?"1.5":"0.8"} opacity={isCore?"0.5":"0.3"} strokeDasharray={isCore?"":"6 3"}/>
                        <text x={sys.pos_x} y={sys.pos_y-(isCore?68:52)} textAnchor="middle" fill={s.color} fontSize="8" opacity="0.7" fontWeight="bold">{s.icon} {s.label}</text>
                      </g>
                    );
                  })}

                  {/* Звёздные системы */}
                  {systems.map(sys=>{
                    const isSelected = selSystem?.id===sys.id;
                    const col = STAR_COLORS[sys.star_type] || "#f59e0b";
                    const r = (sys.star_size||5)*1.4+3;
                    const hasMine = planets.some(p=>p.star_system_id===sys.id && p.owner_id===res.id);
                    const sectorStyle = SECTOR_STYLES[sys.sector];
                    return (
                      <g key={sys.id} onClick={()=>{ if(!didDrag.current) loadSystem(sys); }} style={{cursor:"pointer"}}>
                        {hasMine && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+16} fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3"/>}
                        {sys.sector==="core" && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+20} fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0.6" strokeDasharray="5 3"/>}
                        {isSelected && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+10} fill="none" stroke={col} strokeWidth="1.5" opacity="0.6" strokeDasharray="4 2"/>}
                        <circle cx={sys.pos_x} cy={sys.pos_y} r={r+6} fill={sectorStyle?.color||col} opacity="0.1"/>
                        <circle cx={sys.pos_x} cy={sys.pos_y} r={r+6} fill={col} opacity="0.08"/>
                        <circle cx={sys.pos_x} cy={sys.pos_y} r={r} fill={col} opacity={isSelected?1:0.85}/>
                        <circle cx={sys.pos_x-r*0.3} cy={sys.pos_y-r*0.3} r={r*0.25} fill="white" opacity="0.25"/>
                        <text x={sys.pos_x} y={sys.pos_y+r+9} textAnchor="middle" fill="white" fontSize={7/mapScale+5} opacity="0.65">{sys.name}</text>
                        <text x={sys.pos_x} y={sys.pos_y+r+17} textAnchor="middle" fill={sectorStyle?.color||col} fontSize={6/mapScale+4} opacity="0.55">{sys.planet_count}🪐</text>
                      </g>
                    );
                  })}

                  {/* Планеты активной системы */}
                  {selSystem && sysDetail && (sysDetail.planets||[]).map((p:Planet, i:number)=>{
                    const cnt = (sysDetail.planets||[]).length||1;
                    const angle = (i/cnt)*Math.PI*2 - Math.PI/2;
                    const orbitR = 38 + i*20;
                    const px = selSystem.pos_x + Math.cos(angle)*orbitR;
                    const py = selSystem.pos_y + Math.sin(angle)*orbitR;
                    const col = PLANET_COLORS[p.planet_type] || "#94a3b8";
                    const pr = (p.size||3)*0.9+2;
                    const strokeCol = p.owner_id===res.id?"#22c55e":p.is_ai_controlled?"#ef4444":p.owner_id?"#f59e0b":"none";
                    const isSelP = selPlanet?.id===p.id;
                    return (
                      <g key={p.id} onClick={e=>{e.stopPropagation();setSelPlanet(p);setSpyPanel(false);}}>
                        <circle cx={selSystem.pos_x} cy={selSystem.pos_y} r={orbitR} fill="none" stroke="white" strokeWidth="0.25" opacity="0.12"/>
                        {isSelP && <circle cx={px} cy={py} r={pr+5} fill="none" stroke={col} strokeWidth="1" strokeDasharray="2 2" opacity="0.7"/>}
                        <circle cx={px} cy={py} r={pr+3} fill={col} opacity="0.15"/>
                        <circle cx={px} cy={py} r={pr} fill={col} opacity={isSelP?1:0.75} stroke={strokeCol} strokeWidth="1.5"/>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* ── Боковая панель ── */}
            <div className="w-72 flex flex-col gap-2 overflow-y-auto" style={{maxHeight:"78vh"}}>

              {/* Загрузка флотов для панели */}
              {tab==="galaxy" && fleets.length===0 && (
                <button onClick={()=>api(`${API.game}?action=fleets`,{token}).then(d=>{if(d.fleets)setFleets(d.fleets);})}
                  className="text-[10px] text-blue-400 hover:text-blue-300 text-center py-1 transition">
                  Загрузить мои флоты ↓
                </button>
              )}

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
                      <select value={battleFleetId||""} onChange={e=>{setBattleFleetId(Number(e.target.value));setMineFleetId(Number(e.target.value));setMinePlanetId(selPlanet.id);}}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-[10px]">
                        <option value="">— выбрать флот —</option>
                        {fleets.map(f=><option key={f.id} value={f.id}>{f.name} ⚔️{f.total_attack}</option>)}
                      </select>
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

      </div>

      <div className="bg-black/40 border-t border-white/10 text-center py-2 text-[10px] text-white/20">
        Галактическая Империя · 9 рас · Реальное время · Миллиарды миров
      </div>
    </div>
  );
}
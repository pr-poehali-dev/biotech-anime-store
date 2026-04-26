import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── API URLs ─────────────────────────────────────────────────────────────────
const API = {
  auth:   "https://functions.poehali.dev/d299b187-7949-45d0-b594-2578e2b6c399",
  game:   "https://functions.poehali.dev/14999aad-e665-4e7b-b72f-1213f45c0727",
  battle: "https://functions.poehali.dev/da4e2351-b1f6-48ab-b9cc-694b8f8b5ad3",
  social: "https://functions.poehali.dev/d3d9291d-49a7-490b-be7a-4a150fc6daad",
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
type TabId = "galaxy"|"colony"|"fleet"|"tech"|"battle"|"chat"|"alliance"|"diplomacy"|"trade"|"ranking";

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
};

// ─── КОРАБЛИ ──────────────────────────────────────────────────────────────────
const SHIPS: Record<string,{name:string;icon:string;atk:number;def:number;speed:number}> = {
  scout:       { name:"Разведчик",   icon:"🛸", atk:8,   def:5,   speed:150 },
  fighter:     { name:"Истребитель", icon:"✈️", atk:20,  def:15,  speed:120 },
  cruiser:     { name:"Крейсер",     icon:"🚀", atk:55,  def:45,  speed:90  },
  battleship:  { name:"Линкор",      icon:"⚔️", atk:140, def:110, speed:70  },
  dreadnought: { name:"Дредноут",    icon:"🌟", atk:350, def:280, speed:50  },
  titan:       { name:"Титан",       icon:"🔱", atk:900, def:750, speed:30  },
  carrier:     { name:"Авианосец",   icon:"🛥️", atk:200, def:350, speed:60  },
  stealth:     { name:"Невидимка",   icon:"👁️", atk:80,  def:30,  speed:180 },
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
          <div className="flex gap-3 h-full" style={{minHeight:"70vh"}}>
            {/* Карта */}
            <div className="flex-1 bg-slate-950/80 rounded-2xl border border-white/10 relative overflow-hidden" style={{minHeight:"500px"}}>
              <div className="absolute top-2 left-2 text-xs text-white/40 z-10">Карта галактики · {systems.length} звёздных систем</div>
              <svg width="100%" height="100%" viewBox="0 0 800 800" className="absolute inset-0">
                {/* Фоновые звёзды */}
                {Array.from({length:120}).map((_,i)=>(
                  <circle key={i} cx={Math.random()*800} cy={Math.random()*800} r={Math.random()*0.8+0.2} fill="white" opacity={Math.random()*0.4+0.1}/>
                ))}
                {/* Звёздные системы */}
                {systems.map(sys=>{
                  const isSelected = selSystem?.id===sys.id;
                  const col = STAR_COLORS[sys.star_type] || "#f59e0b";
                  const r = (sys.star_size||5) * 1.5 + 3;
                  return (
                    <g key={sys.id} onClick={()=>loadSystem(sys)} style={{cursor:"pointer"}}>
                      {isSelected && <circle cx={sys.pos_x} cy={sys.pos_y} r={r+12} fill="none" stroke={col} strokeWidth="1.5" opacity="0.5" strokeDasharray="4 2"/>}
                      <circle cx={sys.pos_x} cy={sys.pos_y} r={r+5} fill={col} opacity="0.15"/>
                      <circle cx={sys.pos_x} cy={sys.pos_y} r={r} fill={col} opacity={isSelected?1:0.8}/>
                      <text x={sys.pos_x} y={sys.pos_y+r+10} textAnchor="middle" fill="white" fontSize="8" opacity="0.6">{sys.name}</text>
                      <text x={sys.pos_x} y={sys.pos_y+r+19} textAnchor="middle" fill={col} fontSize="7" opacity="0.5">{sys.planet_count}🪐</text>
                    </g>
                  );
                })}
                {/* Планеты активной системы */}
                {selSystem && sysDetail && sysDetail.planets.map((p:Planet, i:number)=>{
                  const angle = (i/(sysDetail.planets.length))*Math.PI*2;
                  const orbitR = 45 + i*22;
                  const px = selSystem.pos_x + Math.cos(angle)*orbitR;
                  const py = selSystem.pos_y + Math.sin(angle)*orbitR;
                  const col = PLANET_COLORS[p.planet_type] || "#94a3b8";
                  const pr = (p.size||3)*0.8+2;
                  return (
                    <g key={p.id} onClick={e=>{e.stopPropagation();setSelPlanet(p);}}>
                      <circle cx={selSystem.pos_x} cy={selSystem.pos_y} r={orbitR} fill="none" stroke="white" strokeWidth="0.3" opacity="0.15"/>
                      <circle cx={px} cy={py} r={pr+4} fill={col} opacity="0.2"/>
                      <circle cx={px} cy={py} r={pr} fill={col} opacity={selPlanet?.id===p.id?1:0.7} stroke={p.owner_id===res.id?"#22c55e":p.is_ai_controlled?"#ef4444":p.owner_id?"#f59e0b":"none"} strokeWidth="1.5"/>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Панель детали */}
            <div className="w-72 flex flex-col gap-3">
              {selSystem ? (
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="font-black">{selSystem.name}</div>
                      <div className="text-xs text-white/40">Сектор {selSystem.sector} · {selSystem.star_type}</div>
                    </div>
                  </div>
                  {sysDetail && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-white/50 mb-2">Планеты в системе:</div>
                      {sysDetail.planets.map((p:Planet)=>(
                        <button key={p.id} onClick={()=>setSelPlanet(p)}
                          className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${selPlanet?.id===p.id?"bg-blue-500/20 border-blue-500/40":"bg-white/5 border-white/10 hover:border-white/30"}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{p.name}</span>
                            <span style={{color:PLANET_COLORS[p.planet_type]||"#94a3b8"}} className="text-[10px]">⬤ {p.planet_type}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">
                            {p.owner_id===res.id ? "✅ Моя колония" : p.is_ai_controlled ? "🤖 ИИ" : p.owner_id ? `👤 ${p.owner_nickname}` : "🆓 Свободна"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 text-center text-white/30">
                  <div className="text-4xl mb-2">🌌</div>
                  <div className="text-sm">Нажмите на звёздную систему</div>
                </div>
              )}

              {selPlanet && (
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10">
                  <div className="font-black mb-1">{selPlanet.name}</div>
                  <div className="text-xs text-white/50 mb-2">{selPlanet.planet_type} · Размер {selPlanet.size}</div>
                  <div className="grid grid-cols-3 gap-1 mb-3 text-[10px]">
                    <div className="bg-white/5 rounded-lg p-1.5 text-center"><div>⛏️</div><div>{selPlanet.metal_richness}x</div></div>
                    <div className="bg-white/5 rounded-lg p-1.5 text-center"><div>⚡</div><div>{selPlanet.energy_richness}x</div></div>
                    <div className="bg-white/5 rounded-lg p-1.5 text-center"><div>💎</div><div>{selPlanet.crystal_richness}x</div></div>
                  </div>
                  <div className="text-xs mb-3">
                    {selPlanet.owner_id===res.id ? <span className="text-green-400 font-bold">✅ Ваша колония</span>
                    : selPlanet.is_ai_controlled ? <span className="text-red-400">🤖 ИИ-флот уровня {selPlanet.ai_fleet_tier}</span>
                    : selPlanet.owner_id ? <span className="text-yellow-400">👤 {selPlanet.owner_nickname} ({selPlanet.owner_race})</span>
                    : <span className="text-green-400">🆓 Свободная планета</span>}
                  </div>
                  {selPlanet.owner_id !== res.id && fleets.length>0 && (
                    <div>
                      <div className="text-[10px] text-white/40 mb-1.5">Выберите флот для атаки:</div>
                      <select value={battleFleetId||""} onChange={e=>setBattleFleetId(Number(e.target.value))}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs mb-2">
                        <option value="">— выбрать флот —</option>
                        {fleets.map(f=><option key={f.id} value={f.id}>{f.name} (мощь {f.total_attack+f.total_defense})</option>)}
                      </select>
                      <button onClick={()=>battleFleetId&&doAttack(battleFleetId, selPlanet.id)}
                        disabled={!battleFleetId}
                        className="w-full py-2 bg-red-700 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/30 rounded-xl text-xs font-bold transition">
                        ⚔️ {selPlanet.owner_id ? "Атаковать" : "Колонизировать"}
                      </button>
                    </div>
                  )}
                  {battleLog.length>0&&<div className="mt-2 space-y-0.5">{battleLog.map((l,i)=><div key={i} className={`text-[10px] ${l.startsWith("✅")?"text-green-400":l.startsWith("❌")?"text-red-400":"text-white/60"}`}>{l}</div>)}</div>}
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
          <div>
            <h2 className="font-black text-xl mb-4">🤝 Дипломатия</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {icon:"🕊️",name:"Мирный договор",desc:"Заключите перемирие с другой империей",color:"border-green-500/20 bg-green-500/5"},
                {icon:"🤝",name:"Торговый союз",desc:"Откройте торговые маршруты и скидки",color:"border-blue-500/20 bg-blue-500/5"},
                {icon:"⚔️",name:"Объявить войну",desc:"Начните открытый конфликт за ресурсы",color:"border-red-500/20 bg-red-500/5"},
              ].map(d=>(
                <div key={d.name} className={`rounded-2xl p-4 border ${d.color}`}>
                  <div className="text-3xl mb-2">{d.icon}</div>
                  <div className="font-black mb-1">{d.name}</div>
                  <div className="text-xs text-white/50 mb-3">{d.desc}</div>
                  <div className="text-xs text-white/30">Скоро · В разработке</div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center text-white/30">
              <div className="text-4xl mb-3">🏛️</div>
              <div>Дипломатические отношения</div>
              <div className="text-xs mt-1">Функция будет доступна в следующем обновлении</div>
            </div>
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
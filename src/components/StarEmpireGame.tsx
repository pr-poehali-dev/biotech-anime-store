import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── КОНСТАНТЫ API ────────────────────────────────────────────────────────────
const API_AUTH = "https://functions.poehali.dev/32fa56a2-c59d-4578-b0d8-563d38cc813d";
const API_STATE = "https://functions.poehali.dev/72cb1350-93b4-4cf8-818c-b0db327b594a";
const API_AI = "https://functions.poehali.dev/503c2b2a-2234-401e-bdd4-8aebc8cafe54";

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────
type RaceId = "terrans"|"zephyrians"|"vorath"|"crystallids"|"necrons"|"biotech"|"mechanoids";
type BuildingId = "mine"|"solar"|"lab"|"shipyard"|"barracks"|"crystal_extractor"|"shield_gen"|"market";
type TechId = "plasma"|"shields"|"warp"|"nanobots"|"dark_matter"|"quantum";
type ShipId = "scout"|"fighter"|"cruiser"|"battleship"|"dreadnought"|
              "terminator_scout"|"terminator_fighter"|"terminator_cruiser"|"terminator_overlord";
type TabId = "colony"|"fleet"|"tech"|"battle"|"ai"|"chat"|"alliance"|"shop";

interface Resources { metal:number; energy:number; crystals:number; population:number; }
interface ChatMsg { id:number; player_id:number; nickname:string; race:string; race_emoji:string; message:string; created_at:string; }
interface AllianceInfo { id:number; name:string; race:string; emblem:string; description:string; members:number; leader_id:number; leader_name:string; }
interface AgreementInfo { id:number; type:string; tech_id:string|null; expires_at:string; }
interface Player {
  id:number; nickname:string; race:RaceId;
  resources:Partial<Resources>; buildings:Record<string,number>;
  ships:Record<string,number>; techs:Record<string,number|boolean>;
  tick:number; score:number; alliance_id:number|null;
  repair_bots:number; repair_kits:number;
}

// ─── РАСЫ ─────────────────────────────────────────────────────────────────────
const RACES: Record<RaceId,{name:string;icon:string;desc:string;bonus:string;grad:string;startRes:Resources}> = {
  terrans:    {name:"Терранцы",     icon:"🌍", desc:"Потомки Земли. Универсальные воины и дипломаты.",       bonus:"+20% металл",         grad:"from-blue-900 via-blue-800 to-slate-900",    startRes:{metal:500,energy:300,crystals:150,population:10}},
  zephyrians: {name:"Зефирийцы",    icon:"🌬️", desc:"Газообразные существа из туманностей. Энергетики.",    bonus:"+30% энергия",         grad:"from-cyan-900 via-teal-800 to-slate-900",    startRes:{metal:300,energy:600,crystals:150,population:10}},
  vorath:     {name:"Воратх",       icon:"🔥", desc:"Огненная раса. Лучшие бойцы с мощным флотом.",          bonus:"+25% атака флота",     grad:"from-red-900 via-orange-800 to-slate-900",   startRes:{metal:700,energy:250,crystals:100,population:8}},
  crystallids:{name:"Кристаллиды",  icon:"💎", desc:"Кремниевые существа. Технологические гении.",           bonus:"+40% кристаллы",       grad:"from-purple-900 via-violet-800 to-slate-900",startRes:{metal:350,energy:280,crystals:500,population:9}},
  necrons:    {name:"Некроны",      icon:"💀", desc:"Древние машины. Неуязвимы для обычного оружия.",         bonus:"+35% защита",          grad:"from-emerald-900 via-green-800 to-slate-900", startRes:{metal:400,energy:450,crystals:250,population:7}},
  biotech:    {name:"Биотех",       icon:"🧬", desc:"Биоинженеры. Создают живые корабли и органические базы.",bonus:"+30% население, регенерация",grad:"from-lime-900 via-green-900 to-slate-900",  startRes:{metal:300,energy:350,crystals:200,population:15}},
  mechanoids: {name:"Механойды",    icon:"⚙️", desc:"Раса машин. Добывают ресурсы вдвое быстрее.",           bonus:"+50% металл и энергия",grad:"from-slate-800 via-zinc-800 to-slate-900",    startRes:{metal:800,energy:500,crystals:100,population:5}},
};

// ─── ЗДАНИЯ ───────────────────────────────────────────────────────────────────
const BUILDINGS: {id:BuildingId;name:string;icon:string;desc:string;maxLvl:number;cost:(l:number)=>Partial<Resources>;prod:(l:number)=>Partial<Resources>}[] = [
  {id:"mine",             name:"Астероидная шахта",   icon:"⛏️", desc:"Добывает металл",           maxLvl:10, cost:l=>({metal:100*l,energy:30*l}),               prod:l=>({metal:15*l})},
  {id:"solar",            name:"Солнечный реактор",   icon:"☀️", desc:"Вырабатывает энергию",       maxLvl:10, cost:l=>({metal:80*l,crystals:20*l}),              prod:l=>({energy:12*l})},
  {id:"lab",              name:"Научная станция",      icon:"🔬", desc:"Ускоряет исследования",      maxLvl:8,  cost:l=>({metal:150*l,energy:60*l,crystals:40*l}), prod:l=>({crystals:5*l})},
  {id:"shipyard",         name:"Звёздная верфь",       icon:"🚀", desc:"Строит корабли. Ремонт Т-кораблей",maxLvl:8, cost:l=>({metal:200*l,energy:80*l}),          prod:l=>({metal:5*l})},
  {id:"barracks",         name:"Казармы пилотов",      icon:"👨‍🚀",desc:"Обучает пилотов",           maxLvl:6,  cost:l=>({metal:120*l,energy:40*l}),               prod:l=>({population:3*l})},
  {id:"crystal_extractor",name:"Добытчик кристаллов", icon:"💎", desc:"Извлекает кристаллы",        maxLvl:8,  cost:l=>({metal:180*l,energy:70*l}),               prod:l=>({crystals:10*l})},
  {id:"shield_gen",       name:"Планетарный щит",      icon:"🛡️", desc:"Защита от ударов",          maxLvl:5,  cost:l=>({metal:300*l,energy:150*l,crystals:80*l}),prod:l=>({energy:-5*l})},
  {id:"market",           name:"Торговый хаб",         icon:"🏪", desc:"Торгует с цивилизациями",   maxLvl:5,  cost:l=>({metal:100*l,crystals:50*l}),             prod:l=>({metal:8*l,crystals:3*l})},
];

// ─── ТЕХНОЛОГИИ ───────────────────────────────────────────────────────────────
const TECHS: {id:TechId;name:string;icon:string;desc:string;maxLvl:number;cost:Partial<Resources>;effect:string}[] = [
  {id:"plasma",     name:"Плазменное оружие",  icon:"⚡", desc:"Плазменные пушки",            maxLvl:3, cost:{crystals:200,energy:150},          effect:"+15% атака за уровень"},
  {id:"shields",    name:"Силовые щиты",        icon:"🔵", desc:"Энергетические барьеры",      maxLvl:3, cost:{crystals:180,energy:200},          effect:"+15% защита за уровень"},
  {id:"warp",       name:"Варп-двигатель",      icon:"🌀", desc:"Прыжки через подпространство", maxLvl:2, cost:{crystals:350,metal:200},          effect:"Дальние миссии"},
  {id:"nanobots",   name:"Нанороботы",          icon:"🤖", desc:"Авторемонт в бою",            maxLvl:2, cost:{crystals:300,energy:100},          effect:"+10% регенерация HP"},
  {id:"dark_matter",name:"Тёмная материя",      icon:"🌑", desc:"Оружие из тёмной материи",    maxLvl:1, cost:{crystals:500,energy:400,metal:300},effect:"+50% урон дредноутов"},
  {id:"quantum",    name:"Квантовый компьютер", icon:"💻", desc:"Анализ поля боя",             maxLvl:2, cost:{crystals:250,metal:150,energy:120},effect:"+20% всё производство"},
];

// ─── КОРАБЛИ ──────────────────────────────────────────────────────────────────
const SHIPS: {id:ShipId;name:string;icon:string;atk:number;def:number;cost:Partial<Resources>;aiOnly?:boolean}[] = [
  {id:"scout",               name:"Разведчик",      icon:"🛸", atk:5,   def:3,   cost:{metal:50,energy:20}},
  {id:"fighter",             name:"Истребитель",    icon:"✈️", atk:15,  def:10,  cost:{metal:120,energy:40}},
  {id:"cruiser",             name:"Крейсер",        icon:"🚀", atk:40,  def:30,  cost:{metal:300,energy:100,crystals:50}},
  {id:"battleship",          name:"Линкор",         icon:"⚔️", atk:100, def:80,  cost:{metal:600,energy:200,crystals:150}},
  {id:"dreadnought",         name:"Дредноут",       icon:"🌟", atk:250, def:200, cost:{metal:1200,energy:400,crystals:350}},
  {id:"terminator_scout",    name:"Т-Разведчик",    icon:"🤖", atk:30,  def:20,  cost:{metal:300,crystals:100},   aiOnly:true},
  {id:"terminator_fighter",  name:"Т-Истребитель",  icon:"🦾", atk:80,  def:60,  cost:{metal:600,crystals:250},   aiOnly:true},
  {id:"terminator_cruiser",  name:"Т-Крейсер",      icon:"🔩", atk:200, def:180, cost:{metal:1200,crystals:500},  aiOnly:true},
  {id:"terminator_overlord", name:"Т-Повелитель",   icon:"☠️", atk:500, def:450, cost:{metal:2500,crystals:1000,energy:500}, aiOnly:true},
];

// ─── ВРАГИ ────────────────────────────────────────────────────────────────────
const ENEMIES = [
  {name:"Пираты Окраины",    icon:"🏴‍☠️",atk:50,  def:30,  reward:{metal:80, crystals:30}},
  {name:"Рейдеры Туманности",icon:"👾",  atk:120, def:90,  reward:{metal:150,crystals:80}},
  {name:"Флот Изгнанников",  icon:"💀",  atk:250, def:200, reward:{metal:300,crystals:150}},
  {name:"Имперский Патруль", icon:"🔱",  atk:400, def:350, reward:{metal:500,crystals:250}},
  {name:"Древний Страж",     icon:"🌑",  atk:800, def:600, reward:{metal:800,crystals:400,energy:300}},
];

const RANDOM_EVENTS = [
  {text:"Метеоритный дождь! −50 металла.",               type:"bad"  as const, reward:{metal:-50}},
  {text:"Торговый конвой прибыл! +80 кристаллов.",       type:"good" as const, reward:{crystals:80}},
  {text:"Солнечная вспышка! +100 энергии.",              type:"good" as const, reward:{energy:100}},
  {text:"Пираты совершили набег. −60 металла.",          type:"bad"  as const, reward:{metal:-60}},
  {text:"Богатый астероид! +120 металла.",               type:"good" as const, reward:{metal:120}},
  {text:"Новые колонисты прибыли! +5 населения.",        type:"good" as const, reward:{population:5}},
  {text:"Находка артефакта! +100 кристаллов.",           type:"good" as const, reward:{crystals:100}},
];

// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────
const canAfford = (r:Partial<Resources>, cost:Partial<Resources>) =>
  (r.metal??0)>=(cost.metal??0) && (r.energy??0)>=(cost.energy??0) &&
  (r.crystals??0)>=(cost.crystals??0) && (r.population??0)>=(cost.population??0);

const addRes = (r:Partial<Resources>, b:Partial<Resources>):Partial<Resources> => ({
  metal:     Math.max(0,(r.metal??0)     +(b.metal??0)),
  energy:    Math.max(0,(r.energy??0)    +(b.energy??0)),
  crystals:  Math.max(0,(r.crystals??0)  +(b.crystals??0)),
  population:Math.max(0,(r.population??0)+(b.population??0)),
});
const subRes = (r:Partial<Resources>, c:Partial<Resources>):Partial<Resources> => ({
  metal:     Math.max(0,(r.metal??0)     -(c.metal??0)),
  energy:    Math.max(0,(r.energy??0)    -(c.energy??0)),
  crystals:  Math.max(0,(r.crystals??0)  -(c.crystals??0)),
  population:Math.max(0,(r.population??0)-(c.population??0)),
});
const fmtRes = (c:Partial<Resources>) =>
  Object.entries(c).filter(([,v])=>v&&v!==0)
    .map(([k,v])=>`${v} ${k==="metal"?"⛏️":k==="energy"?"⚡":k==="crystals"?"💎":"👥"}`).join(" ");

async function apiFetch(url:string, opts?:{method?:string;body?:object;token?:string}) {
  const headers:Record<string,string> = {"Content-Type":"application/json"};
  if (opts?.token) headers["X-Auth-Token"] = opts.token;
  const r = await fetch(url, {
    method: opts?.method || "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  return r.json();
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ────────────────────────────────────────────────────────
export default function StarEmpireGame() {
  const [phase, setPhase]         = useState<"auth"|"race"|"game">("auth");
  const [authMode, setAuthMode]   = useState<"login"|"register">("login");
  const [authForm, setAuthForm]   = useState({nickname:"",login:"",password:"",race:"terrans" as RaceId});
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [token, setToken]         = useState(()=>localStorage.getItem("st_token")||"");
  const [player, setPlayer]       = useState<Player|null>(null);

  const [resources, setResources] = useState<Partial<Resources>>({metal:500,energy:300,crystals:150,population:10});
  const [buildings, setBuildings] = useState<Record<string,number>>({});
  const [ships,     setShips]     = useState<Record<string,number>>({});
  const [techs,     setTechs]     = useState<Record<string,number|boolean>>({});
  const [tick,      setTick]      = useState(0);
  const [score,     setScore]     = useState(0);

  const [activeTab,  setActiveTab]  = useState<TabId>("colony");
  const [battleLog,  setBattleLog]  = useState<string[]>([]);
  const [eventLog,   setEventLog]   = useState<{text:string;type:"good"|"bad"|"neutral"}[]>([]);
  const [eventBadge, setEventBadge] = useState(0);

  const [chatTab,   setChatTab]   = useState<"global"|"alliance">("global");
  const [chatMsgs,  setChatMsgs]  = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLastId, setChatLastId] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const [alliances, setAlliances]   = useState<AllianceInfo[]>([]);
  const [allianceForm, setAllianceForm] = useState({name:"",emblem:"⚔️",description:""});
  const [allianceMsg, setAllianceMsg] = useState("");

  interface ShopItem { id:string; name:string; icon:string; type:string; attack?:number; defense?:number; effect?:string; ai_only_repair?:boolean; cost:Partial<Resources>; }
  interface AiFleet { name:string; attack:number; defense:number; reward:Partial<Resources>; }
  interface AiStatusType { ai_race:{ name:string; icon:string; desc:string; fleets:AiFleet[] }; ai_planets:{id:number;name:string;type:string;size:string}[]; }
  const [shopItems,   setShopItems]   = useState<ShopItem[]>([]);
  const [agreements,  setAgreements]  = useState<AgreementInfo[]>([]);
  const [aiStatus,    setAiStatus]    = useState<AiStatusType|null>(null);
  const [aiLog,       setAiLog]       = useState<string[]>([]);
  const [shopMsg,     setShopMsg]     = useState("");

  const [repairBots, setRepairBots] = useState(0);
  const [repairKits, setRepairKits] = useState(0);

  const eventIdRef = useRef(0);

  const currentRace = player ? RACES[player.race] : null;

  // Авто-вход по токену
  useEffect(() => {
    if (!token) return;
    apiFetch(`${API_AUTH}?action=me`, {token}).then(d => {
      if (d.id) {
        setPlayer(d as Player);
        loadState(d);
        setPhase("game");
      } else {
        localStorage.removeItem("st_token");
        setToken("");
      }
    }).catch(()=>{});
  }, []);

  function loadState(p: Player) {
    setResources(p.resources || RACES[p.race].startRes);
    setBuildings(p.buildings || {});
    setShips(p.ships || {});
    setTechs(p.techs || {});
    setTick(p.tick || 0);
    setScore(p.score || 0);
    setRepairBots(p.repair_bots || 0);
    setRepairKits(p.repair_kits || 0);
  }

  // Сохранение прогресса каждые 60 тиков
  useEffect(() => {
    if (!token || !player || tick % 20 !== 0 || tick === 0) return;
    apiFetch(API_AUTH, {method:"POST", token, body:{
      action:"save", buildings, ships, techs, resources, tick, score
    }}).catch(()=>{});
  }, [tick]);

  // Игровой тик — каждые 3 сек
  useEffect(() => {
    if (phase !== "game") return;
    const id = setInterval(() => setTick(t=>t+1), 3000);
    return () => clearInterval(id);
  }, [phase]);

  // Производство ресурсов
  useEffect(() => {
    if (phase !== "game" || tick === 0) return;
    setResources(prev => {
      let r = {...prev};
      BUILDINGS.forEach(b => {
        const lvl = buildings[b.id] || 0;
        if (lvl > 0) r = addRes(r, b.prod(lvl)) as Partial<Resources>;
      });
      if (player) {
        const rb = RACES[player.race];
        if (rb) {
          const bonus: Partial<Resources> = {};
          if (player.race === "terrans")     bonus.metal    = 3;
          if (player.race === "zephyrians")  bonus.energy   = 4;
          if (player.race === "crystallids") bonus.crystals = 5;
          if (player.race === "biotech")     bonus.population = 1;
          if (player.race === "mechanoids")  { bonus.metal = 5; bonus.energy = 3; }
          r = addRes(r, bonus) as Partial<Resources>;
        }
      }
      if (techs["quantum"]) {
        const lvl = Number(techs["quantum"]);
        const pct = lvl * 0.02;
        r = {metal:Math.floor((r.metal||0)*(1+pct)), energy:Math.floor((r.energy||0)*(1+pct)), crystals:Math.floor((r.crystals||0)*(1+pct)), population:r.population};
      }
      return r;
    });
    setScore(s => s+1);
    if (Math.random() < 0.08) {
      const ev = RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)];
      setEventLog(prev=>[{text:ev.text,type:ev.type},...prev].slice(0,30));
      setEventBadge(b=>b+1);
      if (ev.reward) setResources(prev=>addRes(prev, ev.reward) as Partial<Resources>);
    }
  }, [tick]);

  // Опрос чата каждые 5 сек
  useEffect(() => {
    if (phase !== "game" || activeTab !== "chat") return;
    const load = async () => {
      const url = chatTab === "global"
        ? `${API_STATE}?action=chat_global&since=${chatLastId}`
        : `${API_STATE}?action=chat_alliance&since=${chatLastId}`;
      const d = await apiFetch(url, {token}).catch(()=>null);
      if (!d) return;
      if (chatLastId === 0) {
        setChatMsgs(d.messages || []);
      } else if (d.messages?.length) {
        setChatMsgs(prev=>[...prev,...d.messages].slice(-100));
      }
      if (d.messages?.length) setChatLastId(d.messages[d.messages.length-1].id);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [phase, activeTab, chatTab]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMsgs]);

  // Загрузка альянсов
  useEffect(() => {
    if (phase !== "game" || activeTab !== "alliance") return;
    apiFetch(`${API_STATE}?action=alliances`, {token}).then(d => {
      if (d.alliances) setAlliances(d.alliances);
    }).catch(()=>{});
  }, [phase, activeTab]);

  // Загрузка магазина и соглашений
  useEffect(() => {
    if (phase !== "game" || activeTab !== "shop") return;
    apiFetch(`${API_AI}?action=shop`).then(d => { if (d.shop) setShopItems(d.shop); }).catch(()=>{});
    apiFetch(`${API_AI}?action=agreements`, {token}).then(d => { if (d.agreements) setAgreements(d.agreements); }).catch(()=>{});
    apiFetch(`${API_AI}?action=ai_status`).then(d => { if (d.ai_race) setAiStatus(d); }).catch(()=>{});
  }, [phase, activeTab]);

  // ── AUTH ──────────────────────────────────────────────────────────────────────
  async function handleAuth() {
    setAuthError(""); setAuthLoading(true);
    try {
      const body = authMode === "register"
        ? {action:"register", ...authForm}
        : {action:"login", login:authForm.login, password:authForm.password};
      const d = await apiFetch(API_AUTH, {method:"POST", body});
      if (d.error) { setAuthError(d.error); return; }
      localStorage.setItem("st_token", d.token);
      setToken(d.token);
      const playerData = authMode === "register"
        ? await apiFetch(`${API_AUTH}?action=me`, {token:d.token})
        : d.player;
      setPlayer(playerData as Player);
      loadState(playerData as Player);
      setPhase("game");
    } catch(e) {
      setAuthError("Ошибка соединения");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("st_token");
    setToken(""); setPlayer(null); setPhase("auth");
    setBuildings({}); setShips({}); setTechs({}); setTick(0); setScore(0);
  }

  // ── ИГРОВЫЕ ДЕЙСТВИЯ ─────────────────────────────────────────────────────────
  const upgradeBuilding = useCallback((id:BuildingId) => {
    const b = BUILDINGS.find(x=>x.id===id)!;
    const lvl = buildings[id]||0;
    if (lvl >= b.maxLvl) return;
    const cost = b.cost(lvl+1);
    if (!canAfford(resources, cost)) return;
    setResources(r=>subRes(r,cost) as Partial<Resources>);
    setBuildings(prev=>({...prev,[id]:(prev[id]||0)+1}));
  }, [resources, buildings]);

  const researchTech = useCallback((id:TechId) => {
    const t = TECHS.find(x=>x.id===id)!;
    const lvl = Number(techs[id]||0);
    if (lvl >= t.maxLvl) return;
    const cost = lvl===0 ? t.cost : Object.fromEntries(Object.entries(t.cost).map(([k,v])=>[k,Math.floor((v as number)*1.8)]));
    if (!canAfford(resources, cost)) return;
    setResources(r=>subRes(r,cost) as Partial<Resources>);
    setTechs(prev=>({...prev,[id]:(Number(prev[id]||0))+1}));
  }, [resources, techs]);

  const buildShip = useCallback((id:ShipId) => {
    const s = SHIPS.find(x=>x.id===id)!;
    if (s.aiOnly) return; // куплено только через магазин ИИ
    if (!canAfford(resources, s.cost)) return;
    setResources(r=>subRes(r,s.cost) as Partial<Resources>);
    setShips(prev=>({...prev,[id]:(prev[id]||0)+1}));
    setScore(s=>s+5);
  }, [resources]);

  const doBattle = useCallback((idx:number) => {
    const enemy = ENEMIES[idx];
    let myAtk = SHIPS.reduce((s,sh)=>s+(sh.atk*(ships[sh.id]||0)),0);
    let myDef = SHIPS.reduce((s,sh)=>s+(sh.def*(ships[sh.id]||0)),0);
    const plasmaLvl = Number(techs["plasma"]||0);
    const shieldsLvl = Number(techs["shields"]||0);
    if (plasmaLvl) myAtk *= (1+plasmaLvl*0.15);
    if (shieldsLvl) myDef *= (1+shieldsLvl*0.15);
    if (techs["dark_matter"]) myAtk *= 1.5;
    if (techs["ai_nanoshield"]) myDef *= 1.3;
    if (techs["ai_targeting"]) myAtk *= 1.35;
    if (player?.race==="vorath") myAtk*=1.25;
    if (player?.race==="necrons") myDef*=1.35;
    if (player?.race==="mechanoids") { myAtk*=1.1; myDef*=1.1; }

    const ps = myAtk*0.6+myDef*0.4;
    const es = enemy.atk*0.6+enemy.def*0.4;
    const roll = Math.random()*0.4-0.2;
    const win = (ps+ps*roll) > es;

    const log = [
      `⚔️ Сражение с «${enemy.name}»!`,
      `Ваши — Атака: ${Math.floor(myAtk)}, Защита: ${Math.floor(myDef)}`,
      `Враг — Атака: ${enemy.atk}, Защита: ${enemy.def}`,
    ];
    if (win) {
      log.push("✅ ПОБЕДА! Враг разгромлен!"); log.push(`Награда: ${fmtRes(enemy.reward)}`);
      setResources(r=>addRes(r,enemy.reward) as Partial<Resources>);
      setScore(s=>s+50+idx*30);
      setEventLog(prev=>[{text:`Победа над «${enemy.name}»!`,type:"good"},...prev].slice(0,30));
    } else {
      log.push("❌ ПОРАЖЕНИЕ! Флот отступил.");
      setShips(prev=>Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,Math.max(0,Math.floor(Number(v)*0.7))])));
      setEventLog(prev=>[{text:`Поражение от «${enemy.name}»`,type:"bad"},...prev].slice(0,30));
    }
    setBattleLog(log);
    setEventBadge(b=>b+1);
  }, [ships, techs, player]);

  // ── ЧАТS ─────────────────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || !token) return;
    const d = await apiFetch(API_STATE, {method:"POST", token, body:{action:"chat_send", channel:chatTab, message:chatInput}}).catch(()=>null);
    if (d?.sent) {
      setChatMsgs(prev=>[...prev,{id:d.id,player_id:player!.id,nickname:player!.nickname,
        race:player!.race,race_emoji:RACES[player!.race]?.icon||"👤",message:chatInput,created_at:new Date().toISOString()}]);
      setChatInput("");
    }
  }

  // ── АЛЬЯНСЫ ──────────────────────────────────────────────────────────────────
  async function createAlliance() {
    if (!allianceForm.name.trim()) return;
    const d = await apiFetch(API_STATE, {method:"POST", token, body:{action:"create_alliance",...allianceForm}}).catch(()=>null);
    if (d?.created) {
      setAllianceMsg("✅ Альянс создан!");
      setPlayer(p=>p?{...p,alliance_id:d.alliance_id}:p);
    } else setAllianceMsg(d?.error||"Ошибка");
  }

  async function joinAlliance(id:number) {
    const d = await apiFetch(API_STATE, {method:"POST", token, body:{action:"join_alliance",alliance_id:id}}).catch(()=>null);
    if (d?.joined) {
      setAllianceMsg("✅ Вы вступили в альянс!");
      setPlayer(p=>p?{...p,alliance_id:id}:p);
    } else setAllianceMsg(d?.error||"Ошибка");
  }

  async function leaveAlliance() {
    const d = await apiFetch(API_STATE, {method:"POST", token, body:{action:"leave_alliance"}}).catch(()=>null);
    if (d?.left) {
      setAllianceMsg("✅ Вы покинули альянс.");
      setPlayer(p=>p?{...p,alliance_id:null}:p);
    }
  }

  // ── МАГАЗИН ИИ ────────────────────────────────────────────────────────────────
  async function buyItem(item_id:string, qty=1) {
    setShopMsg("");
    const d = await apiFetch(API_AI, {method:"POST", token, body:{action:"buy",item_id,quantity:qty}}).catch(()=>null);
    if (!d) { setShopMsg("Ошибка соединения"); return; }
    if (d.error) { setShopMsg("❌ "+d.error); return; }
    setResources(d.resources);
    if (d.ships) setShips(d.ships);
    if (d.techs) setTechs(prev=>({...prev,...d.techs}));
    if (d.item.includes("bot")) setRepairBots(b=>b+qty);
    if (d.item.includes("kit")) setRepairKits(k=>k+qty);
    setShopMsg(`✅ Куплено: ${d.item}`);
  }

  async function makeAgreement(type:string) {
    setShopMsg("");
    const d = await apiFetch(API_AI, {method:"POST", token, body:{action:"make_agreement",type}}).catch(()=>null);
    if (!d) { setShopMsg("Ошибка"); return; }
    if (d.error) { setShopMsg("❌ "+d.error); return; }
    setResources(d.resources);
    setAgreements(prev=>[...prev,{id:d.agreement_id,type,tech_id:null,expires_at:""}]);
    setShopMsg("✅ "+d.message);
  }

  async function repairShip(ship_id:string) {
    if (repairBots<1||repairKits<1) { setShopMsg("❌ Нужен бот и комплект. Купите в магазине ИИ."); return; }
    const d = await apiFetch(API_AI, {method:"POST", token, body:{action:"repair_ship",ship_id}}).catch(()=>null);
    if (d?.repaired) {
      setRepairBots(b=>b-1); setRepairKits(k=>k-1);
      setShopMsg("✅ "+d.message);
    } else setShopMsg("❌ "+(d?.error||"Ошибка"));
  }

  // ── ЭКРАН АВТОРИЗАЦИИ ────────────────────────────────────────────────────────
  if (phase === "auth") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🚀</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Космические<br/>Путешественники
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Многопользовательская стратегия</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
            <div className="flex gap-2 mb-5">
              {(["login","register"] as const).map(m=>(
                <button key={m} onClick={()=>setAuthMode(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${authMode===m?"bg-blue-600 text-white":"bg-white/5 text-white/50 hover:bg-white/10"}`}>
                  {m==="login"?"🔑 Войти":"✨ Регистрация"}
                </button>
              ))}
            </div>

            {authMode==="register" && (
              <div className="mb-3">
                <label className="text-xs text-white/50 mb-1 block">Никнейм</label>
                <input value={authForm.nickname} onChange={e=>setAuthForm(f=>({...f,nickname:e.target.value}))}
                  placeholder="Капитан Нова" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
              </div>
            )}

            <div className="mb-3">
              <label className="text-xs text-white/50 mb-1 block">Логин</label>
              <input value={authForm.login} onChange={e=>setAuthForm(f=>({...f,login:e.target.value}))}
                placeholder="captain@galaxy.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
            </div>

            <div className="mb-4">
              <label className="text-xs text-white/50 mb-1 block">Пароль</label>
              <input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}
                placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
            </div>

            {authMode==="register" && (
              <div className="mb-4">
                <label className="text-xs text-white/50 mb-1 block">Раса</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(RACES) as [RaceId,typeof RACES[RaceId]][]).map(([id,r])=>(
                    <button key={id} onClick={()=>setAuthForm(f=>({...f,race:id}))}
                      className={`text-left px-3 py-2 rounded-xl border text-xs transition-all ${authForm.race===id?"border-blue-500 bg-blue-500/20":"border-white/10 hover:border-white/30"}`}>
                      <div className="font-bold">{r.icon} {r.name}</div>
                      <div className="text-white/40">{r.bonus}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {authError && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-3 py-2 mb-3">{authError}</div>}

            <button onClick={handleAuth} disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
              {authLoading ? "⏳ Загрузка..." : authMode==="login" ? "🚀 Войти" : "🌟 Создать аккаунт"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ОСНОВНАЯ ИГРА ────────────────────────────────────────────────────────────
  const totalFleet = SHIPS.reduce((s,sh)=>s+((sh.atk+sh.def)*(ships[sh.id]||0)),0);
  const race = currentRace || RACES.terrans;

  const tabs: {id:TabId;label:string;icon:string;badge?:number}[] = [
    {id:"colony",  label:"Колония",  icon:"🏗️"},
    {id:"fleet",   label:"Флот",     icon:"🚀"},
    {id:"tech",    label:"Наука",    icon:"🔬"},
    {id:"battle",  label:"Битвы",    icon:"⚔️"},
    {id:"ai",      label:"Терминаторы",icon:"🤖"},
    {id:"shop",    label:"Магазин",  icon:"🛒"},
    {id:"chat",    label:"Чат",      icon:"💬"},
    {id:"alliance",label:"Альянс",   icon:"🔱"},
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${race.grad} text-white`}>
      {/* ШАПКА */}
      <div className="bg-black/40 backdrop-blur border-b border-white/10 px-3 py-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{race.icon}</span>
              <div>
                <div className="font-black text-sm leading-none">{player?.nickname} · {race.name}</div>
                <div className="text-[10px] text-white/40">Тик #{tick} · ⭐ {score}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">🔧{repairBots} 🧰{repairKits}</span>
              <button onClick={logout} className="text-xs text-white/30 hover:text-white/60 transition px-2 py-1 rounded-lg hover:bg-white/10">Выйти</button>
            </div>
          </div>
          {/* Ресурсы */}
          <div className="grid grid-cols-4 gap-1.5">
            {[["⛏️","Металл",resources.metal||0],["⚡","Энергия",resources.energy||0],["💎","Кристаллы",resources.crystals||0],["👥","Население",resources.population||0]].map(([ic,lb,val])=>(
              <div key={lb as string} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                <div className="text-sm">{ic}</div>
                <div className="font-black text-xs">{val}</div>
                <div className="text-[9px] text-white/40">{lb}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ТАБЫ */}
      <div className="bg-black/20 border-b border-white/10 px-3">
        <div className="max-w-5xl mx-auto flex gap-0.5 overflow-x-auto py-1 no-scrollbar">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setActiveTab(t.id);if(t.id==="chat")setChatLastId(0);}}
              className={`relative flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab===t.id?"bg-white/20":"text-white/50 hover:text-white hover:bg-white/10"}`}>
              {t.icon} {t.label}
              {t.id==="events"&&eventBadge>0&&<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">{eventBadge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-3">

        {/* ── КОЛОНИЯ ── */}
        {activeTab==="colony" && (
          <div>
            <h3 className="font-black text-lg mb-3">🏗️ Управление колонией</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BUILDINGS.map(b=>{
                const lvl = buildings[b.id]||0;
                const cost = b.cost(lvl+1);
                const canUp = lvl<b.maxLvl && canAfford(resources,cost);
                const prod = lvl>0 ? b.prod(lvl) : null;
                return (
                  <div key={b.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{b.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{b.name}</div>
                        <div className="text-[10px] text-white/40">{b.desc}</div>
                        {prod&&<div className="text-[10px] text-green-400">+{fmtRes(prod)}/тик</div>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-yellow-400">{lvl}<span className="text-white/30 text-[10px]">/{b.maxLvl}</span></div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                      <div className="h-1 rounded-full bg-blue-400" style={{width:`${(lvl/b.maxLvl)*100}%`}}/>
                    </div>
                    {lvl>=b.maxLvl
                      ? <div className="text-center text-[10px] text-yellow-400">✅ Максимум</div>
                      : <button onClick={()=>upgradeBuilding(b.id)} disabled={!canUp}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${canUp?"bg-blue-600 hover:bg-blue-500":"bg-white/5 text-white/30 cursor-not-allowed"}`}>
                          Улучшить → {fmtRes(cost)}
                        </button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ФЛОТ ── */}
        {activeTab==="fleet" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-lg">🚀 Флот</h3>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">Мощь: <b className="text-yellow-400">{totalFleet}</b></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SHIPS.filter(s=>!s.aiOnly).map(s=>(
                <div key={s.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-white/50">⚔️{s.atk} 🛡️{s.def} · {fmtRes(s.cost)}</div>
                    </div>
                    <div className="text-xl font-black text-cyan-400">{ships[s.id]||0}</div>
                  </div>
                  <button onClick={()=>buildShip(s.id)} disabled={!canAfford(resources,s.cost)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold ${canAfford(resources,s.cost)?"bg-cyan-700 hover:bg-cyan-600":"bg-white/5 text-white/30 cursor-not-allowed"}`}>
                    🔨 Построить
                  </button>
                </div>
              ))}
              {/* Корабли ИИ в наличии */}
              {SHIPS.filter(s=>s.aiOnly && (ships[s.id]||0)>0).map(s=>(
                <div key={s.id} className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-yellow-400/70">⚔️{s.atk} 🛡️{s.def} · Куплен у ИИ</div>
                    </div>
                    <div className="text-xl font-black text-yellow-400">{ships[s.id]||0}</div>
                  </div>
                  <button onClick={()=>repairShip(s.id)}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-yellow-700/50 hover:bg-yellow-700 transition">
                    🔧 Ремонт (🤖{repairBots} 🧰{repairKits})
                  </button>
                  {shopMsg&&<div className="text-[10px] text-yellow-300 mt-1">{shopMsg}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ТЕХНОЛОГИИ ── */}
        {activeTab==="tech" && (
          <div>
            <h3 className="font-black text-lg mb-3">🔬 Исследования</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TECHS.map(t=>{
                const lvl = Number(techs[t.id]||0);
                const cost = lvl===0?t.cost:Object.fromEntries(Object.entries(t.cost).map(([k,v])=>[k,Math.floor((v as number)*1.8)]));
                const canR = lvl<t.maxLvl && canAfford(resources,cost);
                return (
                  <div key={t.id} className={`bg-white/10 rounded-xl p-3 border ${lvl>0?"border-purple-500/40":"border-white/10"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{t.name} {lvl>0&&<span className="text-[10px] bg-purple-500/30 text-purple-300 px-1 py-0.5 rounded">ур.{lvl}</span>}</div>
                        <div className="text-[10px] text-green-400">{t.effect}</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                      <div className="h-1 rounded-full bg-purple-500" style={{width:`${(lvl/t.maxLvl)*100}%`}}/>
                    </div>
                    {lvl>=t.maxLvl
                      ? <div className="text-center text-[10px] text-purple-400">✅ Изучено</div>
                      : <button onClick={()=>researchTech(t.id)} disabled={!canR}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold ${canR?"bg-purple-700 hover:bg-purple-600":"bg-white/5 text-white/30 cursor-not-allowed"}`}>
                          🔬 Исследовать → {fmtRes(cost)}
                        </button>}
                  </div>
                );
              })}
              {/* Технологии ИИ если куплены */}
              {["ai_nanoshield","ai_targeting","ai_warp_core"].filter(id=>techs[id]).map(id=>(
                <div key={id} className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
                  <div className="text-sm font-bold text-yellow-300">
                    {id==="ai_nanoshield"?"🔷 Нанощит ИИ":id==="ai_targeting"?"🎯 ИИ-наведение":"🌀 Варп-ядро ИИ"} <span className="text-xs bg-yellow-500/20 px-1 rounded">ИИ</span>
                  </div>
                  <div className="text-[10px] text-yellow-400/70 mt-0.5">Технология Терминаторов. Активна.</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── БИТВЫ ── */}
        {activeTab==="battle" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-lg">⚔️ Боевые операции</h3>
              <span className="text-xs text-white/40">Мощь флота: <b className="text-yellow-400">{totalFleet}</b></span>
            </div>
            {totalFleet===0&&<div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-300 mb-3">⚠️ Флот пуст! Постройте корабли.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {ENEMIES.map((e,idx)=>{
                const str = e.atk+e.def;
                const winChance = Math.min(100,Math.floor((totalFleet/Math.max(1,str))*100));
                return (
                  <div key={idx} className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{e.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{e.name}</div>
                        <div className="text-[10px] text-white/50">⚔️{e.atk} 🛡️{e.def}</div>
                        <div className="text-[10px] text-yellow-400">Награда: {fmtRes(e.reward)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-white/40">Шанс победы</span><span className={winChance>=60?"text-green-400":winChance>=40?"text-yellow-400":"text-red-400"}>{winChance}%</span></div>
                    <div className="w-full bg-white/10 rounded-full h-1 mb-2"><div className={`h-1 rounded-full ${winChance>=60?"bg-green-500":winChance>=40?"bg-yellow-500":"bg-red-500"}`} style={{width:`${winChance}%`}}/></div>
                    <button onClick={()=>doBattle(idx)} disabled={totalFleet===0}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold ${totalFleet>0?"bg-red-700 hover:bg-red-600":"bg-white/5 text-white/30 cursor-not-allowed"}`}>
                      ⚔️ Атаковать
                    </button>
                  </div>
                );
              })}
            </div>
            {battleLog.length>0&&(
              <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                <div className="font-bold text-sm mb-2">📋 Журнал</div>
                {battleLog.map((l,i)=><div key={i} className={`text-xs ${l.startsWith("✅")?"text-green-400":l.startsWith("❌")?"text-red-400":"text-white/60"}`}>{l}</div>)}
              </div>
            )}
            {eventLog.length>0&&(
              <div className="mt-3 bg-black/30 rounded-xl p-3">
                <div className="font-bold text-sm mb-2">📡 События</div>
                {eventLog.slice(0,10).map((e,i)=>(
                  <div key={i} className={`text-xs mb-1 ${e.type==="good"?"text-green-400":e.type==="bad"?"text-red-400":"text-white/50"}`}>
                    {e.type==="good"?"✅":e.type==="bad"?"⚠️":"ℹ️"} {e.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ТЕРМИНАТОРЫ ── */}
        {activeTab==="ai" && (
          <div>
            <h3 className="font-black text-lg mb-3">🤖 Терминаторы — Раса ИИ</h3>
            <div className="bg-slate-900/60 rounded-xl p-4 border border-yellow-500/20 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-4xl">☠️</span>
                <div>
                  <div className="font-black text-yellow-300">Терминаторы</div>
                  <div className="text-xs text-white/60">Древняя раса машин. Контролируют незаселённые планеты. Обладают лучшими кораблями и технологиями. Можно торговать, заключать соглашения или сражаться.</div>
                </div>
              </div>
            </div>
            {aiStatus && (
              <div className="mb-3">
                <div className="text-sm font-bold mb-2">🪐 Незаселённые планеты под контролем ИИ</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(aiStatus.ai_planets||[]).slice(0,6).map((p)=>(
                    <div key={p.id} className="bg-white/5 rounded-lg p-2 border border-white/10 text-xs">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-white/40">{p.type} · {p.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3">
              <div className="text-sm font-bold mb-2">🤝 Соглашения с ИИ</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                {[
                  {type:"trade",    icon:"💱",name:"Торговое",    desc:"−20% цены в магазине ИИ на 48ч", cost:"500⛏️ 200💎"},
                  {type:"tech",     icon:"🔬",name:"Технологии", desc:"Доступ к техам ИИ",              cost:"800⛏️ 400💎"},
                  {type:"ceasefire",icon:"🕊️",name:"Перемирие",  desc:"ИИ не атакует 48ч",             cost:"300⛏️ 150💎"},
                ].map(a=>{
                  const active = agreements.some(ag=>ag.type===a.type);
                  return (
                    <div key={a.type} className={`bg-white/5 rounded-xl p-3 border ${active?"border-green-500/40":"border-white/10"}`}>
                      <div className="text-xl mb-1">{a.icon}</div>
                      <div className="font-bold text-sm">{a.name}</div>
                      <div className="text-[10px] text-white/50 mb-2">{a.desc}</div>
                      <div className="text-[10px] text-yellow-400 mb-2">Цена: {a.cost}</div>
                      {active
                        ? <div className="text-[10px] text-green-400 font-bold">✅ Активно</div>
                        : <button onClick={()=>makeAgreement(a.type)}
                            className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-yellow-700 hover:bg-yellow-600 transition">
                            Заключить
                          </button>}
                    </div>
                  );
                })}
              </div>
              {shopMsg&&<div className={`text-xs px-3 py-2 rounded-lg ${shopMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{shopMsg}</div>}
            </div>
            {aiStatus&&(
              <div>
                <div className="text-sm font-bold mb-2">⚔️ Флоты ИИ на планетах</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(aiStatus.ai_race?.fleets||[]).map((f,i:number)=>(
                    <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="font-bold text-sm">{f.name}</div>
                      <div className="text-[10px] text-white/50">⚔️{f.attack} 🛡️{f.defense}</div>
                      <div className="text-[10px] text-yellow-400">Награда: {fmtRes(f.reward)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── МАГАЗИН ── */}
        {activeTab==="shop" && (
          <div>
            <h3 className="font-black text-lg mb-1">🛒 Магазин Терминаторов</h3>
            <p className="text-xs text-white/40 mb-3">Корабли ИИ — мощнее обычных, но требуют спец. ремонт (бот + комплект)</p>
            {shopMsg&&<div className={`text-xs px-3 py-2 rounded-lg mb-3 ${shopMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{shopMsg}</div>}
            <div className="text-xs text-white/40 mb-2">У вас: 🤖 Ботов: {repairBots} · 🧰 Комплектов: {repairKits}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {shopItems.map((item)=>{
                const affordable = canAfford(resources, item.cost||{});
                const typeLabel = item.type==="ship"?"Корабль":item.type==="tech"?"Технология":item.type==="repair_kit"?"Ремкомплект":"Рембот";
                const typeBg = item.type==="ship"?"bg-cyan-500/20":item.type==="tech"?"bg-purple-500/20":"bg-yellow-500/20";
                return (
                  <div key={item.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className="font-bold text-sm">{item.name}</div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${typeBg}`}>{typeLabel}</span>
                        </div>
                        {item.attack&&<div className="text-[10px] text-white/50">⚔️{item.attack} 🛡️{item.defense}</div>}
                        {item.effect&&<div className="text-[10px] text-green-400">{item.effect}</div>}
                        {item.ai_only_repair&&<div className="text-[10px] text-yellow-400">⚠️ Только ремонт через бота</div>}
                        <div className="text-[10px] text-yellow-300">Цена: {fmtRes(item.cost||{})}</div>
                      </div>
                    </div>
                    <button onClick={()=>buyItem(item.id)} disabled={!affordable}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${affordable?"bg-yellow-700 hover:bg-yellow-600":"bg-white/5 text-white/30 cursor-not-allowed"}`}>
                      🛒 Купить
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ЧАТ ── */}
        {activeTab==="chat" && (
          <div className="flex flex-col" style={{height:"calc(100vh - 220px)"}}>
            <h3 className="font-black text-lg mb-2">💬 Галактический чат</h3>
            <div className="flex gap-2 mb-2">
              {(["global","alliance"] as const).map(ch=>(
                <button key={ch} onClick={()=>{setChatTab(ch);setChatLastId(0);setChatMsgs([]);}}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${chatTab===ch?"bg-blue-600":"bg-white/10 hover:bg-white/20"}`}>
                  {ch==="global"?"🌌 Общий":"🔱 Альянс"}
                </button>
              ))}
            </div>
            {chatTab==="alliance"&&!player?.alliance_id&&(
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300 mb-2">Вступите в альянс, чтобы использовать этот чат</div>
            )}
            <div ref={chatRef} className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-3 mb-2 space-y-2 min-h-0">
              {chatMsgs.length===0&&<div className="text-center text-white/30 text-sm pt-8">Нет сообщений</div>}
              {chatMsgs.map(m=>(
                <div key={m.id} className={`flex gap-2 text-xs ${m.player_id===player?.id?"flex-row-reverse":""}`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] ${m.player_id===player?.id?"bg-blue-600/50":"bg-white/10"}`}>
                    <div className="text-[9px] text-white/40 mb-0.5">{m.race_emoji} {m.nickname}</div>
                    <div>{m.message}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()}
                placeholder="Сообщение..." disabled={chatTab==="alliance"&&!player?.alliance_id}
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40"/>
              <button onClick={sendChat} disabled={chatTab==="alliance"&&!player?.alliance_id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold disabled:opacity-40">
                ➤
              </button>
            </div>
          </div>
        )}

        {/* ── АЛЬЯНС ── */}
        {activeTab==="alliance" && (
          <div>
            <h3 className="font-black text-lg mb-3">🔱 Альянсы</h3>
            {allianceMsg&&<div className={`text-sm px-3 py-2 rounded-xl mb-3 ${allianceMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{allianceMsg}</div>}
            {player?.alliance_id ? (
              <div className="mb-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-3 text-sm text-green-300">
                  ✅ Вы в альянсе #{player.alliance_id}
                </div>
                <button onClick={leaveAlliance} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-bold">Покинуть альянс</button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                <div className="font-bold text-sm mb-3">➕ Создать новый альянс</div>
                <input value={allianceForm.name} onChange={e=>setAllianceForm(f=>({...f,name:e.target.value}))}
                  placeholder="Название альянса" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500"/>
                <div className="flex gap-2 mb-2">
                  {["⚔️","🌟","🔱","💫","🛸","🚀","🔥","💎"].map(e=>(
                    <button key={e} onClick={()=>setAllianceForm(f=>({...f,emblem:e}))}
                      className={`w-9 h-9 rounded-lg text-lg ${allianceForm.emblem===e?"bg-blue-600":"bg-white/10"}`}>{e}</button>
                  ))}
                </div>
                <input value={allianceForm.description} onChange={e=>setAllianceForm(f=>({...f,description:e.target.value}))}
                  placeholder="Описание (необязательно)" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"/>
                <button onClick={createAlliance} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold">Создать альянс</button>
              </div>
            )}
            <div>
              <div className="font-bold text-sm mb-2">🌌 Все альянсы</div>
              {alliances.length===0&&<div className="text-white/30 text-sm text-center py-6">Альянсов пока нет</div>}
              <div className="space-y-2">
                {alliances.map(a=>(
                  <div key={a.id} className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                    <span className="text-3xl">{a.emblem}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{a.name}</div>
                      <div className="text-[10px] text-white/40">{a.description}</div>
                      <div className="text-[10px] text-white/50">👥 {a.members} · Лидер: {a.leader_name}</div>
                    </div>
                    {!player?.alliance_id&&(
                      <button onClick={()=>joinAlliance(a.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold">Вступить</button>
                    )}
                    {player?.alliance_id===a.id&&<span className="text-xs text-green-400 font-bold">Мой альянс</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="bg-black/30 border-t border-white/10 text-center py-2 text-[10px] text-white/20 mt-4">
        Космические Путешественники · Тик обновляется каждые 3 сек · Прогресс сохраняется автоматически
      </div>
    </div>
  );
}
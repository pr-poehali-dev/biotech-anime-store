import { useState, useEffect, useRef, useCallback } from "react";

// ─── API URLS ──────────────────────────────────────────────────────────────────
const API_AUTH   = "https://functions.poehali.dev/d299b187-7949-45d0-b594-2578e2b6c399";
const API_GAME   = "https://functions.poehali.dev/14999aad-e665-4e7b-b72f-1213f45c0727";
const API_BATTLE = "https://functions.poehali.dev/da4e2351-b1f6-48ab-b9cc-694b8f8b5ad3";
const API_SOCIAL = "https://functions.poehali.dev/d3d9291d-49a7-490b-be7a-4a150fc6daad";

// ─── РАСЫ ─────────────────────────────────────────────────────────────────────
const RACES = {
  terrans:     { name:"Терранцы",    icon:"🌍", color:"#3b82f6", desc:"Универсальная раса. Баланс всех характеристик.", bonus:"+15% ко всем ресурсам", grad:"from-blue-900 to-slate-900" },
  zephyrians:  { name:"Зефирийцы",   icon:"🌬️", color:"#06b6d4", desc:"Мастера энергии и скорости.", bonus:"+40% энергия, +25% скорость флота", grad:"from-cyan-900 to-slate-900" },
  vorath:      { name:"Воратх",      icon:"🔥", color:"#ef4444", desc:"Агрессивная боевая раса.", bonus:"+30% атака флота, +20% металл", grad:"from-red-900 to-slate-900" },
  crystallids: { name:"Кристаллиды", icon:"💎", color:"#a855f7", desc:"Технологические гении.", bonus:"+50% кристаллы, +25% наука", grad:"from-purple-900 to-slate-900" },
  necrons:     { name:"Некроны",     icon:"💀", color:"#22c55e", desc:"Бессмертные машины.", bonus:"+35% защита, +20% тёмная материя", grad:"from-emerald-900 to-slate-900" },
  biotech:     { name:"Биотех",      icon:"🧬", color:"#84cc16", desc:"Живые корабли и регенерация.", bonus:"+40% население, регенерация 10%", grad:"from-lime-900 to-slate-900" },
  mechanoids:  { name:"Механойды",   icon:"⚙️", color:"#94a3b8", desc:"Индустриальные гиганты.", bonus:"+60% металл и энергия", grad:"from-slate-800 to-slate-900" },
  psychovores: { name:"Психоворы",   icon:"🧠", color:"#f59e0b", desc:"Телепаты. Мастера шпионажа.", bonus:"+50% шпионаж, +30% дипломатия", grad:"from-amber-900 to-slate-900" },
  stellarians: { name:"Стеллариане", icon:"⭐", color:"#f97316", desc:"Рождённые в звёздах.", bonus:"+25% ко всему, +топливо", grad:"from-orange-900 to-slate-900" },
};

const PLANET_TYPES: Record<string,{icon:string;color:string}> = {
  terrestrial: {icon:"🌍",color:"#22c55e"},
  ocean:       {icon:"🌊",color:"#3b82f6"},
  desert:      {icon:"🏜️",color:"#f59e0b"},
  ice:         {icon:"🧊",color:"#93c5fd"},
  lava:        {icon:"🌋",color:"#ef4444"},
  gas_giant:   {icon:"🌀",color:"#8b5cf6"},
  crystal:     {icon:"💎",color:"#a78bfa"},
  dead:        {icon:"☄️",color:"#64748b"},
  jungle:      {icon:"🌿",color:"#4ade80"},
};

const STAR_TYPES: Record<string,{icon:string;color:string}> = {
  yellow:    {icon:"☀️", color:"#fbbf24"},
  blue:      {icon:"💫", color:"#93c5fd"},
  red_giant: {icon:"🔴", color:"#f87171"},
  red_dwarf: {icon:"🔸", color:"#fb923c"},
  white:     {icon:"⚪", color:"#e2e8f0"},
  neutron:   {icon:"⚡", color:"#a78bfa"},
};

const SECTORS = ["alpha","beta","gamma","delta","omega"];
const SECTOR_COLORS: Record<string,string> = {
  alpha:"#3b82f6", beta:"#22c55e", gamma:"#f59e0b", delta:"#a855f7", omega:"#ef4444"
};

const SHIP_ICONS: Record<string,string> = {
  scout:"🛸", fighter:"✈️", cruiser:"🚀", battleship:"⚔️",
  dreadnought:"🌟", titan:"💫", carrier:"🛩️", stealth:"👻"
};

const RES_ICONS: Record<string,string> = {
  metal:"⛏️", energy:"⚡", crystals:"💎", fuel:"⛽", dark_matter:"🌑", population:"👥"
};

type Screen = "auth"|"game";
type Tab = "galaxy"|"colony"|"fleet"|"tech"|"battle"|"chat"|"alliance"|"trade"|"leaderboard";

interface Player {
  id:number; nickname:string; race:string;
  metal:number; energy:number; crystals:number;
  population:number; fuel:number; dark_matter:number;
  score:number; rank_title:string; alliance_id:number|null;
  home_planet_id:number|null; colonies_count:number;
  total_fleet_power:number; battles_won:number;
  battles_lost:number; planets_conquered:number;
}

interface StarSystem { id:number; name:string; pos_x:number; pos_y:number; star_type:string; star_size:number; sector:string; planet_count:number; }
interface Planet { id:number; name:string; system_id:number; pos_x:number; pos_y:number; orbit:number; type:string; biome:string; size:number; special:string|null; owner_id:number|null; owner_race:string|null; is_ai:boolean; tier:number; owner_name:string|null; }
interface Colony { id:number; name:string; planet_id:number; is_capital:boolean; mine:number; solar:number; lab:number; shipyard:number; barracks:number; crystal_mine:number; shield:number; market:number; fuel_refinery:number; dark_matter_lab:number; metal:number; energy:number; crystals:number; population:number; fuel:number; planet_name:string; planet_type:string; }
interface Fleet { id:number; name:string; ships:Record<string,number>; attack:number; defense:number; planet_id:number|null; target_id:number|null; status:string; mission:string; arrive_at:string|null; planet_name:string|null; target_name:string|null; }
interface ChatMsg { id:number; player_id:number; nickname:string; race:string; emoji:string; message:string; created_at:string; }
interface Alliance { id:number; name:string; tag:string; emblem:string; description:string|null; race:string; members:number; score:number; planets:number; recruiting:boolean; min_score:number; leader:string; }
interface Tech { id:string; name:string; category:string; level:number; max_level:number; effect:string; cost:Record<string,number>; researched:boolean; }
interface Trade { id:number; offer_res:string; offer_amt:number; want_res:string; want_amt:number; seller:string; race:string; }

async function api(url:string, opts?:{method?:string;body?:object;token?:string}) {
  const h: Record<string,string> = {"Content-Type":"application/json"};
  if (opts?.token) h["X-Auth-Token"] = opts.token;
  const r = await fetch(url, {
    method: opts?.method || "GET",
    headers: h,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  return r.json();
}

const fmtRes = (cost:Record<string,number>) =>
  Object.entries(cost).filter(([,v])=>v>0).map(([k,v])=>`${v}${RES_ICONS[k]||""}`).join(" ");

const canAfford = (player:Player, cost:Record<string,number>) =>
  Object.entries(cost).every(([k,v]) => (player as unknown as Record<string,number>)[k] >= v);

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────────────
export default function SpaceEmpireGame() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [authMode, setAuthMode] = useState<"login"|"register">("login");
  const [authForm, setAuthForm] = useState({nickname:"",login:"",password:"",race:"terrans"});
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [token, setToken] = useState(()=>localStorage.getItem("empire_token")||"");
  const [player, setPlayer] = useState<Player|null>(null);

  const [tab, setTab] = useState<Tab>("galaxy");
  const [systems, setSystems] = useState<StarSystem[]>([]);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [colonies, setColonies] = useState<Colony[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [shipDefs, setShipDefs] = useState<Record<string,{name:string;atk:number;def:number;cost:Record<string,number>}>>({});
  const [buildDefs, setBuildDefs] = useState<Record<string,{name:string;max_level:number;base_cost:Record<string,number>}>>({});

  const [selectedSystem, setSelectedSystem] = useState<StarSystem|null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet|null>(null);
  const [selectedColony, setSelectedColony] = useState<Colony|null>(null);

  const [chatTab, setChatTab] = useState<"global"|"alliance">("global");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLastId, setChatLastId] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [allianceForm, setAllianceForm] = useState({name:"",tag:"",emblem:"⭐",description:""});
  const [allianceMsg, setAllianceMsg] = useState("");
  const [myAlliance, setMyAlliance] = useState<{name:string;tag:string;members:{nickname:string;race:string;score:number;online:boolean}[]}|null>(null);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeForm, setTradeForm] = useState({offer_resource:"metal",offer_amount:100,want_resource:"crystals",want_amount:50});

  const [leaderboard, setLeaderboard] = useState<{id:number;nickname:string;race:string;score:number;planets_conquered:number;battles_won:number;alliance:string|null}[]>([]);

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleResult, setBattleResult] = useState<{result:string;looted:Record<string,number>}|null>(null);
  const [selectedFleetForBattle, setSelectedFleetForBattle] = useState<number|null>(null);

  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);

  // Авто-вход
  useEffect(()=>{
    if (!token) return;
    api(`${API_AUTH}?action=me`, {token}).then(d=>{
      if (d.id) { setPlayer(d); setScreen("game"); }
      else { localStorage.removeItem("empire_token"); setToken(""); }
    }).catch(()=>{});
  },[]);

  // Тик производства
  useEffect(()=>{
    if (screen!=="game") return;
    const id = setInterval(()=>setTick(t=>t+1), 10000);
    return ()=>clearInterval(id);
  },[screen]);

  useEffect(()=>{
    if (!player || tick===0) return;
    api(`${API_GAME}?action=tick`, {method:"POST",token}).then(d=>{
      if (d.ticked) setPlayer(p=>p?({...p,...(d.produced?{
        metal: Math.max(p.metal,p.metal+d.produced.metal||0),
        energy: Math.max(p.energy,p.energy+d.produced.energy||0),
        crystals: Math.max(p.crystals,p.crystals+d.produced.crystals||0),
        fuel: Math.max(p.fuel,p.fuel+d.produced.fuel||0),
        dark_matter: Math.max(p.dark_matter,p.dark_matter+d.produced.dark_matter||0),
        score: d.score||p.score,
      }:{})}):p);
    }).catch(()=>{});
  },[tick]);

  // Загрузка данных при смене таба
  useEffect(()=>{
    if (screen!=="game") return;
    if (tab==="galaxy") loadGalaxy();
    if (tab==="colony") loadColonies();
    if (tab==="fleet") loadFleets();
    if (tab==="tech") loadTechs();
    if (tab==="leaderboard") loadLeaderboard();
    if (tab==="alliance") { loadAlliances(); if (player?.alliance_id) loadMyAlliance(); }
    if (tab==="trade") loadTrades();
    if (tab==="chat") { setChatLastId(0); setChatMsgs([]); }
  },[tab, screen]);

  const loadGalaxy = async () => {
    const d = await api(`${API_GAME}?action=galaxy`).catch(()=>null);
    if (d) { setSystems(d.systems||[]); setPlanets(d.planets||[]); }
  };

  const loadColonies = async () => {
    if (!token) return;
    const d = await api(`${API_GAME}?action=colonies`, {token}).catch(()=>null);
    if (d?.colonies) setColonies(d.colonies);
  };

  const loadFleets = async () => {
    if (!token) return;
    const d = await api(`${API_GAME}?action=fleets`, {token}).catch(()=>null);
    if (d) {
      setFleets(d.fleets||[]);
      setShipDefs(d.ship_types||{});
    }
    const dc = await api(`${API_GAME}?action=catalog`).catch(()=>null);
    if (dc) setBuildDefs(dc.buildings||{});
  };

  const loadTechs = async () => {
    if (!token) return;
    const d = await api(`${API_GAME}?action=techs`, {token}).catch(()=>null);
    if (d?.techs) setTechs(d.techs);
  };

  const loadLeaderboard = async () => {
    const d = await api(`${API_AUTH}?action=leaderboard`).catch(()=>null);
    if (d?.leaderboard) setLeaderboard(d.leaderboard);
  };

  const loadAlliances = async () => {
    const d = await api(`${API_SOCIAL}?action=alliances`).catch(()=>null);
    if (d?.alliances) setAlliances(d.alliances);
  };

  const loadMyAlliance = async () => {
    const d = await api(`${API_SOCIAL}?action=my_alliance`, {token}).catch(()=>null);
    if (d?.name) setMyAlliance(d);
  };

  const loadTrades = async () => {
    const d = await api(`${API_SOCIAL}?action=trade_market`).catch(()=>null);
    if (d?.trades) setTrades(d.trades);
  };

  // Чат опрос
  useEffect(()=>{
    if (screen!=="game" || tab!=="chat") return;
    const load = async()=>{
      const url = chatTab==="global"
        ? `${API_SOCIAL}?action=chat_global&since=${chatLastId}`
        : `${API_SOCIAL}?action=chat_alliance&since=${chatLastId}`;
      const d = await api(url, {token}).catch(()=>null);
      if (!d) return;
      if (chatLastId===0) setChatMsgs(d.messages||[]);
      else if (d.messages?.length) {
        setChatMsgs(prev=>[...prev,...d.messages].slice(-100));
        setChatLastId(d.messages[d.messages.length-1].id);
      }
      if (!chatLastId && d.messages?.length) setChatLastId(d.messages[d.messages.length-1].id);
    };
    load();
    const id = setInterval(load, 5000);
    return ()=>clearInterval(id);
  },[screen,tab,chatTab]);

  useEffect(()=>{
    if (chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;
  },[chatMsgs]);

  // AUTH
  async function handleAuth() {
    setAuthErr(""); setAuthLoading(true);
    try {
      const body = authMode==="register"
        ? {action:"register",...authForm}
        : {action:"login",login:authForm.login,password:authForm.password};
      const d = await api(API_AUTH, {method:"POST",body});
      if (d.error) { setAuthErr(d.error); return; }
      localStorage.setItem("empire_token", d.token);
      setToken(d.token);
      const pd = authMode==="register"
        ? await api(`${API_AUTH}?action=me`,{token:d.token})
        : d.player;
      setPlayer(pd);
      setScreen("game");
    } catch { setAuthErr("Ошибка соединения"); }
    finally { setAuthLoading(false); }
  }

  function logout() {
    localStorage.removeItem("empire_token");
    setToken(""); setPlayer(null); setScreen("auth");
  }

  // ИГРОВЫЕ ДЕЙСТВИЯ
  async function upgradeBuilding(colony_id:number, building:string) {
    setMsg("");
    const d = await api(API_GAME,{method:"POST",token,body:{action:"upgrade_building",colony_id,building}}).catch(()=>null);
    if (d?.upgraded) {
      setMsg(`✅ ${building} улучшено до уровня ${d.new_level}!`);
      loadColonies();
      const me = await api(`${API_AUTH}?action=me`,{token}).catch(()=>null);
      if (me?.id) setPlayer(me);
    } else setMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function researchTech(tech_id:string) {
    setMsg("");
    const d = await api(API_GAME,{method:"POST",token,body:{action:"research",tech_id}}).catch(()=>null);
    if (d?.researched) {
      setMsg(`✅ ${tech_id} исследовано до уровня ${d.new_level}!`);
      loadTechs();
      const me = await api(`${API_AUTH}?action=me`,{token}).catch(()=>null);
      if (me?.id) setPlayer(me);
    } else setMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function buildShip(colony_id:number, ship_type:string, count=1) {
    setMsg("");
    const d = await api(API_GAME,{method:"POST",token,body:{action:"build_ship",colony_id,ship_type,count}}).catch(()=>null);
    if (d?.built) {
      setMsg(`✅ Построено: ${count}x ${ship_type}`);
      loadFleets();
      const me = await api(`${API_AUTH}?action=me`,{token}).catch(()=>null);
      if (me?.id) setPlayer(me);
    } else setMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function attackPlanet(fleet_id:number, planet_id:number) {
    setMsg(""); setBattleLog([]); setBattleResult(null);
    const d = await api(API_BATTLE,{method:"POST",token,body:{action:"attack",fleet_id,planet_id}}).catch(()=>null);
    if (!d) { setMsg("❌ Ошибка соединения"); return; }
    if (d.error) { setMsg("❌ "+d.error); return; }
    setBattleLog(d.log||[]);
    setBattleResult({result:d.result, looted:d.looted||{}});
    loadGalaxy();
    loadFleets();
    const me = await api(`${API_AUTH}?action=me`,{token}).catch(()=>null);
    if (me?.id) setPlayer(me);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const d = await api(API_SOCIAL,{method:"POST",token,body:{action:"chat_send",channel:chatTab,message:chatInput}}).catch(()=>null);
    if (d?.sent) {
      setChatMsgs(prev=>[...prev,{id:d.id,player_id:player!.id,nickname:player!.nickname,
        race:player!.race,emoji:RACES[player!.race as keyof typeof RACES]?.icon||"👤",
        message:chatInput,created_at:new Date().toISOString()}]);
      setChatInput("");
    }
  }

  async function createAlliance() {
    setAllianceMsg("");
    const d = await api(API_SOCIAL,{method:"POST",token,body:{action:"create_alliance",...allianceForm}}).catch(()=>null);
    if (d?.created) {
      setAllianceMsg("✅ Альянс создан!");
      setPlayer(p=>p?{...p,alliance_id:d.alliance_id}:p);
      loadAlliances();
    } else setAllianceMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function joinAlliance(id:number) {
    const d = await api(API_SOCIAL,{method:"POST",token,body:{action:"join_alliance",alliance_id:id}}).catch(()=>null);
    if (d?.joined) { setAllianceMsg("✅ Вступили!"); setPlayer(p=>p?{...p,alliance_id:id}:p); loadAlliances(); }
    else setAllianceMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function createTrade() {
    setMsg("");
    const d = await api(API_SOCIAL,{method:"POST",token,body:{action:"create_trade",...tradeForm}}).catch(()=>null);
    if (d?.created) { setMsg("✅ Предложение выставлено!"); loadTrades(); }
    else setMsg("❌ "+(d?.error||"Ошибка"));
  }

  async function acceptTrade(id:number) {
    const d = await api(API_SOCIAL,{method:"POST",token,body:{action:"accept_trade",trade_id:id}}).catch(()=>null);
    if (d?.traded) { setMsg(`✅ Сделка совершена! Получено: ${d.got_amount} ${d.got_resource}`); loadTrades(); }
    else setMsg("❌ "+(d?.error||"Ошибка"));
  }

  const race = player ? (RACES[player.race as keyof typeof RACES] || RACES.terrans) : RACES.terrans;
  const systemPlanets = selectedSystem ? planets.filter(p=>p.system_id===selectedSystem.id) : [];

  // ── ЭКРАН АВТОРИЗАЦИИ ─────────────────────────────────────────────────────────
  if (screen==="auth") return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-7xl mb-4">🌌</div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Империя Космоса
          </h1>
          <p className="text-slate-400 mt-2">Глобальная браузерная стратегия · MMO</p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            {["9 рас","16 звёздных систем","43 планеты","8 технологий","Реальные бои","Альянсы","Торговля"].map(f=>(
              <span key={f} className="text-xs bg-slate-800 px-2 py-1 rounded-full border border-slate-700 text-slate-300">{f}</span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <div className="flex gap-2 mb-5">
            {(["login","register"] as const).map(m=>(
              <button key={m} onClick={()=>setAuthMode(m)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${authMode===m?"bg-gradient-to-r from-yellow-600 to-orange-600 text-white":"bg-white/5 text-white/50 hover:bg-white/10"}`}>
                {m==="login"?"🔑 Войти":"🚀 Регистрация"}
              </button>
            ))}
          </div>

          {authMode==="register" && (
            <div className="mb-3">
              <label className="text-xs text-white/50 mb-1 block">Никнейм командира</label>
              <input value={authForm.nickname} onChange={e=>setAuthForm(f=>({...f,nickname:e.target.value}))}
                placeholder="Капитан Нова" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500"/>
            </div>
          )}
          <div className="mb-3">
            <label className="text-xs text-white/50 mb-1 block">Логин</label>
            <input value={authForm.login} onChange={e=>setAuthForm(f=>({...f,login:e.target.value}))}
              placeholder="login@galaxy.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500"/>
          </div>
          <div className="mb-4">
            <label className="text-xs text-white/50 mb-1 block">Пароль</label>
            <input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&handleAuth()}
              placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500"/>
          </div>

          {authMode==="register" && (
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-2 block">Раса</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(RACES).map(([id,r])=>(
                  <button key={id} onClick={()=>setAuthForm(f=>({...f,race:id}))}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${authForm.race===id?"border-yellow-500 bg-yellow-500/10":"border-white/10 hover:border-white/30"}`}>
                    <div className="text-lg mb-0.5">{r.icon}</div>
                    <div className="font-bold text-xs leading-tight">{r.name}</div>
                    <div className="text-[9px] text-white/40 leading-tight mt-0.5">{r.bonus}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {authErr && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-xl px-3 py-2 mb-3">{authErr}</div>}
          <button onClick={handleAuth} disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-black text-sm transition-all disabled:opacity-50">
            {authLoading?"⏳ Загрузка...":authMode==="login"?"🚀 Войти в галактику":"🌌 Создать империю"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── ОСНОВНАЯ ИГРА ─────────────────────────────────────────────────────────────
  const tabs: {id:Tab;label:string;icon:string}[] = [
    {id:"galaxy",      label:"Карта",     icon:"🗺️"},
    {id:"colony",      label:"Колонии",   icon:"🏗️"},
    {id:"fleet",       label:"Флот",      icon:"🚀"},
    {id:"tech",        label:"Наука",     icon:"🔬"},
    {id:"battle",      label:"Битвы",     icon:"⚔️"},
    {id:"trade",       label:"Торговля",  icon:"💱"},
    {id:"alliance",    label:"Альянс",    icon:"🔱"},
    {id:"chat",        label:"Чат",       icon:"💬"},
    {id:"leaderboard", label:"Рейтинг",   icon:"🏆"},
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${race.grad} text-white`}>
      {/* HEADER */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 px-3 py-2 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌌</span>
              <div>
                <div className="font-black text-sm leading-none">
                  {race.icon} {player?.nickname}
                  <span className="ml-2 text-[10px] text-white/40">{player?.rank_title}</span>
                </div>
                <div className="text-[10px] text-white/40">Империя Космоса · {RACES[player?.race as keyof typeof RACES]?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-400 font-bold">⭐{player?.score}</span>
              <span className="text-white/40">🏗️{player?.colonies_count}</span>
              <button onClick={logout} className="text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/10 transition text-xs">Выйти</button>
            </div>
          </div>
          {/* Ресурсы */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              {k:"metal",v:player?.metal},{k:"energy",v:player?.energy},{k:"crystals",v:player?.crystals},
              {k:"fuel",v:player?.fuel},{k:"dark_matter",v:player?.dark_matter},{k:"population",v:player?.population}
            ].map(r=>(
              <div key={r.k} className="bg-white/10 rounded-lg px-2 py-1 text-center shrink-0 min-w-[52px]">
                <div className="text-sm">{RES_ICONS[r.k]}</div>
                <div className="font-black text-[11px]">{r.v?.toLocaleString()||0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-black/30 border-b border-white/10 px-3 sticky top-[100px] z-30">
        <div className="max-w-6xl mx-auto flex gap-0.5 overflow-x-auto py-1 no-scrollbar">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${tab===t.id?"bg-white/20":"text-white/50 hover:text-white hover:bg-white/10"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`mx-3 mt-2 px-3 py-2 rounded-xl text-xs max-w-6xl mx-auto ${msg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>
          {msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-3">

        {/* ═══ КАРТА ГАЛАКТИКИ ═══════════════════════════════════════════════════ */}
        {tab==="galaxy" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-xl">🗺️ Карта галактики</h2>
              <div className="flex gap-2 text-xs">
                {SECTORS.map(s=>(
                  <span key={s} className="px-2 py-0.5 rounded-full font-bold" style={{background:SECTOR_COLORS[s]+"33",color:SECTOR_COLORS[s]}}>
                    {s.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* SVG карта */}
            <div className="bg-slate-950/60 rounded-2xl border border-white/10 overflow-hidden mb-3" style={{height:"500px",position:"relative"}}>
              <svg width="100%" height="100%" viewBox="0 0 1000 1100" className="cursor-pointer">
                {/* Сетка */}
                {Array.from({length:10}).map((_,i)=>(
                  <g key={i}>
                    <line x1={i*100} y1={0} x2={i*100} y2={1100} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    <line x1={0} y1={i*110} x2={1000} y2={i*110} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                  </g>
                ))}

                {/* Звёздные системы */}
                {systems.map(sys=>{
                  const st = STAR_TYPES[sys.star_type] || STAR_TYPES.yellow;
                  const sc = SECTOR_COLORS[sys.sector] || "#fff";
                  const isSelected = selectedSystem?.id===sys.id;
                  const sysPlanets = planets.filter(p=>p.system_id===sys.id);
                  const hasOwnedPlanet = sysPlanets.some(p=>p.owner_id===player?.id);
                  return (
                    <g key={sys.id} onClick={()=>setSelectedSystem(isSelected?null:sys)} style={{cursor:"pointer"}}>
                      <circle cx={sys.pos_x} cy={sys.pos_y} r={sys.star_size*4+10}
                        fill={sc+"11"} stroke={sc} strokeWidth={isSelected?2:0.5} strokeDasharray={isSelected?"0":"4 4"}/>
                      <text x={sys.pos_x} y={sys.pos_y} textAnchor="middle" dominantBaseline="central"
                        fontSize={sys.star_size*3+10}>{st.icon}</text>
                      <text x={sys.pos_x} y={sys.pos_y+sys.star_size*3+16} textAnchor="middle"
                        fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="600">{sys.name}</text>
                      {hasOwnedPlanet && <circle cx={sys.pos_x+sys.star_size*3} cy={sys.pos_y-sys.star_size*3} r="5" fill="#22c55e"/>}

                      {/* Планеты системы */}
                      {isSelected && sysPlanets.map(pl=>{
                        const pt = PLANET_TYPES[pl.type]||PLANET_TYPES.terrestrial;
                        const isOwned = pl.owner_id===player?.id;
                        return (
                          <g key={pl.id} onClick={e=>{e.stopPropagation();setSelectedPlanet(pl);}}>
                            <circle cx={pl.pos_x} cy={pl.pos_y} r="20"
                              fill={isOwned?"rgba(34,197,94,0.2)":pl.is_ai?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.05)"}
                              stroke={isOwned?"#22c55e":pl.is_ai?"#ef4444":"rgba(255,255,255,0.2)"} strokeWidth="1"/>
                            <text x={pl.pos_x} y={pl.pos_y} textAnchor="middle" dominantBaseline="central" fontSize="14">{pt.icon}</text>
                            <text x={pl.pos_x} y={pl.pos_y+24} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="7">{pl.name}</text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Инфо системы */}
              {selectedSystem && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{STAR_TYPES[selectedSystem.star_type]?.icon}</span>
                    <div>
                      <div className="font-black text-lg">{selectedSystem.name}</div>
                      <div className="text-xs text-white/50">Сектор <b style={{color:SECTOR_COLORS[selectedSystem.sector]}}>{selectedSystem.sector.toUpperCase()}</b> · {selectedSystem.planet_count} планет</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {systemPlanets.map(pl=>{
                      const pt = PLANET_TYPES[pl.type]||PLANET_TYPES.terrestrial;
                      return (
                        <button key={pl.id} onClick={()=>setSelectedPlanet(pl)}
                          className={`text-left p-2 rounded-lg border text-xs transition-all hover:border-white/30 ${selectedPlanet?.id===pl.id?"border-yellow-400/50 bg-yellow-400/10":"border-white/10"}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{pt.icon}</span>
                            <span className="font-bold truncate">{pl.name}</span>
                          </div>
                          <div className="text-white/40">{pl.size}кв · Тир:{pl.tier}</div>
                          {pl.owner_id===player?.id && <div className="text-green-400 text-[10px]">✅ Ваша</div>}
                          {pl.is_ai && pl.owner_id!==player?.id && <div className="text-red-400 text-[10px]">🤖 ИИ</div>}
                          {pl.owner_id && pl.owner_id!==player?.id && !pl.is_ai && <div className="text-yellow-400 text-[10px]">👤 {pl.owner_name}</div>}
                          {pl.special && <div className="text-purple-400 text-[10px]">✨ {pl.special}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Инфо планеты */}
              {selectedPlanet && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{PLANET_TYPES[selectedPlanet.type]?.icon}</span>
                    <div>
                      <div className="font-black">{selectedPlanet.name}</div>
                      <div className="text-xs text-white/40">{selectedPlanet.type} · {selectedPlanet.biome}</div>
                    </div>
                  </div>
                  <div className="text-xs text-white/50 mb-3 space-y-1">
                    <div>Размер: {selectedPlanet.size} | Тир ИИ: {selectedPlanet.tier}</div>
                    {selectedPlanet.special && <div className="text-purple-300">✨ Особый ресурс: {selectedPlanet.special}</div>}
                    {selectedPlanet.owner_id===player?.id && <div className="text-green-300">🏠 Ваша колония</div>}
                    {selectedPlanet.is_ai && <div className="text-red-300">🤖 Под управлением ИИ · Tier {selectedPlanet.tier}</div>}
                    {selectedPlanet.owner_name && selectedPlanet.owner_id!==player?.id && (
                      <div className="text-yellow-300">👤 Владелец: {selectedPlanet.owner_name} ({RACES[selectedPlanet.owner_race as keyof typeof RACES]?.icon})</div>
                    )}
                  </div>
                  {selectedPlanet.owner_id!==player?.id && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Отправить флот:</div>
                      <select className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none"
                        value={selectedFleetForBattle||""} onChange={e=>setSelectedFleetForBattle(Number(e.target.value))}>
                        <option value="">Выбрать флот...</option>
                        {fleets.filter(f=>f.status==="orbit").map(f=>(
                          <option key={f.id} value={f.id}>{f.name} ({Object.entries(f.ships).map(([k,v])=>`${v}x${k}`).join(",")})</option>
                        ))}
                      </select>
                      {selectedFleetForBattle && (
                        <button onClick={()=>attackPlanet(selectedFleetForBattle, selectedPlanet.id)}
                          className="w-full py-2 bg-red-700 hover:bg-red-600 rounded-lg text-xs font-bold transition">
                          ⚔️ Атаковать планету
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ КОЛОНИИ ══════════════════════════════════════════════════════════ */}
        {tab==="colony" && (
          <div>
            <h2 className="font-black text-xl mb-3">🏗️ Колонии</h2>
            {colonies.length===0 && <div className="text-white/40 text-center py-8">Загрузка колоний...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {colonies.map(col=>{
                if (selectedColony?.id===col.id) {
                  const buildings = [
                    {id:"mine",name:"Шахта",icon:"⛏️",lvl:col.mine},{id:"solar",name:"Реактор",icon:"☀️",lvl:col.solar},
                    {id:"lab",name:"Лаборатория",icon:"🔬",lvl:col.lab},{id:"shipyard",name:"Верфь",icon:"🚀",lvl:col.shipyard},
                    {id:"barracks",name:"Казармы",icon:"👨‍✈️",lvl:col.barracks},{id:"crystal_mine",name:"Кристаллы",icon:"💎",lvl:col.crystal_mine},
                    {id:"shield",name:"Щит",icon:"🛡️",lvl:col.shield},{id:"market",name:"Рынок",icon:"🏪",lvl:col.market},
                    {id:"fuel_refinery",name:"НПЗ",icon:"⛽",lvl:col.fuel_refinery},{id:"dark_matter_lab",name:"Лаб. ТМ",icon:"🌑",lvl:col.dark_matter_lab},
                  ];
                  return (
                    <div key={col.id} className="md:col-span-2 bg-white/10 rounded-2xl p-4 border border-yellow-400/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{PLANET_TYPES[col.planet_type]?.icon}</span>
                          <div>
                            <div className="font-black">{col.name} {col.is_capital&&"👑"}</div>
                            <div className="text-xs text-white/40">{col.planet_name}</div>
                          </div>
                        </div>
                        <button onClick={()=>setSelectedColony(null)} className="text-white/40 hover:text-white">✕</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3">
                        {[["⛏️",col.metal],["⚡",col.energy],["💎",col.crystals],["⛽",col.fuel],["👥",col.population]].map(([ic,v])=>(
                          <div key={ic as string} className="bg-white/5 rounded-lg p-1.5 text-center">
                            <div className="text-sm">{ic}</div>
                            <div className="text-xs font-bold">{Number(v).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {buildings.map(b=>{
                          const bDef = buildDefs[b.id];
                          const nextCost = bDef ? Object.fromEntries(Object.entries(bDef.base_cost).map(([k,v])=>[k,Math.floor((v as number)*Math.pow(1.8,b.lvl+1))])) : {};
                          const canUp = player && canAfford(player, nextCost);
                          return (
                            <div key={b.id} className="bg-white/5 rounded-xl p-2 text-center">
                              <div className="text-xl">{b.icon}</div>
                              <div className="text-[10px] font-bold">{b.name}</div>
                              <div className="text-[10px] text-yellow-400 mb-1">Ур.{b.lvl}/{bDef?.max_level||10}</div>
                              <button onClick={()=>upgradeBuilding(col.id, b.id)}
                                disabled={!canUp}
                                className={`w-full py-1 rounded-lg text-[9px] font-bold transition ${canUp?"bg-blue-600 hover:bg-blue-500":"bg-white/5 text-white/20 cursor-not-allowed"}`}>
                                ↑ {bDef?fmtRes(nextCost):"..."}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {col.shipyard>0 && (
                        <div className="mt-3">
                          <div className="text-sm font-bold mb-2">🚀 Строительство кораблей</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(shipDefs).slice(0,6).map(([id,s])=>(
                              <div key={id} className="bg-white/5 rounded-lg p-2 text-center">
                                <div className="text-xl">{SHIP_ICONS[id]||"🚀"}</div>
                                <div className="text-[10px] font-bold">{s.name}</div>
                                <div className="text-[9px] text-white/40 mb-1">⚔️{s.atk} 🛡️{s.def}</div>
                                <button onClick={()=>buildShip(col.id, id, 1)}
                                  disabled={!player||!canAfford(player,s.cost)}
                                  className={`w-full py-0.5 rounded text-[9px] font-bold ${player&&canAfford(player,s.cost)?"bg-cyan-700 hover:bg-cyan-600":"bg-white/5 text-white/20 cursor-not-allowed"}`}>
                                  {fmtRes(s.cost)}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button key={col.id} onClick={()=>setSelectedColony(col)}
                    className="bg-white/10 rounded-xl p-3 border border-white/10 hover:border-white/30 text-left transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{PLANET_TYPES[col.planet_type]?.icon}</span>
                      <div>
                        <div className="font-bold text-sm">{col.name} {col.is_capital&&"👑"}</div>
                        <div className="text-[10px] text-white/40">{col.planet_name}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-white/60">
                      <span>⛏️{col.metal}</span><span>⚡{col.energy}</span>
                      <span>💎{col.crystals}</span><span>⛽{col.fuel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ФЛОТ ════════════════════════════════════════════════════════════ */}
        {tab==="fleet" && (
          <div>
            <h2 className="font-black text-xl mb-3">🚀 Флот</h2>
            {fleets.length===0 && <div className="text-white/40 text-center py-8">Флотов нет. Постройте корабли в колонии (нужна Верфь).</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fleets.map(f=>(
                <div key={f.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">{f.name}</div>
                      <div className="text-[10px] text-white/40">
                        {f.status==="orbit"?"🪐 На орбите: "+f.planet_name:f.status==="traveling"?"🛸 В пути → "+f.target_name:"⚔️ В бою"}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-red-400">⚔️{f.attack}</div>
                      <div className="text-blue-400">🛡️{f.defense}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(f.ships).filter(([,v])=>v>0).map(([type,count])=>(
                      <span key={type} className="bg-white/10 px-2 py-0.5 rounded text-xs">
                        {SHIP_ICONS[type]||"🚀"} {count}x {shipDefs[type]?.name||type}
                      </span>
                    ))}
                  </div>
                  {f.arrive_at && (
                    <div className="text-[10px] text-yellow-400">⏱ Прибытие: {new Date(f.arrive_at).toLocaleTimeString()}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ТЕХНОЛОГИИ ═══════════════════════════════════════════════════════ */}
        {tab==="tech" && (
          <div>
            <h2 className="font-black text-xl mb-3">🔬 Технологии</h2>
            {["economy","expansion","military","special"].map(cat=>(
              <div key={cat} className="mb-4">
                <div className="text-sm font-bold text-white/60 mb-2 uppercase tracking-wide">
                  {cat==="economy"?"💰 Экономика":cat==="expansion"?"🪐 Экспансия":cat==="military"?"⚔️ Военные":"✨ Особые"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {techs.filter(t=>t.category===cat).map(t=>{
                    const canR = player && canAfford(player, t.cost) && t.level<t.max_level;
                    return (
                      <div key={t.id} className={`bg-white/10 rounded-xl p-3 border ${t.researched?"border-purple-400/40":"border-white/10"}`}>
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="font-bold text-sm">{t.name}</div>
                          <div className="text-yellow-400 text-sm">{t.level}/{t.max_level}</div>
                        </div>
                        <div className="text-[10px] text-green-400 mb-2">{t.effect}</div>
                        <div className="w-full bg-white/10 rounded-full h-1 mb-2">
                          <div className="h-1 rounded-full bg-purple-500" style={{width:`${(t.level/t.max_level)*100}%`}}/>
                        </div>
                        {t.level>=t.max_level
                          ? <div className="text-[10px] text-center text-purple-400">✅ Макс.</div>
                          : <button onClick={()=>researchTech(t.id)} disabled={!canR}
                              className={`w-full py-1.5 rounded-lg text-[10px] font-bold ${canR?"bg-purple-700 hover:bg-purple-600":"bg-white/5 text-white/20 cursor-not-allowed"}`}>
                              🔬 {fmtRes(t.cost)}
                            </button>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ БИТВЫ ════════════════════════════════════════════════════════════ */}
        {tab==="battle" && (
          <div>
            <h2 className="font-black text-xl mb-3">⚔️ Боевые операции</h2>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10 mb-4 text-sm text-white/60">
              Для атаки планеты: перейдите на карту галактики → выберите систему → выберите планету → выберите флот → нажмите "Атаковать".
            </div>
            {battleLog.length>0 && (
              <div className={`bg-black/40 rounded-xl p-4 border ${battleResult?.result==="victory"?"border-green-500/30":"border-red-500/30"} mb-4`}>
                <div className={`font-black text-lg mb-2 ${battleResult?.result==="victory"?"text-green-400":"text-red-400"}`}>
                  {battleResult?.result==="victory"?"✅ ПОБЕДА!":"❌ ПОРАЖЕНИЕ"}
                </div>
                {Object.keys(battleResult?.looted||{}).length>0 && (
                  <div className="text-sm text-yellow-300 mb-2">
                    Захвачено: {fmtRes(battleResult!.looted)}
                  </div>
                )}
                <div className="space-y-1">
                  {battleLog.map((l,i)=><div key={i} className="text-xs text-white/60">{l}</div>)}
                </div>
              </div>
            )}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10">
              <div className="font-bold text-sm mb-2">📊 Ваши показатели</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-400">{player?.battles_won}</div>
                  <div className="text-white/40 text-xs">Побед</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-400">{player?.battles_lost}</div>
                  <div className="text-white/40 text-xs">Поражений</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-yellow-400">{player?.planets_conquered}</div>
                  <div className="text-white/40 text-xs">Планет захвачено</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-400">{player?.total_fleet_power}</div>
                  <div className="text-white/40 text-xs">Сила флота</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ЧАТ ══════════════════════════════════════════════════════════════ */}
        {tab==="chat" && (
          <div className="flex flex-col" style={{height:"calc(100vh - 280px)"}}>
            <h2 className="font-black text-xl mb-2">💬 Межзвёздный чат</h2>
            <div className="flex gap-2 mb-2">
              {(["global","alliance"] as const).map(ch=>(
                <button key={ch} onClick={()=>{setChatTab(ch);setChatLastId(0);setChatMsgs([]);}}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${chatTab===ch?"bg-blue-600":"bg-white/10 hover:bg-white/20"}`}>
                  {ch==="global"?"🌌 Общий":"🔱 Альянс"}
                </button>
              ))}
            </div>
            {chatTab==="alliance"&&!player?.alliance_id&&(
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300 mb-2">Вступите в альянс для доступа к этому чату</div>
            )}
            <div ref={chatRef} className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-3 mb-2 space-y-2 min-h-0">
              {chatMsgs.length===0&&<div className="text-white/30 text-sm text-center pt-8">Нет сообщений</div>}
              {chatMsgs.map(m=>(
                <div key={m.id} className={`flex gap-2 ${m.player_id===player?.id?"flex-row-reverse":""}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${m.player_id===player?.id?"bg-blue-600/50":"bg-white/10"}`}>
                    <div className="text-[9px] text-white/40 mb-0.5">{m.emoji} {m.nickname}</div>
                    <div>{m.message}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()}
                placeholder="Сообщение галактике..." disabled={chatTab==="alliance"&&!player?.alliance_id}
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-40"/>
              <button onClick={sendChat} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm">➤</button>
            </div>
          </div>
        )}

        {/* ═══ АЛЬЯНС ═══════════════════════════════════════════════════════════ */}
        {tab==="alliance" && (
          <div>
            <h2 className="font-black text-xl mb-3">🔱 Альянсы</h2>
            {allianceMsg&&<div className={`text-xs px-3 py-2 rounded-xl mb-3 ${allianceMsg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{allianceMsg}</div>}

            {player?.alliance_id ? (
              <div className="mb-4">
                {myAlliance && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-3">
                    <div className="font-black text-lg">{myAlliance.name} <span className="text-xs bg-white/10 px-1.5 rounded">[{myAlliance.tag}]</span></div>
                    <div className="text-xs text-white/50 mb-3">Участников: {myAlliance.members?.length}</div>
                    <div className="space-y-1.5">
                      {myAlliance.members?.map(m=>(
                        <div key={m.nickname} className="flex items-center gap-2 text-xs">
                          <span>{RACES[m.race as keyof typeof RACES]?.icon}</span>
                          <span className="flex-1">{m.nickname}</span>
                          <span className="text-yellow-400">⭐{m.score}</span>
                          <span className={m.online?"text-green-400":"text-white/20"}>{m.online?"●":"○"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                <div className="font-bold text-sm mb-3">➕ Создать альянс</div>
                <input value={allianceForm.name} onChange={e=>setAllianceForm(f=>({...f,name:e.target.value}))}
                  placeholder="Название (2-30 символов)" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none"/>
                <input value={allianceForm.tag} onChange={e=>setAllianceForm(f=>({...f,tag:e.target.value.toUpperCase()}))}
                  placeholder="Тег [2-6 символов]" maxLength={6} className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none"/>
                <div className="flex gap-1 mb-2">
                  {["⭐","⚔️","🛸","💫","🔱","🌌","🔥","💎"].map(e=>(
                    <button key={e} onClick={()=>setAllianceForm(f=>({...f,emblem:e}))}
                      className={`w-9 h-9 rounded-lg text-lg ${allianceForm.emblem===e?"bg-blue-600":"bg-white/10"}`}>{e}</button>
                  ))}
                </div>
                <input value={allianceForm.description} onChange={e=>setAllianceForm(f=>({...f,description:e.target.value}))}
                  placeholder="Описание (необязательно)" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none"/>
                <button onClick={createAlliance} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold">Создать альянс</button>
              </div>
            )}

            <div className="font-bold text-sm mb-2">🌌 Все альянсы</div>
            {alliances.length===0&&<div className="text-white/30 text-center py-4 text-sm">Альянсов пока нет</div>}
            <div className="space-y-2">
              {alliances.map(a=>(
                <div key={a.id} className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="text-3xl">{a.emblem}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{a.name} <span className="text-white/40 text-xs">[{a.tag}]</span></div>
                    <div className="text-[10px] text-white/40">{a.description}</div>
                    <div className="text-[10px] text-white/50">👥{a.members} · ⭐{a.score} · Лидер: {a.leader}</div>
                  </div>
                  {!player?.alliance_id && a.recruiting && (
                    <button onClick={()=>joinAlliance(a.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold">Вступить</button>
                  )}
                  {player?.alliance_id===a.id && <span className="text-xs text-green-400">Мой</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ТОРГОВЛЯ ═════════════════════════════════════════════════════════ */}
        {tab==="trade" && (
          <div>
            <h2 className="font-black text-xl mb-3">💱 Торговая площадка</h2>
            {msg&&<div className={`text-xs px-3 py-2 rounded-xl mb-3 ${msg.startsWith("✅")?"bg-green-500/20 text-green-300":"bg-red-500/20 text-red-300"}`}>{msg}</div>}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
              <div className="font-bold text-sm mb-3">📦 Выставить товар</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Предлагаю</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    value={tradeForm.offer_resource} onChange={e=>setTradeForm(f=>({...f,offer_resource:e.target.value}))}>
                    {["metal","energy","crystals","fuel","dark_matter"].map(r=><option key={r} value={r}>{RES_ICONS[r]} {r}</option>)}
                  </select>
                  <input type="number" value={tradeForm.offer_amount} onChange={e=>setTradeForm(f=>({...f,offer_amount:+e.target.value}))}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs mt-1 focus:outline-none" placeholder="Количество"/>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">Хочу получить</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    value={tradeForm.want_resource} onChange={e=>setTradeForm(f=>({...f,want_resource:e.target.value}))}>
                    {["metal","energy","crystals","fuel","dark_matter"].map(r=><option key={r} value={r}>{RES_ICONS[r]} {r}</option>)}
                  </select>
                  <input type="number" value={tradeForm.want_amount} onChange={e=>setTradeForm(f=>({...f,want_amount:+e.target.value}))}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs mt-1 focus:outline-none" placeholder="Количество"/>
                </div>
              </div>
              <button onClick={createTrade} className="w-full py-2 bg-yellow-700 hover:bg-yellow-600 rounded-xl text-xs font-bold">📤 Выставить на торги</button>
            </div>
            <div className="font-bold text-sm mb-2">🛒 Активные предложения</div>
            {trades.length===0&&<div className="text-white/30 text-center py-4 text-sm">Нет предложений</div>}
            <div className="space-y-2">
              {trades.map(t=>(
                <div key={t.id} className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                  <div className="flex-1 text-sm">
                    <span className="text-green-400">{t.offer_amt} {RES_ICONS[t.offer_res]} {t.offer_res}</span>
                    <span className="text-white/40 mx-2">→</span>
                    <span className="text-blue-400">{t.want_amt} {RES_ICONS[t.want_res]} {t.want_res}</span>
                    <div className="text-[10px] text-white/40 mt-0.5">{RACES[t.race as keyof typeof RACES]?.icon} {t.seller}</div>
                  </div>
                  {t.seller!==player?.nickname && (
                    <button onClick={()=>acceptTrade(t.id)} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-bold">Принять</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ РЕЙТИНГ ══════════════════════════════════════════════════════════ */}
        {tab==="leaderboard" && (
          <div>
            <h2 className="font-black text-xl mb-3">🏆 Рейтинг галактики</h2>
            <div className="space-y-1.5">
              {leaderboard.map((p,i)=>(
                <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${p.id===player?.id?"border-yellow-400/40 bg-yellow-400/10":"border-white/10 bg-white/5"}`}>
                  <div className={`font-black text-lg w-8 text-center ${i===0?"text-yellow-400":i===1?"text-slate-300":i===2?"text-amber-600":"text-white/40"}`}>
                    {i===0?"👑":i===1?"🥈":i===2?"🥉":i+1}
                  </div>
                  <span className="text-xl">{RACES[p.race as keyof typeof RACES]?.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{p.nickname}</div>
                    <div className="text-[10px] text-white/40">{RACES[p.race as keyof typeof RACES]?.name} {p.alliance&&`· [${p.alliance}]`}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-black text-yellow-400">⭐{p.score.toLocaleString()}</div>
                    <div className="text-white/40">🪐{p.planets_conquered} ⚔️{p.battles_won}</div>
                  </div>
                </div>
              ))}
              {leaderboard.length===0 && <div className="text-white/30 text-center py-8">Загрузка рейтинга...</div>}
            </div>
          </div>
        )}

      </div>

      <div className="bg-black/30 border-t border-white/10 text-center py-2 text-[10px] text-white/20 mt-4">
        Империя Космоса · Глобальная MMO-стратегия · {planets.length} планет в галактике
      </div>
    </div>
  );
}

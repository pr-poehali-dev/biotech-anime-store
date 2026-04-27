import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ВЕРФЬ «Орбита: Изгои» — конструктор кораблей из 4 модулей
// (корпус + орудия + щиты + двигатели)
// ─────────────────────────────────────────────────────────────────────────────

type Stat = { atk: number; def: number; hp: number; speed: number };

type Module = {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  stat: Partial<Stat>;
  cost: { titanit: number; plasma: number; iso: number; crew: number };
};

const HULLS: Module[] = [
  { id: "h1", name: "Корвет «Стрекоза»", tier: 1, stat: { hp: 120, def: 10 }, cost: { titanit: 200,  plasma: 50,  iso: 0,   crew: 8  } },
  { id: "h2", name: "Фрегат «Альбатрос»", tier: 2, stat: { hp: 320, def: 25 }, cost: { titanit: 600,  plasma: 150, iso: 30,  crew: 24 } },
  { id: "h3", name: "Крейсер «Гарпун»",   tier: 3, stat: { hp: 720, def: 55 }, cost: { titanit: 1600, plasma: 400, iso: 120, crew: 60 } },
  { id: "h4", name: "Линкор «Молот Зари»", tier: 4, stat: { hp: 1500, def: 110 }, cost: { titanit: 4000, plasma: 1000, iso: 350, crew: 140 } },
];

const WEAPONS: Module[] = [
  { id: "w1", name: "Импульсные пушки",     tier: 1, stat: { atk: 25 },  cost: { titanit: 80,  plasma: 40,  iso: 0,   crew: 2 } },
  { id: "w2", name: "Лазерные батареи",     tier: 2, stat: { atk: 70 },  cost: { titanit: 200, plasma: 120, iso: 20,  crew: 6 } },
  { id: "w3", name: "Плазма-турели «Рык»",  tier: 3, stat: { atk: 160 }, cost: { titanit: 500, plasma: 300, iso: 80,  crew: 14 } },
  { id: "w4", name: "Антиматерийная пушка", tier: 4, stat: { atk: 360 }, cost: { titanit: 1200, plasma: 700, iso: 200, crew: 30 } },
];

const SHIELDS: Module[] = [
  { id: "s1", name: "Базовое поле",         tier: 1, stat: { def: 15, hp: 40 },   cost: { titanit: 60,  plasma: 80,  iso: 5,   crew: 1 } },
  { id: "s2", name: "Магнитный барьер",     tier: 2, stat: { def: 40, hp: 120 },  cost: { titanit: 180, plasma: 220, iso: 30,  crew: 4 } },
  { id: "s3", name: "Адаптивный щит «Эгида»",tier: 3, stat: { def: 90, hp: 280 }, cost: { titanit: 450, plasma: 550, iso: 100, crew: 10 } },
  { id: "s4", name: "Кванто-броня «Бастион»",tier: 4, stat: { def: 200, hp: 600 },cost: { titanit: 1100, plasma: 1300, iso: 280, crew: 22 } },
];

const ENGINES: Module[] = [
  { id: "e1", name: "Ионный двигатель",     tier: 1, stat: { speed: 50 },  cost: { titanit: 70,  plasma: 60,  iso: 0,   crew: 2 } },
  { id: "e2", name: "Плазменный реактор",   tier: 2, stat: { speed: 110 }, cost: { titanit: 200, plasma: 180, iso: 20,  crew: 5 } },
  { id: "e3", name: "Варп-узел «Прыжок»",   tier: 3, stat: { speed: 220 }, cost: { titanit: 500, plasma: 450, iso: 80,  crew: 12 } },
  { id: "e4", name: "Кванто-привод «Зефир»",tier: 4, stat: { speed: 460 }, cost: { titanit: 1200, plasma: 1100, iso: 220, crew: 26 } },
];

const TIER_COLOR: Record<number, string> = {
  1: "border-cyan-500/30  text-cyan-300",
  2: "border-emerald-500/40 text-emerald-300",
  3: "border-violet-500/40 text-violet-300",
  4: "border-amber-400/50 text-amber-300",
};

const RES_ICON = { titanit: "⛏️", plasma: "⚡", iso: "💎", crew: "👥" };
const RES_NAME: Record<string, string> = { titanit: "ТИТАНИТ", plasma: "ПЛАЗМА", iso: "ИЗОКРИСТАЛЛ", crew: "ЭКИПАЖ" };

export default function Shipyard({
  player,
}: {
  player: { metal: number; energy: number; crystals: number; population: number } | null;
}) {
  const [hull, setHull]       = useState<Module>(HULLS[0]);
  const [weapon, setWeapon]   = useState<Module>(WEAPONS[0]);
  const [shield, setShield]   = useState<Module>(SHIELDS[0]);
  const [engine, setEngine]   = useState<Module>(ENGINES[0]);
  const [shipName, setShipName] = useState("Безымянный");
  const [building, setBuilding] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const total = useMemo(() => {
    const sum = (k: keyof Module["cost"]) =>
      hull.cost[k] + weapon.cost[k] + shield.cost[k] + engine.cost[k];
    return {
      cost: { titanit: sum("titanit"), plasma: sum("plasma"), iso: sum("iso"), crew: sum("crew") },
      stat: {
        atk:   (hull.stat.atk||0)   + (weapon.stat.atk||0)   + (shield.stat.atk||0)   + (engine.stat.atk||0),
        def:   (hull.stat.def||0)   + (weapon.stat.def||0)   + (shield.stat.def||0)   + (engine.stat.def||0),
        hp:    (hull.stat.hp||0)    + (weapon.stat.hp||0)    + (shield.stat.hp||0)    + (engine.stat.hp||0),
        speed: (hull.stat.speed||0) + (weapon.stat.speed||0) + (shield.stat.speed||0) + (engine.stat.speed||0),
      },
      tier: Math.max(hull.tier, weapon.tier, shield.tier, engine.tier),
    };
  }, [hull, weapon, shield, engine]);

  const have = {
    titanit: player?.metal ?? 0,
    plasma:  player?.energy ?? 0,
    iso:     player?.crystals ?? 0,
    crew:    player?.population ?? 0,
  };
  const canAfford = (Object.keys(total.cost) as (keyof typeof total.cost)[])
    .every(k => have[k] >= total.cost[k]);

  const build = () => {
    if (!canAfford) { setMsg("⚠ Недостаточно ресурсов на чертёж"); return; }
    setBuilding(true);
    setMsg("");
    setTimeout(() => {
      setBuilding(false);
      setMsg(`✓ Корабль «${shipName}» заложен на стапеле. Постройка займёт ${30 + total.tier*60} сек.`);
    }, 1200);
  };

  const Section = ({
    title, items, sel, set, icon,
  }: { title: string; items: Module[]; sel: Module; set: (m: Module) => void; icon: string }) => (
    <div className="sci-panel rounded p-3 sci-corner relative">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="sci-title text-xs text-cyan-200 tracking-widest">{title}</h3>
        <div className="flex-1 h-px bg-cyan-500/20"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(m => {
          const isSel = sel.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => set(m)}
              className={`text-left rounded border p-2 transition-all ${
                isSel
                  ? `bg-cyan-500/10 ${TIER_COLOR[m.tier]} sci-text-glow shadow-[0_0_12px_rgba(34,211,238,0.25)]`
                  : "border-cyan-500/15 hover:border-cyan-400/40 bg-cyan-950/30 text-cyan-200/70"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="sci-mono text-[11px] font-bold">{m.name}</span>
                <span className={`sci-mono text-[9px] px-1.5 py-0.5 rounded border ${TIER_COLOR[m.tier]}`}>T{m.tier}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[9px] sci-mono mb-1.5">
                {m.stat.atk   ? <span className="text-red-300">⚔ +{m.stat.atk}</span>   : null}
                {m.stat.def   ? <span className="text-emerald-300">🛡 +{m.stat.def}</span>: null}
                {m.stat.hp    ? <span className="text-cyan-300">❤ +{m.stat.hp}</span>    : null}
                {m.stat.speed ? <span className="text-amber-300">⚡ +{m.stat.speed}</span>: null}
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] sci-mono opacity-70">
                {(Object.entries(m.cost) as [keyof Module["cost"], number][])
                  .filter(([,v])=>v>0)
                  .map(([k,v]) => (
                    <span key={k}>{RES_ICON[k]} {v}</span>
                  ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Силуэт корабля (грубый ASCII-style SVG)
  const ShipSilhouette = () => (
    <svg viewBox="0 0 200 80" className="w-full h-24">
      <defs>
        <linearGradient id="hullG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0e7490"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      {/* Двигатель — пламя */}
      <ellipse cx="20" cy="40" rx={6 + engine.tier*4} ry={3 + engine.tier} fill="#fbbf24" opacity="0.4">
        <animate attributeName="rx" values={`${4+engine.tier*3};${8+engine.tier*4};${4+engine.tier*3}`} dur="0.6s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="22" cy="40" rx={3 + engine.tier*2} ry={1.5 + engine.tier*0.6} fill="#fde047" opacity="0.85"/>
      {/* Корпус */}
      <polygon
        points={`30,${40-8-hull.tier*2} ${130+hull.tier*8},${40-8-hull.tier*2} ${170+hull.tier*5},40 ${130+hull.tier*8},${40+8+hull.tier*2} 30,${40+8+hull.tier*2}`}
        fill="url(#hullG)" stroke="#22d3ee" strokeWidth="1"
      />
      {/* Орудия — навершие */}
      {Array.from({length: weapon.tier}).map((_, i) => (
        <rect key={i} x={50 + i*22} y={40 - 14 - hull.tier*2} width="6" height="6" fill="#ef4444" opacity="0.8"/>
      ))}
      {/* Щит — ореол */}
      {shield.tier > 1 && (
        <ellipse cx="100" cy="40" rx={85 + shield.tier*4} ry={28 + shield.tier*3}
          fill="none" stroke="#a78bfa" strokeWidth="0.6" strokeDasharray="4 3" opacity={0.15 + shield.tier*0.07}>
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="3s" repeatCount="indefinite"/>
        </ellipse>
      )}
      {/* Кокпит */}
      <circle cx={150 + hull.tier*4} cy="40" r="4" fill="#67e8f9"/>
      <circle cx={150 + hull.tier*4} cy="40" r="2" fill="#fff"/>
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-3">
      {/* Заголовок */}
      <div className="sci-panel sci-corner rounded p-4 mb-3 relative">
        <div className="sci-scan-line"/>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="sci-title text-xl text-cyan-200 sci-text-glow tracking-widest">⚒ ВЕРФЬ ИЗГОЕВ</h2>
            <p className="sci-mono text-[10px] text-cyan-400/60 mt-1">
              ▸ СОБЕРИ КОРАБЛЬ ИЗ ЧЕТЫРЁХ МОДУЛЕЙ │ КОРПУС · ОРУДИЕ · ЩИТ · ДВИГАТЕЛЬ
            </p>
          </div>
          <div className="sci-pill rounded px-3 py-1 text-[11px] sci-mono">
            ТЕХ-УРОВЕНЬ: T{total.tier}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3">
        {/* Модули */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Section title="КОРПУС"     items={HULLS}    sel={hull}   set={setHull}   icon="🛸"/>
          <Section title="ОРУДИЯ"     items={WEAPONS}  sel={weapon} set={setWeapon} icon="🔫"/>
          <Section title="ЩИТЫ"       items={SHIELDS}  sel={shield} set={setShield} icon="🛡️"/>
          <Section title="ДВИГАТЕЛИ"  items={ENGINES}  sel={engine} set={setEngine} icon="🚀"/>
        </div>

        {/* Сводка */}
        <div className="sci-panel sci-corner rounded p-4 relative h-fit lg:sticky lg:top-[140px]">
          <h3 className="sci-title text-xs text-cyan-200 mb-3 tracking-widest">▸ ЧЕРТЁЖ</h3>

          <div className="bg-black/40 rounded border border-cyan-500/20 p-2 mb-3">
            <ShipSilhouette/>
          </div>

          {/* Имя */}
          <div className="mb-3">
            <label className="sci-title text-[10px] text-cyan-400/70 mb-1 block">▸ ИМЯ КОРАБЛЯ</label>
            <input value={shipName} onChange={e=>setShipName(e.target.value)}
              className="w-full sci-panel-inner rounded px-3 py-1.5 text-sm sci-mono text-cyan-100 focus:outline-none focus:border-cyan-400 transition"/>
          </div>

          {/* Характеристики */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              ["⚔","АТАКА",   total.stat.atk,   "text-red-300 border-red-500/30 from-red-500/10"],
              ["🛡","ЗАЩИТА", total.stat.def,   "text-emerald-300 border-emerald-500/30 from-emerald-500/10"],
              ["❤","КОРПУС", total.stat.hp,    "text-cyan-300 border-cyan-500/30 from-cyan-500/10"],
              ["⚡","СКОРОСТЬ", total.stat.speed, "text-amber-300 border-amber-500/30 from-amber-500/10"],
            ].map(([ic,lb,v,cl]) => (
              <div key={lb as string} className={`rounded border bg-gradient-to-b ${cl} to-transparent p-2`}>
                <div className="flex items-center gap-1 text-[9px] sci-title opacity-70">{ic} {lb}</div>
                <div className="sci-mono font-black text-base text-white">{v}</div>
              </div>
            ))}
          </div>

          <div className="sci-divider mb-2"/>

          {/* Стоимость */}
          <div className="text-[10px] sci-title text-cyan-400/70 mb-1.5">▸ СТОИМОСТЬ</div>
          <div className="space-y-1 mb-3">
            {(Object.keys(total.cost) as (keyof typeof total.cost)[]).map(k => {
              const need = total.cost[k];
              const has = have[k];
              const ok = has >= need;
              return (
                <div key={k} className="flex items-center justify-between text-[11px] sci-mono">
                  <span className="text-cyan-300/70">{RES_ICON[k]} {RES_NAME[k]}</span>
                  <span className={ok ? "text-emerald-300" : "text-red-300"}>
                    {has.toLocaleString()} / {need.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={build}
            disabled={!canAfford || building}
            className={`w-full py-3 sci-btn text-sm ${canAfford ? "sci-btn-success" : "sci-btn-danger"}`}
          >
            {building ? "▸ ЗАКЛАДКА НА СТАПЕЛЕ..." : canAfford ? "▸ ЗАЛОЖИТЬ КОРАБЛЬ" : "▸ НЕДОСТАТОЧНО РЕСУРСОВ"}
          </button>

          {msg && (
            <div className={`mt-3 text-[11px] sci-mono rounded px-3 py-2 border ${
              msg.startsWith("✓")
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              {msg}
            </div>
          )}

          <p className="mt-3 text-[9px] sci-mono text-cyan-500/40 text-center leading-relaxed">
            ⚠ ПРОТОТИП — БАЛАНС НЕ ЗАВЕРШЁН<br/>
            СБОРКА НЕ СПИСЫВАЕТ РЕСУРСЫ
          </p>
        </div>
      </div>
    </div>
  );
}

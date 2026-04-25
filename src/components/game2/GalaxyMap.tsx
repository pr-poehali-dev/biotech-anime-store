import { useEffect, useState, useRef } from 'react';
import { apiPlanets } from './api';

type Planet = {
  id: number; name: string; type: string; pos_x: number; pos_y: number; size: number;
  biome: string; monster_density: number; resource_multiplier: number;
  controlling_alliance_id: number | null; alliance_name: string | null;
  bases_count: number; spaceports_count: number;
};

type Props = {
  currentPlanetId: number | null;
  onSelectPlanet: (id: number) => void;
};

const PLANET_EMOJIS: Record<string, string> = {
  earth: '🌍', mars: '🔴', ice: '❄️', volcanic: '🌋', metal: '⚙️',
  crystal: '💎', wasteland: '💀', space: '🌌', bio: '🧬', gas: '🪐',
  water: '🌊', desert: '🏜️',
};

const BIOME_COLORS: Record<string, string> = {
  temperate: '#22c55e', desert: '#f59e0b', arctic: '#60a5fa', volcanic: '#ef4444',
  jungle: '#16a34a', industrial: '#94a3b8', crystalline: '#a78bfa', wasteland: '#78716c',
  zero_g: '#7dd3fc', swamp: '#4ade80', ocean: '#3b82f6', nebula: '#c084fc',
  gas_giant: '#f97316', forest: '#15803d', void: '#1e1b4b',
};

export default function GalaxyMap({ currentPlanetId, onSelectPlanet }: Props) {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [selected, setSelected] = useState<Planet | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.7);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => { apiPlanets().then(setPlanets); }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden rounded-2xl"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: dragging ? 'grabbing' : 'grab', minHeight: 400 }}
    >
      {/* Stars background */}
      {[...Array(80)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width: (i % 3) + 1, height: (i % 3) + 1, opacity: 0.1 + (i % 5) * 0.08,
            left: `${(i * 13.7) % 100}%`, top: `${(i * 8.3) % 100}%`,
            animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
      ))}

      <div ref={canvasRef} className="absolute inset-0"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: dragging ? 'none' : 'transform 0.1s' }}>
        {planets.map(p => {
          const isCurrentPlanet = p.id === currentPlanetId;
          const color = BIOME_COLORS[p.biome] || '#888';
          const emoji = PLANET_EMOJIS[p.type] || '🌑';
          const sz = Math.max(30, p.size / 4);
          const isSelected = selected?.id === p.id;

          return (
            <button
              key={p.id}
              onClick={(e) => { e.stopPropagation(); setSelected(p); }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: p.pos_x, top: p.pos_y }}
            >
              {/* Planet glow */}
              <div className="absolute inset-0 rounded-full opacity-30 blur-sm"
                style={{ background: color, transform: 'scale(1.5)', zIndex: 0 }} />
              {/* Planet body */}
              <div className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-200
                  ${isSelected ? 'scale-125 border-white' : 'hover:scale-110'}
                  ${isCurrentPlanet ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950' : ''}
                `}
                style={{ width: sz, height: sz, background: `radial-gradient(circle at 35% 35%, ${color}99, ${color}44)`, borderColor: color, fontSize: sz * 0.4 }}>
                {emoji}
                {p.bases_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-[8px] font-bold w-4 h-4 flex items-center justify-center">{p.bases_count}</span>
                )}
                {p.controlling_alliance_id && (
                  <span className="absolute -bottom-1 -left-1 text-[10px]">🏴</span>
                )}
              </div>
              {/* Label */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/60 pointer-events-none">
                {p.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Planet info card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-72 bg-slate-900/95 border border-white/10 rounded-2xl p-4 backdrop-blur">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-2xl">{PLANET_EMOJIS[selected.type] || '🌑'}</div>
              <h3 className="text-white font-black text-base">{selected.name}</h3>
              <div className="text-slate-400 text-xs">{selected.biome} · {selected.type}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-red-400">👾</div>
              <div className="text-white font-bold">{selected.monster_density}</div>
              <div className="text-slate-500">Монстры</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-yellow-400">📦</div>
              <div className="text-white font-bold">×{selected.resource_multiplier.toFixed(1)}</div>
              <div className="text-slate-500">Ресурсы</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-green-400">🏭</div>
              <div className="text-white font-bold">{selected.bases_count}</div>
              <div className="text-slate-500">Баз</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <div className="text-blue-400">🚀</div>
              <div className="text-white font-bold">{selected.spaceports_count}</div>
              <div className="text-slate-500">Порты</div>
            </div>
          </div>
          {selected.alliance_name && (
            <div className="text-xs text-purple-400 mb-2">🏴 Контроль: {selected.alliance_name}</div>
          )}
          <button
            onClick={() => { onSelectPlanet(selected.id); setSelected(null); }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition-colors"
          >
            {selected.id === currentPlanetId ? '✅ Вы здесь' : '🚀 Высадиться'}
          </button>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute top-3 right-3 text-slate-600 text-[10px] space-y-0.5 pointer-events-none">
        <div>Перетащить карту</div>
        <div>Колесо — масштаб</div>
        <div>{planets.length} планет</div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 left-3 flex gap-1">
        <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 rounded-lg font-bold text-lg">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 rounded-lg font-bold text-lg">−</button>
      </div>
    </div>
  );
}

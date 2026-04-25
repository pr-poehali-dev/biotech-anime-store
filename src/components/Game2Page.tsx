import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from './game2/usePlayer';
import { clearToken, apiAction, apiBases, apiUnits } from './game2/api';
import AuthScreen from './game2/AuthScreen';
import PlayerHUD from './game2/PlayerHUD';
import GalaxyMap from './game2/GalaxyMap';
import BasePanel from './game2/BasePanel';
import ArmyPanel from './game2/ArmyPanel';
import CombatPanel from './game2/CombatPanel';
import AlliancePanel from './game2/AlliancePanel';
import GameShop from './game2/GameShop';
import type { Player } from './game2/usePlayer';

type Tab = 'map' | 'base' | 'army' | 'combat' | 'alliance';

export default function Game2Page() {
  const { player, setPlayer, loading, refresh } = usePlayer();
  const [tab, setTab] = useState<Tab>('map');
  const [showShop, setShowShop] = useState(false);
  const [bases, setBases] = useState<Array<{ id: number; name: string; level: number; is_deployed: boolean; pos_x: number; pos_y: number; hp: number; max_hp: number; commander_level: number; commander_implants: Record<string, number>; defenses: Record<string, unknown>; production_queue: unknown[]; planet_id: number | null }>>([]);
  const [units, setUnits] = useState<Array<{ id: number; type: string; specialization: string; level: number; implants: string[]; weapon: string; hp: number; max_hp: number; attack: number; defense: number; is_alive: boolean; base_id: number | null; planet_id: number | null }>>([]);

  const loadGameData = useCallback(async () => {
    const [b, u] = await Promise.all([apiBases(), apiUnits()]);
    setBases(b);
    setUnits(u);
  }, []);

  useEffect(() => {
    if (player) { loadGameData(); }
  }, [player, loadGameData]);

  const handleAuth = (p: Player) => {
    setPlayer(p);
  };

  const handleLogout = () => {
    clearToken();
    setPlayer(null);
  };

  const handleLandPlanet = async (planetId: number) => {
    if (!player) return;
    try {
      await apiAction('land-planet', { planet_id: planetId });
      await refresh();
      await loadGameData();
      setTab('base');
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    await loadGameData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">🌌 Загрузка...</div>
      </div>
    );
  }

  if (!player) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
    { id: 'map', label: 'Карта', emoji: '🌌' },
    { id: 'base', label: 'База', emoji: '🏭' },
    { id: 'army', label: 'Армия', emoji: '⚔️' },
    { id: 'combat', label: 'Бой', emoji: '💥' },
    { id: 'alliance', label: 'Альянс', emoji: '🏰' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <PlayerHUD player={player} onShop={() => setShowShop(true)} onLogout={handleLogout} />

      {/* Tab navigation */}
      <div className="bg-slate-900 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1 max-w-lg">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              <span className="block text-base leading-tight">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'map' && (
          <div className="h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
            <GalaxyMap
              currentPlanetId={player.planet_id}
              onSelectPlanet={handleLandPlanet}
            />
          </div>
        )}

        {tab !== 'map' && (
          <div className="p-3 max-w-2xl mx-auto max-h-[calc(100vh-120px)] overflow-y-auto">
            {tab === 'base' && (
              <BasePanel bases={bases} player={player} onRefresh={handleRefresh} />
            )}
            {tab === 'army' && (
              <ArmyPanel units={units} player={player} bases={bases} onRefresh={handleRefresh} />
            )}
            {tab === 'combat' && (
              <CombatPanel player={player} onRefresh={handleRefresh} />
            )}
            {tab === 'alliance' && (
              <AlliancePanel player={player} onRefresh={handleRefresh} />
            )}
          </div>
        )}
      </div>

      {showShop && <GameShop onClose={() => setShowShop(false)} />}
    </div>
  );
}

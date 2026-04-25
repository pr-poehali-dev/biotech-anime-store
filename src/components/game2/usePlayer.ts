import { useState, useEffect, useCallback } from 'react';
import { apiMe, getToken, clearToken } from './api';

export type Player = {
  id: number;
  nickname: string;
  faction: 'human' | 'tech' | 'cyborg';
  energy: number;
  gold: number;
  metal: number;
  crystal: number;
  bio_matter: number;
  score: number;
  alliance_id: number | null;
  planet_id: number | null;
  pos_x: number;
  pos_y: number;
};

export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const data = await apiMe();
      if (data.id) setPlayer(data as Player);
      else { clearToken(); setPlayer(null); }
    } catch {
      clearToken(); setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refill UI энергии каждые 10 мин
  useEffect(() => {
    const id = setInterval(refresh, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return { player, setPlayer, loading, refresh };
}

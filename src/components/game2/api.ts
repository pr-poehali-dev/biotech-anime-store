const AUTH_URL = 'https://functions.poehali.dev/c3fbf9d0-51fd-42eb-866d-20288c962e16';
const STATE_URL = 'https://functions.poehali.dev/86005bff-a1bf-4dcc-96b4-2df9ebc63e87';
const ACTION_URL = 'https://functions.poehali.dev/551fcb85-14ce-46ef-8cbe-838e9f8ceb49';

const TOKEN_KEY = 'game2_token';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function authHeaders() {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { 'X-Auth-Token': t } : {}) };
}

export async function apiRegister(data: { email: string; nickname: string; login: string; password: string; faction: string }) {
  const r = await fetch(AUTH_URL, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'register', ...data }) });
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!r.ok) throw new Error(parsed.error || 'Ошибка регистрации');
  return parsed;
}

export async function apiLogin(login: string, password: string) {
  const r = await fetch(AUTH_URL, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'login', login, password }) });
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!r.ok) throw new Error(parsed.error || 'Ошибка входа');
  return parsed;
}

export async function apiMe() {
  const r = await fetch(`${AUTH_URL}?action=me`, { headers: authHeaders() });
  const json = await r.json();
  return typeof json === 'string' ? JSON.parse(json) : json;
}

export async function apiPlanets() {
  const r = await fetch(`${STATE_URL}?action=planets`);
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return parsed.planets || [];
}

export async function apiPlanet(id: number) {
  const r = await fetch(`${STATE_URL}?action=planet&planet_id=${id}`);
  const json = await r.json();
  return typeof json === 'string' ? JSON.parse(json) : json;
}

export async function apiBases() {
  const r = await fetch(`${STATE_URL}?action=bases`, { headers: authHeaders() });
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return parsed.bases || [];
}

export async function apiUnits() {
  const r = await fetch(`${STATE_URL}?action=units`, { headers: authHeaders() });
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return parsed.units || [];
}

export async function apiAlliances() {
  const r = await fetch(`${STATE_URL}?action=alliances`);
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return parsed.alliances || [];
}

export async function apiLeaderboard() {
  const r = await fetch(`${STATE_URL}?action=leaderboard`);
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return parsed.leaderboard || [];
}

export async function apiAction(action: string, body: Record<string, unknown>) {
  const r = await fetch(ACTION_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, ...body }),
  });
  const json = await r.json();
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (!r.ok) throw new Error(parsed.error || 'Ошибка действия');
  return parsed;
}

import { useState } from 'react';
import { apiLogin, apiRegister, apiMe, setToken } from './api';
import type { Player } from './usePlayer';

type Props = {
  onAuth: (player: Player, token: string) => void;
};

const FACTIONS = [
  {
    id: 'human',
    name: 'Люди',
    emoji: '🧬',
    color: 'from-green-900 to-emerald-800',
    border: 'border-green-500',
    desc: 'Слабые в начале — мощнейшие при прокачке. Неограниченный потенциал развития.',
    bonuses: ['Прокачка без ограничений', 'Лучшая адаптивность', 'Мощный мед-тех'],
  },
  {
    id: 'tech',
    name: 'Альянс Техники',
    emoji: '🤖',
    color: 'from-blue-900 to-cyan-800',
    border: 'border-cyan-500',
    desc: 'Технари с превосходной техникой и роботами. Жёсткие ограничения на биоимпланты.',
    bonuses: ['Роботы-танки +30%', 'Техника дешевле -20%', 'Ограничен: нет биоимплантов'],
  },
  {
    id: 'cyborg',
    name: 'Киборги',
    emoji: '⚡',
    color: 'from-purple-900 to-violet-800',
    border: 'border-purple-500',
    desc: 'Полукиборги с мощными имплантами. Ограничены в найме обычных юнитов.',
    bonuses: ['Импланты -40% стоимость', 'Базовые бойцы слабее', 'Командир сильнее x2'],
  },
];

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'faction'>('form');
  const [form, setForm] = useState({ email: '', nickname: '', login: '', password: '' });
  const [faction, setFaction] = useState('human');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiLogin(form.login || form.email, form.password);
      setToken(data.token);
      // Загружаем свежие данные игрока с сервера
      const me = await apiMe();
      onAuth(me as Player, data.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiRegister({ email: form.email, nickname: form.nickname, login: form.login, password: form.password, faction });
      setToken(data.token);
      // Загружаем данные игрока с сервера после регистрации
      const me = await apiMe();
      onAuth(me as Player, data.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated star field */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white anim-twinkle"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              left: `${(i * 16.18) % 100}%`,
              top: `${(i * 9.73) % 100}%`,
              animationDelay: `${(i * 0.17) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
        {/* Moving comets */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`comet-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
            style={{
              width: 80 + i * 40,
              top: `${20 + i * 25}%`,
              left: `${(i * 30) % 70}%`,
              transform: 'rotate(-25deg)',
              animation: `marchRight ${4 + i * 2}s linear infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3" style={{ filter: 'drop-shadow(0 0 20px #3b82f6)' }}>🌌</div>
          <h1 className="text-3xl font-black text-white mb-1" style={{ textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>Эпоха Звёзд</h1>
          <p className="text-slate-400 text-sm">Многопользовательская браузерная стратегия</p>
        </div>

        {mode === 'login' ? (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">Войти в игру</h2>
            <input
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Логин или Email"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
            />
            <input
              type="password"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Пароль"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {error && <div className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? '...' : '🚀 Войти'}
            </button>
            <button onClick={() => { setMode('register'); setStep('form'); setError(''); }} className="w-full text-slate-400 hover:text-white text-sm transition-colors py-1">
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        ) : step === 'form' ? (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">Создать аккаунт</h2>
            {(['email', 'nickname', 'login', 'password'] as const).map(field => (
              <input
                key={field}
                type={field === 'password' ? 'password' : 'text'}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder={{ email: 'Email', nickname: 'Никнейм (отображается в игре)', login: 'Логин для входа', password: 'Пароль' }[field]}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              />
            ))}
            {error && <div className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2">{error}</div>}
            <button
              onClick={() => { if (!form.email || !form.nickname || !form.login || !form.password) { setError('Заполните все поля'); return; } setStep('faction'); setError(''); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Далее: Выбор фракции →
            </button>
            <button onClick={() => { setMode('login'); setError(''); }} className="w-full text-slate-400 hover:text-white text-sm transition-colors py-1">
              Уже есть аккаунт
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Выберите фракцию</h2>
            <div className="space-y-3 mb-5">
              {FACTIONS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFaction(f.id)}
                  className={`w-full bg-gradient-to-r ${f.color} rounded-xl p-4 text-left border-2 transition-all ${faction === f.id ? f.border + ' scale-[1.02]' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-white font-bold">{f.name}</span>
                  </div>
                  <p className="text-white/70 text-xs mb-2">{f.desc}</p>
                  <div className="space-y-0.5">
                    {f.bonuses.map((b, i) => <div key={i} className="text-xs text-white/60">✦ {b}</div>)}
                  </div>
                </button>
              ))}
            </div>
            {error && <div className="text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2 mb-3">{error}</div>}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-black font-black py-3 rounded-xl transition-all"
            >
              {loading ? '...' : '🎮 Начать игру!'}
            </button>
            <button onClick={() => setStep('form')} className="w-full text-slate-400 hover:text-white text-sm mt-2 py-1 transition-colors">← Назад</button>
          </div>
        )}
      </div>
    </div>
  );
}
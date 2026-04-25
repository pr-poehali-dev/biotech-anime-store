import { useState, useEffect, useRef, useCallback } from 'react';
import { apiChatGlobal, apiChatAlliance, apiChatSend, type ChatMessage } from './api';
import type { Player } from './usePlayer';

type Props = {
  player: Player;
};

const FACTION_COLOR: Record<string, string> = {
  human: 'text-emerald-400',
  tech: 'text-cyan-400',
  cyborg: 'text-violet-400',
};

const FACTION_BG: Record<string, string> = {
  human: 'bg-emerald-500/10 border-emerald-500/20',
  tech: 'bg-cyan-500/10 border-cyan-500/20',
  cyborg: 'bg-violet-500/10 border-violet-500/20',
};

const MSG_TYPE_STYLE: Record<string, string> = {
  text: '',
  system: 'italic text-yellow-400/80',
  battle: 'text-red-400',
  join: 'text-green-400 italic',
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const POLL_INTERVAL = 3000; // 3 секунды

export default function ChatPanel({ player }: Props) {
  const [channel, setChannel] = useState<'global' | 'alliance'>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUseAlliance = channel === 'alliance' && !!player.alliance_id;

  // Скролл вниз при новых сообщениях
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Загрузка истории при смене канала
  const loadHistory = useCallback(async () => {
    try {
      let msgs: ChatMessage[] = [];
      if (channel === 'global') {
        msgs = await apiChatGlobal(0);
      } else if (player.alliance_id) {
        msgs = await apiChatAlliance(player.alliance_id, 0);
      }
      setMessages(msgs);
      if (msgs.length > 0) {
        lastIdRef.current = msgs[msgs.length - 1].id;
      }
      setOnline(true);
      setTimeout(scrollToBottom, 50);
    } catch {
      setOnline(false);
    }
  }, [channel, player.alliance_id, scrollToBottom]);

  useEffect(() => {
    lastIdRef.current = 0;
    setMessages([]);
    loadHistory();
  }, [channel, loadHistory]);

  // Polling новых сообщений каждые 3 сек
  useEffect(() => {
    const poll = async () => {
      try {
        let newMsgs: ChatMessage[] = [];
        if (channel === 'global') {
          newMsgs = await apiChatGlobal(lastIdRef.current);
        } else if (player.alliance_id) {
          newMsgs = await apiChatAlliance(player.alliance_id, lastIdRef.current);
        }
        if (newMsgs.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const fresh = newMsgs.filter(m => !existingIds.has(m.id));
            if (!fresh.length) return prev;
            lastIdRef.current = fresh[fresh.length - 1].id;
            const updated = [...prev, ...fresh].slice(-100); // держим последние 100
            setTimeout(scrollToBottom, 50);
            return updated;
          });
          setOnline(true);
        }
      } catch {
        setOnline(false);
      }
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [channel, player.alliance_id, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (channel === 'alliance' && !player.alliance_id) {
      setError('Вступите в альянс, чтобы писать в его чат');
      return;
    }
    setSending(true);
    setError('');
    try {
      const msg = await apiChatSend(text, channel);
      setMessages(prev => {
        const updated = [...prev, msg].slice(-100);
        lastIdRef.current = msg.id;
        return updated;
      });
      setInput('');
      setTimeout(scrollToBottom, 50);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-white font-black text-sm">Чат</span>
          {/* Online indicator */}
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={online ? 'Онлайн' : 'Нет связи'} />
        </div>
        {/* Channel tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setChannel('global')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${channel === 'global' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            🌌 Мир
          </button>
          <button
            onClick={() => setChannel('alliance')}
            disabled={!player.alliance_id}
            title={!player.alliance_id ? 'Вступите в альянс' : 'Чат альянса'}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${channel === 'alliance' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            🏰 Альянс
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-8">
            {channel === 'global' ? 'Глобальный чат пуст. Напишите первым!' : 'Альянсовый чат пуст.'}
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.player_id === player.id;
          const isSystem = msg.msg_type !== 'text';
          const showName = i === 0 || messages[i - 1].player_id !== msg.player_id;

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800 ${MSG_TYPE_STYLE[msg.msg_type] || 'text-slate-400'}`}>
                  {msg.faction_emoji} {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isOwn && showName && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${FACTION_BG[msg.faction] || 'bg-slate-700 border-slate-600'}`}>
                  {msg.faction_emoji}
                </div>
              )}
              {!isOwn && !showName && <div className="w-7 shrink-0" />}

              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {showName && !isOwn && (
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[11px] font-bold ${FACTION_COLOR[msg.faction] || 'text-slate-400'}`}>
                      {msg.nickname}
                    </span>
                    <span className="text-slate-600 text-[10px]">{formatTime(msg.created_at)}</span>
                  </div>
                )}

                <div className={`px-3 py-1.5 rounded-2xl text-sm leading-snug break-words
                  ${isOwn
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                  }`}>
                  {msg.message}
                </div>

                {isOwn && (
                  <span className="text-slate-600 text-[10px]">{formatTime(msg.created_at)}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* No alliance notice */}
      {channel === 'alliance' && !player.alliance_id && (
        <div className="px-3 py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-400 text-xs text-center">
          Вступите в альянс, чтобы использовать этот канал
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 border-t border-white/10 flex gap-2 items-center shrink-0">
        <div className="flex-1 flex items-center bg-slate-800 rounded-xl border border-white/10 focus-within:border-blue-500 transition-colors">
          <span className="pl-3 text-sm">{player.faction === 'human' ? '🧬' : player.faction === 'tech' ? '🤖' : '⚡'}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            maxLength={300}
            placeholder={
              channel === 'alliance' && !player.alliance_id
                ? 'Нет доступа'
                : `Сообщение в ${channel === 'global' ? 'мировой чат' : 'альянс'}…`
            }
            disabled={channel === 'alliance' && !player.alliance_id}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-slate-500 outline-none disabled:opacity-40"
          />
          {input.length > 250 && (
            <span className="pr-2 text-[10px] text-slate-500">{300 - input.length}</span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || (channel === 'alliance' && !player.alliance_id)}
          className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shrink-0"
          title="Отправить (Enter)"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

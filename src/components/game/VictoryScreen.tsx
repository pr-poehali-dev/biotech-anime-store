type Props = {
  score: number;
  factionName: string;
  factionEmoji: string;
  turn: number;
  onRestart: () => void;
};

export default function VictoryScreen({ score, factionName, factionEmoji, turn, onRestart }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-bounce">👑</div>
        <h1 className="text-4xl font-black text-white mb-2">ПОБЕДА!</h1>
        <div className="text-xl text-yellow-400 font-bold mb-4">{factionEmoji} {factionName}</div>
        <p className="text-slate-400 mb-6">Все территории завоёваны за {turn} ходов. Ты — повелитель этого мира!</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="text-3xl font-black text-yellow-400">{score}</div>
            <div className="text-slate-400 text-sm">Очков набрано</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="text-3xl font-black text-blue-400">{turn}</div>
            <div className="text-slate-400 text-sm">Ходов сыграно</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-lg py-4 rounded-2xl transition-all"
        >
          🔄 Играть снова
        </button>
      </div>
    </div>
  );
}

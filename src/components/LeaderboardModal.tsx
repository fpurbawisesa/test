import React from 'react';
import { Player } from '../types/game';
import { sound } from '../utils/sound';
import { Trophy, Medal, Award, Star, X, Zap } from 'lucide-react';

interface LeaderboardModalProps {
  players: Record<string, Player>;
  localPlayerId: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  players,
  localPlayerId,
  onClose,
}) => {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Papan Peringkat Juara SD</h2>
              <p className="text-xs text-slate-400">
                Peringkat skor petualang dan pencapaian lencana real-time
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Players List */}
        <div className="my-4 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {sortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Belum ada pemain yang masuk ke arena
            </div>
          ) : (
            sortedPlayers.map((p, index) => {
              const isLocal = p.id === localPlayerId;
              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400">
                  {index + 1}
                </span>
              );

              if (index === 0) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                    🥇
                  </div>
                );
              } else if (index === 1) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-slate-300/20 border border-slate-300 flex items-center justify-center text-slate-200 font-bold">
                    🥈
                  </div>
                );
              } else if (index === 2) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-amber-800/30 border border-amber-600 flex items-center justify-center text-amber-500 font-bold">
                    🥉
                  </div>
                );
              }

              const accuracy = p.answeredQuestionsCount > 0 ? Math.round((p.correctCount / p.answeredQuestionsCount) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    isLocal
                      ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/30 shadow-md'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {p.name}
                        </span>
                        {isLocal && (
                          <span className="text-[10px] bg-blue-600/50 border border-blue-400 text-blue-200 px-1.5 py-0.2 rounded font-semibold">
                            Kamu
                          </span>
                        )}
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                          Lv.{p.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>Akurasi: {accuracy}%</span>
                        <span>·</span>
                        <span>Soal: {p.correctCount}/{p.answeredQuestionsCount}</span>
                        {p.currentStreak > 1 && (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            <Zap className="w-3 h-3 fill-current" /> {p.currentStreak}x Streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="font-pixel text-amber-400 font-bold text-sm md:text-base tabular-nums">
                      {p.score}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      POIN
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer"
        >
          Tutup Papan Skor
        </button>
      </div>
    </div>
  );
};

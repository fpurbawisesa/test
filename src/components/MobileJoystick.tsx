import React, { useRef, useState, useEffect } from 'react';

interface MobileJoystickProps {
  onMove: (vector: { x: number; y: number } | null) => void;
  onInteract: () => void;
  canInteract: boolean;
  interactLabel?: string;
}

export const MobileJoystick: React.FC<MobileJoystickProps> = ({
  onMove,
  onInteract,
  canInteract,
  interactLabel = 'INTERAKSI [E]',
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);

  const maxRadius = 45;

  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    setKnobPos({ x: 0, y: 0 });
    onMove(null);
  };

  const updateKnob = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      onMove({ x: dx / maxRadius, y: dy / maxRadius });
    } else {
      const angle = Math.atan2(dy, dx);
      const boundedX = Math.cos(angle) * maxRadius;
      const boundedY = Math.sin(angle) * maxRadius;
      setKnobPos({ x: boundedX, y: boundedY });
      onMove({ x: Math.cos(angle), y: Math.sin(angle) });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none touch-none">
      {/* Left Bottom: Joystick Base */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-32 h-32 rounded-full bg-slate-900/60 border-2 border-slate-700/80 backdrop-blur-sm flex items-center justify-center shadow-2xl touch-none cursor-grab active:cursor-grabbing"
        >
          {/* Inner Track Circle */}
          <div className="w-16 h-16 rounded-full border border-slate-600/50" />

          {/* Draggable Knob */}
          <div
            className="absolute w-14 h-14 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-300 shadow-lg"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: activeTouchId === null ? 'transform 0.15s ease-out' : 'none',
            }}
          />
        </div>
      </div>

      {/* Right Bottom: Action / Interact Button */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center gap-2">
        <button
          onClick={onInteract}
          className={`w-20 h-20 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer ${
            canInteract
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-300 text-white animate-bounce shadow-amber-500/40'
              : 'bg-slate-900/70 border-slate-700 text-slate-400'
          }`}
        >
          <span className="font-pixel text-lg font-bold">E</span>
          <span className="text-[9px] font-bold uppercase tracking-tighter">AKSI</span>
        </button>
      </div>
    </div>
  );
};

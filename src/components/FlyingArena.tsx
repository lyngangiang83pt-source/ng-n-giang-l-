import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Student, GamePhase, QuestionItem } from '../types';
import { soundManager } from '../utils/audio';
import {
  Square,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  HelpCircle,
  Shuffle,
  Settings,
} from 'lucide-react';

interface FlyingArenaProps {
  students: Student[];
  eligibleStudents: Student[];
  gamePhase: GamePhase;
  selectedStudent: Student | null;
  nonRepeatEnabled: boolean;
  soundEnabled: boolean;
  onStart: () => void;
  onStop: () => void;
  onResetRounds: () => void;
  onToggleSound: () => void;
  onSelectStudent: (student: Student) => void;
  onCloseArena: () => void;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  customBackground?: string | null;
  questions?: QuestionItem[];
}

interface FlyingNode {
  id: string;
  student: Student;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  scale: number;
  angle: number;
  vRot: number;
  opacity: number;
}

export const FlyingArena: React.FC<FlyingArenaProps> = ({
  students,
  eligibleStudents,
  gamePhase,
  selectedStudent,
  nonRepeatEnabled,
  soundEnabled,
  onStart,
  onStop,
  onResetRounds,
  onToggleSound,
  onSelectStudent,
  onCloseArena,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
  customBackground,
  questions = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<FlyingNode[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const decelerateProgressRef = useRef<number>(0);
  const targetWinnerRef = useRef<Student | null>(null);
  const phaseRef = useRef<GamePhase>(gamePhase);

  // Question reveal state
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  // Sync ref with prop
  useEffect(() => {
    phaseRef.current = gamePhase;
    if (gamePhase !== 'SELECTED') {
      setActiveQuestion(null);
    }
  }, [gamePhase]);

  // Preload and cache student images
  useEffect(() => {
    students.forEach((s) => {
      if (!imageCacheRef.current.has(s.imageUrl)) {
        const img = new Image();
        img.src = s.imageUrl;
        imageCacheRef.current.set(s.imageUrl, img);
      }
    });
  }, [students]);

  // Initialize nodes for all eligible students
  const initNodes = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const candidates = eligibleStudents.length > 0 ? eligibleStudents : students;

    nodesRef.current = candidates.map((student) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.min(width, height) * (0.2 + Math.random() * 0.28);
      const cx = width / 2;
      const cy = height / 2;

      const speed = 8 + Math.random() * 8;
      const moveAngle = Math.random() * Math.PI * 2;

      return {
        id: student.id,
        student,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: Math.cos(moveAngle) * speed,
        vy: Math.sin(moveAngle) * speed,
        baseRadius: 46,
        scale: 0.85 + Math.random() * 0.35,
        angle: 0,
        vRot: (Math.random() - 0.5) * 0.04,
        opacity: 1,
      };
    });
  }, [eligibleStudents, students]);

  useEffect(() => {
    initNodes();
  }, [initNodes]);

  // Main 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(40, now - lastTime) / 16.666;
      lastTime = now;

      const isSpinning = phaseRef.current === 'SPINNING';
      const isDecelerating = phaseRef.current === 'DECELERATING';
      const isSelected = phaseRef.current === 'SELECTED';

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Ambient radial spotlight
      ctx.save();
      const stageGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.45);
      if (isSpinning) {
        stageGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
        stageGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
        stageGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
      } else if (isSelected) {
        stageGlow.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
        stageGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.08)');
        stageGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
      } else {
        stageGlow.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
        stageGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
      }
      ctx.fillStyle = stageGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Light rays on winner selection
      if (isSelected && targetWinnerRef.current) {
        ctx.save();
        ctx.translate(cx, cy);
        const rayCount = 24;
        const rayLength = Math.max(width, height) * 0.8;
        const rotTime = now * 0.0006;

        for (let i = 0; i < rayCount; i++) {
          const rayAngle = (i / rayCount) * Math.PI * 2 + rotTime;
          const halfWidth = (Math.PI * 2) / rayCount / 3;

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, rayLength, rayAngle - halfWidth, rayAngle + halfWidth);
          ctx.closePath();

          const rayGrad = ctx.createRadialGradient(0, 0, 80, 0, 0, rayLength);
          rayGrad.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
          rayGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.1)');
          rayGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = rayGrad;
          ctx.fill();
        }

        for (let r = 1; r <= 3; r++) {
          const pulseRadius = 130 + ((now * 0.08 + r * 60) % 240);
          const pulseAlpha = Math.max(0, 1 - (pulseRadius - 130) / 240) * 0.45;
          ctx.beginPath();
          ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(253, 224, 71, ${pulseAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Physics update and drawing of nodes
      const nodes = nodesRef.current;
      const decelProgress = decelerateProgressRef.current;
      const winner = targetWinnerRef.current;

      let speedMult = 1.0;
      if (isDecelerating) {
        speedMult = Math.max(0, Math.pow(1 - decelProgress, 2.2));
      } else if (!isSpinning && !isDecelerating) {
        speedMult = 0.2;
      }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isTarget = winner && node.id === winner.id;

        if (isSpinning || (!isDecelerating && !isSelected)) {
          node.x += node.vx * speedMult * dt;
          node.y += node.vy * speedMult * dt;
          node.angle += node.vRot * speedMult * dt;

          const r = node.baseRadius * node.scale;
          const pad = r + 10;

          if (node.x < pad) {
            node.x = pad;
            node.vx = Math.abs(node.vx);
          } else if (node.x > width - pad) {
            node.x = width - pad;
            node.vx = -Math.abs(node.vx);
          }

          if (node.y < pad + 60) {
            node.y = pad + 60;
            node.vy = Math.abs(node.vy);
          } else if (node.y > height - pad - 80) {
            node.y = height - pad - 80;
            node.vy = -Math.abs(node.vy);
          }
        } else if (isDecelerating) {
          if (isTarget) {
            const easeP = decelProgress * decelProgress * (3 - 2 * decelProgress);
            node.x += (cx - node.x) * 0.08 * dt;
            node.y += (cy - node.y) * 0.08 * dt;
            node.scale = 1.0 + easeP * 1.8;
          } else {
            node.x += node.vx * speedMult * dt;
            node.y += node.vy * speedMult * dt;
            node.opacity = Math.max(0.08, 1 - decelProgress * 0.85);
          }
        } else if (isSelected) {
          if (isTarget) {
            node.x = cx;
            node.y = cy;
            const breath = Math.sin(now * 0.003) * 0.05;
            node.scale = 2.85 + breath;
            node.opacity = 1;
          } else {
            node.opacity = 0.06;
          }
        }

        if (isSelected && !isTarget) continue;

        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.globalAlpha = node.opacity;

        const currentR = node.baseRadius * node.scale;

        // Motion blur lines
        if (isSpinning && (Math.abs(node.vx) > 5 || Math.abs(node.vy) > 5)) {
          ctx.save();
          ctx.beginPath();
          const blurLen = 14;
          const dirX = -node.vx * (blurLen / 10);
          const dirY = -node.vy * (blurLen / 10);
          ctx.moveTo(dirX, dirY);
          ctx.lineTo(0, 0);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = currentR * 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // Shadow & glow
        ctx.beginPath();
        ctx.arc(0, 0, currentR + 3, 0, Math.PI * 2);
        if (isTarget && (isDecelerating || isSelected)) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 32;
        } else {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 12;
        }
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Image clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
        ctx.clip();

        const img = imageCacheRef.current.get(node.student.imageUrl);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -currentR, -currentR, currentR * 2, currentR * 2);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-currentR, -currentR, currentR * 2, currentR * 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(currentR * 0.7)}px 'Outfit', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.student.name.charAt(0), 0, 0);
        }
        ctx.restore();

        // White border
        ctx.beginPath();
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
        ctx.strokeStyle = isTarget && isSelected ? '#fef08a' : '#ffffff';
        ctx.lineWidth = isTarget && isSelected ? 6 : Math.max(3, currentR * 0.08);
        ctx.stroke();

        if (!isSelected && node.scale > 0.7) {
          ctx.save();
          ctx.font = `600 13px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.fillText(node.student.name, 0, currentR + 8);
          ctx.restore();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleStart = () => {
    if (eligibleStudents.length === 0) {
      if (nonRepeatEnabled) {
        onResetRounds();
      }
    }

    targetWinnerRef.current = null;
    decelerateProgressRef.current = 0;
    setActiveQuestion(null);

    nodesRef.current.forEach((node) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 8;
      node.vx = Math.cos(angle) * speed;
      node.vy = Math.sin(angle) * speed;
      node.scale = 0.9 + Math.random() * 0.3;
      node.opacity = 1;
    });

    soundManager.startSpinTicks(60);
    onStart();
  };

  const handleStop = async () => {
    if (gamePhase !== 'SPINNING') return;

    const pool = eligibleStudents.length > 0 ? eligibleStudents : students;
    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const winner = pool[randomIndex];
    targetWinnerRef.current = winner;

    onStop();

    const duration = 3000;
    const startTime = performance.now();

    soundManager.decelerateTicks(duration, (p) => {
      decelerateProgressRef.current = p;
    });

    const checkInterval = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      decelerateProgressRef.current = progress;

      if (progress < 1) {
        requestAnimationFrame(checkInterval);
      } else {
        onSelectStudent(winner);
        soundManager.playSelectionSequence();
      }
    };

    requestAnimationFrame(checkInterval);
  };

  // Pick random question for selected student
  const handlePickQuestion = () => {
    if (!questions || questions.length === 0) return;
    const rIndex = Math.floor(Math.random() * questions.length);
    setActiveQuestion(questions[rIndex].text);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gamePhase === 'IDLE') {
          handleStart();
        } else if (gamePhase === 'SPINNING') {
          handleStop();
        } else if (gamePhase === 'SELECTED') {
          handleStart();
        }
      } else if (e.code === 'Escape') {
        if (gamePhase === 'SELECTED') {
          targetWinnerRef.current = null;
        } else {
          onCloseArena();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, eligibleStudents, students]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between">
      {/* Custom Background Image if teacher set one */}
      {customBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-500"
          style={{ backgroundImage: `url(${customBackground})` }}
        >
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 60fps Physics Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Top Floating Control Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onCloseArena}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            title="Quay lại danh sách (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h1 className="text-base sm:text-lg font-black tracking-wide bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent font-['Outfit']">
              GỌI HỌC SINH NGẪU NHIÊN
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-slate-300">
            <span>Tổng: <strong className="text-white">{students.length}</strong></span>
            {nonRepeatEnabled && (
              <>
                <span className="text-slate-600">·</span>
                <span>Còn lại: <strong className="text-cyan-400 font-bold">{eligibleStudents.length}</strong></span>
              </>
            )}
          </div>

          {/* Quick Settings in Arena */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Cài đặt danh sách, câu hỏi, nền"
          >
            <span role="img" aria-label="Sunflower">🌻</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Selected Student Display */}
      {gamePhase === 'SELECTED' && selectedStudent && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="mt-72 sm:mt-80 flex flex-col items-center text-center max-w-2xl w-full">
            {/* Student Name Display */}
            {/* Strictly NO "Chúc mừng", "Winner", or "Congratulations" */}
            <div className="px-8 py-3.5 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/20 shadow-2xl shadow-black/80 pointer-events-auto transform animate-in fade-in zoom-in-95 duration-300">
              <h2
                className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-wide font-['Outfit'] select-text"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,1), 0 0 40px rgba(56,189,248,0.7), 0 0 2px #000',
                  WebkitTextStroke: '1px rgba(0, 0, 0, 0.85)',
                }}
              >
                {selectedStudent.name}
              </h2>
            </div>

            {/* Random Question Display if question bank has questions */}
            {questions && questions.length > 0 && (
              <div className="mt-4 pointer-events-auto w-full max-w-lg">
                {activeQuestion ? (
                  <div className="p-4 rounded-2xl bg-indigo-950/85 backdrop-blur-md border border-cyan-400/40 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-cyan-300">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>CÂU HỎI TRẢ LỜI:</span>
                      </span>
                      <button
                        onClick={handlePickQuestion}
                        className="flex items-center gap-1 text-[11px] text-cyan-200 hover:text-white underline cursor-pointer"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Đổi câu khác</span>
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                      {activeQuestion}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handlePickQuestion}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 mx-auto rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm border border-indigo-400/40 shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-300" />
                    <span>Bấm để hiện câu hỏi ngẫu nhiên ({questions.length} câu)</span>
                  </button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Gọi tiếp theo (Phím Cách)</span>
              </button>

              <button
                onClick={() => {
                  targetWinnerRef.current = null;
                  onCloseArena();
                }}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              >
                Xem danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IDLE Prompt */}
      {gamePhase === 'IDLE' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center px-6 py-8 rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-white/15 shadow-2xl max-w-md pointer-events-auto transform transition-all">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Play className="w-8 h-8 text-white fill-current ml-1" />
            </div>
            <h2 className="text-2xl font-black text-white font-['Outfit'] mb-2">
              Sẵn sàng gọi ngẫu nhiên
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              Bấm <strong className="text-cyan-300 font-bold">▶️ Bắt đầu</strong> hoặc nhấn <kbd className="px-2 py-1 bg-white/15 rounded text-xs text-white font-mono">Phím Cách</kbd> để kích hoạt hiệu ứng xoay.
            </p>
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-lg shadow-2xl shadow-cyan-500/40 transform hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>BẮT ĐẦU QUAY</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Game Show Controller Bar */}
      <footer className="relative z-20 px-6 py-5 bg-slate-950/75 backdrop-blur-2xl border-t border-white/10 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {gamePhase === 'IDLE' && (
              <button
                onClick={handleStart}
                className="group flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base shadow-xl shadow-emerald-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                <span>BẮT ĐẦU</span>
                <span className="text-xs font-normal text-emerald-100/80 bg-black/20 px-1.5 py-0.5 rounded">Space</span>
              </button>
            )}

            {gamePhase === 'SPINNING' && (
              <button
                onClick={handleStop}
                className="group flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-black text-lg shadow-2xl shadow-red-500/40 animate-pulse transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>DỪNG LẠI</span>
                <span className="text-xs font-normal text-red-100/90 bg-black/20 px-1.5 py-0.5 rounded">Space</span>
              </button>
            )}

            {gamePhase === 'DECELERATING' && (
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>Đang chọn học sinh...</span>
              </div>
            )}

            {gamePhase === 'SELECTED' && (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Lượt tiếp theo</span>
                <span className="text-xs text-cyan-200/80 bg-black/20 px-1.5 py-0.5 rounded">Space</span>
              </button>
            )}

            {nonRepeatEnabled && (
              <button
                onClick={onResetRounds}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold border border-white/10 transition-colors cursor-pointer"
                title="Xóa lịch sử đã gọi, bắt đầu vòng mới"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Bắt đầu vòng mới</span>
                <span className="sm:hidden">Vòng mới</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Space</kbd>
              Bắt đầu / Dừng
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd>
              Danh sách
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

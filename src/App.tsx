/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, GamePhase, Classroom, QuestionItem } from './types';
import { SAMPLE_STUDENTS, DEFAULT_CLASSROOMS } from './utils/sampleData';
import { soundManager } from './utils/audio';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { HeaderBar } from './components/HeaderBar';
import { StudentGrid } from './components/StudentGrid';
import { FlyingArena } from './components/FlyingArena';
import { SettingsModal } from './components/SettingsModal';
import { Play, Sparkles, HelpCircle, Settings as SettingsIcon } from 'lucide-react';

const CLASSROOMS_STORAGE_KEY = 'goi_hoc_sinh_classrooms_v2';
const ACTIVE_CLASS_KEY = 'goi_hoc_sinh_active_class_v2';
const NON_REPEAT_KEY = 'goi_hoc_sinh_non_repeat_v2';
const SOUND_KEY = 'goi_hoc_sinh_sound_v2';
const BGM_KEY = 'goi_hoc_sinh_bgm_v2';
const BG_KEY = 'goi_hoc_sinh_custom_bg_v2';

export default function App() {
  // Load saved classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    try {
      const saved = localStorage.getItem(CLASSROOMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CLASSROOMS;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_CLASS_KEY);
      if (saved && classrooms.some((c) => c.id === saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return classrooms[0]?.id || 'class-6a';
  });

  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    try {
      return localStorage.getItem(BG_KEY);
    } catch {
      return null;
    }
  });

  const [nonRepeatEnabled, setNonRepeatEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(NON_REPEAT_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [bgmEnabled, setBgmEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(BGM_KEY);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('IDLE');
  const [viewMode, setViewMode] = useState<'GRID' | 'ARENA'>('GRID');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Active classroom
  const activeClass = useMemo(() => {
    return classrooms.find((c) => c.id === activeClassId) || classrooms[0];
  }, [classrooms, activeClassId]);

  const students = activeClass?.students || [];
  const questions = activeClass?.questions || [];

  // Sync sound manager with state
  useEffect(() => {
    soundManager.setMuted(!soundEnabled);
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Sync BGM
  useEffect(() => {
    soundManager.toggleBgm(bgmEnabled);
    try {
      localStorage.setItem(BGM_KEY, JSON.stringify(bgmEnabled));
    } catch {
      // Ignore
    }
  }, [bgmEnabled]);

  // Sync custom background
  useEffect(() => {
    try {
      if (customBackground) {
        localStorage.setItem(BG_KEY, customBackground);
      } else {
        localStorage.removeItem(BG_KEY);
      }
    } catch {
      // Ignore storage quota
    }
  }, [customBackground]);

  // Sync nonRepeat preference
  useEffect(() => {
    try {
      localStorage.setItem(NON_REPEAT_KEY, JSON.stringify(nonRepeatEnabled));
    } catch {
      // Ignore
    }
  }, [nonRepeatEnabled]);

  // Save classrooms when changed
  useEffect(() => {
    try {
      localStorage.setItem(CLASSROOMS_STORAGE_KEY, JSON.stringify(classrooms));
    } catch {
      // Quota exceeded safe fallback
    }
  }, [classrooms]);

  // Save active class ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CLASS_KEY, activeClassId);
    } catch {
      // Ignore
    }
  }, [activeClassId]);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Eligible students for the active class
  const eligibleStudents = useMemo(() => {
    if (!nonRepeatEnabled) return students;
    return students.filter((s) => !s.hasBeenCalled);
  }, [students, nonRepeatEnabled]);

  // Class Management Handlers
  const handleSelectClassroom = useCallback((classId: string) => {
    setActiveClassId(classId);
    setSelectedStudent(null);
    setGamePhase('IDLE');
  }, []);

  const handleCreateClassroom = useCallback((name: string) => {
    const newClass: Classroom = {
      id: `class-${Date.now()}`,
      name,
      students: [],
      questions: [],
    };
    setClassrooms((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);
  }, []);

  const handleRenameClassroom = useCallback((classId: string, newName: string) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, name: newName } : c))
    );
  }, []);

  const handleDeleteClassroom = useCallback((classId: string) => {
    setClassrooms((prev) => {
      const filtered = prev.filter((c) => c.id !== classId);
      if (filtered.length > 0) {
        setActiveClassId(filtered[0].id);
      }
      return filtered;
    });
  }, []);

  const handleUpdateStudentsInClass = useCallback((classId: string, updatedStudents: Student[]) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, students: updatedStudents } : c))
    );
  }, []);

  const handleUpdateQuestionsInClass = useCallback((classId: string, updatedQuestions: QuestionItem[]) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, questions: updatedQuestions } : c))
    );
  }, []);

  // Add students from file upload
  const handleAddStudents = useCallback(
    (newStudents: Student[]) => {
      handleUpdateStudentsInClass(activeClassId, [...students, ...newStudents]);
    },
    [activeClassId, students, handleUpdateStudentsInClass]
  );

  // Remove a single student
  const handleRemoveStudent = useCallback(
    (id: string) => {
      handleUpdateStudentsInClass(
        activeClassId,
        students.filter((s) => s.id !== id)
      );
    },
    [activeClassId, students, handleUpdateStudentsInClass]
  );

  // Toggle single student's called status in grid
  const handleToggleCalled = useCallback(
    (id: string) => {
      handleUpdateStudentsInClass(
        activeClassId,
        students.map((s) => (s.id === id ? { ...s, hasBeenCalled: !s.hasBeenCalled } : s))
      );
    },
    [activeClassId, students, handleUpdateStudentsInClass]
  );

  // Reset round
  const handleResetRounds = useCallback(() => {
    handleUpdateStudentsInClass(
      activeClassId,
      students.map((s) => ({ ...s, hasBeenCalled: false }))
    );
    setSelectedStudent(null);
    setGamePhase('IDLE');
  }, [activeClassId, students, handleUpdateStudentsInClass]);

  // Load sample class
  const handleLoadSamples = useCallback(() => {
    handleUpdateStudentsInClass(
      activeClassId,
      SAMPLE_STUDENTS.map((s) => ({ ...s, hasBeenCalled: false }))
    );
    setSelectedStudent(null);
    setGamePhase('IDLE');
  }, [activeClassId, handleUpdateStudentsInClass]);

  // Clear all in current class
  const handleClearAll = useCallback(() => {
    if (window.confirm(`Thầy cô muốn xóa toàn bộ học sinh trong "${activeClass?.name}"?`)) {
      handleUpdateStudentsInClass(activeClassId, []);
      setSelectedStudent(null);
      setGamePhase('IDLE');
    }
  }, [activeClass?.name, activeClassId, handleUpdateStudentsInClass]);

  // Start Game
  const handleStartGame = useCallback(() => {
    if (students.length === 0) {
      setIsSettingsOpen(true);
      return;
    }

    if (nonRepeatEnabled && eligibleStudents.length === 0) {
      if (window.confirm('Tất cả học sinh trong danh sách đã được gọi hết! Bắt đầu vòng mới nhé?')) {
        handleResetRounds();
      } else {
        return;
      }
    }

    setSelectedStudent(null);
    setGamePhase('SPINNING');
    setViewMode('ARENA');
  }, [students.length, nonRepeatEnabled, eligibleStudents.length, handleResetRounds]);

  // When student is selected
  const handleStudentSelected = useCallback(
    (winner: Student) => {
      setSelectedStudent(winner);
      setGamePhase('SELECTED');

      if (nonRepeatEnabled) {
        handleUpdateStudentsInClass(
          activeClassId,
          students.map((s) => (s.id === winner.id ? { ...s, hasBeenCalled: true } : s))
        );
      }
    },
    [activeClassId, students, nonRepeatEnabled, handleUpdateStudentsInClass]
  );

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Custom Background Image if applied */}
      {customBackground && (
        <div
          className="fixed inset-0 bg-cover bg-center -z-20 transition-all duration-500 pointer-events-none"
          style={{ backgroundImage: `url(${customBackground})` }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 60fps Ambient Bokeh Background */}
      <BackgroundCanvas />

      {/* Main View: Fullscreen Arena or Dashboard Grid */}
      {viewMode === 'ARENA' ? (
        <FlyingArena
          students={students}
          eligibleStudents={eligibleStudents}
          gamePhase={gamePhase}
          selectedStudent={selectedStudent}
          nonRepeatEnabled={nonRepeatEnabled}
          soundEnabled={soundEnabled}
          onStart={() => setGamePhase('SPINNING')}
          onStop={() => setGamePhase('DECELERATING')}
          onResetRounds={handleResetRounds}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onSelectStudent={handleStudentSelected}
          onCloseArena={() => {
            soundManager.stopSpinTicks();
            setGamePhase('IDLE');
            setViewMode('GRID');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          customBackground={customBackground}
          questions={questions}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header Bar */}
          <HeaderBar
            students={students}
            eligibleStudents={eligibleStudents}
            classrooms={classrooms}
            activeClassId={activeClassId}
            onSelectClassroom={handleSelectClassroom}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onAddStudents={handleAddStudents}
            onClearAll={handleClearAll}
            onResetRounds={handleResetRounds}
            onStartGame={handleStartGame}
            nonRepeatEnabled={nonRepeatEnabled}
            onToggleNonRepeat={() => setNonRepeatEnabled((prev) => !prev)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* Hero Banner with Class Info & Quick Actions */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-slate-900/85 via-indigo-950/40 to-slate-900/85 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Đang chọn: {activeClass?.name}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    · {students.length} học sinh {questions.length > 0 && `· ${questions.length} câu hỏi`}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight mb-2">
                  Gọi Học Sinh Lên Bảng & Trả Lời
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Quản lý nhiều lớp học, dán danh sách tên nhanh, ngân hàng câu hỏi và hiệu ứng bay 60fps hấp dẫn.
                </p>
              </div>

              {/* Big Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={handleStartGame}
                  disabled={students.length === 0}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg tracking-wide shadow-2xl transition-all transform hover:scale-102 active:scale-98 cursor-pointer ${
                    students.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/35'
                  }`}
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>BẮT ĐẦU QUAY</span>
                </button>

                {/* 🌻 Cài Đặt Button in Hero */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md"
                  title="Cài đặt danh sách, chọn lớp, câu hỏi, hình nền"
                >
                  <span className="text-lg">🌻</span>
                  <span>Cài Đặt</span>
                </button>

                <button
                  onClick={() => setShowHelpModal(true)}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Hướng dẫn sử dụng"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Students Grid Display */}
            <div className="flex-1 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
              <StudentGrid
                students={students}
                onRemoveStudent={handleRemoveStudent}
                onToggleCalled={handleToggleCalled}
                onAddSampleStudents={handleLoadSamples}
                onOpenUpload={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (input) input.click();
                }}
                nonRepeatEnabled={nonRepeatEnabled}
              />
            </div>
          </main>
        </div>
      )}

      {/* Settings Modal (Sunflower 🌻 Cài Đặt) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        classrooms={classrooms}
        activeClassId={activeClassId}
        onSelectClassroom={handleSelectClassroom}
        onCreateClassroom={handleCreateClassroom}
        onRenameClassroom={handleRenameClassroom}
        onDeleteClassroom={handleDeleteClassroom}
        onUpdateStudentsInClass={handleUpdateStudentsInClass}
        onUpdateQuestionsInClass={handleUpdateQuestionsInClass}
        customBackground={customBackground}
        onSetCustomBackground={setCustomBackground}
        bgmEnabled={bgmEnabled}
        onToggleBgm={setBgmEnabled}
        onResetRounds={handleResetRounds}
      />

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-left relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white font-['Outfit'] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Hướng dẫn sử dụng cho Thầy Cô</span>
            </h3>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-white mb-1">1. Quản lý lớp & Danh sách tên:</p>
                <p className="text-xs text-slate-400">
                  Bấm nút <strong>🌻 Cài Đặt</strong> để chọn lớp hoặc tạo lớp mới. Thầy cô có thể dán trực tiếp danh sách tên học sinh (mỗi dòng một tên) hoặc tải file XLSX, Word, CSV, TXT.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-white mb-1">2. Ngân hàng câu hỏi:</p>
                <p className="text-xs text-slate-400">
                  Tại tab <strong>Câu Hỏi</strong> trong Cài Đặt, thầy cô có thể nhập danh sách câu hỏi kiểm tra. Khi quay trúng học sinh, chỉ cần 1 click để hiện câu hỏi ngẫu nhiên cho em đó.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-white mb-1">3. Phím tắt tiện lợi:</p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Phím Cách (Space)</kbd>: Bắt đầu / Dừng / Lượt tiếp theo</li>
                  <li><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Phím F11</kbd>: Toàn màn hình máy chiếu/TV</li>
                  <li><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Phím Esc</kbd>: Trở về danh sách lớp</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-cyan-600/30"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

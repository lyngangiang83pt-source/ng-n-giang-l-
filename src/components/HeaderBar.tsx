import React, { useRef } from 'react';
import { Classroom, Student } from '../types';
import { extractStudentNameFromFileName } from '../utils/sampleData';
import {
  Upload,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square as SquareIcon,
  ChevronDown,
  Settings,
} from 'lucide-react';

interface HeaderBarProps {
  students: Student[];
  eligibleStudents: Student[];
  classrooms: Classroom[];
  activeClassId: string;
  onSelectClassroom: (classId: string) => void;
  onOpenSettings: () => void;
  onAddStudents: (newStudents: Student[]) => void;
  onClearAll: () => void;
  onResetRounds: () => void;
  onStartGame: () => void;
  nonRepeatEnabled: boolean;
  onToggleNonRepeat: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  students,
  eligibleStudents,
  classrooms,
  activeClassId,
  onSelectClassroom,
  onOpenSettings,
  onAddStudents,
  onClearAll,
  onResetRounds,
  onStartGame,
  nonRepeatEnabled,
  onToggleNonRepeat,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeClass = classrooms.find((c) => c.id === activeClassId) || classrooms[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStudentList: Student[] = [];

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const studentName = extractStudentNameFromFileName(file.name);
      const imageUrl = URL.createObjectURL(file);

      newStudentList.push({
        id: `uploaded-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        name: studentName,
        imageUrl,
        hasBeenCalled: false,
      });
    });

    if (newStudentList.length > 0) {
      onAddStudents(newStudentList);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-xl px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark + Class Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Target">🎯</span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-['Outfit'] hidden md:block">
              GỌI HỌC SINH NGẪU NHIÊN
            </h1>
          </div>

          {/* Quick Class Selector Dropdown */}
          <div className="relative flex items-center">
            <select
              value={activeClassId}
              onChange={(e) => onSelectClassroom(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer transition-colors shadow-sm"
              title="Chọn lớp học"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white font-medium">
                  {c.name} ({c.students.length} em)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-blue-300 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Zone 2: Navigation & Status Options (Single-Line, Anti-Slop) */}
        <div className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
          {/* Toggle Non-repeat */}
          <button
            onClick={onToggleNonRepeat}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              nonRepeatEnabled
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {nonRepeatEnabled ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <SquareIcon className="w-4 h-4" />
            )}
            <span className="font-semibold select-none">Không gọi trùng</span>
          </button>

          {/* Reset rounds */}
          {nonRepeatEnabled && (
            <button
              onClick={onResetRounds}
              className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Bắt đầu vòng mới: xóa lịch sử các bạn đã gọi"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chơi lại</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-semibold transition-all cursor-pointer"
            title="Mở bảng cài đặt, danh sách tên, câu hỏi"
          >
            <span role="img" aria-label="Sunflower">🌻</span>
            <span>Cài Đặt</span>
          </button>
        </div>

        {/* Zone 3: Primary Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hidden File Input for Multiple Uploads */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white border border-white/15 text-xs sm:text-sm font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
            title="Tải lên nhiều ảnh học sinh (tên tự động lấy từ tên file)"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">📁 Tải ảnh</span>
            <span className="sm:hidden">Ảnh</span>
          </button>

          {/* Mobile Cài Đặt button */}
          <button
            onClick={onOpenSettings}
            className="lg:hidden flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer"
            title="Cài đặt"
          >
            <span>🌻</span>
            <span className="hidden xs:inline">Cài đặt</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F11)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Big START Button */}
          <button
            onClick={onStartGame}
            disabled={students.length === 0}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
              students.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>▶️ BẮT ĐẦU</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Sub-bar */}
      <div className="lg:hidden flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 text-xs">
        <button
          onClick={onToggleNonRepeat}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
            nonRepeatEnabled ? 'text-blue-300 font-semibold' : 'text-slate-400'
          }`}
        >
          {nonRepeatEnabled ? (
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <SquareIcon className="w-3.5 h-3.5" />
          )}
          <span>Không gọi trùng</span>
        </button>

        <div className="flex items-center gap-3">
          {nonRepeatEnabled && (
            <button
              onClick={onResetRounds}
              className="flex items-center gap-1 text-cyan-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
          )}

          <span className="text-slate-400">
            {students.length} học sinh
          </span>
        </div>
      </div>
    </header>
  );
};

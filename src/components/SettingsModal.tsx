import React, { useState, useRef, useEffect } from 'react';
import { Classroom, Student, QuestionItem } from '../types';
import { soundManager } from '../utils/audio';
import { createStudentAvatarSvg } from '../utils/sampleData';
import {
  X,
  Upload,
  RotateCcw,
  Music,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Edit2,
  Volume2,
  VolumeX,
  FileText,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  activeClassId: string;
  onSelectClassroom: (classId: string) => void;
  onCreateClassroom: (name: string) => void;
  onRenameClassroom: (classId: string, newName: string) => void;
  onDeleteClassroom: (classId: string) => void;
  onUpdateStudentsInClass: (classId: string, students: Student[]) => void;
  onUpdateQuestionsInClass: (classId: string, questions: QuestionItem[]) => void;
  customBackground: string | null;
  onSetCustomBackground: (bgUrl: string | null) => void;
  bgmEnabled: boolean;
  onToggleBgm: (enabled: boolean) => void;
  onResetRounds: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  activeClassId,
  onSelectClassroom,
  onCreateClassroom,
  onRenameClassroom,
  onDeleteClassroom,
  onUpdateStudentsInClass,
  onUpdateQuestionsInClass,
  customBackground,
  onSetCustomBackground,
  bgmEnabled,
  onToggleBgm,
  onResetRounds,
}) => {
  const [activeTab, setActiveTab] = useState<'CHUNG' | 'CAU_HOI'>('CHUNG');

  // Active classroom data
  const currentClass = classrooms.find((c) => c.id === activeClassId) || classrooms[0];

  // Textarea values
  const [namesText, setNamesText] = useState<string>('');
  const [questionsText, setQuestionsText] = useState<string>('');

  // Class creation/renaming state
  const [isCreatingClass, setIsCreatingClass] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [isRenamingClass, setIsRenamingClass] = useState<boolean>(false);
  const [renameClassName, setRenameClassName] = useState<string>('');

  // File input refs
  const textFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Success notifications
  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync textarea with active class students
  useEffect(() => {
    if (currentClass) {
      setNamesText(currentClass.students.map((s) => s.name).join('\n'));
      setQuestionsText((currentClass.questions || []).map((q) => q.text).join('\n'));
      setRenameClassName(currentClass.name);
    }
  }, [currentClass]);

  if (!isOpen || !currentClass) return null;

  // Handle parse names from text area and update
  const handleUpdateNamesFromText = () => {
    const rawLines = namesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) {
      alert('Vui lòng nhập ít nhất một tên học sinh!');
      return;
    }

    const gradients = [
      ['#3b82f6', '#1d4ed8'],
      ['#ec4899', '#be185d'],
      ['#10b981', '#047857'],
      ['#8b5cf6', '#6d28d9'],
      ['#f59e0b', '#b45309'],
      ['#06b6d4', '#0e7490'],
      ['#6366f1', '#4338ca'],
      ['#f43f5e', '#be123c'],
      ['#14b8a6', '#0f766e'],
      ['#eab308', '#a16207'],
    ];

    const accessories: Array<'glasses' | 'cap' | 'tie' | 'smile' | 'star'> = [
      'glasses',
      'smile',
      'star',
      'smile',
      'glasses',
    ];

    // Maintain existing images if name matches
    const updatedStudents: Student[] = rawLines.map((name, index) => {
      const existing = currentClass.students.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return { ...existing, name };
      }

      const grad = gradients[index % gradients.length];
      const acc = accessories[index % accessories.length];
      const avatarSvg = createStudentAvatarSvg(name, grad[0], grad[1], acc);

      return {
        id: `student-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        imageUrl: avatarSvg,
        hasBeenCalled: false,
      };
    });

    onUpdateStudentsInClass(currentClass.id, updatedStudents);
    showNotify(`Đã cập nhật danh sách ${updatedStudents.length} học sinh thành công!`);
  };

  // Handle uploading text/csv/excel text file
  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // Extract lines, handle CSV / TSV or plain text
      const lines = content
        .split(/[\r\n]+/)
        .map((line) => {
          // If CSV, split by comma or semicolon or tab, take first non-empty meaningful column
          const parts = line.split(/[,;\t]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
          // Filter out header words if detected
          const candidates = parts.filter(
            (p) =>
              p.length > 0 &&
              !/^(stt|họ và tên|tên|ho va ten|name|id|no)$/i.test(p) &&
              !/^\d+$/.test(p)
          );
          return candidates[0] || '';
        })
        .filter((name) => name.length > 0);

      if (lines.length > 0) {
        setNamesText(lines.join('\n'));
        showNotify(`Đã tải file thành công: nhận diện ${lines.length} học sinh! Bấm "Cập nhật" để lưu.`);
      } else {
        alert('Không tìm thấy danh sách tên hợp lệ trong file!');
      }
    };

    reader.readAsText(file);
    if (textFileInputRef.current) textFileInputRef.current.value = '';
  };

  // Handle background image upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onSetCustomBackground(result);
        showNotify('Đã áp dụng ảnh nền mới!');
      }
    };
    reader.readAsDataURL(file);
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  // Handle custom audio file upload for BGM
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;

    const audioUrl = URL.createObjectURL(file);
    soundManager.setCustomAudioFile(audioUrl);
    onToggleBgm(true);
    showNotify('Đã nạp file nhạc nền riêng và đang phát!');
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  // Handle save questions
  const handleUpdateQuestions = () => {
    const rawLines = questionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const questions: QuestionItem[] = rawLines.map((text, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      text,
    }));

    onUpdateQuestionsInClass(currentClass.id, questions);
    showNotify(`Đã lưu ${questions.length} câu hỏi vào ngân hàng câu hỏi!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-white/20 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/70 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="Sunflower">🌻</span>
            <h2 className="text-xl font-black text-white font-['Outfit'] tracking-wide">
              Cài Đặt
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons: [Chung] | [Câu Hỏi] */}
        <div className="flex p-2 bg-slate-950/40 border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('CHUNG')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'CHUNG'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chung
          </button>
          <button
            onClick={() => setActiveTab('CAU_HOI')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'CAU_HOI'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Câu Hỏi
          </button>
        </div>

        {/* Success toast notification */}
        {notification && (
          <div className="mx-6 mt-3 py-2 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center animate-in fade-in duration-200">
            {notification}
          </div>
        )}

        {/* Modal Body with smooth scrolling */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'CHUNG' ? (
            <>
              {/* SECTION: Chọn Lớp Học (Classroom Selection) */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4" />
                    <span>Chọn lớp học:</span>
                  </label>
                  <button
                    onClick={() => setIsCreatingClass(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm lớp</span>
                  </button>
                </div>

                {isCreatingClass ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="Nhập tên lớp (VD: Lớp 10A1)..."
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      onClick={() => {
                        if (newClassName.trim()) {
                          onCreateClassroom(newClassName.trim());
                          setNewClassName('');
                          setIsCreatingClass(false);
                          showNotify('Đã tạo lớp mới!');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsCreatingClass(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={activeClassId}
                      onChange={(e) => onSelectClassroom(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name} ({c.students.length} học sinh)
                        </option>
                      ))}
                    </select>

                    {/* Rename current class */}
                    <button
                      onClick={() => setIsRenamingClass(!isRenamingClass)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Đổi tên lớp"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete current class (if more than 1 class) */}
                    {classrooms.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Thầy cô có chắc chắn muốn xóa lớp "${currentClass.name}"?`)) {
                            onDeleteClassroom(currentClass.id);
                            showNotify('Đã xóa lớp thành công!');
                          }
                        }}
                        className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                        title="Xóa lớp hiện tại"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {isRenamingClass && (
                  <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={renameClassName}
                      onChange={(e) => setRenameClassName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                    <button
                      onClick={() => {
                        if (renameClassName.trim()) {
                          onRenameClassroom(currentClass.id, renameClassName.trim());
                          setIsRenamingClass(false);
                          showNotify('Đã đổi tên lớp thành công!');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Đổi tên
                    </button>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Exactly like screenshot) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 📁 Tải File Tên (XLSX, Word, CSV, TXT) */}
                <input
                  type="file"
                  ref={textFileInputRef}
                  onChange={handleTextFileUpload}
                  accept=".txt,.csv,.tsv,.xlsx,.xls,.docx,.doc"
                  className="hidden"
                />
                <button
                  onClick={() => textFileInputRef.current?.click()}
                  className="sm:col-span-3 flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label="Folder">📁</span>
                    <span>Tải File Tên</span>
                  </div>
                  <span className="text-[11px] font-normal text-blue-100/80 mt-0.5">
                    XLSX, Word, CSV, TXT
                  </span>
                </button>

                {/* 🔄 Reset */}
                <button
                  onClick={() => {
                    if (window.confirm('Thầy cô muốn xóa toàn bộ danh sách tên của lớp này để nhập lại?')) {
                      setNamesText('');
                      onUpdateStudentsInClass(currentClass.id, []);
                      showNotify('Đã đặt lại danh sách tên!');
                    }
                  }}
                  className="sm:col-span-1 flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  title="Đặt lại danh sách"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              {/* 🎵 Nhạc Nền + Mute Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={audioFileInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  onClick={() => onToggleBgm(!bgmEnabled)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    bgmEnabled
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span role="img" aria-label="Music">🎵</span>
                  <span>Nhạc Nền: {bgmEnabled ? 'Đang bật' : 'Đang tắt'}</span>
                </button>

                {/* Upload own audio file button */}
                <button
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Tải bài hát / MP3 riêng từ máy tính"
                >
                  <Upload className="w-5 h-5" />
                </button>

                <button
                  onClick={() => onToggleBgm(!bgmEnabled)}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title={bgmEnabled ? 'Tắt nhạc' : 'Bật nhạc'}
                >
                  {bgmEnabled ? (
                    <Volume2 className="w-5 h-5 text-purple-400" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* 🖼️ Tải Background + Reset Background Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={bgFileInputRef}
                  onChange={handleBgUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span role="img" aria-label="Picture">🖼️</span>
                  <span>Tải Background</span>
                </button>

                <button
                  onClick={() => {
                    onSetCustomBackground(null);
                    showNotify('Đã trở về hình nền Bokeh mặc định!');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
                  title="Xóa hình nền tùy chỉnh, dùng nền mặc định"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 📝 Danh sách tên: TEXTAREA BOX (Exactly like screenshot) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span role="img" aria-label="Writing">📝</span>
                    <span>Danh sách tên:</span>
                  </div>
                  <span className="text-slate-400 font-normal">
                    {namesText.split('\n').filter((t) => t.trim().length > 0).length} học sinh
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={namesText}
                  onChange={(e) => setNamesText(e.target.value)}
                  placeholder={`Nguyễn Văn A\nTrần Thị B...`}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/15 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y leading-relaxed"
                />

                {/* ✅ Cập nhật Button */}
                <button
                  onClick={handleUpdateNamesFromText}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Cập nhật</span>
                </button>
              </div>
            </>
          ) : (
            /* TAB: CÂU HỎI (QUESTION BANK) */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Ngân hàng câu hỏi cho {currentClass.name}</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {questionsText.split('\n').filter((t) => t.trim().length > 0).length} câu hỏi
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhập hoặc dán danh sách câu hỏi kiểm tra bài cũ/trả lời nhanh (mỗi câu một dòng). Khi quay trúng học sinh, thầy cô có thể bấm nút hiện ngẫu nhiên câu hỏi.
                </p>

                <textarea
                  rows={8}
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  placeholder={`Câu 1: Nêu định nghĩa về từ đồng âm?\nCâu 2: Công thức tính diện tích hình tròn là gì?\nCâu 3: Ai là người phát minh ra bóng đèn sợi đốt?`}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/15 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y leading-relaxed"
                />

                <button
                  onClick={handleUpdateQuestions}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Lưu danh sách câu hỏi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

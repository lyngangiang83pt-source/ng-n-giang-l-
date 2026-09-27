import React from 'react';
import { Student } from '../types';
import { Check, Trash2, UserPlus, Sparkles } from 'lucide-react';

interface StudentGridProps {
  students: Student[];
  onRemoveStudent: (id: string) => void;
  onToggleCalled: (id: string) => void;
  onAddSampleStudents: () => void;
  onOpenUpload: () => void;
  nonRepeatEnabled: boolean;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  onRemoveStudent,
  onToggleCalled,
  onAddSampleStudents,
  onOpenUpload,
  nonRepeatEnabled,
}) => {
  const calledCount = students.filter((s) => s.hasBeenCalled).length;
  const remainingCount = students.length - calledCount;

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 backdrop-blur-md max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
          <UserPlus className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Chưa có danh sách học sinh</h3>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          Thầy cô có thể tải lên nhiều ảnh học sinh cùng lúc (tên tự động lấy từ tên file) hoặc sử dụng danh sách mẫu để trải nghiệm ngay.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tải ảnh từ máy tính</span>
          </button>
          <button
            onClick={onAddSampleStudents}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-sm shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Nạp danh sách lớp mẫu (16 em)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Subheader Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 mb-4 text-xs font-medium text-slate-400 border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          <span>Tổng số: <strong className="text-white font-semibold">{students.length}</strong> học sinh</span>
          {nonRepeatEnabled && (
            <>
              <span className="text-slate-600">|</span>
              <span>Đã gọi: <strong className="text-emerald-400 font-semibold">{calledCount}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Còn lại: <strong className="text-cyan-400 font-semibold">{remainingCount}</strong></span>
            </>
          )}
        </div>
        <div className="text-slate-400 text-xs italic">
          Bấm vào học sinh để đánh dấu Đã gọi / Chưa gọi
        </div>
      </div>

      {/* Grid of Student Circular Avatars */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 sm:gap-5 p-2">
        {students.map((student) => {
          const isCalled = nonRepeatEnabled && student.hasBeenCalled;

          return (
            <div
              key={student.id}
              onClick={() => onToggleCalled(student.id)}
              className="group relative flex flex-col items-center cursor-pointer transition-all duration-200"
              title={`${student.name}${isCalled ? ' (Đã được gọi)' : ''}`}
            >
              {/* Avatar Circle Container */}
              <div
                className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden transition-all duration-300 transform group-hover:scale-105 ${
                  isCalled
                    ? 'grayscale opacity-40 ring-2 ring-emerald-500/40 bg-slate-900'
                    : 'ring-3 ring-white shadow-xl shadow-black/50 group-hover:ring-cyan-300 group-hover:shadow-cyan-500/30'
                }`}
              >
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="lazy"
                />

                {/* Checked Badge for Non-repeat Called Students */}
                {isCalled && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white transform scale-110">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Student Name */}
              <div className="mt-2 text-center w-full px-1">
                <p
                  className={`text-xs sm:text-sm font-semibold truncate transition-colors leading-tight ${
                    isCalled ? 'text-slate-400 line-through decoration-slate-400/60' : 'text-slate-100 group-hover:text-cyan-300'
                  }`}
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)',
                  }}
                >
                  {student.name}
                </p>
              </div>

              {/* Hover Quick Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveStudent(student.id);
                }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-md cursor-pointer z-10"
                title={`Xóa học sinh ${student.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

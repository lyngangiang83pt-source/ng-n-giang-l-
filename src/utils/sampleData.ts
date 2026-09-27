import { Student } from '../types';

/**
 * Creates high quality, lightweight SVG avatar data URLs for students.
 * 100% offline, zero network requests, instant rendering.
 */
export function createStudentAvatarSvg(name: string, bgGradientStart: string, bgGradientEnd: string, accessory: 'glasses' | 'cap' | 'tie' | 'smile' | 'star'): string {
  const initials = name.split(' ').slice(-2).map(n => n[0]).join('');
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradientStart}"/>
          <stop offset="100%" stop-color="${bgGradientEnd}"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background Circle -->
      <circle cx="100" cy="100" r="96" fill="url(#bg)"/>
      
      <!-- Subtle inner glowing ring -->
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      
      <!-- Stylized Avatar Character -->
      <g filter="url(#softShadow)">
        <!-- Body / Shoulders -->
        <path d="M40 186 C40 145, 70 135, 100 135 C130 135, 160 145, 160 186 Z" fill="#ffffff" opacity="0.95"/>
        
        <!-- Collar / Neck -->
        <path d="M85 135 L100 152 L115 135 Z" fill="#3b82f6" opacity="0.8"/>
        
        <!-- Head -->
        <circle cx="100" cy="88" r="42" fill="#fed7aa"/>
        
        <!-- Hair style -->
        <path d="M58 84 C58 55, 75 44, 100 44 C125 44, 142 55, 142 84 C132 74, 115 72, 100 75 C85 72, 68 74, 58 84 Z" fill="#1e293b"/>
        
        <!-- Eyes -->
        <circle cx="86" cy="88" r="4.5" fill="#1e293b"/>
        <circle cx="114" cy="88" r="4.5" fill="#1e293b"/>
        <circle cx="87.5" cy="86.5" r="1.5" fill="#ffffff"/>
        <circle cx="115.5" cy="86.5" r="1.5" fill="#ffffff"/>
        
        <!-- Cheeks -->
        <circle cx="78" cy="98" r="5.5" fill="#f43f5e" opacity="0.35"/>
        <circle cx="122" cy="98" r="5.5" fill="#f43f5e" opacity="0.35"/>
        
        <!-- Smile -->
        <path d="M92 103 Q100 112 108 103" fill="none" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
        
        ${accessory === 'glasses' ? `
          <!-- Glasses -->
          <circle cx="86" cy="88" r="13" fill="none" stroke="#0f172a" stroke-width="3"/>
          <circle cx="114" cy="88" r="13" fill="none" stroke="#0f172a" stroke-width="3"/>
          <line x1="99" y1="88" x2="101" y2="88" stroke="#0f172a" stroke-width="3"/>
          <line x1="73" y1="86" x2="64" y2="83" stroke="#0f172a" stroke-width="2.5"/>
          <line x1="127" y1="86" x2="136" y2="83" stroke="#0f172a" stroke-width="2.5"/>
        ` : ''}
        
        ${accessory === 'star' ? `
          <!-- Hair clip star -->
          <polygon points="126,62 129,68 135,69 130,73 132,79 126,76 120,79 122,73 117,69 123,68" fill="#fbbf24"/>
        ` : ''}
      </g>
      
      <!-- Initials Badge at Bottom Right -->
      <g transform="translate(132, 132)">
        <circle cx="18" cy="18" r="18" fill="rgba(15, 23, 42, 0.75)" stroke="#ffffff" stroke-width="2"/>
        <text x="18" y="24" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="700" font-size="12" fill="#ffffff">${initials}</text>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_STUDENTS: Student[] = [
  {
    id: 'sample-1',
    name: 'Nguyễn Văn An',
    imageUrl: createStudentAvatarSvg('Nguyễn Văn An', '#3b82f6', '#1d4ed8', 'glasses'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-2',
    name: 'Trần Thị Mai',
    imageUrl: createStudentAvatarSvg('Trần Thị Mai', '#ec4899', '#be185d', 'star'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-3',
    name: 'Lê Hoàng Long',
    imageUrl: createStudentAvatarSvg('Lê Hoàng Long', '#10b981', '#047857', 'smile'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-4',
    name: 'Phạm Minh Thư',
    imageUrl: createStudentAvatarSvg('Phạm Minh Thư', '#8b5cf6', '#6d28d9', 'star'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-5',
    name: 'Đỗ Gia Huy',
    imageUrl: createStudentAvatarSvg('Đỗ Gia Huy', '#f59e0b', '#b45309', 'glasses'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-6',
    name: 'Vũ Phương Linh',
    imageUrl: createStudentAvatarSvg('Vũ Phương Linh', '#06b6d4', '#0e7490', 'smile'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-7',
    name: 'Bùi Quốc Anh',
    imageUrl: createStudentAvatarSvg('Bùi Quốc Anh', '#6366f1', '#4338ca', 'glasses'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-8',
    name: 'Hoàng Thảo My',
    imageUrl: createStudentAvatarSvg('Hoàng Thảo My', '#f43f5e', '#be123c', 'star'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-9',
    name: 'Ngô Bảo Ngọc',
    imageUrl: createStudentAvatarSvg('Ngô Bảo Ngọc', '#14b8a6', '#0f766e', 'smile'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-10',
    name: 'Đinh Tuấn Kiệt',
    imageUrl: createStudentAvatarSvg('Đinh Tuấn Kiệt', '#eab308', '#a16207', 'glasses'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-11',
    name: 'Dương Thu Trang',
    imageUrl: createStudentAvatarSvg('Dương Thu Trang', '#a855f7', '#7e22ce', 'star'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-12',
    name: 'Phan Đức Trọng',
    imageUrl: createStudentAvatarSvg('Phan Đức Trọng', '#0284c7', '#0369a1', 'smile'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-13',
    name: 'Lý Khánh Vân',
    imageUrl: createStudentAvatarSvg('Lý Khánh Vân', '#fb7185', '#e11d48', 'star'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-14',
    name: 'Hồ Nhật Minh',
    imageUrl: createStudentAvatarSvg('Hồ Nhật Minh', '#22c55e', '#15803d', 'glasses'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-15',
    name: 'Võ Quỳnh Nga',
    imageUrl: createStudentAvatarSvg('Võ Quỳnh Nga', '#c084fc', '#9333ea', 'smile'),
    hasBeenCalled: false,
  },
  {
    id: 'sample-16',
    name: 'Đặng Quang Khải',
    imageUrl: createStudentAvatarSvg('Đặng Quang Khải', '#38bdf8', '#0284c7', 'smile'),
    hasBeenCalled: false,
  },
];

/**
 * Extracts clean Vietnamese student name from an uploaded file name.
 * Examples:
 * - "Nguyễn Văn A.jpg" => "Nguyễn Văn A"
 * - "01_Nguyen_Thi_B.png" => "Nguyen Thi B"
 * - "Tran-Duc-Anh.jpeg" => "Tran Duc Anh"
 */
export function extractStudentNameFromFileName(fileName: string): string {
  // Remove file extension
  let name = fileName.replace(/\.[^/.]+$/, '');
  
  // Replace underscores and multiple hyphens with spaces
  name = name.replace(/[_-]+/g, ' ');
  
  // If there's a leading sequence number like "01. " or "1 - ", remove it
  name = name.replace(/^\s*\d+[\s.-]+/, '');
  
  // Collapse whitespace
  name = name.replace(/\s+/g, ' ').trim();
  
  return name || 'Học sinh';
}

export const DEFAULT_CLASSROOMS = [
  {
    id: 'class-6a',
    name: 'Lớp 6A',
    students: SAMPLE_STUDENTS,
    questions: [
      { id: 'q-1', text: 'Nêu định nghĩa về số nguyên tố và cho 2 ví dụ?' },
      { id: 'q-2', text: 'Công thức tính chu vi và diện tích của hình chữ nhật là gì?' },
      { id: 'q-3', text: 'Thế nào là từ đồng âm? Cho một câu ví dụ minh họa?' },
      { id: 'q-4', text: 'Kể tên 3 cuộc khởi nghĩa lớn trong thời kỳ Bắc thuộc?' },
      { id: 'q-5', text: 'Nêu các thành phần chính cấu tạo nên tế bào sinh vật?' },
    ],
  },
  {
    id: 'class-7b',
    name: 'Lớp 7B',
    students: SAMPLE_STUDENTS.slice(0, 10).map((s, idx) => ({
      ...s,
      id: `class7-${idx}`,
    })),
    questions: [
      { id: 'q-7-1', text: 'Giải thích thế nào là hai góc đối đỉnh và tính chất của chúng?' },
      { id: 'q-7-2', text: 'Nêu tác dụng của biện pháp tu từ điệp ngữ trong câu văn?' },
    ],
  },
  {
    id: 'class-10a1',
    name: 'Lớp 10A1',
    students: SAMPLE_STUDENTS.slice(4, 16).map((s, idx) => ({
      ...s,
      id: `class10-${idx}`,
    })),
    questions: [
      { id: 'q-10-1', text: 'Nêu định luật II Newton và viết công thức liên hệ?' },
      { id: 'q-10-2', text: 'Cấu trúc bậc 1 của phân tử Protein được hình thành như thế nào?' },
    ],
  },
];


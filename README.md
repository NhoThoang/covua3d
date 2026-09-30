# RoyalChess 3D — React + Vite + TypeScript + Tailwind CSS

Dự án game cờ vua 3D phong cách Hoàng gia Thiên thể (Celestial Palace) được viết lại hoàn toàn bằng **React 19 + Vite + TypeScript + Tailwind CSS v4**, tích hợp **Three.js** và trí tuệ nhân tạo **Stockfish 18 WebAssembly (WASM)** chạy 100% Client-side.

---

## 🌟 Điểm nổi bật của phiên bản React

1. **100% Không cần Server Backend (Zero-Backend)**:
   - AI Engine: **Stockfish 18 Lite WebAssembly (WASM)** chạy trực tiếp trong trình duyệt qua Web Worker.
   - Fallback Engine: Thuật toán Minimax / Alpha-Beta thuần JS khi trình duyệt không hỗ trợ WebAssembly.
   - Thẩm định nước đi & luật cờ: Sử dụng thư viện `chess.js`.
   - Âm thanh: Sử dụng Web Audio API cho hiệu ứng âm thanh tức thời và nhạc nền giao hưởng mượt mà.

2. **Đồ họa 3D Three.js & Shader Cao Cấp**:
   - 7 mô hình 3D (.glb): Bàn cờ hoa văn hoàng gia, Vua, Hậu, Xe, Mã kỳ lân, Tượng phép thuật, Tốt.
   - Shaders tùy biến (`luxuryMaterial`): Tái tạo bề mặt ngọc pha lê, thạch anh tím, vàng champagne và hiệu ứng lấp lánh (Jewel Glints).
   - Môi trường cung điện cẩm thạch trắng (Palace Environment) với ánh sáng studio và bóng đổ mềm.

3. **Giao diện Hiện đại theo Chuẩn Thiết Kế Doanh Nghiệp**:
   - Tuân thủ tài liệu kiến trúc `FRONTEND_ARCHITECTURE_GUIDE.md`.
   - Bo góc lớn mượt mà (`rounded-2xl`, `rounded-3xl`), phong cách Glassmorphism mờ ảo.
   - Đồng hồ đếm ngược số điện tử, hiệu ứng cảnh báo khi sắp hết giờ.
   - Quản lý trạng thái ván cờ tập trung bằng **Zustand**.
   - Hiệu ứng ăn quân vỡ mảnh pha lê (Crystal Shatter Particle Effect) và pháo hoa ăn mừng chiến thắng (`canvas-confetti`).

---

## 📁 Cấu trúc thư mục

```text
covuaonline/
├── public/                     # Tài nguyên tĩnh được phục vụ trực tiếp
│   ├── models/                 # Các file 3D (.glb) các quân cờ
│   ├── assets/
│   │   ├── palace/             # Textures tường, cột, sàn cung điện
│   │   ├── audio/              # 13 hiệu ứng âm thanh (.wav)
│   │   └── music/              # 2 bản nhạc nền (.mp3)
│   ├── vendor/stockfish/       # Stockfish 18 Lite WASM & Worker
│   └── favicon.svg             # Favicon vương miện
│
├── src/
│   ├── types/
│   │   └── chess.ts            # Định nghĩa TypeScript toàn bộ dự án
│   ├── services/
│   │   ├── soundService.ts     # Bộ máy âm thanh Web Audio API & crossfade music
│   │   └── stockfishService.ts # Client kết nối Stockfish 18 WASM Web Worker
│   ├── store/
│   │   ├── useGameStore.ts     # Zustand: Bàn cờ, FEN, lượt đi, đồng hồ, lịch sử
│   │   └── useSettingsStore.ts # Zustand: Cài đặt âm lượng, camera, đồ họa
│   ├── features/
│   │   └── board-3d/
│   │       ├── ChessBoard3D.tsx    # Canvas Three.js chính & Raycasting click
│   │       ├── scene/
│   │       │   ├── PalaceScene.ts  # Cung điện, ánh sáng, phản chiếu
│   │       │   ├── BoardMesh.ts    # 64 ô cờ vân sao, khung viền mạ vàng
│   │       │   └── PieceManager.ts # Quản lý nạp model 3D, di chuyển, ăn quân
│   │       ├── materials/
│   │       │   └── piecePalette.ts # Custom shaders cho quân cờ pha lê
│   │       └── effects/
│   │           └── JewelGlints.ts  # Hiệu ứng bụi sao lấp lánh trên bề mặt
│   ├── components/
│   │   ├── hud/
│   │   │   ├── TopNav.tsx          # Thanh công cụ trên cùng
│   │   │   ├── PlayerPanel.tsx     # Thẻ người chơi, quân bị ăn, đồng hồ số
│   │   │   └── MoveHistoryPanel.tsx# Danh sách nước đi, sao chép PGN
│   │   └── modals/
│   │       ├── StartGameModal.tsx  # Chọn chế độ (Bot / 2 người), độ khó, thời gian
│   │       ├── SettingsDrawer.tsx  # Cài đặt âm lượng, camera, đồ họa
│   │       ├── PromotionModal.tsx  # Hộp thoại phong cấp quân Tốt
│   │       ├── ResultModal.tsx     # Bảng vinh danh chiến thắng & pháo hoa
│   │       └── PGNModal.tsx        # Nhập/Xuất ván cờ PGN
│   ├── App.tsx                 # Giao diện chính kết hợp 3D Canvas và HUD
│   ├── main.tsx                # Entry point React 19
│   └── index.css               # Cấu hình Tailwind CSS v4
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Chạy môi trường phát triển (Development):
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:5173`

### 3. Đóng gói triển khai (Production Build):
```bash
npm run build
```
Kết quả đóng gói sẽ nằm trong thư mục `dist/`, có thể deploy lên **Vercel, Cloudflare Pages, Netlify, hoặc GitHub Pages** hoàn toàn miễn phí.

### 4. Chạy thử bản Build (Preview):
```bash
npm run preview
```

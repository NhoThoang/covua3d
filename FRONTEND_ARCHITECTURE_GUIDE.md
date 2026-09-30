# HƯỚNG DẪN KIẾN TRÚC FRONTEND CHUẨN MẪU (REACT + VITE + TS + TAILWIND V4 BLUEPRINT)
> **Dự án tham chiếu:** Web Admin (`React 18/19` + `Vite` + `TypeScript` + `Tailwind CSS v4` + `SweetAlert2` + `TanStack Query` + `Zustand`)  
> **Tác giả:** Antigravity Engineering  
> **Mục đích:** Blueprint hướng dẫn từng bước khởi tạo ứng dụng Frontend doanh nghiệp tốc độ cao, tối ưu tính toán Client-side, xử lý đa múi giờ toàn cầu (UTC+0 Backend), chuẩn hóa Dialog SweetAlert2 (Swal2), giao diện Bo Góc Lớn Mượt Mà (Large Border Radius & Glassmorphism), dễ mở rộng và có thể xem làm được ngay cho dự án mới.

---

## 📐 1. TỔNG QUAN KIẾN TRÚC CLIENT-SIDE (FEATURE-FIRST ARCHITECTURE)

Ứng dụng Frontend được tổ chức theo mô hình **Feature-First Architecture** giúp dự án có thể mở rộng từ 10 lên 100+ màn hình mà không bị rối code hay xung đột giữa các module:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ USER INTERFACE (UI) & PRESENTATION LAYER                                  │
│  - Modern Rounded Aesthetic (Large Border Radius: rounded-2xl / 3xl)      │
│  - Glassmorphism & Soft Shadows (Dynamic Dark Mode, Smooth Transitions)   │
│  - Standardized Swal2 Dialogs (SweetAlert2 - Toast, Confirm, Error Alerts)│
│  - Virtualized Data Tables (TanStack Virtual - Render 10,000+ dòng)       │
└──────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ CLIENT-SIDE CALCULATION & STATE LAYER                                      │
│  - Offload Heavy Computation (useMemo, Web Workers cho CSV/QR processing)  │
│  - Multi-Timezone Converter (Chuyển đổi UTC+0 Backend -> Local Múi giờ)    │
│  - Client State (Zustand) & Server State Cache (TanStack Query)            │
└──────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ SERVICES & NETWORK LAYER                                                  │
│  - Axios Interceptors (Tự động xoay vòng Refresh Token JWT, Retry logic)  │
│  - Type-Safe API Contracts (TypeScript DTO Interfaces)                    │
└──────────────────────────────────────┬────────────────────────────────────┘
```

---

## 📁 2. THƯ MỤC DỰ ÁN MẪU TỐI ƯU MỞ RỘNG (DIRECTORY STRUCTURE)

```
web-admin/
├── src/
│   ├── assets/                 # SVGs, Images, Static Icons
│   ├── components/             # Reusable UI Components dùng chung toàn app
│   │   ├── ui/                 # Atomic UI (Button, Input, Modal, Badge, Dropdown)
│   │   ├── data-table/         # DataTable ảo hóa (Virtual Table, Pagination)
│   │   └── feedback/           # Toast, Skeleton Loaders, Empty States
│   ├── features/               # Các Module Nghiệp vụ độc lập (Feature-First)
│   │   ├── auth/               # Components, hooks, pages liên quan đến Login/Auth
│   │   ├── inventory/          # Quản lý kho, quét mã QR
│   │   ├── production/         # Tiến độ sản xuất MES
│   │   └── reports/            # Báo cáo, tính toán Client-side
│   ├── hooks/                  # Custom Hooks dùng chung toàn app
│   │   ├── useTimezone.ts      # Hook xử lý múi giờ toàn cầu
│   │   ├── useDebounce.ts      # Debounce tìm kiếm giảm tải API
│   │   └── useLocalStorage.ts  # Quản lý LocalStorage type-safe
│   ├── services/               # Quản lý HTTP API
│   │   ├── api.ts              # Axios Client & Interceptors (Auto Auth Header)
│   │   └── endpoints/          # Định nghĩa API calls cho từng module
│   ├── store/                  # Global State Management (Zustand Stores)
│   │   ├── useAuthStore.ts     # Store lưu Token & Thông tin User
│   │   └── useSettingsStore.ts # Store lưu Múi giờ, Theme (Light/Dark)
│   ├── types/                  # TypeScript Types & Interfaces toàn hệ thống
│   │   ├── api.d.ts            # Standard API Response Envelope
│   │   └── models.d.ts         # User, Product, Inventory DTOs
│   ├── utils/                  # Helper Utilities (Pure Functions)
│   │   ├── alert.ts            # Chuẩn hóa Dialog SweetAlert2 (Swal2 - Bo Góc 3XL)
│   │   ├── date.ts             # Chuẩn hóa Múi giờ UTC -> Local
│   │   ├── format.ts           # Định dạng tiền tệ, số, dung lượng
│   │   └── calc.ts             # Thuật toán tính toánClient-side
│   ├── App.tsx                 # Router & Application Shell
│   ├── main.tsx                # React Root & Global Providers
│   └── index.css               # Tailwind CSS v4 Entry & Large Radius Tokens
├── index.html                  # Entry Point HTML
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript Configuration
└── vite.config.ts              # Vite Config (Path Aliases `@/`)
```

---

## 🎨 3. CẤU HÌNH GIAO DIỆN BO GÓC LỚN & THẨM MỸ MƯỢT MÀ (LARGE RADIUS DESIGN SYSTEM)

Để mang lại cảm giác **mượt mà, hiện đại và cao cấp (Ultra-Smooth & Modern Rounded UI)**, ứng dụng áp dụng quy chuẩn bo góc lớn (Large Border Radius) kết hợp hiệu ứng chuyển động mượt `transition-all duration-300`:

### Quy Chuẩn Bo Góc (Border Radius Standards):
- **Card / Modal / Popup / Panel**: Dùng `rounded-3xl` (24px - 32px) tạo khung tổng thể mềm mại.
- **Button / Input / Dropdown / Card Con**: Dùng `rounded-2xl` (16px) hoặc `rounded-xl` (12px).
- **Badge / Pill Tag / Avatar**: Dùng `rounded-full` (9999px) hình viên thuốc mượt mà.

### Cấu hình Theme Tailwind CSS v4 trong `src/index.css`:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;

  /* Overrides Border Radius Tokens lớn hơn cho cảm giác mượt mà */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-3xl: 2rem;      /* 32px */
  --radius-4xl: 2.5rem;    /* 40px */

  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-surface-dark: #0f172a;
  --color-surface-card: #1e293b;
}

/* Panel Glassmorphism Bo Góc Lớn Mượt Mà */
.glass-panel-rounded {
  background: rgba(30, 41, 59, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-3xl);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Micro-interaction Hover Effect */
.smooth-hover {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.smooth-hover:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.25);
}
```

---

## 🍪 4. CHUẨN HÓA DIALOG & TOAST BẰNG SWEETALERT2 (SWAL2 BO GÓC 3XL)

Đóng gói SweetAlert2 trong **`src/utils/alert.ts`** với kiểu bo góc `rounded-3xl` đồng bộ với Design System:

```typescript
// src/utils/alert.ts
import Swal from 'sweetalert2';

const CustomSwal = Swal.mixin({
  background: '#1e293b', // Tailwind slate-800
  color: '#f8fafc',      // Tailwind slate-50
  confirmButtonColor: '#3b82f6', 
  cancelButtonColor: '#64748b',  
  customClass: {
    // Bo góc 3XL mượt mà kết hợp hiệu ứng Glassmorphism & Shadow siêu êm
    popup: '!rounded-3xl border border-slate-700/60 shadow-2xl backdrop-blur-xl p-6',
    title: 'text-2xl font-bold text-white tracking-tight',
    htmlContainer: 'text-slate-300 text-sm mt-2',
    confirmButton: 'px-6 py-3 !rounded-2xl text-sm font-semibold shadow-lg hover:brightness-110 transition-all focus:outline-none',
    cancelButton: 'px-6 py-3 !rounded-2xl text-sm font-semibold shadow-lg hover:bg-slate-700 transition-all focus:outline-none mr-3',
  },
});

export const showToast = (message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  CustomSwal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const showErrorAlert = (title: string, error?: any) => {
  const errorMessage = error?.response?.data?.detail || error?.message || 'Đã xảy ra lỗi không xác định.';
  CustomSwal.fire({
    icon: 'error',
    title,
    text: errorMessage,
    confirmButtonText: 'Đóng',
    confirmButtonColor: '#ef4444',
  });
};

export const confirmAction = async ({
  title,
  text,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDangerous = false,
  onConfirm,
}: {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => Promise<void>;
}) => {
  const result = await CustomSwal.fire({
    icon: isDangerous ? 'warning' : 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: isDangerous ? '#ef4444' : '#3b82f6',
    reverseButtons: true,
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        await onConfirm();
      } catch (err: any) {
        Swal.showValidationMessage(`Lỗi: ${err?.response?.data?.detail || err?.message || 'Thất bại'}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  return result.isConfirmed;
};
```

---

## 🌍 5. CHIẾN LƯỢC XỬ LÝ ĐA MÚI GIỜ TOÀN CẦU (UTC+0 BACKEND STANDARD)

### ❓ Thách thức
Backend quy chuẩn **LUÔN LUÔN** trả về và lưu trữ thời gian ở chuẩn **UTC+0 (ISO 8601)** (Ví dụ: `2026-07-26T04:29:00Z`). Nếu Frontend hiển thị trực tiếp chuỗi này thì người dùng ở Việt Nam (UTC+7), Nhật Bản (UTC+9) hay Mỹ (UTC-5) sẽ nhìn thấy giờ bị lệch.

### ✅ Giải pháp: `Day.js` UTC/Timezone Module & Utility `utils/date.ts`

```typescript
// src/utils/date.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

export const formatUtcToLocal = (
  utcString?: string | null,
  formatPattern: string = 'DD/MM/YYYY HH:mm:ss',
  targetTimezone: string = getBrowserTimezone()
): string => {
  if (!utcString) return '-';
  return dayjs.utc(utcString).tz(targetTimezone).format(formatPattern);
};

export const formatLocalToUtcIso = (localDate: Date | string | null): string | null => {
  if (!localDate) return null;
  return dayjs(localDate).utc().toISOString();
};
```

---

## ⚡ 6. TỐI ƯU TÍNH TOÁN CLIENT-SIDE & GIẢM TẢI BACKEND (CLIENT OFFLOADING)

### 🚀 Kỹ thuật 1: Memoization Với `useMemo` & `useCallback`
```typescript
// src/features/inventory/components/InventoryReport.tsx
import React, { useMemo } from 'react';

interface Item { id: number; category: string; quantity: number; price: number; }

export const InventoryReport: React.FC<{ items: Item[]; selectedCategory: string }> = ({ items, selectedCategory }) => {
  const { filteredItems, totalValue } = useMemo(() => {
    const filtered = selectedCategory === 'ALL' 
      ? items 
      : items.filter(item => item.category === selectedCategory);

    const total = filtered.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return { filteredItems: filtered, totalValue: total };
  }, [items, selectedCategory]);

  return (
    <div className="p-6 glass-panel-rounded text-white">
      <h3 className="text-xl font-bold tracking-tight">Tổng Giá Trị Tồn Kho: {totalValue.toLocaleString()} VNĐ</h3>
      <p className="text-slate-400 mt-1">Số lượng mặt hàng: {filteredItems.length}</p>
    </div>
  );
};
```

---

### 🚀 Kỹ thuật 2: Bảng Ảo Hóa (Virtual Table) Bo Góc 2XL Cho 10,000+ Dòng
```typescript
// src/components/data-table/VirtualTable.tsx
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualTable = ({ data }: { data: any[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto border border-slate-700/60 rounded-2xl bg-slate-900/60">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = data[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center px-6 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
            >
              <span className="w-1/4 font-mono text-blue-400">{item.code}</span>
              <span className="w-1/2 font-medium">{item.name}</span>
              <span className="w-1/4 text-right font-semibold">{item.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## 🔒 7. AXIOS INTERCEPTOR & TỰ ĐỘNG XOAY VÒNG JWT REFRESH TOKEN

```typescript
// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try:
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = res.data.access_token;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      catch (refreshErr) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🛠️ 8. CHECKLIST KHỞI TẠO DỰ ÁN MỚI TRONG 5 PHÚT

```bash
# 1. Khởi tạo dự án Vite + React + TypeScript
npm create vite@latest my-web-app -- --template react-ts
cd my-web-app

# 2. Cài đặt Tailwind CSS v4 mới nhất
npm install tailwindcss @tailwindcss/vite

# 3. Cài đặt SweetAlert2 & các thư viện lõi (Core Stack)
npm install sweetalert2 axios dayjs zustand @tanstack/react-query @tanstack/react-virtual lucide-react

# 4. Cấu hình Path Alias `@/` trong vite.config.ts
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

> 🎉 **Kết luận:** Hướng dẫn này cung cấp bộ khung **Frontend Blueprint Chuẩn Doanh Nghiệp**. Khi làm các ứng dụng web mới, bạn chỉ cần nhìn vào tài liệu này là có thể xây dựng ứng dụng giao diện cực đẹp, tích hợp sẵn bo góc `rounded-3xl` mượt mà, dialog SweetAlert2 sang trọng, chạy mượt trên mọi múi giờ toàn cầu, và tự động tối ưu hóa tài nguyên Client-side!

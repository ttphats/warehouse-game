# 🚛 Container Yard Management System

Hệ thống quản lý bãi container với workflow hoàn chỉnh từ gate-in đến gate-out.

**Phiên bản mới:** 2D Canvas-based với kiến trúc phân lớng sẵn sàng migrate sang database.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-red)

## ⚠️ Lưu ý quan trọng

Dự án hiện tại nằm trong thư mục có khoảng trắng (`New folder`), điều này gây lỗi với esbuild trên Windows.

### Giải pháp:

**Cách 1: Di chuyển dự án (Khuyến nghị)**

```bash
# Di chuyển dự án ra thư mục không có khoảng trắng
cd D:\Projects
mkdir warehouse-game
xcopy "New folder\wms-prj\*" warehouse-game\ /E /I /H
cd warehouse-game
npm install
npm run dev
```

**Cách 2: Cài đặt tại chỗ**

```bash
# Xóa node_modules và thử lại
rd /s /q node_modules
npm cache clean --force
npm install --legacy-peer-deps
npm run dev
```

## 🎯 Tính Năng Mới

### Workflow 8 Bước Hoàn Chỉnh

1. **RECEIVE_TASK** - Nhận nhiệm vụ (Inbound/Outbound)
2. **MOVE_TO_GATE** - Di chuyển đến cổng
3. **GATE_CHECK_IN** - Check-in, scan QR, verify docs
4. **YARD_FOCUS** - Camera zoom yard, auto assign slot
5. **ENTER_YARD** - Vào bãi, đậu vào slot
6. **ENTER_DOOR** - Container đến door
7. **PROCESS_AT_DOOR** - Load/Unload, seal container
8. **GATE_CHECK_OUT** - Check-out, verify seal

### Kiến Trúc Phân Lớp

- ✅ **Models Layer**: Data structures với DTOs
- ✅ **Services Layer**: Business logic (CRUD operations)
- ✅ **UI Components**: React components
- ✅ **Database-Ready**: Sẵn sàng migrate sang PostgreSQL/MySQL

### Quản Lý

- ✅ Container tracking (mã số, loại, trạng thái)
- ✅ Driver management (rating, trips)
- ✅ Yard management (24 slots grid)
- ✅ Gate transactions (check-in/out logging)
- ✅ Priority system (Urgent, High, Medium, Low, Ecom)

### Camera System

- 📹 Overview, Follow Truck, Gate Focus, Yard Focus, Door Focus

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Database migration
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview
- [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Code examples
- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - Progress tracking

## 🎮 Tính năng (Legacy 3D)

- ✅ Môi trường kho 3D với Three.js
- ✅ Xe container điều khiển bằng bàn phím (W/A/S/D hoặc mũi tên)
- ✅ Hệ thống thu thập hàng hóa
- ✅ Nhiệm vụ và điểm số
- ✅ UI quản lý với Ant Design
- ✅ TypeScript cho type safety

## 🎯 Cách chơi

### Điều khiển:

- **W / ↑**: Di chuyển tiến
- **S / ↓**: Di chuyển lùi
- **A / ←**: Rẽ trái
- **D / →**: Rẽ phải
- **Click chuột**: Lấy hàng (khi ở gần thùng hàng)

### Mục tiêu:

1. Điều khiển xe container đến gần các thùng hàng (màu cam)
2. Khi ở gần, thùng hàng sẽ chuyển sang màu xanh
3. Click vào thùng để thu thập
4. Hoàn thành nhiệm vụ để nhận điểm thưởng

## 🛠️ Công nghệ sử dụng

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js** - 3D rendering
- **@react-three/fiber** - React renderer cho Three.js
- **@react-three/drei** - Helpers cho React Three Fiber
- **Ant Design** - UI components
- **Zustand** - State management

## 📁 Cấu trúc dự án

```
src/
├── components/
│   ├── Container.tsx      # Xe container 3D
│   ├── Warehouse.tsx      # Môi trường kho
│   ├── Scene.tsx          # Scene 3D chính
│   └── GameUI.tsx         # Giao diện UI
├── hooks/
│   └── useKeyboardControls.ts  # Hook điều khiển bàn phím
├── store/
│   └── gameStore.ts       # Zustand store
├── types/
│   └── index.ts           # TypeScript types
├── App.tsx                # Component chính
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## 🚀 Phát triển thêm

Một số ý tưởng để mở rộng game:

- [ ] Thêm nhiều loại xe khác nhau
- [ ] Hệ thống level và độ khó
- [ ] Multiplayer mode
- [ ] Vật cản và thử thách
- [ ] Âm thanh và hiệu ứng
- [ ] Lưu tiến trình game
- [ ] Leaderboard
- [ ] Nhiều loại hàng hóa khác nhau
- [ ] Hệ thống thời gian và deadline

## 📝 License

MIT

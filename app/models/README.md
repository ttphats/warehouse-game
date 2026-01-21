# Data Models

Cấu trúc models cho Container Yard Management System. Thiết kế sẵn sàng để migrate sang database.

## 📁 Structure

```
app/
├── models/              # Data models (DTOs, interfaces)
│   ├── Container.model.ts
│   ├── Driver.model.ts
│   ├── Factory.model.ts
│   ├── YardSlot.model.ts
│   ├── GateTransaction.model.ts
│   ├── Job.model.ts
│   ├── Workflow.model.ts
│   └── index.ts
│
├── services/            # Business logic layer
│   ├── ContainerService.ts
│   ├── DriverService.ts
│   ├── YardService.ts
│   ├── GateService.ts
│   ├── WorkflowService.ts
│   └── index.ts
│
└── data/
    └── mockData.json    # Mock data (temporary)
```

## 🔄 Migration Path

### Current (Mock Data)
```typescript
// Service uses in-memory data
class ContainerService {
  private containers = mockData.containers;
  
  async getAll() {
    return Promise.resolve(this.containers);
  }
}
```

### Future (Database)
```typescript
// Replace with Prisma/Drizzle/etc
class ContainerService {
  async getAll() {
    return await db.containers.findMany();
  }
}
```

## 📊 Models Overview

### Container
- Quản lý thông tin container (mã số, loại, trạng thái, hàng hóa)
- Hỗ trợ: 20ft, 40ft, 40ft-HC, Reefer
- Trạng thái: empty, full, damaged

### Driver
- Thông tin tài xế (tên, GPLX, công ty)
- Trạng thái: available, on-duty, off-duty
- Tracking: rating, total trips

### YardSlot
- Vị trí đỗ container trong yard
- Grid layout: Row x Column (e.g., A1, B5)
- Stack position (1-5 tầng)

### GateTransaction
- Lịch sử check-in/check-out
- Document verification
- Seal number tracking

### Workflow
- 8-step process từ gate-in đến gate-out
- Camera focus modes
- ASN tracking
- Inbound/Outbound flow

## 🎯 Workflow Steps

1. **RECEIVE_TASK** - Nhận nhiệm vụ
2. **MOVE_TO_GATE** - Di chuyển đến cổng
3. **GATE_CHECK_IN** - Check-in tại cổng
4. **YARD_FOCUS** - Xem layout yard
5. **ENTER_YARD** - Vào yard
6. **ENTER_DOOR** - Vào door
7. **PROCESS_AT_DOOR** - Xử lý tại door (load/unload)
8. **GATE_CHECK_OUT** - Check-out

## 🚀 Usage

```typescript
import { containerService, driverService, workflowService } from '@/app/services';
import { WorkflowCreateDTO } from '@/app/models';

// Get available drivers
const drivers = await driverService.getAvailable();

// Create workflow
const workflow = await workflowService.create({
  jobId: 'JOB-001',
  driverId: 'DRV-001',
  containerId: 'CONT-001',
  vehicleId: 'TRUCK-001',
  direction: 'inbound',
  asnNumber: 'ASN-12345',
  destination: 'Kho ABC',
  cargoType: 'ecom',
  priority: 'high',
});

// Complete step
await workflowService.completeStep(workflow.id);
```

## 🔮 Future Database Schema

Khi migrate sang database (Prisma example):

```prisma
model Container {
  id        String   @id @default(cuid())
  code      String   @unique
  type      String
  status    String
  owner     String
  weight    Float
  maxWeight Float
  cargo     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  workflows Workflow[]
  yardSlots YardSlot[]
}

model Workflow {
  id                  String   @id @default(cuid())
  asnNumber           String   @unique
  direction           String
  status              String
  currentStep         Int
  containerId         String
  driverId            String
  
  container           Container @relation(fields: [containerId], references: [id])
  driver              Driver    @relation(fields: [driverId], references: [id])
  gateTransactions    GateTransaction[]
}
```

## 📝 Notes

- Tất cả services đều có TODO comments chỉ vị trí cần thay database calls
- DTOs (Data Transfer Objects) đã được định nghĩa sẵn
- Timestamps (createdAt, updatedAt) đã được chuẩn bị
- Validation logic có thể thêm vào services hoặc dùng Zod/Yup


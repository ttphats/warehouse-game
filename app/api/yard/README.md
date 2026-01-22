# Yard Management API - Clean Architecture

## 📁 Cấu trúc thư mục

```
app/api/yard/
├── types.ts         # API types (request/response)
├── client.ts        # Abstract interface & factory
├── mockClient.ts    # Mock implementation (in-memory)
├── httpClient.ts    # Real HTTP implementation
└── README.md        # Documentation này
```

## 🎯 Mục đích

Cấu trúc này được thiết kế để:
- ✅ **Dễ dàng chuyển đổi** giữa mock API và real API
- ✅ **Không cần sửa code component** khi migrate
- ✅ **Type-safe** với TypeScript
- ✅ **Separation of concerns** - tách biệt logic rõ ràng

## 🚀 Cách sử dụng

### 1. Trong Component

```typescript
import { getYardApiClient } from "@/app/api/yard/client";

// Trong component
const apiClient = getYardApiClient();

// Sử dụng API
const trucks = await apiClient.getTrucks();
const slots = await apiClient.getYardSlots({ zoneId: "01" });
const stats = await apiClient.getYardStatistics();

// Check-in truck
const result = await apiClient.checkInTruck({
  truckPlateNo: "ABC-123",
  trailerPlateNo: "TRL-456",
  containerNumber: "CONT-789",
  asnNumber: "ASN-001",
  containerStatus: "full",
});

// Update truck position (for animation)
await apiClient.updateTruckPosition(truckId, {
  position: { x: 100, y: 200 },
  phase: "moving",
});

// Park truck
await apiClient.parkTruck(truckId, { slotId: 5 });

// Update container status
await apiClient.updateContainerStatus("CONT-789", {
  status: "empty",
});

// Check-out truck
await apiClient.checkOutTruck(truckId);
```

### 2. Chuyển đổi giữa Mock và Real API

#### Sử dụng Mock API (mặc định)

Tạo file `.env.local`:
```bash
NEXT_PUBLIC_USE_MOCK_API=true
```

#### Chuyển sang Real API

Cập nhật file `.env.local`:
```bash
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Chỉ cần thay đổi environment variable - KHÔNG CẦN SỬA CODE!**

## 📋 API Endpoints (cho Backend Team)

Backend cần implement các endpoints sau:

### Trucks
- `GET /api/yard/trucks?zone={zoneId}` - Get all trucks
- `POST /api/yard/check-in` - Check-in truck
- `PATCH /api/yard/trucks/:id/position` - Update truck position
- `POST /api/yard/trucks/:id/park` - Park truck in slot
- `DELETE /api/yard/trucks/:id` - Check-out truck

### Slots
- `GET /api/yard/slots?zone={zoneId}` - Get yard slots

### Containers
- `PATCH /api/yard/containers/:containerNumber/status` - Update container status

### Statistics
- `GET /api/yard/statistics` - Get yard statistics

## 📝 Types Reference

Xem file `types.ts` để biết chi tiết về:
- Request types
- Response types
- Query parameters

## 🧪 Testing với Mock Data

```typescript
import { resetMockData, getMockData } from "@/app/api/yard/mockClient";

// Reset data
resetMockData();

// Debug - xem data hiện tại
const data = getMockData();
console.log(data.trucks, data.slots);
```

## 🔄 Migration Checklist

Khi backend sẵn sàng:

- [ ] Backend implement tất cả endpoints theo contract trong `types.ts`
- [ ] Test backend API với Postman/curl
- [ ] Set `NEXT_PUBLIC_USE_MOCK_API=false` trong `.env.local`
- [ ] Set `NEXT_PUBLIC_API_URL` đúng địa chỉ backend
- [ ] Test frontend với real API
- [ ] ✅ Done! Không cần sửa code component!

## 💡 Lợi ích của cấu trúc này

1. **Interface-based design** - Dễ dàng swap implementation
2. **Factory pattern** - Tự động chọn client phù hợp
3. **Singleton pattern** - Chỉ có 1 instance API client
4. **Type safety** - TypeScript đảm bảo type đúng
5. **Zero component changes** - Component không cần sửa khi migrate


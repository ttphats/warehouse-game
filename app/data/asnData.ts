/**
 * Shared ASN (Advanced Shipping Notice) Data
 * Centralized ASN list used across the application
 */

export type TaskType = "inbound" | "outbound";
export type ContainerStatus = "empty" | "full";

export interface ASN {
  asnNumber: string;
  type: TaskType;
  factoryId: number;
  factoryName: string;
  containerNumber: string;
  containerType: "20ft" | "40ft" | "40ft-HC";
  status: ContainerStatus;
  poNumber: string;
  supplier: string;
  expectedItems: number;
  weight: number;
  locationID?: number; // Unified location (yard slot or dock door)
  locationType?: "yard" | "door"; // Type of location
}

/**
 * Pre-defined ASN list (giống nghiệp vụ thật)
 * Đây là danh sách ASN chung cho toàn bộ hệ thống
 */
export const AVAILABLE_ASNS: ASN[] = [
  {
    asnNumber: "ASN-2024-001",
    type: "inbound",
    factoryId: 1,
    factoryName: "Factory A",
    containerNumber: "CONT-ABC-12345",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0156",
    supplier: "Samsung Electronics",
    expectedItems: 500,
    weight: 18500,
  },
  {
    asnNumber: "ASN-2024-002",
    type: "inbound",
    factoryId: 2,
    factoryName: "Factory B",
    containerNumber: "CONT-XYZ-67890",
    containerType: "20ft",
    status: "full",
    poNumber: "PO-2024-0157",
    supplier: "LG Display",
    expectedItems: 250,
    weight: 9200,
  },
  {
    asnNumber: "ASN-2024-003",
    type: "outbound",
    factoryId: 3,
    factoryName: "Warehouse C",
    containerNumber: "CONT-DEF-11111",
    containerType: "40ft-HC",
    status: "empty",
    poNumber: "PO-2024-0158",
    supplier: "Hyundai Motors",
    expectedItems: 0,
    weight: 3500,
  },
  {
    asnNumber: "ASN-2024-004",
    type: "inbound",
    factoryId: 4,
    factoryName: "Factory D",
    containerNumber: "CONT-GHI-22222",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0159",
    supplier: "SK Hynix",
    expectedItems: 800,
    weight: 21000,
  },
  {
    asnNumber: "ASN-2024-005",
    type: "outbound",
    factoryId: 5,
    factoryName: "Warehouse E",
    containerNumber: "CONT-JKL-33333",
    containerType: "20ft",
    status: "empty",
    poNumber: "PO-2024-0160",
    supplier: "Posco Steel",
    expectedItems: 0,
    weight: 2800,
  },
  {
    asnNumber: "ASN-2024-006",
    type: "inbound",
    factoryId: 6,
    factoryName: "Distribution Center F",
    containerNumber: "CONT-MNO-44444",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0161",
    supplier: "Coupang Logistics",
    expectedItems: 1200,
    weight: 19800,
  },
  {
    asnNumber: "ASN-2024-007",
    type: "inbound",
    factoryId: 1,
    factoryName: "Factory A",
    containerNumber: "CONT-PQR-55555",
    containerType: "40ft-HC",
    status: "full",
    poNumber: "PO-2024-0162",
    supplier: "Naver Cloud",
    expectedItems: 600,
    weight: 20500,
  },
  {
    asnNumber: "ASN-2024-008",
    type: "outbound",
    factoryId: 2,
    factoryName: "Factory B",
    containerNumber: "CONT-STU-66666",
    containerType: "20ft",
    status: "empty",
    poNumber: "PO-2024-0163",
    supplier: "Kakao Corp",
    expectedItems: 0,
    weight: 2500,
  },
  {
    asnNumber: "ASN-2024-009",
    type: "inbound",
    factoryId: 3,
    factoryName: "Warehouse C",
    containerNumber: "CONT-VWX-77777",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0164",
    supplier: "Lotte Logistics",
    expectedItems: 900,
    weight: 22000,
  },
  {
    asnNumber: "ASN-2024-010",
    type: "inbound",
    factoryId: 4,
    factoryName: "Factory D",
    containerNumber: "CONT-YZA-88888",
    containerType: "40ft-HC",
    status: "full",
    poNumber: "PO-2024-0165",
    supplier: "GS Retail",
    expectedItems: 750,
    weight: 19500,
  },
];

/**
 * Get available ASNs (not yet assigned to containers)
 */
export function getAvailableASNs(usedAsnNumbers: string[]): ASN[] {
  return AVAILABLE_ASNS.filter(asn => !usedAsnNumbers.includes(asn.asnNumber));
}

/**
 * Get ASN by number
 */
export function getASNByNumber(asnNumber: string): ASN | null {
  return AVAILABLE_ASNS.find(asn => asn.asnNumber === asnNumber) || null;
}


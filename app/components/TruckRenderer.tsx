/**
 * TruckRenderer - Reusable truck drawing component
 * Supports dynamic container status colors
 */

export type ContainerStatus = "empty" | "full" | "loading" | "unloading";

export interface TruckRenderOptions {
  x: number;
  y: number;
  containerNumber?: string;
  trailerId?: string;
  containerStatus?: ContainerStatus;
  isParked?: boolean;
  rotation?: number; // Rotation angle in radians (0 = up, Math.PI/2 = right)
  isDockDoor?: boolean; // True when parking at dock door (cab faces down)
}

/**
 * Get container color based on status
 */
export const getContainerColor = (status: ContainerStatus): string => {
  switch (status) {
    case "full":
      return "#66BB6A"; // Green
    case "empty":
      return "#FFA726"; // Orange
    case "loading":
      return "#42A5F5"; // Blue
    case "unloading":
      return "#AB47BC"; // Purple
    default:
      return "#66BB6A"; // Default green
  }
};

/**
 * Draw a truck with container on canvas
 * @param ctx - Canvas rendering context
 * @param options - Truck rendering options
 */
export const drawTruck = (
  ctx: CanvasRenderingContext2D,
  options: TruckRenderOptions,
): void => {
  const {
    x,
    y,
    containerNumber,
    trailerId,
    containerStatus = "full",
    isParked = false,
    rotation = 0,
    isDockDoor = false,
  } = options;

  ctx.save();

  // Apply rotation if specified
  if (rotation !== 0) {
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.translate(-x, -y);
  }

  // Additional rotation for dock doors (cab faces down)
  if (isDockDoor && isParked) {
    ctx.translate(x, y);
    ctx.rotate(Math.PI);
    ctx.translate(-x, -y);
  }

  const truckWidth = 25;
  const truckHeight = 60;

  // NO shadow - clean look

  // === CAB (Đầu xe màu xanh dương - phía trước khi chạy) ===
  const cabW = truckWidth;
  const cabH = 20;
  const cabX = x - cabW / 2;
  const cabY = y - truckHeight / 2;

  // Cab body
  ctx.fillStyle = "#2196F3"; // Blue cab
  ctx.fillRect(cabX, cabY, cabW, cabH);
  ctx.strokeStyle = "#1976D2";
  ctx.lineWidth = 2;
  ctx.strokeRect(cabX, cabY, cabW, cabH);

  // Windshield
  ctx.fillStyle = "#64B5F6";
  ctx.fillRect(cabX + 3, cabY + 3, cabW - 6, 8);

  // === CONTAINER (Thùng - phía sau cab) ===
  const containerW = truckWidth;
  const containerH = 40;
  const containerX = x - containerW / 2;
  const containerY = cabY + cabH;

  // Container body - COLOR BASED ON STATUS
  const containerColor = getContainerColor(containerStatus);
  ctx.fillStyle = containerColor;
  ctx.fillRect(containerX, containerY, containerW, containerH);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(containerX, containerY, containerW, containerH);

  // Container ridges (horizontal lines for texture)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const lineY = containerY + (containerH / 6) * i;
    ctx.beginPath();
    ctx.moveTo(containerX, lineY);
    ctx.lineTo(containerX + containerW, lineY);
    ctx.stroke();
  }

  // Trailer ID on container (if provided)
  if (trailerId) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px 'Inter', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add dark background for better visibility
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillText(trailerId, x, containerY + containerH / 2);
    ctx.shadowBlur = 0;
  }

  // Wheels (2 small circles at bottom of container)
  ctx.fillStyle = "#424242";
  ctx.beginPath();
  ctx.arc(containerX + 5, containerY + containerH, 3, 0, Math.PI * 2);
  ctx.arc(
    containerX + containerW - 5,
    containerY + containerH,
    3,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.restore();
};

/**
 * Draw container in slot (without truck cab)
 * @param ctx - Canvas rendering context
 * @param x - X position
 * @param y - Y position
 * @param width - Container width
 * @param height - Container height
 * @param status - Container status
 */
export const drawContainer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  status: ContainerStatus,
): void => {
  const containerColor = getContainerColor(status);

  // Container body
  ctx.fillStyle = containerColor;
  ctx.fillRect(x, y, width, height);

  // Container border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Container ridges (vertical lines for texture)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const lineX = x + (width / 8) * i;
    ctx.beginPath();
    ctx.moveTo(lineX, y);
    ctx.lineTo(lineX, y + height);
    ctx.stroke();
  }
};

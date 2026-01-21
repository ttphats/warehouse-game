export interface DriverModel {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  company: string;
  status: 'available' | 'on-duty' | 'off-duty';
  currentVehicle: string | null;
  rating: number; // 0-5 stars
  totalTrips: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverCreateDTO {
  name: string;
  licenseNumber: string;
  phone: string;
  company: string;
}

export interface DriverUpdateDTO {
  status?: 'available' | 'on-duty' | 'off-duty';
  currentVehicle?: string | null;
  rating?: number;
  totalTrips?: number;
}


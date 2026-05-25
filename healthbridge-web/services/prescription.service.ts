import { api } from "@/lib/axios";
import type { Prescription, ApiResponse, PaginatedResponse } from "@/types";

export interface CreatePrescriptionDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
  }>;
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
}

export const prescriptionService = {
  async getAll(page = 1, limit = 10): Promise<PaginatedResponse<Prescription>> {
    const res = await api.get(`/api/prescriptions?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Prescription>> {
    const res = await api.get(`/api/prescriptions/${id}`);
    return res.data;
  },

  async getByPatient(patientId: string): Promise<ApiResponse<Prescription[]>> {
    const res = await api.get(`/api/prescriptions/patient/${patientId}`);
    return res.data;
  },

  async create(data: CreatePrescriptionDto): Promise<ApiResponse<Prescription>> {
    const res = await api.post("/api/prescriptions", data);
    return res.data;
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<Prescription>> {
    const res = await api.patch(`/api/prescriptions/${id}/status`, { status });
    return res.data;
  },

  async requestRefill(id: string): Promise<ApiResponse<Prescription>> {
    const res = await api.post(`/api/prescriptions/${id}/refill`);
    return res.data;
  },
};

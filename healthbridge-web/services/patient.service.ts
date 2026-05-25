import { api } from "@/lib/axios";
import type { Patient, MedicalRecord, PaginatedResponse, ApiResponse } from "@/types";

export const patientService = {
  async getAll(page = 1, limit = 10): Promise<PaginatedResponse<Patient>> {
    const res = await api.get(`/api/patients?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Patient & { medicalRecords?: MedicalRecord[] }>> {
    const res = await api.get(`/api/patients/${id}`);
    return res.data;
  },

  async create(data: Partial<Patient>): Promise<ApiResponse<Patient>> {
    const res = await api.post("/api/patients", data);
    return res.data;
  },

  async update(id: string, data: Partial<Patient>): Promise<ApiResponse<Patient>> {
    const res = await api.put(`/api/patients/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/patients/${id}`);
  },

  async getMedicalRecords(id: string): Promise<ApiResponse<MedicalRecord[]>> {
    const res = await api.get(`/api/patients/${id}/records`);
    return res.data;
  },

  async addMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
    const res = await api.post(`/api/patients/${id}/records`, data);
    return res.data;
  },
};

import { api } from "@/lib/axios";
import type { Appointment, PaginatedResponse, ApiResponse } from "@/types";

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledAt: string;      // ISO datetime
  durationMinutes?: number; // default 30
  type: "in_person" | "video" | "phone";
  reason: string;
  notes?: string;
  symptoms?: string[];
  fee?: number;
  currency?: string;
}

export const appointmentService = {
  async getAll(page = 1, limit = 10, filters?: { patientId?: string; doctorId?: string }): Promise<PaginatedResponse<Appointment>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.patientId) params.set("patientId", filters.patientId);
    if (filters?.doctorId)  params.set("doctorId",  filters.doctorId);
    const res = await api.get(`/api/appointments?${params}`);
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Appointment>> {
    const res = await api.get(`/api/appointments/${id}`);
    return res.data;
  },

  async create(data: CreateAppointmentDto): Promise<ApiResponse<Appointment>> {
    const res = await api.post("/api/appointments", data);
    return res.data;
  },

  async update(id: string, data: Partial<CreateAppointmentDto>): Promise<ApiResponse<Appointment>> {
    const res = await api.put(`/api/appointments/${id}`, data);
    return res.data;
  },

  async cancel(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    const res = await api.patch(`/api/appointments/${id}/cancel`, { reason });
    return res.data;
  },

  async complete(id: string): Promise<ApiResponse<Appointment>> {
    const res = await api.patch(`/api/appointments/${id}/complete`);
    return res.data;
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> {
    const res = await api.get(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
    return res.data.data ?? [];
  },
};

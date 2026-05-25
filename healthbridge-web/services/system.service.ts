import { api } from "@/lib/axios";
import type { HealthResponse } from "@/types";

export const systemService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await api.get("/api/health");
    return res.data;
  },
};

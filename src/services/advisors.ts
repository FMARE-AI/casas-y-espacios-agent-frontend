import apiClient from "../lib/axios";
import type { Advisor, AvailabilityStatus } from "../types";

const MOCK_ADVISORS: Advisor[] = [
  {
    id: "advisor-diana",
    email: "diana@casasyespacios.co",
    full_name: "Diana Ospina",
    role: "asesor",
    area: "administrativa",
    max_conversations: 3,
    active_conversations: 3,
    availability_status: "available",
    avatar_url: null,
    is_active: true,
    must_change_password: false,
  },
  {
    id: "advisor-andres",
    email: "andres@casasyespacios.co",
    full_name: "Andrés Morales",
    role: "asesor",
    area: "administrativa",
    max_conversations: 3,
    active_conversations: 1,
    availability_status: "available",
    avatar_url: null,
    is_active: true,
    must_change_password: false,
  },
  {
    id: "advisor-julio",
    email: "julio@casasyespacios.co",
    full_name: "Julio César Torres",
    role: "asesor",
    area: "ambas",
    max_conversations: 3,
    active_conversations: 0,
    availability_status: "offline",
    avatar_url: null,
    is_active: true,
    must_change_password: false,
  },
  {
    id: "advisor-jorge",
    email: "jorge@casasyespacios.co",
    full_name: "Jorge Ramírez",
    role: "admin",
    area: "ambas",
    max_conversations: 10,
    active_conversations: 0,
    availability_status: "available",
    avatar_url: null,
    is_active: true,
    must_change_password: false,
  },
  {
    id: "advisor-paola",
    email: "paola@casasyespacios.co",
    full_name: "Paola Salcedo",
    role: "asesor",
    area: "administrativa",
    max_conversations: 3,
    active_conversations: 0,
    availability_status: "break",
    avatar_url: null,
    is_active: false,
    must_change_password: false,
  },
];

export const advisorsService = {
  async getMe(): Promise<{ advisor: Advisor }> {
    const { data } = await apiClient.get("/api/v1/panel/advisors/me");
    return data.data;
  },

  async updateMe(payload: {
    full_name?: string;
    current_password?: string;
    new_password?: string;
    avatar_url?: string;
    must_change_password?: boolean;
  }): Promise<{ advisor: Advisor }> {
    // TODO: integrate PATCH /advisors/me
    const current = MOCK_ADVISORS[0]
    return { advisor: { ...current, ...payload } as Advisor }
  },

  async updateAvailability(
    status: AvailabilityStatus,
    _minutesUntil?: number | null,
  ): Promise<{ availability_status: AvailabilityStatus }> {
    // TODO: integrate PATCH /advisors/me/availability
    return { availability_status: status }
  },

  async list(params?: {
    role?: string;
    area?: string;
    is_active?: boolean;
  }): Promise<{ advisors: Advisor[] }> {
    try {
      const { data } = await apiClient.get("/api/v1/panel/advisors", {
        params,
      });
      return data.data;
    } catch {
      return { advisors: MOCK_ADVISORS };
    }
  },

  async create(payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    area: string;
    max_conversations: number;
  }): Promise<{ advisor: Advisor }> {
    // TODO: integrate POST /advisors/
    const newAdvisor: Advisor = {
      id: `mock-${Date.now()}`,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role as Advisor['role'],
      area: payload.area as Advisor['area'],
      max_conversations: payload.max_conversations,
      active_conversations: 0,
      availability_status: 'available',
      avatar_url: null,
      is_active: true,
      must_change_password: true,
    }
    return { advisor: newAdvisor }
  },

  async update(
    id: string,
    payload: {
      full_name?: string;
      role?: string;
      area?: string;
      max_conversations?: number;
      is_active?: boolean;
    },
  ): Promise<{ advisor: Advisor }> {
    // TODO: integrate PATCH /advisors/{id}
    const base = MOCK_ADVISORS.find((a) => a.id === id) ?? MOCK_ADVISORS[0]
    return { advisor: { ...base, ...payload } as Advisor }
  },
};

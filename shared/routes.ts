import { z } from 'zod';
import { insertMemberSchema, members, checkIns, kioskCheckInSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    check: {
      method: 'POST' as const,
      path: '/api/auth/check' as const,
      input: z.object({ memberId: z.string() }),
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ memberId: z.string(), password: z.string().optional() }),
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
    },
  },
  members: {
    list: {
      method: 'GET' as const,
      path: '/api/members' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/members/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/members' as const,
      input: insertMemberSchema,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/members/:id' as const,
      input: insertMemberSchema.partial(),
    },
    addSessions: {
      method: 'POST' as const,
      path: '/api/members/:id/sessions' as const,
      input: z.object({ sessions: z.number().int().positive() }),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/members/:id' as const,
    },
  },
  checkIns: {
    list: {
      method: 'GET' as const,
      path: '/api/check-ins' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/check-ins' as const,
      input: kioskCheckInSchema,
    },
    myCheckIns: {
      method: 'GET' as const,
      path: '/api/me/check-ins' as const,
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

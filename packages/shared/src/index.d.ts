export const APP_NAME: 'Aivora';
export const APP_DESCRIPTION: 'Aivora AI Learning Platform';
export const DEFAULT_API_PORT: 3000;

export function normalizeBaseUrl(value: unknown): string;
export function extractHost(value: unknown): string;
export function buildHostCandidateUrl(host: unknown, port?: number): string;

export const API_ROUTES: any;

export function mapApiEndpointToWebPath(rawEndpoint: string, role?: string): string;

export const EMPTY_SESSION: {
  token: null;
  role: null;
  user: null;
};

export const EMPTY_PAGINATION: {
  page: number;
  pageSize: number;
  total: number;
};

export function normalizeEmail(value: unknown): string;
export function normalizePassword(value: unknown): string;
export function normalizeFullName(value: unknown): string;
export function isValidEmail(value: unknown): boolean;
export function validateAuthInput(input: {
  email: unknown;
  password: unknown;
  fullName?: unknown;
  requireFullName?: boolean;
  minPasswordLength?: number;
}): {
  ok: boolean;
  message: string;
  values: {
    normalizedEmail: string;
    normalizedPassword: string;
    normalizedFullName: string;
  };
};
export function buildLoginPayload(input: {
  email: unknown;
  password: unknown;
}): {
  email: string;
  password: string;
};
export function buildRegisterPayload(input: {
  fullName: unknown;
  email: unknown;
  password: unknown;
}): {
  fullName: string;
  email: string;
  password: string;
};

export function buildAvatarUrl(name: unknown): string;
export function normalizeCourseRecord(course: any, options?: any): any;
export function normalizeFeedbackRecord(item: any): any;
export function normalizeFeedbackList(items: any[]): any[];
export function normalizeCourseList(items: any[], options?: any): any[];
export function toTestimonialRecord(feedback: any): any;
export function normalizeNotificationRecord(item: any): {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};
export function normalizeNotificationList(items: any[]): Array<{
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}>;
export function normalizeStudentProfileResponse(data: any): {
  fullName: string;
  email: string;
  imageUrl: string | null;
};
export function normalizeTeacherProfileResponse(data: any): {
  fullName: string;
  email: string;
  imageUrl: string | null;
};
export function normalizeSessionProfileResponse(data: any): any;

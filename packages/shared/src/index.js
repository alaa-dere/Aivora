export const APP_NAME = 'Aivora';
export const APP_DESCRIPTION = 'Aivora AI Learning Platform';
export const DEFAULT_API_PORT = 3000;

export const normalizeBaseUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withProtocol.replace(/\/+$/, '');
};

export const extractHost = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withoutProtocol = raw.replace(/^https?:\/\//i, '');
  const firstChunk = withoutProtocol.split('/')[0];
  return firstChunk.split(':')[0];
};

export const buildHostCandidateUrl = (host, port = DEFAULT_API_PORT) => {
  const cleanHost = extractHost(host);
  if (!cleanHost) return '';
  return normalizeBaseUrl(`http://${cleanHost}:${port}`);
};

export * from './api-routes.js';
export * from './models.js';
export * from './auth-contracts.js';
export * from './data-contracts.js';

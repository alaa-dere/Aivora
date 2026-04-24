import { buildHostCandidateUrl, extractHost, normalizeBaseUrl } from '@aivora/shared';

const EXPLICIT_ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
let manualApiBaseUrl = '';
let activeApiBaseUrl = '';

const collectRuntimeApiCandidates = () => {
  const candidates = [];
  const envBase = normalizeBaseUrl(EXPLICIT_ENV_BASE_URL);
  if (envBase) candidates.push(envBase);
  if (manualApiBaseUrl) candidates.push(manualApiBaseUrl);

  try {
    // eslint-disable-next-line global-require
    const Constants = require('expo-constants').default;
    const runtimeHostCandidates = [
      Constants?.expoConfig?.hostUri,
      Constants?.manifest2?.extra?.expoClient?.hostUri,
      Constants?.manifest?.debuggerHost,
      Constants?.manifest?.hostUri,
    ];

    // eslint-disable-next-line global-require
    const { NativeModules } = require('react-native');
    runtimeHostCandidates.push(NativeModules?.SourceCode?.scriptURL);

    runtimeHostCandidates.forEach((candidate) => {
      const host = extractHost(candidate);
      if (host && host !== 'exp.direct' && host !== 'u.expo.dev') {
        const hostCandidate = buildHostCandidateUrl(host);
        if (hostCandidate) candidates.push(hostCandidate);
      }
    });
  } catch (error) {
    // ignore runtime discovery errors
  }

  candidates.push('http://10.0.2.2:3000');
  candidates.push('http://127.0.0.1:3000');
  candidates.push('http://localhost:3000');

  return Array.from(new Set(candidates.map(normalizeBaseUrl).filter(Boolean)));
};

const apiUrl = (path, baseUrl = activeApiBaseUrl || collectRuntimeApiCandidates()[0]) =>
  `${baseUrl}${path}`;

export const apiFetch = async (path, options = {}) => {
  let lastError = null;
  const apiBaseCandidates = collectRuntimeApiCandidates();

  for (const baseUrl of apiBaseCandidates) {
    try {
      const response = await fetch(apiUrl(path, baseUrl), options);
      activeApiBaseUrl = baseUrl;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to connect to backend');
};

export const getActiveApiBaseUrl = () =>
  activeApiBaseUrl ||
  manualApiBaseUrl ||
  normalizeBaseUrl(EXPLICIT_ENV_BASE_URL) ||
  collectRuntimeApiCandidates()[0] ||
  'http://localhost:3000';

export const setApiBaseUrlOverride = (value) => {
  manualApiBaseUrl = normalizeBaseUrl(value);
  if (manualApiBaseUrl) {
    activeApiBaseUrl = manualApiBaseUrl;
  }
};

export const toImageSource = (imagePath, fallback) => {
  if (!imagePath || typeof imagePath !== 'string') return fallback;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return { uri: imagePath };
  }
  const baseUrl = activeApiBaseUrl || collectRuntimeApiCandidates()[0] || '';
  if (!baseUrl) return fallback;
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return { uri: `${baseUrl}${normalizedPath}` };
};

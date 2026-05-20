export const resolveRole = (role) => {
  if (!role) return 'student';
  const normalized = String(role).toLowerCase();
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'admin') return 'admin';
  return 'student';
};

export const replaceEndpointParams = (template, params) =>
  template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key];
    return value ? encodeURIComponent(value.trim()) : `:${key}`;
  });

export const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) {
    return { items: payload, summary: `${payload.length} item(s)` };
  }
  if (!payload || typeof payload !== 'object') {
    return { items: [], summary: String(payload ?? '') };
  }
  const candidateArrays = Object.entries(payload).filter(([, value]) =>
    Array.isArray(value)
  );
  if (candidateArrays.length > 0) {
    const [firstKey, firstList] = candidateArrays[0];
    return { items: firstList, summary: `${String(firstKey)} (${firstList.length})` };
  }
  return { items: [payload], summary: '1 item' };
};

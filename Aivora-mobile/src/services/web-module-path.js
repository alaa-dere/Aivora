export const mapApiEndpointToWebPath = (rawEndpoint, role) => {
  if (!rawEndpoint) return '/';
  if (rawEndpoint.startsWith('/api/student')) {
    return rawEndpoint.replace('/api/student', '/student').split('?')[0];
  }
  if (rawEndpoint.startsWith('/api/teacher')) {
    return rawEndpoint.replace('/api/teacher', '/teacher').split('?')[0];
  }
  if (rawEndpoint.startsWith('/api/dashboard')) {
    return rawEndpoint.replace('/api/dashboard', '/dashboard').split('?')[0];
  }
  if (rawEndpoint.startsWith('/api/finance')) {
    return rawEndpoint.replace('/api/finance', '/dashboard/finance').split('?')[0];
  }
  if (rawEndpoint.startsWith('/api/admin/notifications')) return '/dashboard/notifications';
  if (rawEndpoint.startsWith('/api/admin/messages')) return '/dashboard/messages';
  if (rawEndpoint.startsWith('/api/admin/certificates')) return '/dashboard/certificates';
  if (rawEndpoint.startsWith('/api/teachers')) return '/dashboard/teachers';
  if (rawEndpoint.startsWith('/api/students')) return '/dashboard/students';
  if (rawEndpoint.startsWith('/api/courses')) return '/dashboard/courses';
  if (rawEndpoint.startsWith('/api/categories')) return '/dashboard/categories';
  if (rawEndpoint.startsWith('/api/paths')) {
    return role === 'student' ? '/student' : '/dashboard/paths';
  }
  return '/';
};

export const API_ROUTES = {
  home: '/api/home',
  recentCourses: '/api/recent-courses',
  profileMe: '/api/profile/me',
  auth: {
    checkByEmail: (email) => `/api/auth/check?email=${encodeURIComponent(email)}`,
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    session: '/api/auth/session',
    socialComplete: '/api/auth/social-complete',
    forgotPassword: '/api/auth/forgot-password',
  },
  student: {
    dashboard: '/api/student/dashboard',
    dashboardNotificationsAll: '/api/student/dashboard?notifications=all',
    dashboardNotificationsCount: '/api/student/dashboard?notifications=count',
    dashboardNotifications: '/api/student/dashboard?notifications=1',
    courses: '/api/student/courses',
    courseDetailTemplate: '/api/student/courses/:courseId',
    myCourses: '/api/student/my-courses',
    myCourseContentTemplate: '/api/student/my-courses/:courseId/content',
    paths: '/api/student/paths',
    leaderboard: '/api/student/leaderboard',
    wallet: '/api/student/wallet',
    certificateQuizzes: '/api/student/certificate-quizzes',
    certificates: '/api/student/certificates',
    chatTeachers: '/api/student/chat/teachers',
    chatTeachersUnreadCount: '/api/student/chat/teachers?unreadCount=1',
    profile: '/api/student/profile',
    favorites: '/api/student/favorites',
    favoriteIds: '/api/student/favorites/ids',
  },
  teacher: {
    dashboard: '/api/teacher/dashboard',
    dashboardNotificationsAll: '/api/teacher/dashboard?notifications=all',
    dashboardNotificationsCount: '/api/teacher/dashboard?notifications=count',
    dashboardNotifications: '/api/teacher/dashboard?notifications=1',
    dashboardLiveSessionsAll: '/api/teacher/dashboard?liveSessions=all',
    courses: '/api/teacher/courses',
    questionBank: '/api/teacher/question-bank',
    certificates: '/api/teacher/certificates',
    messages: '/api/teacher/messages',
    messagesUnreadCount: '/api/teacher/messages?unreadCount=1',
    chatStudents: '/api/teacher/chat/students',
    chatStudentsUnreadCount: '/api/teacher/chat/students?unreadCount=1',
    profile: '/api/teacher/profile',
  },
  admin: {
    certificates: '/api/admin/certificates',
    notifications: '/api/admin/notifications',
    notificationsCount: '/api/admin/notifications/count',
    messages: '/api/admin/messages',
    messagesUnreadCount: '/api/admin/messages?unreadCount=1',
  },
  dashboard: {
    stats: '/api/dashboard/stats',
    recentActivity: '/api/dashboard/recent-activity',
    revenueTrend: '/api/dashboard/revenue-trend',
  },
  finance: {
    transactions: '/api/finance/transactions',
    reports: '/api/finance/reports',
  },
  catalog: {
    courses: '/api/courses',
    teachersList: '/api/teachers/list',
    students: '/api/students',
    categories: '/api/categories',
    paths: '/api/paths',
  },
};

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

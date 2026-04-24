import { API_ROUTES } from '@aivora/shared';

export const ROLE_FEATURES = {
  student: [
    { id: 'student-dashboard', title: 'Dashboard', endpoint: API_ROUTES.student.dashboard },
    {
      id: 'student-notifications',
      title: 'Notifications',
      endpoint: API_ROUTES.student.dashboardNotificationsAll,
    },
    { id: 'student-courses', title: 'Courses', endpoint: API_ROUTES.student.courses },
    {
      id: 'student-course-detail',
      title: 'Course Detail',
      endpoint: API_ROUTES.student.courseDetailTemplate,
      params: ['courseId'],
    },
    { id: 'student-my-courses', title: 'My Courses', endpoint: API_ROUTES.student.myCourses },
    {
      id: 'student-my-course-content',
      title: 'My Course Content',
      endpoint: API_ROUTES.student.myCourseContentTemplate,
      params: ['courseId'],
    },
    { id: 'student-paths', title: 'Learning Paths', endpoint: API_ROUTES.student.paths },
    { id: 'student-leaderboard', title: 'Leaderboard', endpoint: API_ROUTES.student.leaderboard },
    { id: 'student-wallet', title: 'Wallet', endpoint: API_ROUTES.student.wallet },
    {
      id: 'student-certificate-quizzes',
      title: 'Certificate Quizzes',
      endpoint: API_ROUTES.student.certificateQuizzes,
    },
    { id: 'student-certificates', title: 'Certificates', endpoint: API_ROUTES.student.certificates },
    { id: 'student-chat', title: 'Chat', endpoint: API_ROUTES.student.chatTeachers },
    { id: 'student-profile', title: 'Profile', endpoint: API_ROUTES.student.profile },
  ],
  teacher: [
    { id: 'teacher-dashboard', title: 'Dashboard', endpoint: API_ROUTES.teacher.dashboard },
    {
      id: 'teacher-notifications',
      title: 'Notifications',
      endpoint: API_ROUTES.teacher.dashboardNotificationsAll,
    },
    {
      id: 'teacher-live-sessions',
      title: 'Live Sessions',
      endpoint: API_ROUTES.teacher.dashboardLiveSessionsAll,
    },
    { id: 'teacher-courses', title: 'Courses', endpoint: API_ROUTES.teacher.courses },
    {
      id: 'teacher-question-bank',
      title: 'Quizzes / Question Bank',
      endpoint: API_ROUTES.teacher.questionBank,
    },
    { id: 'teacher-certificates', title: 'Certificates', endpoint: API_ROUTES.teacher.certificates },
    { id: 'teacher-messages', title: 'Admin Messages', endpoint: API_ROUTES.teacher.messages },
    { id: 'teacher-chat', title: 'Student Chat', endpoint: API_ROUTES.teacher.chatStudents },
    { id: 'teacher-profile', title: 'Profile', endpoint: API_ROUTES.teacher.profile },
  ],
  admin: [
    { id: 'admin-stats', title: 'Dashboard Stats', endpoint: API_ROUTES.dashboard.stats },
    {
      id: 'admin-recent-activity',
      title: 'Recent Activity',
      endpoint: API_ROUTES.dashboard.recentActivity,
    },
    {
      id: 'admin-revenue-trend',
      title: 'Revenue Trend',
      endpoint: API_ROUTES.dashboard.revenueTrend,
    },
    { id: 'admin-courses', title: 'Courses', endpoint: API_ROUTES.catalog.courses },
    { id: 'admin-teachers', title: 'Teachers', endpoint: API_ROUTES.catalog.teachersList },
    { id: 'admin-students', title: 'Students', endpoint: API_ROUTES.catalog.students },
    { id: 'admin-categories', title: 'Categories', endpoint: API_ROUTES.catalog.categories },
    { id: 'admin-paths', title: 'Paths', endpoint: API_ROUTES.catalog.paths },
    { id: 'admin-certificates', title: 'Certificates', endpoint: API_ROUTES.admin.certificates },
    {
      id: 'admin-notifications',
      title: 'Notifications',
      endpoint: API_ROUTES.admin.notifications,
    },
    { id: 'admin-messages', title: 'Teacher Messages', endpoint: API_ROUTES.admin.messages },
    {
      id: 'admin-transactions',
      title: 'Finance Transactions',
      endpoint: API_ROUTES.finance.transactions,
    },
    { id: 'admin-reports', title: 'Finance Reports', endpoint: API_ROUTES.finance.reports },
  ],
};

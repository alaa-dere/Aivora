type BaseNotification = {
  type?: string | null;
  title?: string | null;
  courseId?: string | null;
  certificateId?: string | null;
  conversationId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
};

function hasCertificateHint(title?: string | null) {
  const t = String(title || '').toLowerCase();
  return t.includes('certificate');
}

export function getStudentNotificationHref(notification: BaseNotification) {
  if (notification.certificateId || hasCertificateHint(notification.title)) {
    return notification.certificateId
      ? `/student/certificates/${notification.certificateId}`
      : '/student/certificates';
  }

  switch (notification.type) {
    case 'teacher_message':
      return '/student/chat';
    case 'quiz_passed':
    case 'quiz_failed':
      return notification.courseId
        ? `/student/my-courses/${notification.courseId}/quizzes`
        : '/student/certificate-quizzes';
    case 'live_session':
    case 'missed_session':
      return '/student/calendar';
    case 'course_failed':
      return notification.courseId
        ? `/student/my-courses/${notification.courseId}`
        : '/student/my-courses';
    default:
      return '/student/notifications';
  }
}

export function getTeacherNotificationHref(notification: BaseNotification) {
  if (notification.certificateId || hasCertificateHint(notification.title)) {
    return notification.certificateId
      ? `/teacher/certificates/${notification.certificateId}`
      : '/teacher/certificates';
  }

  switch (notification.type) {
    case 'admin_message':
      return '/teacher/messages';
    case 'student_message':
      return notification.conversationId
        ? `/teacher/messages?conversationId=${encodeURIComponent(notification.conversationId)}`
        : '/teacher/messages';
    case 'course_enroll':
      return '/teacher/students';
    case 'teacher_notification':
      return notification.courseId
        ? `/teacher/courses/${notification.courseId}`
        : '/teacher/notifications';
    default:
      return '/teacher/notifications';
  }
}

export function getAdminNotificationHref(notification: BaseNotification) {
  if (notification.certificateId || hasCertificateHint(notification.title)) {
    return notification.certificateId
      ? `/dashboard/certificates/${notification.certificateId}`
      : '/dashboard/certificates';
  }

  switch (notification.type) {
    case 'teacher_message':
      return notification.teacherId
        ? `/dashboard/messages?teacherId=${encodeURIComponent(notification.teacherId)}`
        : '/dashboard/messages';
    case 'course_enroll':
      return notification.courseId
        ? `/dashboard/courses/${notification.courseId}`
        : '/dashboard/students';
    case 'student_signup':
      return notification.studentId
        ? `/dashboard/students/${notification.studentId}`
        : '/dashboard/students';
    default:
      return '/dashboard/notifications';
  }
}

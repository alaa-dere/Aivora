const DEFAULT_COURSE_IMAGE = '/default-course.jpg';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringSafe = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

export const buildAvatarUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(toStringSafe(name, 'Student'))}&background=2563eb&color=fff`;

export const normalizeCourseRecord = (course, options = {}) => {
  const defaultImage = options.defaultImage || DEFAULT_COURSE_IMAGE;
  const durationSuffix = options.durationSuffix || 'Weeks';

  const imageValue = toStringSafe(course?.imageUrl || course?.image, defaultImage);
  const durationWeeks = toNumber(course?.durationWeeks, 0);

  return {
    id: toStringSafe(course?.id),
    title: toStringSafe(course?.title),
    description: toStringSafe(course?.description),
    price: toNumber(course?.price, 0),
    image: imageValue,
    imageUrl: imageValue,
    instructor: toStringSafe(course?.instructor, 'Aivora Team'),
    duration: toStringSafe(course?.duration, `${durationWeeks} ${durationSuffix}`),
    students: toStringSafe(course?.students, String(toNumber(course?.students, 0))),
    enrolled: Boolean(course?.enrolled),
    averageRating: toNumber(course?.averageRating, 0),
    evaluationCount: toNumber(course?.evaluationCount, 0),
  };
};

export const normalizeFeedbackRecord = (item) => ({
  id: toStringSafe(item?.id),
  name: toStringSafe(item?.name, 'Student'),
  role: toStringSafe(item?.role, 'Student'),
  content: toStringSafe(item?.content),
  rating: toNumber(item?.rating, 0),
});

export const normalizeFeedbackList = (items) =>
  Array.isArray(items) ? items.map(normalizeFeedbackRecord) : [];

export const normalizeCourseList = (items, options = {}) =>
  Array.isArray(items) ? items.map((item) => normalizeCourseRecord(item, options)) : [];

export const toTestimonialRecord = (feedback) => {
  const normalized = normalizeFeedbackRecord(feedback);
  return {
    name: normalized.name,
    role: normalized.role,
    content: normalized.content,
    avatar: buildAvatarUrl(normalized.name),
    rating: normalized.rating,
  };
};

export const normalizeNotificationRecord = (item) => ({
  id: toStringSafe(item?.id),
  title: toStringSafe(item?.title),
  message: toStringSafe(item?.message),
  createdAt: toStringSafe(item?.createdAt),
  read: Boolean(item?.readAt || item?.read),
});

export const normalizeNotificationList = (items) =>
  Array.isArray(items) ? items.map(normalizeNotificationRecord) : [];

export const normalizeStudentProfileResponse = (data) => {
  const student = data?.student || {};
  return {
    fullName: toStringSafe(student.fullName, 'Student User'),
    email: toStringSafe(student.email, 'student@aivora.com'),
    imageUrl: student.imageUrl || null,
  };
};

export const normalizeTeacherProfileResponse = (data) => {
  const teacher = data?.teacher || {};
  return {
    fullName: toStringSafe(teacher.fullName, 'Teacher User'),
    email: toStringSafe(teacher.email, 'teacher@aivora.com'),
    imageUrl: teacher.imageUrl || null,
  };
};

export const normalizeSessionProfileResponse = (data) => {
  const user = data?.user || {};
  return {
    ...user,
    fullName: toStringSafe(user.fullName || user.name, 'User'),
    email: toStringSafe(user.email),
    imageUrl: user.imageUrl || user.image || null,
  };
};

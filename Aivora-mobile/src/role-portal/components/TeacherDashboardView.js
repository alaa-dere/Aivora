import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

export default function TeacherDashboardView({ data, loading, error, theme }) {
  const stats = data?.stats || {};
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const students = Array.isArray(data?.students) ? data.students : [];
  const activities = Array.isArray(data?.recentActivities) ? data.recentActivities : [];

  const statCards = useMemo(
    () => [
      { key: 'totalStudents', label: 'Total Students', value: Number(stats.totalStudents || 0) },
      { key: 'activeCourses', label: 'Active Courses', value: Number(stats.activeCourses || 0) },
      { key: 'avgScore', label: 'Avg Score', value: `${Number(stats.avgScore || 0)}%` },
      { key: 'completion', label: 'Completion', value: `${Number(stats.completion || 0)}%` },
    ],
    [stats]
  );

  if (loading) {
    return <ActivityIndicator color="#0d3b66" style={portalStyles.loader} />;
  }

  if (error) {
    return <Text style={portalStyles.error}>{error}</Text>;
  }

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Dashboard</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Overview of your courses, students, and progress.
      </Text>

      <View style={portalStyles.statsGrid}>
        {statCards.map((stat) => (
          <View
            key={stat.key}
            style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{String(stat.value)}</Text>
            <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>My Courses</Text>
        {courses.length === 0 ? (
          <Text style={portalStyles.empty}>No courses yet.</Text>
        ) : (
          courses.map((course) => (
            <View key={String(course?.id || Math.random())} style={portalStyles.listItem}>
              <View style={portalStyles.listItemContent}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  {course?.name || 'Untitled course'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Students: {Number(course?.students || 0)} | Progress: {Number(course?.completion || 0)}% | Avg Score:{' '}
                  {Number(course?.averageScore || 0)}%
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Status: {String(course?.status || 'draft')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Student Performance</Text>
        {students.length === 0 ? (
          <Text style={portalStyles.empty}>No students yet.</Text>
        ) : (
          students.map((student, idx) => (
            <View key={`${student?.name || 'student'}-${idx}`} style={portalStyles.listItem}>
              <View style={portalStyles.listItemContent}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  {student?.name || 'Student'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Course: {student?.courseName || 'Unknown course'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Progress: {Number(student?.progress || 0)}% | Status: {String(student?.status || 'in_progress')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
        {activities.length === 0 ? (
          <Text style={portalStyles.empty}>No recent activity yet.</Text>
        ) : (
          activities.map((activity, idx) => (
            <View key={`${activity?.type || 'activity'}-${idx}`} style={portalStyles.listItem}>
              <View style={portalStyles.listItemContent}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  {activity?.type || 'EVENT'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  {activity?.description || '-'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  {formatDateTime(activity?.time)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}


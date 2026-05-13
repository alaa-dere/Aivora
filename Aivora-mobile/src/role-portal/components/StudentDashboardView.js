import { Text, View } from 'react-native';
import { portalStyles } from '../styles';
import StudyTimeAreaChart from './StudyTimeAreaChart';

const clampPercent = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

export default function StudentDashboardView({ data, theme }) {
  const stats = data?.stats || {};
  const studyData = Array.isArray(data?.studyData) ? data.studyData : [];
  const continueLearning = Array.isArray(data?.continueLearning) ? data.continueLearning : [];
  const recentQuizzes = Array.isArray(data?.recentQuizzes) ? data.recentQuizzes : [];

  const statCards = [
    { key: 'enrolledCourses', label: 'Enrolled Courses', value: Number(stats.enrolledCourses || 0) },
    { key: 'inProgress', label: 'In Progress', value: Number(stats.inProgress || 0) },
    { key: 'avgScore', label: 'Avg Progress', value: `${clampPercent(stats.avgScore)}%` },
    { key: 'completion', label: 'Completion', value: `${clampPercent(stats.completion)}%` },
  ];

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Dashboard</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Track your learning stats, courses, and progress at a glance.
      </Text>

      <View style={portalStyles.statsGrid}>
        {statCards.map((stat) => (
          <View key={stat.key} style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{String(stat.value)}</Text>
            <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Study Time Trend</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Last 7 days</Text>
        {studyData.length === 0 ? <Text style={portalStyles.empty}>No study activity yet.</Text> : <StudyTimeAreaChart trend={studyData} />}
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, marginTop: 4 }]}>
          Tip: Aim for 45-60 minutes daily for steady progress.
        </Text>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Continue Learning</Text>
        {continueLearning.length === 0 ? <Text style={portalStyles.empty}>No courses yet.</Text> : null}
        {continueLearning.map((course, idx) => {
          const progress = clampPercent(course?.progress);
          return (
            <View key={String(course?.id || `continue-${idx}`)} style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{course?.title || 'Course'}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Next lesson: {course?.nextLesson || 'Start course'}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Progress: {progress}%</Text>
              <View style={{ height: 7, borderRadius: 999, backgroundColor: theme.isDark ? '#1e293b' : '#dbeafe', marginTop: 6 }}>
                <View style={{ width: `${progress}%`, height: 7, borderRadius: 999, backgroundColor: '#2563eb' }} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Recent Quiz Results</Text>
        {recentQuizzes.length === 0 ? <Text style={portalStyles.empty}>No quizzes yet.</Text> : null}
        {recentQuizzes.map((quiz, idx) => (
          <View key={String(quiz?.id || `quiz-${idx}`)} style={portalStyles.listItem}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{quiz?.course || 'Course'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{quiz?.date || '-'}</Text>
            <Text style={[portalStyles.listItemValue, { color: theme.textPrimary }]}>{Number(quiz?.score || 0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

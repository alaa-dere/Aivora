import { Linking, Pressable, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const toList = (value) => (Array.isArray(value) ? value : []);

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

export default function StudentCalendarView({ data, theme }) {
  const summary = data?.summary || {};
  const sessions = toList(data?.sessions);
  const reminders = toList(data?.reminders);
  const deliverables = toList(data?.deliverables);
  const courseStats = toList(data?.courseStats);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Calendar</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Live sessions, reminders, and pending deliverables.
      </Text>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(summary.totalSessions || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Sessions</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(summary.totalReminders || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Reminders</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(summary.totalDeliverables || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Deliverables</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(summary.totalAbsences || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Absences</Text>
        </View>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Upcoming Sessions</Text>
        {sessions.length === 0 ? <Text style={portalStyles.empty}>No sessions available.</Text> : null}
        {sessions.slice(0, 8).map((session, idx) => (
          <View key={String(session?.id || `session-${idx}`)} style={portalStyles.listCard}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{session?.title || 'Session'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{session?.courseTitle || 'Course'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              {formatDateTime(session?.startAt)} - {formatDateTime(session?.endAt)}
            </Text>
            {session?.meetingLink ? (
              <Pressable onPress={() => Linking.openURL(String(session.meetingLink))} style={portalStyles.notificationActionBtn}>
                <Text style={portalStyles.notificationActionText}>Join meeting</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Per-Course Status</Text>
        {courseStats.length === 0 ? <Text style={portalStyles.empty}>No course stats yet.</Text> : null}
        {courseStats.map((row, idx) => (
          <View key={String(row?.courseId || `stat-${idx}`)} style={portalStyles.listCard}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{row?.courseTitle || 'Course'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Lectures: {Number(row?.completedLectures || 0)}/{Number(row?.totalLectures || 0)} completed
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Upcoming: {Number(row?.upcomingLectures || 0)} | Absences: {Number(row?.missedCount || 0)}/6
            </Text>
          </View>
        ))}
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Reminders & Deliverables</Text>
        {reminders.length === 0 && deliverables.length === 0 ? (
          <Text style={portalStyles.empty}>No reminders or pending deliverables.</Text>
        ) : null}
        {reminders.slice(0, 6).map((item, idx) => (
          <View key={String(item?.id || `reminder-${idx}`)} style={portalStyles.listCard}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{item?.title || 'Reminder'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{item?.message || '-'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              {formatDateTime(item?.eventAt || item?.createdAt)}
            </Text>
          </View>
        ))}
        {deliverables.slice(0, 6).map((item, idx) => (
          <View key={String(item?.id || `deliverable-${idx}`)} style={portalStyles.listCard}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{item?.title || 'Deliverable'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{item?.courseTitle || 'Course'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{item?.detail || '-'}</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Best score: {Number(item?.bestScore || 0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

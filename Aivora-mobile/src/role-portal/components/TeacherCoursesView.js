import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'published' || value === 'active') return 'active';
  return 'draft';
};

export default function TeacherCoursesView({ apiFetch, theme, onManageContent = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCourseId, setExpandedCourseId] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/teacher/courses', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load courses');
      const list = Array.isArray(payload?.courses) ? payload.courses : [];
      const nextStats = payload?.stats || {
        totalCourses: list.length,
        activeCourses: list.filter((c) => normalizeStatus(c?.status) === 'active').length,
        totalStudents: list.reduce((sum, c) => sum + Number(c?.students || 0), 0),
        totalLessons: list.reduce((sum, c) => sum + Number(c?.lessons || 0), 0),
      };
      setCourses(list);
      setStats(nextStats);
    } catch (err) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return courses.filter((course) => {
      const status = normalizeStatus(course?.status);
      const statusMatches = statusFilter === 'all' || status === statusFilter;
      if (!statusMatches) return false;
      if (!q) return true;
      const haystack = [course?.name, course?.title, course?.code, course?.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [courses, query, statusFilter]);

  const statusFilterLabel =
    statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>My Courses</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Manage your courses, content, and student progress.
      </Text>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(stats.totalCourses || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Courses</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(stats.activeCourses || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Active Courses</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(stats.totalStudents || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Students</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(stats.totalLessons || 0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Lessons</Text>
        </View>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Find Courses</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or code..."
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <View style={portalStyles.actionRow}>
          {['all', 'active', 'draft'].map((status) => (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={[
                portalStyles.secondaryBtn,
                statusFilter === status && { backgroundColor: '#dbeafe', borderColor: '#60a5fa', borderWidth: 1 },
              ]}
            >
              <Text style={portalStyles.secondaryBtnText}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={loadCourses} style={portalStyles.secondaryBtn}>
            <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
          </Pressable>
        </View>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
          Showing {filtered.length} courses ({statusFilterLabel})
        </Text>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading ? (
        <ScrollView style={{ maxHeight: 520 }}>
          {filtered.length === 0 ? <Text style={portalStyles.empty}>No courses found.</Text> : null}
          {filtered.map((course) => {
            const status = normalizeStatus(course?.status);
            const statusColor = status === 'active' ? '#047857' : '#b45309';
            const isExpanded = expandedCourseId === String(course?.id || '');
            return (
              <View
                key={String(course?.id || Math.random())}
                style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                      {course?.name || course?.title || 'Untitled course'}
                    </Text>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      Code: {course?.code || course?.id || '-'}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: statusColor,
                    }}
                  >
                    <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700' }}>
                      {status === 'active' ? 'Active' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, marginTop: 6 }]}>
                  {String(course?.description || 'No description').slice(0, 120)}
                  {String(course?.description || '').length > 120 && !isExpanded ? '...' : ''}
                </Text>
                <View style={[portalStyles.actionRow, { marginTop: 8 }]}>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Students: {Number(course?.students || 0)}</Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Progress: {Number(course?.progress || 0)}%</Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Lessons: {Number(course?.lessons || 0)}</Text>
                </View>
                {isExpanded ? (
                  <>
                    <View style={[portalStyles.actionRow, { marginTop: 4 }]}>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Modules: {Number(course?.modules || 0)}</Text>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Status: {status}</Text>
                    </View>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, marginTop: 4 }]}>
                      {String(course?.description || 'No description')}
                    </Text>
                    <Text style={[portalStyles.threadMeta, { marginTop: 6 }]}>
                      Updated: {formatDateTime(course?.lastUpdated || course?.updatedAt)}
                    </Text>
                  </>
                ) : null}
                <View style={[portalStyles.actionRow, { marginTop: 10 }]}>
                  <Pressable
                    onPress={() =>
                      setExpandedCourseId((prev) => (prev === String(course?.id || '') ? '' : String(course?.id || '')))
                    }
                    style={portalStyles.secondaryBtn}
                  >
                    <Text style={portalStyles.secondaryBtnText}>{isExpanded ? 'Show less' : 'Show more'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onManageContent(course)}
                    style={[
                      portalStyles.secondaryBtn,
                      { backgroundColor: '#0d3b66', borderColor: '#0b2f50', borderWidth: 1 },
                    ]}
                  >
                    <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff' }]}>Manage Content</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { API_ROUTES } from '@aivora/shared';
import { portalStyles } from '../styles';
import { toImageSource } from '../../services/api-client';

const normalizeStatus = (value) => {
  const status = String(value || '').toLowerCase();
  if (status === 'published' || status === 'active') return 'active';
  return 'draft';
};

const initials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function TeacherStudentsView({ apiFetch, theme }) {
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState('');
  const [search, setSearch] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course?.id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      setError('');
      const res = await apiFetch(API_ROUTES.teacher.courses, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load courses');
      setCourses(Array.isArray(payload?.courses) ? payload.courses : []);
    } catch (err) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [apiFetch]);

  const loadStudents = useCallback(
    async (courseId) => {
      if (!String(courseId || '').trim()) return;
      try {
        setLoadingStudents(true);
        setError('');
        const res = await apiFetch(`${API_ROUTES.teacher.courses}?courseId=${encodeURIComponent(courseId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to load students');
        setStudents(Array.isArray(payload?.students) ? payload.students : []);
      } catch (err) {
        setError(err?.message || 'Failed to load students');
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredStudents = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const haystack = [student?.name, student?.email].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search]);

  const totalCourses = courses.length;
  const activeCourses = courses.filter((course) => normalizeStatus(course?.status) === 'active').length;
  const totalStudents = courses.reduce((sum, course) => sum + Number(course?.students || 0), 0);
  const avgProgress = filteredStudents.length
    ? Math.round(
        filteredStudents.reduce((sum, student) => sum + Number(student?.progress || 0), 0) /
          filteredStudents.length
      )
    : 0;

  if (!selectedCourse) {
    return (
      <View style={portalStyles.adminWrap}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Students</Text>
        <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
          Choose a course to view students currently taking it.
        </Text>

        <View style={portalStyles.statsGrid}>
          <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{totalCourses}</Text>
            <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Courses</Text>
          </View>
          <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{activeCourses}</Text>
            <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Active Courses</Text>
          </View>
          <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{totalStudents}</Text>
            <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Students</Text>
          </View>
        </View>

        {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        {loadingCourses ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

        {!loadingCourses ? (
          <View style={{ gap: 8 }}>
            {courses.length === 0 ? <Text style={portalStyles.empty}>No courses found.</Text> : null}
            {courses.map((course) => {
              const status = normalizeStatus(course?.status);
              const statusColor = status === 'active' ? '#047857' : '#b45309';
              const courseId = String(course?.id || '');
              const isExpanded = expandedCourseId === courseId;
              const description = String(course?.description || 'No description');
              return (
                <Pressable
                  key={String(course?.id || Math.random())}
                  style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                >
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                    {course?.name || course?.title || 'Untitled course'}
                  </Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    {isExpanded ? description : `${description.slice(0, 90)}${description.length > 90 ? '...' : ''}`}
                  </Text>
                  <View style={[portalStyles.actionRow, { alignItems: 'center', justifyContent: 'space-between' }]}>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      Students: {Number(course?.students || 0)}
                    </Text>
                    <View
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderWidth: 1,
                        borderColor: statusColor,
                      }}
                    >
                      <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>
                        {status === 'active' ? 'Active' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? (
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      Course ID: {courseId || '-'}
                    </Text>
                  ) : null}
                  <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
                    <Pressable
                      onPress={() => setExpandedCourseId((prev) => (prev === courseId ? '' : courseId))}
                      style={portalStyles.secondaryBtn}
                    >
                      <Text style={portalStyles.secondaryBtnText}>{isExpanded ? 'Show less' : 'Show more'}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setSelectedCourseId(courseId);
                        setSearch('');
                        loadStudents(course?.id);
                      }}
                      style={[portalStyles.secondaryBtn, { backgroundColor: '#0d3b66', borderWidth: 1, borderColor: '#0b2f50' }]}
                    >
                      <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff' }]}>View Students</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Students</Text>
        <Pressable
          onPress={() => {
            setSelectedCourseId('');
            setStudents([]);
            setSearch('');
            setError('');
          }}
          style={portalStyles.secondaryBtn}
        >
          <Text style={portalStyles.secondaryBtnText}>Back to Courses</Text>
        </Pressable>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>
          {selectedCourse?.name || 'Selected Course'}
        </Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
          Students: {filteredStudents.length} | Avg Progress: {avgProgress}%
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loadingStudents ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loadingStudents ? (
        <ScrollView style={{ maxHeight: 520 }}>
          <View style={{ gap: 8 }}>
            {filteredStudents.length === 0 ? (
              <Text style={portalStyles.empty}>No active students currently taking this course.</Text>
            ) : null}
            {filteredStudents.map((student, idx) => (
              <View
                key={String(student?.id || `student-${idx}`)}
                style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {String(student?.imageUrl || '').trim() ? (
                    <Image
                      source={toImageSource(String(student.imageUrl), require('../../../assets/alaa.png'))}
                      style={{ width: 40, height: 40, borderRadius: 999 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#dbeafe',
                      }}
                    >
                      <Text style={{ color: '#1d4ed8', fontWeight: '800' }}>{initials(student?.name)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                      {student?.name || 'Unnamed student'}
                    </Text>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      {student?.email || '-'}
                    </Text>
                  </View>
                </View>
                <View style={[portalStyles.actionRow, { marginTop: 8 }]}>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Progress: {Number(student?.progress || 0)}%
                  </Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Status: {String(student?.status || 'in_progress')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

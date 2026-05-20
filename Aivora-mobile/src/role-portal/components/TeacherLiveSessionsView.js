import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_ROUTES } from '@aivora/shared';
import { portalStyles } from '../styles';

const formStyles = {
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  subSectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 4, marginBottom: 2 },
  subSectionWrap: { gap: 6, marginTop: 4 },
  row3: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pickerBtn: { flex: 1, minWidth: 108, minHeight: 38, borderWidth: 1, borderColor: '#cbd5e1' },
  courseScroll: { marginBottom: 4, maxHeight: 90 },
  courseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseChip: { minHeight: 34, borderWidth: 1, borderColor: '#bfdbfe' },
};

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString();
};

const formatTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const toDateInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimeInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function TeacherLiveSessionsView({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [pickerMode, setPickerMode] = useState('');
  const [pickerValue, setPickerValue] = useState(new Date());
  const [pickerDraftValue, setPickerDraftValue] = useState(new Date());
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    repeatWeekly: true,
    repeatCount: '4',
  });

  const loadCourses = useCallback(async () => {
    try {
      const res = await apiFetch(API_ROUTES.teacher.courses, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) return;
      setCourses(Array.isArray(payload?.courses) ? payload.courses : []);
    } catch {}
  }, [apiFetch]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(API_ROUTES.teacher.dashboardLiveSessionsAll, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load sessions');
      setSessions(Array.isArray(payload?.sessions) ? payload.sessions : []);
    } catch (err) {
      setError(err?.message || 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadCourses();
    loadSessions();
  }, [loadCourses, loadSessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        if (view === 'upcoming') return String(session?.status) === 'scheduled';
        if (view === 'past') return String(session?.status) === 'completed';
        return true;
      })
      .filter((session) => {
        const q = String(search || '').toLowerCase();
        if (!q) return true;
        return [session?.title, session?.courseTitle].filter(Boolean).join(' ').toLowerCase().includes(q);
      });
  }, [sessions, search, view]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const upcoming = sessions.filter((s) => s?.status === 'scheduled').length;
    const completed = sessions.filter((s) => s?.status === 'completed').length;
    const attendees = sessions.reduce((sum, s) => sum + Number(s?.attendees || 0), 0);
    const totalStudents = sessions.reduce((sum, s) => sum + Number(s?.totalStudents || 0), 0);
    const avg = totalStudents > 0 ? Math.round((attendees / totalStudents) * 100) : 0;
    return { total, upcoming, completed, avg };
  }, [sessions]);

  const postDashboardAction = async (body) => {
    const res = await apiFetch(API_ROUTES.teacher.dashboard, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || 'Request failed');
    return payload;
  };

  const handleSchedule = async () => {
    if (!form.title.trim() || !form.courseId || !form.date || !form.startTime || !form.endTime || !form.meetingLink.trim()) {
      setError('Title, course, date, start time, end time, and meeting link are required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await postDashboardAction({
        action: 'create_session',
        ...form,
        repeatWeekly: Boolean(form.repeatWeekly),
        repeatCount: Number(form.repeatCount || 1),
      });
      setSuccess('Session scheduled successfully.');
      setShowScheduleForm(false);
      setForm({
        title: '',
        courseId: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        repeatWeekly: true,
        repeatCount: '4',
      });
      await loadSessions();
    } catch (err) {
      setError(err?.message || 'Failed to schedule session');
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = () => {
    const fallback = form.date ? new Date(`${form.date}T09:00:00`) : new Date();
    const nextValue = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
    setPickerValue(nextValue);
    setPickerDraftValue(nextValue);
    setPickerMode('date');
  };

  const openTimePicker = (field) => {
    const baseDate = form.date || toDateInput(new Date());
    const fallback = form[field] ? new Date(`${baseDate}T${form[field]}:00`) : new Date();
    const nextValue = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
    setPickerValue(nextValue);
    setPickerDraftValue(nextValue);
    setPickerMode(field);
  };

  const handlePickerChange = (_event, selectedValue) => {
    if (!selectedValue) {
      setPickerMode('');
      return;
    }
    if (Platform.OS === 'ios') {
      setPickerDraftValue(selectedValue);
      return;
    }
    if (pickerMode === 'date') {
      setForm((prev) => ({ ...prev, date: toDateInput(selectedValue) }));
    } else if (pickerMode === 'startTime') {
      setForm((prev) => ({ ...prev, startTime: toTimeInput(selectedValue) }));
    } else if (pickerMode === 'endTime') {
      setForm((prev) => ({ ...prev, endTime: toTimeInput(selectedValue) }));
    }
    setPickerMode('');
  };

  const handlePickerDone = () => {
    if (pickerMode === 'date') {
      setForm((prev) => ({ ...prev, date: toDateInput(pickerDraftValue) }));
    } else if (pickerMode === 'startTime') {
      setForm((prev) => ({ ...prev, startTime: toTimeInput(pickerDraftValue) }));
    } else if (pickerMode === 'endTime') {
      setForm((prev) => ({ ...prev, endTime: toTimeInput(pickerDraftValue) }));
    }
    setPickerMode('');
  };

  const handleNotify = async (sessionId) => {
    try {
      setError('');
      const data = await postDashboardAction({ action: 'notify_session', sessionId });
      Alert.alert('Reminder sent', `Notified ${Number(data?.notificationsSent || 0)} students.`);
    } catch (err) {
      setError(err?.message || 'Failed to send reminder');
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      setError('');
      await postDashboardAction({ action: 'delete_session', sessionId });
      setSuccess('Session deleted.');
      await loadSessions();
    } catch (err) {
      setError(err?.message || 'Failed to delete session');
    }
  };

  const handleCopyLink = async (link) => {
    const value = String(link || '').trim();
    if (!value) return;
    try {
      await Clipboard.setStringAsync(value);
      setSuccess('Meeting link copied.');
    } catch {
      Alert.alert('Meeting Link', value);
    }
  };

  const handleComplete = async (sessionId) => {
    try {
      setError('');
      await postDashboardAction({ action: 'complete_session', sessionId, attendedStudentIds: [] });
      setSuccess('Session marked as completed.');
      await loadSessions();
    } catch (err) {
      setError(err?.message || 'Failed to complete session');
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Live Sessions</Text>
        <Pressable
          onPress={() => setShowScheduleForm((prev) => !prev)}
          style={[portalStyles.secondaryBtn, { backgroundColor: '#0d3b66', borderWidth: 1, borderColor: '#0b2f50' }]}
        >
          <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff' }]}>
            {showScheduleForm ? 'Close' : 'Schedule Session'}
          </Text>
        </Pressable>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Schedule sessions, notify students, and track outcomes.
      </Text>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stats.total}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Sessions</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stats.upcoming}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Upcoming</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stats.completed}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Completed</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stats.avg}%</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Avg Attendance</Text>
        </View>
      </View>

      {showScheduleForm ? (
        <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Schedule Weekly Session</Text>
          <View style={formStyles.subSectionWrap}>
            <Text style={[formStyles.subSectionTitle, { color: theme.textPrimary }]}>Session Details</Text>
            <Text style={[formStyles.sectionLabel, { color: theme.textMuted }]}>Session Title</Text>
            <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="e.g. Weekly Q&A" placeholderTextColor="#94a3b8" style={portalStyles.input} />
            <Text style={[formStyles.sectionLabel, { color: theme.textMuted }]}>Course</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={formStyles.courseScroll}>
              <View style={formStyles.courseRow}>
                {courses.map((course, idx) => {
                  const id = String(course?.id || '');
                  const active = id === form.courseId;
                  return (
                    <Pressable
                      key={id || `course-${idx}`}
                      onPress={() => setForm((p) => ({ ...p, courseId: id }))}
                      style={[
                        portalStyles.secondaryBtn,
                        formStyles.courseChip,
                        active && { backgroundColor: '#bfdbfe', borderColor: '#60a5fa' },
                      ]}
                    >
                      <Text style={portalStyles.secondaryBtnText}>{String(course?.name || course?.title || 'Untitled course')}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            {!courses.length ? <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No courses found.</Text> : null}
            <Text style={[formStyles.sectionLabel, { color: theme.textMuted }]}>Description</Text>
            <TextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="What will be covered?" placeholderTextColor="#94a3b8" style={portalStyles.input} />
          </View>
          <View style={formStyles.subSectionWrap}>
            <Text style={[formStyles.subSectionTitle, { color: theme.textPrimary }]}>Date & Time</Text>
            <View style={formStyles.row3}>
              <Pressable onPress={openDatePicker} style={[portalStyles.secondaryBtn, formStyles.pickerBtn]}>
                <Text style={portalStyles.secondaryBtnText}>{form.date || 'Select date'}</Text>
              </Pressable>
              <Pressable onPress={() => openTimePicker('startTime')} style={[portalStyles.secondaryBtn, formStyles.pickerBtn]}>
                <Text style={portalStyles.secondaryBtnText}>{form.startTime || 'Start time'}</Text>
              </Pressable>
              <Pressable onPress={() => openTimePicker('endTime')} style={[portalStyles.secondaryBtn, formStyles.pickerBtn]}>
                <Text style={portalStyles.secondaryBtnText}>{form.endTime || 'End time'}</Text>
              </Pressable>
            </View>
          </View>
          <View style={formStyles.subSectionWrap}>
            <Text style={[formStyles.subSectionTitle, { color: theme.textPrimary }]}>Meeting Details</Text>
            <Text style={[formStyles.sectionLabel, { color: theme.textMuted }]}>Meeting Link</Text>
            <TextInput value={form.meetingLink} onChangeText={(v) => setForm((p) => ({ ...p, meetingLink: v }))} placeholder="https://..." placeholderTextColor="#94a3b8" style={portalStyles.input} />
          </View>
          <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
            <Pressable onPress={() => setForm((p) => ({ ...p, repeatWeekly: !p.repeatWeekly }))} style={portalStyles.secondaryBtn}>
              <Text style={portalStyles.secondaryBtnText}>{form.repeatWeekly ? 'Repeat: Weekly' : 'Repeat: Off'}</Text>
            </Pressable>
            <TextInput value={String(form.repeatCount)} onChangeText={(v) => setForm((p) => ({ ...p, repeatCount: v.replace(/[^0-9]/g, '') }))} placeholder="Weeks (1-12)" placeholderTextColor="#94a3b8" style={[portalStyles.input, { width: 120 }]} keyboardType="numeric" />
            <Pressable onPress={handleSchedule} disabled={saving} style={[portalStyles.secondaryBtn, { backgroundColor: '#0d3b66', borderWidth: 1, borderColor: '#0b2f50' }]}>
              <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff' }]}>{saving ? 'Saving...' : 'Schedule Session'}</Text>
            </Pressable>
          </View>
          {pickerMode && Platform.OS !== 'ios' ? (
            <DateTimePicker
              mode={pickerMode === 'date' ? 'date' : 'time'}
              value={pickerValue}
              is24Hour={true}
              onChange={handlePickerChange}
            />
          ) : null}
        </View>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={Boolean(pickerMode)} transparent animationType="slide" onRequestClose={() => setPickerMode('')}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.35)' }}>
            <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 20, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Pressable onPress={() => setPickerMode('')}>
                  <Text style={{ color: '#64748b', fontWeight: '700' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handlePickerDone}>
                  <Text style={{ color: '#1d4ed8', fontWeight: '800' }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode={pickerMode === 'date' ? 'date' : 'time'}
                value={pickerDraftValue}
                display="spinner"
                is24Hour={true}
                onChange={handlePickerChange}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
          {['upcoming', 'past', 'all'].map((v) => (
            <Pressable key={v} onPress={() => setView(v)} style={[portalStyles.secondaryBtn, view === v && { backgroundColor: '#bfdbfe', borderWidth: 1, borderColor: '#60a5fa' }]}>
              <Text style={portalStyles.secondaryBtnText}>{v === 'upcoming' ? 'Upcoming' : v === 'past' ? 'Past' : 'All'}</Text>
            </Pressable>
          ))}
          <Pressable onPress={loadSessions} style={portalStyles.secondaryBtn}>
            <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
          </Pressable>
        </View>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search by title or course..." placeholderTextColor="#94a3b8" style={portalStyles.input} />
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {success ? <Text style={portalStyles.summary}>{success}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading ? (
        <ScrollView style={{ maxHeight: 520 }}>
          <View style={{ gap: 8 }}>
            {filteredSessions.length === 0 ? <Text style={portalStyles.empty}>No sessions found.</Text> : null}
            {filteredSessions.map((session, idx) => (
              <View key={String(session?.id || `session-${idx}`)} style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  {session?.title || 'Untitled session'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Course: {session?.courseTitle || '-'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  {formatDate(session?.startAt)} | {formatTime(session?.startAt)} - {formatTime(session?.endAt)}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Status: {session?.status || '-'} | Attendance: {Number(session?.attendees || 0)}/{Number(session?.totalStudents || 0)}
                </Text>
                <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
                  {session?.meetingLink ? (
                    <Pressable onPress={() => handleCopyLink(session?.meetingLink)} style={portalStyles.secondaryBtn}>
                      <Text style={portalStyles.secondaryBtnText}>Copy Link</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => handleNotify(session?.id)} style={portalStyles.secondaryBtn}>
                    <Text style={portalStyles.secondaryBtnText}>Send Reminder</Text>
                  </Pressable>
                  {session?.status !== 'completed' ? (
                    <Pressable onPress={() => handleComplete(session?.id)} style={[portalStyles.secondaryBtn, { backgroundColor: '#dcfce7' }]}>
                      <Text style={[portalStyles.secondaryBtnText, { color: '#166534' }]}>Complete</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => handleDelete(session?.id)} style={[portalStyles.secondaryBtn, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[portalStyles.secondaryBtnText, { color: '#b91c1c' }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';
import { toImageSource } from '../../services/api-client';

const toProgress = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const isCompletedCourse = (course) => {
  const status = String(course?.status || '').toLowerCase();
  const progress = toProgress(course?.progress);
  return status === 'completed' || status === 'passed' || progress >= 100;
};

export default function StudentMyCoursesView({
  data,
  theme,
  initialView = 'in_progress',
  onOpenCourse = () => {},
  onTakeCertificateQuiz = () => {},
}) {
  const [view, setView] = useState(initialView);
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const completedCount = useMemo(
    () => courses.filter((course) => isCompletedCourse(course)).length,
    [courses]
  );
  const inProgressCount = useMemo(
    () => courses.filter((course) => !isCompletedCourse(course)).length,
    [courses]
  );

  const visibleCourses = useMemo(() => {
    if (view === 'all') return courses;
    return courses.filter((course) =>
      view === 'completed' ? isCompletedCourse(course) : !isCompletedCourse(course)
    );
  }, [courses, view]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>My Courses</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Pick up where you left off or review completed courses.
      </Text>
      <View style={portalStyles.financeFilterRow}>
        <Pressable
          onPress={() => setView('in_progress')}
          style={[portalStyles.secondaryBtn, view === 'in_progress' && portalStyles.financeFilterActive]}
        >
          <Text style={portalStyles.secondaryBtnText}>In Progress ({inProgressCount})</Text>
        </Pressable>
        <Pressable
          onPress={() => setView('completed')}
          style={[portalStyles.secondaryBtn, view === 'completed' && portalStyles.financeFilterActive]}
        >
          <Text style={portalStyles.secondaryBtnText}>Completed ({completedCount})</Text>
        </Pressable>
        <Pressable
          onPress={() => setView('all')}
          style={[portalStyles.secondaryBtn, view === 'all' && portalStyles.financeFilterActive]}
        >
          <Text style={portalStyles.secondaryBtnText}>All ({courses.length})</Text>
        </Pressable>
      </View>

      <ScrollView style={portalStyles.dataWrap} contentContainerStyle={portalStyles.dataContent}>
        {visibleCourses.length === 0 ? (
          <Text style={portalStyles.empty}>No courses found.</Text>
        ) : null}

        {visibleCourses.map((course, idx) => {
          const progress = toProgress(course?.progress);
          const completed = isCompletedCourse(course);
          const imageSource = toImageSource(
            String(course?.imageUrl || ''),
            require('../../../assets/p7.png')
          );

          return (
            <View
              key={String(course?.id || `my-course-${idx}`)}
              style={[
                portalStyles.listCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  gap: 8,
                },
              ]}
            >
              <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <Image source={imageSource} style={{ width: '100%', height: 128 }} resizeMode="cover" />
                <View
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 11 }}>{progress}%</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <MaterialCommunityIcons name="play-circle-outline" size={18} color="#2563eb" />
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flexShrink: 1 }]}>
                    {course?.title || 'Untitled course'}
                  </Text>
                </View>
                {completed ? (
                  <View style={{ borderRadius: 999, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#166534', fontSize: 10, fontWeight: '700' }}>Completed</Text>
                  </View>
                ) : null}
              </View>

              <View style={{ height: 8, borderRadius: 999, backgroundColor: '#dbeafe', overflow: 'hidden' }}>
                <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2563eb' }} />
              </View>

              <View style={[portalStyles.actionRow, { flexWrap: 'wrap', marginTop: 2 }]}>
                <Pressable
                  onPress={() => onOpenCourse(course)}
                  style={[portalStyles.chatSendBtn, { backgroundColor: '#2563eb' }]}
                >
                  <Text style={portalStyles.chatSendText}>Open Course</Text>
                </Pressable>
                {completed && !course?.certificateId ? (
                  <Pressable
                    onPress={() => onTakeCertificateQuiz(course)}
                    style={[
                      portalStyles.secondaryBtn,
                      {
                        borderWidth: 1,
                        borderColor: '#bfdbfe',
                        backgroundColor: '#eff6ff',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      },
                    ]}
                  >
                    <Text style={[portalStyles.secondaryBtnText, { color: '#1d4ed8' }]}>Take Certificate Quiz</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

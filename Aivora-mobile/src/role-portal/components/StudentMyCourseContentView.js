import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';

const toNumber = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return n;
};

export default function StudentMyCourseContentView({
  data,
  theme,
  onBackToMyCourses = () => {},
  onOpenLessonPage = () => {},
}) {
  const course = data?.course || {};
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const progress = Math.max(0, Math.min(100, Math.round(toNumber(course?.progressPercentage))));
  const status = String(course?.status || '').toLowerCase();
  const completedCourse = status === 'completed' || status === 'passed' || progress >= 100;

  const allLessons = useMemo(
    () => modules.flatMap((moduleItem) => (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [])),
    [modules]
  );
  const continueLesson = useMemo(
    () => allLessons.find((lesson) => lesson?.unlocked && !lesson?.completed) || allLessons.find((lesson) => lesson?.unlocked) || null,
    [allLessons]
  );

  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [showChaptersList, setShowChaptersList] = useState(false);
  const [showLessonsList, setShowLessonsList] = useState(false);

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => String(moduleItem?.id || '') === String(selectedModuleId || '')) || modules[0] || null,
    [modules, selectedModuleId]
  );

  const lessonsInSelectedModule = Array.isArray(selectedModule?.lessons) ? selectedModule.lessons : [];

  const selectedLesson = useMemo(() => {
    if (!selectedLessonId) return continueLesson;
    return allLessons.find((lesson) => String(lesson?.id || '') === String(selectedLessonId || '')) || continueLesson;
  }, [allLessons, selectedLessonId, continueLesson]);

  useEffect(() => {
    if (!modules.length) return;
    const lastActiveId = String(course?.lastActiveLessonId || '').trim();
    const remembered = allLessons.find((lesson) => lesson?.unlocked && String(lesson?.id || '') === lastActiveId);
    const fallback = continueLesson || allLessons.find((lesson) => lesson?.unlocked) || allLessons[0] || null;
    const initialLesson = remembered || fallback;
    if (!initialLesson) return;
    setSelectedLessonId(String(initialLesson.id || ''));
    const ownerModule = modules.find((moduleItem) =>
      (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).some((lesson) => String(lesson?.id || '') === String(initialLesson.id || ''))
    );
    if (ownerModule?.id) setSelectedModuleId(String(ownerModule.id));
  }, [modules, allLessons, continueLesson, course?.lastActiveLessonId]);

  useEffect(() => {
    if (!selectedModule) return;
    const exists = lessonsInSelectedModule.some((lesson) => String(lesson?.id || '') === String(selectedLessonId || ''));
    if (!exists) {
      const firstUnlocked = lessonsInSelectedModule.find((lesson) => lesson?.unlocked) || lessonsInSelectedModule[0] || null;
      setSelectedLessonId(String(firstUnlocked?.id || ''));
    }
  }, [selectedModule, lessonsInSelectedModule, selectedLessonId]);

  const handleOpenLesson = (lesson) => {
    if (!lesson?.unlocked) return;
    setSelectedLessonId(String(lesson?.id || ''));
    const ownerModule = modules.find((moduleItem) =>
      (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).some((item) => String(item?.id || '') === String(lesson?.id || ''))
    );
    if (ownerModule?.id) {
      setSelectedModuleId(String(ownerModule.id));
    }
    onOpenLessonPage(lesson);
  };


  return (
    <View style={portalStyles.adminWrap}>
      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Pressable onPress={onBackToMyCourses} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#2563eb" />
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Back to My Courses</Text>
          </Pressable>
          <Text style={{ color: '#475569', fontWeight: '700' }}>{progress}%</Text>
        </View>

      </View>

      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>Browse lessons, track progress, and continue where you left off.</Text>

      <View style={[portalStyles.listCard, { padding: 0, overflow: 'hidden', backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: '100%',
              height: 180,
              backgroundColor: '#1e3a8a',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.58)',
              }}
            />
          </View>
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
            <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: '700' }}>{course?.title || 'Course'}</Text>
            <Text style={{ color: '#bfdbfe', marginTop: 4 }}>Continue where you left off and complete each lesson with confidence.</Text>
            {continueLesson ? (
              <Pressable
                onPress={() => onOpenLessonPage(continueLesson)}
                style={{ alignSelf: 'flex-start', marginTop: 12, backgroundColor: '#e0f2fe', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ color: '#075985', fontWeight: '700' }}>Continue Learning</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {completedCourse ? (
        <View
          style={[
            portalStyles.listCard,
            {
              backgroundColor: '#1d4ed8',
              borderColor: '#1e40af',
              gap: 4,
            },
          ]}
        >
          <Text style={{ color: '#dbeafe', fontWeight: '700' }}>Congratulations!</Text>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700' }}>You completed this course.</Text>
          <Text style={{ color: '#bfdbfe' }}>Pass the final quiz with at least 60% to unlock your Aivora certificate.</Text>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <View
          style={[
            portalStyles.listCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              gap: 8,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setShowChaptersList((prev) => !prev);
              if (!showChaptersList) setShowLessonsList(false);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 16 }]}>Chapters</Text>
            <MaterialCommunityIcons
              name={showChaptersList ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#2563eb"
            />
          </Pressable>
          {showChaptersList
            ? modules.map((moduleItem, moduleIndex) => {
                const active = String(moduleItem?.id || '') === String(selectedModule?.id || '');
                return (
                  <Pressable
                    key={`chapter-list-${moduleItem?.id || moduleIndex}`}
                    onPress={() => {
                      setSelectedModuleId(String(moduleItem?.id || ''));
                      const firstUnlocked = (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).find((lesson) => lesson?.unlocked) || (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons[0] : null);
                      if (firstUnlocked?.id) setSelectedLessonId(String(firstUnlocked.id));
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? '#93c5fd' : '#dbe4ef',
                      backgroundColor: active ? '#eff6ff' : '#ffffff',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                    }}
                  >
                    <Text style={{ color: active ? '#1d4ed8' : '#334155', fontWeight: '700' }}>
                      {`CH${moduleIndex + 1}: ${moduleItem?.title || 'Module'}`}
                    </Text>
                  </Pressable>
                );
              })
            : null}
        </View>

        <View
          style={[
            portalStyles.listCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              gap: 8,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setShowLessonsList((prev) => !prev);
              if (!showLessonsList) setShowChaptersList(false);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 16 }]}>Lessons</Text>
            <MaterialCommunityIcons
              name={showLessonsList ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#2563eb"
            />
          </Pressable>
          {showLessonsList && lessonsInSelectedModule.length === 0 ? (
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No lessons in this chapter.</Text>
          ) : null}
          {showLessonsList
            ? lessonsInSelectedModule.map((lesson, lessonIndex) => {
                const active = String(lesson?.id || '') === String(selectedLessonId || '');
                return (
                  <Pressable
                    key={`chapter-lesson-${lesson?.id || lessonIndex}`}
                    onPress={() => lesson?.unlocked && handleOpenLesson(lesson)}
                    disabled={!lesson?.unlocked}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? '#93c5fd' : '#dbe4ef',
                      backgroundColor: active ? '#eff6ff' : '#ffffff',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                      opacity: lesson?.unlocked ? 1 : 0.55,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: active ? '#1d4ed8' : '#334155', fontWeight: '700', flex: 1 }}>
                      {`L${lessonIndex + 1}: ${lesson?.title || 'Lesson'}`}
                    </Text>
                    <MaterialCommunityIcons
                      name={lesson?.unlocked ? 'play-circle-outline' : 'lock-outline'}
                      size={17}
                      color={lesson?.unlocked ? '#2563eb' : '#94a3b8'}
                    />
                  </Pressable>
                );
              })
            : null}
        </View>

        {modules.length === 0 ? <Text style={portalStyles.empty}>No modules found.</Text> : null}

        {modules.map((moduleItem, moduleIndex) => {
          const lessons = Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [];
          const moduleKey = String(moduleItem?.id || `module-${moduleIndex}`);
          const expanded = Boolean(expandedModules[moduleKey]);
          return (
            <View
              key={String(moduleItem?.id || moduleIndex)}
              style={[
                portalStyles.listCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  gap: 8,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 18, flex: 1 }]}>
                  {moduleItem?.title || `Module ${moduleIndex + 1}`}
                </Text>
                <Pressable
                  onPress={() =>
                    setExpandedModules((prev) => ({
                      ...prev,
                      [moduleKey]: !Boolean(prev[moduleKey]),
                    }))
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: '#bfdbfe',
                    backgroundColor: '#eff6ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#1d4ed8"
                  />
                </Pressable>
              </View>
              {String(moduleItem?.description || '').trim() ? (
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{String(moduleItem.description)}</Text>
              ) : null}

              {expanded
                ? lessons.map((lesson, lessonIndex) => (
                <View
                  key={String(lesson?.id || `${moduleIndex}-${lessonIndex}`)}
                  style={{
                    borderWidth: 1,
                    borderColor: lesson?.unlocked ? '#bfdbfe' : '#e2e8f0',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 9,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    backgroundColor: lesson?.unlocked ? '#f8fbff' : '#ffffff',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{lesson?.title || `Lesson ${lessonIndex + 1}`}</Text>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{Math.max(0, Math.round(toNumber(lesson?.durationMinutes)))} min</Text>
                  </View>
                  {lesson?.unlocked ? (
                    <Pressable onPress={() => onOpenLessonPage(lesson)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="play-circle-outline" size={16} color="#2563eb" />
                      <Text style={{ color: '#2563eb', fontWeight: '600' }}>Open</Text>
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="lock-outline" size={16} color="#94a3b8" />
                      <Text style={{ color: '#94a3b8', fontWeight: '600' }}>Locked</Text>
                    </View>
                  )}
                </View>
                  ))
                : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

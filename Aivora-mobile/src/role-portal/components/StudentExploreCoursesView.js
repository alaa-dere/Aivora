import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';
import { toImageSource } from '../../services/api-client';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function StudentExploreCoursesView({ data, theme, onOpenMyCourses = () => {}, onRefresh = () => {} }) {
  const [query, setQuery] = useState('');
  const courses = Array.isArray(data?.courses) ? data.courses : [];

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) =>
      [course?.title, course?.description, course?.teacherName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [courses, query]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Explore Courses</Text>
        <Pressable onPress={onRefresh} style={portalStyles.secondaryBtn}>
          <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
        </Pressable>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>Explore available courses and continue your learning journey.</Text>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search courses..."
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Showing {filtered.length} of {courses.length}</Text>
      </View>

      <ScrollView style={portalStyles.dataWrap} contentContainerStyle={portalStyles.dataContent}>
        {filtered.length === 0 ? <Text style={portalStyles.empty}>No courses found.</Text> : null}
        {filtered.map((course, idx) => {
          const rating = Number(course?.averageRating || 0);
          const roundedRating = clamp(Math.round(rating), 0, 5);
          const reviewCount = Number(course?.evaluationCount || 0);
          const enrolled = Boolean(course?.enrolled);
          const lessonsCount = Math.max(1, Number(course?.lessonCount || 0));
          const durationWeeks = Math.max(1, Number(course?.durationWeeks || 0));
          const imageSource = toImageSource(String(course?.imageUrl || ''), require('../../../assets/p7.png'));

          return (
            <View key={String(course?.id || `course-${idx}`)} style={portalStyles.studentCourseCard}>
              <View style={portalStyles.studentCourseImageWrap}>
                <Image source={imageSource} style={portalStyles.studentCourseImage} resizeMode="cover" />
                <Pressable style={portalStyles.studentCourseFavoriteBtn}>
                  <MaterialCommunityIcons name="heart-outline" size={18} color="#ffffff" />
                </Pressable>
              </View>

              <View style={portalStyles.studentCourseBody}>
                <View style={portalStyles.studentCourseTag}>
                  <Text style={portalStyles.studentCourseTagText}>#Skill Building</Text>
                </View>

                <Text style={portalStyles.studentCourseTitle}>{course?.title || 'Untitled course'}</Text>

                <View style={portalStyles.studentCourseTeacherChip}>
                  <MaterialCommunityIcons name="account-circle-outline" size={16} color="#4b5563" />
                  <Text style={portalStyles.studentCourseTeacherText}>{course?.teacherName || 'Unknown teacher'}</Text>
                </View>

                <View style={portalStyles.studentCourseMetaRow}>
                  <View style={portalStyles.studentCourseMetaItem}>
                    <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color="#64748b" />
                    <Text style={portalStyles.studentCourseMetaText}>{lessonsCount} Lessons</Text>
                  </View>
                  <View style={portalStyles.studentCourseMetaItem}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#64748b" />
                    <Text style={portalStyles.studentCourseMetaText}>{durationWeeks} Week</Text>
                  </View>
                </View>

                <View style={portalStyles.studentCourseRatingRow}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <MaterialCommunityIcons
                      key={`${course?.id || idx}-star-${starIndex}`}
                      name={starIndex < roundedRating ? 'star' : 'star-outline'}
                      size={18}
                      color="#f59e0b"
                    />
                  ))}
                  <Text style={portalStyles.studentCourseRatingText}>
                    {reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount} Reviews)` : 'No reviews yet'}
                  </Text>
                </View>

                <View style={portalStyles.studentCourseFooter}>
                  <Pressable onPress={() => onOpenMyCourses(course)} style={portalStyles.studentCourseCtaBtn}>
                    <Text style={portalStyles.studentCourseCtaText}>{enrolled ? 'Continue Course' : 'Join Our Class'}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#0b5c9e" />
                  </Pressable>

                  <View style={portalStyles.studentCoursePricePill}>
                    <Text style={portalStyles.studentCoursePriceText}>${Number(course?.price || 0)}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { Pressable, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const toList = (value) => (Array.isArray(value) ? value : []);

export default function StudentRecentCoursesView({ data, theme, onOpenCourse = () => {} }) {
  const courses = toList(data?.courses);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Recent Courses</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Continue the courses you viewed recently.
      </Text>

      {courses.length === 0 ? <Text style={portalStyles.empty}>No recently viewed courses.</Text> : null}
      {courses.map((course, idx) => (
        <View
          key={String(course?.id || `recent-${idx}`)}
          style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        >
          <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{course?.title || 'Course'}</Text>
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Instructor: {course?.instructor || 'Unknown'}
          </Text>
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Price: ${Number(course?.price || 0).toFixed(2)} | Students: {Number(course?.students || 0)}
          </Text>
          <Pressable onPress={() => onOpenCourse(course)} style={[portalStyles.secondaryBtn, { marginTop: 8, alignSelf: 'flex-start' }]}>
            <Text style={portalStyles.secondaryBtnText}>Open Course</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

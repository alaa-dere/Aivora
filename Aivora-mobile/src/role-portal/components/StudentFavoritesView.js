import { Alert, Pressable, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const toList = (value) => (Array.isArray(value) ? value : []);

export default function StudentFavoritesView({
  data,
  theme,
  apiFetch,
  onOpenCourse = () => {},
  onRefresh = () => {},
}) {
  const favorites = toList(data?.favorites);

  const removeFavorite = async (courseId) => {
    const id = String(courseId || '').trim();
    if (!id) return;
    try {
      const res = await apiFetch('/api/student/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: id }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to remove favorite');
      onRefresh();
    } catch (err) {
      Alert.alert('Error', String(err?.message || 'Failed to remove favorite'));
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Favorite Courses</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Quickly access courses you saved.
      </Text>

      {favorites.length === 0 ? <Text style={portalStyles.empty}>No favorites yet.</Text> : null}
      {favorites.map((course, idx) => (
        <View
          key={String(course?.id || `fav-${idx}`)}
          style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        >
          <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{course?.title || 'Course'}</Text>
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Teacher: {course?.teacherName || 'Unknown'}
          </Text>
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Lessons: {Number(course?.lessonCount || 0)} | Price: ${Number(course?.price || 0).toFixed(2)}
          </Text>
          <View style={portalStyles.actionRow}>
            <Pressable onPress={() => onOpenCourse(course)} style={portalStyles.secondaryBtn}>
              <Text style={portalStyles.secondaryBtnText}>
                {course?.enrolled ? 'Continue Course' : 'Open Course'}
              </Text>
            </Pressable>
            <Pressable onPress={() => removeFavorite(course?.id)} style={portalStyles.secondaryBtn}>
              <Text style={portalStyles.secondaryBtnText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

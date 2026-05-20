import { Alert, Pressable, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const toList = (value) => (Array.isArray(value) ? value : []);

export default function StudentPathsView({ data, theme, apiFetch, onEnrollmentSuccess = () => {} }) {
  const paths = toList(data?.paths);

  const enrollPath = async (pathItem) => {
    const pathId = String(pathItem?.id || '').trim();
    if (!pathId) return;
    try {
      const response = await apiFetch(`/api/student/paths/${encodeURIComponent(pathId)}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentConfirmed: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to enroll');
      Alert.alert('Enrolled', 'You have been enrolled in this learning path.');
      onEnrollmentSuccess();
    } catch (err) {
      Alert.alert('Enrollment failed', String(err?.message || 'Failed to enroll'));
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Learning Paths</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Enroll in guided bundles of courses.
      </Text>

      {paths.length === 0 ? <Text style={portalStyles.empty}>No learning paths available.</Text> : null}
      {paths.map((pathItem, idx) => {
        const enrolled = Boolean(pathItem?.enrolled);
        return (
          <View
            key={String(pathItem?.id || `path-${idx}`)}
            style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{pathItem?.title || 'Path'}</Text>
            {!!String(pathItem?.description || '').trim() ? (
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{String(pathItem.description).trim()}</Text>
            ) : null}
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Level: {pathItem?.level || '-'} | Category: {pathItem?.categoryName || 'Uncategorized'}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Courses: {Number(pathItem?.coursesCount || 0)} | Hours: {Number(pathItem?.estimatedHours || 0)} | Price: ${Number(pathItem?.price || 0).toFixed(2)}
            </Text>
            {enrolled ? (
              <Text style={[portalStyles.summary, { marginTop: 6 }]}>Already enrolled</Text>
            ) : (
              <Pressable onPress={() => enrollPath(pathItem)} style={[portalStyles.secondaryBtn, { marginTop: 8, alignSelf: 'flex-start' }]}>
                <Text style={portalStyles.secondaryBtnText}>Enroll</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';
import { getActiveApiBaseUrl, toImageSource } from '../../services/api-client';
import * as ImagePicker from 'expo-image-picker';

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US');
};

export default function StudentProfileView({ apiFetch, theme, onProfileUpdated = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const promptOpenSettings = (message) => {
    Alert.alert('Permission Required', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/student/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load profile');
      const student = payload?.student || null;
      setProfile(student);
      setFullName(String(student?.fullName || ''));
      setEmail(String(student?.email || ''));
    } catch (err) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(() => {
    const name = String(profile?.fullName || '').trim();
    if (!name) return 'S';
    return name
      .split(' ')
      .map((part) => String(part || '').trim().charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profile?.fullName]);

  const profileImageSource = useMemo(() => {
    const raw = String(profile?.imageUrl || '').trim();
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return { uri: raw };
    if (raw.startsWith('/')) return { uri: `${getActiveApiBaseUrl()}${raw}` };
    return toImageSource(raw, null);
  }, [profile?.imageUrl]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!String(fullName || '').trim() || !String(email || '').trim()) {
      setError('Full name and email are required.');
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) return setError('Current password is required.');
      if (!newPassword || newPassword.length < 6) return setError('New password must be at least 6 characters.');
      if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    }

    try {
      setSaving(true);
      const body = {
        fullName: String(fullName || '').trim(),
        email: String(email || '').trim(),
        ...(newPassword
          ? {
              currentPassword: String(currentPassword || ''),
              newPassword: String(newPassword || ''),
            }
          : {}),
      };

      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to update profile');
      const nextStudent = payload?.student || null;
      setProfile(nextStudent);
      onProfileUpdated(nextStudent);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhotoFromAsset = async (asset) => {
    if (!asset?.uri) return;
    try {
      setPhotoUploading(true);
      setError('');
      setSuccess('');
      const fileName = asset.fileName || `student-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const formData = new FormData();
      formData.append('image', { uri: asset.uri, name: fileName, type: mimeType });

      const res = await apiFetch('/api/student/profile/photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to upload photo');
      const nextStudent = payload?.student || null;
      setProfile(nextStudent);
      onProfileUpdated(nextStudent);
      setSuccess('Profile photo updated.');
      Alert.alert('Success', 'Profile photo updated.');
    } catch (err) {
      setError(err?.message || 'Failed to upload photo');
      Alert.alert('Photo Upload Failed', err?.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const chooseFromLibrary = async () => {
    try {
      setPhotoOptionsOpen(false);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Allow photo library permission to select a profile photo.');
        if (permission.canAskAgain === false) {
          promptOpenSettings('Photo permission is blocked. Open settings and allow Photos access for Aivora.');
        } else {
          Alert.alert('Permission Required', 'Allow photo library permission to select a profile photo.');
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) {
        Alert.alert('Canceled', 'No photo was selected.');
        return;
      }
      await uploadPhotoFromAsset(result.assets?.[0]);
    } catch (err) {
      setError(err?.message || 'Unable to open photo library.');
      Alert.alert('Photo Picker Error', err?.message || 'Unable to open photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      setPhotoOptionsOpen(false);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Allow camera permission to take a profile photo.');
        if (permission.canAskAgain === false) {
          promptOpenSettings('Camera permission is blocked. Open settings and allow Camera access for Aivora.');
        } else {
          Alert.alert('Permission Required', 'Allow camera permission to take a profile photo.');
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) {
        Alert.alert('Canceled', 'No photo was captured.');
        return;
      }
      await uploadPhotoFromAsset(result.assets?.[0]);
    } catch (err) {
      setError(err?.message || 'Unable to open camera.');
      Alert.alert('Camera Error', err?.message || 'Unable to open camera.');
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Profile</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Manage your personal details and security settings.
      </Text>

      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && error ? <Text style={portalStyles.error}>{error}</Text> : null}

      {!loading && profile ? (
        <ScrollView>
          <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => (profileImageSource ? setPhotoViewerOpen(true) : setPhotoOptionsOpen(true))} style={{ width: 50, height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe', overflow: 'hidden' }}>
                {profileImageSource ? <Image source={profileImageSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={{ color: '#1d4ed8', fontWeight: '800' }}>{initials}</Text>}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{profile.fullName}</Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{profile.email}</Text>
              </View>
            </View>
            <View style={[portalStyles.actionRow, { marginTop: 12 }]}>
              <Pressable onPress={() => setPhotoOptionsOpen(true)} disabled={photoUploading} style={portalStyles.secondaryBtn}>
                <Text style={portalStyles.secondaryBtnText}>{photoUploading ? 'Uploading...' : 'Change Photo'}</Text>
              </Pressable>
              {profileImageSource ? (
                <Pressable onPress={() => setPhotoViewerOpen(true)} style={portalStyles.secondaryBtn}>
                  <Text style={portalStyles.secondaryBtnText}>View Photo</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Status: {String(profile.status || 'active')}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Role: {String(profile.role || 'student')}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Joined: {formatDate(profile.createdAt)}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Last Updated: {formatDate(profile.updatedAt)}</Text>
            </View>
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Personal Information</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor="#94a3b8" style={portalStyles.input} />
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#94a3b8" autoCapitalize="none" style={portalStyles.input} />

            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary, marginTop: 8 }]}>Change Password</Text>
            <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor="#94a3b8" secureTextEntry style={portalStyles.input} />
            <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password (min 6 characters)" placeholderTextColor="#94a3b8" secureTextEntry style={portalStyles.input} />
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#94a3b8" secureTextEntry style={portalStyles.input} />

            {success ? <Text style={{ color: '#15803d', marginBottom: 8 }}>{success}</Text> : null}
            <Pressable onPress={handleSave} disabled={saving} style={[portalStyles.secondaryBtn, { backgroundColor: '#0d3b66', borderColor: '#0b2f50', borderWidth: 1, paddingVertical: 12, borderRadius: 14 }]}>
              <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff', fontWeight: '800' }]}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}

      <Modal visible={photoOptionsOpen} transparent animationType="fade" onRequestClose={() => setPhotoOptionsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>Profile Photo</Text>
            {profileImageSource ? (
              <Pressable onPress={() => { setPhotoOptionsOpen(false); setPhotoViewerOpen(true); }} style={portalStyles.adminSubmenuItemMobile}>
                <Text style={portalStyles.adminSubmenuTextMobile}>Show current photo</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={takePhoto} style={portalStyles.adminSubmenuItemMobile}>
              <Text style={portalStyles.adminSubmenuTextMobile}>Take a photo</Text>
            </Pressable>
            <Pressable onPress={chooseFromLibrary} style={portalStyles.adminSubmenuItemMobile}>
              <Text style={portalStyles.adminSubmenuTextMobile}>Choose from phone</Text>
            </Pressable>
            <Pressable onPress={() => setPhotoOptionsOpen(false)} style={portalStyles.adminSubmenuItemMobile}>
              <Text style={[portalStyles.adminSubmenuTextMobile, { color: '#b91c1c' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={photoViewerOpen} transparent animationType="fade" onRequestClose={() => setPhotoViewerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {profileImageSource ? <Image source={profileImageSource} style={{ width: '100%', height: 320, borderRadius: 16 }} resizeMode="contain" /> : null}
          <Pressable onPress={() => setPhotoViewerOpen(false)} style={[portalStyles.secondaryBtn, { marginTop: 14 }]}>
            <Text style={portalStyles.secondaryBtnText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}


import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminWorkspace from './components/AdminWorkspace';
import JsonCard from './components/JsonCard';
import { ROLE_FEATURES } from './config/role-features';
import { portalStyles } from './styles';
import {
  normalizeResponse,
  replaceEndpointParams,
  resolveRole,
} from './utils/portal-utils';

export default function RolePortalScreen({
  user,
  onBackHome,
  onLogout,
  apiFetch,
}) {
  const role = resolveRole(user?.role);
  if (role === 'admin') {
    return (
      <AdminWorkspace
        user={user}
        onBackHome={onBackHome}
        onLogout={onLogout}
        apiFetch={apiFetch}
      />
    );
  }

  return (
    <GeneralRolePortal
      role={role}
      user={user}
      onBackHome={onBackHome}
      onLogout={onLogout}
      apiFetch={apiFetch}
    />
  );
}

function GeneralRolePortal({ role, user, onBackHome, onLogout, apiFetch }) {
  const insets = useSafeAreaInsets();
  const features = useMemo(() => ROLE_FEATURES[role] || ROLE_FEATURES.student, [role]);
  const [activeFeatureId, setActiveFeatureId] = useState(features[0]?.id || '');
  const [paramValues, setParamValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    if (!features.some((feature) => feature.id === activeFeatureId)) {
      setActiveFeatureId(features[0]?.id || '');
      setRawData(null);
      setError('');
    }
  }, [activeFeatureId, features]);

  const activeFeature =
    features.find((feature) => feature.id === activeFeatureId) || features[0] || null;
  const endpoint = activeFeature
    ? replaceEndpointParams(activeFeature.endpoint, paramValues)
    : '';

  const hasMissingParams =
    !!activeFeature?.params?.some((param) => !String(paramValues[param] || '').trim());

  const loadFeature = async () => {
    if (!activeFeature || hasMissingParams) return;
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load ${activeFeature.title}`);
      }
      setRawData(payload);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
      setRawData(null);
    } finally {
      setLoading(false);
    }
  };

  const markAllStudentNotificationsRead = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch('/api/student/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_all_notifications_read' }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update notifications');
      }
      await loadFeature();
    } catch (err) {
      setError(err?.message || 'Unable to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const normalized = normalizeResponse(rawData);

  return (
    <View style={[portalStyles.page, { paddingTop: Math.max(insets.top + 6, 16) }]}>
      <View style={portalStyles.topBar}>
        <Pressable onPress={onBackHome} style={portalStyles.topBtn}>
          <Text style={portalStyles.topBtnText}>Home</Text>
        </Pressable>
        <View style={portalStyles.topInfo}>
          <Text style={portalStyles.topName} numberOfLines={1}>
            {user?.fullName || user?.email || 'User'}
          </Text>
          <Text style={portalStyles.topRole}>{role.toUpperCase()} WORKSPACE</Text>
        </View>
        <Pressable onPress={onLogout} style={portalStyles.logoutBtn}>
          <Text style={portalStyles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={portalStyles.featureScroll}
        contentContainerStyle={portalStyles.featureRow}
      >
        {features.map((feature) => {
          const active = feature.id === activeFeature?.id;
          return (
            <Pressable
              key={feature.id}
              onPress={() => {
                setActiveFeatureId(feature.id);
                setRawData(null);
                setError('');
              }}
              style={[portalStyles.featurePill, active && portalStyles.featurePillActive]}
            >
              <Text style={[portalStyles.featureText, active && portalStyles.featureTextActive]}>
                {feature.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={portalStyles.panel}>
        <Text style={portalStyles.panelTitle}>{activeFeature?.title}</Text>
        <Text style={portalStyles.endpoint}>{endpoint}</Text>

        {activeFeature?.params?.length ? (
          <View style={portalStyles.paramsWrap}>
            {activeFeature.params.map((param) => (
              <TextInput
                key={param}
                value={paramValues[param] || ''}
                onChangeText={(text) =>
                  setParamValues((prev) => ({
                    ...prev,
                    [param]: text,
                  }))
                }
                placeholder={`Enter ${param}`}
                placeholderTextColor="#718096"
                style={portalStyles.input}
              />
            ))}
          </View>
        ) : null}

        <View style={portalStyles.actionRow}>
          <Pressable
            onPress={loadFeature}
            disabled={loading || hasMissingParams}
            style={[
              portalStyles.loadBtn,
              (loading || hasMissingParams) && portalStyles.loadBtnDisabled,
            ]}
          >
            <Text style={portalStyles.loadText}>
              {loading ? 'Loading...' : `Load ${activeFeature?.title || 'Feature'}`}
            </Text>
          </Pressable>
          {role === 'student' && activeFeature?.id === 'student-notifications' ? (
            <Pressable
              onPress={markAllStudentNotificationsRead}
              disabled={loading}
              style={portalStyles.secondaryBtn}
            >
              <Text style={portalStyles.secondaryBtnText}>Mark All Read</Text>
            </Pressable>
          ) : null}
        </View>

        {hasMissingParams ? (
          <Text style={portalStyles.notice}>Enter required IDs before loading this module.</Text>
        ) : null}
        {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        {!error && rawData ? (
          <Text style={portalStyles.summary}>Loaded: {normalized.summary}</Text>
        ) : null}
      </View>

      <ScrollView style={portalStyles.dataWrap} contentContainerStyle={portalStyles.dataContent}>
        {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
        {!loading && rawData && normalized.items.length === 0 ? (
          <Text style={portalStyles.empty}>No data returned.</Text>
        ) : null}
        {!loading &&
          normalized.items.map((item, idx) => (
            <JsonCard key={`${activeFeature?.id || 'feature'}-${idx}`} item={item} />
          ))}
      </ScrollView>
    </View>
  );
}

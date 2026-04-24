import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_ROUTES } from '@aivora/shared';
import { getActiveApiBaseUrl } from '../services/api-client';
import { downloadCertificatePdfNative } from '../services/certificate-download';
import AdminWorkspace from './components/AdminWorkspace';
import CertificatePreviewCard from './components/CertificatePreviewCard';
import { MOBILE_TABS } from './config/mobile-tabs';
import { ROLE_FEATURES } from './config/role-features';
import { portalStyles } from './styles';
import {
  normalizeResponse,
  replaceEndpointParams,
  resolveRole,
} from './utils/portal-utils';

const LIST_KEYS_PRIORITY = [
  'courses',
  'myCourses',
  'notifications',
  'certificates',
  'paths',
  'leaderboard',
  'transactions',
  'reports',
  'threads',
  'messages',
  'students',
  'teachers',
  'data',
  'items',
];

const prettifyKey = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text || 'N/A';
};

const findFirstArrayInObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];

  for (const key of LIST_KEYS_PRIORITY) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  const dynamicArray = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(dynamicArray) ? dynamicArray : [];
};

const normalizeFeatureItems = (payload) =>
  Array.isArray(payload) ? payload : findFirstArrayInObject(payload);

const pickSummaryStats = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];

  const blocks = [payload, payload.stats, payload.summary, payload.wallet, payload.meta].filter(
    (item) => item && typeof item === 'object' && !Array.isArray(item)
  );

  const stats = [];
  for (const block of blocks) {
    for (const [key, value] of Object.entries(block)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        stats.push({ key, label: prettifyKey(key), value: formatValue(value) });
      }
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const stat of stats) {
    if (seen.has(stat.key)) continue;
    seen.add(stat.key);
    deduped.push(stat);
    if (deduped.length >= 4) break;
  }

  return deduped;
};

const pickPrimaryText = (item) =>
  item?.title ||
  item?.name ||
  item?.fullName ||
  item?.courseTitle ||
  item?.teacherName ||
  item?.studentName ||
  item?.pathName ||
  item?.certificateNo ||
  item?.id ||
  'Untitled item';

const pushDetailRow = (rows, label, value) => {
  if (value === null || value === undefined) return;
  if (typeof value === 'object') return;
  const formatted = formatValue(value);
  if (formatted === 'N/A') return;
  rows.push({ label, value: formatted });
};

const buildDetailRows = (item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
  const rows = [];

  Object.entries(item).forEach(([key, value]) => {
    if (key === 'id' || key === 'title' || key === 'name' || key === 'fullName') return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        pushDetailRow(rows, `${prettifyKey(key)} ${prettifyKey(nestedKey)}`, nestedValue);
      });
      return;
    }
    pushDetailRow(rows, prettifyKey(key), value);
  });

  return rows;
};

const isNotificationsFeatureId = (featureId) =>
  featureId === 'student-notifications' || featureId === 'teacher-notifications';

const isCertificatesFeatureId = (featureId) =>
  featureId === 'student-certificates' || featureId === 'teacher-certificates';

const getNotificationKey = (item, fallbackKey = '') =>
  `${String(item?.type || 'notification')}:${String(item?.id || fallbackKey)}`;

const getFirstSentence = (message) => {
  const text = String(message || '').trim();
  if (!text) return '';
  const sentenceMatch = text.match(/^.*?[.!?؟](?:\s|$)/);
  if (sentenceMatch) return sentenceMatch[0].trim();
  const firstLine = text.split('\n').find((line) => String(line || '').trim());
  return firstLine ? firstLine.trim() : text;
};

const getNotificationReadState = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(item, 'readAt')) return Boolean(item.readAt);
  if (typeof item.read === 'boolean') return item.read;
  return false;
};

const canMarkNotificationRead = (role, item) => {
  const id = String(item?.id || '').trim();
  if (!id) return false;
  if (role === 'student') return true;
  if (role !== 'teacher') return false;
  return ['admin_message', 'student_message', 'teacher_notification', 'quiz_result'].includes(
    String(item?.type || '')
  );
};

const formatNotificationDate = (item) => {
  const rawDate = item?.createdAt || item?.date || item?.time;
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return String(rawDate);
  return parsed.toLocaleString();
};


const pickCount = (payload) => {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return 0;
  }
  if (Array.isArray(payload)) {
    return payload.length;
  }
  if (Array.isArray(payload.notifications)) {
    return payload.notifications.length;
  }
  if (Array.isArray(payload.messages)) {
    return payload.messages.length;
  }

  const directKeys = ['count', 'unreadCount', 'notificationsCount', 'total', 'unread'];
  for (const key of directKeys) {
    const maybeValue = payload[key];
    if (typeof maybeValue === 'number' && Number.isFinite(maybeValue)) {
      return maybeValue;
    }
  }

  const firstNumber = Object.values(payload).find(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );
  return typeof firstNumber === 'number' ? firstNumber : 0;
};

const getRoleBadgeLoaders = (role) => {
  if (role === 'student') {
    return {
      'student-notifications': [API_ROUTES.student.dashboardNotificationsCount],
      'student-chat': [API_ROUTES.student.chatTeachersUnreadCount],
    };
  }
  if (role === 'teacher') {
    return {
      'teacher-notifications': [API_ROUTES.teacher.dashboardNotificationsCount],
      'teacher-chat': [API_ROUTES.teacher.chatStudentsUnreadCount],
    };
  }
  return {};
};

const areNumberMapsEqual = (left, right) => {
  const leftKeys = Object.keys(left || {});
  const rightKeys = Object.keys(right || {});
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Number(left[key] || 0) === Number(right[key] || 0));
};

const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  return {
    isDark,
    pageBg: isDark ? '#0b1220' : '#f1f5f9',
    panelBg: isDark ? '#111827' : '#ffffff',
    panelBorder: isDark ? '#243041' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#475569',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#243041' : '#e2e8f0',
    topIconBg: isDark ? '#1f2937' : '#e2e8f0',
    navBg: isDark ? '#111827' : '#ffffff',
    navBorder: isDark ? '#243041' : '#dbe4ef',
  };
};

const isMoreTab = (tabId) => String(tabId || '').endsWith('-more');

const canViewCertificateItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (String(item?.status || '').toLowerCase() === 'locked') return false;
  return Boolean(String(item?.id || '').trim());
};

export default function RolePortalScreen({
  user,
  onBackHome,
  onLogout,
  apiFetch,
  themeMode = 'light',
  onToggleTheme = () => {},
}) {
  const role = resolveRole(user?.role);
  if (role === 'admin') {
    return (
      <AdminWorkspace
        user={user}
        onBackHome={onBackHome}
        onLogout={onLogout}
        apiFetch={apiFetch}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
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
      themeMode={themeMode}
      onToggleTheme={onToggleTheme}
    />
  );
}

function GeneralRolePortal({
  role,
  user,
  onBackHome,
  onLogout,
  apiFetch,
  themeMode,
  onToggleTheme,
}) {
  const insets = useSafeAreaInsets();
  const features = useMemo(() => {
    const byRole = ROLE_FEATURES[role];
    if (Array.isArray(byRole)) return byRole;
    if (Array.isArray(ROLE_FEATURES.student)) return ROLE_FEATURES.student;
    return [];
  }, [role]);
  const tabs = useMemo(() => {
    const byRole = MOBILE_TABS[role];
    if (Array.isArray(byRole)) return byRole;
    if (Array.isArray(MOBILE_TABS.student)) return MOBILE_TABS.student;
    return [];
  }, [role]);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');
  const [activeFeatureId, setActiveFeatureId] = useState(tabs[0]?.featureIds?.[0] || features[0]?.id || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [paramValues, setParamValues] = useState({});
  const [tabBadges, setTabBadges] = useState({});
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [viewingCertificateId, setViewingCertificateId] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState(null);
  const featureMap = useMemo(
    () => new Map(features.map((feature) => [feature.id, feature])),
    [features]
  );
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) || tabs[0] || null,
    [activeTabId, tabs]
  );
  const moreTab = useMemo(() => tabs.find((tab) => isMoreTab(tab.id)) || null, [tabs]);
  const theme = useMemo(() => getThemeColors(themeMode), [themeMode]);
  useEffect(() => {
    if (!Array.isArray(features) || !features.some((feature) => feature.id === activeFeatureId)) {
      const nextFeatureId = tabs[0]?.featureIds?.[0] || features[0]?.id || '';
      if (nextFeatureId && nextFeatureId !== activeFeatureId) {
        setActiveFeatureId(nextFeatureId);
        setRawData(null);
        setError('');
      }
    }
  }, [activeFeatureId, features, tabs]);

  useEffect(() => {
    setExpandedNotifications({});
  }, [activeFeatureId]);

  useEffect(() => {
    setSelectedCertificate(null);
  }, [activeFeatureId]);

  useEffect(() => {
    if (!Array.isArray(tabs) || !tabs.some((tab) => tab.id === activeTabId)) {
      const nextTabId = tabs[0]?.id || '';
      if (nextTabId && nextTabId !== activeTabId) {
        setActiveTabId(nextTabId);
      }
      return;
    }
    const containsActiveFeature = activeTab?.featureIds?.includes(activeFeatureId);
    if (!containsActiveFeature) {
      const nextFeatureId = activeTab?.featureIds?.[0] || features[0]?.id || '';
      if (nextFeatureId && nextFeatureId !== activeFeatureId) {
        setActiveFeatureId(nextFeatureId);
        setRawData(null);
        setError('');
      }
    }
  }, [activeFeatureId, activeTab, activeTabId, features, tabs]);

  const activeFeature =
    features.find((feature) => feature.id === activeFeatureId) || features[0] || null;
  const endpoint = activeFeature
    ? replaceEndpointParams(activeFeature.endpoint, paramValues)
    : '';

  const hasMissingParams =
    !!activeFeature?.params?.some((param) => !String(paramValues[param] || '').trim());

  const loadBadges = useCallback(async () => {
    const loaders = getRoleBadgeLoaders(role);
    const tabIds = Object.keys(loaders);
    if (tabIds.length === 0) {
      setTabBadges((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    const badgeEntries = await Promise.all(
      tabIds.map(async (tabId) => {
        const endpoints = loaders[tabId] || [];
        const counts = await Promise.all(
          endpoints.map(async (endpoint) => {
            try {
              const response = await apiFetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              });
              const payload = await response.json();
              if (!response.ok) return 0;
              return pickCount(payload);
            } catch (err) {
              return 0;
            }
          })
        );
        return [tabId, counts.reduce((sum, count) => sum + Number(count || 0), 0)];
      })
    );

    const nextBadges = Object.fromEntries(badgeEntries);
    setTabBadges((prev) => (areNumberMapsEqual(prev, nextBadges) ? prev : nextBadges));
  }, [apiFetch, role]);

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
      loadBadges();
    } catch (err) {
      setError(err?.message || 'Failed to load data');
      setRawData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeFeature || hasMissingParams) return;
    loadFeature();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFeatureId]);

  useEffect(() => {
    loadBadges();
    const timer = setInterval(loadBadges, 45000);
    return () => clearInterval(timer);
  }, [loadBadges]);

  const markAllNotificationsRead = async () => {
    if (!isNotificationsFeatureId(activeFeature?.id)) return;
    try {
      setLoading(true);
      setError('');
      const targetEndpoint =
        role === 'teacher' ? API_ROUTES.teacher.dashboard : API_ROUTES.student.dashboard;
      const response = await apiFetch(targetEndpoint, {
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
      await loadBadges();
    } catch (err) {
      setError(err?.message || 'Unable to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (item) => {
    if (!canMarkNotificationRead(role, item)) return;
    try {
      setLoading(true);
      setError('');
      const targetEndpoint =
        role === 'teacher' ? API_ROUTES.teacher.dashboard : API_ROUTES.student.dashboard;
      const body =
        role === 'teacher'
          ? {
              action: 'mark_notification_read',
              id: item?.id,
              type: item?.type,
            }
          : {
              action: 'mark_notification_read',
              id: item?.id,
            };
      const response = await apiFetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update notification');
      }
      await loadFeature();
      await loadBadges();
    } catch (err) {
      setError(err?.message || 'Unable to update notification');
    } finally {
      setLoading(false);
    }
  };

  const normalized = normalizeResponse(rawData);
  const featureItems = normalizeFeatureItems(rawData);
  const summaryStats = pickSummaryStats(rawData);
  const isNotificationsFeature = isNotificationsFeatureId(activeFeature?.id);
  const isCertificatesFeature = isCertificatesFeatureId(activeFeature?.id);

  const handleViewCertificate = async (item) => {
    if (!activeFeature || !isCertificatesFeature || !canViewCertificateItem(item)) return;
    const certificateId = String(item?.id || '').trim();
    if (!certificateId) return;

    try {
      setViewingCertificateId(certificateId);
      setError('');
      const response = await apiFetch(`${activeFeature.endpoint}/${encodeURIComponent(certificateId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to load certificate');
      }
      setSelectedCertificate(payload?.certificate || null);
    } catch (err) {
      setSelectedCertificate(null);
      setError(err?.message || 'Unable to load certificate preview.');
    } finally {
      setViewingCertificateId('');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!activeFeature || !isCertificatesFeature || !selectedCertificate?.id) return;
    try {
      setDownloadingCertificate(true);
      setError('');
      const fileUri = await downloadCertificatePdfNative({
        certificate: selectedCertificate,
        baseUrl: getActiveApiBaseUrl(),
      });
      Alert.alert('Download complete', `Certificate saved to:\n${fileUri}`);
    } catch (err) {
      setError(err?.message || 'Unable to download certificate.');
    } finally {
      setDownloadingCertificate(false);
    }
  };

  return (
    <View
      style={[
        portalStyles.page,
        {
          paddingTop: Math.max(insets.top + 6, 16),
          paddingBottom: Math.max(insets.bottom + 72, 84),
          backgroundColor: theme.pageBg,
        },
      ]}
    >
      <View style={portalStyles.topBar}>
        <View style={portalStyles.topLogoWrap}>
          <Image
            source={require('../../assets/alaa.png')}
            style={[portalStyles.topLogo, { tintColor: theme.isDark ? '#f8fafc' : '#0f2740' }]}
            resizeMode="contain"
          />
        </View>
        <View style={portalStyles.topBarSpacer} />
        <Pressable style={portalStyles.themeToggleBtn} onPress={onBackHome}>
          <MaterialCommunityIcons
            name="home"
            size={20}
            color={theme.isDark ? '#e2e8f0' : '#334155'}
          />
        </Pressable>
        <Pressable style={portalStyles.themeToggleBtn} onPress={onToggleTheme}>
          <MaterialCommunityIcons
            name={theme.isDark ? 'weather-sunny' : 'weather-night'}
            size={20}
            color={theme.isDark ? '#fbbf24' : '#334155'}
          />
        </Pressable>
        <View style={portalStyles.userAvatar}>
          <Text style={portalStyles.userAvatarText}>
            {String(user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Pressable onPress={onLogout} style={portalStyles.themeToggleBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={theme.isDark ? '#fecaca' : '#b91c1c'} />
        </Pressable>
      </View>

      <View style={[portalStyles.panel, { backgroundColor: theme.panelBg, borderColor: theme.panelBorder }]}>
        <Text style={[portalStyles.panelTitle, { color: theme.textPrimary }]}>{activeFeature?.title}</Text>

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

        {isNotificationsFeature ? (
          <View style={portalStyles.actionRow}>
            <Pressable
              onPress={markAllNotificationsRead}
              disabled={loading}
              style={portalStyles.secondaryBtn}
            >
              <Text style={portalStyles.secondaryBtnText}>Mark All As Read</Text>
            </Pressable>
          </View>
        ) : null}

        {hasMissingParams ? (
          <Text style={portalStyles.notice}>Enter required IDs before loading this module.</Text>
        ) : null}
        {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        {!error && rawData ? (
          <Text style={portalStyles.summary}>Loaded: {normalized.summary}</Text>
        ) : null}
      </View>

      {summaryStats.length > 0 ? (
        <View style={portalStyles.statsGrid}>
          {summaryStats.map((stat) => (
            <View
              key={stat.key}
              style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stat.value}</Text>
              <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ScrollView style={portalStyles.dataWrap} contentContainerStyle={portalStyles.dataContent}>
        {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
        {!loading && !selectedCertificate && rawData && featureItems.length === 0 ? (
          <Text style={portalStyles.empty}>No data returned.</Text>
        ) : null}
        {!loading && selectedCertificate ? (
          <CertificatePreviewCard
            certificate={selectedCertificate}
            theme={theme}
            baseUrl={getActiveApiBaseUrl()}
            onBack={() => setSelectedCertificate(null)}
            onDownload={handleDownloadCertificate}
            downloading={downloadingCertificate}
          />
        ) : null}
        {!loading &&
          !selectedCertificate &&
          featureItems.map((item, idx) => {
            if (isNotificationsFeature) {
              const itemKey = getNotificationKey(item, String(idx));
              return (
                <NotificationEntityCard
                  key={`${activeFeature?.id || 'feature'}-${itemKey}`}
                  item={item}
                  theme={theme}
                  expanded={Boolean(expandedNotifications[itemKey])}
                  onToggleExpanded={() =>
                    setExpandedNotifications((prev) => ({
                      ...prev,
                      [itemKey]: !Boolean(prev[itemKey]),
                    }))
                  }
                  onMarkAsRead={() => markNotificationAsRead(item)}
                  canMarkAsRead={canMarkNotificationRead(role, item)}
                  isUpdating={loading}
                />
              );
            }
            return (
              <FeatureEntityCard
                key={`${activeFeature?.id || 'feature'}-${idx}`}
                item={item}
                theme={theme}
                canViewCertificate={isCertificatesFeature && canViewCertificateItem(item)}
                onViewCertificate={() => handleViewCertificate(item)}
                isOpeningCertificate={viewingCertificateId === String(item?.id || '').trim()}
              />
            );
          })}
      </ScrollView>

      <View
        style={[
          portalStyles.bottomNav,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: theme.navBg,
            borderColor: theme.navBorder,
          },
        ]}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTabId && !isMoreTab(tab.id);
          const badge = Number(tabBadges[tab.id] || 0);
          return (
            <Pressable
              key={`bottom-${tab.id}`}
              onPress={() => {
                if (isMoreTab(tab.id)) {
                  setMenuOpen(true);
                  return;
                }
                setActiveTabId(tab.id);
                const firstFeatureId = tab.featureIds?.[0];
                if (firstFeatureId && firstFeatureId !== activeFeatureId) {
                  setActiveFeatureId(firstFeatureId);
                  setRawData(null);
                  setError('');
                }
              }}
              style={portalStyles.bottomNavItem}
            >
              <View style={portalStyles.bottomNavIconRow}>
                <MaterialCommunityIcons
                  name={tab.icon || 'circle'}
                  size={18}
                  color={active ? '#0d3b66' : '#64748b'}
                />
                {badge > 0 ? (
                  <View style={portalStyles.bottomNavBadge}>
                    <Text style={portalStyles.bottomNavBadgeText}>
                      {badge > 99 ? '99+' : String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[portalStyles.bottomNavLabel, active && portalStyles.bottomNavLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {menuOpen ? (
        <View style={portalStyles.menuOverlay}>
          <Pressable style={portalStyles.menuOverlayTouch} onPress={() => setMenuOpen(false)} />
          <View style={portalStyles.menuDrawer}>
            <ScrollView
              style={portalStyles.menuDrawerScroll}
              contentContainerStyle={portalStyles.menuDrawerContent}
              showsVerticalScrollIndicator
            >
              <View style={portalStyles.modalHandle} />
              <View style={portalStyles.modalSheetHeader}>
                <Text style={portalStyles.modalSheetTitle}>More Options</Text>
                <Text style={portalStyles.modalSheetSubtitle}>Quick access to extra modules</Text>
              </View>
              {moreTab ? (
                (() => {
                  const badge = Number(tabBadges[moreTab.id] || 0);
                  const menuFeatures = moreTab.featureIds
                    .map((featureId) => featureMap.get(featureId))
                    .filter(Boolean);
                  return (
                    <View key={`menu-${moreTab.id}`} style={portalStyles.menuSection}>
                      <View style={portalStyles.menuSectionHeader}>
                        <Text style={portalStyles.menuSectionTitle}>{moreTab.title}</Text>
                        {badge > 0 ? (
                          <View style={portalStyles.menuSectionBadge}>
                            <Text style={portalStyles.menuSectionBadgeText}>
                              {badge > 99 ? '99+' : String(badge)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {menuFeatures.map((feature) => {
                        const active = feature.id === activeFeatureId;
                        return (
                          <Pressable
                            key={`menu-feature-${feature.id}`}
                            style={[portalStyles.menuItem, active && portalStyles.menuItemActive]}
                            onPress={() => {
                              setActiveTabId(moreTab.id);
                              setActiveFeatureId(feature.id);
                              setRawData(null);
                              setError('');
                              setMenuOpen(false);
                            }}
                          >
                            <Text style={[portalStyles.menuItemText, active && portalStyles.menuItemTextActive]}>
                              {feature.title}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })()
              ) : (
                <Text style={portalStyles.empty}>No additional modules.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FeatureEntityCard({
  item,
  theme,
  canViewCertificate = false,
  onViewCertificate = () => {},
  isOpeningCertificate = false,
}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const title = pickPrimaryText(item);
  const detailRows = buildDetailRows(item);

  return (
    <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <View style={portalStyles.listItemContent}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{title}</Text>
        {detailRows.length === 0 ? (
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No additional details.</Text>
        ) : (
          detailRows.map((row) => (
            <Text key={`${row.label}-${row.value}`} style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              {row.label}: {row.value}
            </Text>
          ))
        )}
        {canViewCertificate ? (
          <Pressable
            onPress={onViewCertificate}
            disabled={isOpeningCertificate}
            style={[portalStyles.notificationActionBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
          >
            <Text style={portalStyles.notificationActionText}>
              {isOpeningCertificate ? 'Opening...' : 'View'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function NotificationEntityCard({
  item,
  theme,
  expanded,
  onToggleExpanded,
  onMarkAsRead,
  canMarkAsRead,
  isUpdating,
}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const title = pickPrimaryText(item);
  const message = String(item?.message || item?.body || '').trim();
  const firstSentence = getFirstSentence(message);
  const hasMore = Boolean(message) && firstSentence !== message;
  const isRead = getNotificationReadState(item);
  const createdAt = formatNotificationDate(item);
  const displayMessage = expanded || !hasMore ? message || 'No additional details.' : firstSentence;

  return (
    <View
      style={[
        portalStyles.listCard,
        {
          backgroundColor: theme.cardBg,
          borderColor: isRead ? theme.cardBorder : '#60a5fa',
        },
      ]}
    >
      <View style={portalStyles.listItemContent}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{displayMessage}</Text>
        <View style={portalStyles.notificationMetaRow}>
          {createdAt ? (
            <Text style={[portalStyles.notificationMetaText, { color: theme.textMuted }]}>{createdAt}</Text>
          ) : null}
          {hasMore ? (
            <Pressable onPress={onToggleExpanded}>
              <Text style={portalStyles.notificationLinkText}>
                {expanded ? 'Show less' : 'Show more'}
              </Text>
            </Pressable>
          ) : null}
          {canMarkAsRead && !isRead ? (
            <Pressable
              onPress={onMarkAsRead}
              disabled={isUpdating}
              style={portalStyles.notificationActionBtn}
            >
              <Text style={portalStyles.notificationActionText}>Mark as read</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

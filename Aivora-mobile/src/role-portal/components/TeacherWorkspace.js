import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_ROUTES } from '@aivora/shared';
import { MOBILE_TABS } from '../config/mobile-tabs';
import { ROLE_FEATURES } from '../config/role-features';
import { portalStyles } from '../styles';
import { normalizeResponse, replaceEndpointParams } from '../utils/portal-utils';
import CertificatePreviewCard from './CertificatePreviewCard';
import TeacherDashboardView from './TeacherDashboardView';
import TeacherCoursesView from './TeacherCoursesView';
import TeacherCourseContentManager from './TeacherCourseContentManager';
import TeacherQuestionBankView from './TeacherQuestionBankView';
import TeacherStudentsView from './TeacherStudentsView';
import TeacherLiveSessionsView from './TeacherLiveSessionsView';
import TeacherEarningsView from './TeacherEarningsView';
import { TeacherMessagesHubView } from './TeacherChatViews';
import TeacherProfileView from './TeacherProfileView';
import { downloadCertificatePdfNative } from '../../services/certificate-download';
import { getActiveApiBaseUrl, toImageSource } from '../../services/api-client';

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

const FEATURE_ICON_MAP = {
  'teacher-dashboard': 'view-dashboard',
  'teacher-live-sessions': 'video-wireless',
  'teacher-notifications': 'bell',
  'teacher-courses': 'book-education',
  'teacher-students': 'account-group',
  'teacher-question-bank': 'help-box-multiple',
  'teacher-certificates': 'certificate',
  'teacher-messages': 'message-text',
  'teacher-chat': 'forum',
  'teacher-earnings': 'cash-multiple',
  'teacher-profile': 'account-circle',
};

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
    if (Array.isArray(payload[key])) return payload[key];
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

const isNotificationsFeatureId = (featureId) => featureId === 'teacher-notifications';
const isCertificatesFeatureId = (featureId) => featureId === 'teacher-certificates';

const getNotificationKey = (item, fallbackKey = '') =>
  `${String(item?.type || 'notification')}:${String(item?.id || fallbackKey)}`;

const getFirstSentence = (message) => {
  const text = String(message || '').trim();
  if (!text) return '';
  const sentenceMatch = text.match(/^.*?[.!?](?:\s|$)/);
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

const canMarkNotificationRead = (item) => {
  const id = String(item?.id || '').trim();
  if (!id) return false;
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

const canViewCertificateItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (String(item?.status || '').toLowerCase() === 'locked') return false;
  return Boolean(String(item?.id || '').trim());
};

const pickCount = (payload) => {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload;
  if (!payload || typeof payload !== 'object') return 0;
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload.notifications)) return payload.notifications.length;
  if (Array.isArray(payload.messages)) return payload.messages.length;

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
    topBg: isDark ? '#111827' : '#ffffff',
    border: isDark ? '#243041' : '#dbe4ef',
    panelBg: isDark ? '#111827' : '#ffffff',
    panelBorder: isDark ? '#243041' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#475569',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#243041' : '#e2e8f0',
    navBg: isDark ? '#111827' : '#ffffff',
    navBorder: isDark ? '#243041' : '#dbe4ef',
  };
};

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
              <Text style={portalStyles.notificationLinkText}>{expanded ? 'Show less' : 'Show more'}</Text>
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

export default function TeacherWorkspace({
  user,
  onBackHome,
  onLogout,
  apiFetch,
  themeMode = 'light',
  onToggleTheme = () => {},
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const tabs = useMemo(() => MOBILE_TABS.teacher || [], []);
  const features = useMemo(() => ROLE_FEATURES.teacher || [], []);
  const featureMap = useMemo(() => new Map(features.map((feature) => [feature.id, feature])), [features]);
  const theme = useMemo(() => getThemeColors(themeMode), [themeMode]);
  const [currentUser, setCurrentUser] = useState(user || null);

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || 'teacher-home');
  const [activeFeatureId, setActiveFeatureId] = useState(tabs[0]?.featureIds?.[0] || features[0]?.id || 'teacher-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [topBarHeight, setTopBarHeight] = useState(68);

  const [paramValues, setParamValues] = useState({});
  const [tabBadges, setTabBadges] = useState({});
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [viewingCertificateId, setViewingCertificateId] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [contentCourse, setContentCourse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) || tabs[0] || null,
    [activeTabId, tabs]
  );
  const activeFeature = useMemo(
    () => features.find((feature) => feature.id === activeFeatureId) || features[0] || null,
    [activeFeatureId, features]
  );
  const moreTab = useMemo(() => tabs.find((tab) => tab.id === 'teacher-more') || null, [tabs]);

  const endpoint = activeFeature ? replaceEndpointParams(activeFeature.endpoint, paramValues) : '';
  const hasMissingParams =
    !!activeFeature?.params?.some((param) => !String(paramValues[param] || '').trim());

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    setCurrentUser(user || null);
  }, [user]);

  useEffect(() => {
    if (!activeTab?.featureIds?.includes(activeFeatureId)) {
      const nextFeature = activeTab?.featureIds?.[0] || features[0]?.id || '';
      if (nextFeature && nextFeature !== activeFeatureId) {
        setActiveFeatureId(nextFeature);
      }
    }
  }, [activeFeatureId, activeTab, features]);

  useEffect(() => {
    setExpandedNotifications({});
    setSelectedCertificate(null);
  }, [activeFeatureId]);

  const loadBadges = useCallback(async () => {
    const loaders = {
      'teacher-notifications': [API_ROUTES.teacher.dashboardNotificationsCount],
      'teacher-chat': [API_ROUTES.teacher.chatStudentsUnreadCount],
    };

    const badgeEntries = await Promise.all(
      Object.keys(loaders).map(async (tabId) => {
        const endpoints = loaders[tabId] || [];
        const counts = await Promise.all(
          endpoints.map(async (itemEndpoint) => {
            try {
              const res = await apiFetch(itemEndpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              });
              const payload = await res.json();
              if (!res.ok) return 0;
              return pickCount(payload);
            } catch {
              return 0;
            }
          })
        );
        return [tabId, counts.reduce((sum, count) => sum + Number(count || 0), 0)];
      })
    );

    const nextBadges = Object.fromEntries(badgeEntries);
    setTabBadges((prev) => (areNumberMapsEqual(prev, nextBadges) ? prev : nextBadges));
  }, [apiFetch]);

  const loadFeature = useCallback(async () => {
    if (!activeFeature || hasMissingParams) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) {
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
  }, [activeFeature, apiFetch, endpoint, hasMissingParams, loadBadges]);

  useEffect(() => {
    if (!activeFeature || hasMissingParams) return;
    loadFeature();
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
      const response = await apiFetch(API_ROUTES.teacher.dashboard, {
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
    if (!canMarkNotificationRead(item)) return;
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(API_ROUTES.teacher.dashboard, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_notification_read',
          id: item?.id,
          type: item?.type,
        }),
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

  const handleViewCertificate = async (item) => {
    if (!activeFeature || !isCertificatesFeatureId(activeFeature.id) || !canViewCertificateItem(item)) return;
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
      if (!response.ok) throw new Error(payload?.message || 'Failed to load certificate');
      setSelectedCertificate(payload?.certificate || null);
    } catch (err) {
      setSelectedCertificate(null);
      setError(err?.message || 'Unable to load certificate preview.');
    } finally {
      setViewingCertificateId('');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!activeFeature || !selectedCertificate?.id) return;
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

  const normalized = normalizeResponse(rawData);
  const featureItems = normalizeFeatureItems(rawData);
  const summaryStats = pickSummaryStats(rawData);
  const isNotificationsFeature = isNotificationsFeatureId(activeFeature?.id);
  const isCertificatesFeature = isCertificatesFeatureId(activeFeature?.id);
  const isDashboardFeature = activeFeature?.id === 'teacher-dashboard';
  const isCoursesFeature = activeFeature?.id === 'teacher-courses';
  const isStudentChatFeature = activeFeature?.id === 'teacher-chat';
  const isAdminMessagesFeature = activeFeature?.id === 'teacher-messages';
  const isProfileFeature = activeFeature?.id === 'teacher-profile';
  const isQuestionBankFeature = activeFeature?.id === 'teacher-question-bank';
  const isStudentsFeature = activeFeature?.id === 'teacher-students';
  const isLiveSessionsFeature = activeFeature?.id === 'teacher-live-sessions';
  const isEarningsFeature = activeFeature?.id === 'teacher-earnings';

  return (
    <View style={[portalStyles.adminShellPage, { backgroundColor: theme.pageBg }]}>
      <View
        style={[
          portalStyles.adminShellTopBar,
          {
            paddingTop: Math.max(insets.top, 8),
            backgroundColor: theme.topBg,
            borderBottomColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          const measuredHeight = Math.round(event?.nativeEvent?.layout?.height || 0);
          if (measuredHeight > 0 && measuredHeight !== topBarHeight) {
            setTopBarHeight(measuredHeight);
          }
        }}
      >
        <View style={portalStyles.adminBrandWrap}>
          <View style={portalStyles.adminLogoWrap}>
            <Image
              source={require('../../../assets/alaa.png')}
              style={[portalStyles.adminLogo, { tintColor: theme.isDark ? '#f8fafc' : '#0f2740' }]}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={portalStyles.adminTopActions}>
          <Pressable style={portalStyles.themeToggleBtn} onPress={onToggleTheme}>
            <MaterialCommunityIcons
              name={theme.isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={theme.isDark ? '#fbbf24' : '#334155'}
            />
          </Pressable>
          <Pressable onPress={onBackHome} style={portalStyles.themeToggleBtn}>
            <MaterialCommunityIcons name="home" size={20} color={theme.isDark ? '#e2e8f0' : '#334155'} />
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTabId('teacher-more');
              setActiveFeatureId('teacher-profile');
              setRawData(null);
              setError('');
            }}
            style={portalStyles.themeToggleBtn}
          >
            {String(currentUser?.imageUrl || '').trim() ? (
              <Image
                source={toImageSource(
                  String(currentUser.imageUrl),
                  require('../../../assets/alaa.png')
                )}
                style={{ width: 24, height: 24, borderRadius: 999 }}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={20}
                color={theme.isDark ? '#e2e8f0' : '#334155'}
              />
            )}
          </Pressable>
          <Pressable onPress={onLogout} style={portalStyles.themeToggleBtn}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.isDark ? '#fecaca' : '#b91c1c'} />
          </Pressable>
        </View>
      </View>

      <View style={[portalStyles.adminShellBody, { marginTop: topBarHeight }]}>
        {isDesktop && sidebarOpen ? (
          <ScrollView
            style={portalStyles.adminSidebar}
            contentContainerStyle={portalStyles.adminSidebarContent}
          >
            <Text style={portalStyles.adminSidebarUser} numberOfLines={1}>
              {currentUser?.fullName || currentUser?.email || 'Teacher'}
            </Text>
            {tabs.map((tab) => (
              <View key={tab.id} style={portalStyles.adminSubmenuWrap}>
                <Text style={portalStyles.adminSubmenuGroupTitle}>{tab.title}</Text>
                {(tab.featureIds || [])
                  .filter((featureId) => !(tab.id === 'teacher-more' && featureId === 'teacher-profile'))
                  .map((featureId) => {
                  const feature = featureMap.get(featureId);
                  if (!feature) return null;
                  const active = activeFeatureId === feature.id;
                  return (
                    <Pressable
                      key={feature.id}
                      style={[portalStyles.adminSubmenuItem, active && portalStyles.adminSubmenuItemActive]}
                      onPress={() => {
                        setActiveTabId(tab.id);
                        setActiveFeatureId(feature.id);
                        setRawData(null);
                        setError('');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons
                          name={FEATURE_ICON_MAP[feature.id] || 'circle-medium'}
                          size={16}
                          color={active ? '#0f2740' : '#cbd5e1'}
                        />
                        <Text style={[portalStyles.adminSubmenuText, active && portalStyles.adminSubmenuTextActive]}>
                          {feature.title}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        ) : null}

        <ScrollView
          style={portalStyles.adminContent}
          contentContainerStyle={[
            portalStyles.adminContentInner,
            { backgroundColor: theme.pageBg },
            !isDesktop && { paddingBottom: Math.max(insets.bottom + 84, 96) },
          ]}
        >
          {isDashboardFeature ? (
            <TeacherDashboardView
              data={rawData}
              loading={loading}
              error={error}
              apiFetch={apiFetch}
              theme={theme}
            />
          ) : null}
          {isCoursesFeature && !contentCourse ? (
            <TeacherCoursesView
              apiFetch={apiFetch}
              theme={theme}
              onManageContent={(course) => {
                setContentCourse(course || null);
              }}
            />
          ) : null}
          {isCoursesFeature && contentCourse ? (
            <TeacherCourseContentManager
              apiFetch={apiFetch}
              theme={theme}
              courseId={String(contentCourse?.id || '')}
              onBack={() => setContentCourse(null)}
            />
          ) : null}
          {isStudentChatFeature ? (
            <TeacherMessagesHubView apiFetch={apiFetch} theme={theme} initialMode="students" />
          ) : null}
          {isAdminMessagesFeature ? (
            <TeacherMessagesHubView apiFetch={apiFetch} theme={theme} initialMode="admin" />
          ) : null}
          {isProfileFeature ? (
            <TeacherProfileView
              apiFetch={apiFetch}
              theme={theme}
              onProfileUpdated={(nextProfile) =>
                setCurrentUser((prev) => ({ ...(prev || {}), ...(nextProfile || {}) }))
              }
            />
          ) : null}
          {isQuestionBankFeature ? <TeacherQuestionBankView apiFetch={apiFetch} theme={theme} /> : null}
          {isStudentsFeature ? <TeacherStudentsView apiFetch={apiFetch} theme={theme} /> : null}
          {isLiveSessionsFeature ? <TeacherLiveSessionsView apiFetch={apiFetch} theme={theme} /> : null}
          {isEarningsFeature ? (
            <TeacherEarningsView
              apiFetch={apiFetch}
              theme={theme}
              onOpenMessages={() => {
                setActiveTabId('teacher-more');
                setActiveFeatureId('teacher-messages');
                setRawData(null);
                setError('');
              }}
              onOpenProfile={() => {
                setActiveTabId('teacher-more');
                setActiveFeatureId('teacher-profile');
                setRawData(null);
                setError('');
              }}
            />
          ) : null}
          {!isDashboardFeature &&
          !isCoursesFeature &&
          !isStudentChatFeature &&
          !isAdminMessagesFeature &&
          !isProfileFeature &&
          !isQuestionBankFeature &&
          !isStudentsFeature &&
          !isLiveSessionsFeature &&
          !isEarningsFeature ? (
          <>
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
                <Pressable onPress={markAllNotificationsRead} disabled={loading} style={portalStyles.secondaryBtn}>
                  <Text style={portalStyles.secondaryBtnText}>Mark All As Read</Text>
                </Pressable>
              </View>
            ) : null}

            {hasMissingParams ? (
              <Text style={portalStyles.notice}>Enter required IDs before loading this module.</Text>
            ) : null}
            {error ? <Text style={portalStyles.error}>{error}</Text> : null}
            {!error && rawData ? <Text style={portalStyles.summary}>Loaded: {normalized.summary}</Text> : null}
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

          <View style={portalStyles.dataWrap}>
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
                      canMarkAsRead={canMarkNotificationRead(item)}
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
          </View>
          </>
          ) : null}
        </ScrollView>

        {!isDesktop && sidebarOpen ? (
          <View style={portalStyles.adminMenuBackdrop}>
            <Pressable style={portalStyles.adminMenuBackdropTouch} onPress={() => setSidebarOpen(false)} />
            <View style={portalStyles.adminDrawerMobile}>
              <ScrollView
                style={portalStyles.adminDrawerScroll}
                contentContainerStyle={[
                  portalStyles.adminSidebarContent,
                  portalStyles.adminSidebarContentMobile,
                ]}
                showsVerticalScrollIndicator
              >
                <View style={portalStyles.modalHandle} />
                <View style={portalStyles.modalSheetHeader}>
                  <Text style={portalStyles.modalSheetTitle}>More Options</Text>
                  <Text style={portalStyles.modalSheetSubtitle}>Quick access to teacher modules</Text>
                </View>
                <Text style={portalStyles.adminSidebarUserMobile} numberOfLines={1}>
                  {currentUser?.fullName || currentUser?.email || 'Teacher'}
                </Text>
                {moreTab ? (
                  <View key={`mobile-${moreTab.id}`} style={portalStyles.adminSubmenuWrapMobile}>
                    <Text style={portalStyles.adminSubmenuGroupTitleMobile}>{moreTab.title}</Text>
                    {(moreTab.featureIds || [])
                      .filter((featureId) => featureId !== 'teacher-profile')
                      .map((featureId) => {
                      const feature = featureMap.get(featureId);
                      if (!feature) return null;
                      const active = activeFeatureId === feature.id;
                      return (
                        <Pressable
                          key={`mobile-${feature.id}`}
                          style={[
                            portalStyles.adminSubmenuItemMobile,
                            active && portalStyles.adminSubmenuItemActiveMobile,
                          ]}
                          onPress={() => {
                            setActiveTabId(moreTab.id);
                            setActiveFeatureId(feature.id);
                            setRawData(null);
                            setError('');
                            setSidebarOpen(false);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, paddingHorizontal: 10 }}>
                            <MaterialCommunityIcons
                              name={FEATURE_ICON_MAP[feature.id] || 'circle-medium'}
                              size={16}
                              color={active ? '#1d4ed8' : '#64748b'}
                            />
                            <Text style={[portalStyles.adminSubmenuTextMobile, active && portalStyles.adminSubmenuTextActiveMobile]}>
                              {feature.title}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={portalStyles.empty}>No additional modules.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </View>

      {!isDesktop ? (
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
            const active = tab.id === activeTabId;
            const badge = Number(tabBadges[tab.id] || 0);
            return (
              <Pressable
                key={`teacher-bottom-${tab.id}`}
                onPress={() => {
                  if (tab.id === 'teacher-more') {
                    setSidebarOpen(true);
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
                  <MaterialCommunityIcons name={tab.icon || 'circle'} size={18} color={active ? '#0d3b66' : '#64748b'} />
                  {badge > 0 ? (
                    <View style={portalStyles.bottomNavBadge}>
                      <Text style={portalStyles.bottomNavBadgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[portalStyles.bottomNavLabel, active && portalStyles.bottomNavLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}


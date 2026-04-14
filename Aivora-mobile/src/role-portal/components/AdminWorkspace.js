import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROLE_FEATURES } from '../config/role-features';
import { portalStyles } from '../styles';
import AdminDashboardView from './AdminDashboardView';
import RevenueAreaChart from './RevenueAreaChart';

function SectionCard({ title, children }) {
  return (
    <View style={portalStyles.adminSection}>
      <Text style={portalStyles.adminSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DataListPage({ title, endpoint, apiFetch, listKey, renderItem }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Failed to load ${title}`);
      const list = Array.isArray(data?.[listKey]) ? data[listKey] : [];
      setItems(list);
    } catch (err) {
      setError(err?.message || `Failed to load ${title}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={portalStyles.adminHeaderTitle}>{title}</Text>
        <Pressable style={portalStyles.adminRefreshBtn} onPress={load} disabled={loading}>
          <Text style={portalStyles.adminRefreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && items.length === 0 ? <Text style={portalStyles.empty}>No records.</Text> : null}
      {!loading &&
        items.map((item, idx) => (
          <View key={item?.id || `${title}-${idx}`} style={portalStyles.listCard}>
            {renderItem(item)}
          </View>
        ))}
    </View>
  );
}

function RevenueTrendPage({ apiFetch }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trend, setTrend] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/dashboard/revenue-trend', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load revenue trend');
      setTrend(Array.isArray(data?.trend) ? data.trend : []);
    } catch (err) {
      setError(err?.message || 'Failed to load revenue trend');
      setTrend([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = trend.reduce((sum, t) => sum + Number(t?.revenue || 0), 0);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={portalStyles.adminHeaderTitle}>Revenue Trend</Text>
        <Pressable style={portalStyles.adminRefreshBtn} onPress={load} disabled={loading}>
          <Text style={portalStyles.adminRefreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading ? (
        <SectionCard title="Last 12 weeks">
          {trend.length === 0 ? <Text style={portalStyles.empty}>No data.</Text> : <RevenueAreaChart trend={trend} />}
          <View style={portalStyles.trendFooter}>
            <Text style={portalStyles.trendFooterLabel}>12-week total</Text>
            <Text style={portalStyles.trendFooterValue}>${total.toFixed(2)}</Text>
          </View>
        </SectionCard>
      ) : null}
    </View>
  );
}

function FinanceReportsPage({ apiFetch }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/finance/reports', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load reports');
      setReport(data);
    } catch (err) {
      setError(err?.message || 'Failed to load reports');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={portalStyles.adminHeaderTitle}>Finance Reports</Text>
        <Pressable style={portalStyles.adminRefreshBtn} onPress={load} disabled={loading}>
          <Text style={portalStyles.adminRefreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && report ? (
        <View style={portalStyles.statsGrid}>
          <View style={portalStyles.statCard}>
            <Text style={portalStyles.statValue}>${Number(report.income || 0).toFixed(2)}</Text>
            <Text style={portalStyles.statLabel}>Income</Text>
          </View>
          <View style={portalStyles.statCard}>
            <Text style={portalStyles.statValue}>${Number(report.teacherProfit || 0).toFixed(2)}</Text>
            <Text style={portalStyles.statLabel}>Teacher Profit</Text>
          </View>
          <View style={portalStyles.statCard}>
            <Text style={portalStyles.statValue}>${Number(report.platformProfit || 0).toFixed(2)}</Text>
            <Text style={portalStyles.statLabel}>Platform Profit</Text>
          </View>
          <View style={portalStyles.statCard}>
            <Text style={portalStyles.statValue}>{Number(report.count || 0)}</Text>
            <Text style={portalStyles.statLabel}>Transactions Count</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function AdminMessagesPage({ apiFetch }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const loadThreads = async () => {
    const res = await apiFetch('/api/admin/messages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load threads');
    const list = Array.isArray(data?.threads) ? data.threads : [];
    setThreads(list);
    if (!activeThread && list.length > 0) {
      setActiveThread(list[0]);
    }
  };

  const loadMessages = async (teacherId) => {
    if (!teacherId) {
      setMessages([]);
      return;
    }
    const res = await apiFetch(`/api/admin/messages?teacherId=${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load conversation');
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      await loadThreads();
    } catch (err) {
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeThread?.teacherId) {
      loadMessages(activeThread.teacherId).catch((err) =>
        setError(err?.message || 'Failed to load conversation')
      );
    }
  }, [activeThread?.teacherId]);

  const handleSend = async () => {
    const body = newMessage.trim();
    if (!body || !activeThread?.teacherId) return;
    try {
      const res = await apiFetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: activeThread.teacherId,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send message');
      setNewMessage('');
      await loadMessages(activeThread.teacherId);
      await loadThreads();
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={portalStyles.adminHeaderTitle}>Teacher Messages</Text>
        <Pressable style={portalStyles.adminRefreshBtn} onPress={loadAll} disabled={loading}>
          <Text style={portalStyles.adminRefreshText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading ? (
        <>
          <SectionCard title="Threads">
            {threads.length === 0 ? (
              <Text style={portalStyles.empty}>No threads yet.</Text>
            ) : (
              threads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={[
                    portalStyles.threadItem,
                    activeThread?.id === thread.id && portalStyles.threadItemActive,
                  ]}
                  onPress={() => setActiveThread(thread)}
                >
                  <Text style={portalStyles.threadTeacher}>{thread.teacherName}</Text>
                  <Text style={portalStyles.threadMeta}>
                    Unread: {Number(thread.unreadCount || 0)}
                  </Text>
                </Pressable>
              ))
            )}
          </SectionCard>

          <SectionCard title={activeThread ? `Chat with ${activeThread.teacherName}` : 'Conversation'}>
            {messages.length === 0 ? (
              <Text style={portalStyles.empty}>No messages.</Text>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    portalStyles.chatBubble,
                    message.senderRole === 'admin'
                      ? portalStyles.chatBubbleAdmin
                      : portalStyles.chatBubbleTeacher,
                  ]}
                >
                  <Text style={portalStyles.chatText}>{message.body}</Text>
                </View>
              ))
            )}
            {activeThread ? (
              <View style={portalStyles.chatComposerRow}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  style={portalStyles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#94a3b8"
                />
                <Pressable style={portalStyles.chatSendBtn} onPress={handleSend}>
                  <Text style={portalStyles.chatSendText}>Send</Text>
                </Pressable>
              </View>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </View>
  );
}

export default function AdminWorkspace({ user, onBackHome, onLogout, apiFetch }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [activeFeatureId, setActiveFeatureId] = useState('admin-stats');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(68);
  const topBarOffset = useRef(new Animated.Value(0)).current;
  const topBarVisibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const activeFeature = useMemo(
    () =>
      ROLE_FEATURES.admin.find((feature) => feature.id === activeFeatureId) ||
      ROLE_FEATURES.admin[0],
    [activeFeatureId]
  );
  const renderAdminNavItems = () => (
    <>
      <Text style={portalStyles.adminSidebarUser} numberOfLines={1}>
        {user?.fullName || user?.email || 'Administrator'}
      </Text>

      <Pressable
        style={[
          portalStyles.adminNavItem,
          activeFeatureId === 'admin-stats' && portalStyles.adminNavItemActive,
        ]}
        onPress={() => {
          setActiveFeatureId('admin-stats');
          if (!isDesktop) setSidebarOpen(false);
        }}
      >
        <Text
          style={[
            portalStyles.adminNavItemText,
            activeFeatureId === 'admin-stats' && portalStyles.adminNavItemTextActive,
          ]}
        >
          Dashboard
        </Text>
      </Pressable>

      <Pressable
        style={portalStyles.adminNavItem}
        onPress={() => setUsersOpen((prev) => !prev)}
      >
        <Text style={portalStyles.adminNavItemText}>Users</Text>
      </Pressable>
      {usersOpen ? (
        <View style={portalStyles.adminSubmenuWrap}>
          <Pressable
            style={[
              portalStyles.adminSubmenuItem,
              activeFeatureId === 'admin-students' && portalStyles.adminSubmenuItemActive,
            ]}
            onPress={() => {
              setActiveFeatureId('admin-students');
              if (!isDesktop) setSidebarOpen(false);
            }}
          >
            <Text
              style={[
                portalStyles.adminSubmenuText,
                activeFeatureId === 'admin-students' && portalStyles.adminSubmenuTextActive,
              ]}
            >
              Students
            </Text>
          </Pressable>
          <Pressable
            style={[
              portalStyles.adminSubmenuItem,
              activeFeatureId === 'admin-teachers' && portalStyles.adminSubmenuItemActive,
            ]}
            onPress={() => {
              setActiveFeatureId('admin-teachers');
              if (!isDesktop) setSidebarOpen(false);
            }}
          >
            <Text
              style={[
                portalStyles.adminSubmenuText,
                activeFeatureId === 'admin-teachers' && portalStyles.adminSubmenuTextActive,
              ]}
            >
              Teachers
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[
          portalStyles.adminNavItem,
          activeFeatureId === 'admin-courses' && portalStyles.adminNavItemActive,
        ]}
        onPress={() => {
          setActiveFeatureId('admin-courses');
          if (!isDesktop) setSidebarOpen(false);
        }}
      >
        <Text
          style={[
            portalStyles.adminNavItemText,
            activeFeatureId === 'admin-courses' && portalStyles.adminNavItemTextActive,
          ]}
        >
          Courses
        </Text>
      </Pressable>

      <Pressable
        style={portalStyles.adminNavItem}
        onPress={() => setFinanceOpen((prev) => !prev)}
      >
        <Text style={portalStyles.adminNavItemText}>Finance</Text>
      </Pressable>
      {financeOpen ? (
        <View style={portalStyles.adminSubmenuWrap}>
          <Pressable
            style={[
              portalStyles.adminSubmenuItem,
              activeFeatureId === 'admin-transactions' && portalStyles.adminSubmenuItemActive,
            ]}
            onPress={() => {
              setActiveFeatureId('admin-transactions');
              if (!isDesktop) setSidebarOpen(false);
            }}
          >
            <Text
              style={[
                portalStyles.adminSubmenuText,
                activeFeatureId === 'admin-transactions' && portalStyles.adminSubmenuTextActive,
              ]}
            >
              Transactions
            </Text>
          </Pressable>
          <Pressable
            style={[
              portalStyles.adminSubmenuItem,
              activeFeatureId === 'admin-reports' && portalStyles.adminSubmenuItemActive,
            ]}
            onPress={() => {
              setActiveFeatureId('admin-reports');
              if (!isDesktop) setSidebarOpen(false);
            }}
          >
            <Text
              style={[
                portalStyles.adminSubmenuText,
                activeFeatureId === 'admin-reports' && portalStyles.adminSubmenuTextActive,
              ]}
            >
              Reports
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[
          portalStyles.adminNavItem,
          activeFeatureId === 'admin-certificates' && portalStyles.adminNavItemActive,
        ]}
        onPress={() => {
          setActiveFeatureId('admin-certificates');
          if (!isDesktop) setSidebarOpen(false);
        }}
      >
        <Text
          style={[
            portalStyles.adminNavItemText,
            activeFeatureId === 'admin-certificates' && portalStyles.adminNavItemTextActive,
          ]}
        >
          Certificates
        </Text>
      </Pressable>
    </>
  );

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    setUsersOpen(activeFeatureId === 'admin-students' || activeFeatureId === 'admin-teachers');
    setFinanceOpen(
      activeFeatureId === 'admin-transactions' || activeFeatureId === 'admin-reports'
    );
  }, [activeFeatureId]);

  const setTopBarVisible = (visible) => {
    if (topBarVisibleRef.current === visible) return;
    topBarVisibleRef.current = visible;
    Animated.timing(topBarOffset, {
      toValue: visible ? 0 : -topBarHeight,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const renderActivePage = () => {
    switch (activeFeature.id) {
      case 'admin-stats':
        return <AdminDashboardView apiFetch={apiFetch} />;
      case 'admin-recent-activity':
        return (
          <DataListPage
            title="Recent Activity"
            endpoint="/api/dashboard/recent-activity"
            apiFetch={apiFetch}
            listKey="activities"
            renderItem={(item) => (
              <>
                <Text style={portalStyles.listItemTitle}>{item.description}</Text>
                <Text style={portalStyles.listItemMeta}>{item.type}</Text>
                <Text style={portalStyles.listItemMeta}>{new Date(item.time).toLocaleString()}</Text>
              </>
            )}
          />
        );
      case 'admin-revenue-trend':
        return <RevenueTrendPage apiFetch={apiFetch} />;
      case 'admin-courses':
        return (
          <DataListPage
            title="Courses"
            endpoint="/api/courses"
            apiFetch={apiFetch}
            listKey="courses"
            renderItem={(course) => (
              <>
                <Text style={portalStyles.listItemTitle}>{course.title}</Text>
                <Text style={portalStyles.listItemMeta}>Teacher: {course.teacherName || '-'}</Text>
                <Text style={portalStyles.listItemMeta}>Status: {course.status}</Text>
                <Text style={portalStyles.listItemMeta}>Students: {Number(course.students || 0)}</Text>
              </>
            )}
          />
        );
      case 'admin-teachers':
        return (
          <DataListPage
            title="Teachers"
            endpoint="/api/teachers/list"
            apiFetch={apiFetch}
            listKey="teachers"
            renderItem={(teacher) => (
              <>
                <Text style={portalStyles.listItemTitle}>{teacher.fullName}</Text>
                <Text style={portalStyles.listItemMeta}>{teacher.id}</Text>
              </>
            )}
          />
        );
      case 'admin-students':
        return (
          <DataListPage
            title="Students"
            endpoint="/api/students"
            apiFetch={apiFetch}
            listKey="students"
            renderItem={(student) => (
              <>
                <Text style={portalStyles.listItemTitle}>{student.fullName}</Text>
                <Text style={portalStyles.listItemMeta}>{student.email}</Text>
                <Text style={portalStyles.listItemMeta}>Status: {student.status}</Text>
              </>
            )}
          />
        );
      case 'admin-categories':
        return (
          <DataListPage
            title="Categories"
            endpoint="/api/categories"
            apiFetch={apiFetch}
            listKey="categories"
            renderItem={(category) => (
              <>
                <Text style={portalStyles.listItemTitle}>{category.name}</Text>
                <Text style={portalStyles.listItemMeta}>Courses: {Number(category.coursesCount || 0)}</Text>
                <Text style={portalStyles.listItemMeta}>Paths: {Number(category.pathsCount || 0)}</Text>
              </>
            )}
          />
        );
      case 'admin-paths':
        return (
          <DataListPage
            title="Paths"
            endpoint="/api/paths"
            apiFetch={apiFetch}
            listKey="paths"
            renderItem={(path) => (
              <>
                <Text style={portalStyles.listItemTitle}>{path.title}</Text>
                <Text style={portalStyles.listItemMeta}>Level: {path.level}</Text>
                <Text style={portalStyles.listItemMeta}>Status: {path.status}</Text>
                <Text style={portalStyles.listItemMeta}>Courses: {Number(path.coursesCount || 0)}</Text>
              </>
            )}
          />
        );
      case 'admin-certificates':
        return (
          <DataListPage
            title="Certificates"
            endpoint="/api/admin/certificates"
            apiFetch={apiFetch}
            listKey="certificates"
            renderItem={(cert) => (
              <>
                <Text style={portalStyles.listItemTitle}>{cert.certificateNo}</Text>
                <Text style={portalStyles.listItemMeta}>Student: {cert.student?.name || '-'}</Text>
                <Text style={portalStyles.listItemMeta}>Course: {cert.course?.title || '-'}</Text>
              </>
            )}
          />
        );
      case 'admin-notifications':
        return (
          <DataListPage
            title="Notifications"
            endpoint="/api/admin/notifications"
            apiFetch={apiFetch}
            listKey="notifications"
            renderItem={(item) => (
              <>
                <Text style={portalStyles.listItemTitle}>{item.title}</Text>
                <Text style={portalStyles.listItemMeta}>{item.message}</Text>
                <Text style={portalStyles.listItemMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
              </>
            )}
          />
        );
      case 'admin-messages':
        return <AdminMessagesPage apiFetch={apiFetch} />;
      case 'admin-transactions':
        return (
          <DataListPage
            title="Finance Transactions"
            endpoint="/api/finance/transactions"
            apiFetch={apiFetch}
            listKey="transactions"
            renderItem={(tx) => (
              <>
                <Text style={portalStyles.listItemTitle}>
                  {tx.studentName || tx.teacherName || tx.courseTitle || 'Transaction'}
                </Text>
                <Text style={portalStyles.listItemMeta}>
                  {tx.type} | {tx.status} | ${Number(tx.amount || 0).toFixed(2)}
                </Text>
                <Text style={portalStyles.listItemMeta}>{tx.dateTime || tx.date || '-'}</Text>
              </>
            )}
          />
        );
      case 'admin-reports':
        return <FinanceReportsPage apiFetch={apiFetch} />;
      default:
        return <AdminDashboardView apiFetch={apiFetch} />;
    }
  };

  return (
    <View style={portalStyles.adminShellPage}>
      <Animated.View
        style={[
          portalStyles.adminShellTopBar,
          {
            paddingTop: Math.max(insets.top, 8),
            transform: [{ translateY: topBarOffset }],
          },
        ]}
        onLayout={(event) => {
          const measuredHeight = Math.round(event.nativeEvent.layout.height);
          if (measuredHeight > 0 && measuredHeight !== topBarHeight) {
            setTopBarHeight(measuredHeight);
          }
        }}
      >
        <View style={portalStyles.adminBrandWrap}>
          <Pressable
            style={portalStyles.adminMenuBtn}
            onPress={() => setSidebarOpen((prev) => !prev)}
          >
            <View style={portalStyles.adminMenuLines}>
              <View style={portalStyles.adminMenuLine} />
              <View style={portalStyles.adminMenuLine} />
              <View style={portalStyles.adminMenuLine} />
            </View>
          </Pressable>
          <Image source={require('../../../assets/alaa.png')} style={portalStyles.adminLogo} resizeMode="contain" />
        </View>
        <View style={portalStyles.adminTopActions}>
          <Pressable onPress={onBackHome} style={portalStyles.adminTopBtn}>
            <Text style={portalStyles.adminTopBtnText}>Home</Text>
          </Pressable>
          <Pressable onPress={onLogout} style={portalStyles.adminTopLogoutBtn}>
            <Text style={portalStyles.adminTopLogoutText}>Logout</Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          portalStyles.adminShellBody,
          {
            marginTop: topBarHeight,
            transform: [{ translateY: topBarOffset }],
          },
        ]}
      >
        {isDesktop && sidebarOpen ? (
          <ScrollView
            style={portalStyles.adminSidebar}
            contentContainerStyle={portalStyles.adminSidebarContent}
          >
            {renderAdminNavItems()}
          </ScrollView>
        ) : null}

        <ScrollView
          style={portalStyles.adminContent}
          contentContainerStyle={portalStyles.adminContentInner}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const currentY = event.nativeEvent.contentOffset.y;
            if (currentY <= 0) {
              setTopBarVisible(true);
              lastScrollYRef.current = 0;
              return;
            }

            const delta = currentY - lastScrollYRef.current;
            if (delta > 8) {
              setTopBarVisible(false);
            } else if (delta < -8) {
              setTopBarVisible(true);
            }
            lastScrollYRef.current = currentY;
          }}
        >
          {renderActivePage()}
        </ScrollView>

        {!isDesktop && sidebarOpen ? (
          <View style={portalStyles.adminMenuBackdrop}>
            <Pressable
              style={portalStyles.adminMenuBackdropTouch}
              onPress={() => setSidebarOpen(false)}
            />
            <View style={portalStyles.adminDrawerMobile}>
              <ScrollView
                style={portalStyles.adminDrawerScroll}
                contentContainerStyle={portalStyles.adminSidebarContent}
                showsVerticalScrollIndicator
              >
                {renderAdminNavItems()}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { portalStyles } from '../styles';
import RevenueAreaChart from './RevenueAreaChart';

const aiInsights = [
  { title: 'Forecast', description: 'Student growth is likely to continue this month.' },
  { title: 'Risk', description: 'Watch failed/pending transactions to reduce churn.' },
  { title: 'Recommendation', description: 'Promote top-performing courses in onboarding.' },
];

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

export default function AdminDashboardView({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeCourses: 0,
    monthlyRevenue: 0,
  });
  const [trend, setTrend] = useState([]);
  const [activities, setActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, trendRes, activityRes, txRes] = await Promise.all([
        apiFetch('/api/dashboard/stats', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        apiFetch('/api/dashboard/revenue-trend', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        apiFetch('/api/dashboard/recent-activity', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        apiFetch('/api/finance/transactions', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ]);

      const [statsData, trendData, activityData, txData] = await Promise.all([
        statsRes.json(),
        trendRes.json(),
        activityRes.json(),
        txRes.json(),
      ]);

      if (!statsRes.ok) throw new Error(statsData?.message || 'Failed to load dashboard stats');
      if (!trendRes.ok) throw new Error(trendData?.message || 'Failed to load revenue trend');
      if (!activityRes.ok) {
        throw new Error(activityData?.message || 'Failed to load recent activity');
      }
      if (!txRes.ok) throw new Error(txData?.message || 'Failed to load transactions');

      setStats({
        totalStudents: Number(statsData?.totalStudents || 0),
        totalTeachers: Number(statsData?.totalTeachers || 0),
        activeCourses: Number(statsData?.activeCourses || 0),
        monthlyRevenue: Number(statsData?.monthlyRevenue || 0),
      });
      setTrend(Array.isArray(trendData?.trend) ? trendData.trend : []);
      setActivities(Array.isArray(activityData?.activities) ? activityData.activities : []);
      setTransactions(
        (Array.isArray(txData?.transactions) ? txData.transactions : []).slice(0, 4)
      );
    } catch (err) {
      setError(err?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalTrendRevenue = useMemo(
    () => trend.reduce((sum, entry) => sum + Number(entry?.revenue || 0), 0),
    [trend]
  );

  const uiTheme = theme || {
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    textPrimary: '#0f172a',
    textMuted: '#64748b',
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: uiTheme.textPrimary }]}>Admin Dashboard</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: uiTheme.textMuted }]}>
        Overview of key metrics, revenue, and recent activity.
      </Text>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading ? (
        <>
          <View style={portalStyles.statsGrid}>
            <View style={[portalStyles.statCard, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: uiTheme.textPrimary }]}>{stats.totalStudents.toLocaleString()}</Text>
              <Text style={[portalStyles.statLabel, { color: uiTheme.textMuted }]}>Total Students</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: uiTheme.textPrimary }]}>{stats.totalTeachers.toLocaleString()}</Text>
              <Text style={[portalStyles.statLabel, { color: uiTheme.textMuted }]}>Total Teachers</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: uiTheme.textPrimary }]}>{stats.activeCourses.toLocaleString()}</Text>
              <Text style={[portalStyles.statLabel, { color: uiTheme.textMuted }]}>Active Courses</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: uiTheme.textPrimary }]}>{formatMoney(stats.monthlyRevenue)}</Text>
              <Text style={[portalStyles.statLabel, { color: uiTheme.textMuted }]}>Monthly Revenue</Text>
            </View>
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: uiTheme.textPrimary }]}>Revenue Trend (Last 12 weeks)</Text>
            {trend.length === 0 ? (
              <Text style={portalStyles.empty}>No revenue trend data.</Text>
            ) : (
              <>
                <RevenueAreaChart trend={trend} />
                <View style={portalStyles.trendFooter}>
                  <Text style={portalStyles.trendFooterLabel}>12-week total</Text>
                  <Text style={portalStyles.trendFooterValue}>{formatMoney(totalTrendRevenue)}</Text>
                </View>
              </>
            )}
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: uiTheme.textPrimary }]}>AI Insights</Text>
            {aiInsights.map((insight) => (
              <View key={insight.title} style={portalStyles.insightRow}>
                <Text style={portalStyles.insightTitle}>{insight.title}</Text>
                <Text style={portalStyles.insightBody}>{insight.description}</Text>
              </View>
            ))}
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: uiTheme.textPrimary }]}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <Text style={portalStyles.empty}>No transactions yet.</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={portalStyles.listItem}>
                  <View style={portalStyles.listItemContent}>
                    <Text style={portalStyles.listItemTitle}>
                      {tx.studentName || tx.teacherName || tx.courseTitle || 'Unknown'}
                    </Text>
                    {tx.courseTitle ? (
                      <Text style={portalStyles.listItemMeta}>Course: {tx.courseTitle}</Text>
                    ) : null}
                    <Text style={portalStyles.listItemMeta}>{tx.dateTime || tx.date || '-'}</Text>
                  </View>
                  <Text style={portalStyles.listItemValue}>{formatMoney(tx.amount)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: uiTheme.cardBg, borderColor: uiTheme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: uiTheme.textPrimary }]}>Recent Activity</Text>
            {activities.length === 0 ? (
              <Text style={portalStyles.empty}>No recent activity.</Text>
            ) : (
              activities.map((item, idx) => (
                <View key={`activity-${idx}`} style={portalStyles.listItem}>
                  <View style={portalStyles.listItemContent}>
                    <Text style={portalStyles.activityType}>{item.type || 'EVENT'}</Text>
                    <Text style={portalStyles.listItemTitle}>{item.description || '-'}</Text>
                    <Text style={portalStyles.listItemMeta}>{formatDateTime(item.time)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

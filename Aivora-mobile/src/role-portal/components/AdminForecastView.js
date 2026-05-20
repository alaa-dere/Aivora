import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { portalStyles } from '../styles';
import RevenueAreaChart from './RevenueAreaChart';

const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function AdminForecastView({ apiFetch, theme }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const isDark = Boolean(theme?.isDark);

  const monthLabel = useMemo(() => {
    const [year, mon] = String(month || '').split('-');
    if (!year || !mon) return month;
    const d = new Date(Number(year), Number(mon) - 1, 1);
    if (Number.isNaN(d.getTime())) return month;
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [month]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [res, trendRes] = await Promise.all([
        apiFetch(`/api/admin/ai/revenue-forecast?month=${encodeURIComponent(month)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        apiFetch('/api/dashboard/revenue-trend', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ]);
      const [payload, trendPayload] = await Promise.all([
        res.json(),
        trendRes.json().catch(() => ({})),
      ]);
      if (!res.ok) throw new Error(payload?.message || 'Failed to load forecast');
      setData(payload);
      if (trendRes.ok && Array.isArray(trendPayload?.trend)) {
        setTrend(trendPayload.trend);
      } else {
        setTrend([]);
      }
    } catch (err) {
      setError(String(err?.message || 'Failed to load forecast'));
      setData(null);
      setTrend([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Finance Forecast</Text>
        <Text style={[portalStyles.aiSourceText, isDark && { color: '#93c5fd' }]}>
          SOURCE: {String(data?.source || '').toLowerCase() === 'openai' ? 'OPENAI' : String(data?.source || 'N/A').toUpperCase()}
        </Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted, marginLeft: 0 }]}>
        Deep view of projected revenue, trend movement, and AI recommendations.
      </Text>

      <View style={portalStyles.adminHeaderActionsRow}>
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="YYYY-MM"
          placeholderTextColor="#94a3b8"
          style={[portalStyles.input, portalStyles.forecastMonthInput]}
        />
        <Pressable
          onPress={load}
          style={[
            portalStyles.adminForecastBtn,
            isDark && { backgroundColor: 'rgba(30, 58, 138, 0.25)', borderColor: '#334155' },
          ]}
          disabled={loading}
        >
          <Text style={[portalStyles.adminForecastBtnText, isDark && { color: '#dbeafe' }]}>
            {loading ? 'Loading...' : monthLabel}
          </Text>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && data ? (
        <>
          <View style={portalStyles.statsGrid}>
            <View style={[portalStyles.statCard, portalStyles.forecastStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={portalStyles.adminSectionStripe} />
              <View style={portalStyles.forecastStatBody}>
                <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(data?.forecastMonthly)}</Text>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Projected Next Month</Text>
              </View>
            </View>
            <View style={[portalStyles.statCard, portalStyles.forecastStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={portalStyles.adminSectionStripe} />
              <View style={portalStyles.forecastStatBody}>
                <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>
                  {Math.round(Number(data?.trendPct || 0) * 100)}%
                </Text>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>4-Week Trend</Text>
              </View>
            </View>
            <View style={[portalStyles.statCard, portalStyles.forecastStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={portalStyles.adminSectionStripe} />
              <View style={portalStyles.forecastStatBody}>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>
                  Last 4 weeks: {money(data?.last4Total)}
                </Text>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted, marginTop: 4 }]}>
                  Previous 4 weeks: {money(data?.prev4Total)}
                </Text>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted, marginTop: 4 }]}>
                  Recent Window Revenue
                </Text>
              </View>
            </View>
          </View>

          <View style={portalStyles.forecastGrid}>
            <View style={[portalStyles.adminSection, portalStyles.forecastLargeCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={portalStyles.adminSectionStripe} />
              <View style={portalStyles.adminSectionHeaderRow}>
                <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Revenue Trend (12 weeks)</Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Updated live</Text>
              </View>
              {trend.length === 0 ? (
                <Text style={portalStyles.empty}>No revenue trend data yet.</Text>
              ) : (
                <RevenueAreaChart trend={trend} theme={theme} />
              )}
            </View>

            <View style={[portalStyles.adminSection, portalStyles.forecastSideCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={portalStyles.adminSectionStripe} />
              <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Top Courses (Recent)</Text>
              {(Array.isArray(data?.topCourses) ? data.topCourses : []).length === 0 ? (
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No course revenue data yet.</Text>
              ) : (
                (Array.isArray(data?.topCourses) ? data.topCourses : []).map((item, idx) => (
                  <View key={`top-course-${idx}`} style={portalStyles.adminListRow}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{item?.title || 'Course'}</Text>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      Revenue: {money(item?.revenue)} | Enrollments: {Number(item?.count || 0)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={portalStyles.adminSectionStripe} />
            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>AI Insights Breakdown</Text>
            {(Array.isArray(data?.insights) ? data.insights : []).map((item, idx) => (
              <View key={`insight-${idx}`} style={portalStyles.adminInsightRow}>
                <Text style={portalStyles.insightTitle}>{item?.title || 'Insight'}</Text>
                <Text style={portalStyles.insightBody}>{item?.description || '-'}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

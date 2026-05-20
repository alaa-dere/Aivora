import { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const CHART_HEIGHT = 204;
const PADDING = { top: 14, right: 12, bottom: 34, left: 8 };

const interpolateCatmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
};

const buildSmoothLinePoints = (points) => {
  if (points.length <= 2) return points;

  const smooth = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const steps = 18;

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      smooth.push(interpolateCatmullRom(p0, p1, p2, p3, t));
    }
  }

  return smooth;
};

export default function RevenueAreaChart({ trend = [], theme }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeIndexRef = useRef(-1);
  const isDark = Boolean(theme?.isDark);
  const colors = {
    wrapBg: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(248, 251, 255, 0.65)',
    wrapBorder: isDark ? '#334155' : 'rgba(219, 234, 254, 0.9)',
    grid: isDark ? 'rgba(148, 163, 184, 0.28)' : '#dbeafe',
    line: isDark ? '#93c5fd' : '#2563eb',
    dot: isDark ? '#60a5fa' : '#1d4ed8',
    dotBorder: isDark ? '#0f172a' : '#ffffff',
    focusLine: isDark ? 'rgba(147, 197, 253, 0.35)' : 'rgba(37, 99, 235, 0.35)',
    tooltipBg: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,0.95)',
    tooltipBorder: isDark ? '#334155' : '#bfdbfe',
    tooltipTitle: isDark ? '#bfdbfe' : '#1e3a8a',
    tooltipValue: isDark ? '#f8fafc' : '#0f172a',
  };

  const { points, xLabels, yTicks, baseY, linePoints, lineSegments } = useMemo(() => {
    if (!width || trend.length === 0) {
      return { points: [], xLabels: [], yTicks: [], baseY: 0, linePoints: [], lineSegments: [] };
    }

    const chartWidth = Math.max(1, width - PADDING.left - PADDING.right);
    const chartHeight = Math.max(1, CHART_HEIGHT - PADDING.top - PADDING.bottom);
    const maxRevenue = Math.max(1, ...trend.map((entry) => Number(entry?.revenue || 0)));

    const computedPoints = trend.map((entry, idx) => {
      const x =
        PADDING.left + (trend.length === 1 ? chartWidth / 2 : (idx / (trend.length - 1)) * chartWidth);
      const normalized = Number(entry?.revenue || 0) / maxRevenue;
      const y = PADDING.top + (1 - normalized) * chartHeight;
      return { x, y, week: entry?.week || `W${idx + 1}` };
    });

    const labels = computedPoints.filter(
      (_, idx) => idx === 0 || idx === computedPoints.length - 1 || idx % 2 === 0
    );

    const ticks = [0.25, 0.5, 0.75, 1].map((v) => {
      const y = PADDING.top + (1 - v) * chartHeight;
      return { y };
    });

    const interpolatedLinePoints = buildSmoothLinePoints(computedPoints);
    const interpolatedLineSegments = [];
    for (let i = 0; i < interpolatedLinePoints.length - 1; i += 1) {
      const start = interpolatedLinePoints[i];
      const end = interpolatedLinePoints[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length <= 0.01) continue;
      interpolatedLineSegments.push({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        length: length + 0.6,
        angle: Math.atan2(dy, dx),
      });
    }

    return {
      points: computedPoints,
      xLabels: labels,
      yTicks: ticks,
      baseY: PADDING.top + chartHeight,
      linePoints: interpolatedLinePoints,
      lineSegments: interpolatedLineSegments,
    };
  }, [trend, width]);

  const selectNearestPoint = (xPosition) => {
    if (!points.length) return;
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    points.forEach((point, idx) => {
      const distance = Math.abs(point.x - xPosition);
      if (distance < nearestDistance) {
        nearest = idx;
        nearestDistance = distance;
      }
    });
    if (activeIndexRef.current !== nearest) {
      activeIndexRef.current = nearest;
      setActiveIndex(nearest);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          selectNearestPoint(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          selectNearestPoint(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setActiveIndex(-1);
          activeIndexRef.current = -1;
        },
        onPanResponderTerminate: () => {
          setActiveIndex(-1);
          activeIndexRef.current = -1;
        },
      }),
    [points]
  );

  const activePoint = activeIndex >= 0 ? points[activeIndex] : null;
  const activeItem = activeIndex >= 0 ? trend[activeIndex] : null;

  return (
    <View
      style={[
        portalStyles.chartWrap,
        { backgroundColor: colors.wrapBg, borderColor: colors.wrapBorder },
      ]}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <View
        style={[portalStyles.chartCanvas, { height: CHART_HEIGHT }]}
        {...panResponder.panHandlers}
      >
        {yTicks.map((tick, idx) => (
          <View
            key={`grid-${idx}`}
            style={[portalStyles.chartGridLine, { top: tick.y, backgroundColor: colors.grid }]}
          />
        ))}

        {lineSegments.map((segment, idx) => (
          <View
            key={`line-segment-${idx}`}
            style={[
              portalStyles.chartLineSegment,
              {
                backgroundColor: colors.line,
                width: segment.length,
                left: segment.x - segment.length / 2,
                top: segment.y - 1,
                transform: [{ rotateZ: `${segment.angle}rad` }],
              },
            ]}
          />
        ))}

        {points.map((point, idx) => (
          <View
            key={`dot-${idx}`}
            style={[
              activeIndex === idx ? portalStyles.chartDotActive : portalStyles.chartDot,
              {
                backgroundColor: colors.dot,
                borderColor: colors.dotBorder,
                left: point.x - 4,
                top: point.y - 4,
              },
            ]}
          />
        ))}

        {activePoint ? (
          <>
            <View
              style={[
                portalStyles.chartFocusLine,
                {
                  left: activePoint.x,
                  top: PADDING.top,
                  height: baseY - PADDING.top,
                  backgroundColor: colors.focusLine,
                },
              ]}
            />
            <View
              style={[
                portalStyles.chartTooltip,
                {
                  backgroundColor: colors.tooltipBg,
                  borderColor: colors.tooltipBorder,
                  left: Math.max(6, Math.min(activePoint.x - 54, width - 118)),
                  top: Math.max(4, activePoint.y - 48),
                },
              ]}
            >
              <Text style={[portalStyles.chartTooltipTitle, { color: colors.tooltipTitle }]}>
                {String(activeItem?.week || '-')}
              </Text>
              <Text style={[portalStyles.chartTooltipValue, { color: colors.tooltipValue }]}>
                ${Number(activeItem?.revenue || 0).toFixed(2)}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={portalStyles.xAxisRow}>
        {xLabels.map((label) => (
          <Text
            key={`${label.week}-${label.x}`}
            style={[portalStyles.xAxisLabel, { color: isDark ? '#bfdbfe' : '#64748b' }]}
          >
            {label.week}
          </Text>
        ))}
      </View>
    </View>
  );
}

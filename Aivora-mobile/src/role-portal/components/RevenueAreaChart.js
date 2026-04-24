import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { portalStyles } from '../styles';

const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 34, left: 8 };

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

export default function RevenueAreaChart({ trend = [] }) {
  const [width, setWidth] = useState(0);

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

  return (
    <View
      style={portalStyles.chartWrap}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={[portalStyles.chartCanvas, { height: CHART_HEIGHT }]}>
        {yTicks.map((tick, idx) => (
          <View
            key={`grid-${idx}`}
            style={[portalStyles.chartGridLine, { top: tick.y }]}
          />
        ))}

        {points.map((point, idx) => (
          <View
            key={`area-${idx}`}
            style={[
              portalStyles.areaColumn,
              {
                left: point.x - 4,
                top: point.y,
                height: Math.max(baseY - point.y, 2),
              },
            ]}
          />
        ))}

        {lineSegments.map((segment, idx) => (
          <View
            key={`line-segment-${idx}`}
            style={[
              portalStyles.chartLineSegment,
              {
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
              portalStyles.chartDot,
              {
                left: point.x - 4,
                top: point.y - 4,
              },
            ]}
          />
        ))}
      </View>

      <View style={portalStyles.xAxisRow}>
        {xLabels.map((label) => (
          <Text key={`${label.week}-${label.x}`} style={portalStyles.xAxisLabel}>
            {label.week}
          </Text>
        ))}
      </View>
    </View>
  );
}

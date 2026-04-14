import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { portalStyles } from '../styles';

const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 34, left: 8 };

export default function RevenueAreaChart({ trend = [] }) {
  const [width, setWidth] = useState(0);

  const { points, xLabels, yTicks, baseY, linePoints } = useMemo(() => {
    if (!width || trend.length === 0) {
      return { points: [], xLabels: [], yTicks: [], baseY: 0, linePoints: [] };
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

    const interpolatedLinePoints = [];
    for (let i = 0; i < computedPoints.length - 1; i += 1) {
      const start = computedPoints[i];
      const end = computedPoints[i + 1];
      const steps = 16;
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        interpolatedLinePoints.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        });
      }
    }

    return {
      points: computedPoints,
      xLabels: labels,
      yTicks: ticks,
      baseY: PADDING.top + chartHeight,
      linePoints: interpolatedLinePoints,
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

        {linePoints.map((point, idx) => (
          <View
            key={`line-point-${idx}`}
            style={[
              portalStyles.linePoint,
              {
                left: point.x - 1.5,
                top: point.y - 1.5,
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

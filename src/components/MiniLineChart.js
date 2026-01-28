import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';

export default function MiniLineChart({ 
  data = [], 
  width = 300, 
  height = 180,
  color = colors.primary,
  showLabels = true,
}) {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Generate path
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    ...d,
  }));

  // Create smooth curve path
  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[i - 1];
    const cpx = (prevPoint.x + point.x) / 2;
    return `${path} Q ${cpx} ${prevPoint.y} ${cpx} ${(prevPoint.y + point.y) / 2} T ${point.x} ${point.y}`;
  }, '');

  // Area path (for gradient fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [maxValue, (maxValue + minValue) / 2, minValue].map((v, i) => ({
    value: `$${(v / 1000).toFixed(1)}k`,
    y: padding.top + (i * chartHeight) / 2,
  }));

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke={colors.border}
            strokeDasharray="4,4"
            strokeWidth={1}
          />
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colors.surface}
            stroke={color}
            strokeWidth={2}
          />
        ))}

        {/* Y-axis labels */}
        {showLabels && yLabels.map((label, i) => (
          <SvgText
            key={i}
            x={padding.left - 8}
            y={label.y + 4}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {label.value}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {showLabels && points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map((point, i) => (
          <SvgText
            key={i}
            x={point.x}
            y={height - 10}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

// src/components/BarChart.tsx
//
// §14 — the charts alongside the narrative insights. Plain views rather than a
// charting library: these are two bar charts with no axes, no tooltips and no
// interaction, and a chart dependency would cost more bundle than the whole
// analytics screen.
//
// Unlike the narrative sentences, the bars show the numbers in both
// directions. The silence rule is about not narrating a bad week at someone,
// not about hiding their own data from them.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui/Text';

export interface Bar {
  key: string;
  label: string;
  value: number;
  /** Marks the bar as the notable one, e.g. the heaviest hour. */
  emphasis?: boolean;
}

export function BarChart({ bars, height = 96 }: { bars: Bar[]; height?: number }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View style={[styles.row, { gap: 3, height: height + 18 }]}>
      {bars.map((bar) => (
        <View key={bar.key} style={styles.column}>
          <View
            accessibilityRole="text"
            accessibilityLabel={`${bar.label}: ${bar.value}`}
            style={{
              width: '100%',
              // A zero bar still draws a 2px sliver, so the baseline reads as a
              // row of hours rather than as missing data.
              height: Math.max(2, (bar.value / max) * height),
              backgroundColor: bar.emphasis ? theme.colors.ember : theme.colors.growth,
              borderRadius: 3,
              opacity: bar.value === 0 ? 0.25 : 1,
            }}
          />
          <Text variant="caption" tone="muted" style={styles.label} numberOfLines={1}>
            {bar.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Horizontal variant, for labelled categories like triggers. */
export function RankedBars({ bars }: { bars: Bar[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {bars.map((bar) => (
        <View key={bar.key} style={{ gap: 4 }}>
          <View style={styles.rankRow}>
            <Text variant="bodySmall">{bar.label}</Text>
            <Text variant="bodySmall" tone="muted">
              {bar.value}
            </Text>
          </View>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.colors.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${(bar.value / max) * 100}%`,
                height: '100%',
                backgroundColor: theme.colors.ember,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  label: { fontSize: 9 },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

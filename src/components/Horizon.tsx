// src/components/Horizon.tsx
// ─────────────────────────────────────────────────────────────────────────────
// "The Clearing" — the signature visual (§10) and the entire progression
// system (§13).
//
// A personal dawn horizon: hazy grey-navy when things are hard, clearing
// toward warm light as the user delays and reduces. A single silhouetted tree
// on that horizon gains detail — bare, budding, leafing, full canopy — at real
// milestones. No mascot, no coins, no confetti.
//
// It is static by design. Everything here is driven by props that only change
// when the user's behaviour changes, so the visual never animates for its own
// sake (§11, §27) — and the one thing it must do, read as *progress* to
// someone who has never seen the plan, works in a still frame or not at all.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { TreeStage } from '../features/rewards/horizon';

const VIEW_W = 320;
const VIEW_H = 180;
const GROUND_Y = 132;

export function Horizon({
  clearness,
  stage,
  height = 180,
  style,
}: {
  /** 0 = full haze, 1 = fully cleared. */
  clearness: number;
  stage: TreeStage;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, clearness));

  // The haze is an overlay rather than a different gradient, so the underlying
  // dawn is always physically there and simply obscured — which is the idea
  // the visual is carrying.
  const hazeOpacity = 0.82 * (1 - clamped);
  const sunY = GROUND_Y - 6 - clamped * 34;

  return (
    <View
      style={[{ height, borderRadius: theme.radius.lg, overflow: 'hidden' }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel(stage, clamped)}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.bgStart} />
            <Stop offset="0.55" stopColor={theme.colors.bgStart} stopOpacity={0.35} />
            <Stop offset="1" stopColor={theme.colors.bgClear} />
          </LinearGradient>
          <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.bgStart} stopOpacity={0.9} />
            <Stop offset="1" stopColor={theme.colors.bgStart} />
          </LinearGradient>
        </Defs>

        {/* Dawn */}
        <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={theme.colors.bgClear} />
        <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="url(#sky)" />

        {/* Sun — rises with progress, never sets back down */}
        <Circle cx={232} cy={sunY} r={22} fill={theme.colors.ember} opacity={0.25 + clamped * 0.6} />

        {/* Haze — the thing that clears */}
        <Rect
          x={0}
          y={0}
          width={VIEW_W}
          height={VIEW_H}
          fill={theme.colors.bgStart}
          opacity={hazeOpacity}
        />

        {/* Ground */}
        <Path
          d={`M0 ${GROUND_Y} Q 80 ${GROUND_Y - 8} 160 ${GROUND_Y} T 320 ${GROUND_Y - 4} L320 ${VIEW_H} L0 ${VIEW_H} Z`}
          fill="url(#ground)"
        />

        <Tree stage={stage} trunk={theme.colors.bgStart} canopy={theme.colors.growth} />
      </Svg>
    </View>
  );
}

function Tree({ stage, trunk, canopy }: { stage: TreeStage; trunk: string; canopy: string }) {
  const baseX = 96;
  const baseY = GROUND_Y + 2;

  return (
    <>
      {/* Trunk and main limbs — present at every stage; the tree is never gone */}
      <Path
        d={`M${baseX} ${baseY} L${baseX} ${baseY - 44} M${baseX} ${baseY - 26} L${baseX - 16} ${baseY - 42}
            M${baseX} ${baseY - 30} L${baseX + 15} ${baseY - 46} M${baseX} ${baseY - 40} L${baseX - 9} ${baseY - 56}
            M${baseX} ${baseY - 42} L${baseX + 10} ${baseY - 58}`}
        stroke={trunk}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />

      {stage >= 2 ? (
        // Buds: small, sparse, deliberately easy to miss until you look
        <>
          <Circle cx={baseX - 16} cy={baseY - 44} r={2.6} fill={canopy} opacity={0.9} />
          <Circle cx={baseX + 15} cy={baseY - 48} r={2.6} fill={canopy} opacity={0.9} />
          <Circle cx={baseX - 9} cy={baseY - 58} r={2.6} fill={canopy} opacity={0.9} />
          <Circle cx={baseX + 10} cy={baseY - 60} r={2.6} fill={canopy} opacity={0.9} />
        </>
      ) : null}

      {stage >= 3 ? (
        <>
          <Ellipse cx={baseX - 12} cy={baseY - 52} rx={16} ry={12} fill={canopy} opacity={0.75} />
          <Ellipse cx={baseX + 13} cy={baseY - 56} rx={15} ry={11} fill={canopy} opacity={0.75} />
        </>
      ) : null}

      {stage >= 4 ? (
        <>
          <Ellipse cx={baseX} cy={baseY - 66} rx={30} ry={20} fill={canopy} opacity={0.9} />
          <Ellipse cx={baseX - 20} cy={baseY - 54} rx={17} ry={13} fill={canopy} opacity={0.9} />
          <Ellipse cx={baseX + 20} cy={baseY - 56} rx={17} ry={13} fill={canopy} opacity={0.9} />
        </>
      ) : null}
    </>
  );
}

function accessibilityLabel(stage: TreeStage, clearness: number): string {
  const tree = ['a bare tree', 'a budding tree', 'a tree coming into leaf', 'a tree in full canopy'][
    stage - 1
  ];
  const sky =
    clearness < 0.25
      ? 'a hazy horizon'
      : clearness < 0.6
        ? 'a clearing horizon'
        : 'a clear dawn horizon';
  return `${sky} with ${tree}`;
}

// src/components/Horizon.tsx
//
// §10 — the signature visual. A personal dawn horizon: hazy grey-navy when
// things are hard, clearing toward warm light as the user delays and reduces.
// A single silhouetted tree gains detail — bare, budding, full canopy — at
// real milestones (§13).
//
// One bold element, everything else quiet around it. No mascot, no coins, no
// confetti. The whole progression system is this picture.
//
// §11 — it animates only when `clarity` actually changes, and the transition
// is scaled by motionScale, so Reduce Motion gets the new state immediately
// rather than a shorter version of the same journey.

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import type { TreeStage } from '../features/progress/horizon';
import { useTheme } from '../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const VIEW_W = 320;
const VIEW_H = 200;
/** Where the land meets the sky, in viewBox units. */
const HORIZON_Y = 138;

/** Linear mix of two #rrggbb strings. */
function mix(from: string, to: string, amount: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const t = Math.max(0, Math.min(1, amount));
  const channel = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[channel(r1, r2), channel(g1, g2), channel(b1, b2)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

export interface HorizonProps {
  /** 0 = full haze, 1 = full dawn. */
  clarity: number;
  tree: TreeStage;
  height?: number;
}

export function Horizon({ clarity, tree, height = 200 }: HorizonProps) {
  const theme = useTheme();
  const progress = useSharedValue(clarity);

  useEffect(() => {
    progress.value = withTiming(clarity, { duration: theme.duration.slow });
  }, [clarity, progress, theme.duration.slow]);

  // The sun rises out of the horizon as things clear. It never fully leaves
  // it: this is a dawn, not a midday.
  const sunProps = useAnimatedProps(() => ({
    cy: HORIZON_Y - progress.value * 46,
    opacity: 0.25 + progress.value * 0.75,
  }));

  // A warm band sitting on the horizon line, widening with clarity.
  const glowProps = useAnimatedProps(() => ({
    opacity: progress.value * 0.55,
  }));

  const skyTop = mix(theme.colors.bgStart, theme.isDark ? '#3A2A2E' : '#5B4A56', clarity);
  const skyLow = mix(theme.colors.bgStart, theme.colors.bgClear, clarity);
  const land = mix('#0A0F17', theme.isDark ? '#151C12' : '#20301F', clarity * 0.8);
  const silhouette = mix('#05080D', theme.isDark ? '#0D1410' : '#101A12', clarity * 0.6);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={describe(clarity, tree)}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyLow} />
          </LinearGradient>
          <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.ember} stopOpacity="0" />
            <Stop offset="1" stopColor={theme.colors.ember} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#sky)" />

        <AnimatedCircle
          cx={VIEW_W * 0.68}
          r={26}
          fill={theme.colors.ember}
          animatedProps={sunProps}
        />

        <AnimatedRect
          x="0"
          y={HORIZON_Y - 42}
          width={VIEW_W}
          height={42}
          fill="url(#glow)"
          animatedProps={glowProps}
        />

        {/* Land. A single soft rise rather than a straight edge, so the tree
            has somewhere to stand. */}
        <Path
          d={`M0 ${HORIZON_Y} C 70 ${HORIZON_Y - 8}, 150 ${HORIZON_Y + 6}, 220 ${HORIZON_Y - 4} S ${VIEW_W} ${HORIZON_Y + 2}, ${VIEW_W} ${HORIZON_Y} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`}
          fill={land}
        />

        <Tree stage={tree} color={silhouette} />
      </Svg>
    </View>
  );
}

/** The tree, at the three stages §10 names. Drawn once, detail added. */
function Tree({ stage, color }: { stage: TreeStage; color: string }) {
  const x = VIEW_W * 0.24;
  const baseY = HORIZON_Y + 2;

  return (
    <G>
      <Path
        d={`M${x - 3} ${baseY} L${x - 2} ${baseY - 34} L${x + 2} ${baseY - 34} L${x + 3} ${baseY} Z`}
        fill={color}
      />
      {/* Bare branches exist at every stage — the tree is the same tree. */}
      <Path
        d={`M${x} ${baseY - 26} L${x - 14} ${baseY - 38} M${x} ${baseY - 30} L${x + 13} ${baseY - 41} M${x} ${baseY - 20} L${x - 10} ${baseY - 27}`}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {stage === 'budding' && (
        <G>
          <Circle cx={x - 14} cy={baseY - 39} r="3.5" fill={color} />
          <Circle cx={x + 13} cy={baseY - 42} r="3.5" fill={color} />
          <Circle cx={x - 10} cy={baseY - 28} r="3" fill={color} />
          <Circle cx={x + 3} cy={baseY - 46} r="3" fill={color} />
        </G>
      )}

      {stage === 'canopy' && (
        <G>
          <Ellipse cx={x} cy={baseY - 46} rx="26" ry="18" fill={color} />
          <Ellipse cx={x - 15} cy={baseY - 38} rx="15" ry="11" fill={color} />
          <Ellipse cx={x + 15} cy={baseY - 39} rx="14" ry="10" fill={color} />
        </G>
      )}
    </G>
  );
}

/**
 * §31 asks whether the visual reads as progress in under three seconds. For
 * anyone using a screen reader it can't, so the same information is said out
 * loud instead of being labelled "decorative image".
 */
function describe(clarity: number, tree: TreeStage): string {
  const sky =
    clarity < 0.15
      ? 'A hazy horizon before dawn'
      : clarity < 0.4
        ? 'First light on the horizon'
        : clarity < 0.7
          ? 'The haze is breaking up'
          : 'A clear dawn horizon';
  const canopy =
    tree === 'bare' ? 'a bare tree' : tree === 'budding' ? 'a budding tree' : 'a tree in full leaf';
  return `${sky}, with ${canopy}.`;
}

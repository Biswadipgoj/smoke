// src/components/ui/GradientView.tsx
// A gradient fill without pulling in a native linear-gradient module — it
// measures itself and paints an SVG rect underneath its children. Supports
// rounded corners and any multi-stop gradient from the theme.
import React, { useId, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface GradientViewProps {
  colors: readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** 0..1 gradient direction. Default: top-left → bottom-right. */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radius?: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export function GradientView({
  colors,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  radius = 0,
  onLayout,
}: GradientViewProps) {
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState({ w: 0, h: 0 });

  return (
    <View
      style={style}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: width, h: height });
        onLayout?.(e);
      }}
    >
      {size.w > 0 && size.h > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} pointerEvents="none">
          <Defs>
            <LinearGradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
              {colors.map((c, i) => (
                <Stop key={i} offset={colors.length === 1 ? 0 : i / (colors.length - 1)} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} rx={radius} ry={radius} fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  );
}

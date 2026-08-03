// app/(tabs)/_layout.tsx — a floating, icon-forward tab bar
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Colors, Radius, Surfaces, Elevation } from '../../src/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconPill, focused && { backgroundColor: `${Colors.primary}1F` }]}>
        <Ionicons
          name={focused ? name : (`${name}-outline` as IconName)}
          size={22}
          color={focused ? Colors.primary : Colors.tabBarInactive}
        />
      </View>
      <View style={[styles.dot, focused && { backgroundColor: Colors.primary }]} />
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarItemStyle: { height: 60 },
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: isDark ? Surfaces.raised : '#FFFFFF',
            borderColor: isDark ? Surfaces.hairlineStrong : Surfaces.hairlineLight,
          },
          Elevation.float,
        ],
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabHome, tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="coach" options={{ title: t.tabCoach, tabBarIcon: ({ focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: t.tabProgress, tabBarIcon: ({ focused }) => <TabIcon name="pulse" focused={focused} /> }} />
      <Tabs.Screen name="achievements" options={{ title: t.tabAchievements, tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: t.tabSettings, tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    height: 64,
    borderRadius: Radius.xxl,
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 56, paddingTop: 6 },
  iconPill: { width: 44, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: 'transparent' },
});

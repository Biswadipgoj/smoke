// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Colors, FontFamily, FontSize } from '../../src/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused, label }: { name: IconName; focused: boolean; label: string }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IconName)}
        size={22}
        color={focused ? Colors.primary : Colors.tabBarInactive}
      />
    </View>
  );
}

export default function TabLayout() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: isDark ? Colors.bgDarkElevated : '#E5E7EB',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} label={t.tabHome} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t.tabCoach,
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} label={t.tabCoach} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t.tabProgress,
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} label={t.tabProgress} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t.tabAchievements,
          tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} label={t.tabAchievements} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} label={t.tabSettings} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
});

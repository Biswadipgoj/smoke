// app/(tabs)/_layout.tsx
// Three destinations. Not five. Calm requires fewer choices (master doc §5.2).
// Urge is deliberately NOT a tab — a permanent "Urge" button in the chrome
// would be a constant craving cue, and cue-conditioning is the mechanism
// this product fights.
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Colors, FontFamily } from '../../src/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={focused ? name : (`${name}-outline` as IconName)} size={22} color={focused ? Colors.bhor : Colors.tabInactive} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.bhor,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontFamily: FontFamily.medium, fontSize: 10, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabToday, tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="companion" options={{ title: t.tabCompanion, tabBarIcon: ({ focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} /> }} />
      <Tabs.Screen name="you" options={{ title: t.tabYou, tabBarIcon: ({ focused }) => <TabIcon name="person-circle" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
});

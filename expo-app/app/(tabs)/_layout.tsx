import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { useStore } from "@/store";

export default function TabsLayout() {
  const { approvalCount } = useStore();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: "800", fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 62, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="friends" options={{ title: "Friends", tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
      <Tabs.Screen name="world" options={{ title: "World", tabBarIcon: ({ color, size }) => <Ionicons name="globe" color={color} size={size} /> }} />
      <Tabs.Screen name="calls" options={{ title: "Calls", tabBarIcon: ({ color, size }) => <Ionicons name="videocam" color={color} size={size} /> }} />
      <Tabs.Screen
        name="parent"
        options={{
          title: "Parent",
          tabBarBadge: approvalCount > 0 ? approvalCount : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="lock-closed" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

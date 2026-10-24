import { Stack } from 'expo-router';
export default function Layout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerTitleStyle: { fontWeight: '600' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: '#FAF7F5' },
    }} />
  );
}

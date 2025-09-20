import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Bookings" }} />
      <Stack.Screen name="new" options={{ title: "New Booking" }} />
      <Stack.Screen name="success" options={{ title: "Success" }} />
    </Stack>
  );
}

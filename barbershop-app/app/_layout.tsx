import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="index" options={{ title: "Bookings" }} />
        <Stack.Screen name="new" options={{ title: "New Booking" }} />
        <Stack.Screen name="success" options={{ title: "Success" }} />
        <Stack.Screen name="login" options={{ title: "Sign In" }} />
        <Stack.Screen name="register" options={{ title: "Sign Up" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
    </AuthProvider>
  );
}

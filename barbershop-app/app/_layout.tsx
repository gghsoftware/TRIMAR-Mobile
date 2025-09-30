import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="welcome" options={{ title: "Welcome", headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: "Welcome", headerShown: false }} />
        <Stack.Screen name="index" options={{ title: "Bookings" }} />
        <Stack.Screen name="login" options={{ title: "Sign In", headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Sign Up", headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="new" options={{ title: "New Booking" }} />
        <Stack.Screen name="success" options={{ title: "Success" }} />
        <Stack.Screen name="admin" options={{ title: "Admin Dashboard", headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

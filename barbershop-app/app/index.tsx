import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { router } from "expo-router";
import { firebaseService, BookingFilters, Booking } from "../lib/firebaseService";
import { useAuth } from "../contexts/AuthContext";
import { assetService, HairStyle } from "../lib/assetService";
import { HairStyleSelector } from "../components/HairStyleSelector";
import { CameraModal } from "../components/CameraModal";
import { Button, Card, Badge, EmptyState, LoadingSpinner } from "../components/ui";
import { Input, SearchInput } from "../components/ui/Input";
import { Colors, Spacing, Typography } from "../constants/design";
import { WebView } from "react-native-webview";

const AR_URL =
  process.env.EXPO_PUBLIC_AR_URL ||
  "https://trim-ar.vercel.app/";

export default function Index() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility
  const [hairstyleSelectorVisible, setHairstyleSelectorVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [selectedHairstyle, setSelectedHairstyle] = useState<HairStyle | null>(null);
  const [arVisible, setArVisible] = useState(false);
  const [arUrl, setArUrl] = useState(AR_URL);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Load assets on component mount
  useEffect(() => {
    assetService.loadAssets();
  }, []);

  // Camera permission function
  async function requestCameraPermission() {
    try {
      const { Camera } = await import("expo-camera");
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === "granted";
    } catch {
      Alert.alert(
        "Camera",
        "Permission API not available. Install expo-camera:\n\nnpx expo install expo-camera"
      );
      return false;
    }
  }

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const filters: BookingFilters = {
        userId: user?.uid, // Only fetch bookings for the authenticated user
      };
      
      const data = await firebaseService.getBookings(filters);
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  const onRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  // Fetch bookings when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading, fetchBookings]);

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (phoneFilter) {
      filtered = filtered.filter(booking =>
        booking.phone?.includes(phoneFilter)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(booking =>
        booking.date === dateFilter
      );
    }

    return filtered;
  }, [bookings, searchQuery, phoneFilter, dateFilter]);

  const countText = useMemo(
    () => `${filteredBookings.length} booking${filteredBookings.length === 1 ? "" : "s"}`,
    [filteredBookings]
  );

  const handleHairstyleSelect = async (hairstyle: HairStyle) => {
    setSelectedHairstyle(hairstyle);
    setHairstyleSelectorVisible(false);
    
    // Open native camera instead of WebView
    setCameraVisible(true);
  };

  const handleTryHairstyle = async () => {
    const ok = await requestCameraPermission();
    if (!ok && Platform.OS !== "web") return;
    setArUrl(AR_URL);
    setArVisible(true);
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          description={error}
          action={{
            label: "Try Again",
            onPress: () => fetchBookings(),
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{countText}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </Card>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Search bookings..."
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery("")}
          style={styles.searchInput}
        />
        
        <View style={styles.filterRow}>
          <Input
            placeholder="Filter by phone"
            value={phoneFilter}
            onChangeText={setPhoneFilter}
            style={styles.filterInput}
            containerStyle={styles.filterContainer}
          />
          <Input
            placeholder="Filter by date (YYYY-MM-DD)"
            value={dateFilter}
            onChangeText={setDateFilter}
            style={styles.filterInput}
            containerStyle={styles.filterContainer}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          variant="primary"
          size="md"
          onPress={handleTryHairstyle}
          style={styles.primaryAction}
        >
          Try Hairstyle
        </Button>
        
        <Button
          variant="secondary"
          size="md"
          onPress={() => router.push("/new")}
          style={styles.secondaryAction}
        >
          New Booking
        </Button>
      </View>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No bookings found"
          description={searchQuery || phoneFilter || dateFilter 
            ? "Try adjusting your search filters" 
            : "Create your first booking to get started"
          }
          action={!searchQuery && !phoneFilter && !dateFilter ? {
            label: "Create Booking",
            onPress: () => router.push("/new"),
          } : undefined}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item, index) => item.id || `booking-${index}`}
          renderItem={({ item }) => <BookingCard booking={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* HAIRSTYLE SELECTOR MODAL */}
      <Modal
        visible={hairstyleSelectorVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setHairstyleSelectorVisible(false)}
      >
        <HairStyleSelector
          onSelect={handleHairstyleSelect}
          onClose={() => setHairstyleSelectorVisible(false)}
        />
      </Modal>

      {/* NATIVE CAMERA MODAL */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        selectedHairstyle={selectedHairstyle}
      />

      {/* AR MODAL */}
      <ARModal visible={arVisible} url={arUrl} onClose={() => setArVisible(false)} />
    </SafeAreaView>
  );
}

/* AR Modal */
function ARModal({ visible, url, onClose }: { visible: boolean; url: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  if (!visible) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>AR Try-on</Text>
          <View style={styles.headerBtn} />
        </View>
        {loading && (
          <View style={styles.webLoader}>
            <ActivityIndicator size="large" />
            <Text style={{ color: "#e5e7eb", marginTop: 8 }}>Loading site…</Text>
            {Platform.OS === "web" && (
              <Text style={styles.webHint}>
                If it never loads, the website may block embedding (X-Frame-Options / frame-ancestors).
              </Text>
            )}
          </View>
        )}
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onError={(e) => Alert.alert("Website error", e?.nativeEvent?.description || "Failed to load")}
        />
      </View>
    </Modal>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return { variant: 'success' as const, text: 'Confirmed' };
      case "pending":
        return { variant: 'warning' as const, text: 'Pending' };
      case "cancelled":
        return { variant: 'error' as const, text: 'Cancelled' };
      default:
        return { variant: 'neutral' as const, text: status };
    }
  };

  const config = getStatusConfig(status);

  return <Badge variant={config.variant}>{config.text}</Badge>;
}

function BookingCard({ booking }: { booking: Booking }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <Card style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {booking.customerName || "Unknown Customer"}
          </Text>
          <Text style={styles.customerPhone}>
            📞 {booking.phone || "No phone"}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Date:</Text>
          <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏰ Time:</Text>
          <Text style={styles.detailValue}>{formatTime(booking.time)}</Text>
        </View>
        
        {booking.service && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>✂️ Service:</Text>
            <Text style={styles.detailValue}>{booking.service}</Text>
          </View>
        )}
        
        {booking.stylist && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👨‍💼 Stylist:</Text>
            <Text style={styles.detailValue}>{booking.stylist}</Text>
          </View>
        )}
        
        {booking.price && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Price:</Text>
            <Text style={styles.detailValue}>₱{booking.price}</Text>
          </View>
        )}
        
        {booking.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>📝 Notes:</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Header styles
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  
  // Search and filters
  searchContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterContainer: {
    flex: 1,
    marginBottom: 0,
  },
  filterInput: {
    fontSize: Typography.sm,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  primaryAction: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  secondaryAction: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  
  // List
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  
  // Booking card
  bookingCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  customerPhone: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  bookingDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: Typography.medium as any,
  },
  notesContainer: {
    marginTop: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    lineHeight: Typography.sm * 1.4,
  },

  // AR Modal styles
  modalHeader: {
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: "#000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 8 
  },
  headerBtnText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  modalTitle: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "800" 
  },
  webLoader: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 1,
  },
  webHint: { 
    color: "#9ca3af", 
    marginTop: 4, 
    fontSize: 12, 
    paddingHorizontal: 16, 
    textAlign: "center" 
  },
});
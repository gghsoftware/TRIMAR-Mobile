import { useState, useMemo, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, FlatList,
  SafeAreaView
} from "react-native";
import { router } from "expo-router";
import { firebaseService } from "../lib/firebaseService";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card } from "../components/ui";
import { Input } from "../components/ui/Input";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/design";

const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

// Optional quick choices (edit for your shop)
const SERVICE_OPTIONS = ["Haircut", "Shave", "Haircut + Shave", "Color"];
const STYLIST_OPTIONS = ["Jay", "Ali", "Ken"];

// 09:00–18:00 in 30-min steps
const TIMES = Array.from({ length: (18 - 9) * 2 + 1 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
});

export default function NewBooking() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [stylist, setStylist] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("09:00");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^09\d{9}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid Philippine mobile number (09xxxxxxxxx)';
    }
    
    if (!date.trim()) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }
    
    if (!time.trim()) {
      newErrors.time = 'Time is required';
    }
    
    if (price.trim() && isNaN(Number(price))) {
      newErrors.price = 'Price must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canSubmit = useMemo(
    () => !!(customerName.trim() && phone.trim() && date.trim() && time.trim()),
    [customerName, phone, date, time]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const submit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before submitting");
      return;
    }
    
    setSubmitting(true);
    try {
      if (!user?.uid) {
        Alert.alert("Error", "User not authenticated");
        return;
      }
      
      // Build payload with only non-empty values
      const payload: any = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        date: date.trim(),
        time: time.trim(),
        status: 'pending' as const
      };

      // Only add optional fields if they have values
      if (service.trim()) payload.service = service.trim();
      if (stylist.trim()) payload.stylist = stylist.trim();
      if (notes.trim()) payload.notes = notes.trim();
      
      // Handle price separately to validate it
      if (price.trim()) {
        const priceNum = Number(price);
        if (!isNaN(priceNum)) {
          payload.price = priceNum;
        }
      }
      
      const booking = await firebaseService.createBooking(payload, user.uid);
      router.replace({ pathname: "/success", params: { booking: JSON.stringify(booking) } });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>New Booking</Text>
          <Text style={styles.subtitle}>Create and confirm a client appointment</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Information */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            <Input
              label="Customer Name"
              required
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Juan Dela Cruz"
              autoCapitalize="words"
              error={errors.customerName}
              helper="Full name for the booking record"
            />
            
            <Input
              label="Phone Number"
              required
              value={phone}
              onChangeText={setPhone}
              placeholder="09xxxxxxxxx"
              keyboardType="phone-pad"
              error={errors.phone}
              helper="We'll use this for SMS reminders"
            />
          </Card>

          {/* Service Selection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            
            <View style={styles.chipContainer}>
              <Text style={styles.chipLabel}>Quick Service Selection:</Text>
              <View style={styles.chipRow}>
                {SERVICE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, service === opt && styles.chipActive]}
                    onPress={() => setService(opt)}
                  >
                    <Text style={[styles.chipText, service === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <Input
              label="Custom Service"
              value={service}
              onChangeText={setService}
              placeholder="e.g., Skin fade + beard trim"
              helper="Override or add details"
            />
          </Card>

          {/* Schedule */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <View style={styles.chipContainer}>
              <Text style={styles.chipLabel}>Preferred Stylist:</Text>
              <View style={styles.chipRow}>
                {STYLIST_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, stylist === opt && styles.chipActive]}
                    onPress={() => setStylist(opt)}
                  >
                    <Text style={[styles.chipText, stylist === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <Input
              label="Custom Stylist"
              value={stylist}
              onChangeText={setStylist}
              placeholder="Type a name"
            />

            <Input
              label="Date"
              required
              value={date}
              onChangeText={setDate}
              placeholder={today()}
              autoCapitalize="none"
              error={errors.date}
              helper="YYYY-MM-DD format"
            />

            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Time Slot (Required):</Text>
              <FlatList
                data={TIMES}
                keyExtractor={(t) => t}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeScrollContent}
                ItemSeparatorComponent={() => <View style={styles.timeSeparator} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.timeChip, time === item && styles.timeChipActive]}
                    onPress={() => setTime(item)}
                  >
                    <Text style={[styles.timeChipText, time === item && styles.timeChipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
            </View>
          </Card>

          {/* Additional Details */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <Input
              label="Price (₱)"
              value={price}
              onChangeText={setPrice}
              placeholder="e.g., 350"
              keyboardType="numeric"
              error={errors.price}
              helper="Optional; you can set at checkout"
            />

            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special requests, allergies, etc."
              multiline
              style={styles.notesInput}
              helper="Special requests, allergies, etc."
            />
          </Card>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            onPress={submit}
            loading={submitting}
            disabled={!canSubmit || submitting}
            style={styles.submitButton}
          >
            {submitting ? "Creating Booking..." : "Create Booking"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  
  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  
  // Sections
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  
  // Chips
  chipContainer: {
    marginBottom: Spacing.lg,
  },
  chipLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  
  // Time selection
  timeContainer: {
    marginTop: Spacing.md,
  },
  timeLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  timeScrollContent: {
    paddingVertical: Spacing.sm,
  },
  timeSeparator: {
    width: Spacing.sm,
  },
  timeChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
  },
  timeChipTextActive: {
    color: Colors.white,
  },
  
  // Error text
  errorText: {
    fontSize: Typography.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  
  // Notes input
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  
  // Spacer
  spacer: {
    height: 100,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  
  // Footer
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    width: '100%',
  },
});

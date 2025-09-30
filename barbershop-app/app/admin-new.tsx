import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { firebaseService, Booking } from '../lib/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Badge, EmptyState, LoadingSpinner } from '../components/ui';
import { SearchInput } from '../components/ui/Input';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/design';

interface SalesMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageTicket: number;
}

interface ServiceStats {
  service: string;
  bookings: number;
  revenue: number;
}

interface StylistStats {
  stylist: string;
  bookings: number;
  revenue: number;
}

interface DailyData {
  date: string;
  revenue: number;
  bookings: number;
}

interface FilterOptions {
  dateRange: string;
  service: string;
  stylist: string;
  fromDate: string;
  toDate: string;
  status: string;
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: DailyData[] }) {
  const maxValue = Math.max(...data.map(d => d.revenue), 1);
  const chartHeight = 200;
  
  return (
    <View style={styles.simpleChartContainer}>
      <View style={styles.chartBars}>
        {data.slice(-7).map((day, index) => {
          const height = (day.revenue / maxValue) * chartHeight;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { height: Math.max(height, 2) } // Minimum 2px height
                  ]} 
                />
                <Text style={styles.barValue}>₱{day.revenue}</Text>
              </View>
              <Text style={styles.barLabel}>
                {new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalRevenue: 0,
    totalBookings: 0,
    averageTicket: 0,
  });
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [stylistStats, setStylistStats] = useState<StylistStats[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'Last 30 days',
    service: 'All',
    stylist: 'All',
    fromDate: '',
    toDate: '',
    status: 'Confirmed',
  });

  const loadAdminData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Load all bookings (admin can see all)
      const allBookings = await firebaseService.getBookings({});
      console.log('Loaded bookings:', allBookings.length);
      setBookings(allBookings);
      setFilteredBookings(allBookings);

      // Calculate metrics
      calculateMetrics(allBookings);
      calculateServiceStats(allBookings);
      calculateStylistStats(allBookings);
      calculateDailyData(allBookings);

    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadAdminData(true);
  }, [loadAdminData]);

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please log in to access admin dashboard', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
        return;
      }
      
      if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Admin privileges required', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }
      
      // User is authenticated and has admin role
      loadAdminData();
    }
  }, [authLoading, isAuthenticated, user?.role, loadAdminData]);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const filtered = bookings.filter(booking =>
        booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.stylist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.phone?.includes(searchQuery)
      );
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings(bookings);
    }
  }, [searchQuery, bookings]);

  const calculateMetrics = (bookingsData: Booking[]) => {
    const totalRevenue = bookingsData.reduce((sum, booking) => {
      const price = parseFloat(booking.price?.toString() || '0');
      return sum + price;
    }, 0);

    const totalBookings = bookingsData.length;
    const averageTicket = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    setMetrics({
      totalRevenue,
      totalBookings,
      averageTicket,
    });
  };

  const calculateServiceStats = (bookingsData: Booking[]) => {
    const serviceMap = new Map<string, { bookings: number; revenue: number }>();
    bookingsData.forEach(booking => {
      const service = booking.service || 'Unknown';
      const price = parseFloat(booking.price?.toString() || '0');
      
      if (serviceMap.has(service)) {
        const current = serviceMap.get(service)!;
        serviceMap.set(service, {
          bookings: current.bookings + 1,
          revenue: current.revenue + price,
        });
      } else {
        serviceMap.set(service, { bookings: 1, revenue: price });
      }
    });

    const serviceStatsArray = Array.from(serviceMap.entries()).map(([service, stats]) => ({
      service,
      bookings: stats.bookings,
      revenue: stats.revenue,
    })).sort((a, b) => b.revenue - a.revenue);

    setServiceStats(serviceStatsArray);
  };

  const calculateStylistStats = (bookingsData: Booking[]) => {
    const stylistMap = new Map<string, { bookings: number; revenue: number }>();
    bookingsData.forEach(booking => {
      const stylist = booking.stylist || 'Unknown';
      const price = parseFloat(booking.price?.toString() || '0');
      
      if (stylistMap.has(stylist)) {
        const current = stylistMap.get(stylist)!;
        stylistMap.set(stylist, {
          bookings: current.bookings + 1,
          revenue: current.revenue + price,
        });
      } else {
        stylistMap.set(stylist, { bookings: 1, revenue: price });
      }
    });

    const stylistStatsArray = Array.from(stylistMap.entries()).map(([stylist, stats]) => ({
      stylist,
      bookings: stats.bookings,
      revenue: stats.revenue,
    })).sort((a, b) => b.revenue - a.revenue);

    setStylistStats(stylistStatsArray);
  };

  const calculateDailyData = (bookingsData: Booking[]) => {
    const dailyMap = new Map<string, { revenue: number; bookings: number }>();
    
    console.log('Processing bookings for daily data:', bookingsData.length);
    
    bookingsData.forEach(booking => {
      console.log('Booking date:', booking.date, 'Price:', booking.price);
      
      // Handle different date formats
      let dateString: string;
      try {
        const bookingDate = new Date(booking.date);
        if (isNaN(bookingDate.getTime())) {
          console.warn('Invalid date format:', booking.date);
          return;
        }
        dateString = bookingDate.toISOString().split('T')[0];
      } catch (error) {
        console.warn('Error parsing date:', booking.date, error);
        return;
      }
      
      const price = parseFloat(booking.price?.toString() || '0');
      console.log('Processed date:', dateString, 'Price:', price);
      
      if (dailyMap.has(dateString)) {
        const current = dailyMap.get(dateString)!;
        dailyMap.set(dateString, {
          revenue: current.revenue + price,
          bookings: current.bookings + 1,
        });
      } else {
        dailyMap.set(dateString, { revenue: price, bookings: 1 });
      }
    });

    console.log('Daily map:', Array.from(dailyMap.entries()));

    // Generate data for the last 30 days, but prioritize showing data with actual bookings
    const last30Days: DailyData[] = [];
    const today = new Date();
    
    // If we have booking data, show the last 30 days from the most recent booking
    const bookingDates = Array.from(dailyMap.keys()).sort();
    let startDate: Date;
    
    if (bookingDates.length > 0) {
      // Start from 30 days before the most recent booking date
      const mostRecentBooking = new Date(bookingDates[bookingDates.length - 1]);
      startDate = new Date(mostRecentBooking.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else {
      // Fallback to last 30 days from today
      startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    }
    
    console.log('Date range:', startDate.toISOString().split('T')[0], 'to', today.toISOString().split('T')[0]);
    
    // Generate data for the range
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = dailyMap.get(dateString) || { revenue: 0, bookings: 0 };
      
      last30Days.push({
        date: dateString,
        revenue: dayData.revenue,
        bookings: dayData.bookings,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Generated daily data (last 7):', last30Days.slice(-7));
    console.log('All daily data:', last30Days);
    setDailyData(last30Days);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Filter by service
    if (filters.service !== 'All') {
      filtered = filtered.filter(booking => booking.service === filters.service);
    }

    // Filter by stylist
    if (filters.stylist !== 'All') {
      filtered = filtered.filter(booking => booking.stylist === filters.stylist);
    }

    // Filter by status
    if (filters.status !== 'All') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Filter by date range
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.date);
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        return bookingDate >= fromDate && bookingDate <= toDate;
      });
    }

    setFilteredBookings(filtered);
    setShowFilters(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await firebaseService.updateBooking(bookingId, { status });
      await loadAdminData(true);
      Alert.alert('Success', `Booking ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return Colors.success;
        case 'pending':
          return Colors.warning;
        case 'cancelled':
          return Colors.error;
        case 'completed':
          return Colors.primary;
        default:
          return Colors.textSecondary;
      }
    };

    return (
      <Badge 
        text={status} 
        color={getStatusColor(status)}
        size="sm"
      />
    );
  };

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show access denied if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <EmptyState
            icon="🔒"
            title="Access Denied"
            description="Admin privileges required to access this dashboard"
          />
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sales Dashboard</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Overview of bookings revenue, volume, and activity</Text>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchInput
              placeholder="Search bookings..."
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery("")}
            />
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.contentContainer}>
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.totalBookings}</Text>
              <Text style={styles.metricLabel}>Total Bookings</Text>
            </Card>
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatCurrency(metrics.averageTicket)}</Text>
              <Text style={styles.metricLabel}>Avg. Ticket</Text>
            </Card>
          </View>
        </View>

        {/* Service Statistics */}
        <View style={styles.contentContainer}>
          <Card>
            <Text style={styles.sectionTitle}>Service Performance</Text>
            <View style={styles.statsList}>
              {serviceStats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statItemLeft}>
                    <Text style={styles.statItemTitle}>{stat.service}</Text>
                    <Text style={styles.statItemSubtitle}>{stat.bookings} bookings</Text>
                  </View>
                  <Text style={styles.statItemValue}>{formatCurrency(stat.revenue)}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Stylist Statistics */}
        <View style={styles.contentContainer}>
          <Card>
            <Text style={styles.sectionTitle}>Stylist Performance</Text>
            <View style={styles.statsList}>
              {stylistStats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statItemLeft}>
                    <Text style={styles.statItemTitle}>{stat.stylist}</Text>
                    <Text style={styles.statItemSubtitle}>{stat.bookings} bookings</Text>
                  </View>
                  <Text style={styles.statItemValue}>{formatCurrency(stat.revenue)}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Daily Revenue Chart */}
        <View style={styles.contentContainer}>
          <Card>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Daily Revenue Trend</Text>
              <Text style={styles.chartDateRange}>
                {dailyData.length > 0 ? `${dailyData[0].date} → ${dailyData[dailyData.length - 1].date}` : ''}
              </Text>
            </View>
            
            {dailyData.length > 0 ? (
              <View style={styles.chartContainer}>
                <SimpleBarChart data={dailyData} />
                
                {/* Chart Summary */}
                <View style={styles.chartSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total (7 days)</Text>
                    <Text style={styles.summaryValue}>
                      ₱{dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Avg. Daily</Text>
                    <Text style={styles.summaryValue}>
                      ₱{Math.round(dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Best Day</Text>
                    <Text style={styles.summaryValue}>
                      ₱{Math.max(...dailyData.slice(-7).map(d => d.revenue)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyChartContainer}>
                <Text style={styles.emptyChartText}>No revenue data available</Text>
                <Text style={styles.emptyChartSubtext}>Create some bookings to see trends</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Recent Bookings */}
        <View style={styles.contentContainer}>
          <Card>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {filteredBookings.length > 0 ? (
              <View style={styles.bookingsList}>
                {filteredBookings.slice(0, 10).map((booking) => (
                  <View key={booking.id} style={styles.bookingItem}>
                    <View style={styles.bookingHeader}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.customerName}>
                          {booking.customerName || "Unknown Customer"}
                        </Text>
                        <Text style={styles.bookingDate}>
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </Text>
                      </View>
                      <StatusBadge status={booking.status} />
                    </View>
                    
                    <View style={styles.bookingDetails}>
                      <Text style={styles.bookingService}>
                        {booking.service || "No service specified"}
                      </Text>
                      <Text style={styles.bookingStylist}>
                        Stylist: {booking.stylist || "Not assigned"}
                      </Text>
                      <Text style={styles.bookingPrice}>
                        {formatCurrency(parseFloat(booking.price?.toString() || '0'))}
                      </Text>
                    </View>
                    
                    {booking.status === 'pending' && (
                      <View style={styles.bookingActions}>
                        <Button
                          title="Approve"
                          onPress={() => updateBookingStatus(booking.id, 'confirmed')}
                          variant="primary"
                          size="sm"
                          style={styles.actionButton}
                        />
                        <Button
                          title="Reject"
                          onPress={() => updateBookingStatus(booking.id, 'cancelled')}
                          variant="danger"
                          size="sm"
                          style={styles.actionButton}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="📅"
                title="No bookings found"
                description="No bookings match your current search criteria"
              />
            )}
          </Card>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Bookings</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Filter options would go here */}
            <Text style={styles.modalText}>Filter options coming soon...</Text>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              title="Apply Filters"
              onPress={applyFilters}
              variant="primary"
              style={styles.modalButton}
            />
            <Button
              title="Clear All"
              onPress={() => setShowFilters(false)}
              variant="secondary"
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
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
  
  // Access Denied
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  
  // Header
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: Typography.medium as any,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  filterButtonText: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: Typography.medium as any,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    marginTop: Spacing.md,
  },
  
  // Content
  contentContainer: {
    padding: Spacing.lg,
  },
  
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  metricValue: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Sections
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  
  // Stats
  statsList: {
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItemLeft: {
    flex: 1,
  },
  statItemTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statItemSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statItemValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
  },
  
  // Chart
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartDateRange: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  
  // Simple Chart
  simpleChartContainer: {
    width: '100%',
    paddingVertical: Spacing.md,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: Spacing.sm,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 30,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  barValue: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  barLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Chart Summary
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
  },
  
  // Empty Chart
  emptyChartContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptyChartSubtext: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  
  // Bookings list
  bookingsList: {
    gap: Spacing.md,
  },
  bookingItem: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bookingDate: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  bookingDetails: {
    marginBottom: Spacing.sm,
  },
  bookingService: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bookingStylist: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  bookingPrice: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.primary,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
  },
  
  // Spacer
  spacer: {
    height: 100,
  },
});

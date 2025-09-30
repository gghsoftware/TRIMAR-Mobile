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
      filtered = filtered.filter(booking => booking.status === filters.status.toLowerCase());
    }

    // Filter by date range
    if (filters.fromDate && filters.toDate) {
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= fromDate && bookingDate <= toDate;
      });
    }

    setFilteredBookings(filtered);
    calculateMetrics(filtered);
    calculateServiceStats(filtered);
    calculateStylistStats(filtered);
    calculateDailyData(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'Last 30 days',
      service: 'All',
      stylist: 'All',
      fromDate: '',
      toDate: '',
      status: 'Confirmed',
    });
    setFilteredBookings(bookings);
    calculateMetrics(bookings);
    calculateServiceStats(bookings);
    calculateStylistStats(bookings);
    calculateDailyData(bookings);
    setShowFilters(false);
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await firebaseService.updateBookingStatus(bookingId, status);
      await loadAdminData();
      Alert.alert('Success', `Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH');
  };


  const getUniqueServices = () => {
    const services = [...new Set(bookings.map(booking => booking.service).filter(Boolean))];
    return ['All', ...services];
  };

  const getUniqueStylists = () => {
    const stylists = [...new Set(bookings.map(booking => booking.stylist).filter(Boolean))];
    return ['All', ...stylists];
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="🚫"
          title="Access Denied"
          description="Admin privileges required to access this dashboard"
          action={{
            label: "Go Back",
            onPress: () => router.back(),
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
        showsVerticalScrollIndicator={false}
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
                <LineChart
                  data={{
                    labels: dailyData.slice(-7).map(d => {
                      const date = new Date(d.date);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [
                      {
                        data: dailyData.slice(-7).map(d => d.revenue),
                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                        strokeWidth: 3,
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: Colors.white,
                    backgroundGradientFrom: Colors.white,
                    backgroundGradientTo: Colors.white,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: BorderRadius.lg,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: Colors.primary,
                    },
                    formatYLabel: (value) => `₱${parseInt(value).toLocaleString()}`,
                  }}
                  bezier
                  style={styles.chart}
                  withDots={true}
                  withShadow={false}
                  withInnerLines={false}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                />
                
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
            {filteredBookings.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No bookings found"
                description={searchQuery ? "Try adjusting your search query" : "No bookings available"}
              />
            ) : (
              <View style={styles.bookingsList}>
                {filteredBookings.slice(0, 10).map((booking, index) => (
                  <View key={booking.id || index} style={styles.bookingItem}>
                    <View style={styles.bookingItemLeft}>
                      <Text style={styles.bookingCustomerName}>
                        {booking.customerName || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.bookingDetails}>
                        {booking.service} • {booking.stylist} • {formatDate(booking.date)} {booking.time}
                      </Text>
                    </View>
                    <View style={styles.bookingItemRight}>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'pending' ? 'warning' : 'error'
                      }>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                      </Badge>
                      {booking.status === 'pending' && (
                        <View style={styles.bookingActions}>
                          <Button
                            variant="primary"
                            size="sm"
                            onPress={() => updateBookingStatus(booking.id!, 'confirmed')}
                            style={styles.actionButton}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onPress={() => updateBookingStatus(booking.id!, 'cancelled')}
                            style={styles.actionButton}
                          >
                            Reject
                          </Button>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Dashboard</Text>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Quick range:</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterOption, filters.dateRange === 'Last 7 days' && styles.filterOptionActive]}
                  onPress={() => setFilters({...filters, dateRange: 'Last 7 days'})}
                >
                  <Text style={[styles.filterOptionText, filters.dateRange === 'Last 7 days' && styles.filterOptionTextActive]}>Last 7 days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filters.dateRange === 'Last 30 days' && styles.filterOptionActive]}
                  onPress={() => setFilters({...filters, dateRange: 'Last 30 days'})}
                >
                  <Text style={[styles.filterOptionText, filters.dateRange === 'Last 30 days' && styles.filterOptionTextActive]}>Last 30 days</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Service:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {getUniqueServices().map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[styles.filterOption, filters.service === service && styles.filterOptionActive]}
                      onPress={() => setFilters({...filters, service: service || 'All'})}
                    >
                      <Text style={[styles.filterOptionText, filters.service === service && styles.filterOptionTextActive]}>{service || 'N/A'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Stylist:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {getUniqueStylists().map((stylist) => (
                    <TouchableOpacity
                      key={stylist}
                      style={[styles.filterOption, filters.stylist === stylist && styles.filterOptionActive]}
                      onPress={() => setFilters({...filters, stylist: stylist || 'All'})}
                    >
                      <Text style={[styles.filterOptionText, filters.stylist === stylist && styles.filterOptionTextActive]}>{stylist || 'N/A'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status:</Text>
              <View style={styles.filterRow}>
                {['All', 'Confirmed', 'Pending', 'Cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, filters.status === status && styles.filterOptionActive]}
                    onPress={() => setFilters({...filters, status})}
                  >
                    <Text style={[styles.filterOptionText, filters.status === status && styles.filterOptionTextActive]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                variant="secondary"
                onPress={resetFilters}
                style={styles.modalButton}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                onPress={applyFilters}
                style={styles.modalButton}
              >
                Apply Filters
              </Button>
            </View>
          </View>
        </View>
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
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: Typography.semibold as any,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    marginTop: Spacing.md,
  },
  
  // Content container
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  
  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
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
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  
  // Stats list
  statsList: {
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statItemLeft: {
    flex: 1,
  },
  statItemTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statItemSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statItemValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold as any,
    color: Colors.primary,
  },
  
  // Chart
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chartDateRange: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
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
  
  // Debug
  debugContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  debugTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  debugText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  // Bookings list
  bookingsList: {
    gap: Spacing.md,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bookingItemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bookingCustomerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bookingDetails: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.4,
  },
  bookingItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    minWidth: 70,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { firebaseService, Booking } from '../lib/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Badge, EmptyState, LoadingSpinner } from '../components/ui';
import { SearchInput } from '../components/ui/Input';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/design';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

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

// Simple, Reliable Chart Component (Expo Compatible)
function SimpleBarChart({ data }: { data: DailyData[] }) {
  const { width: screenWidth } = Dimensions.get('window');
  const maxValue = Math.max(...data.map(d => d.revenue), 1);
  
  // Calculate responsive dimensions
  const chartWidth = Math.min(screenWidth - 100, 300);
  const chartHeight = 200;
  const padding = 20;
  
  console.log('Chart dimensions:', { screenWidth, chartWidth, chartHeight, maxValue });
  
  // Create simple line path
  const createLinePath = () => {
    const points = data.slice(-7);
    if (points.length === 0) return '';
    
    let path = '';
    const stepX = (chartWidth - padding * 2) / Math.max(points.length - 1, 1);
    
    points.forEach((point, index) => {
      const x = padding + (index * stepX);
      const y = chartHeight - padding - ((point.revenue / maxValue) * (chartHeight - padding * 2));
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };
  
  // Create area fill path
  const createAreaPath = () => {
    const linePath = createLinePath();
    const points = data.slice(-7);
    if (points.length === 0) return '';
    
    const stepX = (chartWidth - padding * 2) / Math.max(points.length - 1, 1);
    const lastX = padding + ((points.length - 1) * stepX);
    const bottomY = chartHeight - padding;
    
    return `${linePath} L ${lastX} ${bottomY} L ${padding} ${bottomY} Z`;
  };

  return (
    <View style={styles.simpleChartContainer}>
      {/* Debug Info - Only show in development */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Chart Debug Info:</Text>
          <Text style={styles.debugText}>Screen Width: {screenWidth}px</Text>
          <Text style={styles.debugText}>Chart Width: {chartWidth}px</Text>
          <Text style={styles.debugText}>Data Points: {data.slice(-7).length}</Text>
          <Text style={styles.debugText}>Max Revenue: ₱{maxValue.toLocaleString()}</Text>
        </View>
      )}
      
      {/* Chart Container */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
          {/* Gradient definition */}
          <Defs>
            <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="rgba(37, 99, 235, 0.3)" />
              <Stop offset="100%" stopColor="rgba(37, 99, 235, 0.05)" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + (chartHeight - padding * 2) * (1 - ratio);
            return (
              <Path
                key={index}
                d={`M ${padding} ${y} L ${chartWidth - padding} ${y}`}
                stroke={Colors.border}
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity={0.3}
              />
            );
          })}
          
          {/* Area fill */}
          <Path
            d={createAreaPath()}
            fill="url(#chartGradient)"
            stroke="none"
          />
          
          {/* Line */}
          <Path
            d={createLinePath()}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.slice(-7).map((point, index) => {
            const stepX = (chartWidth - padding * 2) / Math.max(data.slice(-7).length - 1, 1);
            const x = padding + (index * stepX);
            const y = chartHeight - padding - ((point.revenue / maxValue) * (chartHeight - padding * 2));
            const isHighest = point.revenue === maxValue;
            
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={isHighest ? "6" : "4"}
                fill={isHighest ? "#10b981" : "#2563eb"}
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })}
        </Svg>
        
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              ₱{Math.round(maxValue * ratio).toLocaleString()}
            </Text>
          ))}
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.slice(-7).map((day, index) => {
            const date = new Date(day.date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <Text 
                key={index} 
                style={[
                  styles.xAxisLabel,
                  isToday && styles.xAxisLabelToday
                ]}
              >
                {date.getMonth() + 1}/{date.getDate()}
              </Text>
            );
          })}
        </View>
      </View>
      
      {/* Chart Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendText}>Daily Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Highest Day</Text>
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
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
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'Last 30 days',
    service: 'All',
    stylist: 'All',
    fromDate: '',
    toDate: '',
    status: 'All',
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
      console.log('=== ADMIN DATA LOADING ===');
      console.log('Loaded bookings:', allBookings.length);
      console.log('Raw bookings data:', allBookings);
      
      // Log each booking details
      allBookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`, {
          id: booking.id,
          customerName: booking.customerName,
          date: booking.date,
          price: booking.price,
          service: booking.service,
          stylist: booking.stylist,
          status: booking.status
        });
      });
      
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
        Alert.alert('Access Denied', 'Admin privileges required');
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
    
    console.log('=== CALCULATING DAILY DATA ===');
    console.log('Processing bookings for daily data:', bookingsData.length);
    
    // If no bookings, create some test data for demonstration
    if (bookingsData.length === 0) {
      console.log('No bookings found, creating test data...');
      const today = new Date();
      const testData: DailyData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Create some test revenue data
        const revenue = i === 3 ? 1000 : Math.random() * 500; // One day with ₱1000
        
        testData.push({
          date: dateString,
          revenue: revenue,
          bookings: revenue > 0 ? Math.floor(revenue / 200) : 0,
        });
      }
      
      console.log('Created test data:', testData);
      setDailyData(testData);
      return;
    }
    
    bookingsData.forEach(booking => {
      console.log('Processing booking:', {
        date: booking.date,
        price: booking.price,
        customerName: booking.customerName
      });
      
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

    console.log('Daily map after processing:', Array.from(dailyMap.entries()));

    // Generate data for the last 30 days, but prioritize showing data with actual bookings
    const last30Days: DailyData[] = [];
    const today = new Date();
    
    // If we have booking data, show the last 30 days from the most recent booking
    const bookingDates = Array.from(dailyMap.keys()).sort();
    let startDate: Date;
    let endDate: Date;
    
    if (bookingDates.length > 0) {
      // Find the earliest and latest booking dates
      const earliestBooking = new Date(bookingDates[0]);
      const latestBooking = new Date(bookingDates[bookingDates.length - 1]);
      
      // Start from 30 days before the earliest booking, or today if booking is in the future
      startDate = new Date(Math.min(earliestBooking.getTime() - 29 * 24 * 60 * 60 * 1000, today.getTime() - 29 * 24 * 60 * 60 * 1000));
      
      // End at the latest booking date, or today if booking is in the past
      endDate = new Date(Math.max(latestBooking.getTime(), today.getTime()));
      
      console.log('Booking dates found:', bookingDates);
      console.log('Earliest booking:', earliestBooking.toISOString().split('T')[0]);
      console.log('Latest booking:', latestBooking.toISOString().split('T')[0]);
    } else {
      // Fallback to last 30 days from today
      startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      endDate = today;
    }
    
    console.log('Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    
    // Generate data for the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
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

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      console.log(`Updating booking ${bookingId} to status: ${status}`);
      
      // Set loading state for this specific booking
      setUpdatingBooking(bookingId);
      
      // Call the firebaseService to update the booking status
      await firebaseService.updateBookingStatus(bookingId, status);
      
      // Show success message
      Alert.alert(
        'Success', 
        `Booking ${status === 'confirmed' ? 'approved' : 'rejected'} successfully!`,
        [{ text: 'OK' }]
      );
      
      // Refresh the data to show updated status
      await loadAdminData(true);
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert(
        'Error', 
        'Failed to update booking status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Clear loading state
      setUpdatingBooking(null);
    }
  };

  const handleBookingApproval = (bookingId: string, status: 'confirmed' | 'cancelled') => {
    const action = status === 'confirmed' ? 'approve' : 'reject';
    const booking = bookings.find(b => b.id === bookingId);
    const customerName = booking?.customerName || 'this booking';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Booking`,
      `Are you sure you want to ${action} ${customerName}'s booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: status === 'confirmed' ? 'default' : 'destructive',
          onPress: () => updateBookingStatus(bookingId, status)
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  // Get unique services and stylists for filter options
  const getUniqueServices = () => {
    const services = bookings.map(booking => booking.service).filter(Boolean);
    return Array.from(new Set(services)) as string[];
  };

  const getUniqueStylists = () => {
    const stylists = bookings.map(booking => booking.stylist).filter(Boolean);
    return Array.from(new Set(stylists)) as string[];
  };

  // Apply filters to bookings
  const applyFilters = () => {
    let filtered = [...bookings];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customerName?.toLowerCase().includes(query) ||
        booking.phone?.includes(query) ||
        booking.service?.toLowerCase().includes(query) ||
        booking.stylist?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filters.status !== 'All') {
      filtered = filtered.filter(booking => booking.status === filters.status.toLowerCase());
    }

    // Filter by service
    if (filters.service !== 'All') {
      filtered = filtered.filter(booking => booking.service === filters.service);
    }

    // Filter by stylist
    if (filters.stylist !== 'All') {
      filtered = filtered.filter(booking => booking.stylist === filters.stylist);
    }

    // Filter by date range
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.date);
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        return bookingDate >= fromDate && bookingDate <= toDate;
      });
    } else if (filters.dateRange !== 'All') {
      const today = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'Today':
          startDate = new Date(today);
          break;
        case 'Last 7 days':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'Last 30 days':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'Last 90 days':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startDate;
      });
    }

    setFilteredBookings(filtered);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: 'Last 30 days',
      service: 'All',
      stylist: 'All',
      fromDate: '',
      toDate: '',
      status: 'All',
    });
    setFilteredBookings(bookings);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return 'success';
        case 'pending':
          return 'warning';
        case 'cancelled':
          return 'error';
        case 'completed':
          return 'info';
        default:
          return 'neutral';
      }
    };

    return (
      <Badge 
        variant={getStatusVariant(status)}
        size="sm"
      >
        {status}
      </Badge>
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
            <Text style={styles.headerTitle}>Sales Dashboard</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Logout', 
                        style: 'destructive',
                        onPress: () => {
                          logout();
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
              >
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>
            </View>
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

          {/* Filter Indicator */}
          {(filters.status !== 'All' || filters.service !== 'All' || filters.stylist !== 'All' || filters.dateRange !== 'Last 30 days') && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIndicatorText}>
                Filters active: {[
                  filters.status !== 'All' && `Status: ${filters.status}`,
                  filters.service !== 'All' && `Service: ${filters.service}`,
                  filters.stylist !== 'All' && `Stylist: ${filters.stylist}`,
                  filters.dateRange !== 'Last 30 days' && `Date: ${filters.dateRange}`
                ].filter(Boolean).join(', ')}
              </Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.filterClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
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
              <View style={styles.chartTitleContainer}>
                <Text style={styles.sectionTitle}>Daily Revenue Trend</Text>
                <View style={styles.chartBadge}>
                  <Text style={styles.chartBadgeText}>Last 7 Days</Text>
                </View>
              </View>
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
                    <View style={styles.summaryIcon}>
                      <Text style={styles.summaryIconText}>📊</Text>
                    </View>
                    <Text style={styles.summaryLabel}>Total (7 days)</Text>
                    <Text style={styles.summaryValue}>
                      ₱{dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIcon}>
                      <Text style={styles.summaryIconText}>📈</Text>
                    </View>
                    <Text style={styles.summaryLabel}>Avg. Daily</Text>
                    <Text style={styles.summaryValue}>
                      ₱{Math.round(dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIcon}>
                      <Text style={styles.summaryIconText}>🏆</Text>
                    </View>
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
                          onPress={() => booking.id && handleBookingApproval(booking.id, 'confirmed')}
                          variant="primary"
                          size="sm"
                          style={styles.actionButton}
                          disabled={updatingBooking === booking.id}
                        >
                          {updatingBooking === booking.id ? 'Updating...' : 'Approve'}
                        </Button>
                        <Button
                          onPress={() => booking.id && handleBookingApproval(booking.id, 'cancelled')}
                          variant="danger"
                          size="sm"
                          style={styles.actionButton}
                          disabled={updatingBooking === booking.id}
                        >
                          {updatingBooking === booking.id ? 'Updating...' : 'Reject'}
                        </Button>
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
            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptions}>
                {['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'All'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.dateRange === option && styles.filterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: option }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.dateRange === option && styles.filterOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {['All', 'Pending', 'Confirmed', 'Cancelled'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.status === option && styles.filterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option && styles.filterOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Service</Text>
              <View style={styles.filterOptions}>
                {['All', ...getUniqueServices()].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.service === option && styles.filterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, service: option }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.service === option && styles.filterOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Stylist Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Stylist</Text>
              <View style={styles.filterOptions}>
                {['All', ...getUniqueStylists()].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.stylist === option && styles.filterOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, stylist: option }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.stylist === option && styles.filterOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button
              onPress={resetFilters}
              variant="secondary"
              style={styles.modalButton}
            >
              Reset
            </Button>
            <Button
              onPress={applyFilters}
              variant="primary"
              style={styles.modalButton}
            >
              Apply Filters
            </Button>
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
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold as any,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
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
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chartBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  chartBadgeText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: Typography.medium as any,
  },
  chartDateRange: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium as any,
  },
  chartContainer: {
    alignItems: 'center',
  },
  // Simple Chart Container - Clean and responsive
  simpleChartContainer: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 280,
  },
  
  // Chart Wrapper - Professional chart container
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    position: 'relative',
  },
  chart: {
    borderRadius: BorderRadius.lg,
  },
  
  // Y-axis labels
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 200,
    width: 50,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: Spacing.xs,
  },
  yAxisLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium as any,
    textAlign: 'right',
  },
  
  // X-axis labels
  xAxisLabels: {
    position: 'absolute',
    bottom: -25,
    left: 50,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  xAxisLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.medium as any,
  },
  xAxisLabelToday: {
    color: Colors.primary,
    fontWeight: Typography.bold as any,
  },
  
  // Chart Legend - Clean and simple
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium as any,
  },
  
  // Chart Summary
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconText: {
    fontSize: 18,
  },
  summaryLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.medium as any,
  },
  summaryValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold as any,
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
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 36,
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

  // Filter Components
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.medium as any,
  },
  filterOptionTextSelected: {
    color: Colors.white,
  },

  // Filter Indicator
  filterIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  filterIndicatorText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  filterClearText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.semibold as any,
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
  
  // Debug
  debugContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  
  // Spacer
  spacer: {
    height: 100,
  },
});

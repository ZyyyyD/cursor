import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import { useInventoryStore, useOrdersStore, useSalesStore, useCartStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  
  // Get data from stores
  const inventory = useInventoryStore((state) => state.items);
  const orders = useOrdersStore((state) => state.orders);
  const transactions = useSalesStore((state) => state.transactions);

  // Calculate stats dynamically
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.qty, 0);
    const stockValue = inventory.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const lowStockCount = inventory.filter(item => item.status === 'warning').length;
    const outOfStockCount = inventory.filter(item => item.status === 'danger').length;
    const pendingOrders = orders.filter(o => o.status !== 'success').length;
    
    // Sales stats
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const todayTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayTransactionCount = todayTransactions.length;
    
    // Items sold calculations
    const totalItemsSold = transactions.reduce((sum, t) => sum + (t.items?.length || 0), 0);
    const todayItemsSold = todayTransactions.reduce((sum, t) => sum + (t.items?.length || 0), 0);
    
    // Average transaction value
    const avgTransactionValue = transactions.length > 0 ? totalSales / transactions.length : 0;
    const profit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const todayProfit = todayTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    
    // Category breakdown
    const byCategory = inventory.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
      acc[cat].count += item.qty;
      acc[cat].value += item.qty * item.price;
      return acc;
    }, {});

    return {
      totalItems,
      totalStock,
      stockValue,
      lowStockCount,
      outOfStockCount,
      pendingOrders,
      totalSales,
      todaySales,
      byCategory,
      transactionCount: transactions.length,
      todayTransactionCount,
      totalItemsSold,
      todayItemsSold,
      avgTransactionValue,
      profit,
      todayProfit,
    };
  }, [inventory, orders, transactions]);

  // Recent low stock items for alerts
  const lowStockAlerts = useMemo(() => {
    return inventory
      .filter(item => item.status === 'warning' || item.status === 'danger')
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        text: item.status === 'danger' 
          ? `Out of stock: ${item.name}` 
          : `Low stock: ${item.name} (${item.qty} left)`,
        type: item.status === 'danger' ? 'danger' : 'warning',
      }));
  }, [inventory]);

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₱${(value / 1000).toFixed(1)}k`;
    return `₱${value.toFixed(2)}`;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <Pressable 
            style={styles.profileButton}
            onPress={() => handleNavigate('More')}
          >
            <Icon name="user" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* Daily Reports Overview */}
        <SectionHeader title="Today's Report" icon="calendar" action={formatDate()} />
        <Card style={styles.dailyReportCard}>
          <View style={styles.dailyReportHeader}>
            <View style={styles.dailyReportIconContainer}>
              <Icon name="sun" size={24} color={colors.orange} />
            </View>
            <View style={styles.dailyReportHeaderText}>
              <Text style={styles.dailyReportTitle}>Daily Summary</Text>
              <Text style={styles.dailyReportSubtitle}>Real-time overview of today's activity</Text>
            </View>
          </View>
          
          <View style={styles.dailyStatsGrid}>
            <View style={styles.dailyStat}>
              <View style={[styles.dailyStatIcon, { backgroundColor: colors.greenLight }]}>
                <Icon name="dollar-sign" size={16} color={colors.green} />
              </View>
              <Text style={styles.dailyStatValue}>{formatCurrency(stats.todaySales)}</Text>
              <Text style={styles.dailyStatLabel}>Today's Sales</Text>
            </View>
            <View style={styles.dailyStat}>
              <View style={[styles.dailyStatIcon, { backgroundColor: colors.blueLight }]}>
                <Icon name="shopping-bag" size={16} color={colors.blue} />
              </View>
              <Text style={styles.dailyStatValue}>{stats.todayTransactionCount}</Text>
              <Text style={styles.dailyStatLabel}>Transactions</Text>
            </View>
            <View style={styles.dailyStat}>
              <View style={[styles.dailyStatIcon, { backgroundColor: colors.purpleLight }]}>
                <Icon name="package" size={16} color={colors.purple} />
              </View>
              <Text style={styles.dailyStatValue}>{stats.todayItemsSold}</Text>
              <Text style={styles.dailyStatLabel}>Items Sold</Text>
            </View>
            <View style={styles.dailyStat}>
              <View style={[styles.dailyStatIcon, { backgroundColor: colors.orangeLight }]}>
                <Icon name="trending-up" size={16} color={colors.orange} />
              </View>
              <Text style={styles.dailyStatValue}>{formatCurrency(stats.todayProfit)}</Text>
              <Text style={styles.dailyStatLabel}>Today's Profit</Text>
            </View>
          </View>
        </Card>

        {/* Total Reports Summary */}
        <SectionHeader title="Total Reports" icon="bar-chart-2" action="All Time" onAction={() => handleNavigate('Reports')} />
        <Card style={styles.totalReportCard}>
          <View style={styles.totalReportRow}>
            <View style={styles.totalReportItem}>
              <Icon name="dollar-sign" size={20} color={colors.primary} />
              <View style={styles.totalReportTextContainer}>
                <Text style={styles.totalReportValue}>{formatCurrency(stats.totalSales)}</Text>
                <Text style={styles.totalReportLabel}>Total Revenue</Text>
              </View>
            </View>
            <View style={styles.totalReportDivider} />
            <View style={styles.totalReportItem}>
              <Icon name="shopping-cart" size={20} color={colors.green} />
              <View style={styles.totalReportTextContainer}>
                <Text style={styles.totalReportValue}>{stats.transactionCount}</Text>
                <Text style={styles.totalReportLabel}>Total Transactions</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.totalReportRow}>
            <View style={styles.totalReportItem}>
              <Icon name="package" size={20} color={colors.purple} />
              <View style={styles.totalReportTextContainer}>
                <Text style={styles.totalReportValue}>{stats.totalItemsSold}</Text>
                <Text style={styles.totalReportLabel}>Items Sold</Text>
              </View>
            </View>
            <View style={styles.totalReportDivider} />
            <View style={styles.totalReportItem}>
              <Icon name="activity" size={20} color={colors.orange} />
              <View style={styles.totalReportTextContainer}>
                <Text style={styles.totalReportValue}>{stats.profit}</Text>
                <Text style={styles.totalReportLabel}>Total Profit</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.viewFullReportBtn} onPress={() => handleNavigate('Reports')}>
            <Text style={styles.viewFullReportText}>View Full Reports</Text>
            <Icon name="arrow-right" size={16} color={colors.primary} />
          </Pressable>
        </Card>

        {/* Functions Overview */}
        <SectionHeader title="Quick Access" icon="grid" />
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard} onPress={() => handleNavigate('POS')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.pinkLight }]}>
              <Icon name="shopping-bag" size={20} color={colors.pink} />
            </View>
            <Text style={styles.metricLabel}>New Sale</Text>
            <Text style={styles.metricValue}>POS</Text>
          </Card>
          <Card style={styles.metricCard} onPress={() => handleNavigate('Receive')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.blueLight }]}>
              <Icon name="truck" size={20} color={colors.blue} />
            </View>
            <Text style={styles.metricLabel}>Receive Stock</Text>
            <Text style={styles.metricValue}>Supplier</Text>
          </Card>
        </View>
        {/* Inventory Overview */}
        <SectionHeader title="Stock Overview" icon="package" action="View All" onAction={() => handleNavigate('Inventory')} />
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard} onPress={() => handleNavigate('Inventory')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.purpleLight }]}>
              <Icon name="box" size={20} color={colors.purple} />
            </View>
            <Text style={styles.metricLabel}>Total Products</Text>
            <Text style={styles.metricValue}>{stats.totalItems}</Text>
          </Card>
          <Card style={styles.metricCard} onPress={() => handleNavigate('Inventory')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.greenLight }]}>
              <Icon name="layers" size={20} color={colors.green} />
            </View>
            <Text style={styles.metricLabel}>Stock Value</Text>
            <Text style={styles.metricValue}>{formatCurrency(stats.stockValue)}</Text>
          </Card>
          <Card style={[styles.metricCard, stats.lowStockCount > 0 && styles.warningCard]} onPress={() => handleNavigate('Inventory')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.yellowLight }]}>
              <Icon name="alert-triangle" size={20} color={colors.yellow} />
            </View>
            <Text style={styles.metricLabel}>Low Stock</Text>
            <Text style={[styles.metricValue, stats.lowStockCount > 0 && { color: colors.warning }]}>
              {stats.lowStockCount}
            </Text>
          </Card>
          <Card style={[styles.metricCard, stats.outOfStockCount > 0 && styles.dangerCard]} onPress={() => handleNavigate('Inventory')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.redLight }]}>
              <Icon name="x-circle" size={20} color={colors.red} />
            </View>
            <Text style={styles.metricLabel}>Out of Stock</Text>
            <Text style={[styles.metricValue, stats.outOfStockCount > 0 && { color: colors.danger }]}>
              {stats.outOfStockCount}
            </Text>
          </Card>
        </View>

        {/* Quick Actions 
        <SectionHeader title="Quick Actions" icon="zap" />
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => handleNavigate('Scan')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
              <Icon name="camera" size={22} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Scan</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleNavigate('Inventory')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.green }]}>
              <Icon name="plus" size={22} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Add Item</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleNavigate('POS')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.orange }]}>
              <Icon name="shopping-cart" size={22} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>New Sale</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleNavigate('Reports')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.purple }]}>
              <Icon name="download" size={22} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Export</Text>
          </Pressable>
        </View>*/}

        {/* Alerts */}
        {lowStockAlerts.length > 0 && (
          <>
            <SectionHeader title="Stock Alerts" icon="alert-circle" action={`${lowStockAlerts.length} items`} />
            <Card style={styles.alertsCard}>
              {lowStockAlerts.map((alert, index) => (
                <Pressable
                  key={alert.id}
                  onPress={() => handleNavigate('Inventory')}
                  style={[styles.alertRow, index < lowStockAlerts.length - 1 && styles.alertBorder]}
                >
                  <View style={[
                    styles.alertDot, 
                    { backgroundColor: alert.type === 'warning' ? colors.warning : colors.danger }
                  ]} />
                  <Text style={styles.alertText} numberOfLines={1}>{alert.text}</Text>
                  <Icon name="chevron-right" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          </>
        )}

        {/* Empty State */}
        {stats.totalItems === 0 && (
          <Card style={styles.emptyCard}>
            <Icon name="inbox" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No inventory yet</Text>
            <Text style={styles.emptyText}>Add your first item to get started</Text>
            <Pressable style={styles.emptyBtn} onPress={() => handleNavigate('Inventory')}>
              <Icon name="plus" size={18} color={colors.surface} />
              <Text style={styles.emptyBtnText}>Add First Item</Text>
            </Pressable>
          </Card>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.lg,
  },
  warningCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  dangerCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metricValue: {
    ...typography.metric,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  alertsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  alertBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
  },
  emptyBtnText: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  // Daily Report Styles
  dailyReportCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dailyReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dailyReportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dailyReportHeaderText: {
    flex: 1,
  },
  dailyReportTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  dailyReportSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  dailyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  dailyStat: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dailyStatIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dailyStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  dailyStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Total Report Styles
  totalReportCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  totalReportRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  totalReportItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  totalReportDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  totalReportTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  totalReportValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 16,
  },
  totalReportLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  viewFullReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  viewFullReportText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});

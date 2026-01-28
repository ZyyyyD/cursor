import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import { useInventoryStore, useOrdersStore, useSalesStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function ReportsScreen() {
  const inventory = useInventoryStore((state) => state.items);
  const orders = useOrdersStore((state) => state.orders);
  const transactions = useSalesStore((state) => state.transactions);

  // Calculate all stats dynamically
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const totalCost = inventory.reduce((sum, item) => sum + (item.qty * (item.cost || 0)), 0);
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const lowStockCount = inventory.filter(i => i.status === 'warning' || i.status === 'danger').length;
    
    // Today's stats
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Category breakdown
    const byCategory = inventory.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { items: 0, qty: 0, value: 0 };
      acc[cat].items += 1;
      acc[cat].qty += item.qty;
      acc[cat].value += item.qty * item.price;
      return acc;
    }, {});

    return {
      totalValue,
      totalCost,
      totalSales,
      totalProfit,
      lowStockCount,
      todaySales,
      todayTransactionCount: todayTransactions.length,
      transactionCount: transactions.length,
      productCount: inventory.length,
      byCategory,
    };
  }, [inventory, transactions]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(2)}`;
  };

  const reports = [
    { 
      title: 'Inventory Summary', 
      subtitle: `${stats.productCount} products, ${formatCurrency(stats.totalValue)} value`, 
      icon: 'package', 
      color: colors.purple,
      onView: () => {
        const byCategory = Object.entries(stats.byCategory)
          .map(([cat, data]) => `${cat}: ${data.items} items, ${data.qty} units, ${formatCurrency(data.value)}`)
          .join('\n');
        Alert.alert('Inventory Summary', 
          `Total Products: ${stats.productCount}\nTotal Stock Value: ${formatCurrency(stats.totalValue)}\nTotal Cost Value: ${formatCurrency(stats.totalCost)}\n\nBy Category:\n${byCategory || 'No categories yet'}`
        );
      },
    },
    { 
      title: 'Low Stock Report', 
      subtitle: `${stats.lowStockCount} items need attention`, 
      icon: 'alert-triangle', 
      color: colors.warning,
      onView: () => {
        const lowItems = inventory
          .filter(i => i.status === 'warning' || i.status === 'danger')
          .map(i => `• ${i.name}: ${i.qty} left (min: ${i.min})`)
          .join('\n');
        Alert.alert('Low Stock Items', lowItems || 'All items are well stocked!');
      },
    },
    { 
      title: 'Sales Report', 
      subtitle: `${stats.transactionCount} transactions, ${formatCurrency(stats.totalSales)} total`, 
      icon: 'trending-up', 
      color: colors.success,
      onView: () => {
        Alert.alert('Sales Report', 
          `Total Transactions: ${stats.transactionCount}\nTotal Sales: ${formatCurrency(stats.totalSales)}\nTotal Profit: ${formatCurrency(stats.totalProfit)}\n\nToday:\nTransactions: ${stats.todayTransactionCount}\nSales: ${formatCurrency(stats.todaySales)}`
        );
      },
    },
    { 
      title: 'Purchase Orders', 
      subtitle: `${orders.length} orders`, 
      icon: 'truck', 
      color: colors.blue,
      onView: () => {
        const pending = orders.filter(o => o.status !== 'success').length;
        const received = orders.filter(o => o.status === 'success').length;
        const totalValue = orders.reduce((sum, o) => sum + o.total, 0);
        Alert.alert('Purchase Orders', 
          `Total Orders: ${orders.length}\nPending: ${pending}\nReceived: ${received}\nTotal Value: ${formatCurrency(totalValue)}`
        );
      },
    },
  ];

  const handleExport = (reportTitle) => {
    Alert.alert(
      'Export Report',
      `Export "${reportTitle}" to XLSX?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', `${reportTitle} exported!`) }
      ]
    );
  };

  const handleExportAll = () => {
    Alert.alert(
      'Export All Data',
      'Export all inventory and sales data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'All data exported to Inventory_Export.xlsx') }
      ]
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Pressable style={styles.exportAllBtn} onPress={handleExportAll}>
            <Icon name="download" size={18} color={colors.primary} />
            <Text style={styles.exportAllText}>Export All</Text>
          </Pressable>
        </View>

        {/* Overview Card */}
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overviewCard}
        >
          <Text style={styles.overviewTitle}>Business Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{formatCurrency(stats.totalSales)}</Text>
              <Text style={styles.overviewLabel}>Total Sales</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{formatCurrency(stats.totalValue)}</Text>
              <Text style={styles.overviewLabel}>Stock Value</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{stats.productCount}</Text>
              <Text style={styles.overviewLabel}>Products</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Card style={styles.quickStatCard}>
            <Icon name="shopping-bag" size={24} color={colors.orange} />
            <Text style={styles.quickStatValue}>{stats.todayTransactionCount}</Text>
            <Text style={styles.quickStatLabel}>Today Sales</Text>
          </Card>
          <Card style={styles.quickStatCard}>
            <Icon name="dollar-sign" size={24} color={colors.green} />
            <Text style={styles.quickStatValue}>{formatCurrency(stats.todaySales)}</Text>
            <Text style={styles.quickStatLabel}>Today Revenue</Text>
          </Card>
        </View>

        {/* Reports List */}
        <SectionHeader title="Available Reports" icon="file-text" />
        {reports.map((report) => (
          <Card key={report.title} style={styles.reportCard}>
            <Pressable style={styles.reportContent} onPress={report.onView}>
              <View style={[styles.reportIcon, { backgroundColor: `${report.color}15` }]}>
                <Icon name={report.icon} size={22} color={report.color} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportSubtitle}>{report.subtitle}</Text>
              </View>
            </Pressable>
            <View style={styles.reportActions}>
              <Pressable style={styles.reportActionBtn} onPress={report.onView}>
                <Icon name="eye" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable style={[styles.reportActionBtn, styles.exportBtn]} onPress={() => handleExport(report.title)}>
                <Icon name="download" size={16} color={colors.surface} />
              </Pressable>
            </View>
          </Card>
        ))}

        {/* Empty State */}
        {stats.productCount === 0 && stats.transactionCount === 0 && (
          <Card style={styles.emptyCard}>
            <Icon name="bar-chart-2" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>Add inventory items and make sales to see reports</Text>
          </Card>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  exportAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: `${colors.primary}15` },
  exportAllText: { ...typography.captionMedium, color: colors.primary },
  overviewCard: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg, ...shadow.lg },
  overviewTitle: { ...typography.captionMedium, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.lg },
  overviewStats: { flexDirection: 'row' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  overviewValue: { ...typography.h2, color: colors.surface },
  overviewLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  quickStats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  quickStatCard: { flex: 1, alignItems: 'center', padding: spacing.lg },
  quickStatValue: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  quickStatLabel: { ...typography.caption, color: colors.textMuted },
  reportCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  reportContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  reportIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  reportInfo: { flex: 1 },
  reportTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 2 },
  reportSubtitle: { ...typography.caption, color: colors.textMuted },
  reportActions: { flexDirection: 'row', gap: spacing.sm },
  reportActionBtn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center' },
  exportBtn: { backgroundColor: colors.primary },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

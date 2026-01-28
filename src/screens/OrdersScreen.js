import React, { useState, useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useInventoryStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function OrdersScreen() {
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const inventory = useInventoryStore((state) => state.items);

  // Received products state (main table)
  const [receivedProducts, setReceivedProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  // Multiple entries state (pending items in modal)
  const [pendingItems, setPendingItems] = useState([]);

  // Calculate totals for main table
  const totals = useMemo(() => {
    const totalQty = receivedProducts.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = receivedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    return { totalQty, totalAmount };
  }, [receivedProducts]);

  // Calculate totals for pending items in modal
  const pendingTotals = useMemo(() => {
    const totalQty = pendingItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = pendingItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return { totalQty, totalAmount };
  }, [pendingItems]);

  // Stats by supplier
  const supplierStats = useMemo(() => {
    const suppliers = [...new Set(receivedProducts.map(p => p.supplier))];
    return suppliers.length;
  }, [receivedProducts]);

  // Add item to pending list
  const handleAddToList = () => {
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid unit price');
      return;
    }

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const total = qty * price;

    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      productName: productName.trim(),
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
    };

    setPendingItems([...pendingItems, newItem]);
    
    // Reset product fields only (keep supplier)
    setProductName('');
    setQuantity('');
    setUnitPrice('');
  };

  // Remove item from pending list
  const handleRemoveFromList = (id) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
  };

  // Save all pending items to main table
  const handleSaveAll = () => {
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }
    if (pendingItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    const dateReceived = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newProducts = pendingItems.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      supplier: supplierName.trim(),
      dateReceived,
    }));

    // Add to main table
    setReceivedProducts([...newProducts, ...receivedProducts]);
    
    // Update inventory stock for each product
    newProducts.forEach(product => {
      const existingItem = inventory.find(
        item => item.name.toLowerCase() === product.productName.toLowerCase()
      );
      if (existingItem) {
        adjustStock(existingItem.id, product.quantity, 'in');
      }
    });

    // Reset everything
    setPendingItems([]);
    setSupplierName('');
    setProductName('');
    setQuantity('');
    setUnitPrice('');
    setModalVisible(false);
    
    Alert.alert('Success', `Received ${newProducts.length} product(s) from ${supplierName}`);
  };

  // Close modal and reset
  const handleCloseModal = () => {
    if (pendingItems.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved products. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setPendingItems([]);
              setSupplierName('');
              setProductName('');
              setQuantity('');
              setUnitPrice('');
              setModalVisible(false);
            }
          }
        ]
      );
    } else {
      setModalVisible(false);
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to remove this received product entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReceivedProducts(receivedProducts.filter(p => p.id !== id));
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (receivedProducts.length === 0) return;
    
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all received products?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setReceivedProducts([]);
          }
        }
      ]
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Receive Stock</Text>
            <Text style={styles.subtitle}>From Supplier</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Icon name="plus" size={20} color={colors.surface} />
          </Pressable>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
              <Icon name="package" size={18} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{receivedProducts.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Icon name="box" size={18} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{totals.totalQty}</Text>
            <Text style={styles.statLabel}>Total Qty</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="users" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{supplierStats}</Text>
            <Text style={styles.statLabel}>Suppliers</Text>
          </Card>
        </View>

        {/* Total Amount Card */}
        <Card style={styles.totalCard}>
          <View style={styles.totalCardContent}>
            <View>
              <Text style={styles.totalCardLabel}>Total Amount Received</Text>
              <Text style={styles.totalCardSubtext}>From all suppliers</Text>
            </View>
            <Text style={styles.totalCardValue}>₱{totals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
        </Card>

        {/* Table Header */}
        {receivedProducts.length > 0 && (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, styles.colSupplier]}>Supplier</Text>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Product</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
              <Text style={[styles.tableHeaderText, styles.colAction]}></Text>
            </View>

            {/* Table Rows */}
            {receivedProducts.map((item, index) => (
              <View 
                key={item.id} 
                style={[
                  styles.tableRow, 
                  index % 2 === 0 && styles.tableRowEven
                ]}
              >
                <View style={styles.colSupplier}>
                  <Text style={styles.tableCellText} numberOfLines={1}>{item.supplier}</Text>
                  <Text style={styles.tableCellDate}>{item.dateReceived}</Text>
                </View>
                <Text style={[styles.tableCellText, styles.colProduct]} numberOfLines={2}>{item.productName}</Text>
                <Text style={[styles.tableCellText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCellText, styles.colPrice]}>₱{item.unitPrice.toFixed(2)}</Text>
                <Text style={[styles.tableCellText, styles.tableCellTotal, styles.colTotal]}>₱{item.totalPrice.toFixed(2)}</Text>
                <Pressable 
                  style={styles.colAction} 
                  onPress={() => handleDeleteProduct(item.id)}
                  hitSlop={8}
                >
                  <Icon name="trash-2" size={16} color={colors.error} />
                </Pressable>
              </View>
            ))}

            {/* Table Footer Totals */}
            <View style={styles.tableFooter}>
              <Text style={styles.tableFooterLabel}>TOTALS</Text>
              <Text style={styles.tableFooterQty}>{totals.totalQty}</Text>
              <Text style={styles.tableFooterTotal}>₱{totals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {receivedProducts.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icon name="truck" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Products Received</Text>
            <Text style={styles.emptyText}>Tap the + button to record incoming stock from suppliers</Text>
            <Button 
              title="Receive Stock" 
              icon="plus" 
              onPress={() => setModalVisible(true)} 
              style={styles.emptyButton}
            />
          </View>
        )}

        {/* Clear All Button */}
        {receivedProducts.length > 0 && (
          <Button 
            title="Clear All Entries" 
            variant="outline" 
            icon="trash-2"
            onPress={handleClearAll}
            style={styles.clearButton}
          />
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Add Multiple Products Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={handleCloseModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive Products</Text>
              <Pressable onPress={handleCloseModal}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Supplier Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.input}
                  value={supplierName}
                  onChangeText={setSupplierName}
                  placeholder="Enter supplier name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Product Entry Section */}
              <View style={styles.entrySection}>
                <Text style={styles.sectionTitle}>Add Product</Text>
                
                {/* Product Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Enter product name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Quantity and Unit Price Row */}
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Unit Price (₱) *</Text>
                    <TextInput
                      style={styles.input}
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Preview Subtotal */}
                {quantity && unitPrice && (
                  <View style={styles.subtotalPreview}>
                    <Text style={styles.subtotalLabel}>Subtotal:</Text>
                    <Text style={styles.subtotalValue}>
                      ₱{(parseInt(quantity || 0) * parseFloat(unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}

                {/* Add to List Button */}
                <Button 
                  title="Add to List" 
                  icon="plus"
                  variant="outline"
                  onPress={handleAddToList} 
                  style={styles.addToListButton}
                />
              </View>

              {/* Pending Items List */}
              {pendingItems.length > 0 && (
                <View style={styles.pendingSection}>
                  <View style={styles.pendingSectionHeader}>
                    <Text style={styles.sectionTitle}>Products to Receive</Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{pendingItems.length}</Text>
                    </View>
                  </View>

                  {/* Pending Items Table */}
                  <View style={styles.pendingTable}>
                    <View style={styles.pendingTableHeader}>
                      <Text style={[styles.pendingHeaderText, { flex: 2.5 }]}>Product</Text>
                      <Text style={[styles.pendingHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.pendingHeaderText, { flex: 1.5, textAlign: 'right' }]}>Price</Text>
                      <Text style={[styles.pendingHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                      <View style={{ width: 32 }} />
                    </View>

                    {pendingItems.map((item, index) => (
                      <View key={item.id} style={[styles.pendingRow, index % 2 === 0 && styles.pendingRowEven]}>
                        <Text style={[styles.pendingCellText, { flex: 2.5 }]} numberOfLines={1}>{item.productName}</Text>
                        <Text style={[styles.pendingCellText, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                        <Text style={[styles.pendingCellText, { flex: 1.5, textAlign: 'right' }]}>₱{item.unitPrice.toFixed(2)}</Text>
                        <Text style={[styles.pendingCellText, styles.pendingCellTotal, { flex: 1.5, textAlign: 'right' }]}>₱{item.totalPrice.toFixed(2)}</Text>
                        <Pressable 
                          style={styles.pendingRemoveBtn}
                          onPress={() => handleRemoveFromList(item.id)}
                          hitSlop={8}
                        >
                          <Icon name="x" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    ))}

                    {/* Pending Totals */}
                    <View style={styles.pendingTotalRow}>
                      <Text style={[styles.pendingTotalLabel, { flex: 2.5 }]}>TOTAL</Text>
                      <Text style={[styles.pendingTotalText, { flex: 1, textAlign: 'center' }]}>{pendingTotals.totalQty}</Text>
                      <Text style={[styles.pendingTotalText, { flex: 1.5 }]}></Text>
                      <Text style={[styles.pendingTotalAmount, { flex: 1.5, textAlign: 'right' }]}>₱{pendingTotals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                      <View style={{ width: 32 }} />
                    </View>
                  </View>
                </View>
              )}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <Button 
                  title="Cancel" 
                  variant="outline" 
                  onPress={handleCloseModal} 
                  style={{ flex: 1 }} 
                />
                <Button 
                  title={`Save All (${pendingItems.length})`}
                  icon="check"
                  onPress={handleSaveAll} 
                  style={{ flex: 1 }}
                  disabled={pendingItems.length === 0}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  
  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md },
  statIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  
  // Total Card
  totalCard: { marginBottom: spacing.lg, backgroundColor: colors.primary },
  totalCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalCardLabel: { ...typography.bodyMedium, color: colors.surface },
  totalCardSubtext: { ...typography.caption, color: colors.surface, opacity: 0.8 },
  totalCardValue: { ...typography.h2, color: colors.surface },
  
  // Table
  tableContainer: { backgroundColor: colors.surface, borderRadius: radius.md, ...shadow.sm, overflow: 'hidden', marginBottom: spacing.lg },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: colors.surfaceHover, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeaderText: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, alignItems: 'center' },
  tableRowEven: { backgroundColor: colors.surfaceHover + '50' },
  tableCellText: { ...typography.caption, color: colors.textPrimary },
  tableCellDate: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 },
  tableCellTotal: { ...typography.captionMedium, color: colors.primary },
  
  // Table Columns
  colSupplier: { flex: 2, paddingRight: spacing.xs },
  colProduct: { flex: 2, paddingRight: spacing.xs },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  colAction: { width: 30, alignItems: 'center' },
  
  // Table Footer
  tableFooter: { flexDirection: 'row', backgroundColor: colors.primaryLight + '20', paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' },
  tableFooterLabel: { flex: 4, ...typography.captionMedium, color: colors.textPrimary },
  tableFooterQty: { flex: 1, ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'center' },
  tableFooterTotal: { flex: 2.7, ...typography.bodyMedium, color: colors.primary, textAlign: 'right', marginRight: 30 },
  
  // Empty State
  emptyState: { alignItems: 'center', padding: spacing.xxl },
  emptyIconContainer: { width: 100, height: 100, borderRadius: radius.full, backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  emptyButton: { minWidth: 160 },
  
  // Clear Button
  clearButton: { marginTop: spacing.md },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  
  // Input
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.md, ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  
  // Entry Section
  entrySection: { backgroundColor: colors.surfaceHover, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.md },
  
  // Subtotal Preview
  subtotalPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.sm },
  subtotalLabel: { ...typography.caption, color: colors.textSecondary },
  subtotalValue: { ...typography.bodyMedium, color: colors.primary },
  
  // Add to List Button
  addToListButton: { marginTop: spacing.sm },
  
  // Pending Section
  pendingSection: { marginBottom: spacing.md },
  pendingSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  pendingBadge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm },
  pendingBadgeText: { ...typography.caption, color: colors.surface, fontWeight: '600' },
  
  // Pending Table
  pendingTable: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  pendingTableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceHover, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  pendingHeaderText: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10 },
  pendingRow: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, alignItems: 'center' },
  pendingRowEven: { backgroundColor: colors.surfaceHover + '30' },
  pendingCellText: { ...typography.caption, color: colors.textPrimary, fontSize: 12 },
  pendingCellTotal: { ...typography.captionMedium, color: colors.primary },
  pendingRemoveBtn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  pendingTotalRow: { flexDirection: 'row', backgroundColor: colors.primaryLight + '20', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  pendingTotalLabel: { ...typography.captionMedium, color: colors.textPrimary, fontSize: 11 },
  pendingTotalText: { ...typography.captionMedium, color: colors.textPrimary, fontSize: 12 },
  pendingTotalAmount: { ...typography.bodyMedium, color: colors.primary, fontSize: 13 },
});

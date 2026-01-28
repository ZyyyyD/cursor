import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useInventoryStore, useScanStore, useCartStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

const statusLabel = {
  success: 'In Stock',
  warning: 'Low Stock',
  danger: 'Out of Stock',
};

export default function ScanScreen() {
  const inventory = useInventoryStore((state) => state.items);
  const getItemByBarcode = useInventoryStore((state) => state.getItemByBarcode);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const lastScanned = useScanStore((state) => state.lastScanned);
  const setLastScanned = useScanStore((state) => state.setLastScanned);
  const scanHistory = useScanStore((state) => state.history);
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');

  const simulateScan = () => {
    // Simulate scanning a random item
    const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
    if (randomItem) {
      setLastScanned(randomItem);
      Alert.alert('Scanned!', `Found: ${randomItem.name}`);
    }
  };

  const handleManualEntry = () => {
    const item = getItemByBarcode(manualBarcode.trim());
    if (item) {
      setLastScanned(item);
      setManualModalVisible(false);
      setManualBarcode('');
    } else {
      Alert.alert('Not Found', 'No item found with this barcode', [
        { text: 'Try Again' },
        { text: 'Add New Item', onPress: () => Alert.alert('Add Item', 'Navigate to add item form') }
      ]);
    }
  };

  const handleQuickAdjust = (type) => {
    setAdjustType(type);
    setAdjustQty('');
    setAdjustModalVisible(true);
  };

  const processAdjustment = () => {
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (adjustType === 'out' && qty > lastScanned.qty) {
      Alert.alert('Error', 'Cannot remove more than available stock');
      return;
    }
    
    adjustStock(lastScanned.id, qty, adjustType);
    setAdjustModalVisible(false);
    
    // Update last scanned with new qty
    const updatedItem = inventory.find(i => i.id === lastScanned.id);
    if (updatedItem) {
      setLastScanned({ ...updatedItem, qty: adjustType === 'in' ? lastScanned.qty + qty : lastScanned.qty - qty });
    }
    
    Alert.alert('Success', `Stock ${adjustType === 'in' ? 'added' : 'removed'} successfully!`);
  };

  const handleAddToCart = () => {
    if (lastScanned && lastScanned.qty > 0) {
      addToCart(lastScanned);
      Alert.alert('Added to Cart', `${lastScanned.name} added to POS cart`);
    } else {
      Alert.alert('Out of Stock', 'This item is currently out of stock');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan</Text>
          <Pressable style={styles.historyButton} onPress={() => setHistoryModalVisible(true)}>
            <Icon name="clock" size={20} color={colors.textSecondary} />
            {scanHistory.length > 0 && <View style={styles.historyBadge} />}
          </Pressable>
        </View>

        {/* Scanner Area */}
        <Pressable style={styles.scannerContainer} onPress={simulateScan}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            style={styles.scannerGradient}
          >
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.scanHint}>Tap to simulate scan</Text>
            <Text style={styles.scanSubHint}>or use manual entry below</Text>
          </LinearGradient>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => setManualModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="edit-3" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Manual</Text>
          </Pressable>
          <Pressable style={styles.mainScanBtn} onPress={simulateScan}>
            <LinearGradient colors={colors.primaryGradient} style={styles.mainScanGradient}>
              <Icon name="camera" size={28} color={colors.surface} />
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => Alert.alert('Flash', 'Toggle flashlight')}>
            <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}15` }]}>
              <Icon name="zap" size={20} color={colors.accent} />
            </View>
            <Text style={styles.actionLabel}>Flash</Text>
          </Pressable>
        </View>

        {/* Last Scanned Result */}
        {lastScanned ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Icon name="check-circle" size={20} color={colors.success} />
              </View>
              <Text style={styles.resultLabel}>Last Scanned</Text>
            </View>
            <View style={styles.resultBody}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{lastScanned.name}</Text>
                <Text style={styles.resultMeta}>SKU: {lastScanned.sku} · Barcode: {lastScanned.barcode}</Text>
              </View>
              <Badge label={statusLabel[lastScanned.status]} status={lastScanned.status} size="sm" />
            </View>
            <View style={styles.resultFooter}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{lastScanned.qty}</Text>
                <Text style={styles.resultStatLabel}>In Stock</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>${lastScanned.price.toFixed(2)}</Text>
                <Text style={styles.resultStatLabel}>Unit Price</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{lastScanned.location}</Text>
                <Text style={styles.resultStatLabel}>Location</Text>
              </View>
            </View>
            <View style={styles.resultActions}>
              <Button title="Stock In" variant="outline" size="sm" icon="plus" onPress={() => handleQuickAdjust('in')} style={{ flex: 1 }} />
              <Button title="Stock Out" variant="outline" size="sm" icon="minus" onPress={() => handleQuickAdjust('out')} style={{ flex: 1 }} />
              <Button title="Add to Cart" size="sm" icon="shopping-cart" onPress={handleAddToCart} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Icon name="camera-off" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No item scanned yet</Text>
            <Text style={styles.emptySubtext}>Tap the scanner or enter barcode manually</Text>
          </Card>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal visible={manualModalVisible} transparent animationType="slide" onRequestClose={() => setManualModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setManualModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Barcode</Text>
              <Pressable onPress={() => setManualModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={styles.barcodeInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode number"
              placeholderTextColor={colors.textMuted}
              keyboardType="default"
              autoFocus
            />
            <Text style={styles.hintText}>Try: 8901234567001, 8901234567003, etc.</Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setManualModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Search" onPress={handleManualEntry} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal visible={historyModalVisible} transparent animationType="slide" onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan History</Text>
              <Pressable onPress={() => setHistoryModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            {scanHistory.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No scan history yet</Text>
            ) : (
              scanHistory.slice(0, 10).map((item, index) => (
                <Pressable 
                  key={`${item.id}-${index}`} 
                  style={styles.historyItem}
                  onPress={() => { setLastScanned(item); setHistoryModalVisible(false); }}
                >
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.historyItemName}>{item.name}</Text>
                    <Text style={styles.historyItemMeta}>{item.sku} · {new Date(item.scannedAt).toLocaleTimeString()}</Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal visible={adjustModalVisible} transparent animationType="slide" onRequestClose={() => setAdjustModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setAdjustModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock {adjustType === 'in' ? 'In' : 'Out'}</Text>
              <Pressable onPress={() => setAdjustModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            {lastScanned && (
              <>
                <Text style={styles.adjustItemName}>{lastScanned.name}</Text>
                <Text style={styles.adjustItemMeta}>Current stock: {lastScanned.qty} units</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.modalActions}>
                  <Button title="Cancel" variant="outline" onPress={() => setAdjustModalVisible(false)} style={{ flex: 1 }} />
                  <Button 
                    title={adjustType === 'in' ? 'Add Stock' : 'Remove Stock'}
                    variant={adjustType === 'in' ? 'primary' : 'danger'}
                    onPress={processAdjustment} 
                    style={{ flex: 1 }} 
                  />
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  historyButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  historyBadge: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface,
  },
  scannerContainer: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.xl, ...shadow.lg },
  scannerGradient: { padding: spacing.xl, alignItems: 'center' },
  scannerFrame: {
    width: 240, height: 180, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative', marginBottom: spacing.lg,
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.surface },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.sm },
  scanLine: { position: 'absolute', left: 16, right: 16, top: '50%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },
  scanHint: { ...typography.body, color: 'rgba(255,255,255,0.9)' },
  scanSubHint: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.xl, marginBottom: spacing.xl },
  actionBtn: { alignItems: 'center', gap: spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...typography.caption, color: colors.textSecondary },
  mainScanBtn: { marginBottom: spacing.sm },
  mainScanGradient: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', ...shadow.lg },
  resultCard: { padding: 0, overflow: 'hidden' },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.successLight,
  },
  resultIcon: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { ...typography.captionMedium, color: colors.success },
  resultBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  resultInfo: { flex: 1 },
  resultName: { ...typography.h3, color: colors.textPrimary, marginBottom: 4 },
  resultMeta: { ...typography.caption, color: colors.textMuted },
  resultFooter: { flexDirection: 'row', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  resultStat: { flex: 1, alignItems: 'center' },
  resultDivider: { width: 1, backgroundColor: colors.border },
  resultStatValue: { ...typography.bodyMedium, color: colors.textPrimary },
  resultStatLabel: { ...typography.caption, color: colors.textMuted },
  resultActions: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  barcodeInput: {
    backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.lg,
    ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  hintText: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  emptyHistoryText: { ...typography.body, color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  historyItemInfo: { flex: 1 },
  historyItemName: { ...typography.body, color: colors.textPrimary },
  historyItemMeta: { ...typography.caption, color: colors.textMuted },
  adjustItemName: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  adjustItemMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xl },
  qtyInput: {
    backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.lg,
    ...typography.h2, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    textAlign: 'center', marginBottom: spacing.lg,
  },
});

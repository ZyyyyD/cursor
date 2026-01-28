import React, { useState, useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import SearchBar from '../components/SearchBar';
import Button from '../components/Button';
import { useInventoryStore, useCartStore, useSalesStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function PosScreen() {
  const inventory = useInventoryStore((state) => state.items);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  
  const cart = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const discount = useCartStore((state) => state.discount);
  const setDiscount = useCartStore((state) => state.setDiscount);
  
  const addTransaction = useSalesStore((state) => state.addTransaction);

  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cartExpanded, setCartExpanded] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [discountInput, setDiscountInput] = useState('');

  // Get categories from inventory
  const categories = useMemo(() => {
    const cats = [...new Set(inventory.map(item => item.category).filter(Boolean))];
    return ['All', ...cats];
  }, [inventory]);

  // Filter products (only show items with stock)
  const products = useMemo(() => {
    let result = inventory.filter(item => item.qty > 0);
    
    if (activeCategory !== 'All') {
      result = result.filter(item => item.category === activeCategory);
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower) ||
        item.barcode?.includes(search)
      );
    }
    
    return result;
  }, [inventory, activeCategory, search]);

  // Calculate totals
  const discountAmount =  (discount / 100);
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0) - discountAmount;
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.qty * (item.cost || 0), 0);

  const handleAddToCart = (product) => {
    const inventoryItem = inventory.find(i => i.id === product.id);
    const cartItem = cart.find(i => i.id === product.id);
    const currentCartQty = cartItem?.qty || 0;
    
    if (currentCartQty >= inventoryItem.qty) {
      Alert.alert('Out of Stock', `Only ${inventoryItem.qty} available in stock`);
      return;
    }
    
    addToCart(product);
  };

  const handleQuantityChange = (item, delta) => {
    const newQty = item.qty + delta;
    const inventoryItem = inventory.find(i => i.id === item.id);
    
    if (newQty > inventoryItem.qty) {
      Alert.alert('Out of Stock', `Only ${inventoryItem.qty} available`);
      return;
    }
    
    updateQuantity(item.id, newQty);
  };

  const handleApplyDiscount = () => {
    const disc = parseFloat(discountInput);
    if (isNaN(disc) || disc < 0 || disc > 100) {
      Alert.alert('Error', 'Please enter a valid discount (0-100%)');
      return;
    }
    setDiscount(disc);
    setDiscountInput('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart first');
      return;
    }
    setAmountReceived('');
    setCheckoutModalVisible(true);
  };

  const processPayment = () => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < total) {
        Alert.alert('Error', 'Amount received must be at least the total amount');
        return;
      }
    }
    
    // Reduce stock for each item
    cart.forEach(item => {
      adjustStock(item.id, item.qty, 'out');
    });
    
    // Record transaction
    addTransaction({
      items: cart.map(item => ({ ...item })),
      discount: discountAmount,
      total,
      cost: totalCost,
      profit: total - totalCost,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
      change: paymentMethod === 'cash' ? parseFloat(amountReceived) - total : 0,
    });
    
    const change = paymentMethod === 'cash' ? parseFloat(amountReceived) - total : 0;
    
    clearCart();
    setCheckoutModalVisible(false);
    
    Alert.alert(
      'Payment Successful', 
      `Total: $${total.toFixed(2)}${paymentMethod === 'cash' && change > 0 ? `\nChange: $${change.toFixed(2)}` : ''}`,
      [{ text: 'Done' }]
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>POS</Text>
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.headerBtn}
              onPress={() => {
                Alert.prompt(
                  'Discount',
                  'Enter discount percentage',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Apply', onPress: (val) => {
                      const disc = parseFloat(val);
                      if (!isNaN(disc) && disc >= 0 && disc <= 100) setDiscount(disc);
                    }}
                  ],
                  'plain-text',
                  discount.toString()
                );
              }}
            >
              <Icon name="percent" size={20} color={discount > 0 ? colors.primary : colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <SearchBar placeholder="Search products..." value={search} onChangeText={setSearch} style={styles.searchBar} />

        {/* Categories */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Products Grid */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.productScroll}>
          {products.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="package" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {inventory.length === 0 ? 'No products yet' : 'No products in stock'}
              </Text>
              <Text style={styles.emptyText}>
                {inventory.length === 0 ? 'Add items in Inventory first' : 'All items are out of stock'}
              </Text>
            </Card>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product) => {
                const cartItem = cart.find(i => i.id === product.id);
                return (
                  <Pressable 
                    key={product.id} 
                    style={styles.productCard}
                    onPress={() => handleAddToCart(product)}
                  >
                    <View style={styles.productImage}>
                      <Icon name="package" size={28} color={colors.textMuted} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      <Text style={styles.productStock}>{product.qty} in stock</Text>
                      <Text style={styles.productPrice}>${product.price?.toFixed(2) || '0.00'}</Text>
                    </View>
                    {cartItem && (
                      <View style={styles.cartIndicator}>
                        <Text style={styles.cartIndicatorText}>{cartItem.qty}</Text>
                      </View>
                    )}
                    <View style={styles.addToCartBtn}>
                      <Icon name="plus" size={16} color={colors.surface} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
          <View style={{ height: 200 }} />
        </ScrollView>

        {/* Cart Summary */}
        <Card style={styles.cartCard}>
          <Pressable style={styles.cartHeader} onPress={() => setCartExpanded(!cartExpanded)}>
            <View style={styles.cartHeaderLeft}>
              <View style={styles.cartIconWrap}>
                <Icon name="shopping-cart" size={18} color={colors.primary} />
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.cartTitle}>Cart</Text>
                <Text style={styles.cartSubtitle}>
                  {cart.length === 0 ? 'Empty' : `${cart.length} items · $${total.toFixed(2)}`}
                </Text>
              </View>
            </View>
            <Icon name={cartExpanded ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textMuted} />
          </Pressable>

          {cartExpanded && cart.length > 0 && (
            <View style={styles.cartItems}>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>${item.price?.toFixed(2)} each</Text>
                  </View>
                  <View style={styles.cartItemQty}>
                    <Pressable style={styles.qtyBtn} onPress={() => handleQuantityChange(item, -1)}>
                      <Icon name="minus" size={14} color={colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => handleQuantityChange(item, 1)}>
                      <Icon name="plus" size={14} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                  <Text style={styles.cartItemTotal}>${(item.qty * item.price).toFixed(2)}</Text>
                  <Pressable onPress={() => removeFromCart(item.id)}>
                    <Icon name="trash-2" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {cart.length > 0 && (
            <View style={styles.cartTotals}>
              {discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount ({discount}%)</Text>
                  <Text style={[styles.totalValue, { color: colors.success }]}>-${discountAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={styles.cartActions}>
            {cart.length > 0 && (
              <Pressable style={styles.clearBtn} onPress={() => {
                Alert.alert('Clear Cart', 'Remove all items?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearCart }
                ]);
              }}>
                <Icon name="trash-2" size={18} color={colors.danger} />
              </Pressable>
            )}
            <Pressable style={{ flex: 1 }} onPress={handleCheckout} disabled={cart.length === 0}>
              <LinearGradient
                colors={cart.length > 0 ? colors.primaryGradient : [colors.textMuted, colors.textMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutBtn}
              >
                <Icon name="credit-card" size={20} color={colors.surface} />
                <Text style={styles.checkoutText}>Checkout</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Card>
      </View>

      {/* Checkout Modal */}
      <Modal visible={checkoutModalVisible} transparent animationType="slide" onRequestClose={() => setCheckoutModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setCheckoutModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Checkout</Text>
              <Pressable onPress={() => setCheckoutModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.checkoutTotal}>
                <Text style={styles.checkoutTotalLabel}>Total Amount</Text>
                <Text style={styles.checkoutTotalValue}>${total.toFixed(2)}</Text>
              </View>

              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                {['cash', 'card'].map((method) => (
                  <Pressable
                    key={method}
                    style={[styles.paymentMethod, paymentMethod === method && styles.paymentMethodActive]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Icon 
                      name={method === 'cash' ? 'dollar-sign' : 'credit-card'} 
                      size={20} 
                      color={paymentMethod === method ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[styles.paymentMethodText, paymentMethod === method && styles.paymentMethodTextActive]}>
                      {method === 'cash' ? 'Cash' : 'Card'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {paymentMethod === 'cash' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount Received</Text>
                  <TextInput
                    style={styles.input}
                    value={amountReceived}
                    onChangeText={setAmountReceived}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                  {amountReceived && parseFloat(amountReceived) >= total && (
                    <Text style={styles.changeText}>
                      Change: ${(parseFloat(amountReceived) - total).toFixed(2)}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setCheckoutModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Complete" onPress={processPayment} style={{ flex: 1 }} />
              </View>
            </ScrollView>
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
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  searchBar: { marginBottom: spacing.lg },
  categoryScroll: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  categoryChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, ...shadow.sm },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryText: { ...typography.captionMedium, color: colors.textSecondary },
  categoryTextActive: { color: colors.surface },
  productScroll: { flex: 1, marginHorizontal: -spacing.lg },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  productCard: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  productImage: { height: 60, backgroundColor: colors.surfaceHover, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  productInfo: { marginBottom: spacing.sm },
  productName: { ...typography.captionMedium, color: colors.textPrimary, marginBottom: 2 },
  productStock: { ...typography.small, color: colors.textMuted, marginBottom: 4 },
  productPrice: { ...typography.bodyMedium, color: colors.primary },
  cartIndicator: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.success, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cartIndicatorText: { ...typography.small, color: colors.surface, fontWeight: '700' },
  addToCartBtn: { position: 'absolute', bottom: spacing.md, right: spacing.md, width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { alignItems: 'center', padding: spacing.xxl, marginHorizontal: spacing.lg },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  cartCard: { padding: spacing.lg, marginTop: spacing.md },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cartIconWrap: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { ...typography.small, color: colors.surface, fontWeight: '700' },
  cartTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cartSubtitle: { ...typography.caption, color: colors.textMuted },
  cartItems: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  cartItemInfo: { flex: 1 },
  cartItemName: { ...typography.body, color: colors.textPrimary },
  cartItemPrice: { ...typography.caption, color: colors.textMuted },
  cartItemQty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: radius.xs, backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center' },
  qtyText: { ...typography.bodyMedium, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  cartItemTotal: { ...typography.bodyMedium, color: colors.textPrimary, minWidth: 60, textAlign: 'right' },
  cartTotals: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: spacing.md, paddingTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  totalLabel: { ...typography.caption, color: colors.textMuted },
  totalValue: { ...typography.caption, color: colors.textSecondary },
  grandTotal: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  grandTotalLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  grandTotalValue: { ...typography.h3, color: colors.primary },
  cartActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  clearBtn: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.sm, ...shadow.md },
  checkoutText: { ...typography.bodyMedium, color: colors.surface },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  checkoutTotal: { alignItems: 'center', marginBottom: spacing.xl },
  checkoutTotalLabel: { ...typography.caption, color: colors.textSecondary },
  checkoutTotalValue: { ...typography.h1, color: colors.primary },
  inputLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  inputGroup: { marginBottom: spacing.lg },
  input: { backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.lg, ...typography.h2, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  paymentMethods: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  paymentMethod: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceHover, borderWidth: 2, borderColor: 'transparent' },
  paymentMethodActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  paymentMethodText: { ...typography.bodyMedium, color: colors.textSecondary },
  paymentMethodTextActive: { color: colors.primary },
  changeText: { ...typography.bodyMedium, color: colors.success, textAlign: 'center', marginTop: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
});

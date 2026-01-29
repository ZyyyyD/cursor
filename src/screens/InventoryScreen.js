import React, { useState, useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import SearchBar from '../components/SearchBar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useInventoryStore, useCategoriesStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

const statusLabel = {
  success: 'In Stock',
  warning: 'Low Stock',
  danger: 'Out of Stock',
};

const defaultCategories = ['Electronics', 'Clothing', 'Food', 'Beverages', 'Medicine', 'Supplies', 'Equipment', 'Other'];

export default function InventoryScreen() {
  const items = useInventoryStore((state) => state.items);
  const addItem = useInventoryStore((state) => state.addItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const deleteItem = useInventoryStore((state) => state.deleteItem);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const categories = useCategoriesStore((state) => state.categories);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [displayMode, setDisplayMode] = useState('card'); // 'card' or 'list'
  
  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');
  
  // New item form
  const [newItem, setNewItem] = useState({
    name: '',
    barcode: '',
    category: '',
    price: '',
    cost: '',
    qty: '',
    min: '',
    location: '',
    description: '',
  });

  // Get all unique categories from items and saved categories
  const allCategories = useMemo(() => {
    const fromItems = [...new Set(items.map(item => item.category).filter(Boolean))];
    const fromSaved = categories.map(c => c.name);
    return [...new Set([...defaultCategories, ...fromItems, ...fromSaved])];
  }, [items, categories]);

  // Filter list
  const filters = ['All', 'Low Stock', 'Out of Stock', 'In Stock'];

  // Filter and search items
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (activeFilter === 'Low Stock') {
      result = result.filter(item => item.status === 'warning');
    } else if (activeFilter === 'Out of Stock') {
      result = result.filter(item => item.status === 'danger');
    } else if (activeFilter === 'In Stock') {
      result = result.filter(item => item.status === 'success');
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ||
        item.barcode?.includes(search) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [items, activeFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter(i => i.status === 'warning').length,
    outOfStock: items.filter(i => i.status === 'danger').length,
  }), [items]);

  const resetNewItemForm = () => {
    setNewItem({
      name: '',
      barcode: '',
      category: '',
      price: '',
      cost: '',
      qty: '',
      min: '',
      location: '',
      description: '',
    });
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }
    
    addItem({
      name: newItem.name.trim(),
      barcode: newItem.barcode.trim(),
      category: newItem.category || 'Other',
      price: parseFloat(newItem.price) || 0,
      cost: parseFloat(newItem.cost) || 0,
      qty: parseInt(newItem.qty, 10) || 0,
      min: parseInt(newItem.min, 10) || 0,
      location: newItem.location.trim(),
      description: newItem.description.trim(),
    });
    
    setAddModalVisible(false);
    resetNewItemForm();
    Alert.alert('Success', 'Item added successfully!');
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const openAdjustModal = (item, type) => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustQty('');
    setDetailModalVisible(false);
    setAdjustModalVisible(true);
  };

  const handleAdjustStock = () => {
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (adjustType === 'out' && qty > selectedItem.qty) {
      Alert.alert('Error', 'Cannot remove more than available stock');
      return;
    }
    
    adjustStock(selectedItem.id, qty, adjustType);
    setAdjustModalVisible(false);
    Alert.alert('Success', `Stock ${adjustType === 'in' ? 'added' : 'removed'} successfully!`);
  };

  const handleDeleteItem = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${selectedItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteItem(selectedItem.id);
            setDetailModalVisible(false);
            Alert.alert('Deleted', 'Item has been removed');
          }
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Pressable style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Icon name="plus" size={20} color={colors.surface} />
          </Pressable>
        </View>

        {/* Search */}
        <SearchBar
          placeholder="Search items, barcode..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
        />

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {filters.map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out</Text>
          </View>
        </View>

        {/* Results count and display toggle */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredItems.length === 0 
              ? 'No items found' 
              : `Showing ${filteredItems.length} of ${items.length} items`}
          </Text>
          <View style={styles.displayToggle}>
            <Pressable 
              style={[styles.displayBtn, displayMode === 'card' && styles.displayBtnActive]}
              onPress={() => setDisplayMode('card')}
            >
              <Icon name="square" size={16} color={displayMode === 'card' ? colors.surface : colors.textSecondary} />
            </Pressable>
            <Pressable 
              style={[styles.displayBtn, displayMode === 'grid' && styles.displayBtnActive]}
              onPress={() => setDisplayMode('grid')}
            >
              <Icon name="grid" size={16} color={displayMode === 'grid' ? colors.surface : colors.textSecondary} />
            </Pressable>
            <Pressable 
              style={[styles.displayBtn, displayMode === 'list' && styles.displayBtnActive]}
              onPress={() => setDisplayMode('list')}
            >
              <Icon name="list" size={16} color={displayMode === 'list' ? colors.surface : colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Card View */}
        {displayMode === 'card' && filteredItems.map((item) => (
          <Card key={item.id} style={styles.itemCard} onPress={() => handleItemPress(item)}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  {item.category && (
                    <>
                      <View style={styles.metaDot} />
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </>
                  )}
                </View>
              </View>
              <Badge label={statusLabel[item.status]} status={item.status} size="sm" />
            </View>
            <View style={styles.itemFooter}>
              <View style={styles.qtyWrap}>
                <Icon name="box" size={16} color={colors.textMuted} />
                <Text style={styles.qtyText}>
                  <Text style={styles.qtyValue}>{item.qty}</Text> / {item.min} min
                </Text>
              </View>
              <Text style={styles.priceText}>₱{item.price?.toFixed(2) || '0.00'}</Text>
              <View style={styles.itemActions}>
                <Pressable style={styles.itemAction} onPress={() => openAdjustModal(item, 'out')}>
                  <Icon name="minus" size={16} color={colors.danger} />
                </Pressable>
                <Pressable style={[styles.itemAction, styles.itemActionPrimary]} onPress={() => openAdjustModal(item, 'in')}>
                  <Icon name="plus" size={16} color={colors.surface} />
                </Pressable>
              </View>
            </View>
          </Card>
        ))}

        {/* List View */}
        {displayMode === 'list' && filteredItems.length > 0 && (
          <View style={styles.listContainer}>
            {/* List Header */}
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, styles.listColName]}>Item</Text>
              <Text style={[styles.listHeaderText, styles.listColQty]}>Qty</Text>
              <Text style={[styles.listHeaderText, styles.listColPrice]}>Price</Text>
              <Text style={[styles.listHeaderText, styles.listColStatus]}>Status</Text>
            </View>
            {/* List Items */}
            {filteredItems.map((item, index) => (
              <Pressable 
                key={item.id} 
                style={[styles.listRow, index % 2 === 0 && styles.listRowEven]}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.listColName}>
                  <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={[styles.listCellText, styles.listColQty]}>{item.qty}</Text>
                <Text style={[styles.listCellText, styles.listColPrice]}>₱{item.price?.toFixed(2) || '0.00'}</Text>
                <View style={styles.listColStatus}>
                  <View style={[styles.statusDot, { backgroundColor: colors[item.status] }]} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Grid View (3 items per row) */}
        {displayMode === 'grid' && filteredItems.length > 0 && (
          <View style={styles.gridContainer}>
            {filteredItems.map((item) => (
              <Pressable 
                key={item.id} 
                style={styles.gridItem}
                onPress={() => handleItemPress(item)}
              >
                <View style={[styles.gridStatusBar, { backgroundColor: colors[item.status] }]} />
                <View style={styles.gridContent}>
                  <Text style={styles.gridItemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.gridItemQty}>{item.qty} pcs</Text>
                  <Text style={styles.gridItemPrice}>₱{item.price?.toFixed(2) || '0.00'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <Card style={styles.emptyCard}>
            <Icon name="inbox" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyText}>Add your first inventory item</Text>
            <Button title="Add Item" icon="plus" onPress={() => setAddModalVisible(true)} />
          </Card>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => { setAddModalVisible(false); resetNewItemForm(); }} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <Pressable onPress={() => { setAddModalVisible(false); resetNewItemForm(); }}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Barcode</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.barcode}
                    onChangeText={(text) => setNewItem({ ...newItem, barcode: text })}
                    placeholder="Optional"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {allCategories.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[styles.categoryChip, newItem.category === cat && styles.categoryChipActive]}
                        onPress={() => setNewItem({ ...newItem, category: cat })}
                      >
                        <Text style={[styles.categoryText, newItem.category === cat && styles.categoryTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sell Price</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.price}
                    onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Cost Price</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.cost}
                    onChangeText={(text) => setNewItem({ ...newItem, cost: text })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Initial Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.qty}
                    onChangeText={(text) => setNewItem({ ...newItem, qty: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Minimum Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={newItem.min}
                    onChangeText={(text) => setNewItem({ ...newItem, min: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={newItem.location}
                  onChangeText={(text) => setNewItem({ ...newItem, location: text })}
                  placeholder="e.g., Shelf A-1"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => { setAddModalVisible(false); resetNewItemForm(); }} style={{ flex: 1 }} />
              <Button title="Add Item" onPress={handleAddItem} style={{ flex: 1 }} />
            </View>
          </View>
          
        </KeyboardAvoidingView>
      </Modal>

      {/* Item Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <Pressable onPress={() => setDetailModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedItem && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>{selectedItem.name}</Text>
                  <Badge label={statusLabel[selectedItem.status]} status={selectedItem.status} />
                </View>
                {selectedItem.barcode && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Barcode</Text>
                    <Text style={styles.detailValue}>{selectedItem.barcode}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedItem.category || 'None'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>₱{selectedItem.price?.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cost</Text>
                  <Text style={styles.detailValue}>₱{selectedItem.cost?.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={[styles.detailValue, selectedItem.qty <= selectedItem.min && { color: colors.warning }]}>
                    {selectedItem.qty} units
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Min Stock</Text>
                  <Text style={styles.detailValue}>{selectedItem.min} units</Text>
                </View>
                {selectedItem.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedItem.location}</Text>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <Button title="Stock In" variant="outline" icon="plus" onPress={() => openAdjustModal(selectedItem, 'in')} style={{ flex: 1 }} />
                  <Button title="Stock Out" variant="outline" icon="minus" onPress={() => openAdjustModal(selectedItem, 'out')} style={{ flex: 1 }} />
                </View>

                <Pressable style={styles.deleteBtn} onPress={handleDeleteItem}>
                  <Icon name="trash-2" size={18} color={colors.danger} />
                  <Text style={styles.deleteBtnText}>Delete Item</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Stock Adjustment Modal */}
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
            
            {selectedItem && (
              <>
                <Text style={styles.adjustItemName}>{selectedItem.name}</Text>
                <Text style={styles.adjustItemMeta}>Current stock: {selectedItem.qty} units</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={adjustQty}
                    onChangeText={setAdjustQty}
                    keyboardType="numeric"
                    placeholder="Enter quantity"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <Button title="Cancel" variant="outline" onPress={() => setAdjustModalVisible(false)} style={{ flex: 1 }} />
                  <Button 
                    title={adjustType === 'in' ? 'Add Stock' : 'Remove Stock'}
                    variant={adjustType === 'in' ? 'primary' : 'danger'}
                    onPress={handleAdjustStock}
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
  content: { paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  addButton: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  searchBar: { marginBottom: spacing.lg },
  filterScroll: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  filterChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.surface },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultsText: { ...typography.caption, color: colors.textMuted },
  displayToggle: { flexDirection: 'row', backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: 2 },
  displayBtn: { width: 32, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs },
  displayBtnActive: { backgroundColor: colors.primary },
  itemCard: { marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  itemInfo: { flex: 1, marginRight: spacing.md },
  itemName: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted, marginHorizontal: spacing.sm },
  itemCategory: { ...typography.caption, color: colors.textSecondary },
  itemFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  qtyText: { ...typography.caption, color: colors.textMuted },
  qtyValue: { ...typography.bodyMedium, color: colors.textPrimary },
  priceText: { ...typography.bodyMedium, color: colors.primary, marginRight: spacing.md },
  itemActions: { flexDirection: 'row', gap: spacing.sm },
  itemAction: { width: 32, height: 32, borderRadius: radius.xs, backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center' },
  itemActionPrimary: { backgroundColor: colors.primary },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  // List View styles
  listContainer: { backgroundColor: colors.surface, borderRadius: radius.md, ...shadow.sm, overflow: 'hidden', marginBottom: spacing.md },
  listHeader: { flexDirection: 'row', backgroundColor: colors.surfaceHover, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listHeaderText: { ...typography.captionMedium, color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10 },
  listRow: { flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, alignItems: 'center' },
  listRowEven: { backgroundColor: colors.surfaceHover + '50' },
  listColName: { flex: 2.5, paddingRight: spacing.sm },
  listColQty: { flex: 1, textAlign: 'center' },
  listColPrice: { flex: 1.2, textAlign: 'right' },
  listColStatus: { flex: 0.8, alignItems: 'center' },
  listItemName: { ...typography.bodyMedium, color: colors.textPrimary, fontSize: 13 },
  listCellText: { ...typography.caption, color: colors.textPrimary },
  statusDot: { width: 10, height: 10, borderRadius: radius.full },
  // Grid View styles (3 items per row)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs, marginBottom: spacing.md },
  gridItem: { width: '33.33%', paddingHorizontal: spacing.xs, marginBottom: spacing.sm },
  gridContent: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...shadow.sm, overflow: 'hidden', minHeight: 100 },
  gridStatusBar: { height: 3, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, marginHorizontal: spacing.xs, marginTop: spacing.xs },
  gridItemName: { ...typography.captionMedium, color: colors.textPrimary, fontSize: 11, marginBottom: spacing.xs, minHeight: 28 },
  gridItemQty: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  gridItemPrice: { ...typography.bodyMedium, color: colors.primary, fontSize: 12, marginTop: spacing.xs },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  formScroll: { maxHeight: 400 },
  inputGroup: { marginBottom: spacing.lg },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  inputLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.lg, ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  categoryRow: { flexDirection: 'row', gap: spacing.sm },
  categoryChip: { backgroundColor: colors.surfaceHover, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { ...typography.caption, color: colors.textSecondary },
  categoryTextActive: { color: colors.surface },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  // Detail modal
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  detailName: { ...typography.h3, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary },
  detailActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, marginTop: spacing.lg },
  deleteBtnText: { ...typography.body, color: colors.danger },
  adjustItemName: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  adjustItemMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xl },
});

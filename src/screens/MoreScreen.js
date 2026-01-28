import React, { useState, useMemo } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useInventoryStore, useSalesStore, useAlertsStore } from '../store';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function MoreScreen() {
  const navigation = useNavigation();
  const inventory = useInventoryStore((state) => state.items);
  const clearInventory = useInventoryStore((state) => state.clearInventory);
  const transactions = useSalesStore((state) => state.transactions);
  const clearTransactions = useSalesStore((state) => state.clearTransactions);
  const alerts = useAlertsStore((state) => state.alerts);

  // Modal states
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [suppliersModalVisible, setSuppliersModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [locationsModalVisible, setLocationsModalVisible] = useState(false);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState('John Doe');
  const [profileRole, setProfileRole] = useState('Administrator');
  const [profileEmail, setProfileEmail] = useState('john.doe@company.com');

  // Settings state
  const [taxRate, setTaxRate] = useState('12');
  const [currency, setCurrency] = useState('PHP');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Suppliers state
  const [suppliers, setSuppliers] = useState([
    { id: '1', name: 'MedSupply Co.', contact: '09123456789', email: 'contact@medsupply.com' },
    { id: '2', name: 'Clinic Source', contact: '09234567890', email: 'info@clinicsource.com' },
    { id: '3', name: 'Health Plus', contact: '09345678901', email: 'sales@healthplus.com' },
    { id: '4', name: 'PharmaDist', contact: '09456789012', email: 'orders@pharmadist.com' },
  ]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');

  // Locations state
  const [locations, setLocations] = useState([
    { id: '1', name: 'Warehouse', bins: 2 },
    { id: '2', name: 'Store Front', bins: 1 },
  ]);
  const [newLocationName, setNewLocationName] = useState('');

  // Units state
  const [units] = useState([
    { id: '1', name: 'Kilograms', abbr: 'kg' },
    { id: '2', name: 'Liters', abbr: 'L' }
  ]);

  // Custom categories state
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Users state
  const [users] = useState([
    { id: '1', name: 'John Doe', role: 'Admin', status: 'Active', lastLogin: 'Today, 9:00 AM' },
    { id: '2', name: 'Jane Smith', role: 'Manager', status: 'Active', lastLogin: 'Today, 8:30 AM' },
    { id: '3', name: 'Bob Wilson', role: 'Staff', status: 'Active', lastLogin: 'Yesterday' },
  ]);

  // Audit log
  const auditLogs = useMemo(() => {
    const logs = [];
    transactions.slice(0, 5).forEach(t => {
      logs.push({
        id: t.id,
        action: 'Sale completed',
        details: `₱${t.total.toFixed(2)} - ${t.items?.length || 0} items`,
        time: new Date(t.date).toLocaleString(),
        user: 'John Doe',
        type: 'success'
      });
    });
    return logs.length > 0 ? logs : [
      { id: '1', action: 'System started', details: 'Application initialized', time: 'Today, 8:00 AM', user: 'System', type: 'info' },
    ];
  }, [transactions]);

  // Categories from inventory + custom categories
  const categories = useMemo(() => {
    const cats = inventory.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { id: cat, count: 0, value: 0, isCustom: false };
      acc[cat].count += 1;
      acc[cat].value += item.qty * item.price;
      return acc;
    }, {});
    
    // Add custom categories that aren't in inventory
    customCategories.forEach(customCat => {
      if (!cats[customCat.name]) {
        cats[customCat.name] = { id: customCat.id, count: 0, value: 0, isCustom: true };
      }
    });
    
    return Object.entries(cats).map(([name, data]) => ({ name, ...data }));
  }, [inventory, customCategories]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }
    
    // Check if category already exists
    const exists = categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase());
    if (exists) {
      Alert.alert('Error', 'This category already exists');
      return;
    }
    
    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
    };
    setCustomCategories([...customCategories, newCategory]);
    setNewCategoryName('');
    Alert.alert('Success', 'Category added successfully!');
  };

  const handleDeleteCategory = (categoryName) => {
    // Check if category has products
    const hasProducts = inventory.some(item => item.category === categoryName);
    
    if (hasProducts) {
      Alert.alert('Cannot Delete', 'This category has products assigned to it. Remove or reassign the products first.');
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setCustomCategories(customCategories.filter(cat => cat.name !== categoryName));
            Alert.alert('Success', 'Category deleted successfully!');
          }
        }
      ]
    );
  };

  // Export summary
  const exportSummary = useMemo(() => ({
    totalProducts: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + item.qty, 0),
    totalValue: inventory.reduce((sum, item) => sum + (item.qty * item.price), 0),
    totalTransactions: transactions.length,
    totalSales: transactions.reduce((sum, t) => sum + t.total, 0),
  }), [inventory, transactions]);

  const handleExport = (type) => {
    Alert.alert(
      'Export Successful',
      `${type} has been exported successfully!\n\nFile: ${type.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
      [{ text: 'OK', onPress: () => setExportModalVisible(false) }]
    );
  };

  const handleBackup = () => {
    Alert.alert(
      'Backup Created',
      `Backup created successfully!\n\nInventory: ${inventory.length} items\nTransactions: ${transactions.length} records\n\nFile: backup_${new Date().toISOString().split('T')[0]}.json`,
      [{ text: 'OK' }]
    );
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Data',
      'This will replace all current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => Alert.alert('Success', 'Data restored successfully!') }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all inventory and sales data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: () => {
            if (clearInventory) clearInventory();
            if (clearTransactions) clearTransactions();
            Alert.alert('Success', 'All data has been cleared.');
          }
        }
      ]
    );
  };

  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }
    const newSupplier = {
      id: Date.now().toString(),
      name: newSupplierName.trim(),
      contact: newSupplierContact.trim() || 'N/A',
      email: 'N/A'
    };
    setSuppliers([...suppliers, newSupplier]);
    setNewSupplierName('');
    setNewSupplierContact('');
    Alert.alert('Success', 'Supplier added successfully!');
  };

  const handleDeleteSupplier = (id) => {
    Alert.alert(
      'Delete Supplier',
      'Are you sure you want to remove this supplier?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setSuppliers(suppliers.filter(s => s.id !== id)) }
      ]
    );
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      Alert.alert('Error', 'Please enter location name');
      return;
    }
    const newLocation = {
      id: Date.now().toString(),
      name: newLocationName.trim(),
      bins: 0
    };
    setLocations([...locations, newLocation]);
    setNewLocationName('');
    Alert.alert('Success', 'Location added successfully!');
  };

  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setProfileModalVisible(false);
  };

  const handleSaveSettings = () => {
    Alert.alert('Success', 'Settings saved successfully!');
    setSettingsModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed Out', 'You have been signed out') },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Data Management',
      items: [
        { 
          label: 'Export Data', 
          icon: 'download', 
          color: colors.accent,
          action: () => setExportModalVisible(true)
        },
        { 
          label: 'Backup & Restore', 
          icon: 'database', 
          color: colors.info,
          action: () => {
            Alert.alert(
              'Backup & Restore',
              'Choose an option:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Create Backup', onPress: handleBackup },
                { text: 'Restore', onPress: handleRestore },
              ]
            );
          }
        }
      ],
    },
    {
      title: 'Configuration',
      items: [
        { 
          label: 'Categories ', 
          icon: 'tag', 
          color: colors.warning,
          action: () => setCategoriesModalVisible(true)
        },
        { 
          label: 'Units of Measure', 
          icon: 'hash', 
          color: colors.primary,
          action: () => setUnitsModalVisible(true)
        },
        { 
          label: 'Suppliers', 
          icon: 'truck', 
          color: colors.accent,
          action: () => setSuppliersModalVisible(true)
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        { 
          label: 'Users & Roles', 
          icon: 'users', 
          color: colors.info,
          action: () => setUsersModalVisible(true)
        },
        { 
          label: 'Audit Log', 
          icon: 'shield', 
          color: colors.danger,
          action: () => setAuditModalVisible(true)
        },
        { 
          label: 'Settings', 
          icon: 'settings', 
          color: colors.textSecondary,
          action: () => setSettingsModalVisible(true)
        },
      ],
    },
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>More</Text>

        {/* User Card */}
        <Card style={styles.userCard}>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userGradient}
          >
            <Pressable style={styles.userContent} onPress={() => setProfileModalVisible(true)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profileName)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profileName}</Text>
                <Text style={styles.userRole}>{profileRole}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </LinearGradient>
        </Card>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{inventory.length}</Text>
            <Text style={styles.quickStatLabel}>Products</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{transactions.length}</Text>
            <Text style={styles.quickStatLabel}>Sales</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{alerts.filter(a => !a.read).length}</Text>
            <Text style={styles.quickStatLabel}>Alerts</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[styles.menuRow, index < section.items.length - 1 && styles.menuRowBorder]}
                  onPress={item.action}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <Icon name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Inventory Pro</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide" onRequestClose={() => setProfileModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setProfileModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setProfileModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.profileAvatarContainer}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{getInitials(profileName)}</Text>
                </View>
                <Pressable style={styles.changePhotoBtn}>
                  <Icon name="camera" size={16} color={colors.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={styles.inputDisabledText}>{profileRole}</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setProfileModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Save Changes" onPress={handleSaveProfile} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Export Modal */}
      <Modal visible={exportModalVisible} transparent animationType="slide" onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Data</Text>
              <Pressable onPress={() => setExportModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Export Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Products</Text>
                <Text style={styles.summaryValue}>{exportSummary.totalProducts}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Stock</Text>
                <Text style={styles.summaryValue}>{exportSummary.totalStock} units</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Inventory Value</Text>
                <Text style={styles.summaryValue}>₱{exportSummary.totalValue.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{exportSummary.totalTransactions}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Sales</Text>
                <Text style={styles.summaryValue}>₱{exportSummary.totalSales.toLocaleString()}</Text>
              </View>
            </Card>

            <Text style={styles.exportSectionTitle}>Choose Export Type</Text>
            
            <Pressable style={styles.exportOption} onPress={() => handleExport('Inventory Data')}>
              <View style={[styles.exportIcon, { backgroundColor: colors.primaryLight }]}>
                <Icon name="package" size={20} color={colors.primary} />
              </View>
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Inventory Data</Text>
                <Text style={styles.exportOptionDesc}>Export all products with stock levels</Text>
              </View>
              <Icon name="download" size={18} color={colors.primary} />
            </Pressable>

            <Pressable style={styles.exportOption} onPress={() => handleExport('Sales Report')}>
              <View style={[styles.exportIcon, { backgroundColor: colors.greenLight }]}>
                <Icon name="trending-up" size={20} color={colors.green} />
              </View>
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Sales Report</Text>
                <Text style={styles.exportOptionDesc}>Export all transactions and sales data</Text>
              </View>
              <Icon name="download" size={18} color={colors.primary} />
            </Pressable>

            <Pressable style={styles.exportOption} onPress={() => handleExport('Full Report')}>
              <View style={[styles.exportIcon, { backgroundColor: colors.purpleLight }]}>
                <Icon name="file-text" size={20} color={colors.purple} />
              </View>
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Full Report</Text>
                <Text style={styles.exportOptionDesc}>Export everything (inventory + sales)</Text>
              </View>
              <Icon name="download" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Categories Modal */}
      <Modal visible={categoriesModalVisible} transparent animationType="slide" onRequestClose={() => setCategoriesModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setCategoriesModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Categories</Text>
              <Pressable onPress={() => setCategoriesModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="New category name"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addItemBtn} onPress={handleAddCategory}>
                <Icon name="plus" size={20} color={colors.surface} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
              {categories.length === 0 ? (
                <View style={styles.emptyList}>
                  <Icon name="tag" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyListText}>No categories yet</Text>
                  <Text style={styles.emptyListSubtext}>Add a category above to get started</Text>
                </View>
              ) : (
                categories.map((cat, index) => (
                  <View key={cat.name} style={[styles.listItem, index < categories.length - 1 && styles.listItemBorder]}>
                    <View style={[styles.categoryIcon, { backgroundColor: colors.warningLight }]}>
                      <Icon name="tag" size={16} color={colors.warning} />
                    </View>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{cat.name}</Text>
                      <Text style={styles.listItemSubtitle}>
                        {cat.count} products • ₱{cat.value.toLocaleString()}
                        {cat.isCustom && ' • Custom'}
                      </Text>
                    </View>
                    {cat.count === 0 && (
                      <Pressable onPress={() => handleDeleteCategory(cat.name)} hitSlop={8}>
                        <Icon name="trash-2" size={18} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setCategoriesModalVisible(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Suppliers Modal */}
      <Modal visible={suppliersModalVisible} transparent animationType="slide" onRequestClose={() => setSuppliersModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setSuppliersModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suppliers</Text>
              <Pressable onPress={() => setSuppliersModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newSupplierName}
                onChangeText={setNewSupplierName}
                placeholder="Supplier name"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addItemBtn} onPress={handleAddSupplier}>
                <Icon name="plus" size={20} color={colors.surface} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
              {suppliers.map((supplier, index) => (
                <View key={supplier.id} style={[styles.listItem, index < suppliers.length - 1 && styles.listItemBorder]}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.accentLight }]}>
                    <Icon name="truck" size={16} color={colors.accent} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{supplier.name}</Text>
                    <Text style={styles.listItemSubtitle}>{supplier.contact}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteSupplier(supplier.id)} hitSlop={8}>
                    <Icon name="trash-2" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setSuppliersModalVisible(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Locations Modal */}
      <Modal visible={locationsModalVisible} transparent animationType="slide" onRequestClose={() => setLocationsModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setLocationsModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Locations & Bins</Text>
              <Pressable onPress={() => setLocationsModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newLocationName}
                onChangeText={setNewLocationName}
                placeholder="Location name"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addItemBtn} onPress={handleAddLocation}>
                <Icon name="plus" size={20} color={colors.surface} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
              {locations.map((location, index) => (
                <View key={location.id} style={[styles.listItem, index < locations.length - 1 && styles.listItemBorder]}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.successLight }]}>
                    <Icon name="map-pin" size={16} color={colors.success} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{location.name}</Text>
                    <Text style={styles.listItemSubtitle}>{location.bins} bins</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setLocationsModalVisible(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Units Modal */}
      <Modal visible={unitsModalVisible} transparent animationType="slide" onRequestClose={() => setUnitsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Units of Measure</Text>
              <Pressable onPress={() => setUnitsModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer}>
              {units.map((unit, index) => (
                <View key={unit.id} style={[styles.listItem, index < units.length - 1 && styles.listItemBorder]}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight }]}>
                    <Icon name="hash" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{unit.name}</Text>
                    <Text style={styles.listItemSubtitle}>Abbreviation: {unit.abbr}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setUnitsModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Users Modal */}
      <Modal visible={usersModalVisible} transparent animationType="slide" onRequestClose={() => setUsersModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Users & Roles</Text>
              <Pressable onPress={() => setUsersModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer}>
              {users.map((user, index) => (
                <View key={user.id} style={[styles.listItem, index < users.length - 1 && styles.listItemBorder]}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{getInitials(user.name)}</Text>
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{user.name}</Text>
                    <Text style={styles.listItemSubtitle}>{user.role} • {user.lastLogin}</Text>
                  </View>
                  <View style={[styles.statusBadge, user.status === 'Active' && styles.statusActive]}>
                    <Text style={[styles.statusText, user.status === 'Active' && styles.statusTextActive]}>{user.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setUsersModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Audit Log Modal */}
      <Modal visible={auditModalVisible} transparent animationType="slide" onRequestClose={() => setAuditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Log</Text>
              <Pressable onPress={() => setAuditModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.listContainer}>
              {auditLogs.map((log, index) => (
                <View key={log.id} style={[styles.auditItem, index < auditLogs.length - 1 && styles.listItemBorder]}>
                  <View style={[styles.auditIcon, log.type === 'success' && { backgroundColor: colors.successLight }]}>
                    <Icon name={log.type === 'success' ? 'check-circle' : 'info'} size={16} color={log.type === 'success' ? colors.success : colors.info} />
                  </View>
                  <View style={styles.auditContent}>
                    <Text style={styles.auditAction}>{log.action}</Text>
                    <Text style={styles.auditDetails}>{log.details}</Text>
                    <Text style={styles.auditMeta}>{log.user} • {log.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Button title="Close" variant="outline" onPress={() => setAuditModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="slide" onRequestClose={() => setSettingsModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setSettingsModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <Pressable onPress={() => setSettingsModalVisible(false)}>
                <Icon name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.settingsSection}>Business Settings</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={taxRate}
                  onChangeText={setTaxRate}
                  placeholder="12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Currency</Text>
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={styles.inputDisabledText}>{currency} (₱)</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Low Stock Threshold</Text>
                <TextInput
                  style={styles.input}
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.settingsSection}>App Settings</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDesc}>Receive alerts for low stock</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={notifications ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDesc}>Use dark theme</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={darkMode ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setSettingsModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Save Settings" onPress={handleSaveSettings} style={{ flex: 1 }} />
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
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.lg },
  userCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.lg },
  userGradient: { padding: spacing.lg },
  userContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52, height: 52, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  avatarText: { ...typography.h3, color: colors.surface },
  userInfo: { flex: 1 },
  userName: { ...typography.bodyMedium, color: colors.surface },
  userRole: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  quickStats: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.lg, marginBottom: spacing.xl, ...shadow.sm,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatDivider: { width: 1, backgroundColor: colors.border },
  quickStatValue: { ...typography.h2, color: colors.textPrimary },
  quickStatLabel: { ...typography.caption, color: colors.textMuted },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  menuCard: { padding: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  appInfo: { alignItems: 'center', marginBottom: spacing.lg },
  appName: { ...typography.bodyMedium, color: colors.textSecondary },
  appVersion: { ...typography.caption, color: colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.lg, backgroundColor: colors.dangerLight, borderRadius: radius.md,
  },
  logoutText: { ...typography.bodyMedium, color: colors.danger },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  
  // Profile Modal
  profileAvatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  profileAvatar: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  profileAvatarText: { ...typography.h1, color: colors.surface },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  changePhotoText: { ...typography.caption, color: colors.primary },
  
  // Input Styles
  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceHover, borderRadius: radius.sm, padding: spacing.md, ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  inputDisabled: { backgroundColor: colors.surfaceHover, justifyContent: 'center' },
  inputDisabledText: { ...typography.body, color: colors.textMuted },
  
  // Export Modal
  summaryCard: { backgroundColor: colors.surfaceHover, marginBottom: spacing.lg },
  summaryTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryValue: { ...typography.captionMedium, color: colors.textPrimary },
  exportSectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.md },
  exportOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surfaceHover, borderRadius: radius.md, marginBottom: spacing.sm },
  exportIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  exportOptionText: { flex: 1 },
  exportOptionTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  exportOptionDesc: { ...typography.caption, color: colors.textMuted },
  
  // List Styles
  listContainer: { maxHeight: 300, marginBottom: spacing.lg },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  listItemContent: { flex: 1, marginLeft: spacing.md },
  listItemTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  listItemSubtitle: { ...typography.caption, color: colors.textMuted },
  categoryIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  emptyList: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyListText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  emptyListSubtext: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  
  // Add Item Row
  addItemRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  addItemBtn: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  // Users Modal
  userAvatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { ...typography.captionMedium, color: colors.surface },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.xs, backgroundColor: colors.surfaceHover },
  statusActive: { backgroundColor: colors.successLight },
  statusText: { ...typography.caption, color: colors.textMuted },
  statusTextActive: { color: colors.success },
  
  // Audit Modal
  auditItem: { flexDirection: 'row', paddingVertical: spacing.md },
  auditIcon: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.infoLight, alignItems: 'center', justifyContent: 'center' },
  auditContent: { flex: 1, marginLeft: spacing.md },
  auditAction: { ...typography.bodyMedium, color: colors.textPrimary },
  auditDetails: { ...typography.caption, color: colors.textSecondary },
  auditMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  
  // Settings Modal
  settingsSection: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  settingInfo: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.textPrimary },
  settingDesc: { ...typography.caption, color: colors.textMuted },
});

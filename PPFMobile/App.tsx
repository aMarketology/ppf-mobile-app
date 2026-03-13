import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TabBar from './src/components/TabBar';
import { colors } from './src/theme';

function AppContent() {
  const [activeTab, setActiveTab] = useState('Home');
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':        return <HomeScreen onNavigate={setActiveTab} />;
      case 'Marketplace': return <MarketplaceScreen onNavigate={setActiveTab} />;
      case 'Orders':      return <OrdersScreen onNavigate={setActiveTab} />;
      case 'Messages':    return <MessagesScreen onNavigate={setActiveTab} />;
      case 'Profile':     return <ProfileScreen onNavigate={setActiveTab} />;
      default:            return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.screen}>{renderScreen()}</View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} unreadMessages={3} />
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
});

export default App;

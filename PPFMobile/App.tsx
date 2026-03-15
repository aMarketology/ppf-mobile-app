import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import TabBar from './src/components/TabBar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

function AppContent() {
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.splashText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

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
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} unreadMessages={0} />
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  splashText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
});

export default App;

import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import HomeScreen from './src/screens/HomeScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import FeedScreen from './src/screens/FeedScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TokenScreen from './src/screens/TokenScreen';
import AuthScreen from './src/screens/AuthScreen';
import TabBar from './src/components/TabBar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { colors } from './src/theme';
import { ENV } from './src/config/env';
import ActivityFeedScreen from './src/screens/ActivityFeedScreen';
import RFQMarketplaceScreen from './src/screens/RFQMarketplaceScreen';
import CreateRFQScreen from './src/screens/CreateRFQScreen';
import SubmitOfferScreen from './src/screens/SubmitOfferScreen';
import PostServiceScreen from './src/screens/PostServiceScreen';
import CompanyProfileScreen from './src/screens/CompanyProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import ReceiptsScreen from './src/screens/ReceiptsScreen';
import ScanReceiptScreen from './src/screens/ScanReceiptScreen';
import CameraScreen from './src/screens/CameraScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import type { ServiceWithProvider } from './src/services/servicesService';

const STRIPE_PK = ENV.STRIPE_PUBLISHABLE_KEY;

function AppContent() {
  const { session, loading } = useAuth();
  const { isDark, colors: themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState('Activity');
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<ServiceWithProvider | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [cameraRequest, setCameraRequest] = useState(0);
  const [pendingProjectImage, setPendingProjectImage] = useState<{ base64: string; uri: string } | null>(null);
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color={themeColors.mint} />
        <Text style={[styles.splashText, { color: themeColors.textMuted }]}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Activity':    return <ActivityFeedScreen onNavigate={setActiveTab} onOpenProfile={(uid) => { setViewingUserId(uid); setActiveTab('UserProfile'); }} cameraRequest={cameraRequest} />;
      case 'Shop':        return <MarketplaceScreen onNavigate={setActiveTab} onOpenService={(svc) => { setSelectedService(svc); setActiveTab('ServiceDetail'); }} />;
      case 'RFQ':         return <RFQMarketplaceScreen onNavigate={setActiveTab} onSelectRfq={setSelectedRfq} />;
      case 'Feed':        return <FeedScreen onNavigate={setActiveTab} />;
      case 'Messages':    return <MessagesScreen onNavigate={setActiveTab} />;
      case 'Profile':     return <ProfileScreen onNavigate={setActiveTab} />;
      case 'Orders':      return <OrdersScreen onNavigate={setActiveTab} />;
      case 'Home':        return <HomeScreen onNavigate={setActiveTab} />;
      case 'Tokens':      return <TokenScreen onBack={() => setActiveTab('Profile')} />;
      case 'CreateRFQ':   return <CreateRFQScreen onBack={() => setActiveTab('RFQ')} onNavigate={setActiveTab} />;
      case 'SubmitOffer': return selectedRfq ? <SubmitOfferScreen rfq={selectedRfq} onBack={() => setActiveTab('RFQ')} onNavigate={setActiveTab} /> : <RFQMarketplaceScreen onNavigate={setActiveTab} onSelectRfq={setSelectedRfq} />;
      case 'PostService': return <PostServiceScreen onBack={() => setActiveTab('Shop')} onNavigate={setActiveTab} />;
      case 'CompanyProfile': return <CompanyProfileScreen onBack={() => setActiveTab('Profile')} onNavigate={setActiveTab} />;
      case 'Settings':    return <SettingsScreen onBack={() => setActiveTab('Profile')} onNavigate={setActiveTab} />;
      case 'ServiceDetail': return selectedService ? <ServiceDetailScreen service={selectedService} onBack={() => setActiveTab('Shop')} onNavigate={setActiveTab} /> : <MarketplaceScreen onNavigate={setActiveTab} />;
      case 'Receipts':    return <ReceiptsScreen onNavigate={setActiveTab} />;
      case 'ScanReceipt': return <ScanReceiptScreen onBack={() => setActiveTab('Receipts')} onNavigate={setActiveTab} />;
      case 'Camera':      return <CameraScreen onBack={() => setActiveTab('Activity')} onNavigate={setActiveTab} onProjectImage={(base64, uri) => { setPendingProjectImage({ base64, uri }); }} />;
      case 'UserProfile': return viewingUserId ? <UserProfileScreen userId={viewingUserId} onBack={() => setActiveTab('Activity')} /> : <ActivityFeedScreen onNavigate={setActiveTab} />;
      default:            return <ActivityFeedScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
      <View style={styles.screen}>{renderScreen()}</View>
      <TabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        unreadMessages={0}
        onCreatePress={() => {
          // Center + button → open the in-app camera (Instagram-style)
          setActiveTab('Camera');
        }}
      />
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.com.maxdeleonardis.precisionprojectflow">
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </StripeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashText: { marginTop: 12, fontSize: 14 },
});

export default App;

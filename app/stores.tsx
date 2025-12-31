import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Definisikan tipe data Store biar rapi (Opsional tapi bagus)
interface Store {
  id: number;
  name: string;
  slug: string;
  address?: string;
  image_url?: string;
}

export default function StoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const token = await AsyncStorage.getItem("pos_token");
      const userStr = await AsyncStorage.getItem("pos_user");
      
      if (!token) {
        router.replace('/'); // Tendang balik ke login kalau ga ada token
        return;
      }

      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }

      // Fetch Data Toko dari API Laravel
      // Pastikan endpoint ini benar di routes/api.php Laravel kamu
      const response = await axios.get("https://pos.soondobu.com/api/my-stores", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Sesuaikan dengan struktur response JSON Laravel kamu
      // Bisa response.data.data atau langsung response.data
      setStores(response.data.stores);
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat daftar toko.");
      // Opsional: Logout otomatis jika token expired
      // handleLogout(); 
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async (store: Store) => {
    try {
      // Simpan data toko yang dipilih ke HP
      await AsyncStorage.setItem("pos_store", JSON.stringify(store));
      await AsyncStorage.setItem("pos_store_slug", store.slug);

      // Masuk ke Dashboard Utama (Tabs)
      router.replace('/(tabs)');
    } catch (error) {
      console.error("Gagal menyimpan toko", error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  // --- RENDER ITEM CARD ---
  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => handleSelectStore(item)}
    >
      <View style={styles.cardIcon}>
         <MaterialCommunityIcons name="storefront-outline" size={32} color="#2563EB" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.storeAddress} numberOfLines={2}>
          {item.address || "Alamat belum diatur"}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{marginTop: 10, color: '#6B7280'}}>Memuat Toko...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {userName || "Kasir"}</Text>
          <Text style={styles.title}>Pilih Cabang</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
           <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* LIST STORE */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStoreItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-remove" size={50} color="#D1D5DB" />
            <Text style={styles.emptyText}>Tidak ada toko yang tersedia.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // gray-100
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 40, // Extra padding for status bar area
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EFF6FF', // blue-50
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 14,
  }
});
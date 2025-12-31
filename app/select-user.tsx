import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SelectUser() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const slug = await AsyncStorage.getItem("pos_store_slug");
    const name = await AsyncStorage.getItem("pos_store_name"); 
    const apiUrl = await AsyncStorage.getItem("pos_api_url"); 
    
    if (name) setStoreName(name);

    try {
      const res = await axios.get(`${apiUrl}/pos/${slug}/employees`);
      setEmployees(res.data.data);
    } catch (error) {
      console.error("Gagal ambil karyawan", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Warna avatar sedikit lebih vivid agar kontras dengan putih
  const avatarColors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Memuat Data Karyawan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* 1. Header Gradient (Selaras dengan Welcome & Splash) */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Badge Toko */}
          <View style={styles.storeBadge}>
             <MaterialCommunityIcons name="store" size={14} color="#1E40AF" />
             <Text style={styles.storeText}>{storeName || 'Unknown Store'}</Text>
          </View>

          <Text style={styles.title}>Siapa yang bertugas?</Text>
          <Text style={styles.subtitle}>Pilih akun Anda untuk masuk</Text>
        </View>
      </LinearGradient>

      {/* 2. Container Putih Melengkung */}
      <View style={styles.whiteSheet}>
        <FlatList
          data={employees}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const color = avatarColors[index % avatarColors.length];
            
            return (
              <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/pin-auth', params: { id: item.id, name: item.name } })}
              >
                <View style={[styles.avatar, { backgroundColor: color + '15' }]}>
                   <Text style={[styles.avatarText, { color: color }]}>{getInitials(item.name)}</Text>
                </View>
                
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.role}>{item.role}</Text> 
                
                <View style={styles.arrowContainer}>
                   <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
              <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <MaterialCommunityIcons name="account-search-outline" size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyText}>Belum ada data karyawan.</Text>
                  <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
                      <Text style={styles.retryText}>Muat Ulang</Text>
                  </TouchableOpacity>
              </View>
          }
        />

        {/* Footer Link */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.replace('/scan-setup')}>
              <Text style={styles.footerLink}>Bukan toko ini? <Text style={{fontWeight: 'bold', color: '#2563EB'}}>Scan Ulang</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E40AF' }, // Background dasar biru tua
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  // HEADER DESIGN
  header: {
    height: '35%', // Mengambil 35% layar
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30, // Memberi ruang agar text tidak ketutup kurva putih
  },
  headerContent: {
    marginTop: 20,
  },
  storeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    marginBottom: 16,
    gap: 6
  },
  storeText: { fontSize: 12, color: '#1E40AF', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#BFDBFE' },

  // WHITE SHEET DESIGN (KURVA)
  whiteSheet: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Putih agak abu dikit biar kartu pop-up
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, // Trik overlap (menumpuk di atas biru)
    paddingTop: 30,
    overflow: 'hidden'
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between' },
  
  // CARD DESIGN
  card: { 
    backgroundColor: 'white', 
    width: (width - 52) / 2, 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    alignItems: 'center',
    
    // Shadow Lembut
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 14 
  },
  avatarText: { fontSize: 22, fontWeight: 'bold' },
  
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  role: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  
  arrowContainer: { position: 'absolute', bottom: 15, right: 15 },

  // EMPTY STATE
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { color: '#6B7280', fontSize: 15 },
  retryBtn: { marginTop: 10, padding: 10 },
  retryText: { color: '#2563EB', fontWeight: 'bold' },

  footer: { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: 'white' },
  footerLink: { color: '#6B7280', fontSize: 13 }
});
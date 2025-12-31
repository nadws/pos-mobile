import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList, Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// --- TIPE DATA ---
interface Product {
    id: number;
    name: string;
    price: number;
    image?: string;
    category: {
        id: number;
        name: string;
    };
}

interface CartItem extends Product {
    qty: number;
}

export default function PosScreen() {
    const router = useRouter();

    // --- STATE ---
    const [menu, setMenu] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // State untuk Pull-to-Refresh
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isCartVisible, setIsCartVisible] = useState(false);

    // Refresh otomatis saat halaman di-focus
    useFocusEffect(
        useCallback(() => {
            fetchMenu();
        }, [])
    );

    const fetchMenu = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const slug = await AsyncStorage.getItem("pos_store_slug");
            const token = await AsyncStorage.getItem("pos_token");

            if (!token || !slug) {
                router.replace('/');
                return;
            }

            const response = await axios.get(
                `https://pos.soondobu.com/api/pos/${slug}/menu`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const products = response.data.products;
            setMenu(products);

            const uniqueCategories = [
                "All",
                ...new Set(products.map((item: Product) => item.category.name)),
            ] as string[];
            setCategories(uniqueCategories);

        } catch (error) {
            console.error("Error Fetch Menu:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fungsi taruh layar ke bawah untuk refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchMenu(true);
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const exist = prev.find((item) => item.id === product.id);
            if (exist) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            } else {
                return [...prev, { ...product, qty: 1 }];
            }
        });
    };

    const decreaseQty = (id: number) => {
        setCart((prev) => {
            const item = prev.find((i) => i.id === id);
            if (item?.qty === 1) {
                return prev.filter((i) => i.id !== id);
            } else {
                return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
            }
        });
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            await AsyncStorage.setItem("pos_cart", JSON.stringify(cart));
            setIsCartVisible(false);
            router.push('/payment');
        } catch (error) {
            console.error(error);
        }
    };

    const filteredMenu = useMemo(() => {
        return menu.filter((item) => {
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCat = selectedCategory === "All" || item.category.name === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [menu, searchQuery, selectedCategory]);

    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

    const renderProduct = ({ item }: { item: Product }) => {
        const cartItem = cart.find(c => c.id === item.id);
        const getImageUrl = (img?: string) => {
            if (!img) return null;
            if (img.startsWith('http')) return img;
            return `https://pos.soondobu.com/storage/${img}`;
        };
        const imageUrl = getImageUrl(item.image);

        return (
            <TouchableOpacity 
                style={styles.productCard} 
                onPress={() => addToCart(item)}
                activeOpacity={0.7}
            >
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    ) : (
                        <View style={[styles.productImage, styles.placeholderImage]}>
                            <Text style={{fontSize: 30}}>🍲</Text>
                        </View>
                    )}
                    {cartItem && (
                        <View style={styles.badgeQty}>
                            <Text style={styles.badgeText}>{cartItem.qty}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* --- HEADER BIRU --- */}
            <View style={styles.blueHeader}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.navBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Menu Kasir</Text>
                    <View style={{width: 40}} />
                </View>

                <View style={styles.searchWrapper}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Cari menu favorit..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* --- BODY --- */}
            <View style={styles.bodyContainer}>
                {/* KATEGORI DENGAN WARNA ACTIVE TERANG */}
                <View style={styles.categoryWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                        {categories.map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList 
                    data={filteredMenu}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderProduct}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                    }
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={{justifyContent: 'space-between'}}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="food-off" size={60} color="#E5E7EB" />
                            <Text style={{color: '#9CA3AF', marginTop: 10}}>Menu tidak ditemukan</Text>
                        </View>
                    }
                />
            </View>

            {/* --- BOTTOM BAR --- */}
            {cart.length > 0 && (
                <View style={styles.bottomBarContainer}>
                    <TouchableOpacity style={styles.bottomBar} onPress={() => setIsCartVisible(true)}>
                        <View style={styles.cartInfo}>
                            <View style={styles.cartCountBadge}>
                                <Text style={styles.cartCountText}>{totalItems}</Text>
                            </View>
                            <View>
                                <Text style={styles.cartTotalLabel}>Total Belanja</Text>
                                <Text style={styles.cartTotalPrice}>{formatRupiah(totalPrice)}</Text>
                            </View>
                        </View>
                        <View style={styles.checkoutBtnSmall}>
                            <Text style={styles.checkoutTextSmall}>Selesaikan</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* MODAL KERANJANG */}
            <Modal animationType="slide" transparent={true} visible={isCartVisible} onRequestClose={() => setIsCartVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detail Pesanan</Text>
                            <TouchableOpacity onPress={() => setIsCartVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.cartList}>
                            {cart.map((item) => (
                                <View key={item.id} style={styles.cartItem}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.cartItemName}>{item.name}</Text>
                                        <Text style={styles.cartItemPrice}>{formatRupiah(item.price * item.qty)}</Text>
                                    </View>
                                    <View style={styles.qtyControl}>
                                        <TouchableOpacity onPress={() => decreaseQty(item.id)} style={styles.qtyBtn}>
                                            <MaterialCommunityIcons name="minus" size={16} color="#2563EB" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{item.qty}</Text>
                                        <TouchableOpacity onPress={() => addToCart(item)} style={[styles.qtyBtn, {backgroundColor: '#2563EB'}]}>
                                            <MaterialCommunityIcons name="plus" size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <View style={styles.modalTotalRow}>
                                <Text style={styles.modalTotalLabel}>Total Tagihan</Text>
                                <Text style={styles.modalTotalValue}>{formatRupiah(totalPrice)}</Text>
                            </View>
                            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                                <Text style={styles.checkoutButtonText}>Bayar Sekarang</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    blueHeader: {
        backgroundColor: '#2563EB',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    navBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    searchWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        paddingHorizontal: 15, height: 45, borderRadius: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1F2937' },

    bodyContainer: { flex: 1, marginTop: -20 },
    categoryWrapper: { marginBottom: 15 },
    catPill: { 
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
        backgroundColor: 'white', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB',
        elevation: 2, shadowColor: "#000", shadowOpacity: 0.05
    },
    // WARNA ACTIVE: Biru Terang agar kontras dengan latar abu-abu
    catPillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    catText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    // TEKS ACTIVE: Putih agar terbaca jelas
    catTextActive: { color: 'white' },

    listContainer: { paddingHorizontal: 20, paddingBottom: 120 },
    emptyState: { alignItems: 'center', marginTop: 50 },
    
    productCard: { 
        width: '48%', backgroundColor: 'white', borderRadius: 16, marginBottom: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden'
    },
    imageContainer: { height: 110, backgroundColor: '#F3F4F6', position: 'relative' },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center' },
    badgeQty: { 
        position: 'absolute', top: 8, right: 8, backgroundColor: '#2563EB', 
        paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white'
    },
    badgeText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    productInfo: { padding: 12 },
    productName: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 4, height: 35 },
    productPrice: { fontSize: 13, fontWeight: '800', color: '#2563EB' },

    bottomBarContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    bottomBar: { 
        backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-between', 
        alignItems: 'center', padding: 16, borderRadius: 20, elevation: 8
    },
    cartInfo: { flexDirection: 'row', alignItems: 'center' },
    cartCountBadge: { 
        backgroundColor: '#2563EB', width: 30, height: 30, borderRadius: 15, 
        justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    cartCountText: { color: 'white', fontWeight: 'bold' },
    cartTotalLabel: { color: '#9CA3AF', fontSize: 10 },
    cartTotalPrice: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    checkoutBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    checkoutTextSmall: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    cartList: { padding: 20 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cartItemName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    cartItemPrice: { fontSize: 13, color: '#6B7280' },
    qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4 },
    qtyBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    qtyText: { marginHorizontal: 12, fontWeight: 'bold', fontSize: 15 },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    modalTotalLabel: { fontSize: 15, color: '#6B7280' },
    modalTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
    checkoutButton: { backgroundColor: '#2563EB', padding: 16, borderRadius: 15, alignItems: 'center' },
    checkoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
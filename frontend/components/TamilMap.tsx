import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';

const TamilMap = () => {
    const router = useRouter();
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.webFallback}>
                <Ionicons name="map-outline" size={80} color="#6B4EFF" />
                <Text style={[styles.webFallbackTitle, { color: colors.text }]}>Map coming soon to Web</Text>
                <Text style={[styles.webFallbackText, { color: colors.textLight }]}>
                    The interactive map feature is powered by native components. Please use our mobile app for the full experience.
                </Text>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: '#6B4EFF' }]}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, alignSelf: 'center', maxWidth: 600 },
    webFallbackTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 24, textAlign: 'center' },
    webFallbackText: { fontSize: 16, textAlign: 'center', marginTop: 12, marginBottom: 32, lineHeight: 24 },
    backBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 }
});

export default TamilMap;

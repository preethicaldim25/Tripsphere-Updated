import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface ExploreMapProps {
    places: any[];
    onPinSelect?: (place: any) => void;
    theme: 'light' | 'dark';
    showRoute?: boolean;
    routePlaces?: any[];
}

const ExploreMap = ({ places, onPinSelect, theme, showRoute, routePlaces }: ExploreMapProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handlePinPress = (place: any) => {
        setSelectedId(place.id || place._id);
        if (onPinSelect) onPinSelect(place);
    };

    // calculate bounding box for dynamic region
    let initialRegion = {
        latitude: 11.1271,
        longitude: 78.6569,
        latitudeDelta: 5.0,
        longitudeDelta: 5.0,
    };
    
    if (places && places.length > 0) {
        const lats = places.map(p => p.latitude || p.coordinates?.lat).filter(Boolean);
        const lngs = places.map(p => p.longitude || p.coordinates?.lng).filter(Boolean);
        if (lats.length > 0 && lngs.length > 0) {
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            initialRegion = {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(0.1, (maxLat - minLat) * 1.5),
                longitudeDelta: Math.max(0.1, (maxLng - minLng) * 1.5),
            };
        }
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={initialRegion}
                customMapStyle={theme === 'dark' ? darkMapStyle : []}
                showsUserLocation={true}
                showsMyLocationButton={false}
            >
                {showRoute && (routePlaces || places).length > 1 && (
                    <Polyline
                        coordinates={(routePlaces || places).map((place) => ({
                            latitude: place.latitude || place.coordinates?.lat || 11.0,
                            longitude: place.longitude || place.coordinates?.lng || 78.0,
                        }))}
                        strokeColor="#6B4EFF"
                        strokeWidth={3}
                        lineDashPattern={[10, 5]}
                    />
                )}
                {places.map((place) => {
                    const isSelected = selectedId === (place.id || place._id);
                    return (
                        <Marker
                            key={place.id || place._id}
                            coordinate={{
                                latitude: place.latitude || place.coordinates?.lat || 11.0,
                                longitude: place.longitude || place.coordinates?.lng || 78.0,
                            }}
                            onPress={() => handlePinPress(place)}
                        >
                            <View style={[
                                styles.marker, 
                                { backgroundColor: isSelected ? '#FF4B4B' : '#6B4EFF' },
                                isSelected && { transform: [{ scale: 1.3 }], borderWidth: 2.5 }
                            ]}>
                                <Ionicons 
                                    name={
                                        (place.category?.toLowerCase().includes('temple') ? 'business' :
                                        place.category?.toLowerCase().includes('hill') ? 'mountain' :
                                        place.category?.toLowerCase().includes('beach') ? 'water' : 'location') as any
                                    } 
                                    size={isSelected ? 18 : 14} 
                                    color="#fff" 
                                />
                                {isSelected && <View style={styles.selectedDot} />}
                            </View>
                        </Marker>
                    );
                })}
            </MapView>
            
            {/* Locate Me Button Overlay */}
            <TouchableOpacity 
                style={styles.locateBtn} 
                activeOpacity={0.8}
                onPress={() => {
                    // Logic to zoom to user location would happen here 
                    // Usually requires a ref to MapView
                }}
            >
                <Ionicons name="location" size={24} color="#6B4EFF" />
            </TouchableOpacity>
        </View>
    );
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
    container: { height: '100%', width: '100%' },
    map: { ...StyleSheet.absoluteFillObject },
    marker: { 
        padding: 8, 
        borderRadius: 20, 
        borderWidth: 1.5, 
        borderColor: '#fff', 
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3
    },
    selectedDot: {
        position: 'absolute',
        bottom: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF4B4B'
    },
    locateBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#fff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    }
});

export default ExploreMap;

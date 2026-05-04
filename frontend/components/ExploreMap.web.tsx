import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

let _L: any = null;

const getLeaflet = (): any => {
    if (_L) return _L;
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    try {
        const L = require('leaflet');
        _L = L;
    } catch (e) {
        console.error('❌ Failed to load Leaflet:', e);
    }
    return _L;
};

const getLatLng = (place: any): { lat: number; lng: number } | null => {
    if (!place) return null;
    const lat = place.lat ?? place.latitude ?? (typeof place.coordinates === 'object' ? (place.coordinates?.lat ?? place.coordinates?.latitude) : null) ?? null;
    const lng = place.lng ?? place.longitude ?? (typeof place.coordinates === 'object' ? (place.coordinates?.lng ?? place.coordinates?.longitude) : null) ?? null;
    if (lat === null || lng === null) return null;
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || (numLat === 0 && numLng === 0)) return null;
    return { lat: numLat, lng: numLng };
};

const ExploreMap = ({ 
    places = [], 
    center, 
    zoom, 
    onPinSelect, 
    id = 'explore-map', 
    routePlaces, 
    showRoute = false,
    isFullScreen = false
}: any) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const layerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // 0. HANDLE RESIZE ON FULL SCREEN TOGGLE
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 300);
        }
    }, [isFullScreen]);

    // 1. INITIALIZE MAP
    useEffect(() => {
        const L = getLeaflet();
        if (!L || !containerRef.current || mapRef.current) return;

        try {
            const defaultCenter: [number, number] = center ?? [11.1271, 78.6569];
            const defaultZoom: number = zoom ?? 7;

            const map = L.map(containerRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                attributionControl: true,
            }).setView(defaultCenter, defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            layerRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;
            setMapReady(true);
            map.invalidateSize();
        } catch (e) {
            console.error('❌ Map init error:', e);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current  = null;
            }
        };
    }, []);

    // 1.5. RESIZE HANDLING
    useEffect(() => {
        if (!mapReady || !mapRef.current || !containerRef.current) return;
        const map = mapRef.current;
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [mapReady]);

    // 2. MARKERS + ROUTE
    useEffect(() => {
        if (!mapReady || !mapRef.current || !layerRef.current) return;
        const map = mapRef.current;
        const lg  = layerRef.current;
        const L = getLeaflet();

        console.log("📅 Selected Day Map Update:", places.length, "places");
        console.log("📍 Places:", places);

        lg.clearLayers();
        if (polylineRef.current) {
            map.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }

        if (!places || places.length === 0) return;

        const usedCoords = new Set();
        places.forEach((p: any, idx: number) => {
            const rawCoords = getLatLng(p);
            if (!rawCoords) return;

            let lat = rawCoords.lat;
            let lng = rawCoords.lng;
            const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
            if (usedCoords.has(coordKey)) {
                lat += (Math.random() - 0.5) * 0.001;
                lng += (Math.random() - 0.5) * 0.001;
            }
            usedCoords.add(coordKey);

            // 1. Create a marker (pin)
            const marker = L.marker([lat, lng]).addTo(lg);

            // 2. Add Popup
            marker.bindPopup(`Stop ${idx + 1}: ${p.name || 'Activity'}`);

            marker.on('click', () => {
                if (onPinSelect) onPinSelect(p);
            });
        });

        // DRAW ROUTE LINE
        if (places.length > 1) {
            const latlngs = places.map((p: any) => {
                const c = getLatLng(p);
                return c ? [c.lat, c.lng] : null;
            }).filter(Boolean);

            if (latlngs.length > 1) {
                polylineRef.current = L.polyline(latlngs as any, {
                    color: 'blue',
                    weight: 4
                }).addTo(lg); // Adding to layerGroup so it gets cleared too
                
                // 9. AUTO ZOOM
                const bounds = L.latLngBounds(latlngs as any);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else if (places.length === 1) {
            const c = getLatLng(places[0]);
            if (c) map.setView([c.lat, c.lng], 14);
        }
    }, [places, routePlaces, showRoute, mapReady]);

    if (Platform.OS !== 'web') return null;

    return (
        <View style={styles.container}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '500px',
                    backgroundColor: isDarkMode ? '#1a1a2e' : '#f8f9ff',
                }}
            />

            {mapReady && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => setIsDarkMode(!isDarkMode)}
                    >
                        <Ionicons 
                            name={isDarkMode ? "sunny" : "moon"} 
                            size={22} 
                            color="#6B4EFF" 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => {
                            if (mapRef.current) mapRef.current.setView([11.1271, 78.6569], 7);
                        }}
                    >
                        <Ionicons name="locate" size={22} color="#6B4EFF" />
                    </TouchableOpacity>
                </View>
            )}

            <style>{`
                .leaflet-container { 
                    height: 100% !important; 
                    width: 100% !important; 
                    z-index: 1; 
                    border-radius: 20px; 
                    background: ${isDarkMode ? '#1a1a2e' : '#f0f0f0'} !important;
                }
                .leaflet-tile { 
                    filter: ${isDarkMode ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none'}; 
                }
                .marker-number-label {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: #ffffff !important;
                    font-weight: 900 !important;
                    font-size: 12px !important;
                    text-align: center !important;
                    pointer-events: none !important;
                }
                .marker-label-tooltip {
                    background: ${isDarkMode ? 'rgba(30, 30, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
                    border: 1px solid #6B4EFF !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                    color: ${isDarkMode ? '#ffffff' : '#1a1a1a'} !important;
                    font-weight: 800 !important;
                    padding: 4px 10px !important;
                    border-radius: 8px !important;
                    font-size: 11px !important;
                    white-space: nowrap !important;
                }
                .leaflet-tooltip-top:before { border-top-color: #6B4EFF !important; }
                .leaflet-tooltip-center { margin-top: 0 !important; }
            `}</style>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%', minHeight: 350, backgroundColor: '#1a1a2e' },
    buttonContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        gap: 12,
    },
    mapBtn: {
        backgroundColor: '#fff',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
});

export default ExploreMap;

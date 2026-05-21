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
                zoomControl: false,
                scrollWheelZoom: true,
                attributionControl: false,
            }).setView(defaultCenter, defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

            // Create circular glowing marker div
            const customIcon = L.divIcon({
                className: 'custom-glow-pin',
                html: `<div class="pin-ring"></div><div class="pin-dot"></div><div class="pin-label">${p.name.split(' ')[0]}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // 1. Create a marker (pin)
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(lg);

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
                    color: '#6B4EFF',
                    weight: 4,
                    opacity: 0.8
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
                    height: '350px',
                    backgroundColor: '#0a0a16',
                }}
            />

            {/* Top-Left Header Overlay */}
            <View style={styles.textOverlay} pointerEvents="none">
                <Text style={styles.overlayTitle}>Tamil Nadu</Text>
                <Text style={styles.overlaySubtitle}>Explore top places</Text>
            </View>

            {mapReady && (
                <>
                    {/* Bottom-Left Re-center Button */}
                    <TouchableOpacity
                        style={styles.reCenterBtn}
                        onPress={() => {
                            if (mapRef.current) mapRef.current.setView([11.1271, 78.6569], 7);
                        }}
                    >
                        <Ionicons name="locate" size={14} color="#fff" />
                        <Text style={styles.reCenterText}>Re-center</Text>
                    </TouchableOpacity>

                    {/* Bottom-Right Zoom Controls */}
                    <View style={styles.zoomContainer}>
                        <TouchableOpacity
                            style={styles.zoomBtn}
                            onPress={() => {
                                if (mapRef.current) mapRef.current.zoomIn();
                            }}
                        >
                            <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.zoomDivider} />
                        <TouchableOpacity
                            style={styles.zoomBtn}
                            onPress={() => {
                                if (mapRef.current) mapRef.current.zoomOut();
                            }}
                        >
                            <Ionicons name="remove" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <style>{`
                .leaflet-container { 
                    height: 100% !important; 
                    width: 100% !important; 
                    z-index: 1; 
                    border-radius: 24px; 
                    background: #080810 !important;
                }
                .leaflet-tile { 
                    filter: invert(100%) hue-rotate(190deg) brightness(85%) contrast(110%) saturate(140%); 
                }
                .custom-glow-pin {
                    position: relative;
                }
                .pin-ring {
                    width: 16px;
                    height: 16px;
                    background: rgba(107, 78, 255, 0.4);
                    border: 1px solid rgba(107, 78, 255, 0.8);
                    border-radius: 50%;
                    animation: pin-pulse 1.5s infinite;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                }
                .pin-dot {
                    width: 8px;
                    height: 8px;
                    background: #6B4EFF;
                    border: 1.5px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #6B4EFF;
                    position: absolute;
                    top: 6px;
                    left: 6px;
                }
                .pin-label {
                    position: absolute;
                    left: 18px;
                    top: 2px;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 800;
                    text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9);
                    white-space: nowrap;
                }
                @keyframes pin-pulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%', height: 350, backgroundColor: '#080810', borderRadius: 24, overflow: 'hidden' },
    textOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
    },
    overlayTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    overlaySubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    reCenterBtn: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(12, 12, 26, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    reCenterText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    zoomContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(12, 12, 26, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        alignItems: 'center',
        width: 36,
    },
    zoomBtn: {
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomDivider: {
        width: '70%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

export default ExploreMap;

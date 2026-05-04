import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const L = Platform.OS === 'web' && typeof window !== 'undefined' ? require('leaflet') : null;

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

const NearbyMap = ({
  theme,
  colors,
  location,
  results,
  selectedPlace,
  handlePlaceSelect,
  routeCoordinates,
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !L) return;

    try {
        const center: [number, number] = location
          ? [location.latitude, location.longitude]
          : [11.1271, 78.6569];

        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView(center, 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 500);
    } catch (e) {
        console.error("❌ NearbyMap init error:", e);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return;
    const map = mapRef.current;
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !layerRef.current) return;
    const layerGroup = layerRef.current;
    layerGroup.clearLayers();

    if (location) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:${colors?.primary || '#6B4EFF'};border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px ${colors?.primary || '#6B4EFF'}40;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([location.latitude, location.longitude], { icon: userIcon }).addTo(layerGroup).bindPopup('<strong>Your Location</strong>');
    }

    if (!results || results.length === 0) return;

    const usedCoords = new Set();
    results.forEach((place: any) => {
        const rawCoords = getLatLng(place);
        if (!rawCoords) return;

        let lat = rawCoords.lat;
        let lng = rawCoords.lng;
        const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (usedCoords.has(coordKey)) {
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;
        }
        usedCoords.add(coordKey);

        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: colors?.primary || '#6B4EFF',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        }).addTo(layerGroup);

        marker.bindTooltip(place.name || 'Unknown', {
            permanent: true,
            direction: 'top',
            offset: [0, -10],
            className: 'marker-label-tooltip',
            opacity: 0.9
        });

        marker.on('click', () => handlePlaceSelect(place));
    });
  }, [results, location, mapReady, colors]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
    }

    const routeCoords = (routeCoordinates || []).map((c: any) => {
        const coords = getLatLng(c);
        return coords ? [coords.lat, coords.lng] : null;
    }).filter(Boolean);

    if (routeCoords.length > 1) {
        polylineRef.current = L.polyline(routeCoords as any, {
            color: colors?.primary || '#6B4EFF',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.8
        }).addTo(map);
        map.fitBounds(routeCoords as any, { padding: [40, 40] });
    }
  }, [routeCoordinates, mapReady, colors]);

  return (
    <View style={localStyles.wrapper}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div 
        ref={containerRef} 
        style={{ 
            width: '100%', 
            height: '100%', 
            zIndex: 1,
            backgroundColor: isDarkMode ? '#1a1a2e' : '#f8f9ff',
            borderRadius: '24px',
            overflow: 'hidden'
        }} 
      />
      
      {mapReady && (
          <View style={localStyles.buttonContainer}>
              <TouchableOpacity
                  style={[localStyles.mapBtn, { backgroundColor: isDarkMode ? '#2D2D44' : '#fff' }]}
                  onPress={() => setIsDarkMode(!isDarkMode)}
              >
                  <Ionicons 
                      name={isDarkMode ? "sunny" : "moon"} 
                      size={20} 
                      color="#6B4EFF" 
                  />
              </TouchableOpacity>
          </View>
      )}

      <style>{`
        .leaflet-container { 
            height: 100% !important; 
            width: 100% !important; 
            z-index: 1; 
            background: ${isDarkMode ? '#1a1a2e' : '#f0f0f0'} !important;
            font-family: inherit;
        }
        .leaflet-tile { 
            filter: ${isDarkMode ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none'}; 
            transition: filter 0.3s ease;
        }
        .leaflet-control-attribution {
            font-size: 8px !important;
            background: ${isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} !important;
            color: ${isDarkMode ? '#aaa' : '#666'} !important;
            backdrop-filter: blur(4px);
        }
        .marker-label-tooltip {
            background: ${isDarkMode ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
            border: 1px solid #6B4EFF !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
            color: ${isDarkMode ? '#ffffff' : '#1a1a1a'} !important;
            font-weight: 700 !important;
            padding: 4px 10px !important;
            border-radius: 8px !important;
            font-size: 10px !important;
            white-space: nowrap !important;
            backdrop-filter: blur(4px);
        }
        .leaflet-tooltip-top:before { border-top-color: #6B4EFF !important; }
        .leaflet-bar a {
            background-color: ${isDarkMode ? '#2D2D44' : '#fff'} !important;
            color: ${isDarkMode ? '#fff' : '#000'} !important;
            border-bottom: 1px solid ${isDarkMode ? '#3D3D5C' : '#ccc'} !important;
        }
      `}</style>
    </View>
  );
};

const localStyles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#1a1a2e' },
  buttonContainer: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      zIndex: 1000,
  },
  mapBtn: {
      backgroundColor: '#fff',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
  },
});

export default NearbyMap;

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getDestinationImage } from '../constants/images';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

const NearbyMap = ({
  mapRef,
  theme,
  colors,
  location,
  pulseStyle,
  results,
  selectedPlace,
  handlePlaceSelect,
  routeCoordinates,
  styles,
}: any) => {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: location?.latitude ?? 11.1271,
        longitude: location?.longitude ?? 78.6569,
        latitudeDelta: 5.0,
        longitudeDelta: 5.0,
      }}
      showsUserLocation={false}
      customMapStyle={theme === 'dark' ? darkMapStyle : []}
    >
      {/* Pulsing user location */}
      {location && (
        <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userMarkerContainer}>
            <Animated.View
              style={[
                styles.userPulse,
                pulseStyle,
                { backgroundColor: (colors?.primary ?? '#6B4EFF') + '40' },
              ]}
            />
            <View
              style={[
                styles.userDot,
                { backgroundColor: colors?.primary ?? '#6B4EFF' },
              ]}
            />
          </View>
        </Marker>
      )}

      {/* Destination markers */}
      {(results ?? []).map((place: any) => {
        if (!place?.coordinates?.lat) return null;
        const isSelected =
          selectedPlace?.id === place.id || selectedPlace?.name === place.name;
        return (
          <Marker
            key={place.id ?? place.name}
            coordinate={{
              latitude: place.coordinates.lat,
              longitude: place.coordinates.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => handlePlaceSelect(place)}
          >
            <View
              style={[
                styles.destMarker,
                isSelected && [
                  styles.activeDestMarker,
                  { backgroundColor: colors?.primary ?? '#6B4EFF' },
                ],
              ]}
            >
              <Image
                source={{ uri: getDestinationImage(place.name) }}
                style={styles.markerImg}
                contentFit="cover"
              />
            </View>
          </Marker>
        );
      })}

      {/* Route line */}
      {routeCoordinates.length >= 2 && (
        <>
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors?.primary ?? '#6B4EFF'}
            strokeWidth={5}
            lineJoin="round"
          />
          {/* Animated car icon at the destination end */}
          <Marker
            coordinate={routeCoordinates[routeCoordinates.length - 1]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Animated.View
              entering={FadeInRight.duration(600)}
              style={[
                styles.movingIndicator,
                { backgroundColor: colors?.primary ?? '#6B4EFF' },
              ]}
            >
              <Ionicons name="car-sport" size={18} color="#fff" />
            </Animated.View>
          </Marker>
        </>
      )}
    </MapView>
  );
};

export default NearbyMap;

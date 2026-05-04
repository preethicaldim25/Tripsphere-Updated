import React from 'react';
import { Stack } from 'expo-router';
import TamilMap from '../components/TamilMap';

export default function MapScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TamilMap />
        </>
    );
}
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function InicioScreen() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/fish-game.json')}
        autoPlay
        loop
        style={styles.lottie}
        resizeMode="contain"
      />
      <Text style={styles.text}>Inicio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lottie: {
    width: 320,
    height: 320,
    marginBottom: 12,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

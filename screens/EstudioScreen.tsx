import React, { useState, useEffect, useRef, MutableRefObject } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

interface EstudioScreenProps {
  tiempoEstudio: number;
  setTiempoEstudio: (tiempo: number) => void;
  tiempoDescanso: number;
  setTiempoDescanso: (tiempo: number) => void;
  segundosRestantes: number;
  setSegundosRestantes: (segundos: number) => void;
  temporizadorActivo: boolean;
  setTemporizadorActivo: (activo: boolean) => void;
  esDescanso: boolean;
  setEsDescanso: (descanso: boolean) => void;
  ciclosCompletados: number;
  setCiclosCompletados: (ciclos: number) => void;
  musicaActiva: boolean;
  setMusicaActiva: (activa: boolean) => void;
  cancionActual: number;
  setCancionActual: (cancion: number) => void;
  soundRef: MutableRefObject<Audio.Sound | null>;
}

export default function EstudioScreen({
  tiempoEstudio,
  setTiempoEstudio,
  tiempoDescanso,
  setTiempoDescanso,
  segundosRestantes,
  setSegundosRestantes,
  temporizadorActivo,
  setTemporizadorActivo,
  esDescanso,
  setEsDescanso,
  ciclosCompletados,
  setCiclosCompletados,
  musicaActiva,
  setMusicaActiva,
  cancionActual,
  setCancionActual,
  soundRef,
}: EstudioScreenProps) {

  // Lista de música relajante sin copyright
  const playlistRelajante = [
    {
      nombre: "Lluvia Suave",
      url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
      emoji: "🌧️"
    },
    {
      nombre: "Dark",
      url: "https://assets.mixkit.co/active_storage/sfx/2500/2500-preview.mp3",
      emoji: "🌙"
    },
    {
      nombre: "Olas del Mar",
      url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
      emoji: "🌊"
    },
    {
      nombre: "Naturaleza",
      url: "https://assets.mixkit.co/active_storage/sfx/2473/2473-preview.mp3",
      emoji: "🌿"
    }
  ];

  const formatearTiempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const iniciarPausar = () => {
    setTemporizadorActivo(!temporizadorActivo);
  };

  const reiniciar = () => {
    setTemporizadorActivo(false);
    setEsDescanso(false);
    setSegundosRestantes(tiempoEstudio * 60);
  };

  const ajustarTiempoEstudio = (incremento: number) => {
    const nuevoTiempo = Math.max(1, Math.min(60, tiempoEstudio + incremento));
    setTiempoEstudio(nuevoTiempo);
    if (!temporizadorActivo && !esDescanso) {
      setSegundosRestantes(nuevoTiempo * 60);
    }
  };

  const ajustarTiempoDescanso = (incremento: number) => {
    const nuevoTiempo = Math.max(1, Math.min(30, tiempoDescanso + incremento));
    setTiempoDescanso(nuevoTiempo);
  };

  const reproducirMusica = async (index: number) => {
    try {
      // Detener música anterior si existe
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configurar audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Cargar y reproducir nueva canción
      const { sound } = await Audio.Sound.createAsync(
        { uri: playlistRelajante[index].url },
        { shouldPlay: true, isLooping: true, volume: 0.5 }
      );
      
      soundRef.current = sound;
      setCancionActual(index);
      setMusicaActiva(true);
    } catch (error) {
      console.error('Error al reproducir música:', error);
      Alert.alert(
        'Error al cargar música',
        `No se pudo reproducir "${playlistRelajante[index].nombre}". La URL puede no estar disponible. Intenta con otra opción.`,
        [{ text: 'OK' }]
      );
    }
  };

  const pausarMusica = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setMusicaActiva(false);
      }
    } catch (error) {
      console.error('Error al pausar música:', error);
    }
  };

  const reanudarMusica = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setMusicaActiva(true);
      }
    } catch (error) {
      console.error('Error al reanudar música:', error);
    }
  };

  const detenerMusica = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setMusicaActiva(false);
      }
    } catch (error) {
      console.error('Error al detener música:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#A8D5BA', '#C8E6C9', '#E8F5E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>⏱️ Temporizador de Estudio</Text>
        <Text style={styles.headerSubtitle}>Técnica Pomodoro</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Temporizador Principal */}
        <View style={styles.temporizadorCard}>
          <View style={styles.temporizadorGradient}>
            <Text style={styles.modoTexto}>
              {esDescanso ? '☕ Tiempo de Descanso' : '📚 Tiempo de Estudio'}
            </Text>
            
            <View style={styles.tiempoDisplay}>
              <Text style={styles.tiempoTexto}>{formatearTiempo(segundosRestantes)}</Text>
            </View>

            <View style={styles.botonesControl}>
              <Pressable 
                style={[styles.botonControl, styles.botonIniciar]}
                onPress={iniciarPausar}
              >
                <Text style={styles.botonTexto}>{temporizadorActivo ? '⏸ Pausar' : '▶ Iniciar'}</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.botonControl, styles.botonReiniciar]}
                onPress={reiniciar}
              >
                <Text style={styles.botonTexto}> Reiniciar</Text>
              </Pressable>
            </View>

            <Text style={styles.ciclosTexto}>
              🎯 Ciclos completados: {ciclosCompletados}
            </Text>
          </View>
        </View>

        {/* Configuración de Tiempos */}
        <View style={styles.configuracionCard}>
          <Text style={styles.cardTitulo}>⚙️ Configuración</Text>
          
          <View style={styles.ajusteContainer}>
            <Text style={styles.ajusteTitulo}>Tiempo de Estudio</Text>
            <View style={styles.ajusteBotones}>
              <Pressable 
                style={styles.botonAjuste}
                onPress={() => ajustarTiempoEstudio(-5)}
                disabled={temporizadorActivo}
              >
                <Text style={styles.botonAjusteTexto}>-5</Text>
              </Pressable>
              <Text style={styles.valorTiempo}>{tiempoEstudio} min</Text>
              <Pressable 
                style={styles.botonAjuste}
                onPress={() => ajustarTiempoEstudio(5)}
                disabled={temporizadorActivo}
              >
                <Text style={styles.botonAjusteTexto}>+5</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.ajusteContainer}>
            <Text style={styles.ajusteTitulo}>Tiempo de Descanso</Text>
            <View style={styles.ajusteBotones}>
              <Pressable 
                style={styles.botonAjuste}
                onPress={() => ajustarTiempoDescanso(-1)}
                disabled={temporizadorActivo}
              >
                <Text style={styles.botonAjusteTexto}>-1</Text>
              </Pressable>
              <Text style={styles.valorTiempo}>{tiempoDescanso} min</Text>
              <Pressable 
                style={styles.botonAjuste}
                onPress={() => ajustarTiempoDescanso(1)}
                disabled={temporizadorActivo}
              >
                <Text style={styles.botonAjusteTexto}>+1</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Música Relajante */}
        <View style={styles.musicaCard}>
          <Text style={styles.cardTitulo}>🎵 Música Relajante</Text>
          <Text style={styles.musicaSubtitulo}> Ideal para concentrarse</Text>
          
          <View style={styles.playlistContainer}>
            {playlistRelajante.map((cancion, index) => (
              <Pressable
                key={index}
                style={[
                  styles.cancionItem,
                  cancionActual === index && musicaActiva && styles.cancionActiva
                ]}
                onPress={() => reproducirMusica(index)}
              >
                <Text style={styles.cancionEmoji}>{cancion.emoji}</Text>
                <Text style={styles.cancionNombre}>{cancion.nombre}</Text>
                {cancionActual === index && musicaActiva && (
                  <View style={styles.ondaSonido}>
                    <Text style={styles.ondaTexto}>🎶</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {soundRef.current && (
            <View style={styles.controlesMusica}>
              {musicaActiva ? (
                <Pressable 
                  style={[styles.botonMusica, styles.botonPausar]}
                  onPress={pausarMusica}
                >
                  <Text style={styles.botonMusicaTexto}> Pausar</Text>
                </Pressable>
              ) : (
                <Pressable 
                  style={[styles.botonMusica, styles.botonReanudar]}
                  onPress={reanudarMusica}
                >
                  <Text style={styles.botonMusicaTexto}>Reanudar</Text>
                </Pressable>
              )}
              
              <Pressable 
                style={[styles.botonMusica, styles.botonDetener]}
                onPress={detenerMusica}
              >
                <Text style={styles.botonMusicaTexto}> Detener</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Tips de Estudio */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitulo}>💡 Consejos Pomodoro</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}> Estudia 25 minutos concentrado</Text>
            <Text style={styles.tipItem}> Descansa 5 minutos después</Text>
            <Text style={styles.tipItem}> Cada 4 ciclos, descansa 15-30 min</Text>
            <Text style={styles.tipItem}> Elimina distracciones durante estudio</Text>
            <Text style={styles.tipItem}> Usa el descanso para moverte</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F3',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#A8D5BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
  },
  content: {
    padding: 20,
  },
  temporizadorCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  temporizadorGradient: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modoTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 20,
  },
  tiempoDisplay: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 50,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#A8D5BA',
  },
  tiempoTexto: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#161616',
    fontVariant: ['tabular-nums'],
  },
  botonesControl: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  botonControl: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    minWidth: 140,
    alignItems: 'center',
  },
  botonIniciar: {
    backgroundColor: '#4CAF50',
  },
  botonReiniciar: {
    backgroundColor: '#FF9800',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  ciclosTexto: {
    fontSize: 16,
    color: '#161616',
    fontWeight: '600',
  },
  configuracionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 15,
  },
  ajusteContainer: {
    marginBottom: 15,
  },
  ajusteTitulo: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 10,
    fontWeight: '600',
  },
  ajusteBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  botonAjuste: {
    backgroundColor: '#A8D5BA',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonAjusteTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  valorTiempo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#161616',
    minWidth: 100,
    textAlign: 'center',
  },
  musicaCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  musicaSubtitulo: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  playlistContainer: {
    gap: 10,
  },
  cancionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 15,
    gap: 15,
  },
  cancionActiva: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cancionEmoji: {
    fontSize: 32,
  },
  cancionNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    flex: 1,
  },
  ondaSonido: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ondaTexto: {
    fontSize: 16,
  },
  controlesMusica: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  botonMusica: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonPausar: {
    backgroundColor: '#FF9800',
  },
  botonReanudar: {
    backgroundColor: '#4CAF50',
  },
  botonDetener: {
    backgroundColor: '#E63946',
  },
  botonMusicaTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    fontSize: 15,
    color: '#161616',
    lineHeight: 22,
  },
});

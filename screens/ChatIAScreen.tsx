import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LinearGradient } from 'expo-linear-gradient';

const API_KEY = 'AIzaSyDl079AQl17CtXPtvHqCo3p3we5SwZz6I4';
const genAI = new GoogleGenerativeAI(API_KEY);

interface Materia {
  nombre: string;
  emoji: string;
  imagenes?: string[];
  archivos?: Array<{uri: string, nombre: string, contenido?: string, tipo?: string, puedeAbrirse?: boolean}>;
  notas?: string[];
  seccionesContenido?: Array<{nombre: string}>;
}

interface ChatIAScreenProps {
  materias: Materia[];
}

export default function ChatIAScreen({ materias }: ChatIAScreenProps) {
  const [cuestionario, setCuestionario] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('');

  const prepararContenidoMateria = (materia: Materia): string => {
    let contenido = 'Materia: ' + materia.nombre + '\n\n';
    
    if (materia.notas && materia.notas.length > 0) {
      contenido += 'Notas:\n';
      materia.notas.forEach((nota, index) => {
        contenido += (index + 1) + '. ' + nota + '\n';
      });
      contenido += '\n';
    }
    
    if (materia.archivos && materia.archivos.length > 0) {
      contenido += 'Archivos:\n';
      materia.archivos.forEach((archivo, index) => {
        contenido += (index + 1) + '. ' + archivo.nombre;
        if (archivo.contenido) {
          contenido += '\nContenido: ' + archivo.contenido.substring(0, 1000) + '...';
        }
        contenido += '\n\n';
      });
    }
    
    return contenido;
  };

  const generarCuestionario = async (materia: Materia) => {
    setMateriaSeleccionada(materia.emoji + ' ' + materia.nombre);
    setCuestionario('');
    setIsLoading(true);

    try {
      const contenido = prepararContenidoMateria(materia);
      const prompt = 'Basándote en el siguiente contenido de la materia "' + materia.nombre + '", genera un cuestionario de 5 preguntas con opción múltiple (4 opciones cada una) y al final indica las respuestas correctas:\n\n' + contenido + '\n\nFormato:\n1. Pregunta\na) Opción A\nb) Opción B\nc) Opción C\nd) Opción D\n\n(Repite para las 5 preguntas, al final incluye "Respuestas correctas: 1-a, 2-b..." etc)';

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setCuestionario(text);
    } catch (error) {
      console.error('Error:', error);
      setCuestionario('Lo siento, hubo un error al generar el cuestionario. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B39DDB', '#CE93D8', '#E1BEE7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🤖 Generador de Cuestionarios</Text>
        <Text style={styles.headerSubtitle}>Practica con IA basada en tu contenido</Text>
      </LinearGradient>

      {materias.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>No hay materias</Text>
          <Text style={styles.emptySubtitle}>Agrega materias con contenido para generar cuestionarios</Text>
        </View>
      ) : !cuestionario && !isLoading ? (
        <ScrollView style={styles.materiasContainer} contentContainerStyle={styles.materiasContent}>
          <Text style={styles.selectTitle}>Selecciona una materia:</Text>
          <View style={styles.materiasGrid}>
            {materias.map((materia, index) => (
              <Pressable
                key={index}
                style={styles.materiaCard}
                onPress={() => generarCuestionario(materia)}
              >
                <LinearGradient
                  colors={['#B39DDB', '#CE93D8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.materiaGradient}
                >
                  <Text style={styles.materiaEmoji}>{materia.emoji}</Text>
                  <Text style={styles.materiaNombre} numberOfLines={2}>{materia.nombre}</Text>
                  <View style={styles.materiaInfo}>
                    {materia.notas && materia.notas.length > 0 && (
                      <Text style={styles.materiaInfoText}>📝 {materia.notas.length}</Text>
                    )}
                    {materia.archivos && materia.archivos.length > 0 && (
                      <Text style={styles.materiaInfoText}>📄 {materia.archivos.length}</Text>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.cuestionarioContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B39DDB" />
              <Text style={styles.loadingText}>Generando cuestionario...</Text>
              <Text style={styles.loadingSubtext}>Analizando el contenido de {materiaSeleccionada}</Text>
            </View>
          ) : (
            <>
              <View style={styles.cuestionarioHeader}>
                <Text style={styles.cuestionarioMateria}>{materiaSeleccionada}</Text>
                <Pressable 
                  style={styles.nuevoButton}
                  onPress={() => {
                    setCuestionario('');
                    setMateriaSeleccionada('');
                  }}
                >
                  <Text style={styles.nuevoButtonText}>← Volver</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.cuestionarioScroll} contentContainerStyle={styles.cuestionarioContent}>
                <Text style={styles.cuestionarioText}>{cuestionario}</Text>
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
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
    shadowColor: '#B39DDB',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  materiasContainer: {
    flex: 1,
  },
  materiasContent: {
    padding: 20,
  },
  selectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 20,
  },
  materiasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  materiaCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 15,
  },
  materiaGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 150,
  },
  materiaEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  materiaNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  materiaInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  materiaInfoText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cuestionarioContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B39DDB',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  cuestionarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DC',
  },
  cuestionarioMateria: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
    flex: 1,
  },
  nuevoButton: {
    backgroundColor: '#B39DDB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  nuevoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cuestionarioScroll: {
    flex: 1,
  },
  cuestionarioContent: {
    padding: 20,
  },
  cuestionarioText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#161616',
  },
});

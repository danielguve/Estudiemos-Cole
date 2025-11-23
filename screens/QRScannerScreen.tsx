import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

interface Materia {
  nombre: string;
  emoji: string;
  imagenes?: string[];
  archivos?: Array<{uri: string, nombre: string, contenido?: string, tipo?: string, puedeAbrirse?: boolean}>;
  notas?: string[];
  seccionesContenido?: Array<{nombre: string}>;
}

interface QRScannerScreenProps {
  onImportar: (materia: Materia) => void;
  materias: Materia[];
  onCerrar: () => void;
}

export default function QRScannerScreen({
  onImportar,
  materias,
  onCerrar,
}: QRScannerScreenProps) {
  const [scanned, setScanned] = useState(false);
  const [modo, setModo] = useState<'scanner' | 'compartir'>('scanner');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('');
  const [codigoIngresado, setCodigoIngresado] = useState('');

  const handleImportarManual = () => {
    if (!codigoIngresado.trim()) {
      Alert.alert('⚠️ Aviso', 'Ingresa un código primero');
      return;
    }

    try {
      const materiaImportada = JSON.parse(codigoIngresado);
      
      // Validar que tenga la estructura correcta
      if (
        materiaImportada.nombre &&
        materiaImportada.emoji
      ) {
        // Verificar si ya existe
        const existe = materias.some(m => m.nombre === materiaImportada.nombre);
        if (existe) {
          Alert.alert(
            '⚠️ Materia Duplicada',
            `Ya tienes una materia llamada "${materiaImportada.nombre}". ¿Quieres reemplazarla?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Reemplazar',
                onPress: () => {
                  onImportar(materiaImportada);
                  Alert.alert('✅ Éxito', 'Materia importada correctamente');
                  onCerrar();
                },
              },
            ]
          );
        } else {
          onImportar(materiaImportada);
          Alert.alert('✅ Éxito', 'Materia importada correctamente');
          onCerrar();
        }
      } else {
        Alert.alert('❌ Error', 'El código no contiene una materia válida');
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Código inválido. Asegúrate de copiar el código completo.');
    }
  };

  const pegarDesdePortapapeles = async () => {
    const texto = await Clipboard.getStringAsync();
    if (texto) {
      setCodigoIngresado(texto);
      Alert.alert('✅ Pegado', 'Código pegado desde el portapapeles');
    } else {
      Alert.alert('⚠️ Aviso', 'El portapapeles está vacío');
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      const materiaImportada = JSON.parse(data);
      
      // Validar que tenga la estructura correcta
      if (
        materiaImportada.nombre &&
        materiaImportada.emoji
      ) {
        // Verificar si ya existe
        const existe = materias.some(m => m.nombre === materiaImportada.nombre);
        if (existe) {
          Alert.alert(
            '⚠️ Materia Duplicada',
            `Ya tienes una materia llamada "${materiaImportada.nombre}". ¿Quieres reemplazarla?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setScanned(false) },
              {
                text: 'Reemplazar',
                onPress: () => {
                  onImportar(materiaImportada);
                  Alert.alert('✅ Éxito', 'Materia importada correctamente');
                  onCerrar();
                },
              },
            ]
          );
        } else {
          onImportar(materiaImportada);
          Alert.alert('✅ Éxito', 'Materia importada correctamente');
          onCerrar();
        }
      } else {
        Alert.alert('❌ Error', 'El código QR no contiene una materia válida');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo leer el código QR');
      setScanned(false);
    }
  };

  const generarQRData = (materiaIndex: string): string => {
    const index = parseInt(materiaIndex);
    const materia = materias[index];
    if (!materia) return '';

    // Solo compartir datos básicos (sin archivos por seguridad)
    const materiaParaCompartir = {
      nombre: materia.nombre,
      emoji: materia.emoji,
      notas: materia.notas || [],
      imagenes: [], // No compartir imágenes por URIs locales
      archivos: [], // No compartir archivos por URIs locales
    };

    return JSON.stringify(materiaParaCompartir);
  };

  const copiarAlPortapapeles = async () => {
    if (!materiaSeleccionada) {
      Alert.alert('⚠️ Aviso', 'Selecciona una materia primero');
      return;
    }

    const qrData = generarQRData(materiaSeleccionada);
    await Clipboard.setStringAsync(qrData);
    Alert.alert('✅ Copiado', 'Código copiado al portapapeles');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.botonCerrarHeader} onPress={onCerrar}>
          <Text style={styles.textoBotonCerrarHeader}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>
          {modo === 'scanner' ? '📥 Importar Materia' : '📤 Compartir Materia'}
        </Text>
      </LinearGradient>

      {/* Selector de modo */}
      <View style={styles.selectorModo}>
        <TouchableOpacity
          style={[
            styles.botonModo,
            modo === 'scanner' && styles.botonModoActivo,
          ]}
          onPress={() => {
            setModo('scanner');
            setCodigoIngresado('');
          }}
        >
          <Text
            style={[
              styles.textoModo,
              modo === 'scanner' && styles.textoModoActivo,
            ]}
          >
            Importar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.botonModo,
            modo === 'compartir' && styles.botonModoActivo,
          ]}
          onPress={() => setModo('compartir')}
        >
          <Text
            style={[
              styles.textoModo,
              modo === 'compartir' && styles.textoModoActivo,
            ]}
          >
            Compartir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según el modo */}
      {modo === 'scanner' ? (
        <View style={styles.contenidoScanner}>
          <View style={styles.inputContainer}>
            <Text style={styles.labelInput}>
              Pega aquí el código de la materia:
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              value={codigoIngresado}
              onChangeText={setCodigoIngresado}
              placeholder='{"id":"...","nombre":"...","color":"...","notas":"..."}'
              placeholderTextColor="#999"
            />
            <View style={styles.botonesInput}>
              <TouchableOpacity
                style={styles.botonPegar}
                onPress={pegarDesdePortapapeles}
              >
                <Text style={styles.textoBotonPegar}>📋 Pegar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonImportar}
                onPress={handleImportarManual}
              >
                <Text style={styles.textoBotonImportar}>✓ Importar</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.instrucciones}>
            Pide a tu amigo que comparta el código de su materia y pégalo aquí
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.contenidoCompartir}>
          <Text style={styles.subtitulo}>
            Selecciona una materia para generar su código QR:
          </Text>
          {materias.map((materia, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemMateria,
                materiaSeleccionada === index.toString() && styles.itemMateriaSeleccionada,
              ]}
              onPress={() => setMateriaSeleccionada(index.toString())}
            >
              <Text style={styles.emojiMateria}>{materia.emoji}</Text>
              <Text style={styles.nombreMateria}>{materia.nombre}</Text>
              {materiaSeleccionada === index.toString() && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {materiaSeleccionada && (
            <View style={styles.seccionQR}>
              <Text style={styles.tituloQR}>Código QR:</Text>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrTexto}>📱</Text>
                <Text style={styles.qrSubtexto}>
                  {materias[parseInt(materiaSeleccionada)]?.nombre}
                </Text>
                <Text style={styles.qrInfo}>
                  Nota: Los archivos adjuntos no se comparten por seguridad.
                  Solo se compartirán las notas.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.botonCopiar}
                onPress={copiarAlPortapapeles}
              >
                <Text style={styles.textoBotonCopiar}>
                  📋 Copiar código al portapapeles
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  botonCerrarHeader: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonCerrarHeader: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  selectorModo: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  botonModo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  botonModoActivo: {
    backgroundColor: '#667eea',
  },
  textoModo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  textoModoActivo: {
    color: '#fff',
  },
  contenidoScanner: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  labelInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'monospace',
  },
  botonesInput: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  botonPegar: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonPegar: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  botonImportar: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonImportar: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  scanner: {
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  instrucciones: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  botonEscanearOtra: {
    marginTop: 20,
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonEscanear: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contenidoCompartir: {
    flex: 1,
    padding: 20,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  itemMateria: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
  },
  itemMateriaSeleccionada: {
    backgroundColor: '#e8edff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  emojiMateria: {
    fontSize: 24,
    marginRight: 12,
  },
  nombreMateria: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  checkMark: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  seccionQR: {
    marginTop: 30,
  },
  tituloQR: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  qrPlaceholder: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  qrTexto: {
    fontSize: 80,
    marginBottom: 10,
  },
  qrSubtexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 15,
  },
  qrInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  botonCopiar: {
    marginTop: 20,
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonCopiar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textoPermiso: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  botonCerrar: {
    marginTop: 20,
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  textoBotonCerrar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
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
  const [parsedMateria, setParsedMateria] = useState<Materia | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleImportarManual = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!parsedMateria) {
      setErrorMsg('No se detectó una materia válida. Pega el código y espera la validación.');
      return;
    }

    const materiaImportada = parsedMateria;
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
              setSuccessMsg('Materia importada (reemplazada) correctamente');
              onCerrar();
            },
          },
        ]
      );
    } else {
      onImportar(materiaImportada);
      setSuccessMsg('Materia importada correctamente');
      onCerrar();
    }
  };

  const pegarDesdePortapapeles = async () => {
    const texto = await Clipboard.getStringAsync();
    if (texto) {
      setCodigoIngresado(texto);
      setSuccessMsg('Código pegado desde el portapapeles');
    } else {
      setErrorMsg('El portapapeles está vacío');
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
      setErrorMsg('Selecciona una materia primero');
      return;
    }

    const qrData = generarQRData(materiaSeleccionada);
    await Clipboard.setStringAsync(qrData);
    setSuccessMsg('Código copiado al portapapeles');
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
            <Text style={styles.labelInput}>Pega aquí el código de la materia</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              value={codigoIngresado}
              onChangeText={text => setCodigoIngresado(text)}
              placeholder='Ej: {"nombre":"Matemáticas","emoji":"📐","notas":[]} '
              placeholderTextColor="#999"
            />

            <View style={styles.botonesInput}>
              <TouchableOpacity style={styles.botonPegar} onPress={pegarDesdePortapapeles}>
                <Text style={styles.textoBotonPegar}>📋 Pegar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonValidar} onPress={() => {
                setErrorMsg(''); setSuccessMsg('');
                try {
                  const parsed = codigoIngresado ? JSON.parse(codigoIngresado) : null;
                  if (parsed && parsed.nombre && parsed.emoji) {
                    setParsedMateria(parsed);
                    setSuccessMsg('Código válido. Vista previa lista.');
                  } else {
                    setParsedMateria(null);
                    setErrorMsg('El JSON no parece una materia válida (falta nombre o emoji).');
                  }
                } catch (e) {
                  setParsedMateria(null);
                  setErrorMsg('JSON inválido. Revisa el formato.');
                }
              }}>
                <Text style={styles.textoBotonValidar}>🔎 Previsualizar</Text>
              </TouchableOpacity>
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {parsedMateria && (
              <View style={styles.previewCardCompact}>
                <View style={styles.previewLeft}>
                  <Text style={styles.previewEmojiCompact}>{parsedMateria.emoji}</Text>
                </View>
                <View style={styles.previewMiddle}>
                  <Text style={styles.previewNameCompact}>{parsedMateria.nombre}</Text>
                  <Text style={styles.previewMetaCompact}>{(parsedMateria.notas || []).length} notas · {(parsedMateria.imagenes || []).length} imágenes</Text>
                </View>
                <View style={styles.previewRight}>
                  <TouchableOpacity style={styles.smallButton} onPress={handleImportarManual}>
                    <Text style={styles.smallButtonText}>Importar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.instrucciones}>
              Pide a tu amigo que comparta el código JSON y pégalo aquí. También puedes pegar desde el portapapeles.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.contenidoCompartir}>
          <Text style={styles.subtitulo}>Selecciona una materia para generar su código</Text>
          {materias.map((materia, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemMateria,
                materiaSeleccionada === index.toString() && styles.itemMateriaSeleccionada,
              ]}
              onPress={() => setMateriaSeleccionada(index.toString())}
            >
              <View style={styles.avatar}>{materia.emoji}</View>
              <Text style={styles.nombreMateria}>{materia.nombre}</Text>
              {materiaSeleccionada === index.toString() && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          ))}

          {materiaSeleccionada && (
            <View style={styles.seccionQR}>
              <Text style={styles.tituloQR}>Código JSON generado</Text>
              <ScrollView style={styles.codeBox}>
                <Text style={styles.codeText}>{generarQRData(materiaSeleccionada)}</Text>
              </ScrollView>
              <Text style={styles.qrInfo}>Nota: No se comparten archivos ni URIs locales por seguridad.</Text>
              <TouchableOpacity style={styles.botonCopiar} onPress={copiarAlPortapapeles}>
                <Text style={styles.textoBotonCopiar}>📋 Copiar código</Text>
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
  /* textInput moved/updated later to be less dominant */
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
  botonValidar: {
    flex: 1,
    backgroundColor: '#4c51bf',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  textoBotonValidar: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    color: '#b00020',
    marginTop: 10,
    fontSize: 14,
  },
  successText: {
    color: '#1e7e34',
    marginTop: 10,
    fontSize: 14,
  },
  previewCard: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e6e9ff',
  },
  previewEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  previewMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  previewActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  previewButtonOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  previewButtonOutlineText: {
    color: '#667eea',
    fontWeight: '700',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codeBox: {
    backgroundColor: '#0f1724',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    maxHeight: 220,
  },
  codeText: {
    color: '#e6eef8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  /* Compact preview styles */
  previewCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102,126,234,0.06)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  previewLeft: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  previewEmojiCompact: {
    fontSize: 28,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    textAlign: 'center',
    lineHeight: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewMiddle: {
    flex: 1,
  },
  previewNameCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  previewMetaCompact: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  previewRight: {
    marginLeft: 8,
  },
  smallButton: {
    backgroundColor: '#4c51bf',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  /* Input de código menos dominante */
  textInput: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e6e9ff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

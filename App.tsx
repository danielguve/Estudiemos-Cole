import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Pressable, Alert, Image, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatIAScreen from './screens/ChatIAScreen';
import EstudioScreen from './screens/EstudioScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import { auth, db } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('Inicio');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [diasConsecutivos, setDiasConsecutivos] = useState(1);
  const [materias, setMaterias] = useState<Array<{
    nombre: string, 
    emoji: string, 
    imagenes?: string[],
    archivos?: Array<{uri: string, nombre: string, contenido?: string, tipo?: string, puedeAbrirse?: boolean}>,
    notas?: string[],
    seccionesContenido?: Array<{nombre: string}>
  }>>([]);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [emojiSeleccionado, setEmojiSeleccionado] = useState('📚');
  const [materiaExpandida, setMateriaExpandida] = useState<number | null>(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [materiaAbierta, setMateriaAbierta] = useState<number | null>(null);
  const [mostrarAgregarInfo, setMostrarAgregarInfo] = useState(false);
  const [mostrarContenido, setMostrarContenido] = useState(true);
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const [mostrarModalNota, setMostrarModalNota] = useState(false);
  const [textoNota, setTextoNota] = useState('');
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [archivoAmpliado, setArchivoAmpliado] = useState<{contenido: string, nombre: string} | null>(null);
  const [contenidoExpandido, setContenidoExpandido] = useState<number | null>(null);
  const [contenidoActual, setContenidoActual] = useState<number>(0);
  const [mostrarModalNuevoContenido, setMostrarModalNuevoContenido] = useState(false);
  const [nombreNuevoContenido, setNombreNuevoContenido] = useState('');
  const [editandoNombreContenido, setEditandoNombreContenido] = useState<number | null>(null);
  const [nuevoNombreContenido, setNuevoNombreContenido] = useState('');
  const [mostrarQRScanner, setMostrarQRScanner] = useState(false);

  // Estados del temporizador (persistentes entre pestañas)
  const [tiempoEstudio, setTiempoEstudio] = useState(25);
  const [tiempoDescanso, setTiempoDescanso] = useState(5);
  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);
  const [esDescanso, setEsDescanso] = useState(false);
  const [ciclosCompletados, setCiclosCompletados] = useState(0);

  // Estados de música (persistentes entre pestañas)
  const [musicaActiva, setMusicaActiva] = useState(false);
  const [cancionActual, setCancionActual] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Estados de autenticación Supabase
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const emojisDisponibles = ['🧪', '🕊️', '🤓', '👨🏽‍💻', '🌏', '🛠', '❤️', '🧬', '🔭', '📚', '📖', '✏️', '🎨', '🎵', '⚽'];

  // Cargar datos al iniciar la app
  useEffect(() => {
    cargarDatos();
  }, []);

  // Si ya hay sesión activa en Supabase, cargar materias desde DB
  useEffect(() => {
    (async () => {
      try {
        const { data } = await auth.getUser();
        // @ts-ignore
        if (data?.user) {
          setShowWelcome(false);
          setHasRegistered(true);
          await cargarMateriasSupabase();
        }
      } catch (err) {
        // no-op
      }
    })();
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    if (hasRegistered) {
      guardarDatos();
    }
  }, [materias, userName, userAge, diasConsecutivos, hasRegistered]);

  // Efecto para el temporizador (corre en App.tsx para que persista entre pestañas)
  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    
    if (temporizadorActivo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes(prev => prev - 1);
      }, 1000);
    } else if (temporizadorActivo && segundosRestantes === 0) {
      // Cambiar entre estudio y descanso
      if (esDescanso) {
        setCiclosCompletados(prev => prev + 1);
        setEsDescanso(false);
        setSegundosRestantes(tiempoEstudio * 60);
      } else {
        setEsDescanso(true);
        setSegundosRestantes(tiempoDescanso * 60);
      }
    }
    
    return () => clearInterval(intervalo);
  }, [temporizadorActivo, segundosRestantes, esDescanso, tiempoEstudio, tiempoDescanso]);

  const cargarDatos = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      const materiasData = await AsyncStorage.getItem('@materias_data');
      const rachaData = await AsyncStorage.getItem('@racha_data');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.nombre);
        setUserAge(user.edad);
        setHasRegistered(true);
        setShowWelcome(false);
        setShowUserForm(false);
      }
      
      if (materiasData) {
        setMaterias(JSON.parse(materiasData));
      }
      
      if (rachaData) {
        const racha = JSON.parse(rachaData);
        const hoy = new Date().toDateString();
        const ultimoAcceso = new Date(racha.ultimaFecha).toDateString();
        
        if (hoy === ultimoAcceso) {
          setDiasConsecutivos(racha.dias);
        } else {
          const ayer = new Date();
          ayer.setDate(ayer.getDate() - 1);
          const ayerStr = ayer.toDateString();
          
          if (ultimoAcceso === ayerStr) {
            setDiasConsecutivos(racha.dias + 1);
            await AsyncStorage.setItem('@racha_data', JSON.stringify({
              dias: racha.dias + 1,
              ultimaFecha: new Date().toISOString()
            }));
          } else {
            setDiasConsecutivos(1);
            await AsyncStorage.setItem('@racha_data', JSON.stringify({
              dias: 1,
              ultimaFecha: new Date().toISOString()
            }));
          }
        }
      } else {
        await AsyncStorage.setItem('@racha_data', JSON.stringify({
          dias: 1,
          ultimaFecha: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const guardarDatos = async () => {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify({
        nombre: userName,
        edad: userAge
      }));
      
      await AsyncStorage.setItem('@materias_data', JSON.stringify(materias));
      
      await AsyncStorage.setItem('@racha_data', JSON.stringify({
        dias: diasConsecutivos,
        ultimaFecha: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error al guardar datos:', error);
    }
  };

  /* ------------------ Supabase CRUD para Materias/Notas ------------------ */
  const getUserId = async (): Promise<string | null> => {
    try {
      const { data } = await auth.getUser();
      // v2: data.user
      // @ts-ignore
      return data?.user?.id ?? null;
    } catch (err) {
      console.error('Error obteniendo usuario:', err);
      return null;
    }
  };

  const cargarMateriasSupabase = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const { data, error } = await db.from('materias').select('id, nombre, emoji, imagenes, created_at').eq('user_id', userId).order('created_at', { ascending: true });
      if (error) {
        console.error('Error al cargar materias desde Supabase:', error);
        return;
      }

      if (data) {
        // Mapear a la estructura local
        const materiasDesdeDB = data.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          emoji: m.emoji,
          imagenes: m.imagenes || [],
          created_at: m.created_at,
        }));
        setMaterias(materiasDesdeDB as any);
      }
    } catch (err) {
      console.error('Error en cargarMateriasSupabase:', err);
    }
  };

  const crearMateriaSupabase = async (nombre: string, emoji: string) => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('No autenticado');

      const { data, error } = await db.from('materias').insert([{ user_id: userId, nombre, emoji }]).select();
      if (error) {
        console.error('Error al crear materia en Supabase:', error);
        return null;
      }

      return data?.[0] ?? null;
    } catch (err) {
      console.error('crearMateriaSupabase error:', err);
      return null;
    }
  };

  const borrarMateriaSupabase = async (materiaId: string) => {
    try {
      const { error } = await db.from('materias').delete().eq('id', materiaId);
      if (error) console.error('Error borrar materia:', error);
    } catch (err) {
      console.error('borrarMateriaSupabase error:', err);
    }
  };

  const agregarNotaSupabase = async (materiaId: string, contenido: string) => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('No autenticado');

      const { error } = await db.from('notas').insert([{ materia_id: materiaId, user_id: userId, contenido }]);
      if (error) console.error('Error agregando nota:', error);
    } catch (err) {
      console.error('agregarNotaSupabase error:', err);
    }
  };

  const cerrarSesion = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out from Supabase
              await auth.signOut();

              // Clear local data
              await AsyncStorage.clear();
              setUserName('');
              setUserAge('');
              setMaterias([]);
              setDiasConsecutivos(1);
              setHasRegistered(false);
              setShowWelcome(true);
              setActiveTab('Inicio');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          }
        }
      ]
    );
  };

  // Escuchar cambios de sesión (login/logout) y sincronizar
  useEffect(() => {
    const { data } = auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setHasRegistered(true);
        setShowWelcome(false);
        // cargar materias del usuario
        cargarMateriasSupabase();
      } else {
        setHasRegistered(false);
        setShowWelcome(true);
        setMaterias([]);
      }
    });

    return () => {
      try {
        data?.subscription?.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleInscribirMateria = () => {
    if (nuevaMateria.trim()) {
      // Si está autenticado, crear en Supabase y usar el id retornado
      (async () => {
        try {
          const nueva = await crearMateriaSupabase(nuevaMateria.trim(), emojiSeleccionado);
          if (nueva) {
            const nuevasMaterias = [...materias, { id: nueva.id, nombre: nueva.nombre, emoji: nueva.emoji, imagenes: nueva.imagenes || [] }];
            setMaterias(nuevasMaterias as any);
          } else {
            const nuevasMaterias = [...materias, { nombre: nuevaMateria.trim(), emoji: emojiSeleccionado }];
            setMaterias(nuevasMaterias);
          }
        } catch (err) {
          console.error('Error creando materia:', err);
          const nuevasMaterias = [...materias, { nombre: nuevaMateria.trim(), emoji: emojiSeleccionado }];
          setMaterias(nuevasMaterias);
        } finally {
          setNuevaMateria('');
          setEmojiSeleccionado('📚');
          setMostrarEmojis(false);
        }
      })();
    }
  };

  const handleImportarMateria = (materiaImportada: typeof materias[0]) => {
    // Verificar si la materia ya existe
    const existe = materias.some(m => m.nombre === materiaImportada.nombre);
    if (existe) {
      Alert.alert('Advertencia', 'Ya tienes una materia con este nombre');
      return;
    }
    
    const nuevasMaterias = [...materias, materiaImportada];
    setMaterias(nuevasMaterias);
    setMostrarQRScanner(false);
  };

  const handleBorrarMateria = (index: number) => {
    Alert.alert(
      '¿Seguro quieres borrar esta materia?',
      `Se eliminará "${materias[index].nombre}" de tu lista`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            const materia = materias[index] as any;
            if (materia && materia.id) {
              borrarMateriaSupabase(materia.id);
            }
            const nuevasMaterias = materias.filter((_, i) => i !== index);
            setMaterias(nuevasMaterias);
            setMateriaExpandida(null);
          }
        }
      ]
    );
  };

  const handleToggleMateria = (index: number) => {
    setMateriaExpandida(materiaExpandida === index ? null : index);
  };

  const handleAbrirMateria = (index: number) => {
    setMateriaAbierta(index);
    setMateriaExpandida(null);
  };

  const handleCerrarMateria = () => {
    setMateriaAbierta(null);
    setMostrarAgregarInfo(false);
  };

  const handleSeleccionarImagen = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos permiso para acceder a tu galería de fotos'
      );
      return;
    }

    // Abrir galería permitiendo múltiples selecciones
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && materiaAbierta !== null) {
      const nuevasImagenes = result.assets.map((asset: any) => asset.uri);
      const materiasActualizadas = [...materias];
      const imagenesExistentes = materiasActualizadas[materiaAbierta].imagenes || [];
      materiasActualizadas[materiaAbierta].imagenes = [...imagenesExistentes, ...nuevasImagenes];
      setMaterias(materiasActualizadas);
    }
  };

  const handleSeleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled && materiaAbierta !== null) {
        const nuevosArchivos = await Promise.all(
          result.assets.map(async (asset: any) => {
            let contenido = '';
            let tipo = asset.mimeType || '';
            let puedeAbrirse = false;
            
            try {
              // Archivos de texto plano
              if (tipo.includes('text') || 
                  asset.name.endsWith('.txt') || 
                  asset.name.endsWith('.md') ||
                  asset.name.endsWith('.json') ||
                  asset.name.endsWith('.csv') ||
                  asset.name.endsWith('.html') ||
                  asset.name.endsWith('.xml') ||
                  asset.name.endsWith('.js') ||
                  asset.name.endsWith('.jsx') ||
                  asset.name.endsWith('.ts') ||
                  asset.name.endsWith('.tsx') ||
                  asset.name.endsWith('.css')) {
                contenido = await FileSystem.readAsStringAsync(asset.uri);
                puedeAbrirse = false;
              } 
              // Archivos Word, PDF y otros que se abren externamente
              else {
                let tipoArchivo = 'desconocido';
                if (asset.name.endsWith('.docx')) tipoArchivo = 'Word';
                else if (asset.name.endsWith('.pdf')) tipoArchivo = 'PDF';
                else if (asset.name.endsWith('.xlsx') || asset.name.endsWith('.xls')) tipoArchivo = 'Excel';
                else if (asset.name.endsWith('.pptx') || asset.name.endsWith('.ppt')) tipoArchivo = 'PowerPoint';
                
                contenido = `📄 Archivo ${tipoArchivo}\n\nPresiona "👁️ Ver Archivo" para abrirlo con la aplicación correspondiente.`;
                puedeAbrirse = true;
              }
            } catch (err) {
              contenido = `❌ Error al leer el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`;
              puedeAbrirse = false;
            }
            
            return {
              uri: asset.uri,
              nombre: asset.name,
              contenido: contenido,
              tipo: tipo,
              puedeAbrirse: puedeAbrirse
            };
          })
        );
        
        const materiasActualizadas = [...materias];
        const archivosExistentes = materiasActualizadas[materiaAbierta].archivos || [];
        materiasActualizadas[materiaAbierta].archivos = [...archivosExistentes, ...nuevosArchivos];
        setMaterias(materiasActualizadas);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleEliminarImagen = (indexImagen: number) => {
    if (materiaAbierta === null) return;
    
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const materiasActualizadas = [...materias];
            const imagenesActuales = materiasActualizadas[materiaAbierta].imagenes || [];
            materiasActualizadas[materiaAbierta].imagenes = imagenesActuales.filter((_, i) => i !== indexImagen);
            setMaterias(materiasActualizadas);
          }
        }
      ]
    );
  };

  const handleEliminarArchivo = (indexArchivo: number) => {
    if (materiaAbierta === null) return;
    
    Alert.alert(
      'Eliminar archivo',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const materiasActualizadas = [...materias];
            const archivosActuales = materiasActualizadas[materiaAbierta].archivos || [];
            materiasActualizadas[materiaAbierta].archivos = archivosActuales.filter((_, i) => i !== indexArchivo);
            setMaterias(materiasActualizadas);
          }
        }
      ]
    );
  };

  const handleAgregarNota = () => {
    if (materiaAbierta === null || !textoNota.trim()) return;

    const materia = materias[materiaAbierta] as any;
    // Si la materia viene de la DB (tiene id), subir la nota a Supabase
    if (materia && materia.id) {
      agregarNotaSupabase(materia.id, textoNota.trim());
    }

    const materiasActualizadas = [...materias];
    const notasExistentes = materiasActualizadas[materiaAbierta].notas || [];
    materiasActualizadas[materiaAbierta].notas = [...notasExistentes, textoNota.trim()];
    setMaterias(materiasActualizadas);
    setTextoNota('');
    setMostrarModalNota(false);
  };

  const handleEliminarNota = (indexNota: number) => {
    if (materiaAbierta === null) return;
    
    Alert.alert(
      'Eliminar nota',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const materiasActualizadas = [...materias];
            const notasActuales = materiasActualizadas[materiaAbierta].notas || [];
            materiasActualizadas[materiaAbierta].notas = notasActuales.filter((_, i) => i !== indexNota);
            setMaterias(materiasActualizadas);
          }
        }
      ]
    );
  };

  const handleAbrirArchivo = async (uri: string, nombre: string) => {
    try {
      // Verificar si la función de compartir está disponible
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Usar expo-sharing para abrir el archivo con aplicaciones externas
        await Sharing.shareAsync(uri, {
          mimeType: 'application/octet-stream',
          dialogTitle: `Abrir ${nombre}`,
          UTI: 'public.item'
        });
      } else {
        Alert.alert(
          'No disponible',
          'La función de compartir no está disponible en este dispositivo',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `No se pudo abrir el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleStart = () => {
    setShowWelcome(false);
    // Si ya se registró antes, no mostrar el formulario
    if (hasRegistered) {
      setShowUserForm(false);
    } else {
      setShowUserForm(true);
    }
  };

  // Funciones de autenticación Supabase
  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !userName.trim() || !userAge.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert('Error en registro', error.message);
      } else {
        Alert.alert('Éxito', 'Cuenta creada. Por favor inicia sesión.');
        setAuthMode('login');
        setPassword('');
      }
    } catch (err) {
      Alert.alert('Error', 'Algo salió mal al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa email y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setShowUserForm(false);
        setHasRegistered(true);
        setEmail('');
        setPassword('');
        // Cargar materias desde Supabase al iniciar sesión
        cargarMateriasSupabase();
      }
    } catch (err) {
      Alert.alert('Error', 'Algo salió mal al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitUserInfo = () => {
    if (authMode === 'login') {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  // Pantalla de bienvenida
  if (showWelcome) {
    return (
      <SafeAreaView style={styles.welcomeContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeQuote}>
            "La educación es el arma más poderosa que puedes usar para cambiar el mundo."
          </Text>
          <Text style={styles.welcomeAuthor}>— Nelson Mandela</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Empezar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Formulario de usuario
  if (showUserForm) {
    return (
      <SafeAreaView style={styles.formContainer}>
        <StatusBar barStyle="dark-content" />
        <ScrollView style={styles.formContent}>
          <Text style={styles.formTitle}>
            {authMode === 'login' ? '👋 Bienvenido' : '📝 Crear cuenta'}
          </Text>
          <Text style={styles.formSubtitle}>
            {authMode === 'login' ? 'Inicia sesión en tu cuenta' : 'Únete a Estudiemos'}
          </Text>
          
          {authMode === 'signup' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                value={userName}
                onChangeText={setUserName}
              />
              <TextInput
                style={styles.input}
                placeholder="Tu edad"
                value={userAge}
                onChangeText={setUserAge}
                keyboardType="numeric"
              />
            </>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Pressable 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
            onPress={handleSubmitUserInfo}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar sesión' : 'Registrarse')}
            </Text>
          </Pressable>

          <Pressable onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.toggleAuthText}>
              {authMode === 'login' 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    // Si hay una materia abierta, mostrar su pantalla
    if (materiaAbierta !== null && activeTab === 'Mis Materias') {
      const materia = materias[materiaAbierta];
      return (
        <View style={styles.materiaDetalleScreen}>
          {/* Header */}
          <View style={styles.headerDetalle}>
            <Pressable onPress={handleCerrarMateria} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </Pressable>
            <Text style={styles.tituloDetalle}>{materia.emoji} {materia.nombre}</Text>
          </View>

          <View style={styles.detalleContent}>
            {/* Sección de agregar información */}
            <View style={styles.agregarInfoContainer}>
              <Pressable 
                style={styles.agregarInfoHeader}
                onPress={() => setMostrarAgregarInfo(!mostrarAgregarInfo)}
              >
                <Text style={styles.agregarInfoTitulo}>📎 Agregar Información</Text>
                <Text style={styles.expandIconDetalle}>{mostrarAgregarInfo ? '▲' : '▼'}</Text>
              </Pressable>
              
              {mostrarAgregarInfo && (
                <View style={styles.opcionesContainer}>
                  <Pressable style={styles.opcionAgregar} onPress={handleSeleccionarImagen}>
                    <Text style={styles.opcionIcon}>🖼️</Text>
                    <Text style={styles.opcionTexto}>Agregar imagen desde galería</Text>
                  </Pressable>

                  <Pressable style={styles.opcionAgregar} onPress={handleSeleccionarArchivo}>
                    <Text style={styles.opcionIcon}>📄</Text>
                    <Text style={styles.opcionTexto}>Agregar archivo</Text>
                  </Pressable>

                  <Pressable style={styles.opcionAgregar} onPress={() => setMostrarModalNota(true)}>
                    <Text style={styles.opcionIcon}>✏️</Text>
                    <Text style={styles.opcionTexto}>Agregar nota de texto</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Sección de Contenido */}
            <View style={styles.contenidoContainer}>
              <Pressable 
                style={styles.contenidoHeader}
                onPress={() => setMostrarContenido(!mostrarContenido)}
              >
                {editandoNombreContenido === 0 ? (
                  <TextInput
                    style={styles.contenidoTituloInput}
                    value={nuevoNombreContenido}
                    onChangeText={setNuevoNombreContenido}
                    onBlur={() => {
                      if (nuevoNombreContenido.trim() && materiaAbierta !== null) {
                        const materiasActualizadas = [...materias];
                        if (!materiasActualizadas[materiaAbierta].seccionesContenido) {
                          materiasActualizadas[materiaAbierta].seccionesContenido = [{nombre: 'Contenido'}];
                        }
                        materiasActualizadas[materiaAbierta].seccionesContenido![0].nombre = nuevoNombreContenido.trim();
                        setMaterias(materiasActualizadas);
                      }
                      setEditandoNombreContenido(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.contenidoTitulo}>
                    {materia.seccionesContenido && materia.seccionesContenido[0] ? 
                      materia.seccionesContenido[0].nombre : '📚 Contenido'}
                  </Text>
                )}
                <View style={styles.contenidoHeaderBotones}>
                  <Pressable 
                    onPress={(e) => {
                      e.stopPropagation();
                      if (materiaAbierta !== null) {
                        const materiasActualizadas = [...materias];
                        if (!materiasActualizadas[materiaAbierta].seccionesContenido) {
                          materiasActualizadas[materiaAbierta].seccionesContenido = [{nombre: 'Contenido'}];
                        }
                        setNuevoNombreContenido(materiasActualizadas[materiaAbierta].seccionesContenido![0].nombre);
                        setEditandoNombreContenido(0);
                      }
                    }}
                  >
                    <Text style={styles.editarNombreIcon}>✏️</Text>
                  </Pressable>
                  <Text style={styles.expandIconContenido}>{mostrarContenido ? '▼' : '▶'}</Text>
                </View>
              </Pressable>
              
              {mostrarContenido && (
              <ScrollView style={styles.contenidoScroll}>
                {(!materia.imagenes || materia.imagenes.length === 0) && 
                 (!materia.archivos || materia.archivos.length === 0) && 
                 (!materia.notas || materia.notas.length === 0) ? (
                  <View style={styles.contenidoVacioContainer}>
                    <Text style={styles.contenidoVacio}>No hay contenido aún</Text>
                    <Text style={styles.contenidoSubtitulo}>Agrega imágenes, archivos o notas para comenzar</Text>
                  </View>
                ) : (
                  <View>
                    {/* Imágenes */}
                    {materia.imagenes && materia.imagenes.length > 0 && (
                      <View style={styles.seccionContenido}>
                        <View style={styles.imagenesGrid}>
                          {materia.imagenes.map((uri, index) => (
                            <View key={index} style={styles.imagenWrapper}>
                              <Pressable 
                                style={styles.imagenContainer}
                                onPress={() => setImagenAmpliada(uri)}
                              >
                                <Image source={{ uri }} style={styles.imagen} />
                              </Pressable>
                              <Pressable 
                                style={styles.eliminarImagenButton}
                                onPress={() => handleEliminarImagen(index)}
                              >
                                <Text style={styles.eliminarButtonText}>✕</Text>
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Archivos */}
                    {materia.archivos && materia.archivos.length > 0 && (
                      <View style={styles.seccionContenido}>
                        {materia.archivos.map((archivo, index) => (
                          <View key={index} style={styles.archivoContenedorCompleto}>
                            <View style={styles.archivoHeader}>
                              <Text style={styles.archivoIcon}>📎</Text>
                              <Text style={styles.archivoNombre} numberOfLines={1}>{archivo.nombre}</Text>
                              <View style={styles.archivoHeaderBotones}>
                                {archivo.puedeAbrirse && (
                                  <Pressable 
                                    style={styles.verArchivoButton}
                                    onPress={() => handleAbrirArchivo(archivo.uri, archivo.nombre)}
                                  >
                                    <Text style={styles.verArchivoButtonText}>👁️ Ver</Text>
                                  </Pressable>
                                )}
                                <Pressable 
                                  style={styles.eliminarArchivoButton}
                                  onPress={() => handleEliminarArchivo(index)}
                                >
                                  <Text style={styles.eliminarButtonText}>✕</Text>
                                </Pressable>
                              </View>
                            </View>
                            {archivo.contenido && !archivo.puedeAbrirse && (
                              <Pressable 
                                style={styles.archivoContenido}
                                onPress={() => setArchivoAmpliado({contenido: archivo.contenido!, nombre: archivo.nombre})}
                              >
                                <Text style={styles.archivoTexto} numberOfLines={5}>{archivo.contenido}</Text>
                                <Text style={styles.clickParaAmpliar}>Toca para ampliar</Text>
                              </Pressable>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  
                    {/* Notas */}
                    {materia.notas && materia.notas.length > 0 && (
                      <View style={styles.seccionContenido}>
                        {materia.notas.map((nota, index) => (
                          <View key={index} style={styles.notaContainer}>
                            <Pressable 
                              style={styles.eliminarNotaButton}
                              onPress={() => handleEliminarNota(index)}
                            >
                              <Text style={styles.eliminarButtonText}>✕</Text>
                            </Pressable>
                            <View style={styles.notaContenido}>
                              <Text style={styles.notaTexto}>{nota}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
              )}
            </View>

            {/* Modal para agregar nota */}
            {mostrarModalNota && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitulo}>✏️ Nueva Nota</Text>
                    <Pressable onPress={() => {
                      setMostrarModalNota(false);
                      setTextoNota('');
                    }}>
                      <Text style={styles.modalCerrar}>✕</Text>
                    </Pressable>
                  </View>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Escribe o pega tu nota aquí..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={10}
                    value={textoNota}
                    onChangeText={setTextoNota}
                    textAlignVertical="top"
                  />
                  
                  <View style={styles.modalBotones}>
                    <Pressable 
                      style={styles.modalBotonCancelar}
                      onPress={() => {
                        setMostrarModalNota(false);
                        setTextoNota('');
                      }}
                    >
                      <Text style={styles.modalBotonTexto}>Cancelar</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={[styles.modalBotonGuardar, !textoNota.trim() && styles.modalBotonDeshabilitado]}
                      onPress={handleAgregarNota}
                      disabled={!textoNota.trim()}
                    >
                      <Text style={styles.modalBotonTextoGuardar}>Guardar Nota</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Modal para ver imagen ampliada */}
            {imagenAmpliada && (
              <View style={styles.modalVisor}>
                <Pressable 
                  style={styles.cerrarVisorButton}
                  onPress={() => setImagenAmpliada(null)}
                >
                  <Text style={styles.cerrarVisorText}>✕ Cerrar</Text>
                </Pressable>
                <ScrollView 
                  style={styles.visorScrollView}
                  contentContainerStyle={styles.visorScrollContent}
                  minimumZoomScale={1}
                  maximumZoomScale={5}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                >
                  <Image 
                    source={{ uri: imagenAmpliada }} 
                    style={styles.imagenAmpliada}
                    resizeMode="contain"
                  />
                </ScrollView>
              </View>
            )}

            {/* Modal para ver archivo ampliado */}
            {archivoAmpliado && (
              <View style={styles.modalVisor}>
                <View style={styles.visorHeader}>
                  <Text style={styles.visorTitulo} numberOfLines={1}>{archivoAmpliado.nombre}</Text>
                  <Pressable 
                    style={styles.cerrarVisorButton}
                    onPress={() => setArchivoAmpliado(null)}
                  >
                    <Text style={styles.cerrarVisorText}>✕</Text>
                  </Pressable>
                </View>
                <ScrollView style={styles.visorArchivoScroll}>
                  <Text style={styles.archivoTextoAmpliado}>{archivoAmpliado.contenido}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      );
    }

    switch (activeTab) {
      case 'Inicio':
        return (
          <View style={styles.inicioScreen}>
            <LinearGradient
              colors={['#F77F00', '#FECB62', '#FFE5B4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.inicioHeader}
            >
              <View style={styles.saludoContainer}>
                <Text style={styles.saludoTexto}>¡Hola, {userName}!</Text>
              </View>
              <View style={styles.perfilContainer}>
                <Pressable 
                  style={styles.circuloPerfil}
                  onPress={() => setActiveTab('Perfil')}
                >
                  <Text style={styles.inicialPerfil}>{userName.charAt(0).toUpperCase()}</Text>
                </Pressable>
                <View style={styles.rachaContainer}>
                  <View style={styles.rachaNumeroContainer}>
                    <Text style={styles.rachaNumero}>{diasConsecutivos}</Text>
                    <Text style={styles.rachaDias}>🔥</Text>
                  </View>
                  <Text style={styles.rachaTexto}>días</Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.inicioContent}>
              <Pressable 
                style={styles.cursosBox}
                onPress={() => setActiveTab('Mis Materias')}
              >
                <View style={styles.cursosBoxContent}>
                  <View style={styles.cursosInfo}>
                    <Text style={styles.cursosEmoji}>📚</Text>
                    <View style={styles.cursosTexto}>
                      <Text style={styles.cursosTitle}>Mis Cursos</Text>
                      <Text style={styles.cursosSubtitle}>{materias.length} {materias.length === 1 ? 'materia' : 'materias'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cursosFlecha}>→</Text>
                </View>
              </Pressable>

              {materias.length > 0 && (
                <View style={styles.recomendadosContainer}>
                  <Text style={styles.recomendadosTitle}>Recomendados</Text>
                  <View style={styles.recomendadosGrid}>
                    {materias.slice(0, 4).map((materia, index) => (
                      <Pressable 
                        key={index}
                        style={styles.recomendadoCard}
                        onPress={() => {
                          setMateriaAbierta(index);
                          setActiveTab('Mis Materias');
                        }}
                      >
                        <Text style={styles.recomendadoEmoji}>{materia.emoji}</Text>
                        <Text style={styles.recomendadoNombre} numberOfLines={1}>{materia.nombre}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <Pressable onPress={() => setActiveTab('Estudiemos')}>
                <LinearGradient
                  colors={['#A8D5BA', '#C8E6C9', '#E8F5E9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.estudiosBox}
                >
                  <View style={styles.cursosBoxContent}>
                    <View style={styles.cursosInfo}>
                      <Text style={styles.cursosEmoji}>✏️</Text>
                      <View style={styles.cursosTexto}>
                        <Text style={styles.cursosTitle}>Estudiemos</Text>
                        <Text style={styles.cursosSubtitle}>Recursos y ejercicios</Text>
                      </View>
                    </View>
                    <Text style={styles.cursosFlecha}>→</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => setMostrarQRScanner(true)}>
                <LinearGradient
                  colors={['#9C27B0', '#BA68C8', '#E1BEE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.estudiosBox}
                >
                  <View style={styles.cursosBoxContent}>
                    <View style={styles.cursosInfo}>
                      <Text style={styles.cursosEmoji}>📱</Text>
                      <View style={styles.cursosTexto}>
                        <Text style={styles.cursosTitle}>Compartir Materias</Text>
                        <Text style={styles.cursosSubtitle}>Escanear QR o compartir</Text>
                      </View>
                    </View>
                    <Text style={styles.cursosFlecha}>→</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        );
      case 'Mis Materias':
        return (
          <View style={styles.materiasScreen}>
            <Text style={styles.title}>Mis Materias</Text>
            
            {/* Bloque para inscribir materias */}
            <View style={styles.inscribirContainer}>
              <TextInput
                style={styles.materiaInput}
                placeholder="Nombre de la materia"
                value={nuevaMateria}
                onChangeText={setNuevaMateria}
              />
              
              <Pressable 
                style={styles.selectorEmojiButton} 
                onPress={() => setMostrarEmojis(!mostrarEmojis)}
              >
                <Text style={styles.selectorEmojiButtonText}>
                  {emojiSeleccionado} Seleccionar emoji {mostrarEmojis ? '▲' : '▼'}
                </Text>
              </Pressable>

              {mostrarEmojis && (
                <View style={styles.emojiSelector}>
                  {emojisDisponibles.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        emojiSeleccionado === emoji && styles.emojiOptionSelected
                      ]}
                      onPress={() => {
                        setEmojiSeleccionado(emoji);
                        setMostrarEmojis(false);
                      }}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              
              <Pressable style={styles.inscribirButton} onPress={handleInscribirMateria}>
                <Text style={styles.inscribirButtonText}>Inscribir Materia</Text>
              </Pressable>
            </View>

            {/* Lista de materias inscritas */}
            <View style={styles.materiasListContainer}>
              {materias.length === 0 ? (
                <Text style={styles.noMateriasText}>No tienes materias inscritas</Text>
              ) : (
                materias.map((materia, index) => (
                  <View key={index}>
                    <Pressable 
                      style={styles.materiaItem}
                      onPress={() => handleToggleMateria(index)}
                    >
                      <Text style={styles.materiaText}>{materia.emoji} {materia.nombre}</Text>
                      <Text style={styles.expandIcon}>{materiaExpandida === index ? '▼' : '▶'}</Text>
                    </Pressable>
                    
                    {materiaExpandida === index && (
                      <View style={styles.botonesContainer}>
                        <Pressable 
                          style={styles.abrirButton} 
                          onPress={() => handleAbrirMateria(index)}
                        >
                          <Text style={styles.abrirButtonText}>📂 Abrir</Text>
                        </Pressable>
                        
                        <Pressable 
                          style={styles.borrarButton} 
                          onPress={() => handleBorrarMateria(index)}
                        >
                          <Text style={styles.borrarButtonText}>🗑️ Borrar</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        );
      case 'Chat IA':
        return <ChatIAScreen materias={materias} />;
      case 'Estudiemos':
        return <EstudioScreen 
          tiempoEstudio={tiempoEstudio}
          setTiempoEstudio={setTiempoEstudio}
          tiempoDescanso={tiempoDescanso}
          setTiempoDescanso={setTiempoDescanso}
          segundosRestantes={segundosRestantes}
          setSegundosRestantes={setSegundosRestantes}
          temporizadorActivo={temporizadorActivo}
          setTemporizadorActivo={setTemporizadorActivo}
          esDescanso={esDescanso}
          setEsDescanso={setEsDescanso}
          ciclosCompletados={ciclosCompletados}
          setCiclosCompletados={setCiclosCompletados}
          musicaActiva={musicaActiva}
          setMusicaActiva={setMusicaActiva}
          cancionActual={cancionActual}
          setCancionActual={setCancionActual}
          soundRef={soundRef}
        />;
      case 'Perfil':
        return (
          <View style={styles.perfilScreen}>
            <LinearGradient
              colors={['#F77F00', '#FECB62', '#FFE5B4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.perfilHeader}
            >
              <View style={styles.perfilCirculo}>
                <Text style={styles.perfilInicial}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.perfilNombre}>{userName}</Text>
              <Text style={styles.perfilEdad}>{userAge} años</Text>
            </LinearGradient>

            <View style={styles.perfilContent}>
              <View style={styles.perfilSeccion}>
                <Pressable 
                  style={styles.perfilSeccionHeader}
                  onPress={() => setMostrarEditarPerfil(!mostrarEditarPerfil)}
                >
                  <Text style={styles.perfilSeccionTitulo}>Editar Perfil</Text>
                  <Text style={styles.expandIconDetalle}>{mostrarEditarPerfil ? '▼' : '▶'}</Text>
                </Pressable>
                
                {mostrarEditarPerfil && (
                  <>
                    <Pressable style={styles.perfilOpcion}>
                      <LinearGradient
                        colors={['#E8F5E9', '#F0F8F0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.perfilOpcionGradient}
                      >
                        <View style={styles.perfilOpcionContent}>
                          <Text style={styles.perfilOpcionIcon}>👤</Text>
                          <View style={styles.perfilOpcionTexto}>
                            <Text style={styles.perfilOpcionTitulo}>Cambiar nombre</Text>
                            <Text style={styles.perfilOpcionSubtitulo}>Actualiza tu nombre</Text>
                          </View>
                        </View>
                        <Text style={styles.perfilOpcionFlecha}>›</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.perfilOpcion}>
                      <LinearGradient
                        colors={['#E8F5E9', '#F0F8F0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.perfilOpcionGradient}
                      >
                        <View style={styles.perfilOpcionContent}>
                          <Text style={styles.perfilOpcionIcon}>🎂</Text>
                          <View style={styles.perfilOpcionTexto}>
                            <Text style={styles.perfilOpcionTitulo}>Cambiar edad</Text>
                            <Text style={styles.perfilOpcionSubtitulo}>Actualiza tu edad</Text>
                          </View>
                        </View>
                        <Text style={styles.perfilOpcionFlecha}>›</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.perfilOpcion}>
                      <LinearGradient
                        colors={['#E8F5E9', '#F0F8F0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.perfilOpcionGradient}
                      >
                        <View style={styles.perfilOpcionContent}>
                          <Text style={styles.perfilOpcionIcon}>📷</Text>
                          <View style={styles.perfilOpcionTexto}>
                            <Text style={styles.perfilOpcionTitulo}>Cambiar foto de perfil</Text>
                            <Text style={styles.perfilOpcionSubtitulo}>Próximamente</Text>
                          </View>
                        </View>
                        <Text style={styles.perfilOpcionFlecha}>›</Text>
                      </LinearGradient>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.perfilSeccion}>
                <Pressable style={styles.premiumBox}>
                  <View style={styles.premiumContent}>
                    <View style={styles.premiumTextos}>
                      <Text style={styles.premiumBadge}>⭐ Premium</Text>
                      <Text style={styles.premiumTitulo}>Cámbiate a Premium</Text>
                      <Text style={styles.premiumSubtitulo}>Desbloquea todas las funciones</Text>
                    </View>
                    <Text style={styles.premiumFlecha}>→</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.perfilSeccion}>
                <Pressable style={styles.cerrarSesionButton} onPress={cerrarSesion}>
                  <Text style={styles.cerrarSesionIcon}>🚪</Text>
                  <Text style={styles.cerrarSesionTexto}>Cerrar Sesión</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Contenido principal */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Modal QR Scanner */}
      {mostrarQRScanner && (
        <View style={styles.modalQRContainer}>
          <QRScannerScreen
            materias={materias}
            onImportar={handleImportarMateria}
            onCerrar={() => setMostrarQRScanner(false)}
          />
        </View>
      )}

      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('Inicio')}
        >
          <Text style={styles.tabIcon}>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('Mis Materias')}
        >
          <Text style={styles.tabIcon}>📚</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('Estudiemos')}
        >
          <Text style={styles.tabIcon}>📖</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('Chat IA')}
        >
          <Text style={styles.tabIcon}>💬</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('Perfil')}
        >
          <Text style={styles.tabIcon}>👤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F3',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF9F3',
  },
  materiasScreen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingTop: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  inicioScreen: {
    flex: 1,
    backgroundColor: '#FEF9F3',
  },
  inicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saludoContainer: {
    flex: 1,
  },
  saludoTexto: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  perfilContainer: {
    alignItems: 'center',
  },
  circuloPerfil: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FECB62',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#FECB62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inicialPerfil: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#161616',
  },
  rachaContainer: {
    alignItems: 'center',
  },
  rachaNumeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rachaNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
  },
  rachaTexto: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  rachaDias: {
    fontSize: 16,
  },
  inicioContent: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  cursosBox: {
    backgroundColor: '#FFE5CC',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cursosBoxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cursosInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cursosEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  cursosTexto: {
    flex: 1,
  },
  cursosTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 4,
  },
  cursosSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  cursosFlecha: {
    fontSize: 32,
    color: '#F77F00',
    fontWeight: 'bold',
  },
  estudiosBox: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginTop: 15,
    shadowColor: '#A8D5BA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  recomendadosContainer: {
    marginTop: 25,
    width: '100%',
  },
  recomendadosTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 15,
  },
  recomendadosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  recomendadoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recomendadoEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  recomendadoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161616',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0E8DC',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  activeTabLabel: {
    color: '#F77F00',
    fontWeight: 'bold',
  },
  // Estilos de pantalla de bienvenida
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#F77F00',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  welcomeQuote: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 40,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  welcomeAuthor: {
    fontSize: 20,
    color: '#FEF9F3',
    fontWeight: '600',
    marginBottom: 50,
    letterSpacing: 1,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F77F00',
  },
  // Estilos de formulario
  formContainer: {
    flex: 1,
    backgroundColor: '#FECB62',
  },
  formContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 10,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#3D3D3D',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F0E8DC',
  },
  submitButton: {
    backgroundColor: '#F77F00',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  toggleAuthText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Estilos de Mis Materias
  inscribirContainer: {
    width: '90%',
    backgroundColor: '#FFEEDD',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 10,
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  emojiOption: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F0E8DC',
    backgroundColor: '#FEF9F3',
  },
  emojiOptionSelected: {
    borderColor: '#F77F00',
    backgroundColor: '#FFF4E6',
  },
  emojiText: {
    fontSize: 24,
  },
  materiaInput: {
    backgroundColor: '#FEF9F3',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  selectorEmojiButton: {
    backgroundColor: '#FEF9F3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0E8DC',
    alignItems: 'center',
  },
  selectorEmojiButtonText: {
    fontSize: 14,
    color: '#161616',
    fontWeight: '500',
  },
  inscribirButton: {
    backgroundColor: '#F77F00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  inscribirButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  materiasListContainer: {
    width: '90%',
    flex: 1,
  },
  noMateriasText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  materiaItem: {
    backgroundColor: '#FFD4A3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materiaText: {
    fontSize: 16,
    color: '#161616',
    fontWeight: '500',
    flex: 1,
  },
  expandIcon: {
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 10,
  },
  botonesContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF9F3',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  abrirButton: {
    flex: 1,
    backgroundColor: '#F77F00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  abrirButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  borrarButton: {
    flex: 1,
    backgroundColor: '#E63946',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  borrarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Estilos de pantalla de detalle de materia
  materiaDetalleScreen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  headerDetalle: {
    backgroundColor: '#fff',
    padding: 15,
    paddingTop: 50,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F77F00',
    fontWeight: '600',
  },
  tituloDetalle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#161616',
  },
  detalleContent: {
    flex: 1,
    paddingTop: 20,
  },
  agregarInfoContainer: {
    backgroundColor: '#D4EDDA',
    margin: 15,
    marginTop: 0,
    borderRadius: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  agregarInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  agregarInfoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
  },
  expandIconDetalle: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  opcionesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  opcionAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8D5BA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  opcionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  opcionTexto: {
    fontSize: 16,
    color: '#161616',
    fontWeight: '500',
  },
  contenidoContainer: {
    flex: 1,
    backgroundColor: '#CCEAF7',
    margin: 15,
    marginTop: 0,
    borderRadius: 15,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  contenidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#99D5ED',
  },
  contenidoHeaderBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contenidoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
    flex: 1,
  },
  contenidoTituloInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#F77F00',
    padding: 0,
  },
  editarNombreIcon: {
    fontSize: 16,
  },
  expandIconContenido: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  contenidoScroll: {
    flex: 1,
    padding: 15,
  },
  contenidoVacioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  contenidoVacio: {
    fontSize: 18,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  contenidoSubtitulo: {
    fontSize: 14,
    color: '#D0D0D0',
    textAlign: 'center',
  },
  seccionContenido: {
    marginBottom: 20,
  },
  subtituloSeccion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 10,
  },
  imagenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagenContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  imagen: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  archivoContenedorCompleto: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  archivoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E0E0E0',
  },
  archivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  archivoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  archivoNombre: {
    fontSize: 14,
    color: '#161616',
    flex: 1,
    fontWeight: '600',
  },
  archivoContenido: {
    padding: 15,
    backgroundColor: '#fff',
  },
  archivoTexto: {
    fontSize: 14,
    color: '#161616',
    lineHeight: 20,
  },
  imagenWrapper: {
    width: '48%',
    marginBottom: 15,
    position: 'relative',
  },
  eliminarImagenButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#E63946',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  eliminarArchivoButton: {
    backgroundColor: '#E63946',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  archivoHeaderBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verArchivoButton: {
    backgroundColor: '#F77F00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verArchivoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eliminarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notaContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    overflow: 'hidden',
    position: 'relative',
  },
  eliminarNotaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E63946',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFEF0',
  },
  notaNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161616',
  },
  notaContenido: {
    padding: 15,
    paddingTop: 35,
    backgroundColor: '#fff',
  },
  notaTexto: {
    fontSize: 14,
    color: '#161616',
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DC',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
  },
  modalCerrar: {
    fontSize: 24,
    color: '#A0A0A0',
    fontWeight: 'bold',
  },
  modalInput: {
    minHeight: 200,
    maxHeight: 400,
    padding: 20,
    fontSize: 16,
    color: '#161616',
    backgroundColor: '#FEF9F3',
  },
  modalBotones: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DC',
  },
  modalBotonCancelar: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F0E8DC',
    alignItems: 'center',
  },
  modalBotonGuardar: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F77F00',
    alignItems: 'center',
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBotonDeshabilitado: {
    backgroundColor: '#D0D0D0',
  },
  modalBotonTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  modalBotonTextoGuardar: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  clickParaAmpliar: {
    fontSize: 12,
    color: '#F77F00',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalVisor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  cerrarVisorButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1001,
  },
  cerrarVisorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  visorScrollView: {
    flex: 1,
  },
  visorScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagenAmpliada: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  visorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  visorTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
    flex: 1,
    marginRight: 10,
  },
  visorArchivoScroll: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  archivoTextoAmpliado: {
    fontSize: 16,
    color: '#161616',
    lineHeight: 24,
  },
  perfilScreen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  perfilHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#F77F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  perfilCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FECB62',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FECB62',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  perfilInicial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#161616',
  },
  perfilNombre: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  perfilEdad: {
    fontSize: 16,
    color: '#FEF9F3',
  },
  perfilContent: {
    flex: 1,
    padding: 20,
  },
  perfilSeccion: {
    marginBottom: 25,
  },
  perfilSeccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  perfilSeccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161616',
    paddingLeft: 5,
  },
  perfilOpcion: {
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#A8D5BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  perfilOpcionGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  perfilOpcionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  perfilOpcionIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  perfilOpcionTexto: {
    flex: 1,
  },
  perfilOpcionTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161616',
    marginBottom: 3,
  },
  perfilOpcionSubtitulo: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  perfilOpcionFlecha: {
    fontSize: 28,
    color: '#F77F00',
    fontWeight: '300',
  },
  premiumBox: {
    backgroundColor: '#B39DDB',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumTextos: {
    flex: 1,
  },
  premiumBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F77F00',
    marginBottom: 5,
  },
  premiumTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#161616',
    marginBottom: 4,
  },
  premiumSubtitulo: {
    fontSize: 13,
    color: '#3D3D3D',
  },
  premiumFlecha: {
    fontSize: 32,
    color: '#F77F00',
    fontWeight: 'bold',
  },
  cerrarSesionButton: {
    backgroundColor: '#E63946',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cerrarSesionIcon: {
    fontSize: 24,
  },
  cerrarSesionTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalQRContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
  },
});

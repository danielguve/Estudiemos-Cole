# 📚 Estudiemos Cole - Aplicación Educativa

> Aplicación móvil educativa diseñada para estudiantes que desean organizar sus materias, estudiar con técnicas efectivas y generar cuestionarios automáticos con IA.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

## ✨ Características Principales

### 📱 **Gestión de Materias**
- ✅ Crear y organizar materias con emojis personalizados
- ✅ Agregar contenido multimedia: imágenes, archivos PDF, Word, y más
- ✅ Tomar notas de texto ilimitadas
- ✅ Visualizar y editar todo el contenido de cada materia
- ✅ Eliminar materias y contenido fácilmente

### 🤖 **Inteligencia Artificial**
- ✅ Generador automático de cuestionarios con Google Gemini AI
- ✅ Preguntas de opción múltiple basadas en tus notas y archivos
- ✅ Análisis inteligente del contenido de estudio
- ✅ Respuestas correctas incluidas al final

### ⏱️ **Técnica Pomodoro**
- ✅ Temporizador de estudio configurable (default: 25 min)
- ✅ Descansos automáticos (default: 5 min)
- ✅ Contador de ciclos completados
- ✅ Notificaciones visuales de tiempo de estudio/descanso

### 🎵 **Música para Concentración**
- ✅ 4 pistas de audio relajante sin copyright
- ✅ Lluvia suave, bosque tranquilo, meditación, ondas cerebrales
- ✅ Controles completos: play, pause, stop
- ✅ Reproducción en bucle
- ✅ Audio en segundo plano

### 📱 **Compartir Materias con QR**
- ✅ Escanear códigos QR para importar materias
- ✅ Generar códigos QR de tus materias
- ✅ Compartir materias con otros estudiantes
- ✅ Copiar códigos al portapapeles

### 👤 **Perfil y Autenticación**
- ✅ Registro de usuario con nombre y edad
- ✅ Persistencia de datos con AsyncStorage
- ✅ Racha de días consecutivos de estudio
- ✅ Cerrar sesión y limpiar datos
- ✅ Los datos se guardan automáticamente

### 🎨 **Diseño Moderno**
- ✅ Interfaz intuitiva y atractiva
- ✅ Gradientes de colores suaves
- ✅ Animaciones fluidas
- ✅ Responsive design
- ✅ Dark mode friendly

## 🚀 Instalación

### Prerrequisitos

- **Node.js** (v14 o superior) - [Descargar](https://nodejs.org/)
- **Expo CLI** - Instalado automáticamente con el proyecto
- **Expo Go App** en tu dispositivo móvil:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd "Estudiemos cole"
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar la aplicación**
```bash
npm start
```

4. **Abrir en tu dispositivo**
   - Escanea el código QR con **Expo Go** (iOS)
   - Escanea el código QR con **Expo Go** (Android)
   - O presiona `w` para abrir en el navegador web

## 📱 Uso de la Aplicación

### Primera Vez

1. Al abrir la app, verás una frase inspiradora de Nelson Mandela
2. Presiona **"Empezar"**
3. Ingresa tu **nombre** y **edad**
4. ¡Listo! Ya puedes usar todas las funciones

### Crear una Materia

1. Ve a **"Mis Materias"** (📚)
2. Escribe el nombre de la materia
3. Selecciona un emoji representativo
4. Presiona **"Inscribir Materia"**

### Agregar Contenido

1. **Abre** una materia
2. Presiona **"Agregar Información"**
3. Selecciona el tipo de contenido:
   - 🖼️ **Imágenes** desde tu galería
   - 📄 **Archivos** (PDF, Word, Excel, etc.)
   - ✏️ **Notas** de texto

### Generar Cuestionarios con IA

1. Ve a **"Chat IA"** (💬)
2. Selecciona una materia que tenga contenido
3. La IA generará automáticamente 5 preguntas
4. Responde mentalmente y verifica las respuestas al final

### Usar el Temporizador Pomodoro

1. Ve a **"Estudiemos"** (📖)
2. Configura los tiempos de estudio y descanso
3. Presiona **"▶️ Iniciar"**
4. ¡Concentra estudiar!
5. Toma descansos cuando suene

### Escuchar Música Relajante

1. En **"Estudiemos"**, desplázate hacia abajo
2. Selecciona una de las 4 pistas disponibles
3. La música se reproducirá en bucle
4. Usa los controles para pausar o detener

### Compartir Materias

1. Ve a **"Inicio"** (🏠)
2. Presiona **"Compartir Materias"**
3. **Para escanear**: Selecciona "📷 Escanear" y apunta al QR
4. **Para compartir**: Selecciona "📤 Compartir" y elige una materia
5. Copia el código y compártelo

## 🛠️ Tecnologías Utilizadas

### Core
- **React Native** 0.81.5 - Framework móvil
- **TypeScript** 5.3.3 - Tipado estático
- **Expo** 54.0.23 - Plataforma de desarrollo

### UI/UX
- **expo-linear-gradient** - Gradientes hermosos
- **react-native-safe-area-context** - Soporte para notch
- **expo-status-bar** - Barra de estado customizable

### Funcionalidades
- **@google/generative-ai** - IA de Google Gemini
- **expo-image-picker** - Selección de imágenes
- **expo-document-picker** - Selección de archivos
- **expo-file-system** - Lectura de archivos
- **expo-sharing** - Compartir archivos
- **expo-av** - Reproducción de audio
- **expo-barcode-scanner** - Escaneo de QR
- **expo-clipboard** - Copiar al portapapeles
- **@react-native-async-storage/async-storage** - Persistencia de datos

### Navegación
- **@react-navigation/native** - Sistema de navegación
- **@react-navigation/bottom-tabs** - Tabs inferiores

## 📁 Estructura del Proyecto

```
Estudiemos cole/
├── App.tsx                      # Componente principal
├── screens/
│   ├── ChatIAScreen.tsx        # Generador de cuestionarios IA
│   ├── EstudioScreen.tsx       # Temporizador Pomodoro + Música
│   ├── QRScannerScreen.tsx     # Scanner y generador de QR
│   ├── InicioScreen.tsx        # Pantalla de inicio (legacy)
│   ├── MisMateriasScreen.tsx   # Gestión de materias (legacy)
│   └── PerfilScreen.tsx        # Perfil de usuario (legacy)
├── assets/                      # Recursos estáticos
├── package.json                 # Dependencias
├── tsconfig.json               # Configuración TypeScript
├── app.json                    # Configuración Expo
└── README.md                   # Este archivo

```

## 🎯 Características Técnicas

### Autenticación Segura
- Sistema de registro persistente
- Datos guardados localmente con AsyncStorage
- Cierre de sesión con confirmación
- Racha de días actualizada automáticamente

### Persistencia de Datos
- Guardado automático de materias
- Guardado de configuraciones de usuario
- Recuperación de datos al reiniciar
- Sincronización de racha diaria

### Integración con IA
- API de Google Gemini 2.5 Flash
- Procesamiento de contenido en tiempo real
- Generación de preguntas contextuales
- Manejo de errores robusto

### Scanner de QR
- Permisos de cámara manejados correctamente
- Validación de datos escaneados
- Generación de códigos compartibles
- Interfaz intuitiva con dos modos

## 🐛 Solución de Problemas

### La app no inicia
```bash
# Limpiar caché de Expo
expo start -c

# O reinstalar dependencias
rm -rf node_modules
npm install
```

### Errores de permisos (cámara/galería)
- Ve a Configuración de tu dispositivo
- Busca la app Expo Go
- Activa permisos de Cámara y Galería

### La música no suena
- Verifica tu conexión a internet (las URLs son remotas)
- Asegúrate de que el volumen del dispositivo esté alto
- Comprueba que no estés en modo silencioso

### Los datos no se guardan
- Verifica que hayas completado el registro
- Asegúrate de cerrar la app correctamente
- Reinstala la app si persiste el problema

## 📝 Notas de Desarrollo

### API Keys
- La API key de Google Gemini está incluida en el código
- Para producción, considera usar variables de entorno

### Música
- Las URLs de música son de Pixabay (licencia libre)
- Puedes reemplazarlas con tus propias URLs en `EstudioScreen.tsx`

### QR Codes
- Los QR solo comparten notas y estructura (no archivos)
- Esto es por seguridad y tamaño del código

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras algún bug o quieres agregar una funcionalidad:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ para estudiantes que quieren mejorar sus hábitos de estudio.

## 🙏 Agradecimientos

- Google Gemini AI por la API de inteligencia artificial
- Pixabay por la música sin copyright
- Expo por la increíble plataforma de desarrollo
- La comunidad de React Native

---

**¿Tienes preguntas?** Abre un issue en el repositorio.

**¿Te gustó el proyecto?** Dale una ⭐ en GitHub!

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { PrismaClient } = require('@prisma/client'); // Solo necesitamos Prisma nativo

// 1. Inicialización de la App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 2. Conexión a Base de Datos (Nativa y Estable)
// Prisma automáticamente leerá process.env.DATABASE_URL
const prisma = new PrismaClient(); 

async function verificarYConectarBD() {
  console.log("=== ESTADO DEL ENTORNO Y CONEXIÓN ===");
  
  // Verificar variables de entorno
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Detectada ✅" : "UNDEFINED ❌");
  console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Detectada ✅" : "UNDEFINED ❌");
  console.log("-------------------------------------");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR CRÍTICO: No se intentará conectar porque no hay DATABASE_URL.");
    console.log("=====================================");
    return;
  }

  try {
    console.log("⏳ Intentando conectar a la base de datos (Modo Nativo)...");
    
    // Forzamos a Prisma a establecer la conexión tcp
    await prisma.$connect(); 
    
    console.log("🎉 ¡CONEXIÓN EXITOSA! La base de datos está conectada de forma estable.");
  } catch (error) {
    console.error("❌ FALLÓ LA CONEXIÓN A LA BASE DE DATOS.");
    console.error("Motivo exacto del rechazo:", error.message);
  }
  
  console.log("=====================================");
}

// Ejecutamos la función inmediatamente
verificarYConectarBD();

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Configurar Cloudinary para guardar las fotos
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'noche_mascaras',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});
const upload = multer({ storage: storage });

// 5. Conectar las rutas
const apiRoutes = require('./routes/api')(prisma, io, upload);
app.use('/api', apiRoutes);

// 6. Eventos de WebSockets
io.on('connection', (socket) => {
  console.log(`📱 Usuario conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log('❌ Usuario desconectado'));
});

// 7. Encender el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ================================================
  🎭 LA NOCHE DE LAS MÁSCARAS - BACKEND ACTIVO
  🚀 Corriendo en: http://localhost:${PORT}
  ================================================
  `);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');

// 1. Inicialización de la App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 2. Conexión a Base de Datos (Al estilo Prisma v7)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function verificarYConectarBD() {
  console.log("=== ESTADO DEL ENTORNO Y CONEXIÓN ===");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Detectada ✅" : "UNDEFINED ❌");
  console.log("-------------------------------------");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR CRÍTICO: No hay DATABASE_URL.");
    return;
  }

  try {
    console.log("⏳ Conectando a Neon Serverless...");
    await prisma.$connect(); 
    console.log("🎉 ¡CONEXIÓN EXITOSA! Base de datos lista.");
  } catch (error) {
    console.error("❌ FALLÓ LA CONEXIÓN:", error.message);
  }
}

verificarYConectarBD();

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Configurar Cloudinary
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

// 5. Rutas
const apiRoutes = require('./routes/api')(prisma, io, upload);
app.use('/api', apiRoutes);

// 6. WebSockets de la App
io.on('connection', (socket) => {
  console.log(`📱 Usuario conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log('❌ Usuario desconectado'));
});

// 7. Encender Servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ================================================
  🎭 LA NOCHE DE LAS MÁSCARAS - BACKEND ACTIVO
  🚀 Corriendo en: http://localhost:${PORT}
  ================================================
  `);
});
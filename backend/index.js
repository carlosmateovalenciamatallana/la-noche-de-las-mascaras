require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

// Configuración necesaria para que Neon funcione en Node.js
neonConfig.webSocketConstructor = ws;

// 1. Conexión a Base de Datos (Neon + Prisma)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Inicializamos el cliente con el adaptador
const prisma = new PrismaClient({ adapter });

// 2. Inicializar Servidor Express
const app = express();
const server = http.createServer(app);

// 3. Configurar Socket.io (Tiempo Real)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// 4. Middlewares básicos
app.use(cors());
app.use(express.json());

// 5. Configurar Cloudinary para guardar las fotos
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

// 6. Conectar las rutas
const apiRoutes = require('./routes/api')(prisma, io, upload);
app.use('/api', apiRoutes);

// 7. Eventos de WebSockets
io.on('connection', (socket) => {
  console.log(`📱 Usuario conectado: ${socket.id}`);
  socket.on('disconnect', () => console.log('❌ Usuario desconectado'));
});

// 8. Encender el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ================================================
  🎭 LA NOCHE DE LAS MÁSCARAS - BACKEND ACTIVO
  🚀 Corriendo en: http://localhost:${PORT}
  ================================================
  `);
});
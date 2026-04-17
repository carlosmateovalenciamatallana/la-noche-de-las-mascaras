const express = require('express');

module.exports = function(prisma, io, upload) {
  const router = express.Router();

  // 1. Registro Fase 1: Perfil con Máscara
  router.post('/profiles/mask', upload.single('photo'), async (req, res) => {
    try {
      const { deviceId, name, bio } = req.body;

      if (!req.file) return res.status(400).json({ error: 'La foto es obligatoria' });

      // Verificar si el usuario ya existe
      let user = await prisma.user.findUnique({ where: { deviceId } });
      if (!user) {
        user = await prisma.user.create({ data: { deviceId } });
      }

      // Crear el perfil falso
      const maskProfile = await prisma.profile.create({
        data: {
          isReal: false,
          photoUrl: req.file.path, // URL que nos devuelve Cloudinary
          name,
          bio,
          userId: user.id
        }
      });

      // Avisar a todos los conectados que hay una nueva máscara (Tiempo Real)
      io.emit('new_mask_profile', maskProfile);

      res.status(201).json(maskProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el perfil' });
    }
  });

router.get('/feed', async (req, res) => {
    try {
      const profiles = await prisma.profile.findMany({
        where: { isReal: false },
        include: {
          _count: { select: { likes: true, comments: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: { user: { include: { profiles: true } } }
          },
          user: {
            include: {
              profiles: {
                where: { isReal: true },
                // 👇 ESTO ES NUEVO: Traemos los likes y comentarios del perfil REAL
                include: {
                  _count: { select: { likes: true, comments: true } },
                  comments: {
                    orderBy: { createdAt: 'asc' },
                    include: { user: { include: { profiles: true } } }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = profiles.map(p => {
        const realProfile = p.user.profiles[0] || null;

        // Función para saber con qué nombre firmar el comentario
        const getAuthorName = (commentUser) => {
          const authorReal = commentUser.profiles.find(ap => ap.isReal);
          const authorMask = commentUser.profiles.find(ap => !ap.isReal);
          return authorReal ? authorReal.name : (authorMask?.name || 'Anónimo');
        };

        // Formateamos comentarios de la máscara
        const maskComments = p.comments.map(c => ({
           id: c.id, text: c.text, userName: getAuthorName(c.user)
        }));

        // Formateamos comentarios de la identidad real (empezará en 0)
        if (realProfile) {
           realProfile.comments = realProfile.comments.map(c => ({
             id: c.id, text: c.text, userName: getAuthorName(c.user)
           }));
        }

        return { ...p, comments: maskComments, realInfo: realProfile };
      });

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el feed' });
    }
  });

// 3. Dar Like (Ajustado para usar deviceId)
  router.post('/likes', async (req, res) => {
    try {
      const { profileId, userId: deviceId } = req.body;
      
      // Buscamos el ID real del usuario en la BD usando el deviceId
      const user = await prisma.user.findUnique({ where: { deviceId } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const like = await prisma.like.create({ 
        data: { 
          profileId, 
          userId: user.id // Usamos el ID real aquí
        } 
      });

      io.emit('new_like', { profileId });
      res.status(201).json(like);
    } catch (error) {
      if (error.code === 'P2002') return res.status(400).json({ error: 'Ya diste like' });
      res.status(500).json({ error: 'Error al dar like' });
    }
  });

  // 4. Dejar Comentario
  router.post('/comments', async (req, res) => {
    try {
      const { profileId, userId: deviceId, text } = req.body;

      const user = await prisma.user.findUnique({ 
        where: { deviceId },
        include: { profiles: true } 
      });
      
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const comment = await prisma.comment.create({
        data: { 
          text, 
          profileId, 
          userId: user.id 
        }
      });

      // 👇 LA MAGIA: El Backend ahora verifica quién eres actualmente
      const authorReal = user.profiles.find(p => p.isReal === true);
      const authorMask = user.profiles.find(p => p.isReal === false);
      
      // Si ya tienes perfil real, usa ese nombre. Si no, usa el de la máscara.
      const currentName = authorReal ? authorReal.name : (authorMask?.name || 'Anónimo');

      // Emitimos el comentario con tu identidad actualizada
      io.emit('new_comment', { 
        profileId, 
        comment: {
          ...comment,
          userName: currentName 
        }
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: 'Error al comentar' });
    }
  });


  // 5. Validar PIN de la Puerta Secreta
  router.post('/validate-pin', async (req, res) => {
    try {
      const { pin } = req.body;
      // Buscamos el PIN en la BD, si no hay, usamos el default
      const config = await prisma.appConfig.findFirst() || { secretPin: "250426" };
      
      if (pin === config.secretPin) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: 'PIN incorrecto. La puerta no se abre.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al validar el PIN' });
    }
  });

  // 6. Registro Fase 2: Identidad Real
  router.post('/profiles/real', upload.single('photo'), async (req, res) => {
    try {
      const { deviceId, name, bio } = req.body;

      if (!req.file) return res.status(400).json({ error: 'La foto sin máscara es obligatoria' });

      // Buscamos al usuario por su ID de dispositivo
      const user = await prisma.user.findUnique({ where: { deviceId } });
      if (!user) return res.status(404).json({ error: 'Usuario original no encontrado' });

      // Obtener una frase aleatoria
      const quotesCount = await prisma.quote.count();
      let assignedQuote = "La verdad te hará libre."; // Frase por defecto si la BD está vacía
      
      if (quotesCount > 0) {
        const skip = Math.floor(Math.random() * quotesCount);
        const randomQuote = await prisma.quote.findFirst({ skip });
        if (randomQuote) assignedQuote = randomQuote.text;
      }

      // Crear el perfil real
      const realProfile = await prisma.profile.create({
        data: {
          isReal: true, // ¡Este es el diferenciador!
          photoUrl: req.file.path,
          name,
          bio,
          quoteAssigned: assignedQuote,
          userId: user.id
        }
      });

      // Emitir a todos que este usuario se ha revelado
      io.emit('user_revealed', { 
        userId: user.id, 
        realProfile: realProfile 
      });

      res.status(201).json(realProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al revelar identidad' });
    }
  });

  return router;
};
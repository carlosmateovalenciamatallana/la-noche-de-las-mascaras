import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const [profiles, setProfiles] = useState([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const navigate = useNavigate();

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [commentText, setCommentText] = useState('');

  const isUserReal = localStorage.getItem('isReal') === 'true';
  const myName = isUserReal 
    ? localStorage.getItem('realName') 
    : localStorage.getItem('maskName');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await axios.get('https://la-noche-de-las-mascaras.onrender.comapi/feed');
        setProfiles(response.data);
      } catch (error) { console.error(error); }
    };
    fetchFeed();

    const socket = io('https://la-noche-de-las-mascaras.onrender.com');

    socket.on('new_like', ({ profileId }) => {
      setProfiles(prev => prev.map(p => {
        if (p.id === profileId) return { ...p, _count: { ...p._count, likes: (p._count?.likes || 0) + 1 } };
        if (p.realInfo && p.realInfo.id === profileId) return { ...p, realInfo: { ...p.realInfo, _count: { ...p.realInfo._count, likes: (p.realInfo._count?.likes || 0) + 1 } } };
        return p;
      }));
    });

    socket.on('new_comment', ({ profileId, comment }) => {
      setProfiles(prev => prev.map(p => {
        if (p.id === profileId) return {
          ...p, _count: { ...p._count, comments: (p._count?.comments || 0) + 1 }, comments: [...(p.comments || []), comment]
        };
        if (p.realInfo && p.realInfo.id === profileId) return {
          ...p, realInfo: { ...p.realInfo, _count: { ...p.realInfo._count, comments: (p.realInfo._count?.comments || 0) + 1 }, comments: [...(p.realInfo.comments || []), comment] }
        };
        return p;
      }));
    });

    socket.on('new_mask_profile', (newP) => setProfiles(prev => [{...newP, _count:{likes:0, comments:0}, comments:[]}, ...prev]));
    socket.on('user_revealed', ({ userId, realProfile }) => {
      setProfiles(prev => prev.map(p => p.userId === userId ? { ...p, realInfo: realProfile } : p));
    });

    return () => socket.disconnect();
  }, []);

  const filteredProfiles = profiles.filter(profile => isUserReal ? profile.realInfo !== null : profile.realInfo === null);

  const handleLike = async (targetId) => {
    try {
      const deviceId = localStorage.getItem('deviceId');
      await axios.post('https://la-noche-de-las-mascaras.onrender.comapi/likes', { profileId: targetId, userId: deviceId });
    } catch (error) { console.log('Error al dar like'); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const deviceId = localStorage.getItem('deviceId');
      await axios.post('https://la-noche-de-las-mascaras.onrender.comapi/comments', { 
        profileId: selectedProfile.id, userId: deviceId, text: commentText 
      });
      setCommentText('');
    } catch (error) { alert('Error al enviar susurro'); }
  };

  const modalParentProfile = selectedProfile 
    ? profiles.find(p => p.id === selectedProfile.id || (p.realInfo && p.realInfo.id === selectedProfile.id)) 
    : null;
  const activeCommentsList = modalParentProfile 
    ? (isUserReal ? modalParentProfile.realInfo?.comments : modalParentProfile.comments) 
    : [];

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://la-noche-de-las-mascaras.onrender.comapi/validate-pin', { pin: pinInput });
      setShowPinModal(false);
      navigate('/register-real'); 
    } catch (error) {
      alert('PIN incorrecto. Las sombras te rechazan.');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col relative bg-dark">
      
      <header className="sticky top-0 z-30 bg-darker/95 border-b border-gray-800 p-5 text-center">
        <h2 className="text-2xl font-serif text-gold uppercase tracking-tighter">
          {isUserReal ? "El Salón de la Luz" : "La Galería de Sombras"}
        </h2>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="h-[1px] w-4 bg-gold/30"></span>
          <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em]">
            {isUserReal ? "Revelado:" : "Incógnito:"} <span className="text-gold">{myName || 'Invitado'}</span>
          </p>
          <span className="h-[1px] w-4 bg-gold/30"></span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-12 mt-4">
        {filteredProfiles.length === 0 ? (
          <div className="text-center mt-20 italic text-gray-600 animate-pulse">
            Buscando almas en {isUserReal ? "la luz" : "las sombras"}...
          </div>
        ) : (
          filteredProfiles.map((profile, index) => {
            const targetProfile = isUserReal ? profile.realInfo : profile;
            const targetId = targetProfile.id;
            const likesCount = targetProfile._count?.likes || 0;
            const commentsCount = targetProfile._count?.comments || 0;

            return (
              <article 
                key={profile.id} 
                className="bg-darker border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img src={targetProfile.photoUrl} className="w-full aspect-square object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gold uppercase tracking-widest">{targetProfile.name}</h3>
                  <p className="text-gray-400 text-sm mt-2 italic font-light">"{targetProfile.bio}"</p>
                  
                  {isUserReal && profile.realInfo?.quoteAssigned && (
                      <div className="mt-4 p-3 bg-gold/5 rounded-lg border-l-4 border-gold italic text-xs text-gold/80">
                        {profile.realInfo.quoteAssigned}
                      </div>
                    )}

                  <div className="flex gap-6 mt-4 pt-4 border-t border-gray-800">
                    <button onClick={() => handleLike(targetId)} className="flex items-center gap-2 text-gold/80 hover:scale-110 transition-transform">
                      <span>🔥</span> {likesCount}
                    </button>
                    <button 
                      onClick={() => { setSelectedProfile(targetProfile); setShowCommentModal(true); }}
                      className="flex items-center gap-2 text-gray-400 hover:text-white hover:scale-110 transition-all"
                    >
                      <span>💬</span> {commentsCount}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Botón Flotante */}
      {!isUserReal && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto flex justify-center z-[90] pointer-events-none">
          <button 
            type="button"
            onClick={() => setShowPinModal(true)}
            className="pointer-events-auto bg-dark border-2 border-gold text-gold p-4 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all cursor-pointer"
          >
            <span className="text-2xl">🗝️</span>
          </button>
        </div>
      )}

      {/* MODAL DE COMENTARIOS (Sin backdrop-blur para móviles) */}
      {showCommentModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/95">
          <div className="bg-darker w-full max-w-md h-[80vh] flex flex-col rounded-t-3xl border-t border-gold shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-darker">
              <div>
                <h4 className="text-gold font-serif text-lg">Susurros para</h4>
                <p className="text-gray-500 text-xs uppercase">{selectedProfile.name}</p>
              </div>
              <button onClick={() => setShowCommentModal(false)} className="text-gray-500 text-2xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-dark/50">
              {activeCommentsList?.length === 0 ? (
                <p className="text-center text-gray-600 italic mt-10">Este nuevo lienzo aún no tiene susurros...</p>
              ) : (
                activeCommentsList?.map((c, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">{c.userName}</span>
                    <div className="bg-gray-900/50 p-3 rounded-lg border-l-2 border-gray-700">
                      <p className="text-gray-300 text-sm leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-darker border-t border-gray-800">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un susurro..."
                  className="flex-1 bg-dark border border-gray-700 p-3 rounded-xl text-white focus:outline-none focus:border-gold text-sm"
                />
                <button type="submit" className="bg-gold text-darker p-3 rounded-xl font-bold">➔</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL PIN (Sin backdrop-blur y z-index máximo absoluto) */}
      {showPinModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4">
          <div className="bg-darker border border-gold p-8 rounded-2xl w-full max-w-sm text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <h3 className="text-2xl font-serif text-gold mb-6 tracking-widest uppercase">La Puerta Secreta</h3>
            <form onSubmit={handlePinSubmit}>
              <input 
                type="password" 
                maxLength="6"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-dark border-b-2 border-gray-700 p-3 text-center text-3xl text-white tracking-[0.3em] focus:outline-none focus:border-gold mb-10 rounded-t-md"
                placeholder="••••••"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest cursor-pointer py-2">
                  Cerrar
                </button>
                <button type="submit" className="flex-1 bg-gold hover:bg-yellow-500 text-darker py-3 rounded font-bold uppercase text-xs tracking-widest shadow-md cursor-pointer">
                  Abrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
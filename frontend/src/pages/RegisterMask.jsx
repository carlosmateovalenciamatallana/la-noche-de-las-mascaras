import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterMask() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', bio: '', photo: null });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // Nuevo estado para la transición

  // Generamos un ID único en el dispositivo
  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo || !formData.name || !formData.bio) {
      alert('Por favor completa todos los campos y sube tu máscara.');
      return;
    }

    setLoading(true);
    
    const data = new FormData();
    data.append('deviceId', deviceId);
    data.append('name', formData.name);
    data.append('bio', formData.bio);
    data.append('photo', formData.photo);

    try {
      // 1. Petición al backend
      await axios.post('https://la-noche-de-las-mascaras.onrender.com/api/profiles/mask', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 2. Guardar persistencia de identidad
      localStorage.setItem('hasMask', 'true');
      localStorage.setItem('maskName', formData.name); 

      // 3. Activar pantalla de éxito (Adiós al alert)
      setIsSuccess(true);

      // 4. Redirigir después de la animación (2 segundos)
      setTimeout(() => {
        navigate('/feed');
      }, 2000);

    } catch (error) {
      console.error(error);
      alert('Hubo un error. Revisa que el backend esté encendido.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 relative bg-dark">
      <h2 className="text-center text-3xl font-serif text-gold mt-8 mb-2 tracking-tight">Forja tu Máscara</h2>
      <p className="text-center text-gray-500 mb-8 text-sm font-light italic">¡Crea tu identidad efímera para esta noche!</p>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
        
        {/* Selector de Imagen con Cámara forzada */}
        <div className="flex flex-col items-center">
          <label className="w-40 h-40 rounded-full border-2 border-dashed border-gold flex items-center justify-center cursor-pointer overflow-hidden relative bg-darker hover:bg-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-gold text-[10px] uppercase font-bold tracking-widest">Tomar Foto</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Inputs de Texto */}
        <div className="flex flex-col gap-1">
          <label className="text-gold text-[10px] font-bold uppercase tracking-[0.2em]">Alias</label>
          <input 
            type="text" 
            placeholder="¿Cuál es tu nombre falso?"
            className="bg-transparent border-b border-gray-800 p-2 text-white focus:outline-none focus:border-gold transition-colors text-lg font-light"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gold text-[10px] font-bold uppercase tracking-[0.2em]">Biografía Enigmática</label>
          <textarea 
            placeholder="¿Quién eres para el mundo?"
            className="bg-transparent border-b border-gray-800 p-2 text-white focus:outline-none focus:border-gold transition-colors resize-none h-24 text-lg font-light"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || isSuccess}
          className="mt-auto mb-8 bg-gold text-darker font-bold py-4 rounded-xl text-sm uppercase tracking-[0.3em] disabled:opacity-50 hover:bg-gold-light transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] active:scale-95"
        >
          {loading ? 'Invocando...' : 'Entrar a las Sombras'}
        </button>
      </form>

      {/* Pantalla de Éxito Profesional (Overlay) */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] bg-dark flex flex-col items-center justify-center animate-fade-in">
          <div className="text-center p-8">
            <div className="text-7xl mb-6 animate-bounce">🎭</div>
            <h2 className="text-3xl font-serif text-gold mb-2 uppercase tracking-widest">Máscara Forjada</h2>
            <p className="text-gray-500 font-light italic text-sm">Tu identidad ahora esta en las sombras...</p>
            
            {/* Barra de progreso decorativa */}
            <div className="mt-10 w-48 h-1 bg-gray-900 mx-auto rounded-full overflow-hidden">
              <div className="h-full bg-gold animate-progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
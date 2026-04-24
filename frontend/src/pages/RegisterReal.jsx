import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterReal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', bio: '', photo: null });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // Estado para la transición de luz

  useEffect(() => {
    const id = localStorage.getItem('deviceId');
    if (id) {
      setDeviceId(id);
    } else {
      // Este alert es preventivo, pero el de éxito ya no existirá
      alert("No se encontró tu identidad anónima. Vuelve al inicio.");
      navigate('/');
    }
  }, [navigate]);

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
      alert('Por favor completa todos los campos con tu verdadera identidad.');
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
      const response = await axios.post('https://la-noche-de-las-mascaras.onrender.com/api/profiles/real', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 2. Guardar persistencia de identidad real
      localStorage.setItem('isReal', 'true');
      localStorage.setItem('realName', formData.name);

      // 3. Activar pantalla de éxito (La Revelación)
      setIsSuccess(true);

      // 4. Redirigir después de la mística (2.5 segundos)
      setTimeout(() => {
        navigate('/welcome-real', { 
          state: { 
            quote: response.data.quoteAssigned, 
            name: response.data.name 
          } 
        });
      }, 2500);

    } catch (error) {
      console.error(error);
      alert('Hubo un error al revelar tu identidad.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-darker relative overflow-hidden">
      <h2 className="text-center text-3xl font-serif text-white mt-8 mb-2 tracking-tighter">La Revelación</h2>
      <p className="text-center text-gold mb-8 text-sm font-light italic">Quítate la máscara. ¡Muestra quien SI eres!</p>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
        
        {/* Selector de Imagen Real con Cámara frontal */}
        <div className="flex flex-col items-center">
          <label className="w-40 h-40 border-2 border-white flex items-center justify-center cursor-pointer overflow-hidden relative bg-dark hover:bg-gray-900 transition-all shadow-[0_0_25px_rgba(255,255,255,0.1)]">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-2xl block mb-1">🕊️</span>
                <span className="text-white text-[10px] uppercase font-bold tracking-widest">Tu Identidad Verdadera</span>
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
          <label className="text-gold text-[10px] font-bold uppercase tracking-[0.2em]">Nombre Real</label>
          <input 
            type="text" 
            placeholder="Tu Nombre"
            className="bg-transparent border-b border-gray-800 p-2 text-white focus:outline-none focus:border-white transition-colors text-lg font-light"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gold text-[10px] font-bold uppercase tracking-[0.2em]">Tu Verdadera Esencia</label>
          <textarea 
            placeholder="¿Quién eres para DIOS?"
            className="bg-transparent border-b border-gray-800 p-2 text-white focus:outline-none focus:border-white transition-colors resize-none h-24 text-lg font-light"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || isSuccess}
          className="mt-auto mb-8 bg-white text-black font-bold py-4 rounded-xl text-sm uppercase tracking-[0.3em] disabled:opacity-50 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95"
        >
          {loading ? 'Buscando la verdad...' : 'Despojarse de la máscara'}
        </button>
      </form>

      {/* Pantalla de Éxito: La Luz (Overlay) */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-fade-in">
          <div className="text-center p-8">
            <div className="text-7xl mb-6 animate-pulse">🕊️</div>
            <h2 className="text-3xl font-serif text-darker mb-2 uppercase tracking-tighter">La Verdad se revela</h2>
            <p className="text-gray-400 font-light italic text-sm">Has dejado atrás el velo de la noche...</p>
            
            {/* Barra de progreso oscura para contraste */}
            <div className="mt-10 w-48 h-1 bg-gray-100 mx-auto rounded-full overflow-hidden">
              <div className="h-full bg-darker animate-progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
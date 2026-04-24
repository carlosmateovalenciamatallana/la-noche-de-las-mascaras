import { useLocation, useNavigate } from 'react-router-dom';

export default function WelcomeReal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recuperamos la frase y el nombre que nos pasó el formulario anterior
  const { quote, name } = location.state || { quote: "La verdad te hará libre.", name: "Valiente" };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-dark">
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        
        <span className="text-6xl mb-8 block drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🔑</span>
        
        <h1 className="text-3xl font-serif font-bold text-white mb-6 tracking-wide">
          Bienvenido a la luz<br/>
          <span className="text-gold">{name}</span>
        </h1>
        
        <div className="relative p-8 mt-4">
          {/* Comillas decorativas */}
          <span className="absolute top-0 left-0 text-6xl text-gray-800 font-serif leading-none opacity-50">"</span>
          
          <p className="text-gray-300 text-xl font-light italic relative z-10 leading-relaxed">
            {quote}
          </p>
          
          <span className="absolute bottom-0 right-0 text-6xl text-gray-800 font-serif leading-none opacity-50">"</span>
        </div>
      </div>

      <div className="w-full pb-8">
        <button 
          onClick={() => navigate('/feed')}
          className="w-full bg-gold text-darker font-bold py-4 rounded-xl text-sm uppercase tracking-[0.3em] hover:bg-gold-light transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] active:scale-95"
        >
         Ir a la galería
        </button>
      </div>
    </div>
  );
}
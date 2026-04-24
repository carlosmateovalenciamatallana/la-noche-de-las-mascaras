import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {/* Ícono de Máscara */}
        <p className="text-gray-400 mb-8 text-lg font-light">
          #NEWSEASON 2° ANIVERSARIO
        </p>
        <div className="w-24 h-24 mb-8 bg-dark border-2 border-gold rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <span className="text-4xl">🎭</span>
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-gold mb-4 tracking-wide">
          La Noche de las Máscaras
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg font-light">
          Nadie sabe quién eres. Oculta tu rostro, ¡libera tu voz!
        </p>
      </div>

      <div className="w-full pb-12">
        <button 
          onClick={() => navigate('/register-mask')}
          className="w-full bg-gold text-darker font-bold py-4 rounded-lg text-lg uppercase tracking-widest hover:bg-gold-light transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
          Entrar al Anonimato
        </button>
      </div>
    </div>
  );
}
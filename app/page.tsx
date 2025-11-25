export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 drop-shadow-2xl">
            Encuentra el Seguro <span className="text-yellow-300">Perfecto</span> para Ti
          </h1>
          <p className="text-2xl md:text-3xl mb-8 font-light drop-shadow-lg">
            Recomendaciones personalizadas basadas en tu perfil de riesgo
          </p>
          <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto opacity-90">
            Completa nuestro cuestionario inteligente y recibe recomendaciones de seguros de vida y salud 
            adaptadas a tus necesidades, con justificaciones claras y transparentes.
          </p>
        </div>

        {/* CTA Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-10">
            <div className="text-7xl mb-6">🎯</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Responde algunas preguntas sobre tu salud, estilo de vida y ocupación para obtener 
              recomendaciones personalizadas de seguros.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-5xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-800 mb-2">Rápido</h3>
              <p className="text-sm text-gray-600">Solo 5-10 minutos para completar</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-5xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-800 mb-2">Seguro</h3>
              <p className="text-sm text-gray-600">Tus datos están protegidos</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-5xl mb-3">🎁</div>
              <h3 className="font-bold text-gray-800 mb-2">Gratis</h3>
              <p className="text-sm text-gray-600">Sin costo ni compromiso</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <a
              href="/cuestionario"
              className="inline-block px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-bold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Comenzar Cuestionario →
            </a>
            <p className="text-sm text-gray-500 mt-4">
              No se requiere registro ni información personal
            </p>
          </div>
        </div>

        {/* Process Steps */}
        <div className="max-w-5xl mx-auto mt-16">
          <h3 className="text-3xl font-bold text-white text-center mb-10 drop-shadow-lg">
            ¿Cómo funciona?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Responde el Cuestionario</h4>
              <p className="text-gray-600">
                Preguntas adaptativas sobre tu edad, salud, estilo de vida y ocupación
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Análisis de Perfil</h4>
              <p className="text-gray-600">
                Evaluamos tu perfil de riesgo usando algoritmos avanzados
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Recibe Recomendaciones</h4>
              <p className="text-gray-600">
                Seguros rankeados por relevancia con justificaciones claras
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-white/80">
          <p className="text-sm">
            Sistema de Recomendación de Seguros • Arquitectura Hexagonal • Next.js 14
          </p>
        </div>
      </div>
    </div>
  );
}

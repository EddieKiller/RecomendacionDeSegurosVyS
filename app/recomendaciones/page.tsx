'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { NivelRiesgo, TipoSeguro } from '@/src/domain/types/enums';
import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';

interface Recomendacion {
  seguro: {
    idSeguro: number;
    nombre: string;
    tipo: TipoSeguro;
    cobertura: string;
    prima: number;
  };
  relevancia: number;
  primaAjustada: number;
  prioridad: number;
  justificacion: string;
}

interface PerfilRiesgo {
  nivelRiesgo: NivelRiesgo;
  puntajeTotal: number;
  factoresRiesgo: string[];
  factoresProteccion: string[];
  edad: number;
  imc?: number;
}

export default function RecomendacionesPage() {
  const searchParams = useSearchParams();
  const [perfil, setPerfil] = useState<PerfilRiesgo | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generarRecomendaciones();
  }, []);

  const generarRecomendaciones = async () => {
    try {
      setLoading(true);
      
      const idCuestionario = searchParams.get('id');
      const rut = searchParams.get('rut') || '12345678-9';

      if (!idCuestionario) {
        throw new Error('No se especificó el ID del cuestionario');
      }

      const container = DependencyContainer.getInstance();

      // Obtener repositorios para cargar Usuario y Cuestionario
      const cuestionarioRepoAdapter = new (await import('@/src/application/adapters/repositorio/CuestionarioRepoAdapter')).CuestionarioRepoAdapter(
        new (await import('@/src/infrastructure/repository/CuestionarioRepositoryDB')).CuestionarioRepositoryDB()
      );
      const usuarioRepoAdapter = new (await import('@/src/application/adapters/repositorio/UsuarioRepoAdapter')).UsuarioRepoAdapter(
        new (await import('@/src/infrastructure/repository/UsuarioRepositoryDB')).UsuarioRepositoryDB()
      );

      // Cargar Usuario y Cuestionario
      const usuario = await usuarioRepoAdapter.findByRut(rut);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const cuestionario = await cuestionarioRepoAdapter.findById(parseInt(idCuestionario));
      if (!cuestionario) {
        throw new Error('Cuestionario no encontrado');
      }

      // CU-3: Evaluar Perfil de Riesgo (in-process call)
      const evaluarUseCase = container.getEvaluarPerfilRiesgoUseCase();
      const perfilResult = await evaluarUseCase.evaluar(usuario, cuestionario);

      setPerfil({
        nivelRiesgo: perfilResult.nivelRiesgo,
        puntajeTotal: perfilResult.calcularPuntajeTotal(),
        factoresRiesgo: perfilResult.factoresRiesgo,
        factoresProteccion: perfilResult.factoresProteccion,
        edad: perfilResult.edad || 0,
        imc: perfilResult.imc
      });

      // CU-4: Generar Recomendaciones (in-process call)
      const recomendacionesUseCase = container.getGenerarRecomendacionesUseCase();
      const recomendacionesResult = await recomendacionesUseCase.generar(perfilResult);

      // Mapear RecomendacionResult a interfaz local
      const recomendacionesMapeadas = recomendacionesResult.map(rec => ({
        seguro: {
          idSeguro: rec.seguro.idSeguro,
          nombre: rec.seguro.nombre,
          tipo: rec.seguro.tipo,
          cobertura: rec.seguro.cobertura,
          prima: rec.seguro.prima
        },
        relevancia: rec.relevancia,
        primaAjustada: rec.seguro.calcularPrimaAjustada(perfilResult),
        prioridad: rec.prioridad,
        justificacion: rec.justificacion.join(' ')
      }));

      setRecomendaciones(recomendacionesMapeadas);
      setLoading(false);

    } catch (err: any) {
      console.error('[RecomendacionesPage] Error:', err);
      setError(err.message || 'Error al generar recomendaciones');
      setLoading(false);
    }
  };

  const getRiesgoColor = (nivel: NivelRiesgo) => {
    switch (nivel) {
      case NivelRiesgo.MUY_BAJO:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case NivelRiesgo.BAJO:
        return 'bg-green-100 text-green-800 border-green-300';
      case NivelRiesgo.MEDIO:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case NivelRiesgo.ALTO:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case NivelRiesgo.MUY_ALTO:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTipoSeguroIcon = (tipo: TipoSeguro) => {
    switch (tipo) {
      case TipoSeguro.VIDA:
        return '❤️';
      case TipoSeguro.SALUD:
        return '🏮5';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-700 font-medium">Generando recomendaciones personalizadas...</p>
          <p className="mt-2 text-sm text-gray-500">Analizando tu perfil de riesgo</p>
        </div>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'No se pudo generar el perfil'}</p>
            <button
              onClick={() => window.location.href = '/cuestionario'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Volver al Cuestionario
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* PERFIL DE RIESGO */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-5xl mr-4">📊</span>
            Tu Perfil de Riesgo
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Nivel de Riesgo</p>
              <span className={`inline-block px-4 py-2 rounded-full font-bold text-lg border-2 ${getRiesgoColor(perfil.nivelRiesgo)}`}>
                {perfil.nivelRiesgo}
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Puntaje Total</p>
              <p className="text-4xl font-bold text-purple-600">{perfil.puntajeTotal}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Edad</p>
              <p className="text-4xl font-bold text-green-600">{perfil.edad} años</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border-2 border-orange-200">
              <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Recomendaciones</p>
              <p className="text-4xl font-bold text-orange-600">{recomendaciones.length}</p>
            </div>
          </div>

          {perfil.imc && (
            <div className="bg-blue-50 p-4 rounded-xl mb-6 border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-gray-700">
                📏 Índice de Masa Corporal (IMC): <span className="text-blue-700 text-lg">{perfil.imc.toFixed(1)}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {perfil.factoresRiesgo.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="text-2xl mr-2">⚠️</span>
                  Factores de Riesgo
                </h3>
                <div className="space-y-2">
                  {perfil.factoresRiesgo.map((factor, idx) => (
                    <div key={idx} className="px-4 py-2 bg-red-50 text-red-800 rounded-lg border-l-4 border-red-400 text-sm font-medium">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {perfil.factoresProteccion.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
                  <span className="text-2xl mr-2">✅</span>
                  Factores Protectores
                </h3>
                <div className="space-y-2">
                  {perfil.factoresProteccion.map((factor, idx) => (
                    <div key={idx} className="px-4 py-2 bg-green-50 text-green-800 rounded-lg border-l-4 border-green-400 text-sm font-medium">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECOMENDACIONES */}
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-4xl mr-3">🎯</span>
          Seguros Recomendados para Ti
        </h2>

        {recomendaciones.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg">No se encontraron recomendaciones para tu perfil.</p>
            <p className="text-gray-500 text-sm mt-2">Intenta completar el cuestionario nuevamente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recomendaciones.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-5xl mr-5">{getTipoSeguroIcon(rec.seguro.tipo)}</span>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-gray-800">{rec.seguro.nombre}</h3>
                        {idx === 0 && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-300">
                            🏆 MEJOR OPCIÓN
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">{rec.seguro.tipo}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 font-semibold uppercase">Prima Mensual</div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${rec.primaAjustada.toLocaleString('es-CL')}
                    </div>
                    {Math.abs(rec.seguro.prima - rec.primaAjustada) > 1 && (
                      <div className="text-xs text-gray-400 line-through mt-1">
                        ${rec.seguro.prima.toLocaleString('es-CL')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600">Relevancia para tu perfil</span>
                    <span className="text-sm font-bold text-blue-600">{(rec.relevancia * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 shadow-lg"
                      style={{ width: `${rec.relevancia * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">📋</span>
                    Cobertura
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {rec.seguro.cobertura}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Por qué te recomendamos este seguro
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {rec.justificacion}
                  </p>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t-2 border-gray-100">
                  <div className="text-sm text-gray-500">
                    Prioridad: <span className="font-bold text-purple-600">{rec.prioridad}</span>
                  </div>
                  <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Solicitar Cotización →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón para volver */}
        <div className="mt-10 text-center">
          <button
            onClick={() => window.location.href = '/cuestionario'}
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            ← Volver al Cuestionario
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TipoPregunta } from '@/src/domain/types/enums';
import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';

interface Pregunta {
  idPregunta: number;
  enunciado: string;
  opciones: string[] | null;
  tipo: TipoPregunta;
  bloque: string;
  orden: number;
}

export default function CuestionarioPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Map<number, string>>(new Map());
  const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
  const [idCuestionario, setIdCuestionario] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rut] = useState('12345678-9');

  useEffect(() => {
    cargarCuestionario();
  }, []);

  const cargarCuestionario = async () => {
    try {
      setLoading(true);
      const container = DependencyContainer.getInstance();
      const useCase = container.getGestionarCuestionarioUseCase();

      const resultadoInicio = await useCase.ejecutarAccion('iniciar', { rut });
      if (resultadoInicio.data?.idCuestionario) {
        setIdCuestionario(resultadoInicio.data.idCuestionario);
      }

      await useCase.ejecutarAccion('cargar_preguntas', {});
      const cuestionario = useCase.getCuestionario();
      const preguntasList = cuestionario?.preguntas || [];
      
      setPreguntas(preguntasList as Pregunta[]);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el cuestionario');
      setLoading(false);
    }
  };

  const handleRespuesta = (valor: string) => {
    const pregunta = preguntas[preguntaActualIndex];
    setRespuestas(prev => {
      const newMap = new Map(prev);
      newMap.set(pregunta.idPregunta, valor);
      return newMap;
    });
  };

  const siguiente = async () => {
    const pregunta = preguntas[preguntaActualIndex];
    const valorRespuesta = respuestas.get(pregunta.idPregunta);

    if (!valorRespuesta) {
      alert('Por favor responde la pregunta antes de continuar');
      return;
    }

    try {
      const container = DependencyContainer.getInstance();
      const useCase = container.getGestionarCuestionarioUseCase();

      await useCase.ejecutarAccion('responder', {
        idPregunta: pregunta.idPregunta,
        valor: valorRespuesta
      });

      if (preguntaActualIndex < preguntas.length - 1) {
        setPreguntaActualIndex(prev => prev + 1);
      }
    } catch (err: any) {
      alert('Error al guardar la respuesta');
    }
  };

  const anterior = () => {
    if (preguntaActualIndex > 0) {
      setPreguntaActualIndex(prev => prev - 1);
    }
  };

  const finalizar = async () => {
    const pregunta = preguntas[preguntaActualIndex];
    const valorRespuesta = respuestas.get(pregunta.idPregunta);

    if (!valorRespuesta) {
      alert('Por favor responde la última pregunta antes de finalizar');
      return;
    }

    try {
      setSubmitting(true);
      const container = DependencyContainer.getInstance();
      const useCase = container.getGestionarCuestionarioUseCase();

      await useCase.ejecutarAccion('responder', {
        idPregunta: pregunta.idPregunta,
        valor: valorRespuesta
      });

      await useCase.ejecutarAccion('completar', {});
      window.location.href = `/recomendaciones?id=${idCuestionario}&rut=${rut}`;
    } catch (err: any) {
      alert('Error al finalizar el cuestionario');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-700 font-medium">Cargando cuestionario...</p>
        </div>
      </div>
    );
  }

  if (error || preguntas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'No hay preguntas disponibles'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pregunta = preguntas[preguntaActualIndex];
  const progreso = ((preguntaActualIndex + 1) / preguntas.length) * 100;
  const valorActual = respuestas.get(pregunta.idPregunta) || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-sm font-semibold text-gray-500 uppercase">
                  Pregunta {preguntaActualIndex + 1} de {preguntas.length}
                </span>
                <h3 className="text-lg font-bold text-blue-600 mt-1">{pregunta.bloque}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-blue-600">{Math.round(progreso)}%</span>
                <p className="text-xs text-gray-500">Completado</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            {pregunta.enunciado}
          </h2>

          <div className="space-y-4 mb-10">
            {pregunta.tipo === TipoPregunta.SELECCION_SIMPLE && pregunta.opciones && (
              <div className="space-y-3">
                {pregunta.opciones.map((opcion, idx) => (
                  <label 
                    key={idx}
                    className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                      valorActual === opcion
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`pregunta-${pregunta.idPregunta}`}
                      value={opcion}
                      checked={valorActual === opcion}
                      onChange={(e) => handleRespuesta(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="ml-4 text-gray-700 font-medium">{opcion}</span>
                  </label>
                ))}
              </div>
            )}

            {pregunta.tipo === TipoPregunta.TEXTO && (
              <input
                type="text"
                value={valorActual}
                onChange={(e) => handleRespuesta(e.target.value)}
                className="w-full p-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Escribe tu respuesta aquí..."
              />
            )}

            {pregunta.tipo === TipoPregunta.NUMERICO && (
              <input
                type="number"
                value={valorActual}
                onChange={(e) => handleRespuesta(e.target.value)}
                className="w-full p-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Ingresa un número"
              />
            )}

            {pregunta.tipo === TipoPregunta.BOOLEAN && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleRespuesta('Sí')}
                  className={`flex-1 p-6 border-2 rounded-xl font-bold text-lg transition-all ${
                    valorActual === 'Sí'
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  ✓ Sí
                </button>
                <button
                  onClick={() => handleRespuesta('No')}
                  className={`flex-1 p-6 border-2 rounded-xl font-bold text-lg transition-all ${
                    valorActual === 'No'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  ✗ No
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
            <button
              onClick={anterior}
              disabled={preguntaActualIndex === 0}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            {preguntaActualIndex < preguntas.length - 1 ? (
              <button
                onClick={siguiente}
                disabled={!valorActual}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={finalizar}
                disabled={!valorActual || submitting}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Finalizando...' : 'Finalizar ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import RecomendacionesView from './RecomendacionesView';
import { generarRecomendaciones } from './actions';

// ISR: Revalidar cada 30 minutos
export const revalidate = 1800;

interface PageProps {
  searchParams: { id?: string; rut?: string };
}

export default async function RecomendacionesPage({ searchParams }: PageProps) {
  const idCuestionario = searchParams.id;
  const rut = searchParams.rut || '12345678-9';

  if (!idCuestionario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">No se especificó el ID del cuestionario</p>
          <a
            href="/cuestionario"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Volver al Cuestionario
          </a>
        </div>
      </div>
    );
  }

  try {
    const { perfil, recomendaciones } = await generarRecomendaciones(
      parseInt(idCuestionario),
      rut
    );

    return (
      <Suspense fallback={<LoadingState />}>
        <RecomendacionesView perfil={perfil} recomendaciones={recomendaciones} />
      </Suspense>
    );
  } catch (error: any) {
    console.error('[RecomendacionesPage] Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error.message || 'Error al generar recomendaciones'}</p>
          <a
            href="/cuestionario"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Volver al Cuestionario
          </a>
        </div>
      </div>
    );
  }
}

function LoadingState() {
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

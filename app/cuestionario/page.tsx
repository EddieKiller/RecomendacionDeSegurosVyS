import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';
import { EstadoCuestionario } from '@/src/domain/types/enums';
import CuestionarioInteractivo from './CuestionarioInteractivo';

// ISR: Revalidar cada 1 hora
export const revalidate = 3600;

export default async function CuestionarioPage() {
  const rut = '12.345.678-9'; // En producción, vendría de autenticación

  try {
    const container = DependencyContainer.getInstance();
    const useCase = container.getGestionarCuestionarioUseCase();

    // Iniciar o recuperar cuestionario existente
    // El método iniciarCuestionario maneja internamente si ya existe uno activo
    const cuestionario = await useCase.iniciarCuestionario(rut);
    const idCuestionario = cuestionario.idCuestionario;

    if (!idCuestionario) {
      throw new Error('No se pudo crear el cuestionario');
    }

    // Cargar preguntas si es necesario (funciona en ambos estados: INICIADO y EN_PROGRESO)
    let cuestionarioActualizado = useCase.getCuestionario();
    
    if (!cuestionarioActualizado || cuestionarioActualizado.preguntas.length === 0) {
      await useCase.ejecutarAccion('cargar_preguntas', {});
      cuestionarioActualizado = useCase.getCuestionario();
    }

    const preguntas = cuestionarioActualizado?.preguntas || [];

    if (preguntas.length === 0) {
      throw new Error('No hay preguntas disponibles');
    }

    // Obtener respuestas existentes
    const respuestasExistentes = cuestionarioActualizado?.respuestas || [];
    const respuestasMap: Record<number, string> = {};
    respuestasExistentes.forEach(r => {
      respuestasMap[r.idPregunta] = r.valor;
    });

    // Serializar preguntas con dependencias para el componente cliente
    const preguntasSerializadas = preguntas.map(p => ({
      idPregunta: p.idPregunta,
      enunciado: p.enunciado,
      opciones: p.opciones,
      tipo: p.tipo,
      bloque: p.bloque,
      orden: p.orden,
      tieneDependencias: p.dependencias.length > 0,
      dependencias: p.dependencias.map(d => ({
        idPreguntaPadre: d.idPreguntaPadre,
        operador: d.operador,
        valorEsperado: d.valorEsperado
      }))
    }));

    // Pasar datos al componente cliente
    return (
      <CuestionarioInteractivo 
        preguntasIniciales={preguntasSerializadas}
        respuestasIniciales={respuestasMap}
        idCuestionario={idCuestionario!}
        rut={rut}
      />
    );

  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error.message || 'Error al cargar el cuestionario'}</p>
            <a
              href="/cuestionario"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Reintentar
            </a>
          </div>
        </div>
      </div>
    );
  }
}

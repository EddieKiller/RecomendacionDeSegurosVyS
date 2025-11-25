import { NextResponse } from 'next/server';
import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';

/**
 * Formatea RUT de "12345678-9" a "12.345.678-9"
 */
function formatearRut(rut: string): string {
  if (rut.includes('.')) return rut;
  const [numero, dv] = rut.split('-');
  const reversed = numero.split('').reverse().join('');
  const parts: string[] = [];
  for (let i = 0; i < reversed.length; i += 3) {
    parts.push(reversed.substring(i, i + 3));
  }
  const formatted = parts.map(p => p.split('').reverse().join('')).reverse().join('.');
  return `${formatted}-${dv}`;
}

/**
 * API de prueba para Locust.io
 * POST /api/test/respuesta - Guardar respuesta a pregunta
 */
export async function POST(req: Request) {
  let idCuestionario: string | undefined;
  let idPregunta: string | undefined;
  let valor: string | undefined;
  let rut: string | undefined;
  
  try {
    const body = await req.json();
    idCuestionario = body.idCuestionario;
    idPregunta = body.idPregunta;
    valor = body.valor;
    rut = body.rut ? formatearRut(body.rut) : undefined;

    if (!idCuestionario || !idPregunta || !valor || !rut) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (idCuestionario, idPregunta, valor, rut)' },
        { status: 400 }
      );
    }

    const container = DependencyContainer.getInstance();
    const useCase = container.getGestionarCuestionarioUseCase();

    // Recuperar cuestionario existente
    await useCase.iniciarCuestionario(rut);
    
    // Cargar preguntas si no están cargadas
    const cuestionario = useCase.getCuestionario();
    if (!cuestionario || cuestionario.preguntas.length === 0) {
      await useCase.ejecutarAccion('cargar_preguntas', {});
    }

    // Guardar respuesta
    await useCase.ejecutarAccion('responder', {
      idPregunta: parseInt(idPregunta),
      valor
    });

    const cuestionarioActualizado = useCase.getCuestionario();
    const respuestasActuales = cuestionarioActualizado?.respuestas || [];

    return NextResponse.json({
      success: true,
      idCuestionario,
      idPregunta,
      totalRespuestas: respuestasActuales.length,
      estado: cuestionarioActualizado?.estado || 'EN_PROGRESO'
    });

  } catch (error: any) {
    console.error('[API Test Respuesta] Error completo:', error);
    console.error('[API Test Respuesta] Stack:', error.stack);
    console.error('[API Test Respuesta] Params:', { idCuestionario, idPregunta, valor, rut });
    
    return NextResponse.json(
      { 
        error: error.message || error.toString() || 'Error al guardar respuesta',
        type: error.constructor?.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

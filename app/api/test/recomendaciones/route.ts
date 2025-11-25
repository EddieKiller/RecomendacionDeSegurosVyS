import { NextResponse } from 'next/server';
import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';
import { CuestionarioRepoAdapter } from '@/src/application/adapters/repositorio/CuestionarioRepoAdapter';
import { UsuarioRepoAdapter } from '@/src/application/adapters/repositorio/UsuarioRepoAdapter';
import { CuestionarioRepositoryDB } from '@/src/infrastructure/repository/CuestionarioRepositoryDB';
import { UsuarioRepositoryDB } from '@/src/infrastructure/repository/UsuarioRepositoryDB';
import { TipoPregunta } from '@/src/domain/types/enums';

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
 * POST /api/test/recomendaciones - Generar recomendaciones
 */
export async function POST(req: Request) {
  let idCuestionario: string | undefined;
  let rut: string | undefined;
  
  try {
    const body = await req.json();
    idCuestionario = body.idCuestionario;
    rut = body.rut ? formatearRut(body.rut) : undefined;

    if (!idCuestionario || !rut) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (idCuestionario, rut)' },
        { status: 400 }
      );
    }

    const container = DependencyContainer.getInstance();
    const evaluarUseCase = container.getEvaluarPerfilRiesgoUseCase();
    const recomendacionesUseCase = container.getGenerarRecomendacionesUseCase();

    // Obtener usuario y cuestionario
    const cuestionarioRepoAdapter = new CuestionarioRepoAdapter(new CuestionarioRepositoryDB());
    const usuarioRepoAdapter = new UsuarioRepoAdapter(new UsuarioRepositoryDB());
    
    const usuario = await usuarioRepoAdapter.findByRut(rut);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    let cuestionario = await cuestionarioRepoAdapter.findById(parseInt(idCuestionario));
    if (!cuestionario) {
      return NextResponse.json({ error: 'Cuestionario no encontrado' }, { status: 404 });
    }

    // Cargar preguntas en el cuestionario (necesario para verificar si está completo)
    const allPreguntas = await cuestionarioRepoAdapter.getAllPreguntas();
    cuestionario.cargarPreguntas(allPreguntas);

    // SOLO PARA PRUEBAS: Si el cuestionario no está completo, completarlo con respuestas dummy
    if (!cuestionario.estaCompleto()) {
      console.log(`[API Test Recomendaciones] Cuestionario ${idCuestionario} incompleto (progreso: ${cuestionario.calcularProgreso()}%), auto-completando...`);
      
      const useCase = container.getGestionarCuestionarioUseCase();
      
      // Iniciar cuestionario para cargar el estado
      await useCase.iniciarCuestionario(rut);
      
      // Cargar preguntas en el useCase
      await useCase.ejecutarAccion('cargar_preguntas', {});
      
      // Obtener preguntas sin responder
      const preguntasSinResponder = cuestionario.preguntas.filter(
        p => !cuestionario.respuestas.some(r => r.idPregunta === p.idPregunta)
      );
      
      console.log(`[API Test Recomendaciones] Completando ${preguntasSinResponder.length} preguntas faltantes`);
      
      for (const pregunta of preguntasSinResponder) {
        try {
          // Generar respuesta dummy válida según tipo
          let valorDummy = 'No';
          
          if (pregunta.tipo === TipoPregunta.MULTISELECCION) {
            // MULTISELECCION requiere JSON string
            valorDummy = pregunta.opciones && pregunta.opciones.length > 0 
              ? JSON.stringify([pregunta.opciones[0]]) 
              : JSON.stringify(['Opción 1']);
          } else if (pregunta.tipo === TipoPregunta.SELECCION_SIMPLE) {
            // SELECCION_SIMPLE requiere una opción válida
            valorDummy = pregunta.opciones && pregunta.opciones.length > 0 
              ? pregunta.opciones[0] 
              : 'Opción 1';
          } else if (pregunta.tipo === TipoPregunta.NUMERICO) {
            valorDummy = '25';
          } else if (pregunta.tipo === TipoPregunta.BOOLEAN) {
            valorDummy = 'No';
          } else {
            // TEXTO o TEXTO_LARGO
            valorDummy = 'Respuesta de prueba';
          }
          
          await useCase.ejecutarAccion('responder', {
            idPregunta: pregunta.idPregunta,
            valor: valorDummy
          });
        } catch (err: any) {
          console.log(`[API Test Recomendaciones] Error en pregunta ${pregunta.idPregunta} (${pregunta.tipo}):`, err.message);
        }
      }
      
      // Recargar cuestionario actualizado
      cuestionario = await cuestionarioRepoAdapter.findById(parseInt(idCuestionario));
      if (!cuestionario) {
        return NextResponse.json({ error: 'Error al recargar cuestionario' }, { status: 500 });
      }
      
      // CRITICAL: Volver a cargar preguntas después de reload
      cuestionario.cargarPreguntas(allPreguntas);
      
      console.log(`[API Test Recomendaciones] Auto-completado finalizado. Completo: ${cuestionario.estaCompleto()}`);
    }
    
    // Evaluar perfil
    const perfil = await evaluarUseCase.evaluar(usuario, cuestionario);
    
    // Generar recomendaciones
    const recomendaciones = await recomendacionesUseCase.generar(perfil);

    return NextResponse.json({
      perfil: {
        nivelRiesgo: perfil.nivelRiesgo,
        edad: perfil.edad,
        factoresRiesgo: perfil.factoresRiesgo.length,
        imc: perfil.imc,
        dependientes: perfil.dependientes
      },
      recomendaciones: recomendaciones.map(rec => ({
        idSeguro: rec.seguro.idSeguro,
        nombre: rec.seguro.nombre,
        tipo: rec.seguro.tipo,
        relevancia: rec.relevancia,
        prioridad: rec.prioridad,
        justificacion: rec.justificacion
      })),
      totalRecomendaciones: recomendaciones.length
    });

  } catch (error: any) {
    console.error('[API Test Recomendaciones] Error completo:', error);
    console.error('[API Test Recomendaciones] Stack:', error.stack);
    console.error('[API Test Recomendaciones] Params:', { idCuestionario, rut });
    
    return NextResponse.json(
      { 
        error: error.message || error.toString() || 'Error al generar recomendaciones',
        type: error.constructor?.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

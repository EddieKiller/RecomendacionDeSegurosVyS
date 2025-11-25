'use server';

import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';
import { redirect } from 'next/navigation';

/**
 * Server Action: Guardar respuesta de una pregunta
 */
export async function guardarRespuesta(
  idCuestionario: number,
  idPregunta: number,
  valor: string
) {
  try {
    const container = DependencyContainer.getInstance();
    const useCase = container.getGestionarCuestionarioUseCase();

    // Cargar el cuestionario existente desde la BD
    const cuestionarioRepo = container.getCuestionarioRepository();
    const cuestionario = await cuestionarioRepo.findById(idCuestionario);
    
    if (!cuestionario) {
      throw new Error(`Cuestionario ${idCuestionario} no encontrado`);
    }

    // Cargar el cuestionario en el useCase
    await useCase.cargarCuestionarioExistente(cuestionario);
    
    // Cargar preguntas si no están cargadas
    if (!cuestionario.preguntas || cuestionario.preguntas.length === 0) {
      await useCase.ejecutarAccion('cargar_preguntas', {});
    }

    // Ahora sí, guardar la respuesta
    await useCase.ejecutarAccion('responder', {
      idPregunta,
      valor
    });

    return { success: true };
  } catch (error: any) {
    console.error('[guardarRespuesta] Error:', error);
    throw new Error(error.message || 'Error al guardar respuesta');
  }
}

/**
 * Server Action: Completar cuestionario
 */
export async function completarCuestionario(idCuestionario: number) {
  try {
    const container = DependencyContainer.getInstance();
    const useCase = container.getGestionarCuestionarioUseCase();

    // Cargar el cuestionario existente desde la BD
    const cuestionarioRepo = container.getCuestionarioRepository();
    const cuestionario = await cuestionarioRepo.findById(idCuestionario);
    
    if (!cuestionario) {
      throw new Error(`Cuestionario ${idCuestionario} no encontrado`);
    }

    // Cargar el cuestionario en el useCase
    await useCase.cargarCuestionarioExistente(cuestionario);
    
    // Cargar preguntas si no están cargadas
    if (!cuestionario.preguntas || cuestionario.preguntas.length === 0) {
      await useCase.ejecutarAccion('cargar_preguntas', {});
    }

    // Completar cuestionario
    await useCase.ejecutarAccion('completar', {});

    return { success: true };
  } catch (error: any) {
    console.error('[completarCuestionario] Error:', error);
    throw new Error(error.message || 'Error al completar cuestionario');
  }
}

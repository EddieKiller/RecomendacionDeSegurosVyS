'use server';

import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';
import { CuestionarioRepoAdapter } from '@/src/application/adapters/repositorio/CuestionarioRepoAdapter';
import { CuestionarioRepositoryDB } from '@/src/infrastructure/repository/CuestionarioRepositoryDB';
import { UsuarioRepoAdapter } from '@/src/application/adapters/repositorio/UsuarioRepoAdapter';
import { UsuarioRepositoryDB } from '@/src/infrastructure/repository/UsuarioRepositoryDB';
import { NivelRiesgo, TipoSeguro } from '@/src/domain/types/enums';

interface PerfilRiesgoDTO {
  nivelRiesgo: NivelRiesgo;
  puntajeTotal: number;
  factoresRiesgo: string[];
  factoresProteccion: string[];
  edad: number;
  imc?: number;
}

interface RecomendacionDTO {
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

export async function generarRecomendaciones(
  idCuestionario: number,
  rut: string
): Promise<{
  perfil: PerfilRiesgoDTO;
  recomendaciones: RecomendacionDTO[];
}> {
  try {
    const container = DependencyContainer.getInstance();

    // Cargar Usuario y Cuestionario
    const cuestionarioRepoAdapter = new CuestionarioRepoAdapter(
      new CuestionarioRepositoryDB()
    );
    const usuarioRepoAdapter = new UsuarioRepoAdapter(
      new UsuarioRepositoryDB()
    );

    const usuario = await usuarioRepoAdapter.findByRut(rut);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const cuestionario = await cuestionarioRepoAdapter.findById(idCuestionario);
    if (!cuestionario) {
      throw new Error('Cuestionario no encontrado');
    }

    // Cargar preguntas si no están cargadas (necesarias para estaCompleto())
    if (cuestionario.preguntas.length === 0) {
      const preguntas = await cuestionarioRepoAdapter.getAllPreguntas();
      cuestionario.cargarPreguntas(preguntas);
    }

    // CU-3: Evaluar Perfil de Riesgo
    const evaluarUseCase = container.getEvaluarPerfilRiesgoUseCase();
    const perfilResult = await evaluarUseCase.evaluar(usuario, cuestionario);

    const perfil: PerfilRiesgoDTO = {
      nivelRiesgo: perfilResult.nivelRiesgo,
      puntajeTotal: perfilResult.calcularPuntajeTotal(),
      factoresRiesgo: perfilResult.factoresRiesgo,
      factoresProteccion: perfilResult.factoresProteccion,
      edad: perfilResult.edad || 0,
      imc: perfilResult.imc
    };

    // CU-4: Generar Recomendaciones
    const recomendacionesUseCase = container.getGenerarRecomendacionesUseCase();
    const recomendacionesResult = await recomendacionesUseCase.generar(perfilResult);

    const recomendaciones: RecomendacionDTO[] = recomendacionesResult.map(rec => ({
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

    return { perfil, recomendaciones };

  } catch (error: any) {
    console.error('[generarRecomendaciones] Error:', error);
    throw new Error(error.message || 'Error al generar recomendaciones');
  }
}

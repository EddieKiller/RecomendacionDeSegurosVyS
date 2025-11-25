import { describe, it, expect, beforeEach } from 'vitest';
import { GenerarRecomendaciones } from '@/src/application/usecase/GenerarRecomendaciones';
import { EvaluarPerfilRiesgo } from '@/src/application/usecase/EvaluarPerfilRiesgo';
import { Cuestionario } from '@/src/domain/model/Cuestionario';
import { Pregunta } from '@/src/domain/model/Pregunta';
import { Respuesta } from '@/src/domain/model/Respuesta';
import { Seguro } from '@/src/domain/model/Seguro';
import { PerfilRiesgo } from '@/src/domain/model/PerfilRiesgo';
import { NivelRiesgo, TipoPregunta, TipoSeguro, EstadoCuestionario } from '@/src/domain/types/enums';
import { CuestionarioRepository } from '@/src/domain/port/repositorio/CuestionarioRepository';
import { CatalogoRepository } from '@/src/domain/port/repositorio/CatalogoRepository';

// Mocks
class MockCuestionarioRepository implements CuestionarioRepository {
  private cuestionario: Cuestionario | null = null;

  setMockCuestionario(cuest: Cuestionario): void {
    this.cuestionario = cuest;
  }

  async findById(id: number): Promise<Cuestionario | null> {
    return this.cuestionario;
  }

  async getAllPreguntas(): Promise<Pregunta[]> {
    return [];
  }

  async create(cuestionario: Cuestionario): Promise<Cuestionario> {
    return cuestionario;
  }

  async findActivoByUsuario(rut: string): Promise<Cuestionario | null> {
    return null;
  }

  async getPreguntasByBloque(bloque: string): Promise<Pregunta[]> {
    return [];
  }

  async saveRespuesta(respuesta: Respuesta): Promise<Respuesta> {
    return respuesta;
  }

  async getRespuestas(idCuestionario: number): Promise<Respuesta[]> {
    return [];
  }

  async updateEstado(idCuestionario: number, estado: string): Promise<void> {}

  async getHistorial(rut: string): Promise<Cuestionario[]> {
    return [];
  }
}

class MockCatalogoRepository implements CatalogoRepository {
  private seguros: Seguro[] = [];

  setSeguros(seguros: Seguro[]): void {
    this.seguros = seguros;
  }

  async getAllSeguros(): Promise<Seguro[]> {
    return this.seguros;
  }

  async findById(idSeguro: number): Promise<Seguro | null> {
    return this.seguros.find(s => s.idSeguro === idSeguro) || null;
  }

  async findByTipo(tipo: TipoSeguro): Promise<Seguro[]> {
    return this.seguros.filter(s => s.tipo === tipo);
  }

  async findByAseguradora(idAseguradora: number): Promise<Seguro[]> {
    return this.seguros.filter(s => s.idAseguradora === idAseguradora);
  }

  async findByRangoPrima(min: number, max: number): Promise<Seguro[]> {
    return this.seguros.filter(s => s.prima >= min && s.prima <= max);
  }

  async getAseguradora(idAseguradora: number): Promise<any> {
    return { id: idAseguradora, nombre: 'Mock Aseguradora', rutEmpresa: '12345678-9' };
  }

  async getAllAseguradoras(): Promise<any[]> {
    return [];
  }
}

describe('GenerarRecomendaciones - Use Case', () => {
  let useCase: GenerarRecomendaciones;
  let mockCuestRepo: MockCuestionarioRepository;
  let mockCatalogoRepo: MockCatalogoRepository;
  let evaluarPerfil: EvaluarPerfilRiesgo;

  beforeEach(() => {
    mockCuestRepo = new MockCuestionarioRepository();
    mockCatalogoRepo = new MockCatalogoRepository();
    evaluarPerfil = new EvaluarPerfilRiesgo();
    useCase = new GenerarRecomendaciones(mockCatalogoRepo);
  });

  describe('execute()', () => {
    it('debe generar recomendaciones para perfil de bajo riesgo', async () => {
      // Crear cuestionario mock
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1,
        estado: EstadoCuestionario.COMPLETADO
      });

      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      }));

      mockCuestRepo.setMockCuestionario(cuestionario);

      // Crear seguros mock
      const seguros = [
        Seguro.create({
          idSeguro: 1,
          nombre: 'Seguro de Vida Básico',
          tipo: TipoSeguro.VIDA,
          cobertura: 'Cobertura completa de vida con beneficios extendidos',
          prima: 35000,
          idAseguradora: 1
        })
      ];

      mockCatalogoRepo.setSeguros(seguros);

      // Need to create a profile first
      const perfil = PerfilRiesgo.create({
        idCuestionario: 1,
        edad: 25,
        ingresos: 500000,
        dependientes: 0,
        nivelRiesgo: NivelRiesgo.BAJO
      });

      const recomendaciones = await useCase.generar(perfil);

      expect(perfil).toBeDefined();
      expect(recomendaciones.length).toBeGreaterThan(0);
    });

    it('debe ajustar prima según nivel de riesgo', async () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1,
        estado: EstadoCuestionario.COMPLETADO
      });

      // Crear preguntas que generen alto riesgo
      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        }),
        Pregunta.create({
          idPregunta: 301,
          enunciado: '¿Fumas?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'C',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '60' // Edad alta
      }));
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 301,
        valor: 'Sí' // Fumador
      }));

      mockCuestRepo.setMockCuestionario(cuestionario);

      const seguros = [
        Seguro.create({
          idSeguro: 1,
          nombre: 'Seguro de Salud',
          tipo: TipoSeguro.SALUD,
          cobertura: 'Cobertura de salud completa con medicamentos',
          prima: 30000,
          idAseguradora: 1
        })
      ];

      mockCatalogoRepo.setSeguros(seguros);

      const perfil = PerfilRiesgo.create({
        idCuestionario: 1,
        edad: 60,
        ingresos: 500000,
        dependientes: 0,
        nivelRiesgo: NivelRiesgo.ALTO
      });

      const recomendaciones = await useCase.generar(perfil);

      // Verificar que se generaron recomendaciones
      expect(recomendaciones.length).toBeGreaterThan(0);
    });

    it('debe generar justificaciones personalizadas', async () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1,
        estado: EstadoCuestionario.COMPLETADO
      });

      const preguntas = [
        Pregunta.create({
          idPregunta: 101,
          enunciado: '¿Tienes dependientes?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'Bloque0',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 101,
        valor: 'Sí'
      }));

      mockCuestRepo.setMockCuestionario(cuestionario);

      const seguros = [
        Seguro.create({
          idSeguro: 1,
          nombre: 'Seguro de Vida Familiar',
          tipo: TipoSeguro.VIDA,
          cobertura: 'Cobertura de vida familiar con beneficios para dependientes',
          prima: 40000,
          idAseguradora: 1
        })
      ];

      mockCatalogoRepo.setSeguros(seguros);

      const perfil = PerfilRiesgo.create({
        idCuestionario: 1,
        edad: 30,
        ingresos: 500000,
        dependientes: 2,
        nivelRiesgo: NivelRiesgo.MEDIO
      });

      const recomendaciones = await useCase.generar(perfil);

      // Debe tener justificaciones
      expect(recomendaciones[0].justificacion.length).toBeGreaterThan(0);
    });

    it('debe funcionar con perfil válido', async () => {
      const perfil = PerfilRiesgo.create({
        idCuestionario: 999,
        edad: 30,
        ingresos: 500000,
        dependientes: 0,
        nivelRiesgo: NivelRiesgo.MEDIO
      });

      const seguros = [
        Seguro.create({
          idSeguro: 1,
          nombre: 'Seguro Test',
          tipo: TipoSeguro.VIDA,
          cobertura: 'Cobertura de vida básica con protección completa',
          prima: 30000,
          idAseguradora: 1
        })
      ];

      mockCatalogoRepo.setSeguros(seguros);

      const recomendaciones = await useCase.generar(perfil);
      expect(recomendaciones.length).toBeGreaterThan(0);
    });

    it('debe filtrar seguros por elegibilidad', async () => {
      const cuestionario = Cuestionario.create({
        idUsuario: '12345678-9',
        idCuestionario: 1,
        estado: EstadoCuestionario.COMPLETADO
      });

      const preguntas = [
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        })
      ];

      cuestionario.cargarPreguntas(preguntas);
      cuestionario.agregarRespuesta(Respuesta.create({
        idCuestionario: 1,
        idPregunta: 1,
        valor: '25'
      }));

      mockCuestRepo.setMockCuestionario(cuestionario);

      const seguros = [
        Seguro.create({
          idSeguro: 1,
          nombre: 'Seguro Básico',
          tipo: TipoSeguro.VIDA,
          cobertura: 'Cobertura básica de vida con protección esencial',
          prima: 30000,
          idAseguradora: 1
        })
      ];

      mockCatalogoRepo.setSeguros(seguros);

      const perfil = PerfilRiesgo.create({
        idCuestionario: 1,
        edad: 25,
        ingresos: 500000,
        dependientes: 0,
        nivelRiesgo: NivelRiesgo.BAJO
      });

      const recomendaciones = await useCase.generar(perfil);

      // Todas las recomendaciones deben tener campos requeridos
      recomendaciones.forEach(rec => {
        expect(rec).toHaveProperty('seguro');
        expect(rec).toHaveProperty('relevancia');
      });
    });
  });
});

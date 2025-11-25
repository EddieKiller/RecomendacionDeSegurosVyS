import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GestionarCuestionario } from '@/src/application/usecase/GestionarCuestionario';
import { Cuestionario } from '@/src/domain/model/Cuestionario';
import { Pregunta } from '@/src/domain/model/Pregunta';
import { Respuesta } from '@/src/domain/model/Respuesta';
import { EstadoCuestionario, TipoPregunta } from '@/src/domain/types/enums';
import { CuestionarioRepository } from '@/src/domain/port/repositorio/CuestionarioRepository';
import { UsuarioRepository } from '@/src/domain/port/repositorio/UsuarioRepository';

// Mocks de repositorios
class MockCuestionarioRepository implements CuestionarioRepository {
  private cuestionarios: Map<number, Cuestionario> = new Map();
  private preguntas: Pregunta[] = [];
  private nextId = 1;

  async create(cuestionario: Cuestionario): Promise<Cuestionario> {
    const newCuest = Cuestionario.create({
      idUsuario: cuestionario.idUsuario,
      estado: cuestionario.estado,
      fecha: cuestionario.fecha,
      idCuestionario: this.nextId++
    });
    this.cuestionarios.set(newCuest.idCuestionario!, newCuest);
    return newCuest;
  }

  async findById(id: number): Promise<Cuestionario | null> {
    return this.cuestionarios.get(id) || null;
  }

  async findActivoByUsuario(rut: string): Promise<Cuestionario | null> {
    return Array.from(this.cuestionarios.values())
      .find(c => c.idUsuario === rut) || null;
  }

  async getAllPreguntas(): Promise<Pregunta[]> {
    return this.preguntas;
  }

  async getPreguntasByBloque(bloque: string): Promise<Pregunta[]> {
    return this.preguntas.filter(p => p.bloque === bloque);
  }

  async saveRespuesta(respuesta: Respuesta): Promise<Respuesta> {
    return respuesta;
  }

  async getRespuestas(idCuestionario: number): Promise<Respuesta[]> {
    const cuest = this.cuestionarios.get(idCuestionario);
    return cuest?.respuestas || [];
  }

  async updateEstado(idCuestionario: number, estado: string): Promise<void> {
    // Mock implementation
  }

  async save(cuestionario: Cuestionario): Promise<void> {
    if (cuestionario.idCuestionario) {
      this.cuestionarios.set(cuestionario.idCuestionario, cuestionario);
    }
  }

  async getHistorial(rut: string): Promise<Cuestionario[]> {
    return Array.from(this.cuestionarios.values())
      .filter(c => c.idUsuario === rut);
  }

  // Helper para tests
  setPreguntas(preguntas: Pregunta[]): void {
    this.preguntas = preguntas;
  }
}

class MockUsuarioRepository implements UsuarioRepository {
  async findByRut(rut: string): Promise<any> {
    return { rut, nombre: 'Test User', email: 'test@test.com', fechaNacimiento: new Date('1990-01-01') };
  }

  async create(usuario: any): Promise<any> {
    return usuario;
  }

  async update(usuario: any): Promise<any> {
    return usuario;
  }

  async save(usuario: any): Promise<any> {
    return usuario;
  }

  async consultarRegistroCivil(rut: string): Promise<any> {
    return { rut, nombre: 'Test', fechaNacimiento: new Date('1990-01-01') };
  }

  async exists(rut: string): Promise<boolean> {
    return true;
  }

  async findAll(): Promise<any[]> {
    return [];
  }
}

describe('GestionarCuestionario - Use Case', () => {
  let useCase: GestionarCuestionario;
  let mockCuestRepo: MockCuestionarioRepository;
  let mockUserRepo: MockUsuarioRepository;

  beforeEach(() => {
    mockCuestRepo = new MockCuestionarioRepository();
    mockUserRepo = new MockUsuarioRepository();
    useCase = new GestionarCuestionario(mockCuestRepo, mockUserRepo);
  });

  describe('iniciarCuestionario()', () => {
    it('debe crear nuevo cuestionario para usuario sin cuestionario activo', async () => {
      const cuestionario = await useCase.iniciarCuestionario('12345678-9');

      expect(cuestionario).toBeDefined();
      expect(cuestionario.idUsuario).toBe('12345678-9');
      expect(cuestionario.estado).toBe(EstadoCuestionario.INICIADO);
    });

    it('debe recuperar cuestionario existente si usuario ya tiene uno', async () => {
      // Crear primer cuestionario
      const cuest1 = await useCase.iniciarCuestionario('12345678-9');
      const id1 = cuest1.idCuestionario;

      // Intentar iniciar otro cuestionario con el mismo RUT
      const cuest2 = await useCase.iniciarCuestionario('12345678-9');
      const id2 = cuest2.idCuestionario;

      expect(id1).toBe(id2); // Debe ser el mismo cuestionario
    });
  });

  describe('ejecutarAccion() - Estado Pattern', () => {
    it('debe cargar preguntas en estado INICIADO', async () => {
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
      mockCuestRepo.setPreguntas(preguntas);

      await useCase.iniciarCuestionario('12345678-9');

      const resultado = await useCase.ejecutarAccion('cargar_preguntas', {});

      expect(resultado.success).toBe(true);
      expect(useCase.getCuestionario()?.preguntas.length).toBe(1);
    });

    it('debe responder pregunta en estado EN_PROGRESO', async () => {
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
      mockCuestRepo.setPreguntas(preguntas);

      await useCase.iniciarCuestionario('12345678-9');
      await useCase.ejecutarAccion('cargar_preguntas', {});

      const resultado = await useCase.ejecutarAccion('responder', {
        idPregunta: 1,
        valor: '25'
      });

      expect(resultado).toBeDefined();
      expect(useCase.getCuestionario()?.respuestas.length).toBe(1);
    });

    it('debe lanzar error al intentar responder en estado INICIADO', async () => {
      await useCase.iniciarCuestionario('12345678-9');

      await expect(
        useCase.ejecutarAccion('responder', { idPregunta: 1, valor: '25' })
      ).rejects.toThrow();
    });

    it('debe completar cuestionario cuando todas las respuestas están completas', async () => {
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
      mockCuestRepo.setPreguntas(preguntas);

      await useCase.iniciarCuestionario('12345678-9');
      await useCase.ejecutarAccion('cargar_preguntas', {});
      await useCase.ejecutarAccion('responder', { idPregunta: 1, valor: '25' });

      const resultado = await useCase.ejecutarAccion('completar', {});

      expect(resultado).toBeDefined();
      expect(useCase.getCuestionario()?.estado).toBe(EstadoCuestionario.COMPLETADO);
    });

    it('debe permitir editar respuesta en estado COMPLETADO', async () => {
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
      mockCuestRepo.setPreguntas(preguntas);

      await useCase.iniciarCuestionario('12345678-9');
      await useCase.ejecutarAccion('cargar_preguntas', {});
      await useCase.ejecutarAccion('responder', { idPregunta: 1, valor: '25' });
      await useCase.ejecutarAccion('completar', {});

      // Editar respuesta después de completado
      const resultado = await useCase.ejecutarAccion('editar_respuesta', {
        idPregunta: 1,
        valor: '30'
      });

      expect(resultado).toBeDefined();
      expect(useCase.getCuestionario()?.estado).toBe(EstadoCuestionario.EN_PROGRESO);
    });
  });

  describe('validarProgreso()', () => {
    it('debe retornar progreso correcto', async () => {
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
          idPregunta: 2,
          enunciado: '¿Fumas?',
          opciones: ['Sí', 'No'],
          tipo: TipoPregunta.SELECCION_SIMPLE,
          bloque: 'B',
          orden: 1
        })
      ];
      mockCuestRepo.setPreguntas(preguntas);

      await useCase.iniciarCuestionario('12345678-9');
      await useCase.ejecutarAccion('cargar_preguntas', {});
      await useCase.ejecutarAccion('responder', { idPregunta: 1, valor: '25' });

      const cuest = useCase.getCuestionario();

      expect(cuest?.preguntas.length).toBe(2);
      expect(cuest?.respuestas.length).toBe(1);
      expect(cuest?.estaCompleto()).toBe(false);
    });
  });

  describe('getCuestionario()', () => {
    it('debe retornar cuestionario actual', async () => {
      await useCase.iniciarCuestionario('12345678-9');

      const cuestionario = useCase.getCuestionario();

      expect(cuestionario).toBeDefined();
      expect(cuestionario?.idUsuario).toBe('12345678-9');
    });
  });

  describe('getEstadoActual()', () => {
    it('debe retornar nombre del estado actual', async () => {
      await useCase.iniciarCuestionario('12345678-9');

      const estado = useCase.getEstadoActual();

      expect(estado).toBe('Iniciado');
    });

    it('debe cambiar estado después de cargar preguntas', async () => {
      mockCuestRepo.setPreguntas([
        Pregunta.create({
          idPregunta: 1,
          enunciado: '¿Tu edad?',
          opciones: null,
          tipo: TipoPregunta.NUMERICO,
          bloque: 'A',
          orden: 1
        })
      ]);

      await useCase.iniciarCuestionario('12345678-9');
      await useCase.ejecutarAccion('cargar_preguntas', {});

      const estado = useCase.getEstadoActual();

      expect(estado).toBe('En Progreso');
    });
  });
});

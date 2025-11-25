import { NextResponse } from 'next/server';
import { DependencyContainer } from '@/src/infrastructure/container/DependencyContainer';
import { UsuarioRepoAdapter } from '@/src/application/adapters/repositorio/UsuarioRepoAdapter';
import { UsuarioRepositoryDB } from '@/src/infrastructure/repository/UsuarioRepositoryDB';
import { Usuario } from '@/src/domain/model/Usuario';

/**
 * API de prueba para Locust.io
 * POST /api/test/cuestionario - Iniciar cuestionario y cargar preguntas
 */
export async function POST(req: Request) {
  try {
    const { rut } = await req.json();

    if (!rut || typeof rut !== 'string') {
      return NextResponse.json(
        { error: 'RUT es requerido' },
        { status: 400 }
      );
    }

    // Formatear RUT al formato esperado (12.345.678-9)
    const formatearRut = (rut: string): string => {
      // Si ya tiene puntos, devolverlo tal cual
      if (rut.includes('.')) return rut;
      
      // Formato: 12345678-9 -> 12.345.678-9
      const [numero, dv] = rut.split('-');
      
      // Invertir para formatear de derecha a izquierda
      const reversed = numero.split('').reverse().join('');
      const parts: string[] = [];
      
      // Agrupar de 3 en 3
      for (let i = 0; i < reversed.length; i += 3) {
        parts.push(reversed.substring(i, i + 3));
      }
      
      // Re-invertir y unir con puntos
      const formatted = parts.map(p => p.split('').reverse().join('')).reverse().join('.');
      return `${formatted}-${dv}`;
    };

    const rutFormateado = formatearRut(rut);
    console.log(`[API Test] RUT original: ${rut}, RUT formateado: ${rutFormateado}`);

    // Crear usuario si no existe (para pruebas de carga)
    const usuarioRepo = new UsuarioRepoAdapter(new UsuarioRepositoryDB());
    let usuario = await usuarioRepo.findByRut(rutFormateado);
    
    if (!usuario) {
      try {
        const { Genero, EstadoCivil } = await import('@/src/domain/types/enums');
        const { MySQLAdapter } = await import('@/src/application/adapters/database/MySQLAdapter');
        const db = MySQLAdapter.getInstance();
        
        const fechaNacimiento = new Date('1990-01-01');
        
        // 1. Insertar en REGISTRO_CIVIL primero (FK requirement)
        const sqlRegistroCivil = `
          INSERT INTO REGISTRO_CIVIL (rut, nombre, fecha_nacimiento, genero, estado_civil)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE nombre = nombre
        `;
        
        await db.execute(sqlRegistroCivil, [
          rutFormateado,
          'Usuario Test Locust',
          fechaNacimiento,
          Genero.MASCULINO,
          EstadoCivil.SOLTERO
        ]);
        
        console.log(`[API Test] Registro Civil creado: ${rutFormateado}`);
        
        // 2. Crear usuario (ahora la FK se cumple)
        usuario = Usuario.create({
          rut: rutFormateado,
          nombre: 'Usuario Test Locust',
          fechaNacimiento,
          genero: Genero.MASCULINO,
          estadoCivil: EstadoCivil.SOLTERO
        });
        
        await usuarioRepo.save(usuario);
        console.log(`[API Test] Usuario creado con RUT: ${rutFormateado}`);
      } catch (validationError: any) {
        console.error('[API Test] Error validando RUT:', validationError.message);
        throw new Error(`RUT inválido: ${rutFormateado} - ${validationError.message}`);
      }
    }

    const container = DependencyContainer.getInstance();
    const useCase = container.getGestionarCuestionarioUseCase();

    // Iniciar o recuperar cuestionario
    const cuestionario = await useCase.iniciarCuestionario(rutFormateado);
    
    if (!cuestionario.idCuestionario) {
      throw new Error('No se pudo crear el cuestionario');
    }

    // Cargar preguntas
    await useCase.ejecutarAccion('cargar_preguntas', {});
    const cuestionarioActualizado = useCase.getCuestionario();
    
    const preguntas = cuestionarioActualizado?.preguntas || [];

    // Mapear preguntas con sus tipos y opciones para Locust
    const preguntasInfo = preguntas.map(p => ({
      id: p.idPregunta,
      tipo: p.tipo,
      opciones: p.opciones || []
    }));

    return NextResponse.json({
      idCuestionario: cuestionario.idCuestionario,
      rut: rutFormateado,
      totalPreguntas: preguntas.length,
      estado: cuestionarioActualizado?.estado || 'INICIADO',
      preguntasIds: preguntas.map(p => p.idPregunta), // IDs reales para Locust
      preguntas: preguntasInfo // Info completa para generar respuestas válidas
    });

  } catch (error: any) {
    console.error('[API Test Cuestionario] Error completo:', error);
    console.error('[API Test Cuestionario] Stack:', error.stack);
    console.error('[API Test Cuestionario] Tipo:', error.constructor.name);
    
    const errorMessage = error.message || error.toString() || 'Error desconocido';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        type: error.constructor.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

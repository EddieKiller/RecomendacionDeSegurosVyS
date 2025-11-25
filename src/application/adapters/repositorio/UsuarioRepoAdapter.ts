import { Usuario } from '../../../domain/model/Usuario';
import { UsuarioRepository } from '../../../domain/port/repositorio/UsuarioRepository';
import { DatosRegistroCivil } from '../../../domain/types/interfaces';

/**
 * Adapter para el repositorio de Usuario
 * Actúa como intermediario entre la capa de aplicación y la infraestructura
 * 
 * Este adaptador se inyectará con la implementación concreta desde infrastructure
 */
export class UsuarioRepoAdapter implements UsuarioRepository {
  
  constructor(private implementation: UsuarioRepository) {
    console.log('[UsuarioRepoAdapter] Inicializado');
  }

  async findByRut(rut: string): Promise<Usuario | null> {
    console.log(`[UsuarioRepoAdapter] Buscando usuario: ${rut}`);
    return await this.implementation.findByRut(rut);
  }

  async save(usuario: Usuario): Promise<Usuario> {
    console.log(`[UsuarioRepoAdapter] Guardando usuario: ${usuario.rut}`);
    return await this.implementation.save(usuario);
  }

  async consultarRegistroCivil(rut: string): Promise<DatosRegistroCivil | null> {
    console.log(`[UsuarioRepoAdapter] Consultando Registro Civil: ${rut}`);
    return await this.implementation.consultarRegistroCivil(rut);
  }

  async exists(rut: string): Promise<boolean> {
    return await this.implementation.exists(rut);
  }

  async findAll(): Promise<Usuario[]> {
    console.log('[UsuarioRepoAdapter] Listando todos los usuarios');
    return await this.implementation.findAll();
  }
}

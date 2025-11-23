import { Product } from '../../../domain/model/Product';
import { ProductRepository } from '../../../domain/port/repositorio/ProductRepository';
import { productRepositoryDB } from '../../../infrastructure/repository/ProductRepositoryDB';

export class ProductRepositoryAdapter implements ProductRepository {
  async save(product: Product): Promise<Product> {
    return productRepositoryDB.save(product);
  }

  async findById(id: string): Promise<Product | null> {
    return productRepositoryDB.findById(id);
  }

  async findAll(): Promise<Product[]> {
    return productRepositoryDB.findAll();
  }
}

export const productRepositoryAdapter = new ProductRepositoryAdapter();

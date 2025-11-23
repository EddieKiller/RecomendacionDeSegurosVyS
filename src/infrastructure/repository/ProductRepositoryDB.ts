import { Product } from '../../domain/model/Product';
import { ProductRepository } from '../../domain/port/ProductRepository';

export class ProductRepositoryDB implements ProductRepository {
  private items: Product[] = [];

  async save(product: Product): Promise<Product> {
    // For in-memory store we simply push the instance
    this.items.push(product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    const found = this.items.find((p) => p.id === id) ?? null;
    return found;
  }

  async findAll(): Promise<Product[]> {
    // return a shallow copy to avoid accidental mutation
    return [...this.items];
  }
}

// Export a singleton instance for in-memory persistence across requests
export const productRepositoryDB = new ProductRepositoryDB();

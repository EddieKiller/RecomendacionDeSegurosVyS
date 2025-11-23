import { Product } from '../../domain/model/Product';
import { ProductRepository } from '../../domain/port/ProductRepository';
import { ProductService, CreateProductDTO } from '../../domain/port/ProductService';

export class ProductServiceImpl implements ProductService {
  constructor(private repository: ProductRepository) {}

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    // business rules or domain logic would be applied here before saving
    const product = Product.create({ name: dto.name, price: dto.price });

    const saved = await this.repository.save(product);
    return saved;
  }
}

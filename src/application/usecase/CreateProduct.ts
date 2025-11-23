import { Product } from '../../domain/model/Product';
import { ProductService, CreateProductDTO } from '../../domain/port/ProductService';

export class CreateProduct {
  constructor(private productService: ProductService) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    // small application-level validation could go here
    return this.productService.createProduct(dto);
  }
}

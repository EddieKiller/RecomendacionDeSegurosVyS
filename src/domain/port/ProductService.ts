import { Product } from '../model/Product';

export type CreateProductDTO = {
  name: string;
  price: number;
};

export interface ProductService {
  createProduct(dto: CreateProductDTO): Promise<Product>;
}

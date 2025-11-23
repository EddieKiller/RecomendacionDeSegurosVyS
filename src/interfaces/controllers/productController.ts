import { CreateProduct } from '../../application/usecase/CreateProduct';
import { productRepositoryAdapter } from '../../application/adapters/repositorio/ProductRepositoryAdapter';
import { ProductServiceImpl } from '../../application/service/ProductServiceImpl';
import { CreateProductDTO } from '../../domain/port/ProductService';
import { Product } from '../../domain/model/Product';

/**
 * Thin controller layer that wires the use case and infrastructure for a request.
 * In a real app dependencies would be injected; here we instantiate minimal wiring
 * so the endpoint can exercise full path: controller -> usecase -> service -> repo.
 */
export async function createProductController(dto: CreateProductDTO): Promise<Product> {
  // Use repository adapter so controllers depend on application adapters rather than infra details
  const repo = productRepositoryAdapter;
  const service = new ProductServiceImpl(repo);
  const usecase = new CreateProduct(service);

  const product = await usecase.execute(dto);
  return product;
}

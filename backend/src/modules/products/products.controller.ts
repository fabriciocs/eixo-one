import { ProductsService } from './products.service';
import { AuthContext } from './policies/product.policy';

export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  async postProducts(body: Record<string, unknown>, auth: AuthContext, correlationId?: string) {
    return this.service.create(body, auth, correlationId);
  }
}

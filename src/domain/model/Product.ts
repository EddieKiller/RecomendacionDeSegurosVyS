export type ProductProps = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class Product {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = props;
  }

  static create(input: { name: string; price: number; id?: string; createdAt?: string }): Product {
    if (!input.name || typeof input.name !== 'string') {
      throw new Error('Product name is required and must be a string');
    }
    if (typeof input.price !== 'number' || Number.isNaN(input.price)) {
      throw new Error('Product price is required and must be a number');
    }

    const props: ProductProps = {
      id: input.id ?? generateId(),
      name: input.name,
      price: input.price,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };

    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
    return this.props.price;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  toJSON() {
    return { id: this.id, name: this.name, price: this.price, createdAt: this.createdAt };
  }
}

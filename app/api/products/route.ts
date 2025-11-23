import { NextResponse } from 'next/server';
import { createProductController } from '../../../src/interfaces/controllers/productController';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, price } = body ?? {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required and must be a string' }, { status: 400 });
    }
    if (typeof price !== 'number' || Number.isNaN(price)) {
      return NextResponse.json({ error: 'price is required and must be a number' }, { status: 400 });
    }

    const product = await createProductController({ name, price });

    // Product entity implements toJSON so it serializes cleanly
    return NextResponse.json(product.toJSON(), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

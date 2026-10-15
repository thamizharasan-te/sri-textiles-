import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { categories, getProduct, productImages, productSizes } from '@/lib/queries';
import { deleteProduct } from '../../../actions';
import DeleteButton from '@/components/admin/DeleteButton';

export const metadata = { title: 'பொருளைத் திருத்து' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id);
  const p = Number.isNaN(id) ? undefined : getProduct(id);
  if (!p) notFound();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">பொருளைத் திருத்து</h1>
      <ProductForm cats={categories()} product={p} images={productImages(p.id)} sizes={productSizes(p.id)} />
      <form action={deleteProduct} className="mt-8 border-t pt-4"><input type="hidden" name="id" value={p.id} /><DeleteButton msg="இந்தப் பொருளை முழுவதுமாக நீக்கவா? (பழைய ஆர்டர்கள் பாதிக்கப்படாது)">இந்தப் பொருளை நீக்கு</DeleteButton></form>
    </div>
  );
}

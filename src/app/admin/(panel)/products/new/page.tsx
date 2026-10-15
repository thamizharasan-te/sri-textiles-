import ProductForm from '@/components/admin/ProductForm';
import { categories } from '@/lib/queries';

export const metadata = { title: 'புதிய பொருள்' };
export default function NewProduct() {
  return (<div><h1 className="mb-4 text-2xl font-bold">புதிய பொருள் சேர்</h1><ProductForm cats={categories()} /></div>);
}

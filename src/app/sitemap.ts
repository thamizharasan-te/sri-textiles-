import type { MetadataRoute } from 'next';
import { listProducts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL || 'http://localhost:3000';
  const pages = ['', '/products', '/about', '/contact', '/policy'].map((p) => ({ url: site + p }));
  const products = (await listProducts({ limit: 1000 })).items.map((p) => ({ url: `${site}/products/${p.id}` }));
  return [...pages, ...products];
}

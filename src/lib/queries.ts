import { all, get } from './db';

export type Category = { id: number; name: string; sort: number };
export type Size = { id: number; product_id: number; label: string; detail: string; stock: number; sort: number };
export type Product = {
  id: number;
  name: string;
  description: string;
  category_id: number | null;
  category_name: string | null;
  price: number;
  mrp: number | null;
  fabric: string;
  color: string;
  gst_rate: number;
  size_info: string;
  featured: number;
  active: number;
  created_at: string;
  image: string | null;
  total_stock: number;
};

const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name,
    (SELECT file FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort, i.id LIMIT 1) AS image,
    COALESCE((SELECT SUM(stock) FROM product_sizes s WHERE s.product_id = p.id), 0) AS total_stock
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export const categories = () => all<Category>('SELECT * FROM categories ORDER BY sort, id');

export type Filters = {
  q?: string;
  category?: number;
  color?: string;
  fabric?: string;
  min?: number;
  max?: number;
  size?: string;
  sort?: string;
  page?: number;
  onlyActive?: boolean;
  limit?: number;
};

export async function listProducts(f: Filters = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.onlyActive !== false) where.push('p.active = 1');
  if (f.q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.fabric LIKE ? OR p.color LIKE ?)');
    const like = `%${f.q}%`;
    args.push(like, like, like, like);
  }
  if (f.category) { where.push('p.category_id = ?'); args.push(f.category); }
  if (f.color) { where.push('p.color = ?'); args.push(f.color); }
  if (f.fabric) { where.push('p.fabric = ?'); args.push(f.fabric); }
  if (f.min != null) { where.push('p.price >= ?'); args.push(f.min); }
  if (f.max != null) { where.push('p.price <= ?'); args.push(f.max); }
  if (f.size) { where.push('EXISTS (SELECT 1 FROM product_sizes s WHERE s.product_id = p.id AND s.label = ? AND s.stock > 0)'); args.push(f.size); }
  const order =
    f.sort === 'price_asc' ? 'p.price ASC' : f.sort === 'price_desc' ? 'p.price DESC' : 'p.id DESC';
  const limit = f.limit ?? 24;
  const offset = ((f.page ?? 1) - 1) * limit;
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = (await get<{ n: number }>(`SELECT COUNT(*) n FROM products p ${w}`, args))!.n;
  const items = await all<Product>(`${PRODUCT_SELECT} ${w} ORDER BY ${order} LIMIT ? OFFSET ?`, [...args, limit, offset]);
  return { items, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export const featuredProducts = (n = 8) =>
  all<Product>(`${PRODUCT_SELECT} WHERE p.active = 1 AND p.featured = 1 ORDER BY p.id DESC LIMIT ?`, [n]);

export const newProducts = (n = 8) => all<Product>(`${PRODUCT_SELECT} WHERE p.active = 1 ORDER BY p.id DESC LIMIT ?`, [n]);

export const getProduct = (id: number) => get<Product>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);

export const productImages = (id: number) =>
  all<{ id: number; file: string }>('SELECT id, file FROM product_images WHERE product_id = ? ORDER BY sort, id', [id]);

export const productSizes = (id: number) => all<Size>('SELECT * FROM product_sizes WHERE product_id = ? ORDER BY sort, id', [id]);

export async function filterOptions() {
  const [colors, fabrics, sizes] = await Promise.all([
    all<{ v: string }>("SELECT DISTINCT color v FROM products WHERE active=1 AND color<>'' ORDER BY color"),
    all<{ v: string }>("SELECT DISTINCT fabric v FROM products WHERE active=1 AND fabric<>'' ORDER BY fabric"),
    all<{ v: string }>('SELECT DISTINCT s.label v FROM product_sizes s JOIN products p ON p.id=s.product_id WHERE p.active=1 ORDER BY s.label'),
  ]);
  return { colors: colors.map((c) => c.v), fabrics: fabrics.map((c) => c.v), sizes: sizes.map((c) => c.v) };
}

/** முகப்புக்கு: ஒவ்வொரு வகையிலும் சில உடைகள் (+ வகையின் முகப்புப் படம்) */
export async function shelves(perCat = 4) {
  const cats = await categories();
  const out = await Promise.all(cats.map(async (c) => ({ cat: c, ...(await listProducts({ category: c.id, limit: perCat })) })));
  return out.filter((s) => s.items.length > 0);
}

import { db } from '@/lib/db';
import { categories } from '@/lib/queries';
import { deleteCategory, saveCategory } from '../../actions';
import DeleteButton from '@/components/admin/DeleteButton';

export const metadata = { title: 'வகைகள்' };

export default function Categories() {
  const cats = categories();
  const counts = new Map((db().prepare('SELECT category_id id, COUNT(*) n FROM products GROUP BY category_id').all() as { id: number; n: number }[]).map((r) => [r.id, r.n]));
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">வகைகள்</h1>
      <form action={saveCategory} className="card mt-4 flex gap-2 p-4"><input name="name" placeholder="புதிய வகை (எ.கா. பட்டுப் புடவைகள்)" required minLength={2} maxLength={60} /><button className="btn-primary shrink-0">சேர்</button></form>
      <div className="mt-4 space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-center gap-2 p-3">
            <form action={saveCategory} className="flex flex-1 gap-2"><input type="hidden" name="id" value={c.id} /><input name="name" defaultValue={c.name} required minLength={2} maxLength={60} /><button className="btn-outline !min-h-0 shrink-0 !py-2 text-sm">மாற்று</button></form>
            <span className="text-sm text-stone-500">{counts.get(c.id) ?? 0} பொருட்கள்</span>
            <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><DeleteButton msg="இந்த வகையை நீக்கவா? பொருட்கள் நீக்கப்படாது; வகை இல்லாமல் இருக்கும்.">நீக்கு</DeleteButton></form>
          </div>
        ))}
        {!cats.length && <p className="card p-6 text-center text-stone-500">வகைகள் இல்லை.</p>}
      </div>
    </div>
  );
}

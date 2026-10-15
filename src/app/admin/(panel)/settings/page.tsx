import SettingsForm from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'கடை அமைப்புகள்' };
export default function SettingsPage() {
  return (<div className="max-w-2xl"><h1 className="mb-4 text-2xl font-bold">கடை அமைப்புகள்</h1><SettingsForm s={getSettings()} /></div>);
}

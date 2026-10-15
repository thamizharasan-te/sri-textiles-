// பயன்பாடு: ADMIN_USERNAME=owner ADMIN_PASSWORD='...' npm run create-admin
// இருக்கும் பயனருக்கு இது புதிய கடவுச்சொல்லை அமைக்கும் (கடவுச்சொல் மறந்தால் இதையே பயன்படுத்தலாம்).
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';

const username = (process.env.ADMIN_USERNAME || 'owner').trim();
const password = process.env.ADMIN_PASSWORD || '';
if (password.length < 10) {
  console.error('ADMIN_PASSWORD குறைந்தது 10 எழுத்துகள் இருக்க வேண்டும்.');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
db().prepare('INSERT INTO admins(username,password_hash) VALUES(?,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash').run(username, hash);
db().prepare('DELETE FROM sessions').run();
console.log(`நிர்வாகி "${username}" தயார் ✓`);

// மாதிரித் தரவு (சோதனைக்கு மட்டும்). மீண்டும் சேர்க்க: npm run seed -- --force
import { q } from '../src/lib/db';
import { seedDemo } from '../src/lib/demo';

seedDemo(q, { force: process.argv.includes('--force') })
  .then((done) => console.log(done ? 'மாதிரிப் பொருட்கள் சேர்க்கப்பட்டன ✓' : 'ஏற்கனவே பொருட்கள் உள்ளன. மீண்டும் சேர்க்க --force பயன்படுத்தவும்.'))
  .catch((e) => { console.error(e); process.exit(1); });

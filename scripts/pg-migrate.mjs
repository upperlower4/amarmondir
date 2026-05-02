import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    acc[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
  }
  return acc;
}, {});

const client = new Client({
  connectionString: env.DATABASE_URL
});

async function run() {
  await client.connect();
  const sql = `
ALTER TABLE public.temples ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.temple_edits ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.temple_photos ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_temple_add INTEGER DEFAULT 10;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_edit_approved INTEGER DEFAULT 5;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_photo_approved INTEGER DEFAULT 2;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS points_rejection_penalty INTEGER DEFAULT 5;

UPDATE public.temples SET points_awarded = 10 WHERE status = 'approved' AND points_awarded = 0;
UPDATE public.temple_edits SET points_awarded = 5 WHERE status = 'approved' AND points_awarded = 0;
UPDATE public.temple_photos SET points_awarded = 2 WHERE status = 'approved' AND points_awarded = 0;

UPDATE public.temples SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
UPDATE public.temple_edits SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
UPDATE public.temple_photos SET points_awarded = -5 WHERE status = 'rejected' AND points_awarded = 0;
  `;
  try {
    const res = await client.query(sql);
    console.log('Success', res);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();

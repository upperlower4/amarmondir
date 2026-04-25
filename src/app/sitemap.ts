import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amarmondir.vercel.app';

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    '',
    '/directory',
    '/leaderboard',
    '/add-temple',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic temple routes
  try {
    const { data: temples } = await supabase
      .from('temples')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .is('deleted_at', null);

    if (temples) {
      const templeRoutes: MetadataRoute.Sitemap = temples.map((temple) => ({
        url: `${baseUrl}/temple/${temple.slug}`,
        lastModified: new Date(temple.updated_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
      routes.push(...templeRoutes);
    }
  } catch (error) {
    console.error('Error fetching temples for sitemap:', error);
  }

  return routes;
}

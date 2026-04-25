import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amarmondir.nav.bd'; // Default fallback

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/api/',
          '/*?q=*', // Disallow search queries to prevent indexing search result pages
          '/*?filter=*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

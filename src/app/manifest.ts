import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'amarmondir | Bangladesh Temple Directory',
    short_name: 'amarmondir',
    description: 'Explore and contribute to the database of temples in Bangladesh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    icons: [
      {
        src: 'https://res.cloudinary.com/dhavfhslp/image/upload/v1776825083/appicon_biqz1v.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}

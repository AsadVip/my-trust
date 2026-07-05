import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: 'https://mytrustearn.online/sitemap.xml',
  };
}

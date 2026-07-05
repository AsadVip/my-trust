import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mytrustearn.online';
  
  // Public routes to include in the index
  const routes = [
    '',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/login',
    '/register',
    '/forgot-password',
  ];

  return routes.map((route) => {
    let priority = 0.5;
    let changeFrequency: 'daily' | 'weekly' | 'monthly' = 'monthly';

    if (route === '') {
      priority = 1.0;
      changeFrequency = 'daily';
    } else if (route === '/register') {
      priority = 0.8;
      changeFrequency = 'weekly';
    } else if (route === '/faq' || route === '/contact') {
      priority = 0.7;
      changeFrequency = 'weekly';
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}

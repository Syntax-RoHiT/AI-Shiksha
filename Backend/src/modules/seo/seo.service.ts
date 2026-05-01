import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FranchisesService } from '../franchises/franchises.service';

@Injectable()
export class SeoService {
  constructor(
    private prisma: PrismaService,
    private franchisesService: FranchisesService,
  ) {}

  async generateBotHtml(domain: string, originalUrl: string): Promise<string> {
    const branding = await this.franchisesService.getBrandingByDomain(domain);
    
    const title = branding.seo_title || branding.lms_name || branding.name || 'AI Shiksha';
    const description = branding.seo_description || branding.description || '';
    const ogTitle = branding.seo_og_title || title;
    const ogDescription = branding.seo_og_description || description;
    
    // Ensure absolute URL for image
    let ogImage = branding.seo_og_image || branding.logo_url || '';
    if (ogImage && !ogImage.startsWith('http')) {
        // If it's a relative path (e.g. from local uploads), we need the full URL
        ogImage = `https://api.${domain}${ogImage}`; // Or wherever images are served from
        // Wait, if it's already an absolute URL (S3, Cloudfront), it will have http.
    }
    
    const twitterCard = branding.seo_twitter_card || 'summary_large_image';
    const twitterHandle = branding.seo_twitter_handle || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://${domain}${originalUrl}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDescription}">
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}

    <!-- Twitter -->
    <meta property="twitter:card" content="${twitterCard}">
    <meta property="twitter:url" content="https://${domain}${originalUrl}">
    <meta property="twitter:title" content="${ogTitle}">
    <meta property="twitter:description" content="${ogDescription}">
    ${ogImage ? `<meta property="twitter:image" content="${ogImage}">` : ''}
    ${twitterHandle ? `<meta name="twitter:site" content="${twitterHandle}">` : ''}
</head>
<body>
    <p>Loading...</p>
</body>
</html>`;
  }

  async generateSitemapXml(domain: string): Promise<string> {
    const branding = await this.franchisesService.getBrandingByDomain(domain);
    
    // Check if sitemap generation is enabled
    // Note: If domain is not found, getBrandingByDomain returns a fallback object which may not have seo_technical_sitemap property defined, so we default to true.
    const isSitemapEnabled = (branding as any).seo_technical_sitemap ?? true;
    
    if (!isSitemapEnabled) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    }

    const franchiseId = branding.id;
    let courses: { slug: string; updated_at: Date }[] = [];
    let categories: { slug: string }[] = [];

    if (franchiseId) {
        courses = await this.prisma.course.findMany({
            where: { franchise_id: franchiseId, status: 'PUBLISHED' },
            select: { slug: true, updated_at: true },
        });

        categories = await this.prisma.category.findMany({
            where: { franchise_id: franchiseId },
            select: { slug: true },
        });
    }

    const baseUrl = `https://${domain}`;
    
    const urls = [
      { loc: baseUrl, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/courses`, lastmod: new Date().toISOString() },
      ...categories.map(c => ({
        loc: `${baseUrl}/courses?category=${c.slug}`,
        lastmod: new Date().toISOString(),
      })),
      ...courses.map(c => ({
        loc: `${baseUrl}/course/${c.slug}`,
        lastmod: c.updated_at.toISOString(),
      })),
    ];

    const urlset = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
  }
}

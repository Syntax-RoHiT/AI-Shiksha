import { Controller, Get, Req, Res, Headers } from '@nestjs/common';
import { SeoService } from './seo.service';
import type { Request, Response } from 'express';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('bot-proxy')
  async getBotProxy(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('host') host: string,
    @Headers('x-original-uri') originalUri: string,
  ) {
    const domain = host ? host.split(':')[0] : 'localhost';
    // X-Original-URI is set by Caddy. If rewrite fired before the header was captured,
    // it may contain '/seo/bot-proxy' — fall back to '/' in that case.
    const url = (originalUri && originalUri !== '/seo/bot-proxy') ? originalUri : '/';
    const html = await this.seoService.generateBotHtml(domain, url);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('sitemap.xml')
  async getSitemap(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('host') host: string,
  ) {
    const domain = host ? host.split(':')[0] : 'localhost';
    const xml = await this.seoService.generateSitemapXml(domain);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  }
}

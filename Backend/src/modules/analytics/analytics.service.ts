import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

const ALGORITHM = 'aes-256-gcm';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  // ────── ENCRYPTION ──────
  private getEncryptionKey(): Buffer {
    const key = this.config.get<string>('ANALYTICS_ENCRYPTION_KEY') || 'default-fallback-secret-do-not-use';
    return crypto.createHash('sha256').update(String(key)).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getEncryptionKey(), iv);
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
  }

  private decrypt(data: string): string {
    const [ivHex, tagHex, enc] = data.split(':');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.getEncryptionKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let dec = decipher.update(enc, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  // ────── OAUTH HELPERS ──────
  async getOAuthCredentials() {
    // Check DB first
    const [clientIdSetting, clientSecretSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'google_analytics_client_id' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'google_analytics_client_secret' } })
    ]);

    const clientId = (clientIdSetting?.value || this.config.get<string>('GOOGLE_ANALYTICS_CLIENT_ID') || '').trim();
    const clientSecret = (clientSecretSetting?.value || this.config.get<string>('GOOGLE_ANALYTICS_CLIENT_SECRET') || '').trim();

    return { clientId, clientSecret };
  }

  async saveOAuthCredentials(clientId: string, clientSecret: string) {
    await this.prisma.systemSetting.upsert({
      where: { key: 'google_analytics_client_id' },
      update: { value: clientId.trim() },
      create: { key: 'google_analytics_client_id', value: clientId.trim() }
    });
    await this.prisma.systemSetting.upsert({
      where: { key: 'google_analytics_client_secret' },
      update: { value: clientSecret.trim() },
      create: { key: 'google_analytics_client_secret', value: clientSecret.trim() }
    });
    return { success: true };
  }

  async getOAuthUrl(franchiseId: string, frontendOrigin: string): Promise<string> {
    const { clientId } = await this.getOAuthCredentials();
    const redirectUri = this.config.get<string>('GOOGLE_ANALYTICS_REDIRECT_URI') || '';
    
    // Pass both franchise ID and the caller's origin in the state
    const stateObj = { f: franchiseId, o: frontendOrigin };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`
    );
  }

  async handleOAuthCallback(code: string, state: string): Promise<{ redirectUrl: string; origin: string }> {
    let franchiseId = '';
    let frontendOrigin = this.config.get<string>('FRONTEND_URL') || 'https://iconsafetyinstitute.com';
    
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf8');
      if (decoded.startsWith('{')) {
        const stateObj = JSON.parse(decoded);
        franchiseId = stateObj.f;
        frontendOrigin = stateObj.o || frontendOrigin;
      } else {
        franchiseId = decoded;
      }
    } catch (e) {
      franchiseId = Buffer.from(state, 'base64').toString('utf8');
    }

    const { clientId, clientSecret } = await this.getOAuthCredentials();
    const redirectUri = this.config.get<string>('GOOGLE_ANALYTICS_REDIRECT_URI');

    try {
      // Exchange code for tokens
      const tokenResp = await firstValueFrom(
        this.http.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      );

      const { access_token, refresh_token } = tokenResp.data;

      // Get email
      const profileResp = await firstValueFrom(
        this.http.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      );
      const email = profileResp.data.email;

      // Store temporarily (no property yet)
      await (this.prisma as any).analyticsCredential.upsert({
        where: { franchise_id: franchiseId },
        update: {
          google_account_email: email,
          access_token: this.encrypt(access_token),
          refresh_token: this.encrypt(refresh_token),
          ga_property_id: '',
          connected_at: new Date(),
          cache_data: null,
          cache_expires_at: null,
        },
        create: {
          franchise_id: franchiseId,
          google_account_email: email,
          access_token: this.encrypt(access_token),
          refresh_token: this.encrypt(refresh_token),
          ga_property_id: '',
        },
      });

      return { redirectUrl: `${frontendOrigin}/dashboard/analytics?connected=true`, origin: frontendOrigin };
    } catch (error: any) {
      this.logger.error('OAuth token exchange failed', error?.response?.data || error?.message || error);
      throw { origin: frontendOrigin, error };
    }
  }

  // ────── TOKEN REFRESH ──────
  private async refreshAccessToken(franchiseId: string): Promise<string> {
    const cred = await (this.prisma as any).analyticsCredential.findUnique({
      where: { franchise_id: franchiseId },
    });
    if (!cred) throw new UnauthorizedException('No analytics credentials found');

    const refreshToken = this.decrypt(cred.refresh_token);
    const { clientId, clientSecret } = await this.getOAuthCredentials();

    const resp = await firstValueFrom(
      this.http.post('https://oauth2.googleapis.com/token', {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    );

    const newAccessToken = resp.data.access_token;
    await (this.prisma as any).analyticsCredential.update({
      where: { franchise_id: franchiseId },
      data: { access_token: this.encrypt(newAccessToken) },
    });
    return newAccessToken;
  }

  private async getAccessToken(franchiseId: string): Promise<string> {
    const cred = await (this.prisma as any).analyticsCredential.findUnique({
      where: { franchise_id: franchiseId },
    });
    if (!cred) throw new UnauthorizedException('Analytics not connected');
    try {
      return this.decrypt(cred.access_token);
    } catch {
      return this.refreshAccessToken(franchiseId);
    }
  }

  // ────── PROPERTIES ──────
  async listProperties(franchiseId: string) {
    const token = await this.getAccessToken(franchiseId);
    try {
      const resp = await firstValueFrom(
        this.http.get(
          'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      const summaries = resp.data.accountSummaries || [];
      const properties: { id: string; name: string; displayName: string }[] = [];
      summaries.forEach((account: any) => {
        (account.propertySummaries || []).forEach((prop: any) => {
          properties.push({
            id: prop.property.replace('properties/', ''),
            name: prop.property,
            displayName: prop.displayName,
          });
        });
      });
      return { properties };
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const newToken = await this.refreshAccessToken(franchiseId);
        const resp2 = await firstValueFrom(
          this.http.get(
            'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
            { headers: { Authorization: `Bearer ${newToken}` } },
          ),
        );
        return { properties: resp2.data.accountSummaries || [] };
      }
      throw err;
    }
  }

  async connectProperty(franchiseId: string, propertyId: string, propertyName: string) {
    await (this.prisma as any).analyticsCredential.update({
      where: { franchise_id: franchiseId },
      data: { ga_property_id: propertyId, ga_property_name: propertyName },
    });
    return { success: true };
  }

  async getStatus(franchiseId: string) {
    const cred = await (this.prisma as any).analyticsCredential.findUnique({
      where: { franchise_id: franchiseId },
    });
    if (!cred) return { connected: false };
    return {
      connected: true,
      propertySelected: !!cred.ga_property_id,
      email: cred.google_account_email,
      propertyId: cred.ga_property_id,
      propertyName: cred.ga_property_name,
      connectedAt: cred.connected_at,
      lastSynced: cred.last_synced_at,
    };
  }

  async disconnect(franchiseId: string) {
    await (this.prisma as any).analyticsCredential.deleteMany({
      where: { franchise_id: franchiseId },
    });
    return { success: true };
  }

  // ────── GA4 DATA FETCH (with caching) ──────
  private async runGA4Report(
    propertyId: string,
    token: string,
    body: object,
  ) {
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const resp = await firstValueFrom(
      this.http.post(url, body, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    return resp.data;
  }

  private async fetchAndCacheGA4Data(franchiseId: string): Promise<any> {
    const cred = await (this.prisma as any).analyticsCredential.findUnique({
      where: { franchise_id: franchiseId },
    });
    if (!cred || !cred.ga_property_id) throw new Error('Analytics not connected or no property selected');

    // Check cache
    if (cred.cache_expires_at && new Date(cred.cache_expires_at) > new Date() && cred.cache_data) {
      return cred.cache_data;
    }

    let token: string;
    try {
      token = this.decrypt(cred.access_token);
    } catch {
      token = await this.refreshAccessToken(franchiseId);
    }

    const propId = cred.ga_property_id;

    const executeReports = (currentToken: string) => Promise.all([
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
          ],
        }),
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
        }),
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        }),
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }),
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        }),
        this.runGA4Report(propId, currentToken, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 20,
        }),
      ]);

    let results;
    try {
      results = await executeReports(token);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.data?.error?.status === 'UNAUTHENTICATED') {
        token = await this.refreshAccessToken(franchiseId);
        results = await executeReports(token);
      } else {
        throw err;
      }
    }

    const [trafficRaw, acquisitionRaw, deviceRaw, countryRaw, pagesRaw, eventsRaw] = results;

    // Parse traffic
    const trafficByDay = (trafficRaw.rows || []).map((row: any) => ({
      date: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
      newUsers: Number(row.metricValues[2].value),
      engagementRate: Math.round(Number(row.metricValues[3].value) * 100),
      avgDuration: Math.round(Number(row.metricValues[4].value)),
    }));

    const totals = trafficByDay.reduce(
      (acc: any, row: any) => ({
        sessions: acc.sessions + row.sessions,
        users: acc.users + row.users,
        newUsers: acc.newUsers + row.newUsers,
      }),
      { sessions: 0, users: 0, newUsers: 0 },
    );
    const returningUsers = Math.max(0, totals.users - totals.newUsers);

    // Parse acquisition
    const acquisition = (acquisitionRaw.rows || []).map((row: any) => ({
      channel: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
    }));

    // Parse devices
    const devices = (deviceRaw.rows || []).map((row: any) => ({
      device: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
    }));

    // Parse countries
    const countries = (countryRaw.rows || []).map((row: any) => ({
      country: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
    }));

    // Parse pages
    const pages = (pagesRaw.rows || []).map((row: any) => ({
      path: row.dimensionValues[0].value,
      title: row.dimensionValues[1].value,
      views: Number(row.metricValues[0].value),
      avgDuration: Math.round(Number(row.metricValues[1].value)),
    }));

    // Parse events
    const events = (eventsRaw.rows || []).map((row: any) => ({
      event: row.dimensionValues[0].value,
      count: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
    }));

    const cachedData = {
      traffic: {
        summary: {
          ...totals,
          returningUsers,
          avgEngagementRate:
            trafficByDay.length > 0
              ? Math.round(
                  trafficByDay.reduce((s: number, r: any) => s + r.engagementRate, 0) /
                    trafficByDay.length,
                )
              : 0,
          avgSessionDuration:
            trafficByDay.length > 0
              ? Math.round(
                  trafficByDay.reduce((s: number, r: any) => s + r.avgDuration, 0) /
                    trafficByDay.length,
                )
              : 0,
        },
        daily: trafficByDay,
      },
      acquisition,
      audience: { devices, countries },
      content: { pages, events },
    };

    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await (this.prisma as any).analyticsCredential.update({
      where: { franchise_id: franchiseId },
      data: {
        cache_data: cachedData,
        cache_expires_at: expiresAt,
        last_synced_at: new Date(),
      },
    });

    return cachedData;
  }

  async getTrafficData(franchiseId: string) {
    const data = await this.fetchAndCacheGA4Data(franchiseId);
    return data.traffic;
  }

  async getAcquisitionData(franchiseId: string) {
    const data = await this.fetchAndCacheGA4Data(franchiseId);
    return data.acquisition;
  }

  async getAudienceData(franchiseId: string) {
    const data = await this.fetchAndCacheGA4Data(franchiseId);
    return data.audience;
  }

  async getContentData(franchiseId: string) {
    const data = await this.fetchAndCacheGA4Data(franchiseId);
    return data.content;
  }

  async forceRefresh(franchiseId: string) {
    // Clear cache so next fetch is fresh
    await (this.prisma as any).analyticsCredential.update({
      where: { franchise_id: franchiseId },
      data: { cache_data: null, cache_expires_at: null },
    });
    return this.fetchAndCacheGA4Data(franchiseId);
  }
}

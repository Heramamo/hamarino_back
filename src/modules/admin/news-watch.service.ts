import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service.js';

const NEWSDATA_ENDPOINT = 'https://newsdata.io/api/1/latest';
const DEFAULT_CATEGORIES = ['politics', 'sports', 'education', 'crime'];
const PUBLIC_SYNC_INTERVAL_MS = 15 * 60 * 1000;

interface NewsDataArticle {
  article_id?: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  language?: string | null;
  country?: string[] | null;
  category?: string[] | null;
  image_url?: string | null;
  sentiment?: string | null;
  pubDate?: string | null;
  pubDateTZ?: string | null;
}

interface NewsDataResponse {
  status?: string;
  totalResults?: number;
  results?: NewsDataArticle[];
  message?: string;
}

export interface NewsWatchSyncResult {
  totalResults: number;
  received: number;
  saved: number;
  items: Awaited<ReturnType<NewsWatchService['listLatest']>>;
}

@Injectable()
export class NewsWatchService {
  private lastSyncAt = 0;
  private syncInFlight: Promise<NewsWatchSyncResult> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async syncLatest(): Promise<NewsWatchSyncResult> {
    if (this.syncInFlight) return this.syncInFlight;

    const sync = this.performSyncLatest();
    this.syncInFlight = sync;
    try {
      return await sync;
    } finally {
      this.lastSyncAt = Date.now();
      this.syncInFlight = null;
    }
  }

  async listPublicLatest() {
    if (Date.now() - this.lastSyncAt >= PUBLIC_SYNC_INTERVAL_MS) {
      try {
        await this.syncLatest();
      } catch (error) {
        const cachedItems = await this.listLatest();
        if (cachedItems.length === 0) throw error;
        return cachedItems;
      }
    }
    return this.listLatest();
  }

  private async performSyncLatest(): Promise<NewsWatchSyncResult> {
    const apiKey = this.config.get<string>('NEWSDATA_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('La variable NEWSDATA_API_KEY est absente de la configuration');
    }

    const url = new URL(NEWSDATA_ENDPOINT);
    url.searchParams.set('country', 'mg');
    url.searchParams.set('language', 'fr');
    url.searchParams.set('category', DEFAULT_CATEGORIES.join(','));
    url.searchParams.set('q', 'Madagascar');
    url.searchParams.set('removeduplicate', '1');
    url.searchParams.set('size', '10');

    let response: Response;
    try {
      response = await fetch(url, { headers: { 'X-ACCESS-KEY': apiKey } });
    } catch {
      throw new BadGatewayException('NewsData.io est indisponible');
    }

    const payload = (await response.json().catch(() => null)) as NewsDataResponse | null;
    if (!response.ok || !payload || payload.status === 'error') {
      throw new BadGatewayException(payload?.message ?? `NewsData.io a répondu HTTP ${response.status}`);
    }

    const validArticles = (payload.results ?? []).filter(
      (item): item is NewsDataArticle & { article_id: string; title: string; link: string } =>
        Boolean(item.article_id && item.title && item.link),
    );

    let saved = 0;
    for (const item of validArticles) {
      const publishedAt = this.parsePublishedAt(item.pubDate, item.pubDateTZ);
      await this.prisma.newsWatchItem.upsert({
        where: { providerId: item.article_id },
        create: {
          providerId: item.article_id,
          title: item.title,
          description: item.description ?? null,
          link: item.link,
          sourceId: item.source_id ?? null,
          sourceName: item.source_name ?? null,
          sourceUrl: item.source_url ?? null,
          language: item.language ?? null,
          country: item.country ?? [],
          categories: item.category ?? [],
          imageUrl: item.image_url ?? null,
          sentiment: item.sentiment ?? null,
          publishedAt,
        },
        update: {
          title: item.title,
          description: item.description ?? null,
          sourceName: item.source_name ?? null,
          imageUrl: item.image_url ?? null,
          sentiment: item.sentiment ?? null,
          publishedAt,
        },
      });
      saved += 1;
    }

    return {
      totalResults: payload.totalResults ?? validArticles.length,
      received: validArticles.length,
      saved,
      items: await this.listLatest(50),
    };
  }

  listLatest(limit = 50) {
    return this.prisma.newsWatchItem.findMany({
      orderBy: [{ publishedAt: 'desc' }, { fetchedAt: 'desc' }],
      take: limit,
    });
  }

  private parsePublishedAt(value?: string | null, timezone?: string | null): Date | null {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(timezone?.toUpperCase() === 'UTC' ? `${normalized}Z` : normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

import { tools } from '@/config/tools'

export const SITE = {
  name: 'Toolbox',
  tagline: '在线工具箱',
  title: 'Toolbox — 在线工具箱',
  description:
    '免费在线工具箱，提供 URL 编解码、Unix 时间戳转换、ICO 图标生成、SVG 图标编辑等实用工具。纯前端运行，数据不上传服务器。',
  keywords:
    '在线工具箱,URL编解码,时间戳转换,ICO生成器,favicon,SVG编辑器,图标编辑,免费工具,前端工具',
  url: 'https://yqxx.github.io/toolbox',
  locale: 'zh_CN',
  image: 'https://yqxx.github.io/toolbox/favicon.ico',
  author: 'yqxx',
} as const

export interface PageSeo {
  title: string
  description: string
  keywords?: string
}

export const homeSeo: PageSeo = {
  title: '在线工具箱',
  description: SITE.description,
  keywords: SITE.keywords,
}

const toolSeoMap = Object.fromEntries(
  tools.map((tool) => [
    tool.id,
    {
      title: tool.name,
      description: `${tool.description}。免费在线使用，纯浏览器本地处理，数据不上传。`,
      keywords: `${tool.name},在线工具,${SITE.name},免费工具`,
    } satisfies PageSeo,
  ]),
) as Record<string, PageSeo>

export function getRouteSeo(name: string | symbol | null | undefined): PageSeo {
  if (!name || name === 'home') return homeSeo
  return toolSeoMap[String(name)] ?? homeSeo
}

export function buildCanonicalUrl(path: string): string {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '')
  return normalized === '/' ? `${SITE.url}/` : `${SITE.url}${normalized}`
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    alternateName: SITE.tagline,
    url: `${SITE.url}/`,
    description: SITE.description,
    inLanguage: 'zh-CN',
  }
}

export function buildWebPageJsonLd(seo: PageSeo, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${seo.title} — ${SITE.name}`,
    description: seo.description,
    url: buildCanonicalUrl(path),
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE.name,
      url: `${SITE.url}/`,
    },
  }
}

export function buildSoftwareAppJsonLd(seo: PageSeo, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seo.title,
    description: seo.description,
    url: buildCanonicalUrl(path),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  }
}

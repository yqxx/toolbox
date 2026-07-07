import {
  SITE,
  buildCanonicalUrl,
  buildSoftwareAppJsonLd,
  buildWebPageJsonLd,
  buildWebsiteJsonLd,
  getRouteSeo,
  type PageSeo,
} from '@/config/seo'

const JSON_LD_ID = 'seo-jsonld'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return

  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(data: object) {
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = JSON_LD_ID
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function formatTitle(title: string) {
  return title.includes(SITE.name) ? title : `${title} — ${SITE.name}`
}

export function applySeo(seo: PageSeo, path: string, routeName?: string | symbol | null) {
  const title = formatTitle(seo.title)
  const canonical = buildCanonicalUrl(path)

  document.title = title

  upsertMeta('name', 'description', seo.description)
  upsertMeta('name', 'keywords', seo.keywords ?? SITE.keywords)
  upsertMeta('name', 'robots', 'index, follow')
  upsertMeta('name', 'author', SITE.author)

  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE.name)
  upsertMeta('property', 'og:locale', SITE.locale)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', seo.description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', SITE.image)

  upsertMeta('name', 'twitter:card', 'summary')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', seo.description)
  upsertMeta('name', 'twitter:image', SITE.image)

  upsertLink('canonical', canonical)

  const isHome = !routeName || routeName === 'home'
  upsertJsonLd(
    isHome
      ? [buildWebsiteJsonLd(), buildWebPageJsonLd(seo, path)]
      : [buildWebPageJsonLd(seo, path), buildSoftwareAppJsonLd(seo, path)],
  )
}

export function initRouteSeo(
  router: {
    afterEach: (
      cb: (to: { path: string; name?: string | symbol | null }) => void,
    ) => void
  },
) {
  router.afterEach((to) => {
    applySeo(getRouteSeo(to.name), to.path, to.name)
  })
}

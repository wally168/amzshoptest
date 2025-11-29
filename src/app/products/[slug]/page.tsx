import Layout from '@/components/Layout'
import ProductDetailClient from '@/components/ProductDetailClient'
import { db } from '@/lib/db'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { redirect } from 'next/navigation'

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  try { return s ? JSON.parse(s) as T : fallback } catch { return fallback }
}

export default async function ProductDetail({ params }: { params: Promise<{ slug?: string | string[] }> }) {
  const resolvedParams = await params
  const slugParam = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug[0] : resolvedParams?.slug
  const slug = typeof slugParam === 'string' ? slugParam : undefined

  if (!slug) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-gray-600">Product not found</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to products
          </Link>
        </div>
      </Layout>
    )
  }

  // Safely attempt to fetch product; fall back to null if DB is misconfigured
  const product = await (async () => {
    try {
      return await db.product.findUnique({
        where: { slug },
        include: { category: true },
      })
    } catch (e) {
      console.error('Failed to load product:', e)
      return null
    }
  })()

  if (!product) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-gray-600">Product not found</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to products
          </Link>
        </div>
      </Layout>
    )
  }

  // --- AMAZON-STYLE VARIANT LOGIC START ---
  type VariantGroup = { name: string; options: string[] }
  
  // Default legacy variants
  let variantGroups = parseJson<VariantGroup[]>((product as any).variants, [])
  let variantOptionLinks = parseJson<any>((product as any).variantOptionLinks, null)
  let variantImageMap = parseJson<any>((product as any).variantImageMap, null)
  let variantOptionImages = parseJson<any>((product as any).variantOptionImages, null)
  let variantSlugMap: Record<string, Record<string, string>> | null = null
  let initialSelection: Record<string, string> | null = null

  // Check for Parent/Child
  const p = product as any
  const parentId = p.parentId
  let siblings: any[] = []
  let isParent = false

  if (parentId) {
    // I am a child. Fetch siblings (including self potentially)
    siblings = await db.product.findMany({
      where: { parentId: parentId, active: true },
      select: { id: true, slug: true, variantAttributes: true, amazonUrl: true }
    })
    // Set initial selection based on my own attributes
    if (p.variantAttributes) {
        initialSelection = p.variantAttributes as Record<string, string>
    }
  } else {
    // Check if I am a parent
    const children = await db.product.findMany({
      where: { parentId: product.id, active: true },
      select: { id: true, slug: true, variantAttributes: true, amazonUrl: true }
    })
    if (children.length > 0) {
      isParent = true
      siblings = children
    }
  }

  if (isParent && siblings.length > 0) {
     redirect(`/products/${siblings[0].slug}`)
  }

  if (siblings.length > 0) {
      // Build variants from siblings
      const keys = new Set<string>()
      siblings.forEach(s => {
          const attrs = s.variantAttributes as Record<string, string> | null
          if (attrs) {
              Object.keys(attrs).forEach(k => keys.add(k))
          }
      })

      if (keys.size > 0) {
          const groups: VariantGroup[] = []
          const amazonLinks: Record<string, string> = {} 
          const internalLinks: Record<string, string> = {} 

          // Build Groups
          Array.from(keys).forEach(key => {
              const options = new Set<string>()
              siblings.forEach(s => {
                   const val = (s.variantAttributes as any)?.[key]
                   if (val) options.add(val)
              })
              if (options.size > 0) {
                  groups.push({ name: key, options: Array.from(options) })
              }
          })
          variantGroups = groups

          // Build Links (COMBO_KEY)
          siblings.forEach(s => {
             const attrs = s.variantAttributes as Record<string, string>
             if (!attrs) return
             
             const comboKeyParts: string[] = []
             let matchesAllGroups = true
             
             for (const g of groups) {
                 const val = attrs[g.name]
                 if (val) {
                     comboKeyParts.push(`${g.name}=${val}`)
                 } else {
                     matchesAllGroups = false 
                 }
             }
             
             if (matchesAllGroups) {
                 const comboKey = comboKeyParts.join('|')
                 amazonLinks[comboKey] = s.amazonUrl
                 internalLinks[comboKey] = `/products/${s.slug}`
             }
          })
          
          variantOptionLinks = { '__combo__': amazonLinks }
          variantSlugMap = { '__combo__': internalLinks }
          
          // Clear legacy maps that might interfere
          variantImageMap = null
          variantOptionImages = null
      }
  }
  // --- END NEW LOGIC ---

  const parsedImages = parseJson<string[]>(product.images, [product.mainImage])
  const images = Array.isArray(parsedImages) ? parsedImages : [product.mainImage]
  const parsedBullets = parseJson<string[]>(product.bulletPoints, [])
  const bullets = Array.isArray(parsedBullets) ? parsedBullets : []
  const brand = (product as any).brand as string | null | undefined
  const upc = (product as any).upc as string | null | undefined
  const publishedAt = (product as any).publishedAt as string | Date | null | undefined

  return (
    <Layout>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <ProductDetailClient
            id={product.id}
            slug={product.slug}
            title={product.title}
            categoryName={product.category?.name ?? 'Uncategorized'}
            brand={brand ?? null}
            upc={upc ?? null}
            publishedAt={publishedAt ?? null}
            description={product.description}
            amazonUrl={product.amazonUrl}
            price={product.price}
            originalPrice={product.originalPrice ?? null}
            images={images}
            mainImage={product.mainImage}
            bullets={bullets}
            variantGroups={Array.isArray(variantGroups) ? variantGroups : []}
            variantImageMap={variantImageMap}
            variantOptionImages={variantOptionImages}
            variantOptionLinks={variantOptionLinks}
            variantSlugMap={variantSlugMap}
            initialSelection={initialSelection}
            showBuyOnAmazon={((product as any).showBuyOnAmazon !== false)}
            showAddToCart={((product as any).showAddToCart !== false)}
          />
        </div>
      </div>
    </Layout>
  )
}

"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductImageGallery from './ProductImageGallery'
import { formatPrice } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'

  type VariantGroup = { name: string; options: string[] }

  const COMBO_KEY = '__combo__'

  function buildComboKey(groups: VariantGroup[], selections: Record<string, string>): string {
    if (!Array.isArray(groups) || groups.length === 0) return ''
    return groups
      .filter(g => g?.name && selections[g.name])
      .map(g => `${g.name}=${selections[g.name]}`)
      .join('|')
  }

 function formatPublishedAt(dt?: string | Date | null): string {
   if (!dt) return ''
   try {
     const d = new Date(dt)
     return d.toLocaleDateString()
   } catch { return '' }
 }
 
 export default function ProductDetailClient({
   id,
   slug,
   title,
   categoryName,
   brand,
   upc,
   publishedAt,
   description,
   amazonUrl,
   price,
   originalPrice,
   images,
   mainImage,
   bullets,
   variantGroups,
   variantImageMap,
   variantOptionImages,
   variantOptionLinks,
   variantSlugMap, // New prop for internal navigation
   initialSelection, // New prop for initial state
   showBuyOnAmazon = true,
   showAddToCart = true,
 }: {
   id: string
   slug: string
   title: string
   categoryName?: string
   brand?: string | null
   upc?: string | null
   publishedAt?: string | Date | null
   description: string
   amazonUrl: string
   price: number
   originalPrice?: number | null
   images: string[]
   mainImage: string
   bullets: string[]
   variantGroups: VariantGroup[]
   variantImageMap?: Record<string, Record<string, number>> | null
   variantOptionImages?: Record<string, Record<string, string>> | null
   variantOptionLinks?: Record<string, Record<string, string>> | null
   variantSlugMap?: Record<string, Record<string, string>> | null
   initialSelection?: Record<string, string> | null
   showBuyOnAmazon?: boolean
   showAddToCart?: boolean
 }) {
   const router = useRouter()
   const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
   const [selection, setSelection] = useState<Record<string, string>>(initialSelection || {})
   const [failedThumb, setFailedThumb] = useState<Record<string, boolean>>({})
   const [lastClickedGroup, setLastClickedGroup] = useState<string | null>(null)
 
   const safeImages = useMemo(() => {
     const arr = Array.isArray(images) && images.length > 0 ? images : [mainImage]
     return arr.filter(Boolean)
   }, [images, mainImage])
   const primaryImageUrl = safeImages[selectedImageIndex] || mainImage
 
   const resolveIndex = (groupName: string, option: string): number => {
     // 映射表优先
     const mapped = variantImageMap?.[groupName]?.[option]
     if (typeof mapped === 'number' && mapped >= 0 && mapped < safeImages.length) return mapped
     // 基于文件名/URL包含的简单匹配（兼容无映射的情况）
     const lower = option.toLowerCase()
     const candidate = safeImages.findIndex((src) => src.toLowerCase().includes(lower))
     if (candidate >= 0) return candidate
     // 兜底主图
     return 0
   }
 
   const handleVariantClick = (groupName: string, opt: string) => {
     const newSelection = { ...selection, [groupName]: opt }
     setSelection(newSelection)
     setLastClickedGroup(groupName)
     const idx = resolveIndex(groupName, opt)
     setSelectedImageIndex(idx)
     
     // Check for internal navigation
     if (variantSlugMap && variantGroups.length > 0) {
         const key = buildComboKey(variantGroups, newSelection)
         // Check specific combo
         const internalUrl = (variantSlugMap as any)?.[COMBO_KEY]?.[key]
         if (internalUrl && internalUrl !== `/products/${slug}`) {
             router.push(internalUrl)
             return
         }
     }
   }

  // 构造缩略图URL
  const getThumbUrl = (groupName: string, opt: string): string | null => {
    const url = variantOptionImages?.[groupName]?.[opt]
    if (!url || typeof url !== 'string') return null
    return url.startsWith('http') ? url : (url.startsWith('/') ? url : `/${url}`)
  }

  // 计算当前购买链接：
  // 1) 优先匹配“组合链接”（当所有分组均已选择）
  // 2) 再使用最近点击的分组映射
  // 3) 其次任何已选拥有映射的分组
  // 4) 兜底回退到产品 amazonUrl
  const currentBuyUrl = useMemo(() => {
    const ensureUrl = (u?: string | null): string | null => {
      if (!u || typeof u !== 'string') return null
      // 允许外链和相对链接（极少数情况），默认原样返回
      return u
    }
    // 尝试组合链接
    if (Array.isArray(variantGroups) && variantGroups.length > 1) {
      const allSelected = variantGroups.every(g => !!selection[g.name])
      if (allSelected) {
        const key = buildComboKey(variantGroups, selection)
        const comboUrl = (variantOptionLinks as any)?.[COMBO_KEY]?.[key] as string | undefined
        const e = ensureUrl(comboUrl)
        if (e) return e
      }
    }
    if (lastClickedGroup && selection[lastClickedGroup]) {
      const u = variantOptionLinks?.[lastClickedGroup]?.[selection[lastClickedGroup]]
      const e = ensureUrl(u)
      if (e) return e
    }
    for (const [g, opt] of Object.entries(selection)) {
      const u = variantOptionLinks?.[g]?.[opt]
      const e = ensureUrl(u)
      if (e) return e
    }
    return amazonUrl
  }, [selection, variantOptionLinks, amazonUrl, lastClickedGroup])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* 左侧：图片 */}
      <div>
        <ProductImageGallery
          images={safeImages}
          mainImage={mainImage}
          title={title}
          selectedImageIndex={selectedImageIndex}
          onImageChange={setSelectedImageIndex}
        />
      </div>

      {/* 右侧：详情 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {categoryName && (
          <p className="mt-2 text-gray-600">Category: {categoryName}</p>
        )}
        {brand && (
          <p className="mt-1 text-gray-600">Brand: {brand}</p>
        )}
        {upc && (
          <p className="mt-1 text-gray-600">UPC: {upc}</p>
        )}
        {publishedAt && (
          <p className="mt-1 text-gray-500 text-sm">Date First Available : {formatPublishedAt(publishedAt)}</p>
        )}

        {/* 变体选项挪到价格上方，优先图片显示 */}
        {Array.isArray(variantGroups) && variantGroups.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900">Available Options</h3>
            <div className="mt-3 space-y-4">
              {variantGroups.map((group, gi) => (
                <div key={gi}>
                  <p className="text-sm text-gray-700">{group.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(group.options || []).filter(Boolean).map((opt, oi) => {
                      const active = selection[group.name] === opt
                      const thumb = getThumbUrl(group.name, opt)
                      const k = `${group.name}::${opt}`
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => handleVariantClick(group.name, opt)}
                          className={`relative group inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border transition-colors ${
                            active ? 'ring-2 ring-blue-600 border-blue-600' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ minWidth: 44, minHeight: 44 }}
                        >
                          {thumb && !failedThumb[k] ? (
                            <>
                              <img
                                src={thumb}
                                alt={opt}
                                className="w-10 h-10 object-cover rounded"
                                onError={() => setFailedThumb(prev => ({ ...prev, [k]: true }))}
                              />
                              {/* 悬停文字叠层 */}
                              <span className="absolute -bottom-1 left-0 hidden group-hover:block translate-y-full bg-black/60 text-white text-[11px] px-1.5 py-0.5 rounded">
                                {opt}
                              </span>
                            </>
                          ) : (
                            <span className="px-3 py-1 text-gray-700">{opt}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 购买/加购操作区 */}
        <div className="mt-6 flex items-center gap-3">
        {showBuyOnAmazon && (
        <a
        href={currentBuyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-500"
        >
        Buy on Amazon
        </a>
        )}
        {showAddToCart && (
        <AddToCartButton
        id={id}
        slug={slug}
        title={title}
        price={price}
        imageUrl={primaryImageUrl}
        selectedOptions={selection}
        showQuantitySelector={true}
        />
        )}
        </div>

         {/* 价格模块放在选项之后 */}
         <div className="mt-4 flex items-center gap-3">
           <span className="text-2xl font-semibold text-gray-900">{formatPrice(price)}</span>
           {originalPrice ? (
             <span className="text-gray-500 line-through">{formatPrice(originalPrice)}</span>
           ) : null}
         </div>

        {Array.isArray(bullets) && bullets.length > 0 && (
          <ul className="mt-4 list-disc list-inside text-gray-700 space-y-1">
            {bullets.map((b, i) => (<li key={i}>{b}</li>))}
          </ul>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Product Description</h2>
          <div 
            className="mt-2 text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: description }}
            style={{ lineHeight: '1.6' }}
          />
        </div>
      </div>
    </div>
  )
}
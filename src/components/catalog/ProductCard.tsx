import React, { useState } from 'react';
import { Heart, GitCompare, ShoppingBag, Star, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product, ProductMedia } from '../../types';
import { useCart } from '../../context/CartContext';
import { useComparison } from '../../context/ComparisonContext';

export interface ProductCardProps {
  product: Product;
  onNavigate: (view: string, param?: string) => void;
  viewMode?: 'grid' | 'list';
  reason?: string;
  compact?: boolean;
}

const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f1f5f9"/><path d="M280 430l100-120 80 90 60-70 100 100H280z" fill="#cbd5e1"/><circle cx="560" cy="210" r="55" fill="#cbd5e1"/></svg>`
);

const getOrderedMedia = (product: Product): ProductMedia[] =>
  [...(product.media || [])]
    .filter((item) => item.url || item.secureUrl)
    .sort((a, b) => a.position - b.position);

const getPrimaryMedia = (product: Product): ProductMedia | undefined =>
  getOrderedMedia(product).find((item) => item.role === 'primary') || getOrderedMedia(product)[0];

const getMediaUrlForMedia = (media: ProductMedia | undefined, source: string, width = 800): string => {
  if (!source.includes('res.cloudinary.com')) return source;
  return source.replace(
    /(res\.cloudinary\.com\/[^/]+\/image\/upload)(?:\/[^?]+)?\//,
    `$1/f_auto,q_auto,w_${width},c_limit/`
  );
};

const getMediaUrl = (product: Product, width = 800): string => {
  const primary = getPrimaryMedia(product);
  const source = primary?.secureUrl || primary?.url || product.thumbnail || product.images?.[0] || FALLBACK_IMAGE;
  return getMediaUrlForMedia(primary, source, width);
};

const getMediaAlt = (product: Product, media?: ProductMedia): string =>
  media?.altText || product.title;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  viewMode = 'grid',
  reason,
  compact = false,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { addToCompare, isInCompare } = useComparison();
  const [imageFailed, setImageFailed] = useState(false);
  const primaryMedia = getPrimaryMedia(product);
  const imageSrc = imageFailed ? FALLBACK_IMAGE : getMediaUrl(product, viewMode === 'list' ? 520 : 600);
  const wishlist = isInWishlist(product.id);
  const compared = isInCompare(product.id);

  const handleNavigate = () => onNavigate('product-detail', product.id);
  const handleAction = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };

  const content = (
    <>
      <div className={`relative ${compact ? 'h-36' : viewMode === 'list' ? 'h-44 sm:h-52' : 'h-48'} rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-3 group-hover:shadow-inner transition`}>
        {product.discountPercentage > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            {product.discountPercentage}% OFF
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            Featured
          </span>
        )}
        {product.isTrending && (
          <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            Trending
          </span>
        )}
        <button
          onClick={(event) => handleAction(event, () => toggleWishlist(product))}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition ${
            wishlist ? 'bg-rose-50 text-rose-500' : 'bg-white/85 text-slate-400 hover:text-rose-500'
          }`}
          aria-label={wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className="w-4 h-4" fill={wishlist ? 'currentColor' : 'none'} />
        </button>
        <img
          src={imageSrc}
          alt={getMediaAlt(product, primaryMedia)}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="max-h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className={`mt-3 space-y-2 flex-1 flex flex-col justify-between ${compact ? '' : 'min-h-[9rem]'}`}>
        {reason && (
          <div className="flex items-start gap-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 px-2 py-1.5">
            <SparklesIcon />
            <p className="text-[10px] leading-snug text-indigo-800">{reason}</p>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-indigo-600 font-semibold">{product.brand}</span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" /> {product.rating} <span className="text-slate-400">({product.reviewsCount})</span>
            </span>
          </div>
          <h4
            onClick={handleNavigate}
            className={`text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 cursor-pointer ${compact ? '' : 'min-h-[2rem]'}`}
          >
            {product.title}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">Sold by <strong className="text-slate-700">{product.vendorName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded font-bold ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
            {product.status && product.status !== 'published' && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold capitalize">
                {product.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(event) => handleAction(event, () => addToCart(product))}
              disabled={product.stock <= 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{product.stock > 0 ? 'Add to Cart' : 'Unavailable'}</span>
            </button>
            <button
              onClick={(event) => handleAction(event, () => addToCompare(product))}
              className={`text-[11px] font-semibold py-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                compared ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{compared ? 'Comparing' : 'Compare'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleNavigate}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row gap-5 items-center group cursor-pointer"
      >
        <div className="w-full sm:w-52 shrink-0">{content}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Direct dispatch from <strong className="text-slate-800">{product.vendorName}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleNavigate}
      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer ${compact ? 'p-3' : ''}`}
    >
      {content}
    </div>
  );
};

const SparklesIcon = () => <span className="text-indigo-500 text-[10px] leading-none">✦</span>;

export const getProductMediaUrl = getMediaUrl;
export const getProductPrimaryMedia = getPrimaryMedia;
export const getProductOrderedMedia = getOrderedMedia;
export const getProductFallbackImage = () => FALLBACK_IMAGE;

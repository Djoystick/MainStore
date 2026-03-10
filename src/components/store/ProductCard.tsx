import Link from 'next/link';

import { classNames } from '@/css/classnames';

import styles from './store.module.css';
import type { StoreProduct } from './types';

interface ProductCardProps {
  product: StoreProduct;
  href?: string;
  compact?: boolean;
}

function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function ProductCard({ product, href, compact = false }: ProductCardProps) {
  const imageStyle = product.imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(12, 18, 31, 0.16), rgba(12, 18, 31, 0.16)), url(${product.imageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : { background: product.imageGradient };

  const card = (
    <article
      className={classNames(styles.productCard, compact && styles.productCardCompact)}
    >
      <div className={styles.productImage} style={imageStyle}>
        <span className={styles.productImageLabel}>{product.imageLabel}</span>
      </div>
      <div className={styles.productBody}>
        <p className={styles.productName}>{product.title}</p>
        <p className={styles.productDescription}>
          {product.shortDescription || product.description}
        </p>
        <p className={styles.productPrice}>
          {formatPrice(product.priceCents, product.currency)}
        </p>
      </div>
    </article>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className={styles.productLink}
      aria-label={`Open product ${product.title}`}
    >
      {card}
    </Link>
  );
}

'use client';

import { useMemo, useState } from 'react';

import { classNames } from '@/css/classnames';

import styles from './store.module.css';
import type { StoreProductPresentation } from './types';

interface StoreProductExperienceProps {
  presentation: StoreProductPresentation;
}

function Stars({ rating }: { rating: number }) {
  return <span aria-hidden="true">{'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}</span>;
}

function formatReviewCount(count: number): string {
  const remainder10 = count % 10;
  const remainder100 = count % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return `${count} отзыв`;
  }
  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return `${count} отзыва`;
  }
  return `${count} отзывов`;
}

export function StoreProductExperience({ presentation }: StoreProductExperienceProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      presentation.optionGroups
        .filter((group) => group.values[0])
        .map((group) => [group.id, group.values[0].id]),
    ),
  );
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  const selectedLabels = useMemo(
    () =>
      Object.fromEntries(
        presentation.optionGroups.map((group) => {
          const activeValue =
            group.values.find((value) => value.id === selectedValues[group.id]) ?? group.values[0] ?? null;
          return [group.id, activeValue?.label ?? 'Не выбрано'];
        }),
      ),
    [presentation.optionGroups, selectedValues],
  );

  const reviewsAverage = useMemo(() => {
    if (presentation.reviews.length === 0) {
      return 0;
    }

    const total = presentation.reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / presentation.reviews.length;
  }, [presentation.reviews]);

  return (
    <>
      {presentation.optionGroups.length > 0 ? (
        <section className={styles.panel} id="product-options">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Выбор товара</p>
              <h2 className={styles.panelTitle}>Подберите вариант</h2>
              <p className={styles.panelText}>
                Цвет, размер и модификация собраны в одном месте, чтобы быстрее понять нужную конфигурацию товара.
              </p>
            </div>
          </div>

          <div className={styles.optionGroupStack}>
            {presentation.optionGroups.map((group) => {
              const activeValue =
                group.values.find((value) => value.id === selectedValues[group.id]) ?? group.values[0] ?? null;

              return (
                <div key={group.id} className={styles.optionGroup}>
                  <div className={styles.optionGroupHead}>
                    <div>
                      <p className={styles.optionGroupTitle}>{group.title}</p>
                      {group.helperText ? <p className={styles.optionGroupHint}>{group.helperText}</p> : null}
                    </div>
                    <span className={styles.optionGroupSelection}>{selectedLabels[group.id]}</span>
                  </div>
                  <div className={styles.optionValueRow}>
                    {group.values.map((value) => {
                      const isActive = selectedValues[group.id] === value.id;

                      return (
                        <button
                          key={value.id}
                          type="button"
                          className={classNames(
                            styles.optionValueButton,
                            isActive && styles.optionValueButtonActive,
                          )}
                          onClick={() =>
                            setSelectedValues((current) => ({
                              ...current,
                              [group.id]: value.id,
                            }))
                          }
                        >
                          {value.swatch ? (
                            <span className={styles.optionSwatch} style={{ background: value.swatch }} aria-hidden="true" />
                          ) : null}
                          <span>{value.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {activeValue?.hint ? <p className={styles.optionGroupNote}>{activeValue.hint}</p> : null}
                </div>
              );
            })}
          </div>

          <div className={styles.detailSupportList}>
            <div className={styles.detailSupportItem}>
              <strong>Текущий выбор</strong>
              <span>Корзина пока добавляет базовую карточку товара без отдельной variant-модели.</span>
            </div>
            <div className={styles.detailSupportItem}>
              <strong>Зачем это сейчас</strong>
              <span>Интерфейс уже готов к более подробной модели вариантов без перестройки product page.</span>
            </div>
          </div>
        </section>
      ) : null}

      {presentation.sizeGuide && presentation.sizeGuide.length > 0 ? (
        <section className={styles.panel} id="product-size-guide">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Размеры</p>
              <h2 className={styles.panelTitle}>Размерная сетка</h2>
              <p className={styles.panelText}>
                Таблица помогает быстро сверить посадку и выбрать подходящий размер без перегрузки экрана.
              </p>
            </div>
          </div>

          <div className={styles.sizeGuideSummary}>
            <div className={styles.sizeGuideSummaryItem}>
              <span className={styles.sizeGuideSummaryLabel}>Посадка</span>
              <strong>Сверяйте по груди и талии</strong>
            </div>
            <div className={styles.sizeGuideSummaryItem}>
              <span className={styles.sizeGuideSummaryLabel}>Если сомневаетесь</span>
              <strong>Выбирайте размер с более комфортной посадкой</strong>
            </div>
          </div>

          <div className={styles.sizeGuideTable}>
            <div className={classNames(styles.sizeGuideRow, styles.sizeGuideHead)}>
              <span>Размер</span>
              <span>Грудь / стопа</span>
              <span>Талия / EU</span>
              <span>Посадка</span>
            </div>
            {presentation.sizeGuide.map((row) => (
              <div key={row.size} className={styles.sizeGuideRow}>
                <span>{row.size}</span>
                <span>{row.chest}</span>
                <span>{row.waist}</span>
                <span>{row.fit}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.panel} id="product-specs">
        <div className={styles.specsCardHead}>
          <div>
            <p className={styles.panelEyebrow}>Детали товара</p>
            <h2 className={styles.panelTitle}>Характеристики</h2>
            <p className={styles.panelText}>
              Короткий обзор состава, сценариев использования и служебных данных. Полную версию можно открыть отдельно.
            </p>
          </div>
          <button
            type="button"
            className={classNames(styles.secondaryButton, styles.actionButtonReset, styles.specsTrigger)}
            onClick={() => setIsSpecsOpen(true)}
          >
            Все характеристики
          </button>
        </div>

        <div className={styles.specsPreviewGrid}>
          {presentation.specificationGroups.slice(0, 2).map((group) => (
            <div key={group.id} className={styles.specsPreviewCard}>
              <p className={styles.specsPreviewTitle}>{group.title}</p>
              {group.items.slice(0, 3).map((item) => (
                <div key={`${group.id}-${item.label}`} className={styles.specsPreviewItem}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.panel} id="product-reviews">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Впечатления покупателей</p>
            <h2 className={styles.panelTitle}>Отзывы</h2>
            <p className={styles.panelText}>{presentation.reviewsLabel}</p>
          </div>
        </div>

        <div className={styles.reviewSummaryGrid}>
          <div className={styles.reviewSummaryCard}>
            <span className={styles.reviewSummaryLabel}>Средняя оценка</span>
            <strong className={styles.reviewSummaryValue}>{reviewsAverage.toFixed(1)}</strong>
            <span className={styles.reviewSummaryStars}>
              <Stars rating={Math.round(reviewsAverage)} />
            </span>
          </div>
          <div className={styles.reviewSummaryCard}>
            <span className={styles.reviewSummaryLabel}>Показано сейчас</span>
            <strong className={styles.reviewSummaryValue}>{formatReviewCount(presentation.reviews.length)}</strong>
            <span className={styles.reviewSummaryHint}>Безопасная demo-подача до подключения backend reviews</span>
          </div>
        </div>

        <div className={styles.reviewRail}>
          {presentation.reviews.map((review) => (
            <article key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewCardHead}>
                <div>
                  <p className={styles.reviewAuthor}>{review.author}</p>
                  <p className={styles.reviewMeta}>{review.meta}</p>
                </div>
                <p className={styles.reviewStars}>
                  <Stars rating={review.rating} />
                </p>
              </div>
              <p className={styles.reviewTitle}>{review.title}</p>
              <p className={styles.reviewText}>{review.text}</p>
            </article>
          ))}
        </div>

        {presentation.reviewNote ? <p className={styles.reviewNote}>{presentation.reviewNote}</p> : null}
      </section>

      {isSpecsOpen ? (
        <div className={styles.specsOverlay} role="dialog" aria-modal="true" aria-label="Характеристики товара">
          <div className={styles.specsModal}>
            <div className={styles.specsModalHead}>
              <div>
                <p className={styles.specsModalEyebrow}>Товар</p>
                <h2 className={styles.panelTitle}>Характеристики</h2>
                <p className={styles.panelText}>
                  Полная версия характеристик для быстрого просмотра на мобильном экране.
                </p>
              </div>
              <button
                type="button"
                className={classNames(styles.secondaryButton, styles.actionButtonReset, styles.specsCloseButton)}
                onClick={() => setIsSpecsOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <div className={styles.specsGroupStack}>
              {presentation.specificationGroups.map((group) => (
                <section key={group.id} className={styles.specsGroup}>
                  <p className={styles.specsGroupTitle}>{group.title}</p>
                  <div className={styles.specsList}>
                    {group.items.map((item) => (
                      <div key={`${group.id}-${item.label}`} className={styles.specsListItem}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

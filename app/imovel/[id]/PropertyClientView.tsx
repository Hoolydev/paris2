'use client';

import { useState } from 'react';
import styles from './page.module.css';
import ImageModal from '@/components/ImageModal';
import PropertyContactForm from '@/components/PropertyContactForm';

interface Property {
    id: string;
    title: string;
    type: string;
    price: string;
    image?: string;
    images?: string[];
    location: string;
    neighborhood?: string;
    code?: string;
    bedrooms: number;
    bathrooms?: number;
    suites?: number;
    garage?: number;
    area: string;
    landArea?: string;
    builtArea?: string;
    description: string;
    features?: string[];
}

interface PropertyClientViewProps {
    property: Property;
}

export default function PropertyClientView({ property }: PropertyClientViewProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalIndex, setModalIndex] = useState(0);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

    const allImages = property.images && property.images.length > 0
        ? property.images
        : [property.image || '/placeholder-image.jpg'];

    const handleImageError = (index: number) => {
        setFailedImages(prev => new Set(prev).add(index));
    };

    const openModal = (index: number) => {
        setModalIndex(index);
        setIsModalOpen(true);
    };

    const formatPrice = (priceStr: string) => {
        if (!isNaN(Number(priceStr))) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(priceStr));
        }
        return priceStr;
    };

    return (
        <main className={styles.container}>
            {/* Gallery Grid (1 Left, 3 Right) */}
            <section className={styles.heroGrid}>
                <div className={styles.mainImageWrapper} onClick={() => openModal(0)}>
                    {!failedImages.has(0) ? (
                        <img
                            src={allImages[0]}
                            alt={property.title}
                            className={styles.image}
                            onError={() => handleImageError(0)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className={styles.imagePlaceholder} style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0, #c0c0c0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '1rem' }}>
                            Imagem indisponível
                        </div>
                    )}
                </div>
                <div className={styles.secondaryImages}>
                    {/* Top Right */}
                    {allImages[1] && (
                        <div className={styles.subImageWrapper} onClick={() => openModal(1)}>
                            {!failedImages.has(1) ? (
                                <img
                                    src={allImages[1]}
                                    alt={`${property.title} - 2`}
                                    className={styles.image}
                                    onError={() => handleImageError(1)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0, #c0c0c0)' }} />
                            )}
                        </div>
                    )}
                    {/* Bottom Right Split */}
                    <div className={styles.secondaryBottom}>
                        {allImages[2] && (
                            <div className={styles.subImageWrapper} onClick={() => openModal(2)}>
                                {!failedImages.has(2) ? (
                                    <img
                                        src={allImages[2]}
                                        alt={`${property.title} - 3`}
                                        className={styles.image}
                                        onError={() => handleImageError(2)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0, #c0c0c0)' }} />
                                )}
                            </div>
                        )}
                        {allImages[3] && (
                            <div className={styles.subImageWrapper} onClick={() => openModal(3)}>
                                {!failedImages.has(3) ? (
                                    <img
                                        src={allImages[3]}
                                        alt={`${property.title} - 4`}
                                        className={styles.image}
                                        onError={() => handleImageError(3)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0, #c0c0c0)' }} />
                                )}
                                {allImages.length > 4 && (
                                    <div className={styles.moreOverlay}>
                                        +{allImages.length - 4}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className={styles.contentWrapper}>
                <div className={styles.mainContent}>
                    <div className={styles.headerInfo}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={styles.categoryTag}>{property.type}</span>
                            {property.code && <span className={styles.codeTag}>Cód: {property.code}</span>}
                        </div>

                        <h1 className={styles.title}>{property.title}</h1>
                        <div className={styles.location}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {property.neighborhood ? `${property.neighborhood}, ${property.location}` : property.location}
                        </div>

                        {/* Price Mobile only or here? Design usually has price here too */}
                        <div className={styles.priceWrapper}>
                            <span className={styles.priceLabel}>Valor de Venda</span>
                            <div className={styles.price}>{formatPrice(property.price)}</div>
                        </div>
                    </div>

                    <div className={styles.featuresGrid}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Área Construída</span>
                            <span className={styles.featureValue}>{property.builtArea || property.area || '-'}</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Área Total</span>
                            <span className={styles.featureValue}>{property.landArea || '-'}</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Quartos</span>
                            <span className={styles.featureValue}>{property.bedrooms}</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Suítes</span>
                            <span className={styles.featureValue}>{property.suites || 0}</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Banheiros</span>
                            <span className={styles.featureValue}>{property.bathrooms || '-'}</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureLabel}>Vagas</span>
                            <span className={styles.featureValue}>{property.garage || '-'}</span>
                        </div>
                    </div>

                    {/* Amenities List */}
                    {property.features && property.features.length > 0 && (
                        <div className={styles.descriptionSection}>
                            <h2 className={styles.descriptionTitle}>Comodidades</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {property.features.map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444' }}>
                                        <span style={{ color: '#0a0a0a' }}>✓</span> {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.descriptionSection}>
                        <h2 className={styles.descriptionTitle}>Sobre este imóvel</h2>
                        <div className={styles.descriptionText}>{property.description}</div>
                    </div>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.contactCard}>
                        <h3 className={styles.contactTitle}>Está interessado?</h3>
                        <div style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#000', textAlign: 'center' }}>
                            {formatPrice(property.price)}
                        </div>
                        <PropertyContactForm propertyTitle={property.title} />
                    </div>
                </aside>
            </div>

            <ImageModal
                images={allImages}
                initialIndex={modalIndex}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </main>
    );
}

import Image from 'next/image';
import PropertyCard from '@/components/PropertyCard';
import styles from './page.module.css';
import { getProperties } from '@/lib/properties';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const featuredProperties = (await getProperties()).slice(0, 4);

    return (
        <main className={styles.main}>
            {/* Hero Banner */}
            <section className={styles.hero}>
                <div className={styles.heroImageWrapper}>
                    <picture>
                        {/* Mobile version (max-width: 768px) */}
                        <source
                            media="(max-width: 768px)"
                            srcSet="https://i.imgur.com/vRr8Uri.png"
                        />
                        {/* Desktop version (default) */}
                        <img
                            src="https://i.imgur.com/j17zGeo.png"
                            alt="Parisi Imóveis - Seu Lar, Nossa Missão"
                            className={styles.heroImage}
                        />
                    </picture>
                </div>
            </section>

            {/* Featured Properties */}
            <section className={styles.featuredSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Imóveis em Destaque</h2>
                        <p className={styles.sectionDescription}>
                            Conheça nossa seleção especial de imóveis premium
                        </p>
                    </div>

                    {featuredProperties.length > 0 ? (
                        <>
                            <div className={styles.propertyGrid}>
                                {featuredProperties.map((property) => (
                                    <PropertyCard key={property.id} {...property} />
                                ))}
                            </div>

                            <div className={styles.viewMoreWrapper}>
                                <a href="/comprar" className="btn btn-primary">
                                    Ver Todos os Imóveis
                                </a>
                            </div>
                        </>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                            Nenhum imóvel disponível no momento.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}


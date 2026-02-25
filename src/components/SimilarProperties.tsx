'use client';

import PropertyCard from './PropertyCard';
import styles from './SimilarProperties.module.css';

interface SimpleProperty {
    id: string;
    title: string;
    type: string;
    price: string;
    image?: string;
    images?: string[];
    location: string;
    bedrooms: number;
    suites?: number;
    area: string;
    landArea?: string;
    builtArea?: string;
    description: string;
    // ... other props
}

interface SimilarPropertiesProps {
    properties: SimpleProperty[];
}

export default function SimilarProperties({ properties }: SimilarPropertiesProps) {
    if (!properties || properties.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Imóveis Semelhantes</h2>
                <div className={styles.grid}>
                    {properties.map((property) => (
                        <PropertyCard
                            key={property.id}
                            {...property}
                            // Ensure image prop is populated if missing
                            image={property.images && property.images.length > 0 ? property.images[0] : property.image}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

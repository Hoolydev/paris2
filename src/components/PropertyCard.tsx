import Image from 'next/image';
import Link from 'next/link';
import styles from './PropertyCard.module.css';


interface PropertyCardProps {
    // Add images support, make image optional
    id: string;
    title: string;
    type: string;
    price: string;
    image?: string;
    images?: string[];
    location?: string;
    bedrooms?: number;
    suites?: number;
    area?: string;
    landArea?: string;
    builtArea?: string;
}

export default function PropertyCard({
    id,
    title,
    type,
    price,
    image,
    images, // Destructure images
    location,
    bedrooms,
    suites,
    area,
    landArea,
    builtArea
}: PropertyCardProps) {
    // Determine which image to show
    const displayImage = (images && images.length > 0) ? images[0] : (image || '/placeholder-image.jpg');

    // Format price
    const formatPrice = (priceStr: string) => {
        if (!priceStr) return '';
        if (!isNaN(Number(priceStr))) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(priceStr));
        }
        return priceStr;
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={displayImage} // Use displayImage
                    alt={title}
                    width={800}
                    height={600}
                    className={styles.image}
                />
                <div className={styles.badge}>{type}</div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>

                {location && (
                    <p className={styles.location}>
                        📍 {location}
                    </p>
                )}

                <div className={styles.features}>
                    {bedrooms && (
                        <span className={styles.feature}>
                            🛏️ {bedrooms} {bedrooms === 1 ? 'quarto' : 'quartos'}
                        </span>
                    )}
                    {suites && (
                        <span className={styles.feature}>
                            🚿 {suites} {suites === 1 ? 'suíte' : 'suítes'}
                        </span>
                    )}
                    {(builtArea || area) && (
                        <span className={styles.feature}>
                            🏠 {builtArea || area}
                        </span>
                    )}
                    {landArea && (
                        <span className={styles.feature}>
                            🌳 {landArea}
                        </span>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.price}>{formatPrice(price)}</div>
                    <Link href={`/imovel/${id}`} className={styles.button}>
                        Ver detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}

import Image from 'next/image';
import styles from './page.module.css';
import { getProperties } from '@/lib/properties';
import PropertiesList from './PropertiesList';

export const dynamic = 'force-dynamic';

export default async function ComprarPage() {
    const allProperties = await getProperties();

    return (
        <main className={styles.main}>
            <div className={styles.pageHeader}>
                <div className={styles.bannerWrapper}>
                    <picture>
                        {/* Mobile version (max-width: 768px) */}
                        <source
                            media="(max-width: 768px)"
                            srcSet="https://i.imgur.com/7fGQN8g.png"
                        />
                        {/* Desktop version (default) */}
                        <img
                            src="https://i.imgur.com/mvYa4iB.png"
                            alt="Imóveis à Venda - Do Popular ao Alto Padrão"
                            className={styles.bannerImage}
                        />
                    </picture>
                </div>
            </div>

            <PropertiesList properties={allProperties} />
        </main>
    );
}

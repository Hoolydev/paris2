import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Informações da Empresa */}
                    <div className={styles.column}>
                        <h3 className={styles.title}>Paris Imóveis</h3>
                        <p className={styles.description}>
                            Sua imobiliária de confiança. Realizando sonhos e conectando pessoas aos melhores imóveis.
                        </p>
                    </div>

                    {/* Links Rápidos */}
                    <div className={styles.column}>
                        <h4 className={styles.subtitle}>Links Rápidos</h4>
                        <nav className={styles.links}>
                            <Link href="/" className={styles.link}>Início</Link>
                            <Link href="/comprar" className={styles.link}>Comprar</Link>
                            <Link href="/blog" className={styles.link}>Blog</Link>
                            <Link href="/sobre" className={styles.link}>Sobre</Link>
                            <Link href="/contato" className={styles.link}>Contato</Link>
                        </nav>
                    </div>

                    {/* Contato */}
                    <div className={styles.column}>
                        <h4 className={styles.subtitle}>Contato</h4>
                        <div className={styles.contactInfo}>

                            <p className={styles.contactItem}>
                                <strong>📱 WhatsApp:</strong><br />
                                (62) 9 8588-6688
                            </p>
                            <p className={styles.contactItem}>
                                <strong>📍 Endereço:</strong><br />
                                Rua 14, nº 320 - Centro<br />
                                Goianésia - GO
                            </p>
                        </div>
                    </div>

                    {/* Redes Sociais */}
                    <div className={styles.column}>
                        <h4 className={styles.subtitle}>Redes Sociais</h4>
                        <div className={styles.socialLinks}>
                            <a href="https://www.facebook.com/parisimoveispravoce" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                Facebook
                            </a>
                            <a href="https://www.instagram.com/parisimoveisgoianesia" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} Paris Imóveis. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}

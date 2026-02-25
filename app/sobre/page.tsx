import styles from './page.module.css';

export default function SobrePage() {
    return (
        <main className={styles.main}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Sobre a Paris Imóveis</h1>
                    <p className={styles.pageDescription}>
                        Conheça nossa história e valores
                    </p>
                </div>
            </div>

            <div className={styles.content}>
                <div className="container">
                    <section className={styles.section}>
                        <div className={styles.grid}>
                            <div className={styles.textContent}>
                                <h2 className={styles.sectionTitle}>Nossa História</h2>
                                <p className={styles.text}>
                                    Desde nossa fundação, a Paris Imóveis tem se dedicado a conectar pessoas
                                    aos imóveis de seus sonhos. Com anos de experiência no mercado imobiliário,
                                    construímos uma reputação sólida baseada em confiança, transparência e
                                    excelência no atendimento.
                                </p>
                                <p className={styles.text}>
                                    Nossa equipe de profissionais altamente qualificados está sempre pronta
                                    para oferecer as melhores soluções em compra, venda e locação de imóveis,
                                    garantindo que cada cliente tenha uma experiência única e satisfatória.
                                </p>
                            </div>

                            <div className={styles.imageWrapper}>
                                <div className={styles.placeholderImage}>
                                    🏢
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.centerTitle}>Nossos Valores</h2>
                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>🎯</div>
                                <h3 className={styles.valueTitle}>Compromisso</h3>
                                <p className={styles.valueText}>
                                    Dedicação total em realizar o sonho de cada cliente
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>💎</div>
                                <h3 className={styles.valueTitle}>Excelência</h3>
                                <p className={styles.valueText}>
                                    Qualidade superior em todos os nossos serviços
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>🤝</div>
                                <h3 className={styles.valueTitle}>Confiança</h3>
                                <p className={styles.valueText}>
                                    Transparência e honestidade em todas as negociações
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>🚀</div>
                                <h3 className={styles.valueTitle}>Inovação</h3>
                                <p className={styles.valueText}>
                                    Tecnologia e métodos modernos para melhor atendê-lo
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.ctaBox}>
                            <h2 className={styles.ctaTitle}>Pronto para encontrar seu imóvel ideal?</h2>
                            <p className={styles.ctaText}>
                                Entre em contato conosco e descubra como podemos ajudá-lo
                            </p>
                            <a href="/contato" className="btn btn-accent">
                                Falar com um Consultor
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

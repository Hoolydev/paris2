'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaWhatsapp } from 'react-icons/fa';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    imageUrl: string;
    createdAt: string;
    readTime: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: PageProps) {
    const { slug } = use(params);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        try {
            // Try to fetch from backend with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${BACKEND_URL}/api/posts/${slug}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Post não encontrado');
            }
            const data = await response.json();
            setPost(data);
        } catch {
            // Silently try to find mock post
            const mockPost = getMockPost(slug);
            if (mockPost) {
                setPost(mockPost);
            } else {
                setError('Artigo não encontrado');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Carregando artigo...</p>
                </div>
            </main>
        );
    }

    if (error || !post) {
        return (
            <main className={styles.main}>
                <div className={styles.errorState}>
                    <div className={styles.errorIcon}>📄</div>
                    <h1 className={styles.errorTitle}>Artigo não encontrado</h1>
                    <p className={styles.errorText}>O artigo que você procura não existe ou foi removido.</p>
                    <Link href="/blog" className={styles.backLink}>
                        <FaArrowLeft /> Voltar para o Blog
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <header className={styles.articleHeader}>
                <img
                    src={post.imageUrl || '/blog/default-blog.jpg'}
                    alt={post.title}
                    className={styles.headerImage}
                />
                <div className={styles.headerOverlay}>
                    <div className={styles.headerContent}>
                        <span className={styles.categoryBadge}>{post.category}</span>
                        <h1 className={styles.articleTitle}>{post.title}</h1>
                        <div className={styles.articleMeta}>
                            <span className={styles.metaItem}>
                                <FaCalendarAlt /> {formatDate(post.createdAt)}
                            </span>
                            <span className={styles.metaItem}>
                                <FaClock /> {post.readTime} de leitura
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className={styles.content}>
                <div className="container">
                    <div className={styles.articleContainer}>
                        <Link href="/blog" className={styles.backLink}>
                            <FaArrowLeft /> Voltar para o Blog
                        </Link>

                        <article className={styles.articleBody}>
                            <div
                                className={styles.articleContent}
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </article>

                        <div className={styles.ctaBox}>
                            <h3 className={styles.ctaTitle}>Gostou do conteúdo?</h3>
                            <p className={styles.ctaText}>
                                Entre em contato com a Paris Imóveis e encontre o imóvel perfeito em Goianésia!
                            </p>
                            <a
                                href="https://wa.me/5562999999999?text=Olá! Vi um artigo no blog e gostaria de mais informações sobre imóveis em Goianésia."
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.ctaButton}
                            >
                                <FaWhatsapp /> Falar no WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Mock data for development/fallback
function getMockPost(slug: string): BlogPost | null {
    const posts: Record<string, BlogPost> = {
        'mercado-imobiliario-goianesia-2026': {
            id: '1',
            slug: 'mercado-imobiliario-goianesia-2026',
            title: 'Mercado Imobiliário em Goianésia: Tendências para 2026',
            excerpt: 'Descubra as principais tendências do mercado imobiliário em Goianésia e como aproveitar as melhores oportunidades de investimento na região.',
            content: `
                <p>O mercado imobiliário em <strong>Goianésia</strong> continua em crescimento constante, impulsionado pela economia forte do agronegócio e pela qualidade de vida que a cidade oferece.</p>
                
                <h2>Por que Goianésia está em alta?</h2>
                <p>Localizada a aproximadamente 170 km de Goiânia, Goianésia se destaca como um dos principais polos sucroalcooleiros e leiteiros do estado de Goiás. Essa base econômica sólida atrai investidores e novos moradores para a região.</p>
                
                <h3>Economia diversificada</h3>
                <p>A economia local não depende apenas de um setor. O agronegócio diversificado, com destaque para a produção de cana-de-açúcar, leite e outros cultivos, garante estabilidade econômica e geração de empregos.</p>
                
                <h2>Tendências para 2026</h2>
                <ul>
                    <li><strong>Valorização contínua:</strong> Imóveis em Goianésia tendem a continuar valorizando</li>
                    <li><strong>Novos empreendimentos:</strong> Lançamentos de condomínios e loteamentos</li>
                    <li><strong>Demanda por casas:</strong> Preferência por imóveis com área verde</li>
                    <li><strong>Investimento seguro:</strong> Mercado estável e crescente</li>
                </ul>
                
                <blockquote>
                    "Goianésia oferece o equilíbrio perfeito entre oportunidades de trabalho e qualidade de vida."
                </blockquote>
                
                <h2>Como a Paris Imóveis pode ajudar</h2>
                <p>Nossa equipe conhece profundamente o mercado local e pode orientá-lo na escolha do imóvel ideal, seja para moradia ou investimento. Entre em contato conosco!</p>
            `,
            category: 'Mercado',
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
            createdAt: '2026-01-14T10:00:00Z',
            readTime: '5 min'
        },
        'viver-em-goianesia-qualidade-vida': {
            id: '2',
            slug: 'viver-em-goianesia-qualidade-vida',
            title: 'Por que Viver em Goianésia? Qualidade de Vida no Interior de Goiás',
            excerpt: 'Goianésia oferece uma qualidade de vida excepcional, combinando tranquilidade do interior com infraestrutura urbana completa.',
            content: `
                <p><strong>Goianésia</strong> é uma cidade que oferece o melhor dos dois mundos: a tranquilidade e segurança do interior com toda a infraestrutura de uma cidade urbana desenvolvida.</p>
                
                <h2>Qualidade de vida</h2>
                <p>Com ruas arborizadas, baixos índices de violência e um custo de vida acessível, Goianésia se destaca como uma excelente opção para quem busca qualidade de vida.</p>
                
                <h3>Infraestrutura completa</h3>
                <ul>
                    <li>Hospitais e clínicas de qualidade</li>
                    <li>Escolas públicas e particulares renomadas</li>
                    <li>Comércio variado e shopping centers</li>
                    <li>Opções de lazer e cultura</li>
                </ul>
                
                <h2>Economia forte</h2>
                <p>A economia baseada no agronegócio garante emprego e renda para a população. O polo sucroalcooleiro e leiteiro movimenta a cidade e atrai profissionais de diversas áreas.</p>
                
                <blockquote>
                    "Goianésia é uma cidade importante no estado de Goiás, conhecida por ser um forte polo sucroalcooleiro e leiteiro."
                </blockquote>
                
                <h2>Localização estratégica</h2>
                <p>A cerca de 170 km de Goiânia, a cidade oferece fácil acesso à capital quando necessário, mas permite que você aproveite todas as vantagens de morar no interior.</p>
            `,
            category: 'Lifestyle',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            createdAt: '2026-01-12T14:30:00Z',
            readTime: '7 min'
        },
        'financiamento-imobiliario-dicas': {
            id: '3',
            slug: 'financiamento-imobiliario-dicas',
            title: 'Financiamento Imobiliário: Guia Completo para Comprar seu Imóvel',
            excerpt: 'Tudo o que você precisa saber sobre financiamento de imóveis, desde a documentação até a aprovação do crédito.',
            content: `
                <p>Realizar o sonho da casa própria é mais acessível do que você imagina. Com planejamento e as informações certas, você pode conquistar seu imóvel através do financiamento.</p>
                
                <h2>O que é financiamento imobiliário?</h2>
                <p>O financiamento imobiliário é um empréstimo oferecido por bancos e instituições financeiras para a compra de imóveis. Você paga o valor em parcelas mensais ao longo de vários anos.</p>
                
                <h3>Documentação necessária</h3>
                <ul>
                    <li>RG e CPF</li>
                    <li>Comprovante de renda</li>
                    <li>Comprovante de residência</li>
                    <li>Carteira de trabalho</li>
                    <li>Extrato bancário</li>
                </ul>
                
                <h2>Dicas importantes</h2>
                <ol>
                    <li><strong>Organize suas finanças:</strong> Quite dívidas pendentes antes de solicitar o financiamento</li>
                    <li><strong>Simule valores:</strong> Use simuladores online para planejar as parcelas</li>
                    <li><strong>Compare taxas:</strong> Pesquise em diferentes bancos</li>
                    <li><strong>Considere os custos extras:</strong> ITBI, registro, escritura</li>
                </ol>
                
                <blockquote>
                    "A Paris Imóveis oferece consultoria gratuita para auxiliar você em todo o processo de financiamento."
                </blockquote>
            `,
            category: 'Dicas',
            imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            createdAt: '2026-01-10T09:00:00Z',
            readTime: '8 min'
        },
        'investir-imoveis-goianesia': {
            id: '4',
            slug: 'investir-imoveis-goianesia',
            title: 'Investir em Imóveis em Goianésia: O Polo do Agronegócio',
            excerpt: 'Saiba por que Goianésia é uma excelente opção para investimento imobiliário, com economia forte baseada no agronegócio.',
            content: `
                <p>Investir em imóveis é uma das formas mais seguras de multiplicar seu patrimônio. E <strong>Goianésia</strong> se apresenta como uma excelente opção para quem busca retorno e segurança.</p>
                
                <h2>Por que investir em Goianésia?</h2>
                <p>A cidade possui uma economia forte e diversificada, baseada principalmente no agronegócio. Isso garante demanda constante por imóveis residenciais e comerciais.</p>
                
                <h3>Vantagens do investimento</h3>
                <ul>
                    <li><strong>Valorização constante:</strong> Imóveis na região têm apresentado valorização acima da média</li>
                    <li><strong>Demanda aquecida:</strong> Crescimento populacional e econômico garantem demanda</li>
                    <li><strong>Renda de aluguel:</strong> Boa procura por imóveis para locação</li>
                    <li><strong>Segurança:</strong> Investimento em ativo real, protegido da inflação</li>
                </ul>
                
                <h2>Tipos de investimento</h2>
                <p>Você pode investir em diferentes tipos de imóveis em Goianésia:</p>
                <ul>
                    <li>Casas residenciais</li>
                    <li>Apartamentos</li>
                    <li>Lotes em loteamentos</li>
                    <li>Imóveis comerciais</li>
                    <li>Terrenos rurais</li>
                </ul>
                
                <blockquote>
                    "A Paris Imóveis é especialista no mercado de Goianésia e pode ajudá-lo a encontrar as melhores oportunidades de investimento."
                </blockquote>
            `,
            category: 'Investimento',
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            createdAt: '2026-01-08T11:00:00Z',
            readTime: '6 min'
        }
    };

    return posts[slug] || null;
}

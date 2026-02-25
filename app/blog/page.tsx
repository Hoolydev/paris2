'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { FaCalendarAlt, FaClock, FaArrowRight } from 'react-icons/fa';

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

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            // Try to fetch from backend with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${BACKEND_URL}/api/posts`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Falha ao carregar posts');
            }
            const data = await response.json();
            setPosts(data);
        } catch {
            // Silently fallback to mock data if backend is not available
            setPosts(getMockPosts());
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

    const featuredPost = posts[0];
    const regularPosts = posts.slice(1);

    return (
        <main className={styles.main}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Blog Paris Imóveis</h1>
                    <p className={styles.pageDescription}>
                        Dicas, novidades e informações sobre o mercado imobiliário em Goianésia e região
                    </p>
                </div>
            </div>

            <div className={styles.content}>
                <div className="container-wide">
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Carregando artigos...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📝</div>
                            <h2 className={styles.emptyTitle}>Nenhum artigo disponível</h2>
                            <p className={styles.emptyText}>Em breve teremos novos conteúdos para você!</p>
                        </div>
                    ) : (
                        <>
                            {/* Featured Post */}
                            {featuredPost && (
                                <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredPost}>
                                    <div className={styles.featuredImage}>
                                        <img
                                            src={featuredPost.imageUrl || '/blog/default-blog.jpg'}
                                            alt={featuredPost.title}
                                        />
                                    </div>
                                    <div className={styles.featuredContent}>
                                        <span className={styles.featuredBadge}>Destaque</span>
                                        <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                                        <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>
                                        <div className={styles.featuredMeta}>
                                            <span><FaCalendarAlt /> {formatDate(featuredPost.createdAt)}</span>
                                            <span><FaClock /> {featuredPost.readTime}</span>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Regular Posts */}
                            {regularPosts.length > 0 && (
                                <>
                                    <h2 className={styles.sectionTitle}>Últimos Artigos</h2>
                                    <div className={styles.blogGrid}>
                                        {regularPosts.map((post) => (
                                            <Link href={`/blog/${post.slug}`} key={post.id} className={styles.blogCard}>
                                                <div className={styles.cardImage}>
                                                    <img
                                                        src={post.imageUrl || '/blog/default-blog.jpg'}
                                                        alt={post.title}
                                                    />
                                                    <span className={styles.categoryBadge}>{post.category}</span>
                                                </div>
                                                <div className={styles.cardContent}>
                                                    <div className={styles.cardMeta}>
                                                        <span><FaCalendarAlt /> {formatDate(post.createdAt)}</span>
                                                        <span><FaClock /> {post.readTime}</span>
                                                    </div>
                                                    <h3 className={styles.cardTitle}>{post.title}</h3>
                                                    <p className={styles.cardExcerpt}>{post.excerpt}</p>
                                                    <span className={styles.readMore}>
                                                        Ler mais <FaArrowRight />
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

// Mock data for development/fallback
function getMockPosts(): BlogPost[] {
    return [
        {
            id: '1',
            slug: 'mercado-imobiliario-goianesia-2026',
            title: 'Mercado Imobiliário em Goianésia: Tendências para 2026',
            excerpt: 'Descubra as principais tendências do mercado imobiliário em Goianésia e como aproveitar as melhores oportunidades de investimento na região.',
            content: '',
            category: 'Mercado',
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
            createdAt: '2026-01-14T10:00:00Z',
            readTime: '5 min'
        },
        {
            id: '2',
            slug: 'viver-em-goianesia-qualidade-vida',
            title: 'Por que Viver em Goianésia? Qualidade de Vida no Interior de Goiás',
            excerpt: 'Goianésia oferece uma qualidade de vida excepcional, combinando tranquilidade do interior com infraestrutura urbana completa.',
            content: '',
            category: 'Lifestyle',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            createdAt: '2026-01-12T14:30:00Z',
            readTime: '7 min'
        },
        {
            id: '3',
            slug: 'financiamento-imobiliario-dicas',
            title: 'Financiamento Imobiliário: Guia Completo para Comprar seu Imóvel',
            excerpt: 'Tudo o que você precisa saber sobre financiamento de imóveis, desde a documentação até a aprovação do crédito.',
            content: '',
            category: 'Dicas',
            imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            createdAt: '2026-01-10T09:00:00Z',
            readTime: '8 min'
        },
        {
            id: '4',
            slug: 'investir-imoveis-goianesia',
            title: 'Investir em Imóveis em Goianésia: O Polo do Agronegócio',
            excerpt: 'Saiba por que Goianésia é uma excelente opção para investimento imobiliário, com economia forte baseada no agronegócio.',
            content: '',
            category: 'Investimento',
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            createdAt: '2026-01-08T11:00:00Z',
            readTime: '6 min'
        }
    ];
}

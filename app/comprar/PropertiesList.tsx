'use client';

import { useState } from 'react';
import PropertyCard from '@/components/PropertyCard';
import styles from './page.module.css';

interface Property {
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
}

interface PropertiesListProps {
    properties: Property[];
}

export default function PropertiesList({ properties }: PropertiesListProps) {
    const [filters, setFilters] = useState({
        type: '',
        priceRange: '',
        location: '',
        bedrooms: '',
    });

    return (
        <div className={styles.content}>
            <div className="container-wide">
                <div className={styles.layout}>
                    {/* Filtros Laterais */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterBox}>
                            <h3 className={styles.filterTitle}>Filtros</h3>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Tipo de Imóvel</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="casa">Casa</option>
                                    <option value="apartamento">Apartamento</option>
                                    <option value="terreno">Terreno</option>
                                    <option value="zona rural">Zona Rural</option>
                                    <option value="minha casa minha vida">Minha Casa Minha Vida</option>
                                    <option value="alto padrão">Alto Padrão</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Faixa de Preço</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filters.priceRange}
                                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="0-300k">Até R$ 300.000</option>
                                    <option value="300k-800k">R$ 300.000 - R$ 800.000</option>
                                    <option value="800k+">Acima de R$ 800.000</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Bairro</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                >
                                    <option value="">Todos os bairros</option>

                                    <optgroup label="Setores Tradicionais">
                                        <option value="Boa Vista">Boa Vista</option>
                                        <option value="Carrilho">Carrilho</option>
                                        <option value="Vila Vera Cruz">Vila Vera Cruz</option>
                                        <option value="Jardim Itapuã">Jardim Itapuã</option>
                                        <option value="Eurípedes Barsanulfo">Eurípedes Barsanulfo</option>
                                        <option value="Campestre">Campestre</option>
                                        <option value="Parque Araguaia">Parque Araguaia</option>
                                        <option value="Morada Nova">Morada Nova</option>
                                        <option value="Flamboyant">Flamboyant</option>
                                        <option value="Setor Universitário">Setor Universitário</option>
                                        <option value="Nossa Senhora da Penha">Nossa Senhora da Penha</option>
                                        <option value="Nossa Senhora Aparecida">Nossa Senhora Aparecida</option>
                                        <option value="Jardim do Cerrado">Jardim do Cerrado</option>
                                        <option value="Aldeia do Morro">Aldeia do Morro</option>
                                        <option value="Paulo Dias">Paulo Dias</option>
                                        <option value="Negrinho Carrilho">Negrinho Carrilho</option>
                                    </optgroup>

                                    <optgroup label="Residenciais">
                                        <option value="Colina Park Residencial">Colina Park Residencial</option>
                                        <option value="Residencial Vereda dos Buritis">Residencial Vereda dos Buritis</option>
                                        <option value="Bouganville">Bouganville</option>
                                        <option value="Residencial Mariana">Residencial Mariana</option>
                                        <option value="Residencial Granville">Residencial Granville</option>
                                        <option value="Residencial Vivally">Residencial Vivally</option>
                                        <option value="Residencial Ipê">Residencial Ipê</option>
                                        <option value="Condomínio Canaã">Condomínio Canaã</option>
                                        <option value="Condomínio Residencial Meridian">Condomínio Residencial Meridian</option>
                                    </optgroup>

                                    <optgroup label="Jardins e Parques">
                                        <option value="Jardim Esperança I">Jardim Esperança I</option>
                                        <option value="Jardim Esperança II">Jardim Esperança II</option>
                                        <option value="Jardim Primavera I">Jardim Primavera I</option>
                                        <option value="Jardim Primavera II">Jardim Primavera II</option>
                                        <option value="Parque das Palmeiras I">Parque das Palmeiras I</option>
                                        <option value="Parque das Palmeiras II">Parque das Palmeiras II</option>
                                    </optgroup>

                                    <optgroup label="Vilas">
                                        <option value="Bairro Dona Fiica I">Bairro Dona Fiica I</option>
                                        <option value="Bairro Dona Fiica II">Bairro Dona Fiica II</option>
                                        <option value="Vila Santa Tereza">Vila Santa Tereza</option>
                                        <option value="Vila Nova Aurora">Vila Nova Aurora</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Quartos</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filters.bedrooms}
                                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="1">1 quarto</option>
                                    <option value="2">2 quartos</option>
                                    <option value="3">3 quartos</option>
                                    <option value="4+">4+ quartos</option>
                                </select>
                            </div>

                            <button
                                className={styles.clearButton}
                                onClick={() => setFilters({ type: '', priceRange: '', location: '', bedrooms: '' })}
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </aside>

                    {/* Conteúdo Principal */}
                    <div className={styles.mainContent}>
                        {properties.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                                Nenhum imóvel cadastrado ainda.
                            </p>
                        ) : (
                            <section className={styles.categorySection}>
                                <h2 className={styles.categoryTitle}>Todos os Imóveis</h2>
                                <div className={styles.propertyGrid}>
                                    {properties.map((property) => (
                                        <PropertyCard key={property.id} {...property} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

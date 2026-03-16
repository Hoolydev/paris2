'use client';

import { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import styles from './page.module.css';

interface Property {
    id: string;
    title: string;
    type: string;
    categories?: string[];
    price: string;
    image?: string;
    images?: string[];
    location: string;
    neighborhood?: string;
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
        categories: [] as string[], // Mudança de 'type' para 'categories'
        priceRange: '',
        location: '',
        bedrooms: '',
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [isLoading, setIsLoading] = useState(false);

    const parsePriceToNumber = (value: string): number => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return NaN;
        return Number(digits);
    };

    const normalizeText = (value: string): string =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();

    // Apply filters with a small delay to show loading state
    const applyFilters = () => {
        setIsLoading(true);
        setTimeout(() => {
            setAppliedFilters(filters);
            setIsLoading(false);
        }, 300);
    };

    // Auto-apply filters when any filter changes (existing behavior)
    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedFilters(filters);
        }, 500); // Small delay to prevent excessive re-renders

        return () => clearTimeout(timer);
    }, [filters]);

    const filteredProperties = properties.filter((property) => {
        let matches = true;

        // Filter by Categories - verifica se o imóvel tem pelo menos uma das categorias selecionadas
        if (appliedFilters.categories.length > 0) {
            // Usa as categorias do imóvel (se existirem) ou o tipo como fallback
            const propertyCategories = (property.categories && property.categories.length > 0) ? property.categories : [property.type];
            
            const hasMatchingCategory = appliedFilters.categories.some(filterCat => 
                propertyCategories.some(propCat => 
                    propCat.toLowerCase() === filterCat.toLowerCase()
                )
            );
            
            if (!hasMatchingCategory) {
                matches = false;
            }
        }

        // Filter by Location
        if (appliedFilters.location) {
            const selectedNeighborhood = normalizeText(appliedFilters.location);
            const propertyNeighborhood = normalizeText(property.neighborhood || '');
            const propertyLocation = normalizeText(property.location || '');

            const matchesNeighborhood =
                propertyNeighborhood === selectedNeighborhood ||
                propertyNeighborhood.includes(selectedNeighborhood) ||
                selectedNeighborhood.includes(propertyNeighborhood);

            const matchesLocation =
                propertyLocation === selectedNeighborhood ||
                propertyLocation.includes(selectedNeighborhood) ||
                selectedNeighborhood.includes(propertyLocation);

            if (!matchesNeighborhood && !matchesLocation) {
                matches = false;
            }
        }

        // Filter by Bedrooms
        if (appliedFilters.bedrooms) {
            if (appliedFilters.bedrooms === '4+') {
                if (property.bedrooms < 4) matches = false;
            } else {
                if (property.bedrooms !== parseInt(appliedFilters.bedrooms)) matches = false;
            }
        }

        // Filter by Price Range
        if (appliedFilters.priceRange) {
            const priceNum = parsePriceToNumber(property.price);
            if (!isNaN(priceNum)) {
                if (appliedFilters.priceRange === '0-300k' && priceNum > 300000) matches = false;
                if (appliedFilters.priceRange === '300k-800k' && (priceNum <= 300000 || priceNum > 800000)) matches = false;
                if (appliedFilters.priceRange === '800k+' && priceNum <= 800000) matches = false;
            } else {
                matches = false;
            }
        }

        return matches;
    });

    return (
        <div className={styles.content}>
            <div className="container-wide">
                <div className={styles.layout}>
                    {/* Filtros Laterais */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterBox}>
                            <h3 className={styles.filterTitle}>Filtros</h3>
                            
                            {/* Contador de filtros ativos */}
                            {(appliedFilters.categories.length + 
                              (appliedFilters.priceRange ? 1 : 0) + 
                              (appliedFilters.location ? 1 : 0) + 
                              (appliedFilters.bedrooms ? 1 : 0)) > 0 && (
                                <div className={styles.activeFiltersCount}>
                                    {(appliedFilters.categories.length + 
                                      (appliedFilters.priceRange ? 1 : 0) + 
                                      (appliedFilters.location ? 1 : 0) + 
                                      (appliedFilters.bedrooms ? 1 : 0))} filtro(s) ativo(s)
                                </div>
                            )}

                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Categorias do Imóvel</label>
                                <div className={styles.categoryFilters}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Casa')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Casa']
                                                    : filters.categories.filter(cat => cat !== 'Casa');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Casa
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Apartamento')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Apartamento']
                                                    : filters.categories.filter(cat => cat !== 'Apartamento');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Apartamento
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Terreno')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Terreno']
                                                    : filters.categories.filter(cat => cat !== 'Terreno');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Terreno
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Zona Rural')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Zona Rural']
                                                    : filters.categories.filter(cat => cat !== 'Zona Rural');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Zona Rural
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Minha Casa Minha Vida')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Minha Casa Minha Vida']
                                                    : filters.categories.filter(cat => cat !== 'Minha Casa Minha Vida');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Minha Casa Minha Vida
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes('Alto Padrão')}
                                            onChange={(e) => {
                                                const newCategories = e.target.checked
                                                    ? [...filters.categories, 'Alto Padrão']
                                                    : filters.categories.filter(cat => cat !== 'Alto Padrão');
                                                setFilters({ ...filters, categories: newCategories });
                                            }}
                                        />
                                        Alto Padrão
                                    </label>
                                </div>
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

                            <div className={styles.filterActions}>
                                <button
                                    className={styles.applyButton}
                                    onClick={applyFilters}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Aplicando...' : 'Aplicar Filtros'}
                                </button>
                                <button
                                    className={styles.clearButton}
                                    onClick={() => {
                                        setFilters({ categories: [], priceRange: '', location: '', bedrooms: '' });
                                        setAppliedFilters({ categories: [], priceRange: '', location: '', bedrooms: '' });
                                    }}
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Conteúdo Principal */}
                    <div className={styles.mainContent}>
                        {isLoading && (
                            <div className={styles.loadingMessage}>
                                <p>Aplicando filtros...</p>
                            </div>
                        )}
                        {filteredProperties.length === 0 ? (
                            <div className={styles.noResults}>
                                <p>Nenhum imóvel encontrado com estes filtros.</p>
                                <button 
                                    className={styles.clearButton}
                                    onClick={() => {
                                        setFilters({ categories: [], priceRange: '', location: '', bedrooms: '' });
                                        setAppliedFilters({ categories: [], priceRange: '', location: '', bedrooms: '' });
                                    }}
                                >
                                    Limpar todos os filtros
                                </button>
                            </div>
                        ) : (
                            <section className={styles.categorySection}>
                                <h2 className={styles.categoryTitle}>Imóveis Encontrados ({filteredProperties.length})</h2>
                                <div className={styles.propertyGrid}>
                                    {filteredProperties.map((property) => (
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

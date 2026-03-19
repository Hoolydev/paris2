'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cadastro.module.css';
import DeleteModal from './DeleteModal';

interface Property {
    id: string;
    title: string;
    type: string;
    categories?: string[]; // Novo campo para múltiplas categorias
    price: string;
    image: string;
    images?: string[];
    location: string;
    neighborhood?: string;
    code?: string;
    bedrooms: number;
    bathrooms?: number;
    suites?: number;
    garage?: number;
    area: string;
    landArea?: string;
    builtArea?: string;
    description: string;
    features?: string[];
}

export default function CadastroPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        categories: [] as string[], // Novo campo para múltiplas categorias
        price: '',
        location: '',
        neighborhood: '',
        code: '',
        bedrooms: '',
        bathrooms: '',
        suites: '',
        garage: '',
        area: '',
        landArea: '',
        builtArea: '',
        description: '',
        features: ''
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [featuredImageIndex, setFeaturedImageIndex] = useState<number>(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);
    const router = useRouter();

    const formatPrice = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (!numbers) return '';
        const formatted = parseInt(numbers, 10).toLocaleString('pt-BR');
        return `R$ ${formatted}`;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPrice(e.target.value);
        setFormData({ ...formData, price: formatted });
    };

    // Função para lidar com checkboxes de categorias
    const handleCategoryChange = (category: string, checked: boolean) => {
        const newCategories = checked
            ? [...formData.categories, category]
            : formData.categories.filter(cat => cat !== category);
        setFormData({ ...formData, categories: newCategories });
    };

    useEffect(() => {
        checkAuth();
        fetchProperties();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/check');
            if (!response.ok) {
                router.push('/cadastro/login');
            }
        } catch (error) {
            router.push('/cadastro/login');
        }
    };

    const fetchProperties = async () => {
        try {
            const response = await fetch('/api/properties');
            if (response.ok) {
                const data = await response.json();
                setProperties(data);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);

            // Create previews
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (featuredImageIndex >= imagePreviews.length - 1 + existingImages.length) {
            setFeaturedImageIndex(0);
        }
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
        if (featuredImageIndex >= index && featuredImageIndex > 0) {
            setFeaturedImageIndex(prev => prev - 1);
        }
    };

    const setAsCover = (index: number) => {
        setFeaturedImageIndex(index);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrls: string[] = [...existingImages];

            // Upload new images
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        imageUrls.push(uploadData.url);
                    } else {
                        const errorData = await uploadResponse.json().catch(() => ({}));
                        const msg = errorData.error || `Erro HTTP ${uploadResponse.status}`;
                        alert(`Erro ao fazer upload da imagem "${file.name}": ${msg}`);
                        setUploading(false);
                        return;
                    }
                }
            }

            if (imageUrls.length === 0) {
                alert('Por favor, adicione pelo menos uma imagem.');
                setUploading(false);
                return;
            }

            // Reorder images to put featured image first
            const featuredImage = imageUrls[featuredImageIndex];
            const otherImages = imageUrls.filter((_, index) => index !== featuredImageIndex);
            const orderedImages = [featuredImage, ...otherImages];

            const propertyData = {
                ...formData,
                images: orderedImages,
                image: orderedImages[0], // Featured image
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
                suites: formData.suites ? parseInt(formData.suites) : 0,
                garage: formData.garage ? parseInt(formData.garage) : 0,
                area: formData.builtArea || formData.landArea || '',
                landArea: formData.landArea,
                builtArea: formData.builtArea,
                location: formData.location,
                neighborhood: formData.neighborhood,
                code: formData.code,
                type: formData.categories[0] || 'Casa', // Tipo principal (primeira categoria)
                categories: formData.categories, // Salva categorias no campo correto
                features: [...formData.categories, ...formData.features.split(',').map(f => f.trim()).filter(f => f !== '')]
            };

            const url = editingId ? `/api/properties?id=${editingId}` : '/api/properties';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(propertyData),
            });

            if (response.ok) {
                cancelEdit();
                fetchProperties();
                alert(editingId ? 'Imóvel atualizado com sucesso!' : 'Imóvel cadastrado com sucesso!');
            }
        } catch (error) {
            console.error('Error saving property:', error);
            alert('Erro ao salvar imóvel. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (property: Property) => {
        setEditingId(property.id);
        setFormData({
            title: property.title,
            type: property.type,
            categories: property.features?.filter(f => ['Casa', 'Apartamento', 'Terreno', 'Zona Rural', 'Minha Casa Minha Vida', 'Alto Padrão'].includes(f)) || [property.type],
            price: property.price,
            location: property.location,
            neighborhood: property.neighborhood || '',
            code: property.code || '',
            bedrooms: property.bedrooms.toString(),
            bathrooms: property.bathrooms?.toString() || '',
            suites: property.suites?.toString() || '',
            garage: property.garage?.toString() || '',
            area: property.area,
            landArea: property.landArea || '',
            builtArea: property.builtArea || '',
            description: property.description,
            features: property.features?.filter(f => !['Casa', 'Apartamento', 'Terreno', 'Zona Rural', 'Minha Casa Minha Vida', 'Alto Padrão'].includes(f)).join(', ') || ''
        });
        setExistingImages(property.images || [property.image || '']);
        setFeaturedImageIndex(0);
        setImageFiles([]);
        setImagePreviews([]);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({
            title: '',
            type: '',
            categories: [],
            price: '',
            location: '',
            neighborhood: '',
            code: '',
            bedrooms: '',
            bathrooms: '',
            suites: '',
            garage: '',
            area: '',
            landArea: '',
            builtArea: '',
            description: '',
            features: ''
        });
        setExistingImages([]);
        setFeaturedImageIndex(0);
        setImageFiles([]);
        setImagePreviews([]);
    };

    const handleDelete = (id: string, name: string) => {
        setPropertyToDelete({ id, name });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;

        try {
            const response = await fetch(`/api/properties?id=${propertyToDelete.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchProperties();
                setDeleteModalOpen(false);
                setPropertyToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting property:', error);
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setPropertyToDelete(null);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/cadastro/login');
    };

    if (loading) {
        return <div className={styles.loading}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Painel Administrativo</h1>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Sair
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>
                        {editingId ? '✏️ Editando Imóvel' : 'Cadastrar Novo Imóvel'}
                    </h2>
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            style={{
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginBottom: '15px',
                                fontSize: '14px'
                            }}
                        >
                            ← Cancelar Edição
                        </button>
                    )}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Título</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categorias do Imóvel</label>
                            <div className={styles.categoriesContainer}>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="casa"
                                        checked={formData.categories.includes('Casa')}
                                        onChange={(e) => handleCategoryChange('Casa', e.target.checked)}
                                    />
                                    <label htmlFor="casa" className={styles.categoryLabel}>Casa</label>
                                </div>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="apartamento"
                                        checked={formData.categories.includes('Apartamento')}
                                        onChange={(e) => handleCategoryChange('Apartamento', e.target.checked)}
                                    />
                                    <label htmlFor="apartamento" className={styles.categoryLabel}>Apartamento</label>
                                </div>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="terreno"
                                        checked={formData.categories.includes('Terreno')}
                                        onChange={(e) => handleCategoryChange('Terreno', e.target.checked)}
                                    />
                                    <label htmlFor="terreno" className={styles.categoryLabel}>Terreno</label>
                                </div>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="zona-rural"
                                        checked={formData.categories.includes('Zona Rural')}
                                        onChange={(e) => handleCategoryChange('Zona Rural', e.target.checked)}
                                    />
                                    <label htmlFor="zona-rural" className={styles.categoryLabel}>Zona Rural</label>
                                </div>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="minha-casa"
                                        checked={formData.categories.includes('Minha Casa Minha Vida')}
                                        onChange={(e) => handleCategoryChange('Minha Casa Minha Vida', e.target.checked)}
                                    />
                                    <label htmlFor="minha-casa" className={styles.categoryLabel}>Minha Casa Minha Vida</label>
                                </div>
                                <div className={styles.categoryOption}>
                                    <input
                                        type="checkbox"
                                        id="alto-padrao"
                                        checked={formData.categories.includes('Alto Padrão')}
                                        onChange={(e) => handleCategoryChange('Alto Padrão', e.target.checked)}
                                    />
                                    <label htmlFor="alto-padrao" className={styles.categoryLabel}>Alto Padrão</label>
                                </div>
                            </div>
                            {formData.categories.length === 0 && (
                                <p className={styles.categoryRequired}>Selecione pelo menos uma categoria</p>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Preço</label>
                            <input
                                type="text"
                                value={formData.price}
                                onChange={handlePriceChange}
                                className={styles.input}
                                placeholder="R$ 500.000"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Imagens do Imóvel</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className={styles.input}
                                required={imageFiles.length === 0}
                            />

                            {/* Existing images (when editing) */}
                            {existingImages.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Imagens atuais:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {existingImages.map((img, index) => (
                                            <div
                                                key={`existing-${index}`}
                                                style={{
                                                    position: 'relative',
                                                    border: featuredImageIndex === index ? '3px solid #c8a97e' : '3px solid transparent',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Imagem ${index + 1}`}
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => setAsCover(index)}
                                                    title="Clique para definir como capa"
                                                />
                                                {featuredImageIndex === index && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '0',
                                                        left: '0',
                                                        right: '0',
                                                        background: '#c8a97e',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        textAlign: 'center',
                                                        padding: '2px'
                                                    }}>⭐ CAPA</div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(index)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-2px',
                                                        right: '-2px',
                                                        background: 'red',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New image previews */}
                            {imagePreviews.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                                        {existingImages.length > 0 ? 'Novas imagens:' : 'Clique na imagem para definir como capa:'}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {imagePreviews.map((preview, index) => {
                                            const globalIndex = existingImages.length + index;
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        border: featuredImageIndex === globalIndex ? '3px solid #c8a97e' : '3px solid transparent',
                                                        borderRadius: '10px',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => setAsCover(globalIndex)}
                                                        title="Clique para definir como capa"
                                                    />
                                                    {featuredImageIndex === globalIndex && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '0',
                                                            left: '0',
                                                            right: '0',
                                                            background: '#c8a97e',
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            textAlign: 'center',
                                                            padding: '2px'
                                                        }}>⭐ CAPA</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-2px',
                                                            right: '-2px',
                                                            background: 'red',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={styles.input}
                                placeholder="Descreva o imóvel..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Localização (Cidade/Estado)</label>
                            <input
                                list="locations"
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className={styles.input}
                                placeholder="Cidade, Estado"
                                required
                            />
                            <datalist id="locations">
                                <option value="Goianésia, GO" />
                                <option value="Vila Propício, GO" />
                                <option value="Cafelândia, GO" />
                                <option value="Juscelândia, GO" />
                                <option value="Santa Rita do Novo Destino, GO" />
                            </datalist>
                        </div>

                        <div className={styles.formGroup} style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Bairro</label>
                                <select
                                    value={formData.neighborhood}
                                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                    className={styles.input}
                                >
                                    <option value="">Selecione...</option>

                                    <optgroup label="Setores Tradicionais">
                                        <option value="Centro">Centro</option>
                                        <option value="Setor Sul">Setor Sul</option>
                                        <option value="Setor Oeste">Setor Oeste</option>
                                        <option value="São Cristóvão">São Cristóvão</option>
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
                                        <option value="Laurentino martins">Laurentino martins</option>
                                        <option value="Covoá">Covoá</option>
                                        <option value="Mariana Park">Mariana Park</option>
                                        <option value="Muniz Falcão">Muniz Falcão</option>
                                        <option value="Nestor ville">Nestor ville</option>
                                        <option value="Santa Cecilia">Santa Cecilia</option>
                                        <option value="Santa Luzia">Santa Luzia</option>
                                        <option value="Santa Clara">Santa Clara</option>
                                        <option value="Vereda dos Buritis">Vereda dos Buritis</option>
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
                                        <option value="Parque das Palmeiras 3">Parque das Palmeiras 3</option>
                                    </optgroup>

                                    <optgroup label="Vilas">
                                        <option value="Bairro Dona Fiica I">Bairro Dona Fiica I</option>
                                        <option value="Bairro Dona Fiica II">Bairro Dona Fiica II</option>
                                        <option value="Vila Santa Tereza">Vila Santa Tereza</option>
                                        <option value="Vila Nova Aurora">Vila Nova Aurora</option>
                                    </optgroup>

                                    <option value="Outro">Outro (especificar na descrição)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Código do Anúncio</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className={styles.input}
                                    placeholder="Ex: 12971"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Quartos</label>
                                <input
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    className={styles.input}
                                    min="0"
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Suítes</label>
                                <input
                                    type="number"
                                    value={formData.suites}
                                    onChange={(e) => setFormData({ ...formData, suites: e.target.value })}
                                    className={styles.input}
                                    min="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Banheiros</label>
                                <input
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                    className={styles.input}
                                    min="0"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Garagem</label>
                                <input
                                    type="number"
                                    value={formData.garage}
                                    onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
                                    className={styles.input}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Área Construída</label>
                                <input
                                    type="text"
                                    value={formData.builtArea}
                                    onChange={(e) => setFormData({ ...formData, builtArea: e.target.value })}
                                    className={styles.input}
                                    placeholder="120m²"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className={styles.label}>Área do Terreno</label>
                                <input
                                    type="text"
                                    value={formData.landArea}
                                    onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                                    className={styles.input}
                                    placeholder="300m²"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Comodidades (separadas por vírgula)</label>
                            <textarea
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                className={styles.input}
                                placeholder="Piscina, Churrasqueira, Portão Eletrônico, Quintal..."
                                rows={2}
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={uploading}>
                            {uploading ? 'Enviando...' : editingId ? '💾 Salvar Alterações' : 'Cadastrar Imóvel'}
                        </button>
                    </form>
                </div>

                <div className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Imóveis Cadastrados ({properties.length})</h2>
                    {properties.length === 0 ? (
                        <p className={styles.emptyMessage}>Nenhum imóvel cadastrado ainda.</p>
                    ) : (
                        <div className={styles.propertyList}>
                            {properties.map((property) => (
                                <div key={property.id} className={styles.propertyCard}>
                                    <img
                                        src={property.images && property.images.length > 0 ? property.images[0] : property.image}
                                        alt={property.title}
                                        className={styles.propertyImage}
                                    />
                                    <div className={styles.propertyInfo}>
                                        <h3 className={styles.propertyTitle}>{property.title}</h3>
                                        <p className={styles.propertyDetails}>
                                            {property.type} • {property.location}
                                        </p>
                                        <p className={styles.propertyPrice}>{property.price}</p>
                                        <p className={styles.propertyMeta}>
                                            {property.bedrooms} quartos • {property.area}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(property)}
                                            style={{
                                                background: '#c8a97e',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(property.id, property.title)}
                                            className={styles.deleteButton}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModalOpen}
                propertyName={propertyToDelete?.name || ''}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}

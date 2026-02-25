'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ContatoPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui você pode adicionar a lógica para enviar o formulário
        console.log('Formulário enviado:', formData);
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <main className={styles.main}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Entre em Contato</h1>
                    <p className={styles.pageDescription}>
                        Estamos prontos para atendê-lo
                    </p>
                </div>
            </div>

            <div className={styles.content}>
                <div className="container">
                    <div className={styles.grid}>
                        {/* Informações de Contato */}
                        <div className={styles.infoSection}>
                            <h2 className={styles.sectionTitle}>Fale Conosco</h2>

                            <div className={styles.contactInfo}>
                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}>📞</div>
                                    <div>
                                        <h3 className={styles.contactLabel}>Telefone</h3>
                                        <p className={styles.contactValue}>(62) 3353-4678</p>
                                    </div>
                                </div>

                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}>📱</div>
                                    <div>
                                        <h3 className={styles.contactLabel}>WhatsApp</h3>
                                        <p className={styles.contactValue}>(62) 9 8588-6688</p>
                                    </div>
                                </div>

                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}>✉️</div>
                                    <div>
                                        <h3 className={styles.contactLabel}>E-mail</h3>
                                        <p className={styles.contactValue}>parisimoveis0@gmail.com</p>
                                    </div>
                                </div>

                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}>📍</div>
                                    <div>
                                        <h3 className={styles.contactLabel}>Endereço</h3>
                                        <p className={styles.contactValue}>
                                            Rua 14, nº 320 - Centro<br />
                                            Goianésia - GO
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.hoursBox}>
                                <h3 className={styles.hoursTitle}>Horário de Atendimento</h3>
                                <p className={styles.hoursText}>
                                    Segunda a Sexta: 08:00 às 12:00 e 13:00 às 18:00
                                </p>
                            </div>
                        </div>

                        {/* Formulário de Contato */}
                        <div className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>Envie uma Mensagem</h2>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name" className={styles.label}>Nome Completo *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className={styles.input}
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="email" className={styles.label}>E-mail *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className={styles.input}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="phone" className={styles.label}>Telefone *</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className={styles.input}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="subject" className={styles.label}>Assunto *</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        className={styles.select}
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione um assunto</option>
                                        <option value="compra">Comprar Imóvel</option>
                                        <option value="venda">Vender Imóvel</option>
                                        <option value="aluguel">Alugar Imóvel</option>
                                        <option value="avaliacao">Avaliação de Imóvel</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="message" className={styles.label}>Mensagem *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        className={styles.textarea}
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    Enviar Mensagem
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

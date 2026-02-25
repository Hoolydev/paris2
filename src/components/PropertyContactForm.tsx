'use client';

import { useState } from 'react';
import styles from './PropertyContactForm.module.css';

interface PropertyContactFormProps {
    propertyTitle: string;
}

export default function PropertyContactForm({ propertyTitle }: PropertyContactFormProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(`Olá! Gostaria de mais informações sobre o imóvel: ${propertyTitle}`);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const phoneNumber = "5562985886688";

        let finalMessage = `${message}\n\n*Dados do Cliente:*\nNome: ${name}\nTelefone: ${phone}\nEmail: ${email}`;

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;
        window.open(url, '_blank');
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome"
                    required
                    className={styles.input}
                />
            </div>
            <div className={styles.field}>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefone"
                    required
                    className={styles.input}
                />
            </div>
            <div className={styles.field}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className={styles.input}
                />
            </div>
            <div className={styles.field}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mensagem"
                    rows={4}
                    className={styles.textarea}
                />
            </div>
            <button type="submit" className={styles.submitButton}>
                Enviar Mensagem
            </button>
        </form>
    );
}

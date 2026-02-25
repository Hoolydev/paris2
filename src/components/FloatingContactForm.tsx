"use client";

import { useState } from 'react';
import styles from './FloatingContactForm.module.css';

const CHARACTER_SRC = "/assets/personagem_apontando_esquerda.svg";

export default function FloatingContactForm() {
    const [isOpen, setIsOpen] = useState(false); // Start closed? Or open? User asked for minimizable. Let's start closed so they see the FAB, or open. Let's start False (closed) or True? Usually chat widgets start closed or minimized. Let's start CLOSED to show off the FAB.
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const phoneNumber = "5562985886688";

        let message = `Olá! Gostaria de mais informações.`;
        if (name) message += ` Meu nome é ${name}.`;
        if (phone) message += ` Meu telefone é ${phone}.`;

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className={styles.container}>
            {/* Form Window */}
            <div className={`${styles.formContainer} ${!isOpen ? styles.closed : ''}`}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Fale com o Andrézinho</h3>
                    <button onClick={() => setIsOpen(false)} className={styles.closeButton} aria-label="Fechar">×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.formContent}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="float-name">Nome</label>
                        <input
                            id="float-name"
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="float-phone">Telefone</label>
                        <input
                            id="float-phone"
                            type="tel"
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(xx) xxxxx-xxxx"
                        />
                    </div>
                    <button type="submit" className={styles.submitButton}>
                        <span>Iniciar Conversa</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                    </button>

                </form>
                {/* Character inside the form */}
                <img src={CHARACTER_SRC} alt="Andrezinho" className={styles.characterInForm} />
            </div>

            {/* Minimized Button (FAB) - Visible only when form is closed */}
            {!isOpen && (
                <button className={styles.fab} onClick={toggleOpen} aria-label="Abrir chat">
                    {/* Use a simple icon or the character face if available. Using WhatsApp icon for clarity or just the character? */}
                    {/* User says "personagem ... minimizavel". Usually means when minimized you see the character or a button. */}
                    <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                </button>
            )}
        </div>
    );
}

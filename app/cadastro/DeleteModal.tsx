'use client';

import styles from './DeleteModal.module.css';

interface DeleteModalProps {
    isOpen: boolean;
    propertyName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteModal({ isOpen, propertyName, onConfirm, onCancel }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.modal} onClick={onCancel}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalIcon}>
                    ⚠️
                </div>
                <h2 className={styles.modalTitle}>Excluir Imóvel?</h2>
                <p className={styles.modalMessage}>
                    Tem certeza que deseja excluir este imóvel?
                </p>
                <p className={styles.modalPropertyName}>
                    "{propertyName}"
                </p>
                <div className={styles.modalActions}>
                    <button
                        className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                        onClick={onConfirm}
                    >
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}

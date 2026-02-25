'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import styles from './Header.module.css';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="https://i.postimg.cc/HL6cbPLx/LOGO-PRATA.png"
                        alt="Paris Imóveis"
                        width={180}
                        height={60}
                        priority
                        className={styles.logo}
                        unoptimized
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className={styles.desktopNav}>
                    <Link href="/" className={styles.navLink}>Início</Link>
                    <Link href="/comprar" className={styles.navLink}>Comprar</Link>
                    <Link href="/blog" className={styles.navLink}>Blog</Link>
                    <Link href="/sobre" className={styles.navLink}>Sobre</Link>
                    <Link href="/contato" className={styles.navLink}>Contato</Link>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Menu"
                >
                    <span className={styles.hamburger}></span>
                    <span className={styles.hamburger}></span>
                    <span className={styles.hamburger}></span>
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className={styles.mobileNav}>
                    <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                        Início
                    </Link>
                    <Link href="/comprar" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                        Comprar
                    </Link>
                    <Link href="/blog" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                        Blog
                    </Link>
                    <Link href="/sobre" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                        Sobre
                    </Link>
                    <Link href="/contato" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                        Contato
                    </Link>
                </nav>
            )}
        </header>
    );
}

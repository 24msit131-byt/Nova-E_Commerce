import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232b241d'/%3E%3Cstop offset='100%25' stop-color='%2353473b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1920' height='1080' fill='url(%23g)'/%3E%3C/svg%3E";

const wasImageLoaded = (url) => {
    try {
        return localStorage.getItem('homeHeroLoadedImageUrl') === url;
    } catch {
        return false;
    }
};

const rememberLoadedImage = (url) => {
    try {
        localStorage.setItem('homeHeroLoadedImageUrl', url);
    } catch {
        // ignore storage failures
    }
};

const Hero = ({ banner }) => {
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        textMain: '#FFFFFF',    // Switched to White for readability on image
        textSecondary: '#E0D8CC', // Light Beige
        accent: '#E0D8CC',
        overlay: 'rgba(0, 0, 0, 0.4)' // Subtle dark overlay
    };

    const title = banner?.title || 'Pure solutions for a spotless sanctuary.';
    const subtitle = banner?.subtitle || 'Nova brings the art of curation to home care. Elevate your living space with eco-conscious products designed for performance and peace of mind.';
    const link = banner?.link || '/products';
    const imageUrl = banner?.imageUrl || fallbackImageUrl;
    const hasKnownLoadedImage = imageUrl !== fallbackImageUrl && wasImageLoaded(imageUrl);
    const [isImageLoaded, setIsImageLoaded] = useState(imageUrl === fallbackImageUrl || hasKnownLoadedImage);

    useEffect(() => {
        let isMounted = true;

        if (!imageUrl || imageUrl === fallbackImageUrl) {
            setIsImageLoaded(true);
            return () => {
                isMounted = false;
            };
        }

        if (wasImageLoaded(imageUrl)) {
            setIsImageLoaded(true);
            return () => {
                isMounted = false;
            };
        }

        setIsImageLoaded(false);
        const img = new Image();
        img.src = imageUrl;

        if (img.complete) {
            rememberLoadedImage(imageUrl);
            setIsImageLoaded(true);
            return () => {
                isMounted = false;
            };
        }

        img.onload = () => {
            if (isMounted) {
                rememberLoadedImage(imageUrl);
                setIsImageLoaded(true);
            }
        };

        img.onerror = () => {
            if (isMounted) {
                setIsImageLoaded(true);
            }
        };

        return () => {
            isMounted = false;
        };
    }, [imageUrl]);

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#2b241d]">
            
            {/* 1. Background Image - Spans Full Section */}
            <div className="absolute inset-0 z-0">
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-[#2b241d] to-[#53473b] transition-opacity duration-500 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    src={imageUrl}
                    alt="Hero Background"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={() => {
                        rememberLoadedImage(imageUrl);
                        setIsImageLoaded(true);
                    }}
                    onError={() => setIsImageLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity ${isImageLoaded ? 'duration-150 opacity-100' : 'duration-300 opacity-0'}`}
                />
                {/* 2. Dark Overlay for Text Contrast */}
                <div
                    className={`absolute inset-0 transition-opacity ${isImageLoaded ? 'duration-150 opacity-100' : 'duration-300 opacity-0'}`}
                    style={{ backgroundColor: colors.overlay }}
                />
            </div>

            {/* 3. Content Container */}
            <div className="container mx-auto px-6 md:px-10 lg:px-16 relative z-10 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-3xl"
                >
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 0.2 }}
                        className="text-[10px] font-black uppercase tracking-[0.4em] mb-4"
                        style={{ color: colors.primary }}
                    >
                        Established Sanctuary Essentials
                    </motion.p>

                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.95]" style={{ color: colors.textMain }}>
                        {title.split(' ').map((word, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (i * 0.05) }}
                                className="inline-block mr-4"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 text-lg md:text-xl leading-relaxed max-w-xl opacity-90"
                        style={{ color: colors.textSecondary }}
                    >
                        {subtitle}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-10 flex flex-wrap gap-4"
                    >
                        <Link
                            to={link}
                            className="group relative px-12 py-5 bg-[#A68A64] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full overflow-hidden shadow-2xl transition-all active:scale-95"
                        >
                            <span className="relative z-10 group-hover:text-[#4A4036] transition-colors duration-300">Shop Collection</span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Link>

                        <Link
                            to="/products"
                            className="px-12 py-5 border-2 border-white/30 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black active:scale-95"
                        >
                            View Journal
                        </Link>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 1.2 }}
                        className="mt-20 flex items-center gap-10 text-white"
                    >
                        <div className="flex flex-col">
                            <span className="text-4xl font-black italic">100%</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">Plant Origined</span>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="flex flex-col">
                            <span className="text-4xl font-black italic">0%</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">Sulphates / Toxins</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
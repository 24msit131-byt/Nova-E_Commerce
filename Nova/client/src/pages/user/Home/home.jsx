import React, { useState, useEffect } from 'react';
import Hero from './hero';
import Footer from '../../../components/Footer';
import { FaLeaf, FaShieldVirus, FaWater } from 'react-icons/fa';
import ValueSection from './ValueSection';
import OurProcess from './OurProcess';
import FeaturedCollection from './featuredCollection';
import api from '../../../services/api';

const getCachedBanner = () => {
    try {
        const cached = localStorage.getItem('homeBanner');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState(getCachedBanner);

    useEffect(() => {
        const heroUrl = banner?.imageUrl;
        if (!heroUrl) {
            return;
        }

        const preloadId = 'home-hero-preload';
        let preloadLink = document.getElementById(preloadId);

        if (!preloadLink) {
            preloadLink = document.createElement('link');
            preloadLink.id = preloadId;
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            document.head.appendChild(preloadLink);
        }

        preloadLink.href = heroUrl;
    }, [banner?.imageUrl]);

    useEffect(() => {
        const fetchHomeData = async () => {
            setLoading(true);

            const productsPromise = api
                .get('/products')
                .then((productsRes) => {
                    setProducts(productsRes.data.data);
                })
                .catch((err) => {
                    console.error('Error fetching products:', err);
                });

            const bannerPromise = api
                .get('/banner')
                .then((bannerRes) => {
                    const latestBanner = bannerRes.data?.data || null;
                    setBanner(latestBanner);

                    if (latestBanner) {
                        localStorage.setItem('homeBanner', JSON.stringify(latestBanner));
                    }
                })
                .catch((err) => {
                    console.error('Error fetching banner:', err);
                });

            try {
                await Promise.allSettled([productsPromise, bannerPromise]);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching home data:', err);
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    return (
        <div>
            <Hero banner={banner} />
            <ValueSection />
            <FeaturedCollection products={products} loading={loading} />
            <OurProcess />

            <section className="py-20 bg-[#4A4036] text-center px-6">
                <h2 className="text-white text-2xl font-bold mb-4">Join the Clean Club</h2>
                <p className="text-[#FAF7F2]/60 mb-8 text-sm">Receive 10% off your first order and cleaning tips.</p>
                <div className="max-w-md mx-auto flex gap-2">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-1 bg-[#FAF7F2] rounded-xl px-6 py-4 outline-none text-sm"
                    />
                    <button className="bg-[#A68A64] text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest">
                        Join
                    </button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default Home;    
import React, { useState, useEffect } from 'react';
import Hero from './hero';
import Footer from '../../../components/Footer';
import { FaLeaf, FaShieldVirus, FaWater, FaTag, FaShippingFast, FaGift, FaClock, FaStar } from 'react-icons/fa';
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

    const bestOffers = [
        {
            title: 'Bundle & Save',
            description: 'Curated multi-product kits for kitchen, bath, and floor care with instant checkout discounts.',
            badge: 'Up to 25% OFF',
            accent: 'from-[#A68A64] via-[#8D7353] to-[#4A4036]'
        },
        {
            title: 'Free Delivery Window',
            description: 'Complimentary shipping on eligible orders with fast dispatch across major cities.',
            badge: 'Fast Dispatch',
            accent: 'from-[#1F3A5F] via-[#325C8D] to-[#6FA0C9]'
        },
        {
            title: 'Starter Gift Pack',
            description: 'Get a mini travel-size cleaner on your first order to try the Nova essentials range.',
            badge: 'Limited Drop',
            accent: 'from-[#4C6A58] via-[#6E8B6D] to-[#A7C4A0]'
        }
    ];

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

            <section className="relative overflow-hidden px-4 md:px-8 py-8 md:py-16">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(166,138,100,0.14),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(74,64,54,0.08),_transparent_40%)]"></div>
                <div className="relative max-w-7xl mx-auto rounded-[2rem] md:rounded-[3rem] border border-[#E0D8CC] bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(74,64,54,0.08)] overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-[36%] p-8 md:p-10 lg:p-12 bg-[#4A4036] text-white relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#A68A64]/15 blur-3xl"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#FAF7F2]/80">
                                    <FaTag /> Best Offers
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                        Offers designed to make every refill feel smarter.
                                    </h2>
                                    <p className="text-sm md:text-base text-[#FAF7F2]/70 leading-relaxed max-w-md">
                                        Explore bundled savings, first-order perks, and delivery benefits built for everyday home care.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <FaStar className="text-[#D8C09A] mb-2" />
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Top Rated</p>
                                        <p className="mt-1 text-sm font-semibold">Loved by repeat buyers</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <FaClock className="text-[#D8C09A] mb-2" />
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Limited Time</p>
                                        <p className="mt-1 text-sm font-semibold">Fresh deals updated weekly</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-5 md:p-8 lg:p-10">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {bestOffers.map((offer) => (
                                    <article
                                        key={offer.title}
                                        className="group relative overflow-hidden rounded-[1.75rem] border border-[#E0D8CC] bg-[#FAF7F2] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(74,64,54,0.12)]"
                                    >
                                        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${offer.accent}`}></div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64] shadow-sm border border-[#E0D8CC]/60">
                                                    <FaGift className="text-[10px]" /> {offer.badge}
                                                </span>
                                                <h3 className="text-xl font-black tracking-tight text-[#4A4036]">{offer.title}</h3>
                                            </div>
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${offer.accent} text-white shadow-lg`}>
                                                <FaShippingFast />
                                            </div>
                                        </div>

                                        <p className="mt-5 text-sm leading-relaxed text-[#756A5E]">
                                            {offer.description}
                                        </p>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#4A4036]">
                                                <span className="h-2.5 w-2.5 rounded-full bg-[#A68A64]"></span>
                                                Smart saving
                                            </div>
                                            <button className="rounded-full border border-[#E0D8CC] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#4A4036] transition-colors hover:border-[#A68A64] hover:text-[#A68A64]">
                                                Shop offer
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-5 rounded-[1.75rem] border border-dashed border-[#E0D8CC] bg-white px-5 py-4 md:px-6 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Bonus for bundle buyers</p>
                                    <p className="mt-1 text-sm text-[#756A5E]">Add 3 or more liquid essentials and unlock an extra savings tier at checkout.</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#4A4036]">
                                    <FaLeaf className="text-[#A68A64]" />
                                    Eco-friendly value picks
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
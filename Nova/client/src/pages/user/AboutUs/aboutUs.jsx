import React from 'react';
import { FaRocket, FaLeaf, FaShieldAlt, FaUsers, FaAward, FaHistory } from 'react-icons/fa';
import Footer from '../../../components/Footer';

const AboutUs = () => {
    // Nova Unified Theme Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#FAF7F2',      // Warm Cream
        sectionBg: '#F2EBDD',   // Grounded Beige
        deepBg: '#2C2621',      // Deep Grounded Brown
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#D6C9B5'       // Light Beige Borders
    };

    return (
        <div className="min-h-screen pt-20 pb-0 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>
            
            {/* 1. HERO SECTION (High Impact - Compact) */}
            <section className="w-full px-6 md:px-10 py-20 text-white relative overflow-hidden" style={{ backgroundColor: colors.deepBg }}>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] -mr-32 -mb-32 opacity-20" style={{ backgroundColor: colors.primary }}></div>
                <div className="relative z-10 max-w-5xl">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight uppercase">
                        Elevating the <br />
                        <span style={{ color: colors.primary }}>Sanctuary.</span>
                    </h1>
                    <p className="mt-8 text-base md:text-lg font-medium leading-relaxed max-w-xl opacity-80">
                        Nova is a curation of science and lifestyle. We are dedicated to transforming daily environments into healthier, 
                        purer spaces through thoughtful, sustainable innovation.
                    </p>
                </div>
            </section>

            {/* 2. OUR STORY (Reduced Gap) */}
            <section className="w-full px-6 md:px-10 py-20 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em]" style={{ color: colors.primary }}>The Heritage</h3>
                    <h2 className="text-4xl font-black tracking-tighter leading-tight" style={{ color: colors.textMain }}>
                        Crafted in Ahmedabad,<br />Curated for Modernity.
                    </h2>
                    <p className="text-sm md:text-base leading-relaxed font-medium" style={{ color: colors.textSecondary }}>
                        Founded in 2025, Nova began with a singular focus: to redefine the purity of the Indian household. 
                        We observed that while technology advanced in our digital lives, the essentials used to maintain our 
                        homes remained harsh and antiquated.
                    </p>
                    <div className="pt-4 flex items-center space-x-10">
                        <div>
                            <p className="text-2xl font-black" style={{ color: colors.textMain }}>50k+</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50">Happy Sanctuaries</p>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: colors.accent }}></div>
                        <div>
                            <p className="text-2xl font-black" style={{ color: colors.textMain }}>120+</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50">Regions Covered</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full h-[450px] rounded-[2.5rem] overflow-hidden shadow-xl border" style={{ borderColor: colors.accent }}>
                    <img 
                        src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200" 
                        alt="Nova Aesthetic Studio" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                    />
                </div>
            </section>

            {/* 3. CORE VALUES (Boutique Grid - Tightened) */}
            <section className="w-full px-6 md:px-10 py-20" style={{ backgroundColor: colors.sectionBg }}>
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: colors.primary }}>Our DNA</h3>
                    <h2 className="text-3xl font-black tracking-tighter" style={{ color: colors.textMain }}>Values that Define Excellence.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <FaLeaf />, title: "Eco-Conscious", desc: "Plant-based and safe for the planetary cycle." },
                        { icon: <FaRocket />, title: "Innovation", desc: "Maximum sanctuary performance via pure chemistry." },
                        { icon: <FaShieldAlt />, title: "Safety", desc: "Non-toxic formulations safe for family and pets." },
                        { icon: <FaAward />, title: "Quality", desc: "Artisan-grade ingredients. Zero compromises." }
                    ].map((value, i) => (
                        <div key={i} className="bg-white p-10 rounded-[2.5rem] border transition-all duration-500 hover:shadow-xl group" style={{ borderColor: colors.accent }}>
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl mb-6 transition-all group-hover:scale-110 shadow-sm" style={{ backgroundColor: colors.pageBg, color: colors.primary }}>
                                {value.icon}
                            </div>
                            <h4 className="text-lg font-bold mb-3 uppercase tracking-tight" style={{ color: colors.textMain }}>{value.title}</h4>
                            <p className="text-xs font-medium leading-relaxed" style={{ color: colors.textSecondary }}>{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. THE COLLECTIVE (Team - Compact) */}
            <section className="w-full px-6 md:px-10 py-20">
                <div className="flex items-end justify-between mb-12 gap-8">
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: colors.primary }}>The Visionaries</h3>
                        <h2 className="text-3xl font-black tracking-tighter" style={{ color: colors.textMain }}>Meet the Collective.</h2>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 pb-1 transition-all hover:opacity-50" style={{ borderColor: colors.textMain, color: colors.textMain }}>
                        Join Vision
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[
                        { name: "Rahul Prajapati", role: "Founder & CEO", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
                        { name: "Sarah Chen", role: "Science Director", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
                        { name: "James Wilson", role: "Creative Lead", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" }
                    ].map((member, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 relative border shadow-sm" style={{ borderColor: colors.accent }}>
                                <img 
                                    src={member.img} 
                                    alt={member.name} 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#2C2621]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                            <h4 className="text-xl font-black tracking-tight" style={{ color: colors.textMain }}>{member.name}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1" style={{ color: colors.primary }}>{member.role}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. CTA (Compact Impact) */}
            <section className="w-full px-6 md:px-10 py-16">
                <div className="w-full rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-xl" style={{ backgroundColor: colors.primary }}>
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mt-32 blur-2xl"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-10 uppercase leading-tight">
                            The Art of <br />Pure Curation.
                        </h2>
                        <button className="px-12 py-5 bg-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 hover:bg-[#2C2621] hover:text-white shadow-lg active:scale-95" style={{ color: colors.textMain }}>
                            Explore Store
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>     
    );
};

export default AboutUs;
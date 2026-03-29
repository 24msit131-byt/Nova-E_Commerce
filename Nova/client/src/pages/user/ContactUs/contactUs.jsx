import React, { useState } from 'react';
import { 
    FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, 
    FaPaperPlane, FaWhatsapp, FaDirections, FaCoffee, 
    FaParking, FaWheelchair, FaFacebook, FaInstagram, FaTwitter 
} from 'react-icons/fa';
import Footer from '../../../components/Footer';

const ContactUs = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    // Nova Brand Palette
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        pageBg: '#FAF7F2',      // Warm Cream
        sectionBg: '#F2EBDD',   // Grounded Beige
        deepBg: '#2C2621',      // Deep Grounded Brown
        textMain: '#4A4036',    // Dark Brown
        textSecondary: '#756A5E', // Medium Brown
        accent: '#D6C9B5'       // Light Beige Borders
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen pt-24 pb-0 w-full overflow-x-hidden" style={{ backgroundColor: colors.pageBg }}>
            
            {/* 1. EMOTIVE HERO SECTION */}
            <section className="w-full px-6 md:px-10 py-28 text-white relative overflow-hidden" style={{ backgroundColor: colors.deepBg }}>
                <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>
                <div className="relative z-10 max-w-4xl">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: colors.primary }}>Get in Touch</h3>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight uppercase">
                        We’re here to help <br />
                        <span style={{ color: colors.primary }}>you shine.</span>
                    </h1>
                    <p className="mt-8 text-base md:text-lg font-medium leading-relaxed max-w-2xl opacity-80" style={{ color: '#E0D8CC' }}>
                        Whether you have a question about our botanical formulas or need assistance with a sanctuary order, 
                        the Nova concierge team is ready to assist you.
                    </p>
                </div>
            </section>

            {/* 2. INTERACTIVE INFO GRID (Restored all 4 cards) */}
            <section className="w-full px-6 md:px-10 -mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <FaPhoneAlt />, title: "Concierge Line", detail: "+91 98765 43210", sub: "Mon-Sat, 9am - 6pm" },
                        { icon: <FaEnvelope />, title: "Digital Inquiry", detail: "hello@novahome.com", sub: "24/7 Digital Support" },
                        { icon: <FaMapMarkerAlt />, title: "Our Studio", detail: "Ahmedabad, Gujarat", sub: "Artisan District, S.G." },
                        { icon: <FaClock />, title: "Studio Hours", detail: "10:00 - 19:00", sub: "Sunday Sanctuary" }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border transition-all duration-500 hover:-translate-y-2" style={{ borderColor: colors.accent }}>
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl mb-8 shadow-sm" style={{ backgroundColor: colors.pageBg, color: colors.primary }}>
                                {item.icon}
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: colors.textMain }}>{item.title}</h4>
                            <p className="text-sm font-bold" style={{ color: colors.textMain }}>{item.detail}</p>
                            <p className="text-[11px] mt-1 font-medium opacity-60" style={{ color: colors.textSecondary }}>{item.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. THE CONTACT FORM SECTION (Narrative + Boutique Form) */}
            <section className="w-full px-6 md:px-10 py-32 flex flex-col lg:flex-row gap-20">
                <div className="lg:w-1/3 space-y-8">
                    <h2 className="text-4xl font-black tracking-tighter uppercase" style={{ color: colors.textMain }}>Send us a <br /><span style={{ color: colors.primary }}>Message.</span></h2>
                    <p className="text-base leading-relaxed font-medium" style={{ color: colors.textSecondary }}>
                        Have a specific inquiry regarding our formulas or looking for a professional partnership? 
                        Fill out the form and our representative will respond within 24 hours.
                    </p>
                    <div className="pt-10 space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: colors.textMain }}>Follow the Collection</p>
                        <div className="flex space-x-5">
                            {[FaFacebook, FaInstagram, FaTwitter].map((Icon, i) => (
                                <a key={i} href="#" className="h-10 w-10 rounded-full border flex items-center justify-center transition-all hover:text-white" style={{ borderColor: colors.accent, color: colors.textSecondary }} onMouseEnter={(e) => e.target.style.backgroundColor = colors.textMain} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                                    <Icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} onFocus={(e) => e.target.style.borderColor = colors.primary} onBlur={(e) => e.target.style.borderColor = colors.accent} placeholder="Rahul Prajapati" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} onFocus={(e) => e.target.style.borderColor = colors.primary} onBlur={(e) => e.target.style.borderColor = colors.accent} placeholder="rahul@novahome.com" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Subject</label>
                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent" style={{ borderColor: colors.accent, color: colors.textMain }} onFocus={(e) => e.target.style.borderColor = colors.primary} onBlur={(e) => e.target.style.borderColor = colors.accent} placeholder="How can we assist your sanctuary?" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: colors.textMain }}>Your Inquiry</label>
                            <textarea name="message" rows="4" value={formData.message} onChange={handleChange} className="w-full py-4 border-b-2 outline-none text-base font-bold transition-all bg-transparent resize-none" style={{ borderColor: colors.accent, color: colors.textMain }} onFocus={(e) => e.target.style.borderColor = colors.primary} onBlur={(e) => e.target.style.borderColor = colors.accent} placeholder="Detail your thoughts here..." />
                        </div>
                        
                        {/* DUAL ACTION BUTTONS */}
                        <div className="md:col-span-2 pt-6 flex flex-col sm:flex-row gap-4">
                            <button 
                                type="submit"
                                className="px-12 py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center group active:scale-95 flex-1"
                                style={{ backgroundColor: colors.primary, boxShadow: `0 15px 30px rgba(166, 138, 100, 0.3)` }}
                            >
                                <span>Dispatch Message</span>
                                <FaPaperPlane className="ml-4 text-[10px] group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
                            </button>

                            <a 
                                href="https://wa.me/919876543210" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-12 py-5 border-2 text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-500 flex items-center justify-center group active:scale-95 flex-1 hover:bg-[#2C2621] hover:text-white"
                                style={{ borderColor: colors.accent, color: colors.textMain }}
                            >
                                <FaWhatsapp className="mr-3 text-lg" style={{ color: '#25D366' }} />
                                <span>Chat via WhatsApp</span>
                            </a>
                        </div>
                    </form>
                </div>
            </section>

            {/* 4. UPGRADED MAP SECTION (Sanctuary Locator) */}
            <section className="w-full px-6 md:px-10 pb-20">
                <div className="w-full h-[650px] rounded-[4rem] relative overflow-hidden border shadow-2xl flex flex-col lg:flex-row" style={{ borderColor: colors.accent }}>
                    
                    {/* Left Side: Map Sidebar Info */}
                    <div className="lg:w-[350px] h-full bg-white z-20 border-r p-12 flex flex-col justify-between" style={{ borderColor: colors.accent }}>
                        <div className="space-y-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-[9px] font-black uppercase tracking-widest text-green-600 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Open Now
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Ahmedabad Studio</h3>
                                <p className="mt-4 text-sm font-medium leading-relaxed" style={{ color: colors.textSecondary }}>
                                    Experience our full collection of botanical care in person.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textMain }}>
                                    <FaParking className="text-lg" style={{ color: colors.primary }} /> Private Guest Parking
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textMain }}>
                                    <FaCoffee className="text-lg" style={{ color: colors.primary }} /> Artisan Coffee Bar
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textMain }}>
                                    <FaWheelchair className="text-lg" style={{ color: colors.primary }} /> Fully Accessible
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-5 border-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-[#2C2621] hover:text-white" style={{ borderColor: colors.textMain, color: colors.textMain }}>
                            Schedule Consultation
                        </button>
                    </div>

                    {/* Right Side: Visual Map Area */}
                    <div className="flex-1 h-full relative bg-[#F2EBDD]">
                        <img 
                            src="https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&q=80&w=2000" 
                            alt="Ahmedabad Artisan District" 
                            className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-12 rounded-[3rem] bg-white/90 backdrop-blur-xl shadow-2xl border max-w-sm" style={{ borderColor: colors.accent }}>
                                <div className="h-20 w-20 rounded-full bg-[#2C2621] mx-auto flex items-center justify-center text-white text-3xl mb-6 shadow-xl animate-bounce">
                                    <FaMapMarkerAlt />
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tighter" style={{ color: colors.textMain }}>Artisan District, S.G.</h4>
                                <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: colors.textSecondary }}>Ahmedabad, Gujarat 380054</p>
                                <a 
                                    href="https://www.google.com/maps" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-8 inline-flex items-center gap-3 px-10 py-4 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    <FaDirections /> Get Directions
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactUs;
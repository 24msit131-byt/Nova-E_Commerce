import React from 'react';
import { FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const Footer = () => {
    const colors = {
        primary: '#A68A64',     // Earthy Gold
        secondary: '#fdfbfbff',   // Warm Cream White (Background)
        textMain: '#4A4036',    // Dark Brown Text
        textSecondary: '#756A5E', // Medium Brown
        accent: '#E0D8CC'       // Light Beige (Borders)
    };

    return (
        // Changed: Removed max-width and set background to full width
        <footer style={{ backgroundColor: colors.secondary, color: colors.textMain }} className="pt-10 pb-8 border-t border-[#E0D8CC] w-full">

            {/* Changed: Removed responsive padding (px-10, px-20, etc.) to allow edge-to-edge layout */}
            <div className="w-full px-6 md:px-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Brand Section */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black tracking-tighter uppercase" style={{ color: colors.textMain }}>
                            NOVA<span style={{ color: colors.primary }}>.</span>
                        </h2>
                        <p className="text-[15px] leading-relaxed opacity-90 max-w-xs">
                            Elevating home care with sustainable, aesthetic, and effective cleaning solutions for the modern sanctuary.
                        </p>
                        <div className="flex gap-4">
                            {[FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full border border-[#E0D8CC] flex items-center justify-center hover:bg-[#4A4036] hover:text-white transition-all duration-300">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-8" ><span style={{ color: colors.primary }}>Shop</span></h3>
                        <ul className="space-y-4 text-[13px] font-medium">
                            {['All Products', 'Kitchen', 'Bathroom', 'Surface Care', 'Kits & Bundles'].map(link => (
                                <li key={link}>
                                    <Link to="/products" className="hover:opacity-60 transition-opacity">{link}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-8"><span style={{ color: colors.primary }}>Company</span></h3>
                        <ul className="space-y-4 text-[13px] font-medium">
                            {['About Us', 'Sustainability', 'Careers', 'Journal', 'Contact'].map(link => (
                                <li key={link}>
                                    <Link to="#" className="hover:opacity-60 transition-opacity">{link}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-8"><span style={{ color: colors.primary }}>Contact</span></h3>
                        <ul className="space-y-5 text-[13px]">
                            <li className="flex items-start gap-3">
                                <HiOutlineLocationMarker className="text-xl shrink-0" style={{ color: colors.primary }} />
                                <span>123 Green Way, Eco City, <br />KA 560001, India</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <HiOutlinePhone className="text-xl" style={{ color: colors.primary }} />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <HiOutlineMail className="text-xl" style={{ color: colors.primary }} />
                                <span>hello@novahome.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section - Full Width Border */}
                <div className="mt-5 pt-5 border-t border-[#E0D8CC] flex flex-col md:flex-row justify-between items-center text-[15px] font-medium opacity-70">
                    <p>© 2026 Nova Home Cleaning. All rights reserved.</p>
                    <div className="flex gap-5 mt-2 md:mt-0">
                        <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
                        <Link to="/shipping-info" className="hover:underline">Shipping Info</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
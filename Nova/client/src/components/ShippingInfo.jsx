import React from 'react';
import { FaTruck, FaShieldAlt, FaMapPin, FaClock } from 'react-icons/fa';

const ShippingInfo = () => {
  return (
    <div className="min-h-screen bg-[#fdfbfbff] py-20 px-6 font-sans selection:bg-[#A68A64] selection:text-white">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-20 text-center">
          <span className="text-[#A68A64] font-semibold tracking-[0.3em] uppercase text-xs mb-6 block">
            Nova Logistics Guide
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-[#4A4036] tracking-tight mb-8">
            Shipping Information
          </h1>
          <div className="h-1 w-20 bg-[#A68A64] mx-auto rounded-full opacity-60"></div>
          <p className="mt-8 text-[#756A5E] text-lg max-w-xl mx-auto">
            Delivering premium care safely to your doorstep, with a focus on integrity and speed.
          </p>
        </header>

        {/* Core Shipping Stats - Modern Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-white border border-[#E0D8CC] p-8 rounded-[32px] text-center">
            <p className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-2">Local Delivery</p>
            <p className="text-2xl font-bold text-[#4A4036]">24 - 48 Hours</p>
            <p className="text-[#756A5E] text-sm mt-1">Within Ahmedabad City</p>
          </div>
          <div className="bg-white border border-[#E0D8CC] p-8 rounded-[32px] text-center">
            <p className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-2">Standard Shipping</p>
            <p className="text-2xl font-bold text-[#4A4036]">3 - 5 Days</p>
            <p className="text-[#756A5E] text-sm mt-1">Across Gujarat State</p>
          </div>
        </div>

        {/* Main Content Card */}
        <main className="bg-white border border-[#E0D8CC] rounded-[48px] p-10 md:p-20 shadow-[0_30px_100px_-20px_rgba(166,138,100,0.06)]">
          
          <div className="space-y-16">
            
            {/* Delivery Zones */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-[#E0D8CC] bg-opacity-30 flex items-center justify-center text-[#A68A64]">
                   <FaMapPin size={20} />
                </div>
                <h3 className="text-2xl font-bold text-[#4A4036] italic font-serif">Delivery Zones</h3>
              </div>
              <p className="text-[#756A5E] leading-relaxed text-lg mb-4">
                Nova currently specializes in high-speed delivery within <strong>Ahmedabad, Gujarat</strong>. We are expanding our logistics network to cover other major cities soon. 
              </p>
              <div className="bg-[#fdfbfbff] border border-[#E0D8CC] p-6 rounded-2xl">
                <ul className="space-y-3 text-[#4A4036] text-sm font-medium">
                  <li className="flex justify-between border-b border-[#E0D8CC] pb-2">
                    <span>Ahmedabad Local</span>
                    <span className="text-[#A68A64]">₹40 (Free over ₹499)</span>
                  </li>
                  <li className="flex justify-between border-b border-[#E0D8CC] pb-2 pt-2">
                    <span>Gujarat Region</span>
                    <span className="text-[#A68A64]">₹80 (Free over ₹999)</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Leak-Proof Packaging */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-[#E0D8CC] bg-opacity-30 flex items-center justify-center text-[#A68A64]">
                   <FaShieldAlt size={20} />
                </div>
                <h3 className="text-2xl font-bold text-[#4A4036] italic font-serif">Secure Packaging</h3>
              </div>
              <p className="text-[#756A5E] leading-relaxed text-lg">
                Since we handle cleaning liquids and home care essentials, our <strong>"Triple-Seal"</strong> packaging ensures that your products arrive without any leaks or damage. We use eco-friendly cushions to protect the bottles during transit.
              </p>
            </section>

            {/* Order Tracking */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-[#E0D8CC] bg-opacity-30 flex items-center justify-center text-[#A68A64]">
                   <FaClock size={20} />
                </div>
                <h3 className="text-2xl font-bold text-[#4A4036] italic font-serif">Order Tracking</h3>
              </div>
              <p className="text-[#756A5E] leading-relaxed text-lg">
                Once your Nova order is dispatched, you will receive a real-time tracking link via email and SMS. You can also view your live order status within your <strong>Nova Dashboard</strong>.
              </p>
            </section>

          </div>

          {/* Help Footer */}
          <footer className="mt-24 pt-12 border-t border-[#E0D8CC] text-center">
            <p className="text-[#756A5E] text-sm mb-8 italic">
              Missing a delivery? Our logistics team is here to help.
            </p>
            <a 
              href="mailto:shipping@nova.care" 
              className="px-10 py-4 bg-[#A68A64] text-white rounded-full font-medium hover:bg-[#4A4036] transition-all duration-500 shadow-xl shadow-[#A68A64]/20 hover:shadow-none uppercase tracking-widest text-xs"
            >
              Track Your Package
            </a>
          </footer>
        </main>

        <p className="mt-12 text-center text-[#756A5E] text-[10px] uppercase tracking-[0.4em] opacity-40">
          Shipment processed by Nova Labs
        </p>
      </div>
    </div>
  );
};

export default ShippingInfo;
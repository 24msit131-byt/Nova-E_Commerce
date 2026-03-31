import React from 'react';

const TermsAndServices = () => {
  return (
    <div className="min-h-screen bg-[#fdfbfbff] py-20 px-6 font-sans selection:bg-[#A68A64] selection:text-white">
      {/* Main Content Wrapper */}
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-20 text-center">
          <span className="text-[#A68A64] font-semibold tracking-[0.3em] uppercase text-xs mb-6 block">
            Nova Document No. 01
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-[#4A4036] tracking-tight mb-8">
            Terms & Services
          </h1>
          <div className="h-1 w-20 bg-[#A68A64] mx-auto rounded-full opacity-60"></div>
          <p className="mt-8 text-[#756A5E] text-sm uppercase tracking-widest font-medium opacity-80">
            Effective Date: March 31, 2026
          </p>
        </header>

        {/* Content Section - Single Column Card */}
        <main className="bg-white border border-[#E0D8CC] rounded-[48px] p-10 md:p-20 shadow-[0_30px_100px_-20px_rgba(166,138,100,0.06)]">
          
          <div className="space-y-16">
            
            {/* Section 01 */}
            <section>
              <h2 className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-4">
                01. Introduction
              </h2>
              <h3 className="text-2xl font-bold text-[#4A4036] mb-6 italic font-serif">The Foundation</h3>
              <p className="text-[#756A5E] leading-relaxed text-lg">
                Welcome to <span className="text-[#A68A64] font-semibold">Nova</span>. By interacting with our platform, you agree to these Terms and Services. We provide premium home care solutions designed with safety and aesthetics in mind. These terms govern your purchase and use of our digital and physical goods.
              </p>
            </section>

            {/* Section 02 */}
            <section>
              <h2 className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-4">
                02. User Responsibility
              </h2>
              <h3 className="text-2xl font-bold text-[#4A4036] mb-6 italic font-serif">Privacy & Access</h3>
              <p className="text-[#756A5E] leading-relaxed text-lg">
                To ensure a seamless checkout experience in the <strong>Ahmedabad</strong> region, users must provide accurate delivery data. You are responsible for maintaining the confidentiality of your credentials within our MERN-powered authentication system.
              </p>
            </section>

            {/* Section 03 */}
            <section className="bg-[#fdfbfbff] border border-[#E0D8CC] p-8 rounded-3xl">
              <h2 className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-4">
                03. Product Standards
              </h2>
              <h3 className="text-2xl font-bold text-[#4A4036] mb-6 italic font-serif">Quality Control</h3>
              <div className="space-y-4 text-[#756A5E]">
                <p><strong>Visual Integrity:</strong> Product images represent our "Essential Care" line as accurately as possible.</p>
                <p><strong>Availability:</strong> Stock levels are dynamic. Limited items are reserved only upon successful payment verification.</p>
              </div>
            </section>

            {/* Section 04 */}
            <section>
              <h2 className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-4">
                04. Shipping & Logistics
              </h2>
              <h3 className="text-2xl font-bold text-[#4A4036] mb-6 italic font-serif">The Nova Promise</h3>
              <p className="text-[#756A5E] leading-relaxed text-lg mb-6">
                All shipments originating from our local hubs follow strict safety protocols. Delivery timelines are estimates, prioritizing quality handling over speed to ensure no leaks occur.
              </p>
              <div className="inline-block px-4 py-2 bg-[#E0D8CC] bg-opacity-20 rounded-full text-[#4A4036] text-xs font-medium border border-[#E0D8CC]">
                Priority Delivery: Ahmedabad & Gujarat Region
              </div>
            </section>

            {/* Section 05 */}
            <section>
              <h2 className="text-[#A68A64] text-xs font-bold uppercase tracking-widest mb-4">
                05. Refund Policy
              </h2>
              <h3 className="text-2xl font-bold text-[#4A4036] mb-6 italic font-serif">Returns & Exchanges</h3>
              <p className="text-[#756A5E] leading-relaxed text-lg">
                Due to the nature of chemical care products, returns are restricted. We offer full replacements or refunds for any products that show manufacturing defects or shipping damage, reported within 48 hours.
              </p>
            </section>

          </div>

          {/* Contact Footer */}
          <footer className="mt-24 pt-12 border-t border-[#E0D8CC] text-center">
            <p className="text-[#756A5E] text-sm mb-8">
              Questions regarding these terms?
            </p>
            <a 
              href="mailto:support@nova.care" 
              className="px-10 py-4 bg-[#A68A64] text-white rounded-full font-medium hover:bg-[#4A4036] transition-all duration-500 shadow-xl shadow-[#A68A64]/20 hover:shadow-none uppercase tracking-widest text-xs"
            >
              Contact Legal Support
            </a>
          </footer>
        </main>

        <p className="mt-12 text-center text-[#756A5E] text-[10px] uppercase tracking-[0.4em] opacity-40">
          Nova © 2026 — All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default TermsAndServices;
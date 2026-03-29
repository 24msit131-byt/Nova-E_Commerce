const OurProcess = () => (
  <section className="py-24 px-6 bg-white border-y border-[#E0D8CC]">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-[#4A4036] text-3xl font-bold mb-8">Simple, Honest Ingredients.</h2>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <span className="block text-4xl font-black text-[#E0D8CC] mb-2">01</span>
          <h4 className="text-[#4A4036] font-bold uppercase text-xs tracking-widest mb-2">Source</h4>
          <p className="text-[#4A4036]/60 text-sm">We find the purest essential oils from local growers.</p>
        </div>
        <div className="h-px w-12 bg-[#E0D8CC] hidden md:block"></div>
        <div className="flex-1">
          <span className="block text-4xl font-black text-[#E0D8CC] mb-2">02</span>
          <h4 className="text-[#4A4036] font-bold uppercase text-xs tracking-widest mb-2">Blend</h4>
          <p className="text-[#4A4036]/60 text-sm">Formulated in small batches to ensure quality and safety.</p>
        </div>
        <div className="h-px w-12 bg-[#E0D8CC] hidden md:block"></div>
        <div className="flex-1">
          <span className="block text-4xl font-black text-[#E0D8CC] mb-2">03</span>
          <h4 className="text-[#4A4036] font-bold uppercase text-xs tracking-widest mb-2">Deliver</h4>
          <p className="text-[#4A4036]/60 text-sm">Sustainable packaging sent directly to your doorstep.</p>
        </div>
      </div>
    </div>
  </section>
);
export default OurProcess;
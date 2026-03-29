import { FaLeaf, FaShieldVirus, FaWater } from 'react-icons/fa';

const ValueSection = () => (
  <section className="bg-white py-20 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      <div className="text-center group">
        <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#A68A64] group-hover:bg-[#A68A64] group-hover:text-white transition-all duration-500">
          <FaLeaf size={28} />
        </div>
        <h3 className="text-[#4A4036] font-bold uppercase tracking-widest text-sm mb-3">Plant-Based Power</h3>
        <p className="text-[#4A4036]/70 text-sm leading-relaxed px-4">Effective cleaning derived from coconut and citrus, not harsh chemicals.</p>
      </div>
      <div className="text-center group">
        <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#A68A64] group-hover:bg-[#A68A64] group-hover:text-white transition-all duration-500">
          <FaShieldVirus size={28} />
        </div>
        <h3 className="text-[#4A4036] font-bold uppercase tracking-widest text-sm mb-3">Family & Pet Safe</h3>
        <p className="text-[#4A4036]/70 text-sm leading-relaxed px-4">Non-toxic formulas designed for homes with little feet and wagging tails.</p>
      </div>
      <div className="text-center group">
        <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-6 text-[#A68A64] group-hover:bg-[#A68A64] group-hover:text-white transition-all duration-500">
          <FaWater size={28} />
        </div>
        <h3 className="text-[#4A4036] font-bold uppercase tracking-widest text-sm mb-3">Biodegradable</h3>
        <p className="text-[#4A4036]/70 text-sm leading-relaxed px-4">Leaving nothing behind but a fresh scent and a cleaner planet.</p>
      </div>
    </div>
  </section>
);
export default ValueSection;
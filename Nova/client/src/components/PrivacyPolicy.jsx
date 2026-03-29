import React from 'react';

const PrivacyPolicy = () => {
    // Your Theme Color Constants
    const colors = {
        primary: '#A68A64',
        secondary: '#ece6db',
        accent: '#796e5e',
        textMain: '#4A4036',
        textSecondary: '#756A5E',
        neutralLight: '#F5F5F5'
    };

    const currentYear = new Date().getFullYear();

    return (
        <div style={{ backgroundColor: colors.secondary, color: colors.textMain }} className="min-h-screen font-serif">
            {/* Elegant Header */}
            <header className="py-20 px-6 text-center border-b" style={{ borderColor: colors.accent }}>
                <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-4 mt-8" style={{ color: colors.primary }}>
                    Privacy Policy
                </h1>
                <div className="w-24 h-1 mx-auto mb-6" style={{ backgroundColor: colors.primary }}></div>
                <p className="max-w-2xl mx-auto text-lg italic" style={{ color: colors.textSecondary }}>
                    Refining the way we protect your digital footprint.
                </p>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
                
                {/* Section 1 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-6 uppercase tracking-widest" style={{ color: colors.primary }}>
                        01. Data Collection
                    </h2>
                    <div className="p-8 rounded-sm border" style={{ backgroundColor: colors.neutralLight, borderColor: colors.accent }}>
                        <p className="leading-relaxed mb-4">
                            In our MERN environment, we prioritize minimal data footprints. We collect only what is necessary to facilitate your experience:
                        </p>
                        <ul className="space-y-3 list-inside">
                            <li className="flex gap-3 items-start">
                                <span style={{ color: colors.primary }}>•</span>
                                <span>Account credentials secured via bcrypt hashing.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span style={{ color: colors.primary }}>•</span>
                                <span>Session management via JSON Web Tokens (JWT).</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span style={{ color: colors.primary }}>•</span>
                                <span>Database records stored securely in MongoDB.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 2 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-6 uppercase tracking-widest" style={{ color: colors.primary }}>
                        02. Purpose of Processing
                    </h2>
                    <p className="text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
                        We use your information strictly to maintain account integrity and provide a seamless 
                        user interface. We do not engage in the sale of personal data to third-party aggregators. 
                        Your trust is our primary asset.
                    </p>
                </section>

                {/* Section 3 */}
                <section className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xl font-medium mb-4" style={{ color: colors.textMain }}>Security Standards</h3>
                        <p className="text-sm leading-loose" style={{ color: colors.textSecondary }}>
                            Our Node.js/Express backend employs robust middleware to ensure that all API requests 
                            are authenticated. We use SSL encryption to protect data in transit between your 
                            browser and our servers.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-medium mb-4" style={{ color: colors.textMain }}>Data Retention</h3>
                        <p className="text-sm leading-loose" style={{ color: colors.textSecondary }}>
                            Information is retained only as long as your account remains active. Upon 
                            request for deletion, we perform a complete purge of your records from our 
                            MongoDB clusters.
                        </p>
                    </div>
                </section>

                {/* Footer / Contact */}
                <footer className="pt-16 border-t text-center space-y-4" style={{ borderColor: colors.accent }}>
                    <p className="text-sm uppercase tracking-widest" style={{ color: colors.primary }}>
                        Contact our Privacy Team
                    </p>
                    <p className="text-xl underline underline-offset-8 decoration-1" style={{ color: colors.textMain }}>
                        hello@yourbrand.com
                    </p>
                    <p className="pt-12 text-xs" style={{ color: colors.textSecondary }}>
                        &copy; {currentYear} [Your Project Name]. All rights reserved.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
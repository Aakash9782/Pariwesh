import React from "react";
import SEO from "../../components/common/SEO.jsx";

// Reusable Layout wrapper for static files to ensure visual cohesion
const PageWrapper = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-slate-800 text-left font-sans">
    <h1 className="text-3xl sm:text-5xl font-display font-medium text-textPrimary text-center mb-12 uppercase tracking-wide">
      {title}
    </h1>
    <div className="prose prose-slate max-w-full text-sm leading-relaxed text-textSecondary space-y-6">
      {children}
    </div>
  </div>
);

// 1. ABOUT US PAGE
export const About = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Pariwesh",
    description:
      "Luxurious traditional ethnic suit sets, handcrafted kurtis, and designer wear for women at PARIWESH.",
    publisher: {
      "@type": "Organization",
      name: "Pariwesh",
      url: "https://pariwesh.com",
    },
  };

  return (
    <PageWrapper title="Our Story">
      <SEO
        title="Our Story & Atelier Craftsmanship"
        description="Experience the legacy of PARIWESH. Dedicated to creating high-end, hand-finished ethnic suitability sets, block-print kurtis, and designer linen dresses."
        keywords="About Pariwesh, hand looms, ethnic artisan, block prints, designer boutique"
        structuredData={schema}
      />
      <div className="space-y-6">
        <p className="text-base text-textPrimary italic text-center font-serif max-w-2xl mx-auto mb-8 leading-relaxed">
          "PARIWESH was born out of a deep reverence for heritage fabrics and
          the timeless grace of traditional Indian silhouettes. Every collection
          tells a story of craftsmanship, design symmetry, and modern luxury."
        </p>
        <h3 className="text-lg font-serif font-bold text-textPrimary tracking-wide uppercase pt-4 border-b border-slate-100 pb-2">
          Atelier Philosophy
        </h3>
        <p>
          We believe luxury should exist in comfort. Our silhouettes are
          tailored using standard, high-grade organic fibres—such as fine linen
          blends, rich silk weaves, and hand-loomed cottons. Each piece goes
          through careful hand-finishing processes to ensure clean margins,
          custom draped fits, and structural excellence.
        </p>
        <h3 className="text-lg font-serif font-bold text-textPrimary tracking-wide uppercase pt-4 border-b border-slate-100 pb-2">
          Empowering Artisans
        </h3>
        <p>
          At PARIWESH, we partner with traditional printing communities and
          block-print guilds across Rajasthan and UP. By integrating ancestral
          motifs with clean, structured cuts, we celebrate indigenous crafts and
          ensure sustainable livelihoods for craft clusters, preserving cultural
          assets for tomorrow.
        </p>
      </div>
    </PageWrapper>
  );
};

// 2. CONTACT US PAGE
export const Contact = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Pariwesh",
    description: "Get in touch with PARIWESH customer operational support.",
    mainEntity: {
      "@type": "Organization",
      name: "Pariwesh",
      telephone: "+918209903441",
      email: "support@pariwesh.com",
    },
  };

  return (
    <PageWrapper title="Contact Support">
      <SEO
        title="Contact Us - Customer Care & Support"
        description="Have sizing inquiries or order verification feedback? Reach out to the PARIWESH customer operations team via WhatsApp, email, or telephone."
        keywords="Contact Pariwesh, support email, sizing help, order trace"
        structuredData={schema}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-serif font-bold text-textPrimary tracking-wide uppercase">
            Boutique Operations
          </h3>
          <p className="text-sm">
            For retail partnerships, general feedback, custom fitting sizes, or
            sizing advice, write to our concierge team.
          </p>
          <div className="text-xs space-y-2 pt-2 text-textSecondary font-mono uppercase tracking-wider">
            <p className="text-textPrimary font-sans normal-case">
              <strong>Email:</strong> support@pariwesh.com
            </p>
            <p className="text-textPrimary font-sans normal-case">
              <strong>WhatsApp:</strong> +91 82099 03441
            </p>
            <p>Hours: Mon - Sat | 10:00 AM - 7:00 PM IST</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-xl space-y-4 font-sans text-xs">
          <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
            Quick Inquiry Form
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-textSecondary mb-1">
                NAME
              </label>
              <input
                type="text"
                className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-accent-gold"
              />
            </div>
            <div>
              <label className="block font-bold text-textSecondary mb-1">
                EMAIL
              </label>
              <input
                type="email"
                className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-accent-gold"
              />
            </div>
            <div>
              <label className="block font-bold text-textSecondary mb-1">
                MESSAGE
              </label>
              <textarea
                rows="3"
                className="w-full border border-slate-200 p-2 rounded focus:outline-none focus:border-accent-gold"
              ></textarea>
            </div>
            <button className="bg-[#8a1c14] text-white hover:bg-neutral-900 px-4 py-2.5 rounded font-bold uppercase tracking-widest text-[9px] w-full transition">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

// 3. PRIVACY POLICY PAGE
export const PrivacyPolicy = () => (
  <PageWrapper title="Privacy Protocol">
    <SEO
      title="Privacy Policy & Data Protection"
      description="Read PARIWESH's Privacy Policy. Learn how we handle customer data, authentication keys, and transaction history."
    />
    <div className="space-y-4 text-xs">
      <p>Last updated: August 2026</p>
      <p>
        At PARIWESH, we value user data protection. This privacy statement
        documents our policies regarding user records management, catalog
        tracking, cookie caches, and transaction authentication.
      </p>
      <h3 className="text-sm font-serif font-bold text-textPrimary uppercase pt-2">
        Data We Collect
      </h3>
      <p>
        We collect registration names, shipping locations, authorization logs,
        and SMS or email variables containing transaction verification
        parameters. We utilize this data to guarantee automated payment
        reconciliations and fast deliveries.
      </p>
    </div>
  </PageWrapper>
);

// 4. TERMS & CONDITIONS
export const Terms = () => (
  <PageWrapper title="Terms of Engagement">
    <SEO
      title="Terms & Conditions - User Agreement"
      description="Read the Terms and Conditions governing user orders, boutique deliveries, and website operations at PARIWESH."
    />
    <div className="space-y-4 text-xs">
      <p>Last updated: August 2026</p>
      <p>
        By accessing PARIWESH app endpoints, purchasing catalog dresses, or
        triggering order payments, users explicitly agree to abide by these
        operating terms of agreement.
      </p>
      <h3 className="text-sm font-serif font-bold text-textPrimary uppercase pt-2">
        Catalog Accuracy
      </h3>
      <p>
        We target pixel-exact fabric depiction. Product details, dimensions,
        sizing charts, and discount tags are regularly updated to represent live
        catalog inventory.
      </p>
    </div>
  </PageWrapper>
);

// 5. SHIPPING POLICY
export const ShippingPolicy = () => (
  <PageWrapper title="Shipping & Logistics">
    <SEO
      title="Shipping & Delivery Operations"
      description="Learn about shipping options, delivery TAT, express shipping routes, and tracking logs at PARIWESH."
    />
    <div className="space-y-4 text-xs">
      <p>
        We deliver luxury directly to your home. Every transaction will generate
        an order log, synced automatically to logistics partners (Shiprocket,
        etc.).
      </p>
      <h3 className="text-sm font-serif font-bold text-textPrimary uppercase pt-2">
        Dispatch Timeline
      </h3>
      <p>
        Dispatches are completed within 24 to 48 business hours from our central
        warehouse. Standard express delivery typically takes 3-7 business days
        depending on location.
      </p>
    </div>
  </PageWrapper>
);

// 6. RETURN POLICY
export const ReturnPolicy = () => (
  <PageWrapper title="Return & Refund Guarantee">
    <SEO
      title="Return & Refund Policy"
      description="Read our 7-day hassle-free return and exchange guarantee. Details on QC validation, refund credits, and reverse logistics."
    />
    <div className="space-y-4 text-xs">
      <p>
        For client ease, we maintain a comprehensive 7-day QC-driven return
        window. If fabric sizing feels restrictive, clients can submit an
        exchange or return ticket.
      </p>
      <h3 className="text-sm font-serif font-bold text-textPrimary uppercase pt-2">
        QC Checks
      </h3>
      <p>
        Returned apparel must have original tags attached and show zero wear
        signatures. Upon successful QC inspection, bank settlements are
        processed securely within 3-5 days.
      </p>
    </div>
  </PageWrapper>
);

// 7. CANCELLATION POLICY
export const CancellationPolicy = () => (
  <PageWrapper title="Cancellation Guidelines">
    <SEO
      title="Cancellation & Modification Policies"
      description="Details on order cancellations, transaction modifications, and dispute thresholds at PARIWESH."
    />
    <div className="space-y-4 text-xs">
      <p>
        Orders can be cancelled before warehouse dispatch occurs. Once dispatch
        files are uploaded to shipping services, standard shipping schedules
        will apply.
      </p>
      <h3 className="text-sm font-serif font-bold text-textPrimary uppercase pt-2">
        How to Cancel
      </h3>
      <p>
        Navigate to user orders overview on the user profile or send a message
        to support@pariwesh.com with your unique order ID for immediate
        assistance.
      </p>
    </div>
  </PageWrapper>
);

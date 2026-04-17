import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck, Zap, Globe, Facebook, Instagram, Linkedin } from "lucide-react";

const pillars = [
  { Icon: ShieldCheck, title: "Pharmacy Precision", text: "We double-thought the inventory logic specifically for medical stores, where batch tracking and expiry dates are not just features — they are safety requirements." },
  { Icon: Zap, title: "Retail Velocity", text: "Retailers needed a system that wouldn't lag during peak hours. We built our POS terminal on a high-speed data-node architecture to ensure instant billing." },
  { Icon: Globe, title: "Warehouse Scale", text: "For large-scale warehouses, we implemented multi-branch synchronization, allowing global stock visibility from a single administrative hub." },
];

const faqs = [
  { q: "Who founded GeFlow?", a: "GeFlow was founded by SG Bilal under the Gepard Webs ecosystem, with a vision to redefine business operations through intelligent, lightweight cloud architecture." },
  { q: "What industries does GeFlow serve?", a: "We primarily serve pharmacies, retail outlets, supermarkets, warehouses, and small-to-medium enterprises that require precise inventory and sales control." },
  { q: "How secure is the platform?", a: "GeFlow uses end-to-end encryption, role-based access control, and PCI-DSS compliant payment infrastructure to keep your business data fully protected." },
  { q: "Does GeFlow work offline?", a: "Yes. Our POS terminal is designed with offline-first architecture — transactions sync automatically once connectivity is restored." },
  { q: "What is the GeFlow mission?", a: "To empower the next generation of business owners with operational clarity, automated workflows, and real-time financial intelligence." },
  { q: "Can I use my existing hardware?", a: "Absolutely. GeFlow runs on any modern browser and is compatible with standard barcode scanners, receipt printers, and cash drawers." },
  { q: "Is technical support available?", a: "Premium customers receive 24/7 priority support. All users have access to our knowledge base, video tutorials, and community forum." },
];

const About = () => (
  <Layout>
    {/* Hero */}
    <section className="pt-12 pb-16 text-center">
      <div className="container mx-auto px-4">
        <p className="text-[10px] font-bold tracking-[0.25em] text-primary mb-4">ABOUT GEFLOW • OUR MISSION</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
          The Future of <span className="text-primary">Business</span><br/>Operating Systems
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          GeFlow is more than software; it's a centralized intelligence node for the modern entrepreneur.
        </p>
      </div>
    </section>

    {/* Our Story */}
    <section className="py-12 bg-muted/40">
      <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-5">Our Story</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            The journey of GeFlow began at <span className="text-foreground font-semibold">Gepard Webs</span>, where we observed a critical gap in how local businesses managed their lifecycles. Traditional methods were fragmented, error-prone, and slow.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            We spent years developing a core architecture that could handle the high-velocity demands of pharmacies and warehouses while remaining simple enough for a local retail store to use instantly.
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-primary">10k+</p>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground">ACTIVE NODES</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">24/7</p>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground">UPTIME SLA</p>
            </div>
          </div>
        </div>
        <div className="premium-card overflow-hidden aspect-video bg-gradient-to-br from-primary/20 to-secondary/20" />
      </div>
    </section>

    {/* Pillars */}
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        <h2 className="text-3xl font-bold mb-3">Why We Built GeFlow</h2>
        <p className="text-muted-foreground text-sm mb-10">Resolving the critical "e-selling" barriers for the foundation of commerce.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map(({ Icon, title, text }) => (
            <div key={title} className="premium-card p-7 text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Leadership */}
    <section className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 max-w-md text-center">
        <h2 className="text-3xl font-bold mb-3">Leadership</h2>
        <p className="text-muted-foreground text-sm mb-10">The visionary expert at Gepard Webs bringing you the future of business operations.</p>
        <div className="premium-card p-8">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-5" />
          <h3 className="font-bold text-lg">SG Bilal</h3>
          <p className="text-[10px] font-bold tracking-wider text-primary mb-4">CHAIRMAN & CEO</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Visionary leader with 10+ years in retail tech innovation and cloud architecture. Dedicated to empowering the next generation of business owners.
          </p>
          <div className="flex justify-center gap-2">
            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm">Detailed answers about our platform architecture and vision.</p>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`} className="premium-card px-5 border-0">
              <AccordionTrigger className="font-bold text-sm text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>

    {/* CTA */}
    <section className="pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="premium-card p-10 md:p-14 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Scale with Intelligence?</h2>
          <p className="text-muted-foreground text-sm mb-7 max-w-md mx-auto">
            Join the Gepard Webs ecosystem today and transform your operational data into a strategic asset.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild className="cta-btn rounded-full px-7 h-12 text-xs font-bold tracking-wider">
              <Link to="/signup">CREATE WORKSPACE</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-7 h-12 text-xs font-bold tracking-wider border-2">
              <Link to="/features">VIEW FEATURE MATRIX</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default About;

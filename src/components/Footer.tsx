import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-background py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-primary">
              <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14 8l-5 3v6l5 3 5-3v-6l-5-3z" fill="currentColor" opacity="0.3"/>
            </svg>
            <span className="font-bold text-lg text-primary">GeFlow</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            GeFlow is a modern business operating system designed to manage inventory, sales, and profit tracking in real time.
          </p>
          <div className="flex gap-2">
            {[
              { Icon: Facebook, href: "#", label: "Facebook" },
              { Icon: Instagram, href: "#", label: "Instagram" },
              { Icon: Twitter, href: "#", label: "Twitter" },
              { Icon: Linkedin, href: "#", label: "LinkedIn" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-sm mb-4">Quick Links</h4>
          <div className="flex flex-col gap-2.5">
            <Link to="/" className="text-muted-foreground text-sm hover:text-primary transition-colors">Home</Link>
            <Link to="/how-it-works" className="text-muted-foreground text-sm hover:text-primary transition-colors">How It Works</Link>
            <Link to="/features" className="text-muted-foreground text-sm hover:text-primary transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground text-sm hover:text-primary transition-colors">Pricing</Link>
            <Link to="/contact" className="text-muted-foreground text-sm hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-bold text-sm mb-4">Legal</h4>
          <div className="flex flex-col gap-2.5">
            <Link to="/about" className="text-muted-foreground text-sm hover:text-primary transition-colors">About</Link>
            <Link to="/privacy" className="text-muted-foreground text-sm hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/refund" className="text-muted-foreground text-sm hover:text-primary transition-colors">Refund Policy</Link>
            <Link to="/terms" className="text-muted-foreground text-sm hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/disclaimer" className="text-muted-foreground text-sm hover:text-primary transition-colors">Disclaimer</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-bold text-sm mb-4">Newsletter</h4>
          <p className="text-muted-foreground text-sm mb-3">Get our latest news and updates right in your inbox.</p>
          <div className="flex gap-2">
            <Input placeholder="Enter your email" className="text-sm h-9" />
            <Button size="sm" className="h-9 px-3">
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} GeFlow. All rights reserved. Powered by Gesariz Tech.
      </div>
    </div>
  </footer>
);

export default Footer;

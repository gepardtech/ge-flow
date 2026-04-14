import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-foreground text-background py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-xl">GeFlow</span>
          </div>
          <p className="text-background/60 text-sm leading-relaxed">
            The modern business operating system for pharmacies, retail stores, and warehouses.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Product</h4>
          <div className="flex flex-col gap-2">
            <Link to="/features" className="text-background/60 text-sm hover:text-background transition-colors">Features</Link>
            <Link to="/pricing" className="text-background/60 text-sm hover:text-background transition-colors">Pricing</Link>
            <Link to="/how-it-works" className="text-background/60 text-sm hover:text-background transition-colors">How It Works</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Company</h4>
          <div className="flex flex-col gap-2">
            <Link to="/contact" className="text-background/60 text-sm hover:text-background transition-colors">Contact</Link>
            <span className="text-background/60 text-sm">Privacy Policy</span>
            <span className="text-background/60 text-sm">Terms of Service</span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Get Started</h4>
          <div className="flex flex-col gap-2">
            <Link to="/signup" className="text-background/60 text-sm hover:text-background transition-colors">Create Account</Link>
            <Link to="/login" className="text-background/60 text-sm hover:text-background transition-colors">Sign In</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10 mt-12 pt-8 text-center text-background/40 text-sm">
        © {new Date().getFullYear()} GeFlow. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

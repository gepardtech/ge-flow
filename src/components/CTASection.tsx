import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="section-padding">
    <div className="container mx-auto px-4">
      <div className="bg-hero-gradient rounded-2xl p-12 md:p-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          Start managing your business smarter today
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Join thousands of businesses already using GeFlow to streamline operations and boost profits.
        </p>
        <Button size="lg" variant="hero-outline" asChild>
          <Link to="/signup">Create Free Account</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CTASection;

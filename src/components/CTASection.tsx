import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="section-padding">
    <div className="container mx-auto px-4">
      <div className="bg-cta-gradient rounded-3xl p-12 md:p-16 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
          Start managing your business smarter today
        </h2>
        <Button size="lg" className="bg-background text-primary hover:bg-background/90 font-semibold px-8" asChild>
          <Link to="/signup">Create Free Account</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CTASection;

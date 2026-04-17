import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Eye, EyeOff, Heart, ShieldCheck } from "lucide-react";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan: "free" },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Welcome to GeFlow 🚀" });
      // With auto-confirm on, the user is signed in. Route by role.
      if (data.session) {
        if (email.toLowerCase() === "gepardwebs@gmail.com") navigate("/admin");
        else navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border bg-card">
          {/* LEFT — Welcome Panel */}
          <div className="relative bg-hero-gradient p-10 md:p-12 flex flex-col justify-center text-primary-foreground overflow-hidden order-2 lg:order-1">
            <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-secondary/30 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Join GeFlow Today <span className="text-3xl">✨</span>
              </h2>
              <p className="text-primary-foreground/90 mb-10 text-base">
                Unlock the full power of real-time intelligence and seamless business operations.
              </p>

              <ul className="space-y-5">
                {[
                  { icon: Camera, label: "10 free image analyses daily" },
                  { icon: Heart, label: "Pro-level detailed reports" },
                  { icon: ShieldCheck, label: "Secure storage & dashboard" },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center order-1 lg:order-2">
            <h1 className="text-4xl font-bold mb-2">Create an Account</h1>
            <p className="text-muted-foreground mb-8">Enter your details below to create your account.</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" className="h-12" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="h-12" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Confirm Password</label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} placeholder="••••••••" className="h-12" />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-hero-gradient text-primary-foreground font-semibold text-base hover:opacity-95 transition-all hover:shadow-lg hover:shadow-primary/30 mt-2">
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Signup;

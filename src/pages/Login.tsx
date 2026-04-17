import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, TrendingUp, Zap } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      if (email.toLowerCase() === "gepardwebs@gmail.com") navigate("/admin");
      else navigate("/dashboard");
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border bg-card">
          {/* LEFT — Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-2">Login</h1>
            <p className="text-muted-foreground mb-8">Enter your credentials to access your account.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your.email@example.com" className="h-12" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-border text-primary accent-primary" />
                  <span className="text-foreground">Remember Me</span>
                </label>
                <Link to="#" className="text-sm font-semibold text-primary hover:underline">Forgot Password?</Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-hero-gradient text-primary-foreground font-semibold text-base hover:opacity-95 transition-all hover:shadow-lg hover:shadow-primary/30">
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
            </p>
          </div>

          {/* RIGHT — Welcome Panel */}
          <div className="relative bg-hero-gradient p-10 md:p-12 flex flex-col justify-center text-primary-foreground overflow-hidden">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-secondary/30 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
                Welcome Back <span className="text-3xl">🚀</span>
              </h2>
              <p className="text-primary-foreground/90 mb-10 text-base">
                Login to continue managing your business with real-time AI-powered insights.
              </p>

              <ul className="space-y-5">
                {[
                  { icon: Zap, label: "Real-time inventory tracking" },
                  { icon: TrendingUp, label: "Automated profit analytics" },
                  { icon: Shield, label: "Secure cloud-based data" },
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
        </div>
      </section>
    </Layout>
  );
};

export default Login;

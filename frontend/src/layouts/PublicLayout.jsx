import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, Users, Calendar, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import AuthModal from '../features/auth/components/AuthModal';
import Logo from '../components/ui/Logo';

export default function PublicLayout() {
  const { bootLoading, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  if (!bootLoading && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <button
              onClick={openLogin}
              className="text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={openRegister}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-36 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              Your Campus. Your Community.
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Where Campus
              <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Comes Alive.
              </span>
            </h1>

            <p className="mt-8 text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Discover student clubs, explore exciting events, connect with your
              community, and make the most of your university experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <button
                onClick={openRegister}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition shadow-xl shadow-indigo-600/25"
              >
                Join UniVibe
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openLogin}
                className="px-8 py-3.5 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl font-semibold transition"
              >
                I already have an account
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-28">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Discover Clubs"
              description="Find communities that match your interests, join clubs, and collaborate with students."
              color="indigo"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Explore Events"
              description="Stay connected with workshops, hackathons, conferences, and campus activities."
              color="violet"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Organized Campus"
              description="A secure platform connecting students, supervisors, and administrators."
              color="emerald"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center">
        <p className="text-xs text-slate-500">
          © 2026 UniVibe — University Clubs & Events Platform
        </p>
      </footer>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description, color }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-7 hover:border-indigo-500/30 transition">
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${colors[color]}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
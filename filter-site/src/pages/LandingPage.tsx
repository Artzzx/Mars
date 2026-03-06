import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Upload,
  Sparkles,
  Layers,
  Volume2,
  Palette,
  Zap,
  Shield,
  ArrowRight,
  Github,
  Wand2,
  Crosshair,
  Download,
} from 'lucide-react';
import { useFilterStore } from '../store/filterStore';
import { FILTER_TEMPLATES } from '../data/templates';

export function LandingPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFilter, setSelectedTemplate, importFilter } = useFilterStore();

  const handleStartFresh = () => {
    const freshTemplate = FILTER_TEMPLATES.find((t) => t.id === 'fresh');
    if (freshTemplate) {
      setFilter(freshTemplate.filter);
      setSelectedTemplate('fresh');
    }
    navigate('/editor/overview');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        importFilter(content);
        navigate('/editor/overview');
      } catch (error) {
        alert(`Failed to import filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const features = [
    {
      icon: <Crosshair size={24} />,
      title: 'Build-Specific Filters',
      description: 'Answer 3 questions about your build and get a filter tuned to your exact class, mastery, and damage type.',
    },
    {
      icon: <Layers size={24} />,
      title: 'Rule-Based Filtering',
      description: 'Create complex rules with multiple conditions for precise loot control — down to individual affix tiers.',
    },
    {
      icon: <Palette size={24} />,
      title: '18 Official Colors',
      description: 'Use all official game colors to highlight your valuable drops at a glance.',
    },
    {
      icon: <Volume2 size={24} />,
      title: 'Sound & Beam Effects',
      description: 'Add audio alerts and map beams to never miss important items.',
    },
    {
      icon: <Zap size={24} />,
      title: 'v1.3 Compatible',
      description: 'Full support for the latest Last Epoch filter format with auto-upgrade.',
    },
    {
      icon: <Shield size={24} />,
      title: 'Filter Validation',
      description: 'Catch common mistakes before exporting with built-in validation.',
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Strictness Presets',
      description: 'From campaign leveling to 300+ corruption farming — strictness adapts to your progress.',
    },
  ];

  return (
    <div className="min-h-screen bg-le-dark">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-le-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-le-purple/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          {/* Logo / title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-le-accent to-le-purple rounded-xl flex items-center justify-center">
                <Filter size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Last Epoch <span className="text-le-accent">Filter Engine</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Answer three questions about your build. Get a filter that knows exactly
              what you need — down to the affix tier.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            {/* PRIMARY */}
            <button
              onClick={() => navigate('/generate')}
              className="flex items-center gap-2 bg-gradient-to-r from-le-accent to-le-purple text-white font-bold px-8 py-4 rounded-lg text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-le-accent/25"
            >
              <Wand2 size={20} />
              Generate My Filter
              <ArrowRight size={20} />
            </button>

            {/* SECONDARY — manual editor */}
            <button
              onClick={handleStartFresh}
              className="flex items-center gap-2 bg-le-card border border-le-border text-white font-semibold px-8 py-4 rounded-lg text-lg hover:border-le-accent transition-all"
            >
              <Sparkles size={20} />
              Build Manually
            </button>

            {/* SECONDARY — import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-le-card border border-le-border text-white font-semibold px-8 py-4 rounded-lg text-lg hover:border-le-accent transition-all"
            >
              <Upload size={20} />
              Import XML
            </button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-le-darker py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Three questions. One filter. Built specifically for your character.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines on desktop */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-le-border" />

            {[
              {
                num: '1',
                icon: <Wand2 size={28} />,
                title: 'Tell us about your build',
                desc: 'Choose your class, mastery, and damage type. Set your game progress so we tune the strictness to match.',
              },
              {
                num: '2',
                icon: <Crosshair size={28} />,
                title: 'We compile your filter',
                desc: 'Our engine matches your build profile against community data and generates up to 75 precisely weighted rules.',
              },
              {
                num: '3',
                icon: <Download size={28} />,
                title: 'Download & play',
                desc: 'Drop the .filter file into your Last Epoch folder and reload filters in-game. Done.',
              },
            ].map(({ num, icon, title, desc }) => (
              <div key={num} className="text-center relative z-10">
                <div className="w-24 h-24 bg-le-card border border-le-border rounded-2xl flex items-center justify-center mx-auto mb-5 text-le-accent">
                  {icon}
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-le-accent text-le-dark text-xs font-bold mb-3">
                  {num}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/generate')}
              className="inline-flex items-center gap-2 bg-le-accent text-le-dark font-bold px-8 py-3 rounded-lg hover:bg-le-accent-hover transition-colors"
            >
              Get started
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            From a quick generated filter to a fully hand-crafted ruleset — all in one tool.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-le-card/30 border border-le-border rounded-xl hover:border-le-accent/50 transition-colors"
              >
                <div className="text-le-accent mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-le-border py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter size={18} />
              <span>Last Epoch Filter Engine</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>v1.3 Compatible</span>
              <a
                href="https://github.com/Artzzx/Mars"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-le-accent transition-colors"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

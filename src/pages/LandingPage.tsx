import { useRef, useState } from 'react';
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
  FileCode,
  Wand2
} from 'lucide-react';
import { useFilterStore } from '../store/filterStore';
import { FILTER_TEMPLATES } from '../data/templates';
import { TemplateGenerator } from '../components/common';

export function LandingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFilter, setSelectedTemplate, importFilter } = useFilterStore();
  const [showGenerator, setShowGenerator] = useState(false);

  const goToEditor = () => navigate('/editor/overview');

  const handleStartFresh = () => {
    const freshTemplate = FILTER_TEMPLATES.find((t) => t.id === 'fresh');
    if (freshTemplate) {
      setFilter(freshTemplate.filter);
      setSelectedTemplate('fresh');
    }
    goToEditor();
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = FILTER_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFilter(template.filter);
      setSelectedTemplate(templateId);
    }
    goToEditor();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        importFilter(content);
        goToEditor();
      } catch (error) {
        alert(`Failed to import filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const features = [
    {
      icon: <Layers size={24} />,
      title: 'Rule-Based Filtering',
      description: 'Create complex rules with multiple conditions for precise loot control.',
    },
    {
      icon: <Palette size={24} />,
      title: '18 Official Colors',
      description: 'Use all official game colors to highlight your valuable drops.',
    },
    {
      icon: <Volume2 size={24} />,
      title: 'Sound & Beam Effects',
      description: 'Add audio alerts and map beams to never miss important items.',
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Smart Templates',
      description: 'Start with pre-built templates for leveling, endgame, or class-specific filters.',
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
  ];

  return (
    <div className="min-h-screen bg-le-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-le-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-le-purple/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-le-accent to-le-purple rounded-xl flex items-center justify-center">
                <Filter size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Last Epoch <span className="text-le-accent">Filter Tool</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Create, customize, and export loot filters for Last Epoch.
              Never miss valuable drops again.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-le-accent to-le-purple text-white font-bold px-8 py-4 rounded-lg text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-le-accent/25"
            >
              <Wand2 size={20} />
              Generate Build Filter
              <ArrowRight size={20} />
            </button>

            <button
              onClick={handleStartFresh}
              className="flex items-center gap-2 bg-le-card border border-le-border text-white font-semibold px-8 py-4 rounded-lg text-lg hover:border-le-accent transition-all"
            >
              <Sparkles size={20} />
              Start From Scratch
            </button>

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

          {/* Quick Start Templates */}
          <div className="mb-20">
            <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
              Or start with a template
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => handleSelectTemplate('leveling')}
                className="group p-6 bg-le-card/50 border border-le-border rounded-xl hover:border-le-accent hover:bg-le-card transition-all text-left"
              >
                <div className="text-le-green text-2xl mb-2">1-75</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-le-accent transition-colors">
                  Leveling
                </h3>
                <p className="text-sm text-gray-500">
                  Relaxed filter showing upgrades based on character level
                </p>
              </button>

              <button
                onClick={() => handleSelectTemplate('endgame')}
                className="group p-6 bg-le-card/50 border border-le-border rounded-xl hover:border-le-accent hover:bg-le-card transition-all text-left"
              >
                <div className="text-le-purple text-2xl mb-2">75+</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-le-accent transition-colors">
                  Endgame Strict
                </h3>
                <p className="text-sm text-gray-500">
                  Strict filter for corruption farming
                </p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group p-6 bg-le-card/50 border border-le-border rounded-xl hover:border-le-accent hover:bg-le-card transition-all text-left"
              >
                <div className="text-le-gold text-2xl mb-2">
                  <FileCode size={28} />
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-le-accent transition-colors">
                  Your Filter
                </h3>
                <p className="text-sm text-gray-500">
                  Import and customize your existing XML filter
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-le-darker py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            A complete filter editor with all the tools to create the perfect loot filter for your playstyle.
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

      {/* How it Works Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-le-accent/20 text-le-accent rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Create or Import</h3>
              <p className="text-sm text-gray-400">
                Start fresh with a template or import your existing filter file
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-le-accent/20 text-le-accent rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Customize Rules</h3>
              <p className="text-sm text-gray-400">
                Add conditions for rarity, item types, affixes, and more
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-le-accent/20 text-le-accent rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">Export & Play</h3>
              <p className="text-sm text-gray-400">
                Download your filter and drop it into your Last Epoch folder
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-le-border py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter size={18} />
              <span>Last Epoch Filter Tool</span>
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

      {/* Template Generator Modal */}
      <TemplateGenerator
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerate={goToEditor}
      />
    </div>
  );
}

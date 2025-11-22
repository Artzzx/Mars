import { Upload, Download, FileText } from 'lucide-react';
import { useRef } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { downloadFilter, generateFilterXml } from '../../lib/xml';

export function ImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { filter, importFilter, markSaved } = useFilterStore();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        importFilter(content);
        alert('Filter imported successfully!');
      } catch (error) {
        alert(`Failed to import filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    downloadFilter(filter);
    markSaved();
  };

  const handleCopyXml = () => {
    const xml = generateFilterXml(filter);
    navigator.clipboard.writeText(xml);
    alert('Filter XML copied to clipboard!');
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 btn-secondary text-sm"
      >
        <Upload size={16} />
        Import
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 btn-secondary text-sm"
      >
        <Download size={16} />
        Export
      </button>

      <button
        onClick={handleCopyXml}
        className="flex items-center gap-2 btn-secondary text-sm"
      >
        <FileText size={16} />
        Copy XML
      </button>
    </div>
  );
}

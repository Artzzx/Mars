import { RuleList, RuleEditor } from '../components/editor';

export function CustomizePage() {
  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Left Panel - Rule List */}
      <div className="w-80 flex-shrink-0 card overflow-hidden">
        <RuleList />
      </div>

      {/* Right Panel - Rule Editor */}
      <div className="flex-1 card overflow-hidden">
        <RuleEditor />
      </div>
    </div>
  );
}

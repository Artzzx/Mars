import { useFilterStore } from '../../store/filterStore';
import { TemplateCard } from './TemplateCard';
import { FILTER_TEMPLATES } from '../../data/templates';

export function TemplateSelector() {
  const { selectedTemplate, setSelectedTemplate, setFilter } = useFilterStore();

  const handleSelectTemplate = (templateId: string) => {
    const template = FILTER_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFilter(template.filter);
      setSelectedTemplate(templateId);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {FILTER_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          id={template.id}
          name={template.name.toUpperCase()}
          description={template.description}
          isSelected={selectedTemplate === template.id}
          onSelect={() => handleSelectTemplate(template.id)}
        />
      ))}
    </div>
  );
}

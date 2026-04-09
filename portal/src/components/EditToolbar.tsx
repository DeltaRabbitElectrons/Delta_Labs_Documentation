'use client';

interface EditToolbarProps {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  fieldBeingEdited: string;
}

export default function EditToolbar({
  onSave,
  onCancel,
  saving,
  fieldBeingEdited,
}: EditToolbarProps) {
  const fieldLabel =
    fieldBeingEdited === 'title'
      ? 'page title'
      : fieldBeingEdited === 'sidebar_label'
      ? 'sidebar label'
      : 'page content';

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-white border-t-2 border-blue-200 shadow-2xl px-8 py-4 flex items-center gap-4 z-30">
      {/* Left: context info */}
      <div className="flex-1 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <span className="text-sm text-slate-600">
          Editing <b>{fieldLabel}</b> — changes publish to live docs in ~60 seconds
        </span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 text-sm font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Publishing...' : '✓ Save & Publish Live'}
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from './LanguageSwitcher';
import { useToast } from './Toast';

function convertToCSV(data, columns) {
  if (!data || data.length === 0) return '';
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',')
  );
  return header + '\n' + rows.join('\n');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportButton({ data, columns, filename = 'export', label }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      let exportData = data;

      if (typeof data === 'function') {
        exportData = await data();
      }

      if (!exportData || exportData.length === 0) {
        toast.error('Нет данных для экспорта');
        setExporting(false);
        setOpen(false);
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const baseName = `${filename}_${timestamp}`;

      if (format === 'csv') {
        const csv = convertToCSV(exportData, columns);
        downloadFile('\uFEFF' + csv, `${baseName}.csv`, 'text/csv;charset=utf-8');
        toast.success(`CSV файл скачан (${exportData.length} записей)`);
      } else {
        const json = JSON.stringify(exportData, null, 2);
        downloadFile(json, `${baseName}.json`, 'application/json');
        toast.success(`JSON файл скачан (${exportData.length} записей)`);
      }
    } catch (err) {
      toast.error('Ошибка экспорта: ' + err.message);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="glass-button px-4 py-2 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {label || t('export')}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl shadow-2xl shadow-black/40 border border-white/5 overflow-hidden animate-scale-in z-50">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition text-left"
          >
            <span className="text-lg">📄</span>
            <div>
              <p className="font-medium">{t('csv')}</p>
              <p className="text-[10px] text-gray-500">Таблица данных</p>
            </div>
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition text-left border-t border-white/5"
          >
            <span className="text-lg">📋</span>
            <div>
              <p className="font-medium">{t('json')}</p>
              <p className="text-[10px] text-gray-500">Структурированные данные</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

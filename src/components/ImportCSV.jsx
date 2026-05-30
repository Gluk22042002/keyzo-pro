import { useState, useRef } from 'react';
import { useLanguage } from './LanguageSwitcher';
import { useToast } from './Toast';

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  return { headers, rows };
}

export default function ImportCSV({ onImport, expectedColumns }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      toast.error('Пожалуйста, выберите CSV файл');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      if (result.rows.length === 0) {
        toast.error('Файл пуст или имеет неверный формат');
        return;
      }
      setParsed(result);
    };
    reader.readAsText(f);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const data = parsed.rows.map(row => {
        const obj = {};
        parsed.headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

      if (onImport) {
        await onImport(data);
      }
      toast.success(`Импортировано ${data.length} записей`);
      reset();
    } catch (err) {
      toast.error('Ошибка импорта: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const maxPreviewRows = 10;
  const displayRows = parsed ? parsed.rows.slice(0, maxPreviewRows) : [];

  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📥</span>
        <h2 className="text-lg font-bold text-white">{t('import')} CSV</h2>
      </div>

      {!parsed ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-primary-500/50 bg-primary-500/5'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-300 text-sm font-medium mb-1">{t('dragDrop')}</p>
          <p className="text-gray-600 text-xs">или нажмите для выбора файла</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-200 font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{parsed.rows.length} строк · {parsed.headers.length} колонок</p>
              </div>
            </div>
            <button onClick={reset} className="text-xs text-gray-500 hover:text-rose-400 transition px-2 py-1 rounded-lg hover:bg-white/5">
              {t('cancel')}
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">{t('preview')}</p>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03]">
                    {parsed.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs text-gray-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                          {cell || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > maxPreviewRows && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-white/[0.02] border-t border-white/5">
                  ... и ещё {parsed.rows.length - maxPreviewRows} строк
                </div>
              )}
            </div>
          </div>

          {/* Expected columns hint */}
          {expectedColumns && (
            <div className="p-3 bg-accent-500/5 rounded-xl border border-accent-500/10">
              <p className="text-xs text-accent-400 font-medium mb-1">Ожидаемые колонки:</p>
              <p className="text-xs text-gray-500">{expectedColumns.join(', ')}</p>
            </div>
          )}

          {/* Import button */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="glass-button px-6 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('loading')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('confirmImport')} ({parsed.rows.length})
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

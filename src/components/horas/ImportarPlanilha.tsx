import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { upsertBaseOS, upsertBaseEquipamentos, OSImportRow, EquipamentoImportRow } from '../../services/horasService';

type TabType = 'os' | 'equipamentos';

interface PreviewRow { [key: string]: string | number | null }

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string' && val.trim()) return val.trim();
  return null;
}

function str(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;
  return String(val).trim() || null;
}

function parseOSRows(data: unknown[][]): OSImportRow[] {
  return data
    .filter(row => row && row.length > 7 && str(row[7]))
    .map(row => ({
      nr_os: str(row[7])!,           // H
      emp: str(row[0]),              // A
      item: str(row[1]),             // B
      descricao: str(row[2]),        // C
      nr_serie: str(row[3]),         // D  (guessing col D)
      cod_cliente: str(row[4]),      // E
      razao_social: str(row[5]),     // F
      tipo: str(row[6]),             // G
      tipo_os: str(row[9]),          // J
      dt_os: parseDate(row[10]),     // K
      encerramento: parseDate(row[11]), // L
      valor: row[12] !== undefined && row[12] !== null && row[12] !== '' ? Number(row[12]) : null, // M
      situacao: str(row[13]),        // N
      estagio: str(row[14]),         // O
      ult_estagio: str(row[15]),     // P
    }));
}

function parseEquipamentosRows(data: unknown[][]): EquipamentoImportRow[] {
  return data
    .filter(row => row && row.length > 0 && str(row[0]))
    .map(row => ({
      referencia: str(row[0])!,      // A
      descricao: str(row[1]),        // B
      familia: str(row[2]),          // C
      modelo: str(row[3]),           // D
      clase: str(row[4]),            // E
    }));
}

export default function ImportarPlanilha() {
  const [activeTab, setActiveTab] = useState<TabType>('os');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setTotalRows(0);
    setResult(null);
  }

  function processFile(f: File) {
    setResult(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

      // skip first row if it's a header (non-numeric first column for OS, etc.)
      const dataRows = rows.length > 1 && typeof rows[0]?.[0] === 'string' && isNaN(Number(rows[0][0]))
        ? (rows as unknown[][]).slice(1)
        : (rows as unknown[][]);

      const parsed = activeTab === 'os' ? parseOSRows(dataRows) : parseEquipamentosRows(dataRows);
      setTotalRows(parsed.length);

      if (activeTab === 'os') {
        const h = ['nr_os', 'item', 'razao_social', 'situacao', 'estagio', 'dt_os', 'encerramento'];
        setHeaders(h);
        setPreview(parsed.slice(0, 10).map(r => {
          const o = r as OSImportRow;
          return { nr_os: o.nr_os, item: o.item ?? '', razao_social: o.razao_social ?? '', situacao: o.situacao ?? '', estagio: o.estagio ?? '', dt_os: o.dt_os ?? '', encerramento: o.encerramento ?? '' };
        }));
      } else {
        const h = ['referencia', 'familia', 'modelo', 'clase', 'descricao'];
        setHeaders(h);
        setPreview(parsed.slice(0, 10).map(r => {
          const o = r as EquipamentoImportRow;
          return { referencia: o.referencia, familia: o.familia ?? '', modelo: o.modelo ?? '', clase: o.clase ?? '', descricao: o.descricao ?? '' };
        }));
      }

      // store parsed for import
      (window as Record<string, unknown>).__importParsed = parsed;
    };
    reader.readAsArrayBuffer(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) processFile(f);
  }, [activeTab]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  }

  async function handleImport() {
    const parsed = (window as Record<string, unknown>).__importParsed as OSImportRow[] | EquipamentoImportRow[];
    if (!parsed?.length) return;
    setLoading(true);
    setResult(null);
    try {
      let count: number;
      if (activeTab === 'os') {
        count = await upsertBaseOS(parsed as OSImportRow[]);
      } else {
        count = await upsertBaseEquipamentos(parsed as EquipamentoImportRow[]);
      }
      setResult({ ok: true, msg: `${count} registros importados/atualizados com sucesso.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ ok: false, msg: `Erro: ${msg}` });
    } finally {
      setLoading(false);
    }
  }

  function switchTab(tab: TabType) {
    setActiveTab(tab);
    reset();
  }

  const osInfo = [
    'Col A: Emp', 'Col B: Item (→ equipamento)', 'Col C: Descrição', 'Col D: Nr. Série',
    'Col E: Cod. Cliente', 'Col F: Razão Social', 'Col G: Tipo',
    'Col H: Nr OS (chave upsert)', 'Col J: Tipo OS', 'Col K: Dt. OS',
    'Col L: Encerramento', 'Col M: Valor', 'Col N: Situação', 'Col O: Estágio', 'Col P: Últ. Estágio'
  ];
  const eqInfo = [
    'Col A: Referência (chave)', 'Col B: Descrição', 'Col C: Família', 'Col D: Modelo', 'Col E: Clase'
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1e3a5f' }}>
        Importar Planilha
      </h2>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {([['os', 'Importar OS (detalhamento)'], ['equipamentos', 'Importar Base Equipamentos']] as [TabType, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === id ? 700 : 400,
              color: activeTab === id ? '#005198' : '#64748b',
              borderBottom: activeTab === id ? '2px solid #005198' : '2px solid transparent',
              marginBottom: -2, fontSize: 14
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* info box */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 10 }}>
        <Info size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
            Mapeamento de colunas esperado
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px' }}>
            {(activeTab === 'os' ? osInfo : eqInfo).map(s => (
              <span key={s} style={{ fontSize: 11, color: '#374151' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? '#005198' : '#cbd5e1'}`,
          borderRadius: 12, padding: 32, textAlign: 'center',
          background: dragging ? '#f0f7ff' : '#f8fafc',
          cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16
        }}
        onClick={() => document.getElementById('xlsx-input')?.click()}
      >
        <input id="xlsx-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onFileChange} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#005198' }}>
            <FileSpreadsheet size={24} />
            <span style={{ fontWeight: 600 }}>{file.name}</span>
            <span style={{ color: '#64748b', fontSize: 13 }}>— {totalRows} registros lidos</span>
          </div>
        ) : (
          <div style={{ color: '#94a3b8' }}>
            <Upload size={32} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 500 }}>Arraste o arquivo XLSX aqui</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>ou clique para selecionar</div>
          </div>
        )}
      </div>

      {/* preview table */}
      {preview.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Pré-visualização (primeiros {preview.length} de {totalRows} registros)
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {headers.map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    {headers.map(h => (
                      <td key={h} style={{ padding: '6px 10px', color: '#1e293b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[h] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* result */}
      {result && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, marginBottom: 16,
          background: result.ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`
        }}>
          {result.ok
            ? <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            : <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, color: result.ok ? '#166534' : '#991b1b' }}>{result.msg}</span>
        </div>
      )}

      {/* import button */}
      {totalRows > 0 && (
        <button
          onClick={handleImport}
          disabled={loading}
          style={{
            padding: '10px 24px', background: loading ? '#94a3b8' : '#005198',
            color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
            fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Upload size={16} />
          {loading ? 'Importando...' : `Importar ${totalRows} registros`}
        </button>
      )}

      {activeTab === 'os' && (
        <div style={{ marginTop: 20, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
          <strong>Nota:</strong> A importação usa UPSERT pelo Nr. OS — registros existentes serão atualizados, novos serão inseridos. Pode importar diariamente, semanalmente ou mensalmente sem duplicar dados.
        </div>
      )}
    </div>
  );
}

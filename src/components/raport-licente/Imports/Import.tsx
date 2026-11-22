import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface LicenseNumbers {
  added: number;
  current: number;
  used: number;
  total: number;
}

export interface StoreSnapshot {
  id: string;
  fullName: string;
  date: string;
  esnLicenses: LicenseNumbers | null;
  basicLicenses: LicenseNumbers | null;
}

interface ImportProps {
  onImport: (data: StoreSnapshot[]) => void;
}

export function Import({ onImport }: ImportProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [esnRows, setEsnRows] = useState<Record<string, LicenseNumbers>>({});
  const [basicRows, setBasicRows] = useState<Record<string, LicenseNumbers>>({});

  // reads either csv or excel into a 2d array, then maps each store name to its 4 numbers
  const parseFile = (file: File, target: 'esn' | 'basic') => {
    const extractRows = (rawRows: unknown[][]) => {
      const mapped: Record<string, LicenseNumbers> = {};

      // skip first 2 header rows
      for (const row of rawRows.slice(2)) {
        const fullName = String(row?.[1] || '').trim();
        if (!fullName) continue;

        mapped[fullName] = {
          added: Number(row[5]) || 0,
          current: Number(row[6]) || 0,
          used: Number(row[7]) || 0,
          total: Number(row[8]) || 0,
        };
      }

      if (target === 'esn') setEsnRows(mapped);
      else setBasicRows(mapped);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse<unknown[]>(file, {
        header: false,
        skipEmptyLines: true,
        complete: (res) => extractRows(res.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        extractRows(XLSX.utils.sheet_to_json(sheet, { header: 1 }));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // merges esn and basic by fullName into one object per store
  const handleImport = () => {
    const allNames = new Set([
      ...Object.keys(esnRows),
      ...Object.keys(basicRows),
    ]);

    const merged: StoreSnapshot[] = Array.from(allNames).map((fullName) => ({
      id: `${fullName}-${date}`,
      fullName,
      date,
      esnLicenses: esnRows[fullName] || null,
      basicLicenses: basicRows[fullName] || null,
    }));

    onImport(merged);
  };

  const esnCount = Object.keys(esnRows).length;
  const basicCount = Object.keys(basicRows).length;
  const ready = esnCount > 0 && basicCount > 0 && Boolean(date);

  return (
    <div className="h-15 w-full flex flex-wrap items-center gap-4 p-3 text-xs rounded-xl bg-dark-secondary">
      {/* date */}
      <label className="flex items-center gap-2 font-medium">
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-1 border border-slate-300 rounded"
        />
      </label>

      {/* esn file */}
      <label className="flex items-center gap-2 font-medium">
        ESN:
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0], 'esn')}
          className=" file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-dark-items file:font-semibold hover:file:bg-dark-primary"
        />
        {esnCount > 0 && <span className="text-emerald-600 font-semibold">({esnCount} rows)</span>}
      </label>

      {/* basic file */}
      <label className="flex items-center gap-2 font-medium">
        Basic:
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0], 'basic')}
          className=" file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-dark-items file:font-semibold hover:file:bg-dark-primary"
        />
        {basicCount > 0 && <span className="text-emerald-600 font-semibold">({basicCount} rows)</span>}
      </label>

      {/* import button */}
      <button
        type="button"
        disabled={!ready}
        onClick={handleImport}
        className="ml-auto px-4 py-1.5 rounded bg-blue-600 text-white font-semibold disabled:opacity-40 hover:bg-blue-700"
      >
        Import
      </button>
    </div>
  );
}
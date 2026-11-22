import { useMemo } from "react";
import type { StoreSnapshot } from "../Imports/Import";
import * as XLSX from 'xlsx';


interface ExportProps {
  selectedStores: StoreSnapshot[];
  selectedValues: string[];
  snapshots: StoreSnapshot[];
}

interface ExportData {
    date: Date;
    stores: string[];
    currentBasic?: boolean;
    usedBasic?: boolean;
    addedBasic?: boolean;
    currentESN?: boolean;
    usedESN?: boolean;
    addedESN?: boolean;
}

export const Export: React.FC<ExportProps> = ({selectedStores, selectedValues, snapshots}) => {

    const handleExportExcel = () => {
        if (grid.length <= 1) return; // nothing selected

        const worksheet = XLSX.utils.aoa_to_sheet(grid);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Raport licente');

        // Uses the snapshot date from the imported stores (falls back to today if needed)
        const reportDate = selectedStores[0]?.date || exportData.date.toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Raport licente ${reportDate}.xlsx`);
    };
    const exportData: ExportData = useMemo(()=>{
        return {
            date: new Date(),
            stores: selectedStores.map(i=>i.id),
            currentBasic: selectedValues.includes('currentBasic'),
            addedBasic: selectedValues.includes('addedBasic'),
            usedBasic: selectedValues.includes('usedBasic'),
            currentESN: selectedValues.includes('currentESN'),
            usedESN: selectedValues.includes('usedESN'),
            addedESN: selectedValues.includes('addedESN'),
        }
    },[selectedStores, selectedValues, snapshots])
    
    const grid = useMemo(() => {
        const columns = [
            exportData.currentBasic && { header: 'Basic - Current', get: (s: StoreSnapshot) => s.basicLicenses?.current ?? 0 },
            exportData.addedBasic   && { header: 'Basic - Added',   get: (s: StoreSnapshot) => s.basicLicenses?.added ?? 0 },
            exportData.usedBasic    && { header: 'Basic - Used',    get: (s: StoreSnapshot) => s.basicLicenses?.used ?? 0 },
            exportData.currentESN   && { header: 'ESN - Current',   get: (s: StoreSnapshot) => s.esnLicenses?.current ?? 0 },
            exportData.addedESN     && { header: 'ESN - Added',     get: (s: StoreSnapshot) => s.esnLicenses?.added ?? 0 },
            exportData.usedESN      && { header: 'ESN - Used',      get: (s: StoreSnapshot) => s.esnLicenses?.used ?? 0 },
        ].filter((col): col is { header: string; get: (s: StoreSnapshot) => number } => Boolean(col));

        // Header row (Row 0)
        const headerRow = ['Store', ...columns.map((c) => c.header)];

        // Data rows (Rows 1+)
        const dataRows = selectedStores.map((store) => [
            store.fullName,
            ...columns.map((c) => c.get(store)),
        ]);

        return [headerRow, ...dataRows];
    }, [exportData, selectedStores]);


    return (
        <div className="h-full grid grid-rows-[1fr_50px] space-y-3 bg-dark-secondary p-4 rounded-xl overflow-hidden">
            <div className="overmin-h-0 w-full overflow-auto scrollbar-pill rounded bg-dark-primary">
                <table className="w-full h-full border-collapse text-left bg-dark-primary rounded overflow-y-auto scrollbar-pill">
                    <thead className="border-b border-b-zinc-700/50"> 
                        <tr>
                        {grid[0]?.map((header, idx) => (
                            <th
                                key={idx}
                                className="sticky top-0 z-10 bg-dark-primary px-3 py-2 font-semibold whitespace-nowrap not-last:border-r not-last:border-zinc-700/50"
                            >
                            {header}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {grid.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-blue-50/40 h-10">
                            {row.map((cell, cellIdx) => (
                            <td
                                key={cellIdx}
                                className={`not-last:border-r not-last:border-zinc-700/50 px-3 py-1.5 whitespace-nowrap ${
                                typeof cell === 'number' ? 'text-right tabular-nums' : 'font-bold'
                                }`}
                            >
                                {cell}
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-end justify-between w-full h-full">
                <span className="text-xs font-semibol">
                    Export ({grid.length - 1} rows)
                </span>
                <button
                    type="button"
                    disabled={grid.length <= 1}
                    onClick={handleExportExcel}
                    className="px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-emerald-700"
                >
                    Download
                </button>
            </div>
        </div>
    )
}
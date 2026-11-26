import { useState, type Dispatch, type SetStateAction } from 'react';
import Papa from 'papaparse';

export interface Order {
  id: string;          // Sell ID
  month: string;       // "YYYY-MM"
  partner: string;     // Partener
  orderState: string;  // Order State
  offerStatus: string; // Offer Status (or "BLANK")
}

interface OrdersImportProps {
  setOrders: Dispatch<SetStateAction<Order[]>>;
}

export function OrdersImport({ setOrders }: OrdersImportProps) {
  const [rowCount, setRowCount] = useState(0);

  // turns "dd/mm/yyyy hh:mm" into "yyyy-mm"
  const getMonth = (rawDate: string) => {
    const datePart = rawDate.trim().split(' ')[0]; // "dd/mm/yyyy"
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return 'Unknown';
    return `${year}-${month.padStart(2, '0')}`;
  };

  const handleFile = (file: File) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (res) => {
        // map keeps Sell IDs unique automatically if the csv has duplicate rows
        const ordersMap = new Map<string, Order>();

        // slice(2) skips row 0 (headers) and row 1 (database totals)
        for (const row of res.data.slice(2)) {
          const sellId = String(row[1] || '').trim();
          if (!sellId) continue;

          const rawDate = String(row[0] || '');
          const partner = String(row[4] || 'Unknown').trim();
          const orderState = String(row[5] || '').trim().toUpperCase();
          const offerStatus = String(row[11] || '').trim().toUpperCase();

          ordersMap.set(sellId, {
            id: sellId,
            month: getMonth(rawDate),
            partner,
            orderState,
            offerStatus: offerStatus || 'BLANK',
          });
        }

        const cleanOrders = Array.from(ordersMap.values());
        setRowCount(cleanOrders.length);
        setOrders(cleanOrders);
      },
    });
  };

  return (
    <div className="w-full h-full grid grid-cols-[1fr_auto] justify-center items-center gap-4 p-3 bg-dark-secondary rounded-lg">
      <label className="h-full w-full flex items-center gap-2 font-medium text-white">
        Orders CSV:
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-white file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-dark-secondary file:font-semibold hover:file:bg-slate-200"
        />
      </label>

      {rowCount > 0 && (
        <p className="text-emerald-600 font-semibold">
          ({rowCount.toLocaleString()} orders)
        </p>
      )}
    </div>
  );
}
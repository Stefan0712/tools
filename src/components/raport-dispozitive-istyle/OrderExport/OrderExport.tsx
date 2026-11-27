import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { Order } from '../OrdersImport/OrdersImport';

const ALL_STATES = [
  'ASTEAPTA_ALOCARE_TEHNICIAN',
  'COMANDA_ANULATA',
  'DE_CURATAT',
  'DE_LIVRAT_CUMPARATOR',
  'DE_POZAT',
  'DE_REPARAT',
  'DE_TESTAT',
  'EVALUARE_PARTENER',
  'EXPEDIAT_VANZATOR',
  'FACTURAT_LICITATIE',
  'IN_LIVRARE',
  'IN_CURS_DE_LIVRARE',
  'IN_CURS_DE_POLISHARE',
  'IN_CURS_DE_REPARARE',
  'LA_REPARAT_3RD_PARTY',
  'POSTAT_LA_VANZARE',
  'PRODUS_VANDUT',
  'QC_OUT',
  'REZERVAT_B2B',
  'UNCLASSIFIED_ACTION_REQUIRED',
  'VANDUT_LICITATIE',
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];


const ALL_OFFER_STATUSES = ['ACCEPTED', 'REJECTED', 'NON-CONFORM', 'BLANK'];

const EXCLUDED_FROM_ARRIVED = [
  'COMANDA_ANULATA',
  'IN_LIVRARE',
  'IN_CURS_DE_LIVRARE',
  'EVALUARE_PARTENER',
];

interface OrdersTableProps {
  orders: Order[];
}

const CATEGORIES = [
  'iPhones',
  'Other Phones',
  'Smartwatch',
  'Tablet',
  'Laptop',
] as const;

const getDeviceCategory = (order: Order): string => {
  const type = order.productType; // already uppercase from import
  if (type === 'SMARTPHONE') {
    return order.brand === 'APPLE' ? 'iPhones' : 'Other Phones';
  }
  if (type === 'SMARTWATCH') return 'Smartwatch';
  if (type === 'TABLET') return 'Tablet';
  if (type === 'LAPTOP') return 'Laptop';
  return 'Other';
};

export function OrdersTable({ orders }: OrdersTableProps) {
  // filter arrays
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [totalStates, setTotalStates] = useState<string[]>(() =>ALL_STATES.filter((s) => s !== 'COMANDA_ANULATA'));
  const [arrivedStates, setArrivedStates] = useState<string[]>(() =>
    ALL_STATES.filter((s) => !EXCLUDED_FROM_ARRIVED.includes(s))
  );
  const [acceptedStatuses, setAcceptedStatuses] = useState<string[]>(['ACCEPTED']);

  // unique partners and months from imported file
  const allPartners = useMemo(
    () => Array.from(new Set(orders.map((o) => o.partner))).sort(),
    [orders]
  );
  const allMonths = useMemo(
    () => Array.from(new Set(orders.map((o) => o.month))).sort(),
    [orders]
  );
  const formatMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    const name = MONTH_NAMES[Number(month) - 1];
    return name ? `${name} ${year}` : ym;
  };
  // include any extra states that might appear in the csv
  const availableStates = useMemo(() => {
    const fromCsv = orders.map((o) => o.orderState).filter(Boolean);
    return Array.from(new Set([...ALL_STATES, ...fromCsv])).sort();
  }, [orders]);

  // auto-select all partners and months when a new file is imported
  useEffect(() => {
    setSelectedPartners(allPartners);
  }, [allPartners]);

  useEffect(() => {
    setSelectedMonths(allMonths);
  }, [allMonths]);

  // simple toggle helper for any checkbox array
  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  useEffect(() => {
    setTotalStates((prev) => {
      const merged = new Set([
        ...prev,
        ...availableStates.filter((s) => s !== 'COMANDA_ANULATA'),
      ]);
      return Array.from(merged);
    });

    setArrivedStates((prev) => {
      const merged = new Set([
        ...prev,
        ...availableStates.filter((s) => !EXCLUDED_FROM_ARRIVED.includes(s)),
      ]);
      return Array.from(merged);
    });
  }, [availableStates]);
  // single 2D grid for both live preview and excel export
  const grid = useMemo(() => {
    const activeMonths = allMonths.filter((m) => selectedMonths.includes(m));
    const activePartners = allPartners.filter((p) => selectedPartners.includes(p));

    // group counts by "partner__month__category"
    const counts = new Map<string, { total: number; arrived: number; accepted: number }>();

    for (const order of orders) {
      if (!selectedPartners.includes(order.partner)) continue;
      if (!selectedMonths.includes(order.month)) continue;

      const category = getDeviceCategory(order);
      const key = `${order.partner}__${order.month}__${category}`;
      const current = counts.get(key) || { total: 0, arrived: 0, accepted: 0 };

      if (totalStates.includes(order.orderState)) current.total++;
      if (arrivedStates.includes(order.orderState)) current.arrived++;
      if (acceptedStatuses.includes(order.offerStatus)) current.accepted++;

      counts.set(key, current);
    }

    const headerRow = [
      'Partener',
      'Month',
      'Category',
      'Total Orders',
      'Arrived Orders',
      'Accepted Offers',
    ];
    const dataRows: (string | number)[][] = [];

    for (const partner of activePartners) {
      let partnerSumTotal = 0;
      let partnerSumArrived = 0;
      let partnerSumAccepted = 0;
      let hasAnyPartnerRows = false;

      for (const month of activeMonths) {
        const monthRows: (string | number)[][] = [];
        let monthSumTotal = 0;
        let monthSumArrived = 0;
        let monthSumAccepted = 0;

        for (const category of CATEGORIES) {
          const row = counts.get(`${partner}__${month}__${category}`);
          if (!row) continue;

          monthRows.push([
            partner,
            formatMonth(month),
            category,
            row.total,
            row.arrived,
            row.accepted,
          ]);

          monthSumTotal += row.total;
          monthSumArrived += row.arrived;
          monthSumAccepted += row.accepted;
        }

        if (monthRows.length > 0) {
          hasAnyPartnerRows = true;
          dataRows.push(...monthRows);
          dataRows.push([
            partner,
            formatMonth(month),
            'TOTALS',
            monthSumTotal,
            monthSumArrived,
            monthSumAccepted,
          ]);

          partnerSumTotal += monthSumTotal;
          partnerSumArrived += monthSumArrived;
          partnerSumAccepted += monthSumAccepted;
        }
      }

      if (hasAnyPartnerRows) {
        dataRows.push([
          partner,
          'ALL MONTHS',
          'PARTNER TOTAL',
          partnerSumTotal,
          partnerSumArrived,
          partnerSumAccepted,
        ]);
      }
    }

    return [headerRow, ...dataRows];
  }, [
    orders,
    allPartners,
    allMonths,
    selectedPartners,
    selectedMonths,
    totalStates,
    arrivedStates,
    acceptedStatuses,
  ]);

  const handleExport = () => {
    if (grid.length <= 1) return;

    const ws = XLSX.utils.aoa_to_sheet(grid);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Raport comenzi');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Raport comenzi ${today}.xlsx`);
  };

  if (orders.length === 0) return null;

  return (
    <div className="w-full h-full p-4 space-y-4 text-xs">
      {/* filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 rounded">
        {/* 1. Months */}
        <div className="bg-dark-secondary rounded-lg p-2">
          <div className="flex justify-between font-bold mb-1">
            <span>Months ({selectedMonths.length}/{allMonths.length})</span>
            <span className="space-x-2 font-normal text-white/60">
              <button type="button" onClick={() => setSelectedMonths(allMonths)}>All</button>
              <button type="button" onClick={() => setSelectedMonths([])}>None</button>
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 border-t border-t-white/25 pt-2 mt-2 scrollbar-pill">
            {allMonths.map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(m)}
                  onChange={() => toggle(selectedMonths, setSelectedMonths, m)}
                />
                <span className="truncate">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Partners */}
        <div className="bg-dark-secondary rounded-lg p-2">
          <div className="flex justify-between font-bold mb-1">
            <span>Parteneri ({selectedPartners.length}/{allPartners.length})</span>
            <span className="space-x-2 font-normal text-white/60">
              <button type="button" onClick={() => setSelectedPartners(allPartners)}>All</button>
              <button type="button" onClick={() => setSelectedPartners([])}>None</button>
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 border-t border-t-white/25 pt-2 mt-2 scrollbar-pill">
            {allPartners.map((p) => (
              <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPartners.includes(p)}
                  onChange={() => toggle(selectedPartners, setSelectedPartners, p)}
                />
                <span className="truncate">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Total Orders states */}
        <div className="bg-dark-secondary rounded-lg p-2">
          <div className="flex justify-between font-bold mb-1">
            <span>Total Orders States</span>
            <button
              type="button"
              onClick={() =>
                setTotalStates(availableStates.filter((s) => s !== 'COMANDA_ANULATA'))
              }
              className="font-normal text-white/60"
            >
              Reset
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 border-t border-t-white/25 pt-2 mt-2 scrollbar-pill">
            {availableStates.map((state) => (
              <label key={state} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={totalStates.includes(state)}
                  onChange={() => toggle(totalStates, setTotalStates, state)}
                />
                <span className="truncate">{state}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. Arrived Orders states */}
        <div className="bg-dark-secondary rounded-lg p-2">
          <div className="flex justify-between font-bold mb-1">
            <span>Arrived Orders States</span>
            <button
              type="button"
              onClick={() =>
                setArrivedStates(availableStates.filter((s) => !EXCLUDED_FROM_ARRIVED.includes(s)))
              }
              className="font-normal text-white/60"
            >
              Reset
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 border-t border-t-white/25 pt-2 mt-2 scrollbar-pill">
            {availableStates.map((state) => (
              <label key={state} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arrivedStates.includes(state)}
                  onChange={() => toggle(arrivedStates, setArrivedStates, state)}
                />
                <span className="truncate">{state}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 5. Accepted Offers statuses */}
        <div className="bg-dark-secondary rounded-lg p-2">
          <div className="flex justify-between font-bold mb-1">
            <span>Accepted Offers Status</span>
            <button
              type="button"
              onClick={() => setAcceptedStatuses(['ACCEPTED'])}
              className="font-normal text-white/60"
            >
              Reset
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 border-t border-t-white/25 pt-2 mt-2 scrollbar-pill">
            {ALL_OFFER_STATUSES.map((status) => (
              <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedStatuses.includes(status)}
                  onChange={() => toggle(acceptedStatuses, setAcceptedStatuses, status)}
                />
                <span>{status}</span>
              </label>
            ))}            
            <p onClick={()=>console.log(grid)}>PRINT GRID</p>

          </div>
        </div>
      </div>

      {/* export bar */}
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          Preview ({grid.length - 1} rows)
        </span>
        <button
          type="button"
          disabled={grid.length <= 1}
          onClick={handleExport}
          className="px-4 py-1.5 rounded bg-emerald-600 text-white font-semibold disabled:opacity-40 hover:bg-emerald-700"
        >
          Export to Excel
        </button>
      </div>

      {/* live preview table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="rounded overflow-hidden">
            <tr className="bg-dark-items rounded overflow-hidden">
              {grid[0].map((header, i) => (
                <th
                  key={i}
                  className="px-3 py-1.5 font-semibold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.slice(1).map((row, rIdx) => {
              const isPartnerTotal = row[2] === 'PARTNER TOTAL';
              const isMonthTotal = row[2] === 'TOTALS';

              return (
                <tr
                  key={rIdx}
                  className={
                    isPartnerTotal
                      ? 'bg-white/15 font-bold'
                      : isMonthTotal
                        ? 'bg-white/5 font-semibold'
                        : 'hover:bg-blue-50/40'
                  }
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-3 whitespace-nowrap border-b border-b-white/10 ${
                        isPartnerTotal ? 'py-3.5 text-sm' : 'py-3'
                      } ${typeof cell === 'number' ? 'text-right tabular-nums' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
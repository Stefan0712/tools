import { useState } from 'react';
import { Import, type StoreSnapshot } from './Imports/Import';
import { Table } from './Table/Table';
import { Export } from './Export/Export';

export const LicensesReport = () => {

  const [snapshots, setSnapshots] = useState<StoreSnapshot[]>([]);
  const [selectedStores, setSelectedStores] = useState<StoreSnapshot[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);


  return (
    <div className='w-full h-full grid grid-rows-[60px_1fr] gap-2 overflow-hidden'>
      <Import onImport={(newRows) => setSnapshots((prev) => [...prev, ...newRows])} />
      <div className='grid grid-cols-2 gap-2 overflow-hidden w-full h-full'>
        <Table snapshots={snapshots} selectedStores={selectedStores} selectedValues={selectedValues} setSelectedStores={setSelectedStores} setSelectedValues={setSelectedValues} />
        <Export selectedStores={selectedStores} snapshots={snapshots} selectedValues={selectedValues} />
      </div>
    </div>
  )
}


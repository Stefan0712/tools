import type { Dispatch, SetStateAction } from "react";
import type { StoreSnapshot } from "../Imports/Import";

interface TableProps {
  selectedStores: StoreSnapshot[];
  selectedValues: string[];
  snapshots: StoreSnapshot[];
  setSelectedValues: Dispatch<SetStateAction<string[]>>;
  setSelectedStores: Dispatch<SetStateAction<StoreSnapshot[]>>;
}

export const Table: React.FC<TableProps> = ({selectedStores, selectedValues, snapshots, setSelectedStores, setSelectedValues}) => {

  const toggleStoreSelection = (store: StoreSnapshot) => {
    if(selectedStores.some(i=>i.id === store.id)) {
      setSelectedStores(prev=>prev.filter(i=>i.id!==store.id))
    } else {
      setSelectedStores(prev=>[...prev, store])
    }
  }
  const toggleAllStores = () => {
    if(selectedStores.length > 0) {
      setSelectedStores([])
    } else {
      setSelectedStores([...snapshots])
    }
  }
  const toggleValueSelection = (value: string) => {
    if(selectedValues.includes(value)) {
      setSelectedValues(prev=>prev.filter(i=>i !== value))
    } else {
      setSelectedValues(prev=>[...prev, value])
    }
  }

  return (
    <div className="w-full h-full bg-dark-secondary rounded-xl p-4 overflow-hidden grid grid-rows-[auto_minmax(0,1fr)] gap-2">
      <div className="w-full h-15 border-red-1 grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center pr-1.5 bg-dark-primary rounded-lg">
        <input type="checkbox" checked={snapshots?.length > 0 && snapshots?.length === selectedStores?.length} onChange={toggleAllStores} className="size-6 ml-auto mr-auto"></input>
        <h2>Client (Selected: {selectedStores.length || 0})</h2>
        <div className="flex flex-col">
          <b className="w-full text-center">Basic</b>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={()=>toggleValueSelection('usedBasic')} className={`border rounded ${selectedValues.includes('usedBasic') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Used</button>
            <button onClick={()=>toggleValueSelection('currentBasic')} className={`border rounded ${selectedValues.includes('currentBasic') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Current</button>
            <button onClick={()=>toggleValueSelection('totalBasic')} className={`border rounded ${selectedValues.includes('totalBasic') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Total</button>
          </div>
        </div>
        <div className="flex flex-col">
          <b className="w-full text-center">ESN</b>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={()=>toggleValueSelection('usedESN')} className={`border rounded ${selectedValues.includes('usedESN') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Used</button>
            <button onClick={()=>toggleValueSelection('currentESN')} className={`border rounded ${selectedValues.includes('currentESN') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Current</button>
            <button onClick={()=>toggleValueSelection('totalESN')} className={`border rounded ${selectedValues.includes('totalESN') ? ' border-green-400' : 'border-transparent'} bg-transparent`}>Total</button>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-2 overflow-y-auto min-h-0 scrollbar-pill">
        {snapshots?.length > 0 ? snapshots.map(item=><div key={item.id} className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2">
          <input type="checkbox" className="size-4 ml-auto mr-auto mt-auto mb-auto" checked={selectedStores.some(i=>i.id === item.id)} onChange={()=>toggleStoreSelection(item)}></input>
          <b>{item.fullName}</b>
          <div className="grid grid-cols-3 gap-2">
            <p className="w-full text-center">{item.basicLicenses?.total || 'N/A'}</p>
            <p className="w-full text-center">{item.basicLicenses?.current || 'N/A'}</p>
            <p className="w-full text-center">{item.basicLicenses?.used || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <p className="w-full text-center">{item.esnLicenses?.total || 'N/A'}</p>
            <p className="w-full text-center">{item.esnLicenses?.current || 'N/A'}</p>
            <p className="w-full text-center">{item.esnLicenses?.used || 'N/A'}</p>
          </div>
        </div>) : <p>No clients loaded.</p>}
      </div>
    </div>
  )
}
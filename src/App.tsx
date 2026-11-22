import { GraphRing } from 'lucide-react';
import { useState } from 'react';
import { LicensesReport } from './components/raport-licente/LicensesReport';

function App() {

  const [currentTool, setCurrentTool] = useState('licenses-report');

  return (
    <div className='w-screen h-screen p-4 grid grid-cols-[50px_1fr] gap-2 bg-dark-primary text-white overflow-hidden
    '>
      <div className='h-full w-12 flex flex-col gap-3 p-2 rounded'>
        <button onClick={()=>setCurrentTool('licenses-report')}>
          <GraphRing />
        </button>
      </div>
      <div className='w-full h-full p-2 overflow-hidden'>
        {currentTool === 'licenses-report' ? <LicensesReport /> : <p>No tool selected</p>}
      </div>
    </div>
  )
}

export default App

import React from 'react';
import GridProvider from './components/GridContext';
import WorkspaceGrid from './components/WorkspaceGrid';
import SidePanel from './components/SidePanel';

const App = () => {
  return (
    <GridProvider initialConfig={{ columns: 4, rows: 4, gap: 16 }}>
      <div className="relative min-h-screen bg-gray-100">
        <SidePanel />
        <WorkspaceGrid />
      </div>
    </GridProvider>
  );
};


export default App;
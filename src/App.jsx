// import React from 'react';
// import GridProvider from './components/GridContext';
// import GridControls from './components/GridControls';
// import GridContainer from './components/GridContainer';
// import ItemPalette from './components/ItemPalette';
// // import GridStats from './components/GridStats';

// const App = () => {
//   return (
//     <GridProvider initialConfig={{ columns: 4, rows: 3, gap: 16 }}>
//       <div className="min-h-screen bg-gray-50 flex">
//         {/* Left Sidebar */}
//         <div className="w-80 bg-gray-100 border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
//           {/* App Title */}
//           <div className="mb-2">
//             <h1 className="text-xl font-semibold text-gray-800 mb-1">
//               Grid Designer
//             </h1>
//             <p className="text-sm text-gray-500">
//               Professional layout system
//             </p>
//           </div>
          
//           {/* Grid Controls */}
//           <GridControls />
          
//           {/* Sidebar Footer */}
//           <div className="mt-auto pt-4 border-t border-gray-200">
//             <div className="flex items-center gap-2 text-xs text-gray-500">
//               <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
//               <span>Built with React</span>
//             </div>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="flex-1 relative">
//           {/* Component Palette (Top-Right) */}
//           <ItemPalette />
          
//           {/* Main Grid Workspace */}
//           <div className="h-full p-6">
//             <GridContainer />
//           </div>
//         </div>
//       </div>
//     </GridProvider>
//   );
// };



// export default App;
import React from 'react';
import GridProvider from './components/GridContext';
import WorkspaceGrid from './components/WorkspaceGrid';
import SidePanel from './components/SidePanel';

const App = () => {
  return (
    <GridProvider initialConfig={{ columns: 4, rows: 4, gap: 16 }}>
      <div className="relative min-h-screen">
        <SidePanel />
        <WorkspaceGrid />
      </div>
    </GridProvider>
  );
};

export default App;
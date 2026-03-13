import { BoardProvider } from './context/BoardContext';
import { Toolbar } from './components/Toolbar';
import { FilterBar } from './components/FilterBar';
import { Board } from './components/Board';
import './styles/index.css';

export default function App() {
  return (
    <BoardProvider>
      <div className="app">
        <Toolbar />
        <FilterBar />
        <Board />
      </div>
    </BoardProvider>
  );
}

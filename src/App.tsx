import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Management from './pages/Management';
import AIAssistant from './pages/AIAssistant';
import ResultView from './pages/ResultView';
import LevelsInfo from './pages/LevelsInfo';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manage" element={<Management />} />
          <Route path="/sumer" element={<AIAssistant />} />
          <Route path="/result/:id" element={<ResultView />} />
          <Route path="/levels" element={<LevelsInfo />} />
        </Routes>
      </Layout>
    </Router>
  );
}

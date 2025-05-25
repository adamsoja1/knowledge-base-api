import './App.css'
import ChatFrontend  from "./components/chat/ChatFrontend"
import SideBar from './components/sidebar/SideBar';

function App() {
  return (
    <div>
    <SideBar/> 
    <ChatFrontend/>
    </div>
  );
}

export default App;

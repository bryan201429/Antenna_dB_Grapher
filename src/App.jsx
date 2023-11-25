import './App.css'
import { Route,Routes } from 'react-router-dom'
import Home from './views/Home/Home'
import Radar from './views/Radar/Radar'
function App() {

  return (
    <>
     <Routes>
      <Route path='/' element={<Home></Home>}></Route>
      <Route path='/Radar' element={<Radar></Radar>}></Route>
     </Routes>
    </>
  )
}

export default App

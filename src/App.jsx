import './App.css'
import { Route,Routes } from 'react-router-dom'
import Home from './views/Home/Home'

function App() {

  return (
    <>
     <Routes>
      <Route path='/' element={<Home></Home>}></Route>
     </Routes>
    </>
  )
}

export default App

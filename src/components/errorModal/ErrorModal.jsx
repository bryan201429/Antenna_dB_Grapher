import './ErrorModal.css'

export default function ErrorModal({ errorFlag, setErrorFlag }){

return(
<div id='errorModalContainer'>
    <div id='errorBox'>
        Verificar los datos del modelo de Okumura
        <button onClick={()=>{setErrorFlag(false)}}>Cerrar</button>
    </div>
</div>

)

}
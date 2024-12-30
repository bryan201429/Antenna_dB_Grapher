import './ErrorModal.css'

export default function ErrorModal({ errorFlag, setErrorFlag,message }){

return(
<div id='errorModalContainer'>
    <div id='errorBox'>
        {message}
        <button onClick={()=>{setErrorFlag(false)}}>Cerrar</button>
    </div>
</div>

)

}
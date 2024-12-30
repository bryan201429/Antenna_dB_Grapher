import './Home.css'
import { useEffect, useState } from 'react';
import React from 'react';
import Plot from 'react-plotly.js';
import ErrorModal from '../../components/errorModal/ErrorModal'

export default function Home(){
    const [dataCSV,setDataCSV]=useState(); 
    const [headers,setHeaders]=useState(null);
    const [theta,setTheta]=useState([]);
    const [dbOriginal,setDbOriginal]=useState([]);
    const [potTxEstimated,setPotTxEstimated]=useState([]);
    const [potDbScal,setPotDbScal]=useState([]);
    const [dbPrediction,setDbPrediction]=useState([]);
    const [distances,setDistances]=useState([]);
    const [maxPotForScale,setMaxPotForScale]=useState(20);
    const [minPotForScale,setMinPotForScale]=useState(-20);
    const [maxDistance,setMaxDistance]=useState(0);
    const [minDistance,setMinDistance]=useState(0);
    const [okumuraCompatible,setOkumuraCompatible]=useState(false);
    const [okumuraCompatibleMessageShow,setOkumuraCompatibleMessageShow]=useState(false);
    const [distanceToScal,setDistanceToScal]=useState(0);
    const [selectedModel,setSelectedModel]=useState(0);

    const [okumuraSettingsVisibility,setOkumuraSettingsVisibility]=useState(false); //Visibilidad de ajustes para Modelo Okumura
    const [okumuraValidInputs,setOkumuraValidInputs] = useState({txHeight: true, rxHeight: true, citySize:true, areaType:true})
    const [okumuraValueInputs,setOkumuraValueInputs] = useState({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined})
    const [okumuraErrorFlag,SetokumuraErrorFlag ]= useState(false);
    const [okumuraReady,SetOkumuraReady ]= useState(false);

    const [selectedModelPrediction,setSelectedModelPrediction]=useState(0);
    const [okumuraSettingsPredictionVisibility, setOkumuraSettingsPredictionVisibility]=useState(false); 
    
    const [okumuraValidInputsPrediction,setOkumuraValidInputsPrediction] = useState({txHeight: true, rxHeight: true, citySize:true, areaType:true})
    const [okumuraValueInputsPrediction,setOkumuraValueInputsPrediction] = useState({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined})
    const [okumuraErrorFlagPrediction,SetokumuraErrorFlagPrediction ]= useState(false);
    const [okumuraReadyPrediction,SetOkumuraReadyPrediction ]= useState(false);


    const c=2.99792458e8;
    const [frequency,setFrequency]=useState(undefined);
    const [data,setData]=useState([
            {
                type: 'scatterpolar',
                r: [],
                theta: [],
                fill: 'toself'
            }
        ]);

    const layout = {
        polar: {
            radialaxis: {
                visible: true,
                range: [minPotForScale-1, maxPotForScale+1]  // Rango del eje radial
            }
        },
        showlegend: false,
        autosize:true,
        bgcolor: 'lightblue',
        title:{
            text: 'Radiation Pattern (Polar Plot) '
        }
    };

    const handleFileChange= async(e)=>{
        if(e.target.files){
            try{
                const file = e.target.files[0];
                const fileUrl = URL.createObjectURL(file);   // 1. create url from the file
                const response = await fetch(fileUrl); // 2. use fetch API to read the file
                const text = await response.text();// 3. get the text from the response
                const lines = text.split("\n");// 4. split the text by newline
                setDataCSV( lines.map((line) => line.split(","))); // Array de arrays
            }
            catch(error){console.log(error)}
        }
    }
    const handleSliderChange = (e)=>{       //!Slider Prediction Value
        const textBox=document.querySelector('#inputTextBox');
        textBox.value=e.target.value;
        setDistanceToScal(e.target.value);
    }
    const handleTextBoxChange=(e)=>{        //!Slider Prediction Value
        const slideInput=document.querySelector('#slideInput');
        // if(e.target.value<minPotForScale){
        //     e.target.value=minPotForScale; //Limitador de valor menor
        // }
        slideInput.value=e.target.value
        setDistanceToScal(e.target.value);   
    }


    //! ///////////////////// OKUMURA INPUTS ////////////////////////////////////////////

        const txAntennaChange = (e)=>{
            SetOkumuraReady(false);
            let txAntennaValue=Number(e.target.value)
            if(txAntennaValue<30 || txAntennaValue>200){
                setOkumuraValidInputs((prev)=>({...prev, txHeight:false}))
                setOkumuraValueInputs((prev)=>({...prev, txHeight:txAntennaValue}))
            }
            else{
                setOkumuraValidInputs((prev)=>({...prev, txHeight:true}))
                setOkumuraValueInputs((prev)=>({...prev, txHeight:txAntennaValue}))
            }
        }
        const rxAntennaChange = (e)=>{
            SetOkumuraReady(false);
            let rxAntennaValue=Number(e.target.value)
            if(rxAntennaValue<1 || rxAntennaValue>10){
                setOkumuraValidInputs((prev)=>({...prev, rxHeight:false}))
                setOkumuraValueInputs((prev)=>({...prev, rxHeight:rxAntennaValue}))
            }
            else{
                 setOkumuraValidInputs((prev)=>({...prev, rxHeight:true}))
                 setOkumuraValueInputs((prev)=>({...prev, rxHeight:rxAntennaValue}))
                }
        }

        const citySizeChange = (option)=>{
            SetOkumuraReady(false);
            setOkumuraValidInputs((prev)=>({...prev, citySize:true}))
            setOkumuraValueInputs((prev)=>({...prev, citySize:option}))
        }
        const areaTypeChange = (option)=>{
            SetOkumuraReady(false);
            setOkumuraValidInputs((prev)=>({...prev, areaType:true}))
            setOkumuraValueInputs((prev)=>({...prev, areaType: prev.areaType == option ? undefined : option,}))
        }


        const handleApply = () => {
            // console.log('Apply button:',{okumuraValueInputs},{okumuraValidInputs})
            SetOkumuraReady(false);
            let validOkumuraFlag=true;

            if(okumuraValueInputs.txHeight==undefined ||okumuraValidInputs.txHeight==false){
                validOkumuraFlag=false;
            }
            if(okumuraValueInputs.rxHeight==undefined ||okumuraValidInputs.rxHeight==false ){
                validOkumuraFlag=false;
            }
            if(okumuraValueInputs.citySize==undefined ||okumuraValidInputs.citySize==false){
                validOkumuraFlag=false;
            }
            if(validOkumuraFlag == false){
                SetokumuraErrorFlag(true);  //Mostrar errorModal
            }
            else if(validOkumuraFlag == true){
                SetOkumuraReady(true);
            }
        }
        

        useEffect(()=>{
            console.log({okumuraValueInputs})
            console.log({okumuraReady})
        },[okumuraReady])


    //! /////////////////////////// Predicción /////////////////////////////////////////////////

            //! ///////////////////// OKUMURA INPUTS ////////////////////////////////////////////

                const txAntennaChangePrediction = (e)=>{
                    SetOkumuraReadyPrediction(false);
                    let txAntennaValue=Number(e.target.value)
                    if(txAntennaValue<30 || txAntennaValue>200){
                        setOkumuraValidInputsPrediction((prev)=>({...prev, txHeight:false}))
                        setOkumuraValueInputsPrediction((prev)=>({...prev, txHeight:txAntennaValue}))
                    }
                    else{
                        setOkumuraValidInputsPrediction((prev)=>({...prev, txHeight:true}))
                        setOkumuraValueInputsPrediction((prev)=>({...prev, txHeight:txAntennaValue}))
                    }
                }
                const rxAntennaChangePrediction = (e)=>{
                    SetOkumuraReadyPrediction(false);
                    let rxAntennaValue=Number(e.target.value)
                    if(rxAntennaValue<1 || rxAntennaValue>10){
                        setOkumuraValidInputsPrediction((prev)=>({...prev, rxHeight:false}))
                        setOkumuraValueInputsPrediction((prev)=>({...prev, rxHeight:rxAntennaValue}))
                    }
                    else{
                        setOkumuraValidInputsPrediction((prev)=>({...prev, rxHeight:true}))
                        setOkumuraValueInputsPrediction((prev)=>({...prev, rxHeight:rxAntennaValue}))
                        }
                }
        
                const citySizeChangePrediction = (option)=>{
                    SetOkumuraReadyPrediction(false);
                    setOkumuraValidInputsPrediction((prev)=>({...prev, citySize:true}))
                    setOkumuraValueInputsPrediction((prev)=>({...prev, citySize:option}))
                }
                const areaTypeChangePrediction = (option)=>{
                    SetOkumuraReadyPrediction(false);
                    setOkumuraValidInputsPrediction((prev)=>({...prev, areaType:true}))
                    setOkumuraValueInputsPrediction((prev)=>({...prev, areaType: prev.areaType == option ? undefined : option,}))
                }
        
        
                const handleApplyPrediction = () => {
                    
                    SetOkumuraReadyPrediction(false);
                    let validOkumuraFlag=true;
        
                    if(okumuraValueInputsPrediction.txHeight==undefined ||okumuraValidInputsPrediction.txHeight==false){
                        validOkumuraFlag=false;
                    }
                    if(okumuraValueInputsPrediction.rxHeight==undefined ||okumuraValidInputsPrediction.rxHeight==false ){
                        validOkumuraFlag=false;
                    }
                    if(okumuraValueInputsPrediction.citySize==undefined ||okumuraValidInputsPrediction.citySize==false){
                        validOkumuraFlag=false;
                    }
                    if(validOkumuraFlag == false){
                        SetokumuraErrorFlagPrediction(true);  //Mostrar errorModal
                    }
                    else if(validOkumuraFlag == true){
                        SetOkumuraReadyPrediction(true);
                    }
                    console.log('Apply button:',{okumuraValueInputsPrediction},{okumuraValidInputsPrediction},{validOkumuraFlag})
                }
                
        
                useEffect(()=>{
                    console.log({okumuraValueInputsPrediction})
                    console.log({okumuraReadyPrediction})
                },[okumuraReadyPrediction])
                
    const handlePredictionClick=()=>{                               
        
        let angs=theta;
        let pots=potTxEstimated;
        let distPrediction=distanceToScal;    
        let FSPL=0;

         pots = pots.map((pot) => {
            let FSPL;

            if(selectedModelPrediction===0){          //!FSPL
                console.log('Prediction FSPL',frequency*10**6)
                if(Math.abs(distPrediction) < (c/(frequency*10**6))/(4 * Math.PI )){
                    pot=pot;
                }
    
                else {
                    FSPL = 20 * Math.log10(Math.abs(distPrediction)) + 20 * Math.log10(frequency*10**6) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('MAYOR', 'distPrediction>maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot-FSPL);
                    pot = pot - (FSPL);
                }
            }
            else if(selectedModelPrediction===1){     //!OKUMURA
                if(Math.abs(distPrediction-maxDistance) < (c/frequency)/(4 * Math.PI )){
                    pot=pot;
                }
                else if (distPrediction > maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(distPrediction-maxDistance)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('MAYOR', 'distPrediction>maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot-FSPL);
                    pot = pot;
                } else if (distPrediction < maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(maxDistance-distPrediction)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('MENOR', 'distPrediction<maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot+FSPL);
                    pot = pot;
                }
            }
            return pot;
        });
        setDbPrediction(pots);
       

    }


    //! ///////////////////////////////////////////////////////////////

    useEffect(()=>{
        
        if(dataCSV){
            setHeaders(dataCSV[0]);
            
            const rows = dataCSV;
            const csvDataLong=rows.length;
            let temporal=0;
            let menor=0;
            let menorpos=0;

            let dist=[];
            let ang=[];

            let pot=[];
            let lat=[];
            let lon=[];
            let alt=[];
            let freq=[];
            let frequency=0;
            for(let x=1;x<csvDataLong;x++){
                // console.log("Fila:", rows[x]);
                pot[x-1]=parseFloat(rows[x][0]);
                lat[x-1]=rows[x][1];
                lon[x-1]=rows[x][2];
                alt[x-1]=rows[x][3];
                freq[x-1]=rows[x][4];
            }
            if(freq){
                console.log('Frecuencia detectada:', freq[0])
                setFrequency(freq[0])
                frequency=Number(freq[0]);
            }

            let lat1 = -16.426006833333332; lat1 = lat1 * Math.PI / 180;          //Origen geográfico conocido de la señal
            let lon1 = -71.57327866666667; lon1 = lon1 * Math.PI / 180;           //Origen geográfico conocido de la señal

        //! //////////// CONVERSION DE LAT Y LONG A DIST, ANG ///////////////////////
            for(let x=0;x<csvDataLong-1;x++){

                let lat2=lat[x] * Math.PI / 180;
                let lon2=lon[x] * Math.PI / 180;
                
                let dlon=lon2-lon1;
                let dlat=lat2-lat1;

                let a=Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(lon1)*Math.cos(lon2)*Math.sin(dlon/2)*Math.sin(dlon/2);
                let c = 2 * Math.atan2(Math.sqrt(Math.abs(a)), Math.sqrt(1 - a));
                let Base=6371*c*1000;

                let Bearing = Math.atan2(Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1),
                Math.sin(lon2-lon1)*Math.cos(lat2));
                
                Bearing=((Bearing * 180 / Math.PI + 360) % 360);
                dist[x]=Base;   
                ang[x]=Bearing;
            }


            //! //////////// REDIMENSIONADO DE POTENCIA PARA GRAFICAR ///////////////////////
            
            let listadbscal = [];    //Guardará los valores de db escalados
            let potEstOrigen = [];
            let listaDbOrig = pot;
            let distmax=0;
            let distmin = Infinity;
        
            for(let x=0;x<csvDataLong-1;x++){   //Hallar distancia más lejana
                if(dist[x]>distmax){
                    distmax=dist[x];
                    setMaxDistance(dist[x]);
                }
                if (dist[x] < distmin) {        // Buscar la distancia más cercana
                    distmin = dist[x];
                    setMinDistance(dist[x]); 
                }
            }
            
            if(distmin<1000){
                setOkumuraCompatible(false);
                setOkumuraCompatibleMessageShow(true); //Mostrar mensaje de modelo okumura incompatible
            }
            else if(distmin){
                setOkumuraCompatible(true);
                setOkumuraCompatibleMessageShow(false); 
            }

            //! Escalar los demás valores al de distancia máxima :Hallar potencia en transmisor :Potenciatx = Potrx + PathLoss
            setDbOriginal(pot);  //Guardar la pot original sin escalar

            if(selectedModel===0){  // Modelo FSPL
                for (let x = 0; x < csvDataLong-1; x++) {
                    if (dist[x] == distmax) {                   //Distancias cortas no aplica FSPL (sin perdida teórica)
                        listadbscal[x] = pot[x];
                        let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequency*10**6))+(20*Math.log10(4 * Math.PI / c));
                        potEstOrigen[x]= pot[x] + FSPL;
                    }
                    else if(Math.abs(dist[x]) < (c/(frequency*10**6))/(4 * Math.PI )){  //Distancias cortas no aplica FSPL (sin perdida teórica)
                         listadbscal[x] = pot[x];
                         let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequency*10**6))+(20*Math.log10(4 * Math.PI / c));
                         potEstOrigen[x]= pot[x] + FSPL;
                     }
                    else if (dist[x]<distmax) {
                        let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequency*10**6))+(20*Math.log10(4 * Math.PI / c));
                        let FSPL2=(20*Math.log10(Math.abs(distmax)))+(20*Math.log10(frequency*10**6))+(20*Math.log10(4 * Math.PI / c));
                        listadbscal[x] =  pot[x]+FSPL-FSPL2;
                        potEstOrigen[x]= pot[x] + FSPL;
                        // console.log(pot[x],{FSPL},{FSPL2})
                    }
                }		
                setPotTxEstimated(potEstOrigen);
            }
            else if(selectedModel===1){ // Modelo Okumura
                if(okumuraReady==true){
                    for (let x = 0; x < csvDataLong-1; x++) {
                        let ahm=0;
                        let K=0;                            // Factor de corrección según área
                        if(okumuraValueInputs.citySize==1){ // ciudad pequeña,mediana
                            ahm=(1.1*Math.log10(frequency)-0.7)*okumuraValueInputs.rxHeight-(1.56*Math.log10(frequency)-0.8)
                        }else if(okumuraValueInputs.citySize==2){ // ciudad grande
                            if(frequency<=300){
                                ahm=8.29*(Math.log10(1.54*okumuraValueInputs.rxHeight))**2 - 1.1     // Menor a 300 MHz
                            }
                            else if(frequency>300){
                                ahm=3.2*(Math.log10(11.75*okumuraValueInputs.rxHeight))**2 - 4.97    // Mayor a 300 MHz
                            }
                        }
                        if(okumuraValueInputs.areaType!==undefined){
                                if(okumuraValueInputs.areaType==1){
                                    K=2*((Math.log10(frequency/28))**2) + 5.4
                                }
                                else if(okumuraValueInputs.areaType==2){
                                    K=4.78*(Math.log10(frequency))**2 - (18.3*(Math.log10(frequency))) + 40.94
                                }
                            }
                        if (dist[x] == distmax) {       // Valor máximo, no tendría perdidas
                            let L=69.55 + 26.16*Math.log10(frequency) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm + (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(dist[x])/1000);
                            listadbscal[x] = pot[x];
                            potEstOrigen[x]= pot[x] + (L - K);
                        }
                        else{
                            let L=69.55 + 26.16*Math.log10(frequency) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm + (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(dist[x])/1000);
                            let L2=69.55 + 26.16*Math.log10(frequency) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm + (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(distmax)/1000);
                            console.log(pot[x],{ahm},{L},{L2},{K})
                            listadbscal[x] = pot[x] + (L - K) -(L2 - K);
                            potEstOrigen[x]= pot[x] + (L - K);
                        }
                    }
                    setPotTxEstimated(potEstOrigen);		
                    console.log('Ejecutando okumura con:', okumuraValueInputs)

                }
                else{ console.log('Okumura invalido')
                }
            }

            // console.log('Lista dist PREV:',dist);
            // console.log('Lista db PREV',pot);
            
            // console.log('Angulos NO ordenados: ',ang);

        //! ///////////////////////// ORDENAR ARRAYS SEGUN ANGULOS DE FORMA ASCENDENTE /////////////////////////////////////

            menor = 1000;
            let dbScalTemp = 0;
            let distTemp = 0;
            let potTemp = 0;
            let potEstTemp = 0;

            for(let j=0; j<csvDataLong-1;j++){ // Recorre el array incrementando el indice de inicio cada vez (el indice menor tiene el numero menor)

                for(let i=j;i<csvDataLong-1;i++){
                    if(ang[i]<menor){
                        menor=ang[i];
                        menorpos=i;
                    }    
                }
                temporal=ang[j];
                ang[j]=menor;        // Se asigna el valor menor a la posicion 0 del array
                ang[menorpos]=temporal; //Se intercambia el menor valor 

                dbScalTemp = listadbscal[j];
                listadbscal[j] = listadbscal[menorpos];
                listadbscal[menorpos] = dbScalTemp;

                potEstTemp = potEstOrigen[j];
                potEstOrigen[j] = potEstOrigen[menorpos];
                potEstOrigen[menorpos] = potEstTemp;

                distTemp = dist[j];
                dist[j] = dist[menorpos];
                dist[menorpos] = distTemp;

                potTemp = listaDbOrig[j];
                listaDbOrig[j] = listaDbOrig[menorpos];
                listaDbOrig[menorpos] = potTemp;
                menor = 5000;
            }
            // console.log('Angulos ordenados: ',ang);
            // console.log('Lista dist:',dist);
            // console.log('Lista db escalados',listadbscal);
            // console.log('Lista db origin',listadbscal);
            setTheta(ang);
            setPotDbScal(listadbscal);
            setDistances(dist);
            setDbOriginal(listaDbOrig); 

            setMaxPotForScale(Math.max(...listadbscal));
            setMinPotForScale(Math.min(...listadbscal));

            //! ////////////////////		GRAFICO POLAR		////////////////

            const datagraph = [
                {
                    type: 'scatterpolar',
                    r: listadbscal,
                    theta: ang,
                    fill: 'toself'
                }
            ];
            setData(datagraph);
        }
        else{
            setOkumuraCompatibleMessageShow(false); //Mensaje de "okumura incompatible" oculto
        }
    },[dataCSV,frequency,selectedModel,okumuraReady])



useEffect(()=>{
    if(selectedModel==1){
        setOkumuraSettingsVisibility(true);
    }
    else{
        setOkumuraSettingsVisibility(false);
    } 
},[selectedModel])

useEffect(()=>{
    if(selectedModelPrediction==1){
        setOkumuraSettingsPredictionVisibility(true);
    }
    else{
        setOkumuraSettingsPredictionVisibility(false);
    } 
},[selectedModelPrediction])

    return(
        <div id='Home'>
            <div id='title'>
        Graficador polar de diagrama de radiación
            </div>
        
        <div id='HomeContainer'>
            
            <div className='FirstRowContainer'>
               

                <div className='optionsCointainer'>
                    <div className='uploader1'>
                        <h3>Subir CSV para analisis</h3>
                        <input type='file' name ='file' accept='.csv' onChange={handleFileChange} className='inputFile'></input>    
                    </div>
                    <div className='freqContainer'>
                        <h3>Frecuencia detectada: </h3>
                        <h3>{frequency ? `${frequency} MHz` : '-'}</h3>

                    </div>
                    <div className='propagationBox'>
                        <h3>Modelo de propagación</h3>
                        <div className='selectModelPropagation'>
                        
                            <h4>Seleccione un modelo de propagación: </h4>
                            <div>
                                <label>
                                    <input type="radio" name="opcion" value="1" onChange={() => {setSelectedModel(0); }} checked={selectedModel === 0}/>
                                    FSPL
                                </label>
                                <label>
                                    <input type="radio" name="opcion" value="2" onChange={() => {setSelectedModel(1); }} checked={selectedModel === 1} disabled={!okumuraCompatible}/>
                                    Okumura-Hata
                                </label>
                            </div>
                         </div>
                         {okumuraCompatibleMessageShow && <h3 className='errorMessage'>Modelo de okumura Hata no aplicable (distancia de muestras menor a 1 km)</h3>}
                        {okumuraSettingsVisibility && <div className='OkumuraOptionsContainer'>
                            
                            <div className='altOkumura'>                              
                                <label className='labelOkumura'> Altura de la antena transmisora: <label className='labelOkumura2'> (Rango permitido: 30 - 200 metros) </label></label>
                                <input type= 'number' value={okumuraValueInputs.txHeight} onChange={txAntennaChange}  className={`${!okumuraValidInputs.txHeight ? 'invalidInput' : ''} altsOkumura`}/>
                                
                            </div>
                            <div className='altOkumura'>   
                                <label className='labelOkumura'> Altura de la antena receptora: <label className='labelOkumura2'> (Rango permitido: 1 - 10 metros) </label> </label>
                                <input type='number' value={okumuraValueInputs.rxHeight} onChange={rxAntennaChange}  className={`${!okumuraValidInputs.rxHeight ? 'invalidInput' : ''} altsOkumura`}/>
                                
                            </div>
                            <div className='okumuraCorrectionsBox'>
                                Seleccionar tamaño de ciudad:
                                <div>
                                    <label>
                                        <input type="radio" name="tamañoCiudad" value="1" onChange={()=>citySizeChange(1)} />
                                        Pequeña / mediana
                                        </label>
                                    <label>
                                        <input type="radio" name="tamañoCiudad" value="2" onChange={()=>citySizeChange(2)} />
                                        Grande
                                    </label>
                                </div>
                            
                            </div>
                                
                            <div className='okumuraCorrectionsBox'>
                                Tipo de área:
                                <div>
                                    <label>
                                        <input type="radio" name="tipoArea" onClick={() => areaTypeChange(1)} checked={okumuraValueInputs.areaType == 1}/>
                                        Suburbana
                                        </label>
                                    <label>
                                        <input type="radio" name="tipoArea" onClick={() => areaTypeChange(2)} checked={okumuraValueInputs.areaType == 2}/>
                                        Rural / Abiertaa
                                    </label>
                                </div>
                            
                            </div>
                            <button className='applyOkumuraButton' onClick={handleApply}> Aplicar Modelo</button>
                        </div>}
                    </div>







                    <div className='predictionBox'>
                        <h3>Predicción</h3>
                        <div className='selectModelPropagation'>
                        
                        <h4>Seleccione un modelo de propagación: </h4>
                        <div>
                            <label>
                                <input type="radio" name="predictionOption" value="1" onChange={() => {setSelectedModelPrediction(0); }} checked={selectedModelPrediction === 0}/>
                                FSPL
                            </label>
                            <label>
                                <input type="radio" name="predictionOption" value="2" onChange={() => {setSelectedModelPrediction(1); }} checked={selectedModelPrediction === 1}/>
                                Okumura-Hata
                            </label>
                        </div>
                     </div>

                    {okumuraSettingsPredictionVisibility && <div className='OkumuraOptionsContainer'>
                        
                        <div className='altOkumura'>                              
                            <label className='labelOkumura'> Altura de la antena transmisora: <label className='labelOkumura2'> (Rango permitido: 30 - 200 metros) </label></label>
                            <input type= 'number' value={okumuraValueInputsPrediction.txHeight} onChange={txAntennaChangePrediction}  className={`${!okumuraValidInputsPrediction.txHeight ? 'invalidInput' : ''} altsOkumura`}/>
                            
                        </div>
                        <div className='altOkumura'>   
                            <label className='labelOkumura'> Altura de la antena receptora: <label className='labelOkumura2'> (Rango permitido: 1 - 10 metros) </label> </label>
                            <input type='number' value={okumuraValueInputsPrediction.rxHeight} onChange={rxAntennaChangePrediction}  className={`${!okumuraValidInputsPrediction.rxHeight ? 'invalidInput' : ''} altsOkumura`}/>
                            
                        </div>
                        <div className='okumuraCorrectionsBox'>
                            Seleccionar tamaño de ciudad:
                            <div>
                                <label>
                                    <input type="radio" name="tamañoCiudadPrediction" value="1" onChange={()=>citySizeChangePrediction(1)} />
                                    Pequeña / mediana
                                    </label>
                                <label>
                                    <input type="radio" name="tamañoCiudadPrediction" value="2" onChange={()=>citySizeChangePrediction(2)} />
                                    Grande
                                </label>
                            </div>
                        
                        </div>
                            
                        <div className='okumuraCorrectionsBox'>
                            Tipo de área:
                            <div>
                                <label>
                                    <input type="radio" name="tipoAreaPrediction" onClick={() => areaTypeChangePrediction(1)} checked={okumuraValueInputsPrediction.areaType == 1}/>
                                    Suburbana
                                    </label>
                                <label>
                                    <input type="radio" name="tipoAreaPrediction" onClick={() => areaTypeChangePrediction(2)} checked={okumuraValueInputsPrediction.areaType == 2}/>
                                    Rural / Abiertaa
                                </label>
                            </div>
                        
                        </div>
                        <button className='applyOkumuraButton' onClick={handleApplyPrediction}> Confirmar datos para Modelo de predicción</button>
                    </div>}
                        <div>
                            <label>Ingrese una distancia de estimación (m):</label>
                            <input type='range' name='distancia' min={0} max='5000' step='0.5' onChange={handleSliderChange} id='slideInput'></input>
                            <input type='textbox' id='inputTextBox' min={0} max='5000' onChange={handleTextBoxChange}></input>
                            <button id='predictionButton' onClick={handlePredictionClick}>Prediction</button>
                        </div>
                        
                    </div>
                    
                </div>
                <Plot
                    data={data}
                    layout={layout}
                    config={{ responsive: true, useResizeHandler:true }}
                    useResizeHandler={true}
                    className='plotChart'
                />
            </div>
            

                <div className='tableContainer'>
                    <table className='dataTable'>
                        <thead>
                            <th>Sample</th>
                            <th>Theta</th>
                            <th>Dist. Original</th>
                            <th>Dist. Escalada</th>
                            <th>Pot. Medida</th>
                            <th>Pot. Estimada en Origen</th>
                            <th>Potencia Escalada</th>
                            <th>PotPredicted</th>

                        </thead>
                        <tbody> 
                            {theta&&theta.map((column,i)=>{
                                return( 
                                <tr> 
                                    <td>{i}</td>
                                    <td>{theta[i]}</td> 
                                    <td>{distances[i]}</td> 
                                    <td>{maxDistance}</td> 
                                    <td>{dbOriginal[i]}</td> 
                                    <td>{potTxEstimated[i]}</td>
                                    <td>{potDbScal[i]}</td> 
                                    <td>{dbPrediction[i]}</td> 
                                </tr>
                                )
                            })}

                        </tbody>
                    </table>
        
                </div>
               </div>
            {okumuraErrorFlag && <ErrorModal errorFlag={okumuraErrorFlag} message="Verificar los datos del modelo de Okumura" setErrorFlag={SetokumuraErrorFlag}/>}
            {okumuraErrorFlagPrediction && <ErrorModal errorFlag={okumuraErrorFlagPrediction} message="Verificar datos para Predicción" setErrorFlag={SetokumuraErrorFlagPrediction}/>}
        </div>
    )
}
import './Home.css'
import { useEffect, useState,useRef } from 'react';
import React from 'react';
import Plot from 'react-plotly.js';
import ErrorModal from '../../components/errorModal/ErrorModal';
import cubicSpline from 'cubic-spline';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

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
    const [minPotForScale,setMinPotForScale]=useState(-50);
    const [maxDistance,setMaxDistance]=useState(0);
    const [minDistance,setMinDistance]=useState(0);
    const [okumuraCompatible,setOkumuraCompatible]=useState(false);
    const [okumuraCompatibleMessageShow,setOkumuraCompatibleMessageShow]=useState(false);
    const [distanceToScal,setDistanceToScal]=useState(0);
    const [selectedModel,setSelectedModel]=useState(0); 
    const [staticCsv,setStaticCsv] = useState(false);
    const [maxPot,setMaxPot] = useState(null);                                  //Valor max de pot
    const [maxTheta,setMaxTheta] = useState(null);                              //Theta con pot max de pot
    const [minPot,setMinPot] = useState(null);                                  //Valor mínimo de pot.
    const [minTheta,setMinTheta] = useState(null);                              //Theta con pot mínimo de pot
    const [latOrigen,setLatOrigen] = useState(-16.426006833333332);
    const [lonOrigen,setLonOrigen] = useState(-71.57327866666667);


    const [thetaAfterSpline,setThetaAfterSpline]=useState([]);
    const [potDbScalAfterSpline,setPotDbScalAfterSpline]=useState([]);
    const [distancesAfterSpline,setDistancesAfterSpline]=useState([]);
    const [dbOriginalAfterSpline,setDbOriginalAfterSpline]=useState([]);
    const [potTxEstimatedAfterSpline,setPotTxEstimatedAfterSpline]=useState([]);
    const [potPredictedAfterSpline,setPotPredictedAfterSpline]=useState([]);
    const [maxPotAfterSpline,setMaxPotAfterSpline] = useState(null);            //Valor max de pot.spline
    const [maxThetaAfterSpline,setMaxThetaAfterSpline] = useState(null);        //Theta con pot mínimo de pot.spline
    const [minPotAfterSpline,setMinPotAfterSpline] = useState(null);            //Valor mínimo de pot.spline
    const [minThetaAfterSpline,setMinThetaAfterSpline] = useState(null);        //Theta con pot mínimo de pot.spline


    const [interEnabled,setInterEnabled] = useState(false);
    const [interNumber,setInterNumber] = useState(null);
    const [interReady,setInterReady] = useState(false);

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
    const [predictionDone, setPredictionDone]=useState(false);

    const [minDistancePrediction,setMinDistancePrediction ]= useState(0);
    const [maxDistancePrediction,setMaxDistancePrediction ]= useState(10000);


    const c=2.99792458e8;
    const [frequency,setFrequency]=useState(undefined);
    const [data,setData]=useState([
            {
                type: 'scatterpolar',
                r: [],
                theta: [],
                fill: 'toself',
                line: {
                    color: '#FF5733',
                    width: 3
                  }
            }
        ]);

        const layout = {
            polar: {
                radialaxis: {
                    visible: true,
                    range: [minPotForScale , maxPotForScale +0.5], // Rango inicial del eje radial
                    tickfont: { color: 'white' },
                    gridcolor: 'white',
                    linecolor: 'white',
                },
                angularaxis: {
                    visible: true,
                    gridcolor: 'white',
                    tickfont: { color: 'white' },
                    title: {
                        text: 'Angular Axis',
                        font: { color: 'white' }
                    },
                },
                bgcolor: 'rgba(30,30,30,0.9)', // Fondo bajo el gráfico
            },
            showlegend: false,
            autosize: true,
            paper_bgcolor: 'rgba(30,30,30,0.9)', // Fondo general del gráfico
            title: {
                text: 'Radiation Pattern (Polar Plot)',
                font: { color: 'white' }
            },
            hovermode: 'closest',
            hoverlabel: {
                bgcolor: '#444',
                font: {
                    color: 'white',
                    size: 12,
                },
            },
            dragmode: 'zoom',  // Asegúrate de que el dragmode esté activado
            
        };
        
        

    const [dataSpline,setDataSpline]=useState([
        {
            type: 'scatterpolar',
            r: [],
            theta: [],
            fill: 'toself'
        }
    ]);


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
        let newDistanceValue=parseFloat(e.target.value)
        if (newDistanceValue>=minDistancePrediction){
            setDistanceToScal(newDistanceValue);
            console.log('valor valido',{newDistanceValue},{minDistancePrediction})
        }
        else{
            setDistanceToScal(minDistance);
        }
        
    }
    const handleTextBoxChange=(e)=>{        //!Slider Prediction Value
        let newDistanceValue=parseFloat(e.target.value)
        if (newDistanceValue >= minDistancePrediction && newDistanceValue <= maxDistancePrediction) {
            setDistanceToScal(newDistanceValue);   
    
        }
        
    }
    //! ///////////////////// INTERPOLATION ////////////////////////////////////////////

    const handleCheckboxChange = (event) => {
        setInterEnabled(event.target.checked); 
      };

    const handleInputInterpolChange = (event) =>{
        setInterNumber(event.target.value)
    }
    const handleApplyInterpol = (event) =>{
        setInterReady(true);
        console.log({ theta }, { distances }, { dbOriginal }, { potTxEstimated }, { potDbScal }, { dbPrediction });
    
        let splineTheta = [];
        let interpolatedValues = [];
        let interpolatedDbScaled = [];
        let interpolatedDbPredicted = [];
        let interpolatedDistances = [];
        let interpolatedPotOriginal = [];
    
        // Interpolación dentro del rango definido
        for (let i = 0; i < theta.length; i++) {
            if (i != theta.length - 1) {
                let delta = (theta[i + 1] - theta[i]) / (Number(interNumber) + 1);
                splineTheta.push(theta[i]);
                for (let j = 1; j <= interNumber; j++) {
                    splineTheta.push(theta[i] + delta * j);
                }
            } else {    // Agregar el último valor de theta
                
                splineTheta.push(theta[i]);
            }
        }
    
        // Interpolación entre el último y el primer punto
        const lastTheta = theta[theta.length - 1];
        const firstTheta = theta[0] + 360; // Asegurar la continuidad circular
        let deltaClosing = (firstTheta - lastTheta) / (Number(interNumber) + 1);
        for (let j = 1; j <= interNumber; j++) {
            splineTheta.push(lastTheta + deltaClosing * j);
        }
    
        // Asegurarse de que los valores de theta sean cíclicos (0-360°)
        splineTheta = splineTheta.map((angle) => angle % 360);
    
        // Generar splines para cada conjunto de datos
        const potenciaOrigenSpline = new cubicSpline([...theta, theta[0] + 360], [...potTxEstimated, potTxEstimated[0]]);
        const potenciaDbScalSpline = new cubicSpline([...theta, theta[0] + 360], [...potDbScal, potDbScal[0]]);
        const potenciaDbPredictSpline = new cubicSpline([...theta, theta[0] + 360], [...dbPrediction, dbPrediction[0]]);
        const distancesOriginalSplice = new cubicSpline([...theta, theta[0] + 360], [...distances, distances[0]]);
        const potOriginalSplice = new cubicSpline([...theta, theta[0] + 360], [...dbOriginal, dbOriginal[0]]);
    
        // Calcular los valores interpolados
        for (let i = 0; i < splineTheta.length; i++) {
            interpolatedValues.push(potenciaOrigenSpline.at(splineTheta[i]));
            interpolatedDbScaled.push(potenciaDbScalSpline.at(splineTheta[i]));
            interpolatedDbPredicted.push(potenciaDbPredictSpline.at(splineTheta[i]));
            interpolatedDistances.push(distancesOriginalSplice.at(splineTheta[i]));
            interpolatedPotOriginal.push(potOriginalSplice.at(splineTheta[i]));
        }
    
        // Actualizar los estados con los resultados
        setThetaAfterSpline(splineTheta);
        setPotDbScalAfterSpline(interpolatedDbScaled);
        setDistancesAfterSpline(interpolatedDistances);
        setDbOriginalAfterSpline(interpolatedPotOriginal);
        setPotTxEstimatedAfterSpline(interpolatedValues);
        setPotPredictedAfterSpline(interpolatedDbPredicted);

        //Encontrar el valor máx de pot de la data spline:
        const { maxDb, maxTheta } = interpolatedDbScaled.reduce(
            (acc, db, i) => db > acc.maxDb ? { maxDb: db, maxTheta: splineTheta[i] } : acc, //condicion
            { maxDb: -Infinity, maxTheta: 0 }   //valores iniciales
          );
        setMaxPotAfterSpline(maxDb);
        setMaxThetaAfterSpline(maxTheta);
        
        //Encontrar el valor min de pot de la data spline:
        const { minDb, minTheta } = interpolatedDbScaled.reduce(
            (acc, db, i) => db < acc.minDb ? { minDb: db, minTheta: splineTheta[i] } : acc, //condicion
            { minDb: Infinity, minTheta: 0 }   //valores iniciales
            );
            setMinPotAfterSpline(minDb);
            setMinThetaAfterSpline(minTheta);

        //! ////////////////////		GRAFICO SPLINE		////////////////
        const datagraph = [
            {   type: 'scatterpolar',
                r: interpolatedDbScaled,
                theta: splineTheta,
                mode: 'lines+markers',
                fill: 'toself',
                line: {
                    color: '#rgba(0,220,100,1)',
                    width: 3
                  },
                  hoverinfo: 'r+theta+name', // Incluye el nombre para más contexto
                //   name: 'I + theta', // Nombre que aparecerá en el hover
                //   hoverlabel: {
                //       bgcolor: '#000', // Fondo del cuadro de hover
                //       font: {
                //           color: '#FFF', // Color del texto en el hover
                //           size: 12 // Tamaño de fuente del hover
                //       }
                //   }
            }
        ];
        setDataSpline(datagraph);

        console.log({interpolatedValues});
    }

    useEffect(()=>{
        console.log('Interpolando despues de predicción');
        handleApplyInterpol();    
    },[predictionDone])

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
            }else if(validOkumuraFlag == true){
                SetOkumuraReady(true);
            }
        }
        
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
                    }else{
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
                    }else if(validOkumuraFlag == true){
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
        let L = 0;
        let ahm = 0;
        let K = 0;

         pots = pots.map((pot) => {

            if(selectedModelPrediction===0){          //!FSPL
                console.log('Prediction FSPL',frequency*10**6)
                if(Math.abs(distPrediction) < (c/(frequency*10**6))/(4 * Math.PI )){
                    pot=pot;
                }
                else {
                    FSPL = 20 * Math.log10(Math.abs(distPrediction)) + 20 * Math.log10(frequency*10**6) + 20 * Math.log10(4 * Math.PI / c);
                    pot = pot - (FSPL);
                }
            }
            else if(selectedModelPrediction===1){     //!OKUMURA
                if(okumuraReadyPrediction){
                    console.log('Prediciendo okumura')
                    if(okumuraValueInputsPrediction.citySize==1){ // ciudad pequeña,mediana
                        ahm=(1.1*Math.log10(frequency)-0.7)*okumuraValueInputsPrediction.rxHeight-(1.56*Math.log10(frequency)-0.8)
                    }else if(okumuraValueInputsPrediction.citySize==2){ // ciudad grande
                        if(frequency<=300){
                            ahm=8.29*(Math.log10(1.54*okumuraValueInputsPrediction.rxHeight))**2 - 1.1     // Menor a 300 MHz
                        }
                        else if(frequency>300){
                            ahm=3.2*(Math.log10(11.75*okumuraValueInputsPrediction.rxHeight))**2 - 4.97    // Mayor a 300 MHz
                        }
                    }
                    if(okumuraValueInputsPrediction.areaType!==undefined){
                            if(okumuraValueInputsPrediction.areaType==1){
                                K=2*((Math.log10(frequency/28))**2) + 5.4
                            }
                            else if(okumuraValueInputsPrediction.areaType==2){
                                K=4.78*(Math.log10(frequency))**2 - (18.3*(Math.log10(frequency))) + 40.94
                            }
                        }
                    L=69.55 + 26.16*Math.log10(frequency) - 13.82*Math.log10(okumuraValueInputsPrediction.txHeight) - ahm + (44.9-6.55*Math.log10(okumuraValueInputsPrediction.txHeight))*Math.log10(Math.abs(distPrediction)/1000);
                    pot = pot - (L - K);
                }
            }
            
            return pot;
        });
        setDbPrediction(pots);     
        setPredictionDone(prev => !prev);  
    }

    //! ///////////////////////////////////////////////////////////////

    useEffect(()=>{
        
        if(dataCSV){
            setHeaders(dataCSV[0]);
            const rows = dataCSV.filter(row => 
                row && Object.values(row).some(value => value !== null && value !== undefined && value !== '')
            );
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
            let frequencyLocal=0;
            let staticMode=false;
            setStaticCsv(false);
            setDbPrediction([]);


            // let lat1 = -16.426006833333332; 
            let lat1 = latOrigen * Math.PI / 180;          //Origen geográfico conocido de la señal
            // let lon1 = -71.57327866666667; 
            let lon1 = lonOrigen * Math.PI / 180;           //Origen geográfico conocido de la señal

            if (rows[0]) {
                rows[0].forEach(column => {
                    if (typeof column === 'string' && column.toLowerCase().includes('grado')) {
                        staticMode = true;
                        setStaticCsv(true);
                    }
                });
            }
            // console.log('Modo estatico:',staticMode);

            if(staticMode === false){  //Receptor con capturas variables, radios variables
                setStaticCsv(false);
                for(let x=1;x<csvDataLong;x++){
                    pot[x-1]=parseFloat(rows[x][0]);
                    lat[x-1]=rows[x][1];
                    lon[x-1]=rows[x][2];
                    // alt[x-1]=rows[x][3];
                    freq[x-1]=rows[x][3];
                }
                if(freq){
                    console.log('Frecuencia detectada:', freq[0])
                    if(frequency!=freq[0]){
                        // console.log('cambio de freq',{frequency},{frequencyLocal})
                        setOkumuraValueInputs({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined});
                        setOkumuraValidInputs({txHeight: true, rxHeight: true, citySize:true, areaType:true});
                        SetokumuraErrorFlag(false);
                        SetOkumuraReady(false);
                        setOkumuraSettingsVisibility(false);
            
                        setOkumuraValueInputsPrediction({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined});
                        setOkumuraValidInputsPrediction({txHeight: true, rxHeight: true, citySize:true, areaType:true});
                        SetokumuraErrorFlagPrediction(false);
                        SetOkumuraReadyPrediction(false);
            
                        setSelectedModel(0)
                        setSelectedModelPrediction(0)
                        setOkumuraSettingsPredictionVisibility(false)
                        setMinDistancePrediction(0)
                        }
                        setFrequency(freq[0])
                        frequencyLocal=Number(freq[0]);
                }
       
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
            }
            else if(staticMode === true){
                    for(let x=1;x<csvDataLong;x++){
                        pot[x-1]=parseFloat(rows[x][0]);
                        // alt[x-1]=rows[x][3];
                        freq[x-1]=rows[x][3];
                    }
                    for (let x=1; x<csvDataLong;x++){
                        dist[x-1]=rows[x][2];
                        ang[x-1] =rows[x][1]
                    }
                    if(freq){
                        // console.log('Frecuencia detectada:', freq[0])
                        if(frequency!=freq[0]){
                            // console.log('cambio de freq',{frequency},{frequencyLocal})
                            setOkumuraValueInputs({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined});
                            setOkumuraValidInputs({txHeight: true, rxHeight: true, citySize:true, areaType:true});
                            SetokumuraErrorFlag(false);
                            SetOkumuraReady(false);
                            setOkumuraSettingsVisibility(false);
                
                            setOkumuraValueInputsPrediction({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined});
                            setOkumuraValidInputsPrediction({txHeight: true, rxHeight: true, citySize:true, areaType:true});
                            SetokumuraErrorFlagPrediction(false);
                            SetOkumuraReadyPrediction(false);
                
                            setSelectedModel(0)
                            setSelectedModelPrediction(0)
                            setOkumuraSettingsPredictionVisibility(false)
                            setMinDistancePrediction(0)
                            }
                            setFrequency(freq[0])
                            frequencyLocal=Number(freq[0]);
                    }
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
                    if (dist[x] == distmax) {                  
                        listadbscal[x] = pot[x];
                        let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequencyLocal*10**6))+(20*Math.log10(4 * Math.PI / c));
                        potEstOrigen[x]= pot[x] + FSPL;
                    }
                    else if(Math.abs(dist[x]) < (c/(frequencyLocal*10**6))/(4 * Math.PI )){  //Distancias cortas no aplica FSPL (sin perdida teórica)
                         listadbscal[x] = pot[x];
                         let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequencyLocal*10**6))+(20*Math.log10(4 * Math.PI / c));
                         potEstOrigen[x]= pot[x] + FSPL;
                     }
                    else if (dist[x]<distmax) {
                        let FSPL=(20*Math.log10(Math.abs(dist[x])))+(20*Math.log10(frequencyLocal*10**6))+(20*Math.log10(4 * Math.PI / c));
                        let FSPL2=(20*Math.log10(Math.abs(distmax)))+(20*Math.log10(frequencyLocal*10**6))+(20*Math.log10(4 * Math.PI / c));
                        listadbscal[x] =  pot[x]+FSPL-FSPL2;
                        potEstOrigen[x]= pot[x] + FSPL;
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
                            ahm=(1.1*Math.log10(frequencyLocal)-0.7)*okumuraValueInputs.rxHeight-(1.56*Math.log10(frequencyLocal)-0.8)
                        }else if(okumuraValueInputs.citySize==2){ // ciudad grande
                            if(frequencyLocal<=300){
                                ahm=8.29*(Math.log10(1.54*okumuraValueInputs.rxHeight))**2 - 1.1     // Menor a 300 MHz
                            }
                            else if(frequencyLocal>300){
                                ahm=3.2*(Math.log10(11.75*okumuraValueInputs.rxHeight))**2 - 4.97    // Mayor a 300 MHz
                            }
                        }
                        if(okumuraValueInputs.areaType!==undefined){
                                if(okumuraValueInputs.areaType==1){ //Suburbana
                                    K=2*((Math.log10(frequencyLocal/28))**2) + 5.4
                                }
                                else if(okumuraValueInputs.areaType==2){ //Rural
                                    K=4.78*(Math.log10(frequencyLocal))**2 - (18.3*(Math.log10(frequencyLocal))) + 40.94
                                }
                            }
                        if (dist[x] == distmax) {       // Valor máximo, no tendría perdidas
                            let L=69.55 + 26.16*Math.log10(frequencyLocal) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm +
                             (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(dist[x])/1000);
                            listadbscal[x] = pot[x];
                            potEstOrigen[x]= pot[x] + (L - K);
                        }
                        else{
                            let L=69.55 + 26.16*Math.log10(frequencyLocal) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm + 
                            (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(dist[x])/1000);
                            let L2=69.55 + 26.16*Math.log10(frequencyLocal) - 13.82*Math.log10(okumuraValueInputs.txHeight) - ahm + 
                            (44.9-6.55*Math.log10(okumuraValueInputs.txHeight))*Math.log10(Math.abs(distmax)/1000);
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
          
            // Combina los arrays en un solo array de objetos para mantener la relación entre ellos
                const combinedData = ang.map((value, index) => ({
                    ang: Number(value),
                    dbScal: listadbscal[index],
                    dist: Number(dist[index]),
                    pot: listaDbOrig[index],
                    potEst: potEstOrigen[index],
                }));

                // Ordena el array combinado según los valores de `ang`
                combinedData.sort((a, b) => a.ang - b.ang);

                // Separa los arrays ordenados
                const angSorted = combinedData.map(item => item.ang);
                const dbScalSorted = combinedData.map(item => item.dbScal);
                const distSorted = combinedData.map(item => item.dist);
                const potSorted = combinedData.map(item => item.pot);
                const potEstSorted = combinedData.map(item => item.potEst);

                // Actualiza los estados con los valores ordenados
                setTheta(angSorted);
                setPotDbScal(dbScalSorted);
                setDistances(distSorted);
                setDbOriginal(potSorted);
                setPotTxEstimated(potEstSorted);

                // Calcula y establece los valores máximo y mínimo de la potencia escalada
                setMaxPotForScale(Number(Math.max(...dbScalSorted)));
                setMinPotForScale(Number(Math.min(...dbScalSorted)));

                // console.log('Ángulos ordenados:', angSorted);
                // console.log('Lista distancias:', distSorted);
                // console.log('Lista db escalados:', dbScalSorted);
                // console.log('Lista db original:', potSorted);

                //Encontrar el valor máx de pot de la data spline:
                const { maxDb, maxTheta } = potDbScal.reduce(
                    (acc, db, i) => db > acc.maxDb ? { maxDb: db, maxTheta: angSorted[i] } : acc, //condicion
                    { maxDb: -Infinity, maxTheta: 0 }   //valores iniciales
                );
                setMaxPot(maxDb);
                setMaxTheta(maxTheta);
                
                //Encontrar el valor min de pot de la data spline:
                const { minDb, minTheta } = potDbScal.reduce(
                    (acc, db, i) => db < acc.minDb ? { minDb: db, minTheta: angSorted[i] } : acc, //condicion
                    { minDb: Infinity, minTheta: 0 }   //valores iniciales
                    );
                setMinPot(minDb);
                setMinTheta(minTheta);
                    

            //! ////////////////////		GRAFICO POLAR		////////////////

            const datagraph = [
                {   type: 'scatterpolar',
                    r: dbScalSorted,
                    theta: angSorted,
                    fill: 'toself',
                    line: {
                        color: '#rgba(250,70,0,1)',
                        width: 2
                      }
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



//! //////////////////////////// EXPORTAR //////////////////////////////////
    const exportToExcel = () => {
        // Obtener datos de la primera tabla
        const table1 = [
            ['Sample', 'Theta (°)', 'Dist. Original', 'Pot. Medida', 'Pot. Estimada en Origen', `Potencia Escalada en Distancia Máxima (${maxDistance} metros)`, 'PotPredicted'],
            ...theta.map((_, i) => [
                i,
                theta[i].toFixed(3),
                distances[i].toFixed(3),
                dbOriginal[i],
                potTxEstimated[i],
                potDbScal[i],
                dbPrediction[i]
            ])
        ];

        // Obtener datos de la segunda tabla
        const table2 = [
            ['Sample', 'Theta (°)', 'Dist. Original', 'Pot. Medida', 'Pot. Estimada en Origen', `Potencia Escalada en Distancia Máxima (${maxDistance} metros)`, 'PotPredicted'],
            ...thetaAfterSpline.map((_, i) => [
                i,
                thetaAfterSpline[i].toFixed(3),
                distancesAfterSpline[i].toFixed(3),
                dbOriginalAfterSpline[i],
                potTxEstimatedAfterSpline[i],
                potDbScalAfterSpline[i],
                potPredictedAfterSpline[i]
            ])
        ];

        // Crear un libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Crear hojas para cada tabla
        const ws1 = XLSX.utils.aoa_to_sheet(table1);
        const ws2 = XLSX.utils.aoa_to_sheet(table2);
        
        // Agregar hojas al libro
        XLSX.utils.book_append_sheet(wb, ws1, "Tabla 1");
        XLSX.utils.book_append_sheet(wb, ws2, "Tabla 2");

        // Escribir el archivo
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // Guardar el archivo con FileSaver
        const file = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(file, "datos.xlsx");
    };

        //? PDF ///////////////////////
        const plotRef1 = useRef(null);
        const plotRef2 = useRef(null);
        const exportToPDF = async () => {
            const doc = new jsPDF();
    
            // Configuración del título
            const title = "Reporte de Datos";
            doc.setFontSize(16);
        
            // Obtener el ancho de la página
            const pageWidth = doc.internal.pageSize.getWidth();
        
            // Calcular el ancho del texto
            const textWidth = doc.getTextWidth(title);
        
            // Calcular la posición X para centrar
            const x = (pageWidth - textWidth) / 2;
        
            // Dibujar el título centrado
            doc.text(title, x, 15);
        // Obtener fecha actual en formato legible
            const fechaActual = new Date().toLocaleDateString();

            // Datos para la tabla
            const data = [
                ["Fecha", fechaActual],
                ["Frecuencia (MHz)", frequency],  // Ejemplo de frecuencia en Hz
                ["Número de Muestras", "1500"],
                ["Latitud de Origen", latOrigen],
                ["Longitud de Origen", lonOrigen],
            ];

            // Configuración de la tabla
            autoTable(doc, {
                startY: 25, // Posición después del título
                head: [["Parámetro", "Valor"]],
                body: data,
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 1.5 },
                rowStyles: { minCellHeight: 5 } // Reducir la altura de las filas
            });
             // Obtener la posición final de la tabla


            let currentY = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(13);
            doc.text("Diagrama de radiación 1 + data:", 10, currentY);
            
            currentY += 5; // Espacio después del texto
            // Convertir el primer gráfico a imagen
            if (plotRef1.current) {
                const canvas1 = await html2canvas(plotRef1.current);
                const imgData1 = canvas1.toDataURL("image/png");
                const imgWidth = 140; // Ancho fijo en el PDF
                const aspectRatio = canvas1.height / canvas1.width;
                const imgHeight = imgWidth * aspectRatio; // Mantener relación de aspecto
                console.log('Image 1 height:',imgHeight)
                const pdfWidth = doc.internal.pageSize.width;
                const xPosition = (pdfWidth - imgWidth) / 2; // Centrar horizontalmente
            
                doc.addImage(imgData1, "PNG", xPosition, currentY, imgWidth, imgHeight);
                currentY += imgHeight+1; // Ajustar para el siguiente gráfico
            }

            // Datos de la primera tabla
            const table1Columns = ['Sample', 'Theta (°)', 'Dist. Original', 'Pot. Medida', 'Pot. Estimada en Origen', `Pot. Escalada (a ${maxDistance}m)`, 'PotPredicted'];
            const table1Rows = theta.map((_, i) => [
                i,
                theta[i].toFixed(3),
                distances[i].toFixed(3),
                dbOriginal[i],
                potTxEstimated[i],
                potDbScal[i],
                dbPrediction[i]
            ]);
    
            doc.autoTable({
                startY: currentY,
                head: [table1Columns],
                body: table1Rows,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 1.5 }, // Reduce el espacio dentro de las celdas
                headStyles: { fillColor: [41, 128, 185] }, // Azul
                rowStyles: { minCellHeight: 5 } // Reducir la altura de las filas
            });
    
            currentY = doc.lastAutoTable.finalY + 20; // Espacio después de la primera tabla

        // Agregar un salto de página si es necesario
        if (currentY + 100 > doc.internal.pageSize.height) {
            doc.addPage();
            currentY = 20; // Reiniciar la posición en la nueva página
        }

        // GRAFICO 2

        doc.setFontSize(13);
        doc.text("Diagrama de radiación 2 + data interpolada:", doc.internal.pageSize.width / 2, currentY, { align: "right" });
        currentY += 5; // Espacio después del texto
        
        // Convertir el segundo gráfico a imagen
        if (plotRef2.current) {
            const canvas2 = await html2canvas(plotRef2.current);
            const imgData2 = canvas2.toDataURL("image/png");
            const imgWidth2 = 140; // Ancho fijo en el PDF
            const aspectRatio = canvas2.height / canvas2.width;
            const imgHeight2 = imgWidth2 * aspectRatio; // Mantener relación de aspecto
            console.log('Image 1 height:',imgHeight2)
            const pdfWidth = doc.internal.pageSize.width;
            const xPosition = (pdfWidth - imgWidth2) / 2; // Centrar horizontalmente
            doc.addImage(imgData2, "PNG", xPosition, currentY, imgWidth2, imgHeight2);
            currentY += imgHeight2+1; // Ajustar la posición
        }

            // Agregar un salto de página si es necesario
            if (currentY + 40 > doc.internal.pageSize.height) {
                doc.addPage();
                currentY = 20;
            }
            // Datos de la segunda tabla
            const table2Columns = ['Sample', 'Theta (°)', 'Dist. Original', 'Pot. Medida', 'Pot. Estimada en Origen', `Pot. Escalada (${maxDistance}m)`, 'PotPredicted'];
            const table2Rows = thetaAfterSpline.map((_, i) => [
                i,
                thetaAfterSpline[i].toFixed(3),
                distancesAfterSpline[i].toFixed(3),
                dbOriginalAfterSpline[i],
                potTxEstimatedAfterSpline[i],
                potDbScalAfterSpline[i],
                potPredictedAfterSpline[i]
            ]);
    
            doc.autoTable({
                startY: currentY,
                head: [table2Columns],
                body: table2Rows,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 1.5 }, // Reduce el espacio dentro de las celdas
                headStyles: { fillColor: [231, 76, 60] }, // Rojo
                rowStyles: { minCellHeight: 5 } // Reducir la altura de las filas
            });
    
            doc.save("Reporte.pdf");
        };

    return(
        <div id='Home'>
            <div id='title'>
        Graficador polar de diagrama de radiación
            </div>
        
        <div id='HomeContainer'>
            <div className='firstRowParent'>
            <div className='FirstRowContainer'>

                <div className='optionsCointainer'>
                    <div className='uploader1'>
                        <h3>IMPORTAR CSV PARA ANÁLISIS:</h3>
                        <input type='file' name ='file' accept='.csv' onChange={handleFileChange} className='inputFile'></input>    
                    </div>
                    <div className='freqContainer'>
                        <h3>FRECUENCIA DETECTADA: </h3>
                        <h3>{frequency ? `${frequency} MHz` : '-'}</h3>

                    </div>
                    {staticCsv && <h3 className='staticCSVText'> Muestras tomadas a una misma distancia (radio) y ángulos (theta) equidistantes </h3>}

                    <div className='propagationBox'>
                        <h3>MODELO DE PROPAGACIÓN:</h3>
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
                    <div>
        {/* Botón para exportar */}
        <h3>EXPORTAR RESULTADOS:</h3>
        <div className='exportBox'>
            <button className='excelButton' onClick={exportToExcel}>Exportar a Excel</button>

            <button onClick={exportToPDF}>Exportar a PDF</button>
        </div>
        
        
    </div>
                </div>
                
            </div>
                <div className='secondRowContainer'>
                <div className='predictionBox'>
                        <h3>ESTIMACIÓN </h3>
                        <div className='selectModelPropagation'>
                        
                        <h4>Seleccione un modelo de propagación: </h4>
                        <div>
                            <label>
                                <input type="radio" name="predictionOption" value="1" onChange={() => {setMinDistancePrediction(0); setDistanceToScal(0); setSelectedModelPrediction(0); }} checked={selectedModelPrediction === 0}/>
                                FSPL
                            </label>
                            <label>
                                <input type="radio" name="predictionOption" value="2" onChange={() => {setMinDistancePrediction(1000); setDistanceToScal(1000); setSelectedModelPrediction(1); }} checked={selectedModelPrediction === 1}/>
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
                        {okumuraReadyPrediction && <h3 className='successMessage'>Datos para predicción válidos</h3>}
                        <button className='applyOkumuraButton' onClick={handleApplyPrediction}> Confirmar datos para Modelo de predicción</button>
                    </div>}
                        <div>
                            <label>Ingrese una distancia de estimación (m):</label>
                            <input type='range' name='distancia' min={minDistancePrediction} max={maxDistancePrediction} step='0.5' value={distanceToScal} onChange={handleSliderChange} id='slideInput'></input>
                            <input type='textbox' id='inputTextBox' min={minDistancePrediction} max={maxDistancePrediction} value={distanceToScal} onChange={handleTextBoxChange}></input>
                             {` m. `} 
                            <button id='predictionButton' onClick={handlePredictionClick}>APLICAR</button>
                        </div>
                        
                    </div>
                    <div className='interpolationBox'>
                        <div className='interpolationEnableBox'>
                            <h3 >INTERPOLACIÓN</h3>
                            {/* <label className="toggleSwitch">
                                <input type="checkbox" id="interpolationCheck" checked={interEnabled} onChange={handleCheckboxChange}/>
                                <span className="slider"></span>
                            </label> */}
                        </div>
                        
                                <div className='interpolationPointsBox'>
                                    Puntos de interpolación deseados:
                                    <input id='interpolationPoints' type="number" onChange={handleInputInterpolChange}/>
                                </div>
                                <button id='interpolButton' onClick={handleApplyInterpol}>Aplicar Interpolación </button>
                        
                    </div>
                </div>
            </div>
            <div className='tablesContainer' >

            
                <div className='tableContainer' >
                    <div className='graphContainer' ref={plotRef1}>
                        <Plot
                        id="chart"
                        data={data}
                        layout={layout}
                        config={{ 
                            responsive: true,
                            useResizeHandler: true,
                            scrollZoom: true, // Permite zoom con la rueda del ratón
                            displayModeBar: true, // Muestra la barra de herramientas
                            editable: true, // Permite editar el gráfico
                        }}
                        className="plotChart"
                        />
                </div>

                    <div className='dbMaxMinInfoContainer'> 
                        <div className='dbMaxMinInfoRow'><h3>{'Valor máximo de pot:'}&nbsp;</h3> <h3>{` ${maxPot} @ ${maxTheta}°`}</h3></div>
                        <div className='dbMaxMinInfoRow'><h3>{'Valor mínimo de pot:'}&nbsp;</h3> <h3>{` ${minPot} @ ${minTheta}°`}</h3></div>
                    </div>
                    <table className='dataTable'>
                        <thead>
                            <th>Sample</th>
                            <th>Theta (°)</th>
                            <th>Dist. Original</th>
                            <th>Pot. Medida</th>
                            <th>Pot. Estimada en Origen</th>
                            <th>Potencia Escalada en Distancia. Maxima: {`${maxDistance} metros`}</th>
                            <th>PotPredicted</th>

                        </thead>
                        <tbody> 
                            {theta&&theta.map((column,i)=>{
                                return( 
                                <tr key={i}>
                                    <td>{i}</td>
                                    <td>{theta[i].toFixed(3)}</td> 
                                    <td>{distances[i].toFixed(3)}</td> 
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
                <div className='tableContainer' >
                    <div className='graphContainer' ref={plotRef2}>
                        <Plot
                            id='chart2'
                            
                            data={dataSpline}
                            layout={layout}
                            config={{ responsive: true, useResizeHandler:true }}
                            useResizeHandler={true}
                            className='plotChart'
                        />
                    </div>
                    <div className='dbMaxMinInfoContainer'> 
                        <div className='dbMaxMinInfoRow'><h3>{'Valor máximo de pot:'}&nbsp;</h3> <h3>{` ${maxPotAfterSpline} @ ${maxThetaAfterSpline}°`}</h3></div>
                        <div className='dbMaxMinInfoRow'><h3>{'Valor mínimo de pot:'}&nbsp;</h3> <h3>{` ${minPotAfterSpline} @ ${minThetaAfterSpline}°`}</h3></div>
                    </div>
                    <table className='dataTable'>
                            <thead>
                                <th>Sample</th>
                                <th>Theta (°)</th>
                                <th>Dist. Original</th>
                                <th>Pot. Medida</th>
                                <th>Pot. Estimada en Origen</th>
                                <th>Potencia Escalada en Distancia. Maxima: {`${maxDistance} metros`}</th>
                                <th>PotPredicted</th>

                            </thead>
                            <tbody> 
                                {thetaAfterSpline&&thetaAfterSpline.map((column,i)=>{
                                    return( 
                                    <tr key={i}>
                                        <td>{i}</td>
                                        <td>{thetaAfterSpline[i].toFixed(3)}</td> 
                                        <td>{distancesAfterSpline[i].toFixed(3)}</td> 
                                        <td>{dbOriginalAfterSpline[i]}</td> 
                                        <td>{potTxEstimatedAfterSpline[i]}</td>
                                        <td>{potDbScalAfterSpline[i]}</td> 
                                        <td>{potPredictedAfterSpline[i]}</td> 
                                    </tr>
                                    )
                                })}

                            </tbody>
                        </table>
                    </div>
               </div>
            </div>
            {okumuraErrorFlag && <ErrorModal errorFlag={okumuraErrorFlag} message="Verificar los datos del modelo de Okumura" setErrorFlag={SetokumuraErrorFlag}/>}
            {okumuraErrorFlagPrediction && <ErrorModal errorFlag={okumuraErrorFlagPrediction} message="Verificar datos para Predicción" setErrorFlag={SetokumuraErrorFlagPrediction}/>}
        </div>
    )
}
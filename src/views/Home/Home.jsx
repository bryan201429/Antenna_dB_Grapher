import './Home.css'
import { useEffect, useState } from 'react';
import React from 'react';
import Plot from 'react-plotly.js';

export default function Home(){
    const [dataCSV,setDataCSV]=useState(); 
    const [headers,setHeaders]=useState(null);
    const [theta,setTheta]=useState([]);
    const [dbOriginal,setDbOriginal]=useState([]);
    const [potDbScal,setPotDbScal]=useState([]);
    const [dbPrediction,setDbPrediction]=useState([]);
    const [distances,setDistances]=useState([]);
    const [maxPotForScale,setMaxPotForScale]=useState(20);
    const [minPotForScale,setMinPotForScale]=useState(-20);
    const [maxDistance,setMaxDistance]=useState(0);
    const [distanceToScal,setDistanceToScal]=useState(0);
    const [selectedModel,setSelectedModel]=useState(0);
    const [okumuraSettingsVisibility,setOkumuraSettingsVisibility]=useState(false); //Visibilidad de ajustes para Modelo Okumura
    const [okumuraValidInputs,setOkumuraValidInputs] = useState({txHeight: true, rxHeight: true, citySize:true, areaType:true})
    const [okumuraValueInputs,setOkumuraValueInputs] = useState({txHeight: undefined, rxHeight: undefined, citySize:undefined, areaType:undefined})
    const c=2.99792458e8;
    const [frequency,setFrequency]=useState(3e6);
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
    //! ///////////////////// OKUMURA INPUTS ////////////////////

        const txAntennaChange = (e)=>{
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
            setOkumuraValidInputs((prev)=>({...prev, citySize:true}))
            setOkumuraValueInputs((prev)=>({...prev, citySize:option}))
        }
        const areaTypeChange = (option)=>{
            setOkumuraValidInputs((prev)=>({...prev, areaType:true}))
                console.log('option de areatyyoe:',option)
            setOkumuraValueInputs((prev)=>({...prev, areaType: prev.areaType == option ? undefined : option,}))
        }


    
        useEffect(()=>{
            console.log({okumuraValueInputs})
        },[okumuraValueInputs])

    //! /////////////////////////// Predicción //////////////////
    const handlePredictionClick=()=>{                               

        let angs=theta;
        let pots=potDbScal;
        let distPrediction=distanceToScal;
        // pots=pots.map(el=>{return el+10})
        
         let FSPL=0;

         pots = pots.map((pot) => {
            let FSPL;
            console.log('Calculando minimo:',Math.abs(distPrediction-maxDistance),'Bajo: ',(c/frequency)/(4 * Math.PI ))

            if(selectedModel===0){
                if(Math.abs(distPrediction-maxDistance) < (c/frequency)/(4 * Math.PI )){
                    pot=pot;
                }
                else if (distPrediction > maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(distPrediction-maxDistance)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('FSPL MAYOR: ',20 * Math.log10(Math.abs(distPrediction-maxDistance)),' cte: ',20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c))
                    // console.log('MAYOR', 'distPrediction>maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot-FSPL);
                    pot = pot - (FSPL);
                } else if (distPrediction < maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(maxDistance-distPrediction)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('FSPL MENOR: ',20 * Math.log10(distPrediction/maxDistance),' cte: ',20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c));
                    // console.log('MENOR', 'distPrediction<maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot+FSPL);
                    pot = pot + FSPL;
                }
            }
            else if(selectedModel===1){
                if(Math.abs(distPrediction-maxDistance) < (c/frequency)/(4 * Math.PI )){
                    pot=pot;
                }
                else if (distPrediction > maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(distPrediction-maxDistance)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('FSPL MAYOR: ',20 * Math.log10(Math.abs(distPrediction-maxDistance)),' cte: ',20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c))
                    // console.log('MAYOR', 'distPrediction>maxDistance: Pot=', pot, ' FSPL: ', FSPL, ' maxDistance: ', maxDistance, ' distPrediction: ', distPrediction,'potPredicted: ', pot-FSPL);
                    pot = pot;
                } else if (distPrediction < maxDistance) {
                    FSPL = 20 * Math.log10(Math.abs(maxDistance-distPrediction)) + 20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c);
                    // console.log('FSPL MENOR: ',20 * Math.log10(distPrediction/maxDistance),' cte: ',20 * Math.log10(frequency) + 20 * Math.log10(4 * Math.PI / c));
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
            
            for(let x=1;x<csvDataLong;x++){
                console.log("Fila:", rows[x]);
                pot[x-1]=parseFloat(rows[x][0]);
                lat[x-1]=rows[x][1];
                lon[x-1]=rows[x][2];
                alt[x-1]=rows[x][3];
                freq[x-1]=rows[x][4];
            }
            if(freq){
                console.log('Frecuencia detectada:', freq[0])
                setFrequency(freq[0])
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
            let listaDbOrig = pot;
            let distmax=0;

            for(let x=0;x<csvDataLong-1;x++){ //Hallar distancia más lejana
                if(dist[x]>distmax){
                    distmax=dist[x];
                    setMaxDistance(dist[x]);
                }
            }
            

            //! Escalar los demás valores al de distancia máxima :Hallar potencia en transmisor :Potenciatx = Potrx + PathLoss
            setDbOriginal(pot);  //Guardar la pot original sin escalar

            if(selectedModel===0){
                for (let x = 0; x < csvDataLong-1; x++) {
                    if (dist[x] == distmax) {
                        listadbscal[x] = pot[x];
                    }
                    else if(Math.abs(distmax-dist[x]) < (c/frequency)/(4 * Math.PI )){
                         listadbscal[x] = pot[x];
                    }
                    else if (dist[x]<distmax) {
                        let FSPL=(20*Math.log10(Math.abs(distmax-dist[x])))+(20*Math.log10(frequency))+(20*Math.log10(4 * Math.PI / c));
                        listadbscal[x] =  pot[x]-FSPL;
                    }
                }		
            }
            else if(selectedModel===1){
                for (let x = 0; x < csvDataLong-1; x++) {

                    // let L=(69.55 + 26.16*(20*Math.log10(frequency)) - 13.82*Math.log10(hb) - ahm + [44.9-6.55*Math.log10(hb)]*Math.log10(Math.abs(distmax-dist[x])));
                    // listadbscal[x] = pot[x] - L ;
                    listadbscal[x] = pot[x] ;

                }		
            }
            
           
            // console.log('Lista dist PREV:',dist);
            // console.log('Lista db PREV',pot);
            // console.log('Lista db escalados PREV',listadbscal);
            // console.log('Angulos NO ordenados: ',ang);

        //! ///////////////////////// ORDENAR ARRAYS SEGUN ANGULOS DE FORMA ASCENDENTE /////////////////////////////////////

            menor = 1000;
            let dbScalTemp = 0;
            let distTemp = 0;
            let potTemp = 0;

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

                distTemp = dist[j];
                dist[j] = dist[menorpos];
                dist[menorpos] = distTemp;

                potTemp = listaDbOrig[j];
                listaDbOrig[j] = listaDbOrig[menorpos];
                listaDbOrig[menorpos] = potTemp;

                menor = 1000;
            }
            console.log('Angulos ordenados: ',ang);
            console.log('Lista dist:',dist);
            console.log('Lista db escalados',listadbscal);
            console.log('Lista db origin',listadbscal);
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
    },[dataCSV,selectedModel])



useEffect(()=>{
    console.log(selectedModel)
    if(selectedModel==1){
        setOkumuraSettingsVisibility(true);
    }
    else{
        setOkumuraSettingsVisibility(false);
    } 
},[selectedModel])

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
                        <h3>{`${frequency} Hz`}</h3>
                    </div>
                    <div className='propagationBox'>
                        <h3>Modelo de propagación</h3>
                        <div className='selectModelPropagation'>
                            <h4>Seleccione un modelo de propagación: </h4>
                            <div>
                                <label>
                                    <input type="radio" name="opcion" value="1" onChange={() => {setSelectedModel(0); handlePredictionClick}} checked={selectedModel === 0}/>
                                    FSPL
                                </label>
                                <label>
                                    <input type="radio" name="opcion" value="2" onChange={() => {setSelectedModel(1); handlePredictionClick}} checked={selectedModel === 1}/>
                                    Okumura-Hata
                                </label>
                            </div>
                         </div>
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
                            <button className='applyOkumuraButton'> Aplicar Modelo</button>
                        </div>}
                    </div>
                    <div className='predictionBox'>
                        <h3>Predicción</h3>
                        <div>
                            <label>Ingrese una distancia de estimación (m):</label>
                            <input type='range' name='distancia' min={0} max='300' step='0.5' onChange={handleSliderChange} id='slideInput'></input>
                            <input type='textbox' id='inputTextBox' min={0} max='300' onChange={handleTextBoxChange}></input>
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
                            <th>Pot. Original</th>
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
                                    <td>{potDbScal[i]}</td> 
                                    <td>{dbPrediction[i]}</td> 
                                </tr>
                                )
                            })}

                        </tbody>
                    </table>
        
                </div>
               </div>

        </div>
    )
}
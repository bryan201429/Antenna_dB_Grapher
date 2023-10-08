import './Home.css'
import { useEffect, useState } from 'react';
import React from 'react';
import Plot from 'react-plotly.js';
import background from '../../assets/waves.jpeg'

export default function Home(){
    const [dataCSV,setDataCSV]=useState(); 
    const [headers,setHeaders]=useState(null);
    const [theta,setTheta]=useState([]);
    const [potDbScal,setPotDbScal]=useState([]);
    const [distances,setDistances]=useState([]);
    const [data,setData]=useState([
            {
                type: 'scatterpolar',
                r: [],
                theta: [],
                fill: 'toself'
            }
        ]);
    // const data = [
    //     {
    //         type: 'scatterpolar',
    //         r: [1, 2, 3, 4],
    //         theta: [0, 45.999999988888, 90, 180],
    //         fill: 'toself'
    //     }
    // ];
    const layout = {
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 50]  // Rango del eje radial
            }
        },
        showlegend: false,
        width:500,
        height:500,
    };

    const handleFileChange= async(e)=>{
        if(e.target.files){
            try{
                const file = e.target.files[0];

                // 1. create url from the file
                const fileUrl = URL.createObjectURL(file);
        
                // 2. use fetch API to read the file
                const response = await fetch(fileUrl);
                   // 3. get the text from the response
                const text = await response.text();

                // 4. split the text by newline
                const lines = text.split("\n");
                setDataCSV( lines.map((line) => line.split(","))); // Array de arrays
                
            }
            catch(error){console.log(error)}
            
        }
        
        
    }

    useEffect(()=>{
        
        if(dataCSV){
            // console.log(dataCSV);
            // const headers = dataCSV[0];
            setHeaders(dataCSV[0]);
            const rows = dataCSV.slice(1);
            // console.log('rows sin headers',rows)
            const csvDataLong=rows.length;
            let temporal=0;
            let menor=0;
            let menorpos=0;

            let dist=[];
            let ang=[];
            let angInt=[];

            let pot=[];
            let lat=[];
            let lon=[];
            let alt=[];
            
            for(let x=0;x<csvDataLong;x++){
                pot[x]=parseInt(rows[x][0]);
                lat[x]=rows[x][1];
                lon[x]=rows[x][2];
                alt[x]=rows[x][3];
                // console.log(pot[x]);
            }

            let lat1 = -16.41750065976074; lat1 = lat1 * 3.1415926 / 180
            let lon1 = -71.54966328952415; lon1 = lon1 * 3.1415926 / 180;

            for(let x=0;x<csvDataLong;x++){
                let lat2=lat[x] * 3.1415926 / 180;
                let lon2=lon[x] * 3.1415926 / 180;
                
                let dlon=lon2-lon1;
                let dlat=lat2-lat1;

                let a=Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(lon1)*Math.cos(lon2)*Math.sin(dlon/2)*Math.sin(dlon/2);
            
                let c = 2 * Math.atan2(Math.sqrt(Math.abs(a)), Math.sqrt(1 - a));
                let Base=6371*c*1000;

                let Bearing = Math.atan2(Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1),Math.sin(lon2-lon1)*Math.cos(lat2));
                Bearing=((Bearing * 180 / Math.PI + 360) % 360);

                dist[x]=Base;
                ang[x]=Bearing;
                console.log('------x es: ---', x);
                console.log('Potencia: ',pot[x]);
                console.log('Distancia: ',dist[x]);
                console.log('Bearing: ',ang[x]);
            }
            //! //////////// REDIMENSIONADO DE POTENCIA PARA GRAFICAR ///////////////////////
            
            let listadbscal = [];    //Guardará los valores de db escalados

            let distmax=0;

            for(let x=0;x<csvDataLong;x++){ //Hallar distancia más lejana
                if(dist[x]>distmax){
                    distmax=dist[x];
                }
            }
            // console.log('La dist max es: ', distmax);
            //Escalar los demás valores al de distancia máxima :
            //Hallar potencia en transmisor :
            //Potenciatx = Potrx + PathLoss
            
            for (let x = 0; x < csvDataLong; x++) {
                if (dist[x] == distmax) {
                    listadbscal[x] = pot[x];
                }
                else if (dist[x]<distmax) {
                    // listadbscal[x] = pot[x] + (20 * Math.log10(distmax)) - (20 * Math.log10(dist[x]));
                    listadbscal[x] =  pot[x]+(20 * Math.log10(distmax))-(20*Math.log10(dist[x]));
                    // console.log('listadbscal[]','x',x,':',listadbscal[x],'y pot[];',pot[x])
                    
                }
            }		


            
            // console.log('Lista dist PREV:',dist);
            // console.log('Lista db PREV',pot);
            // console.log('Lista db escalados PREV',listadbscal);
            // console.log('Angulos NO ordenados: ',ang);

        //! ///////////////////////// ORDENAR ARRAYS SEGUN ANGULOS DE FORMA ASCENDENTE /////////////////////////////////////

            menor=1000;
            let dbscaltemp=0;
            let disttemp=0;
            let iter=0;

            for(let iter=0; iter<csvDataLong-1;iter++){ // Recorre el array incrementando el indice de inicio cada vez (el indice menor tiene el numero menor)
                for(let x=iter;x<csvDataLong;x++){
                    if(ang[x]<menor){
                        menor=ang[x];
                        menorpos=x;
                    }    
                }
                temporal=ang[iter];
                ang[iter]=menor;        // Se asigna el valor menor a la posicion 0 del array
                ang[menorpos]=temporal; //Se intercambia el menor valor 

                dbscaltemp = listadbscal[iter];
                listadbscal[iter] = listadbscal[menorpos];
                listadbscal[menorpos] = dbscaltemp;

                disttemp = dist[iter];
                dist[iter] = dist[menorpos];
                dist[menorpos] = disttemp;
                menor = 1000;
            }
            console.log('Angulos ordenados: ',ang);
            console.log('Lista dist:',dist);
            console.log('Lista db escalados',listadbscal);
            setTheta(ang);
            setPotDbScal(listadbscal);
            setDistances(dist);

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
    },[dataCSV])

    return(
        <div id='Home'>
            <div id='title'>
        <h1>Graficador Polar</h1>
            </div>
        
        <div id='HomeContainer'>
            
            <div className='ChartContainer'>
               
                <Plot
                    data={data}
                    layout={layout}
                    config={{ responsive: true }}
                    className='plotChart'
                />
            </div>
            

        <div className='tableContainer'>
            <table className='dataTable'>
                <thead>
                    {/* <tr>
                        {headers&& headers.map((header,i)=>{    
                            return <th key={i}>{header}</th>
                        })}
                    </tr> */}
                    <th>Sample</th>
                    <th>Theta</th>
                    <th>Pot</th>
                    <th>Dist</th>

                </thead>
                <tbody> 
                    {theta&&theta.map((column,i)=>{
                        return <tr> <td>{i}</td><td>{theta[i]}</td> <td>{potDbScal[i]}</td> <td>{distances[i]}</td> </tr>
                    })}

                </tbody>
            </table>
    
            </div>
               </div>
               <input type='file' accept='.csv' onChange={handleFileChange} className='inputFile'></input>
        </div>
    )
}
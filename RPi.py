import serial
import time
import string
import pynmea2
from csv import DictWriter

import datetime
from pylab import *
from rtlsdr import *
from matplotlib.pyplot import *
import math
import numpy as np
import os 

np.set_printoptions(threshold=np.inf)
sdr = RtlSdr()

sdr.sample_rate = 2.4e6 # configure device
sdr.center_freq = 102.3e6
freqMhz=sdr.center_freq/1e6
sdr.gain = 0
sdr.set_bandwidth(2.5e3)
#cant_muestras=128*1024
cant_muestras=2*1024
muestras=10
db_samples=[0]*muestras
promedio=0
positionlock=0
entrada=0
bucle=True
createNewCsv = False
csvContinuidad = 5

def frange(start, stop, step):
    """Genera un rango con pasos flotantes."""
    while start < stop:
        yield start
        start += step
		
while bucle==True:
	entrada=input("Ingrese una opcion: Bucle(0) | Medicion individual (1) | Medicion en un mismo radio  (2) | Salir (3): ")

	if entrada=="0":
		while True:
			positionlock=0
			while positionlock==0:
				port="/dev/ttyAMA0"
				ser=serial.Serial(port, baudrate=9600, timeout=0.1)
				dataout = pynmea2.NMEAStreamReader()
				newdata=ser.readline()
			#print(newdata)
				snewdata=str(newdata, 'utf-8',errors="ignore")
			#print(snewdata)

				if "GNGGA" in snewdata:
					print('ok')
					newmsg=pynmea2.parse(snewdata)
					lat=newmsg.latitude                #DECLARACION LATITUD
					lng=newmsg.longitude               #DECLARACION LONGITUD
					altitud=newmsg.altitude
					gps = "Latitude=" + str(lat) + " and Longitude=" + str(lng)+", Altitud:" +str(altitud) +" FREQ(HZ):"+str(sdr.center_freq)
					print(gps)
					positionlock=1
	
			for x in range (0,muestras):
				samples = sdr.read_samples(cant_muestras)
				potencia = np.mean(np.abs(samples)**2)
				pot_db = 10*np.log10(potencia)

				print('POTENCIA PROM DE MUESTRAS: ',pot_db)
				db_samples[x]=pot_db
				#print(db_samples[x])       #MUESTRAS OBTENIDAS

		##!###### ELIMINAR OUTLIERS ###########

			d = np.abs(db_samples-np.median(db_samples))
			mdev=np.median(d)
			s=d/(mdev if mdev else 1.)
			db_samples_not_outliers=[]
		
			for i in range (len(db_samples)):
				print(i)
				if s[i] <2:
					db_samples_not_outliers.append(db_samples[i])
			
				else:
					continue
        	#print("MUESTRAS ORIGINALES",db_samples)
        	#print("MUESTRAS SIN OUTLIERS",db_samples_not_outliers)

		##!############ PROMEDIO ##############
			for i in range (len(db_samples)):
				promedio=promedio+db_samples[i]
			promedio=promedio/muestras
        	#print(len(db_samples))
            #print('Promedio de mediciones ORIGINALES:', promedio)

			promedio=0

			for i in range (len(db_samples_not_outliers)):
				promedio=promedio+db_samples_not_outliers[i]

			promedio=promedio/len(db_samples_not_outliers)

			print('Promedio de mediciones SIN OUTLIERS:', promedio)

        	##!####CSV Escritura################
			if csvContinuidad != 0:
				fecha_hora_actual = datetime.datetime.now().strftime('%d-%m-%Y_%H_%M_%S')
				file_path = f'./measures/F_{freqMhz}_DATE_{fecha_hora_actual}_0.csv'
				
			elif csvContinuidad == 0:
				file_path = file_path

			csvContinuidad=0

			headersCSV = ['Potencia','Latitud','Longitud','Altura','Frequency']       #Lista de Columnas
			dict={'Potencia':promedio,'Latitud':lat,'Longitud':lng,'Altura':altitud,'Frequency':freqMhz}  #Data >
			mode = 'a' if os.path.exists(file_path) else 'w' # Modo de apertura 

			with open(file_path, mode, newline='') as f_object:   
				if os.path.getsize(file_path) == 0:
					dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
					dictwriter_object.writeheader()  # Escribir encabezados si está vacío
				dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
				dictwriter_object.writerow(dict)
				f_object.close()
		sdr.close()

	if entrada=="1":
		print("Se realizara medición")
		while positionlock==0:
			port="/dev/ttyAMA0"
			ser=serial.Serial(port, baudrate=9600, timeout=0.1)
			dataout = pynmea2.NMEAStreamReader()
			newdata=ser.readline()
			snewdata=str(newdata, 'utf-8',errors="ignore")
			# print(snewdata)

			if "GNGGA" in snewdata:
				print('gps data ok')
				newmsg=pynmea2.parse(snewdata)
				lat=newmsg.latitude		   #DECLARACION LATITUD
				lng=newmsg.longitude               #DECLARACION LONGITUD
				altitud=newmsg.altitude
				gps = "Latitude=" + str(lat) + " and Longitude=" + str(lng)+", Altitud:" +str(altitud) +" FREQ(HZ):"+str(sdr.center_freq)
				positionlock=1

		for x in range (0,muestras):
			samples = sdr.read_samples(cant_muestras)
		#	print('RAW SAMPLES',samples)
			potencia = np.mean(np.abs(samples)**2)
			pot_db = 10*np.log10(potencia)
			print('POTENCIA PROM DE MUESTRAS: ',pot_db)
			db_samples[x]=pot_db
#			print(db_samples[x])       #MUESTRAS OBTENIDAS
		print(db_samples)

	##!###### ELIMINAR OUTLIERS ###########

		d = np.abs(db_samples-np.median(db_samples))
	#print (d)
		mdev=np.median(d)
		s=d/(mdev if mdev else 1.)
	#print ("s=",s)
		db_samples_not_outliers=[]
		for i in range (len(db_samples)):
			if s[i] <2:
				db_samples_not_outliers.append(db_samples[i])
			else:
	        		continue
	#print("MUESTRAS ORIGINALES",db_samples)
	#print("MUESTRAS SIN OUTLIERS",db_samples_not_outliers)

	##!############ PROMEDIO ##############
		for i in range (len(db_samples)):
			promedio=promedio+db_samples[i]
		promedio=promedio/muestras
	#print(len(db_samples))
		#print('Promedio de mediciones ORIGINALES:', promedio)
		promedio=0
		for i in range (len(db_samples_not_outliers)):
			promedio=promedio+db_samples_not_outliers[i]
		promedio=promedio/len(db_samples_not_outliers)
	#print('Longitud de muestras sin outliers: ',len(db_samples_not_outliers))
		print('Promedio de mediciones SIN OUTLIERS:', promedio)
		#sdr.close()

	##!####CSV Escritura################
		if csvContinuidad != 1:
			fecha_hora_actual = datetime.datetime.now().strftime('%d-%m-%Y_%H_%M_%S')
			file_path = f'./measures/F_{freqMhz}_DATE_{fecha_hora_actual}_1.csv'
			
		elif csvContinuidad == 1:
			file_path = file_path

		csvContinuidad=1

		headersCSV = ['Potencia','Latitud','Longitud','Altura','Frequency']      #Lista de Columnas

		dict={'Potencia':promedio,'Latitud':lat,'Longitud':lng,'Altura':altitud,'Frequency':freqMhz}  #Data asignada al diccionario

		mode = 'a' if os.path.exists(file_path) else 'w' # Modo de apertura 
	#Debe estar cerrado el archivo .csv antes de correr el codigo
		with open(file_path, mode, newline='') as f_object:   #modo a de apendice
			if os.path.getsize(file_path) == 0:
				dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
				dictwriter_object.writeheader()  # Escribir encabezados si está vacío
			dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
			dictwriter_object.writerow(dict)
			f_object.close()



	if entrada == '2':
		grados = float(input("Ingrese cada cuantos grados (°) se hará la medición: "))
		array_grados = [round(i, 2) for i in frange(0, 360, grados)] 
		distStatic = input("Ingrese la distancia de la medición: ")
		fecha_hora_actual = datetime.datetime.now().strftime('%d-%m-%Y_%H_%M_%S')
		file_path = f'./measures/F_{freqMhz}_DATE_{fecha_hora_actual}_1.csv'
		for i, valor in enumerate(array_grados):  # 'i' será el índice, 'valor' será el valor del ángulo
		
			# print(f"Muestra {i + 1}: {valor}")
			input(f" Toma de muestra {i + 1} en {valor} °, presione una tecla para confirmar")
			for x in range (0,muestras):
				samples = sdr.read_samples(cant_muestras)
				potencia = np.mean(np.abs(samples)**2)
				pot_db = 10*np.log10(potencia)
				print('POTENCIA PROM DE MUESTRAS: ',pot_db)
				db_samples[x]=pot_db
			print(db_samples)

		##!###### ELIMINAR OUTLIERS ###########
			d = np.abs(db_samples-np.median(db_samples))
			mdev=np.median(d)
			s=d/(mdev if mdev else 1.)
			db_samples_not_outliers=[]
			for i in range (len(db_samples)):
				if s[i] <2:
					db_samples_not_outliers.append(db_samples[i])
				else:
					continue

		##!############ PROMEDIO ##############
			for i in range (len(db_samples)):
				promedio=promedio+db_samples[i]
			promedio=promedio/muestras
			promedio=0
			for i in range (len(db_samples_not_outliers)):
				promedio=promedio+db_samples_not_outliers[i]
			promedio=promedio/len(db_samples_not_outliers)
			print('Promedio de mediciones SIN OUTLIERS:', promedio)
			#sdr.close()

		##!####CSV Escritura################


			csvContinuidad=2

			headersCSV = ['Potencia','Grado','Distancia','Frequency']      #Lista de Columnas

			dict={'Potencia':promedio,'Grado':valor ,'Distancia':distStatic,'Frequency':freqMhz}  #Data asignada al diccionario

			mode = 'a' if os.path.exists(file_path) else 'w' # Modo de apertura 

			with open(file_path, mode, newline='') as f_object:   #modo a de apendice
				dictwriter_object = DictWriter(f_object, fieldnames=headersCSV)
				if os.path.getsize(file_path) == 0:
					dictwriter_object.writeheader()  # Escribir encabezados si está vacío

				dictwriter_object.writerow(dict)



	if  entrada=='3':
		bucle=0

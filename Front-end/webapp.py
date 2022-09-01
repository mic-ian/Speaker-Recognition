import os
import sys
import logging
from flask.helpers import url_for
from pydub import AudioSegment
from datetime import datetime as date
import json
# from waitress import serve

import numpy as np
import librosa
import soundfile as sf
from flask import Flask, render_template, request, Response, redirect

from preprocessing import extract_xvector
from preprocessing_fusion import extract_fusion

import preprocessing_fbanks as prep_old
import predictions_fbanks as pred_old

from predictions import get_embeddings, get_cosine_distance
from predictions_fusion import get_embeddings_fusion, get_cosine_distance

from datetime import datetime



app = Flask(__name__)

DATA_DIR = '/home/fusco/webapp/data_files/'
THRESHOLD = 0.50    # play with this value. you may get better results

sys.path.append('..')


@app.route('/')
def home():
    return render_template('index_refact.html')


@app.route('/registered/<string:username>', methods=['GET'])
def registered(username):
    return render_template('registered.html', username=username)


@app.route('/login/<string:username>', methods=['POST'])
def login(username):
    exists = _check_name(request, username)
    if not exists:
        return Response('USER_NOT_EXISTS', mimetype='application/json')


    filename = _save_file(request, username,10)
    vector_fusion = extract_fusion(filename)
    
    embeddings_fusion = get_embeddings_fusion(vector_fusion) 
      

    stored_embeddings_fusion = np.load(DATA_DIR + username + '/embeddings_fusion.npy')
    

    stored_embeddings_fusion = stored_embeddings_fusion.reshape((1, -1))



    distances_embed_fusion = get_cosine_distance(embeddings_fusion, stored_embeddings_fusion)

    print('mean distances embeddings_fusion', np.mean(distances_embed_fusion), flush=True)

    now = date.now()
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")



    with open(DATA_DIR + username + '/access.log',"a") as log:
        log.write("\nTentativo di accesso in data: " + dt_string+ "\n\n")
        log.write(request.user_agent.string)
        log.write('\n\nmean distances vector_fusion embeddings  ')
        log.write(str(np.mean(distances_embed_fusion)))
                
       
        if  distances_embed_fusion <= .20:
          log.write("\n\nRisultato Media Pesata: POSITIVO")
        else:
          log.write("\n\nRisultato Media Pesata: NEGATIVO")
        log.write("\n\n\n==========FINE===========\n\n\n")

    data_obj = {"vector_fusion embeddings" : str(np.mean(distances_embed_fusion))}
    data = json.dumps(data_obj)

    
    if distances_embed_fusion <= .20:
        return Response(data, 250, mimetype='application/json')
    else:
        return Response(data,status='FAILURE', mimetype='application/json')


@app.route('/register/<string:username>', methods=['POST', 'GET'])
def register(username):

    exists = _check_name(request, username)
    if not exists:
        filename = _save_file(request, username,15)
        
        vector_fusion = extract_fusion(filename)
        np.save(DATA_DIR + username +'/vector_fusion.npy', vector_fusion)
        
        embeddings_fusion = get_embeddings_fusion(vector_fusion)
       
        print('shape of embeddings_fusion: {}'.format(embeddings_fusion.shape), flush=True)
        
        mean_embeddings_fusion = np.mean(embeddings_fusion, axis=0)
        np.save(DATA_DIR + username + '/embeddings_fusion.npy', mean_embeddings_fusion)
        
        return Response('SUCCESS', mimetype='application/json')
    else:
        print("ELSE")
        return Response('USER_ALREADY_EXISTS', mimetype='application/json')


def _save_file(request_, username,duration):
    file = request_.files['file']
    dir_ = DATA_DIR + username
    if not os.path.exists(dir_):
        os.makedirs(dir_)

    now = datetime.now()
    os.environ["PATH"]= "/root/anaconda3/condabin:/usr/local/ffmpeg/bin:/sbin:/bin:/usr/sbin:/usr/bin:/var/lib/snapd/snap/bin:" + os.environ["PATH"]
    date_time = now.strftime("%d_%m_%Y_%H_%M_%S")
    filename = DATA_DIR + username + '/' + username + '_' + date_time + '.wav'
    file.save(filename)
    AudioSegment.from_wav(filename).export(filename.replace(".wav",".flac"), format="flac")
    os.remove(filename)
    #AudioSegment.from_mp3(filename.replace(".wav",".mp3")).export(filename.replace(".wav",".flac"), format="flac")
    #os.remove(filename.replace(".wav",".mp3"))
    filename=filename.replace(".wav",".flac")	
    #Read audio file to truncate
    #sfile = sf.SoundFile(filename, mode="r+")
    #sr = sfile.samplerate
    #Truncate audio to desired duration
    #sfile.truncate(duration*sr)  
    #sfile.close()
    return filename


def _check_name(request_, username):
    file = request_.files['file']
    dir_ = DATA_DIR + username
    if os.path.exists(dir_):
        print("User esiste")
        return True
    else:
        return False

@app.route('/check/<string:username>', methods=['POST', 'GET'])
def check(username):
    dir_ = DATA_DIR + username
    if os.path.exists(dir_):
        print("User esiste")
        return Response('USER_ALREADY_EXISTS', mimetype='application/json')
    else:
        return Response('USER_NOT_EXISTS', mimetype='application/json')

#if __name__ == '__main__':
 #  app.run(host = "0.0.0.0")
    #serve(app, host="0.0.0.0", port=7026, url_scheme="https")
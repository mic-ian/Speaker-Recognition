import os
import sys
import logging
from flask.helpers import url_for
from pydub import AudioSegment
from datetime import datetime as date
import json

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
from pathlib import Path



DATA_DIR = '/home/fusco/webapp/data_files/'

# user tenta di accedere ad user1
user = 'Sean-McKinley'
user1 = ['Denny-Sayers','Gord-Mackenzie','John-Gonzalez','R-Francis-Smith']
#user1 = ['giuseppemonda-pc','rocco-pc','ciro-pc','roberto-mac','marcosica-pc','feliceferrante-pc','luigicirillo-pc', 'lucarusso-pc','giovannitavolo-pc','giuseppemonda-cell','rocco-cell','ciro-cell','roberto-iphone','marcosica-cell','feliceferrante-cell','luigicirillo-cell', 'lucarusso-cell','giovannitavolo-cell']

def login():

    os.environ["PATH"]= "/root/anaconda3/condabin:/usr/local/ffmpeg/bin:/sbin:/bin:/usr/sbin:/usr/bin:/var/lib/snapd/snap/bin:" + os.environ["PATH"]

    dir_ = DATA_DIR + '/' + user + '/'
    files_iter = Path(dir_).glob('**/*.flac')
    files = [str(f) for f in files_iter]
    
    for f in files:
        #print(f)
        filename = f
        #AudioSegment.from_wav(filename).export(filename.replace(".wav",".flac"), format="flac")
        #filename=filename.replace(".wav",".flac")
        vector_fusion = extract_fusion(filename)
        embeddings_fusion = get_embeddings_fusion(vector_fusion)

        for u in user1:
            #vector_fusion = extract_fusion(filename)
            #embeddings_fusion = get_embeddings_fusion(vector_fusion)
            stored_embeddings_fusion = np.load(DATA_DIR + u + '/embeddings_fusion.npy')
            stored_embeddings_fusion = stored_embeddings_fusion.reshape((1, -1))
            distances_embed_fusion = get_cosine_distance(embeddings_fusion, stored_embeddings_fusion)
            print('mean distances embeddings_fusion', np.mean(distances_embed_fusion), flush=True)

            now = date.now()
            dt_string = now.strftime("%d/%m/%Y %H:%M:%S")

            with open(DATA_DIR + u + '/accessIncSean.log',"a") as log:
                log.write("\nTentativo di accesso in data: " + dt_string+ "\n\n")
                log.write('\n\nmean distances vector_fusion embeddings  ')
                log.write(str(np.mean(distances_embed_fusion)))

                if  distances_embed_fusion <= .20:
                  log.write("\n\nRisultato Media Pesata: POSITIVO")
                else:
                  log.write("\n\nRisultato Media Pesata: NEGATIVO")
                log.write("\n\n\n==========FINE===========\n\n\n")

        

    
    
def register():

        os.environ["PATH"]= "/root/anaconda3/condabin:/usr/local/ffmpeg/bin:/sbin:/bin:/usr/sbin:/usr/bin:/var/lib/snapd/snap/bin:" + os.environ["PATH"]

        filename = DATA_DIR + user + '/' + 'reg' + '.flac'

        #AudioSegment.from_wav(filename).export(filename.replace(".wav",".flac"), format="flac")
        #filename=filename.replace(".wav",".flac")
  
        vector_fusion = extract_fusion(filename)
        np.save(DATA_DIR + user +'/vector_fusion.npy', vector_fusion)

        embeddings_fusion = get_embeddings_fusion(vector_fusion)

        print('shape of embeddings_fusion: {}'.format(embeddings_fusion.shape), flush=True)

        mean_embeddings_fusion = np.mean(embeddings_fusion, axis=0)
        np.save(DATA_DIR + user + '/embeddings_fusion.npy', mean_embeddings_fusion)



login()
#register()









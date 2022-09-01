import os
import sys
import logging
from flask.helpers import url_for
from datetime import datetime as date
import json
# from waitress import serve

import numpy as np
from flask import Flask, render_template, request, Response, redirect

from preprocessing import extract_xvector
import preprocessing_fbanks as prep_old 
from predictions import get_embeddings, get_cosine_distance
import predictions_fbanks as pred_old


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


    filename = _save_file(request, username)
    xvector = extract_xvector(filename)
    fbanks = prep_old.extract_fbanks(filename)
    embeddings = get_embeddings(xvector)
    embeddings_fbanks = pred_old.get_embeddings(fbanks)
    stored_embeddings = np.load(DATA_DIR + username + '/embeddings.npy')
    stored_embeddings_fbanks = np.load(DATA_DIR + username + '/embeddings_fbanks.npy')
    stored_xvector = np.load(DATA_DIR + username + '/xvector.npy')
    stored_embeddings = stored_embeddings.reshape((1, -1))
    stored_embeddings_fbanks = stored_embeddings_fbanks.reshape((1, -1))


    distances_embed = get_cosine_distance(embeddings, stored_embeddings)
    distances_xvect = get_cosine_distance(xvector, stored_xvector)
    distances_embed_fbanks = get_cosine_distance(embeddings_fbanks, stored_embeddings_fbanks)
    positives = distances_embed_fbanks < THRESHOLD
    positives_mean = np.mean(positives)
    print('mean distances embeddings', np.mean(distances_embed), flush=True)
    print("mean distances xvector", np.mean(distances_xvect), flush=True)
    print('mean positives fbanks embeddings', positives_mean, flush=True)
    now = date.now()
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")

    media_pesata = (2 * np.mean(distances_embed) + np.mean(distances_xvect))/2

    with open(DATA_DIR + username + '/access.log',"a") as log:
        log.write("\nTentativo di accesso in data: " + dt_string+ "\n\n")
        log.write('mean distances xvector embeddings  ')
        log.write(str(np.mean(distances_embed)))
        log.write("\n\nmean distances xvector cosine ")
        log.write(str(np.mean(distances_xvect)))
        log.write("\n\nmean distances fbanks embeddings ")
        log.write(str(np.mean(distances_embed_fbanks)))
        log.write("\n\nmean POSITIVE distances fbanks embeddings ")
        log.write(str(positives_mean))
        log.write("\n\nmedia pesata siamese + cosine: ")
        log.write(str(media_pesata))
        if  media_pesata <= .295:
          log.write("\n\nRisultato Media Pesata: POSITIVO")
        else:
          log.write("\n\nRisultato Media Pesata: NEGATIVO")
        log.write("\n\n\n==========FINE===========\n\n\n")

    data_obj = {"xvector embeddings" : str(np.mean(distances_embed)),
            "xvector cosine" : str(np.mean(distances_xvect)),
            "fbanks Positive value" : str(positives_mean),
	    "pesata":str(media_pesata)}
    data = json.dumps(data_obj)

    
    if media_pesata <= .295:
        return Response(data, 250, mimetype='application/json')
    else:
        return Response(data,status='FAILURE', mimetype='application/json')


@app.route('/register/<string:username>', methods=['POST', 'GET'])
def register(username):

    exists = _check_name(request, username)
    if not exists:
        filename = _save_file(request, username)
        xvector = extract_xvector(filename)
        fbanks_old = prep_old.extract_fbanks(filename)
        np.save(DATA_DIR + username +'/xvector.npy', xvector)
        embeddings = get_embeddings(xvector)
        embeddings_fbanks = pred_old.get_embeddings(fbanks_old)
        print(embeddings, flush=True)
        mean_embeddings = np.mean(embeddings, axis=0)
        print(mean_embeddings, flush=True)
        print(embeddings.shape, flush=True)
        print(mean_embeddings.shape, flush=True)
        print(np.array_equal(embeddings, mean_embeddings, False),flush=True)
        mean_embeddings_old = np.mean(embeddings_fbanks, axis=0)
        np.save(DATA_DIR + username + '/embeddings.npy', mean_embeddings)
        np.save(DATA_DIR + username + '/embeddings_fbanks.npy', mean_embeddings_old)
        return Response('SUCCESS', mimetype='application/json')
    else:
        print("ELSE")
        return Response('USER_ALREADY_EXISTS', mimetype='application/json')


def _save_file(request_, username):
    file = request_.files['file']
    dir_ = DATA_DIR + username
    if not os.path.exists(dir_):
        os.makedirs(dir_)

    filename = DATA_DIR + username + '/sample.wav'
    file.save(filename)
    return filename


def _check_name(request_, username):
    file = request_.files['file']
    dir_ = DATA_DIR + username
    if os.path.exists(dir_):
        print("User esiste")
        return True
    else:
        return False


#if __name__ == '__main__':
 #  app.run(host = "0.0.0.0")
    #serve(app, host="0.0.0.0", port=7026, url_scheme="https")

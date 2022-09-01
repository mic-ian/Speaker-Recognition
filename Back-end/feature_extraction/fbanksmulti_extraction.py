import os
import re
from io import StringIO
from pathlib import Path

import numpy as np
import pandas as pd
import librosa
import subprocess as sub
import multiprocessing as mp

# pip install python_speech_features
import python_speech_features as psf

# Cambiare base path in accordo con il sistema
BASE_PATH = '/home/fusco/Speaker_Recognition/feature_extraction/LibriSpeech'
OUTPUT_PATH = 'fbanks'
np.random.seed(42)
subset = ''


def read_metadata():
    with open(BASE_PATH + '/SPEAKERS.TXT', 'r') as meta:
        data = meta.readlines()

    data = data[11:]
    data = ''.join(data)
    data = data[1:]
    data = re.sub(' +|', '', data)
    data = StringIO(data)

    speakers = pd.read_csv(data, sep='|', error_bad_lines=False)

    # This is using just the train clean 100 part. Update this line to extract from
    # train clean 360 or include both 100 and 360
    speakers_filtered = speakers[(speakers['SUBSET'] == 'train-clean-360')]
    #speakers_filtered1 = speakers[(speakers['SUBSET'] == 'train-clean-100')]
    speakers_filtered2 = speakers[(speakers['SUBSET'] == 'train-other-500')]
    #speakers_filtered= pd.concat([speakers_filtered1, speakers_filtered])
    speakers_filtered= pd.concat([speakers_filtered2, speakers_filtered])

    # Aggiunto per lavorare solo su train-clean-100 #########
    #speakers_filtered = speakers_filtered1
    #########################################################

    speakers_filtered = speakers_filtered.copy()
    speakers_filtered['LABEL'] = speakers_filtered['ID'].astype('category').cat.codes
    return speakers_filtered

# modificare con path allo sript
def get_xvector(audio_file):
    audio_dir = audio_file.rsplit('/', 1)[0]
    sub.call(
        "bash /home/fusco/webapp/ivector-xvector-master/xvector/enroll_mod_ciro.sh " + audio_file + " 1",
        shell=True, cwd=audio_dir)
    xvector = np.load(audio_dir + "/data_x/embeddings.npy")
    sub.call("rm -rf " + audio_dir + "/data_x", shell=True)

    sub.call(
        "bash /home/fusco/webapp/ivector-xvector-master/ivector/enroll_mod_mik.sh " + audio_file,
        shell=True, cwd=audio_dir)
    ivector = np.load(audio_dir + "/data/i_vector.npy")
    sub.call("rm -rf " + audio_dir + "/data", shell=True)
    # print("\nreshape",flush=True)

    ##### value = xvector[0:, 400:]  ERRORE DI LOGICA ########
    value = np.zeros((1,112)) #### da valutare con Rocco per errore di logica in media pesata se usiamo istruzione precedente a questa #####
    ivector = np.append(ivector, value, axis=1)

    return xvector * 0.4 + ivector * 0.6


def assert_out_dir_exists(index):
    dir_ = OUTPUT_PATH + '/' + str(index)

    if not os.path.exists(dir_):
        os.makedirs(dir_)
        print('crated dir {}'.format(dir_))
    else:
        print('dir {} already exists'.format(dir_))

    return dir_


def estrai(id):

    dir_ = BASE_PATH + '/' + str(id) + '/'
    index_target_dir = assert_out_dir_exists(id)

    files_iter = Path(dir_).glob('**/*.flac')
    files_ = [str(f) for f in files_iter]
    print('done for id: {},'.format(id))


    for i, f in enumerate(files_):
        fbanks = get_xvector(f)
        np.save(index_target_dir + '/' + str(i) + '.npy', fbanks)
        
    print('done for id: {},'.format(id))
    print('')



def main():
    speakers = read_metadata()

    print('read metadata from file, number of rows in in are: {}'.format(speakers.shape))
    print('numer of unique labels in the dataset is: {}'.format(speakers['LABEL'].unique().shape))
    print('max label in the dataset is: {}'.format(speakers['LABEL'].max()))
    print('number of unique index: {}, max index: {}'.format(speakers.index.shape, max(speakers.index)))

    lista_id = np.array([0])

    #CREO LA LISTA CON TUTTI GLI ID
    for index, row in speakers.iterrows():
        subset = row['SUBSET']
        id_ =subset +'/'+ str(row['ID'])
        lista_id = np.append(lista_id,id_)

    lista_id = np.delete(lista_id,0)
    print(lista_id)

    # CREO IL POOL
    p = mp.Pool(mp.cpu_count() - 1)
    async_result = p.map_async(estrai, lista_id)
    p.close()
    p.join()
    print('All done, YAY!, look at the files')



main()
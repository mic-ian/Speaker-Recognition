import librosa
import numpy as np
import python_speech_features as psf
import subprocess as sub
import os


def get_fbanks(audio_file):

    def normalize_frames(signal, epsilon=1e-12):
        return np.array([(v - np.mean(v)) / max(np.std(v), epsilon) for v in signal])

    y, sr = librosa.load(audio_file, sr=16000)
    assert sr == 16000

    trim_len = int(0.25 * sr)
    if y.shape[0] < 1 * sr:
        # if less than 1 seconds, don't use that audio
        return None

    # remove first 0.25s e last 0.25s of audio from y
    y = y[trim_len:-trim_len]

    # frame width of 25 ms with a stride of 15 ms. This will have an overlap of 10s
    filter_banks, energies = psf.fbank(y, samplerate=sr, nfilt=64, winlen=0.025, winstep=0.01)
    filter_banks = normalize_frames(signal=filter_banks)

    filter_banks = filter_banks.reshape((filter_banks.shape[0], 64, 1))

    return filter_banks


#modificare con path allo sript 
def get_xvector(audio_file):

    audio_dir = audio_file.rsplit('/',1)[0]
    my_env=os.environ.copy()
    my_env["PATH"]= "/root/anaconda3/condabin:/usr/local/ffmpeg/bin:/sbin:/bin:/usr/sbin:/usr/bin:/var/lib/snapd/snap/bin:" + my_env["PATH"]
    sub.call("/bin/bash /home/fusco/webapp/ivector-xvector-master/xvector/enroll_mod_ciro.sh "+audio_file+" 1",
              shell=True, executable="/bin/bash", env=my_env, cwd=audio_dir)
    xvector = np.load(audio_dir+"/data/embeddings.npy")
    sub.call("rm -rf "+ audio_dir + "/data",shell=True, executable="/bin/bash", env=my_env, cwd=audio_dir)

    xvector = xvector.reshape((1,xvector.shape[0],xvector.shape[1],1))
    return xvector

def extract_fbanks(path):
    fbanks = get_fbanks(path)
    num_frames = fbanks.shape[0]

    # sample sets of 64 frames each

    numpy_arrays = []
    start = 0
    while start < num_frames + 64:
        slice_ = fbanks[start:start + 64]
        if slice_ is not None and slice_.shape[0] == 64:
            assert slice_.shape[0] == 64
            assert slice_.shape[1] == 64
            assert slice_.shape[2] == 1

            slice_ = np.moveaxis(slice_, 2, 0)
            slice_ = slice_.reshape((1, 1, 64, 64))
            numpy_arrays.append(slice_)
        start = start + 64

    print('num samples extracted: {}'.format(len(numpy_arrays)))
    return np.concatenate(numpy_arrays, axis=0)
    return fbanks

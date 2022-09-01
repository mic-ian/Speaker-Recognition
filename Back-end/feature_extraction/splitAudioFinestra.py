from pydub import AudioSegment



class SplitWavAudioMubin():
    def __init__(self, folder, filename):
        self.folder = folder
        self.filename = filename
        self.filepath = folder + '/' + filename

        self.audio = AudioSegment.from_file(self.filepath , format='flac')


    def get_duration(self):
        return self.audio.duration_seconds

    def single_split(self, from_sec, to_sec, split_filename):
        t1 = from_sec * 1000
        t2 = to_sec * 1000
        split_audio = self.audio[t1:t2]
        split_audio.export(self.folder + '/' + split_filename, format="flac")

    def multiple_split(self, sec_per_split):
        total_sec = int(self.get_duration())
        for i in range(0, total_sec - sec_per_split + 1, 1):
            split_fn = str(i) + '_' + self.filename
            self.single_split(i, i + sec_per_split, split_fn)
            print(str(i) + ' Done')





def main():
    folder = '/home/fusco/Speaker_Recognition/feature_extraction/micheleSpkr'
    file = 'micheleiannucci.flac'
    split_wav = SplitWavAudioMubin(folder,file)
    split_wav.multiple_split(15)

if __name__ == '__main__':
    main()

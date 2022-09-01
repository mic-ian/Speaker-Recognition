var elems = document.getElementsByTagName('li');
var actionSelected = "login";


function assignActionValue(action){
    actionSelected = action;
    //console.log("Ora vale: ",actionSelected);
    console.log(navigator.userAgent);

    if( actionSelected == "login"){
        document.getElementById("action-label").innerHTML = "Inserisci il nome associato alla voce che vuoi riconoscere";
	document.getElementById("username").placeholder = "Usa ESCLUSIVAMENTE il tuo username";
	document.getElementById("email-validation").innerHTML = "Username non valido";
    }else{
        document.getElementById("action-label").innerHTML = "Inserisci il nome che vuoi associare alla voce";
        document.getElementById("username").placeholder = "Username";
	document.getElementById("email-validation").innerHTML = "Utente già esistente";

    }

    var actionSelect = actionSelected;
    actionSelect.onchange = loadWikiArticle;
}
function getActionSelected() {

    var action;
    Array.from(elems).forEach(v => v.addEventListener('click', function(){
        action = this.getAttribute("value");
        //console.log("Ho passato: ",action);
        assignActionValue(action);
        controlla(); //check username
    }));

}



//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
effect = document.getElementById("recEffectDiv");
getActionSelected();
var actionSelect = document.getElementById("action");
//var pauseButton = document.getElementById("pauseButton");

// Timer durata di registrazione
var seconds = 0;
var interval;


var submitButtClone = document.getElementById("submitButton").cloneNode(true);

//var leftchannel = [];
//var rightchannel = [];
//var recorder = null;
//var recordingLength = 0;
//var volume = null;
//var mediaStream = null;
//var sampleRate = 16000;
//var context = null;
var gBlob;
var filename;
var checkEvent=false;

//add events to those 2 buttons
recordButton.addEventListener("click", infoPopUp);

actionSelect.addEventListener("change",deleteList);
//pauseButton.addEventListener("click", pauseRecording);


function infoPopUp(){

    getActionSelected();
    var action = actionSelected;
    if(action === 'register'){
        let info="Stai per avviare la procedura di registrazione.\nNon potrai interrompere la registrazione per i prossimi 30 secondi.\n"+
            "Continua a parlare per tutta la durata della procedura e se non sai cosa dire, leggi il testo nella sezione \"Leggi qui\"e se è corto puoi leggerlo anche più di una volta.\n"+
            "Al termine della registrazione potrai riascoltare l'audio e se senti dei rumori di fondo o altre voci oltre la tua premi \" Registra\" per ricominciare.\nGrazie per il tuo aiuto!"
        if(confirm(info)){
            deleteList();
            startRec();
        }
    }else{

        info="Stai per avviare la procedura di registrazione.\nNon potrai interrompere la registrazione per i prossimi 15 secondi.\n"+
            "Continua a parlare per tutta la durata della procedura e se non sai cosa dire, leggi il testo nella sezione \"Leggi qui\"e se è corto puoi leggerlo anche più di una volta.\n"+
            "Al termine della registrazione potrai riascoltare l'audio e se senti dei rumori di fondo o altre voci oltre la tua premi \" Registra\" per ricominciare.\nGrazie per il tuo aiuto!"

        if(confirm(info)){
            deleteList();
            startRec();
        }
    }

}

function preRecord(){

    leftchannel = [];
    rightchannel = [];
    recorder = null;
    recordingLength = 0;
    volume = null;
    mediaStream = null;
    sampleRate = 16000;
    context = null;

}


function startRec() {
	console.log("recordButton clicked");
	deleteList();
        recordButton.disabled = true;

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: {noiseSuppression: true, autoGainControl: true}, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	//pauseButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia()
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext({sampleRate:16000});

		//update the format
		//document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/*
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

            effect.classList.add("pulse-ring");

            //avvio timer di registrazione
            getActionSelected();
            var action = actionSelected;
            if(action === "register") {
                drawTimer(30);
            }else if(action === "login"){
                drawTimer(15);
            }

            document.getElementById("action").disabled=true;  // disabilita action per la durata della registrazione
            interval = setInterval(timer,1000);
            console.log("Registrazione partita");


		//start the recording process
		rec.record()

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
       	//pauseButton.disabled = true
	});
}

/*
function startRec () {
    preRecord();
    deleteList();
    recordButton.disabled = true;
    // Initialize recorder
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.msGetUserMedia;
    navigator.mediaDevices.getUserMedia(
        {
            audio: {noiseSuppression: true, autoGainControl: true},
        }).then(
        function (e) {
            console.log("user consent");

            // creates the audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext({sampleRate:16000});

            // creates an audio node from the microphone incoming stream
            mediaStream = context.createMediaStreamSource(e);

            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
            // bufferSize: the onaudioprocess event is called when the buffer is full
            var bufferSize = 2048;
            var numberOfInputChannels = 2;
            var numberOfOutputChannels = 2;
            if (context.createScriptProcessor) {
                recorder = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            } else {
                recorder = context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
            }

            recorder.onaudioprocess = function (e) {
                leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                rightchannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
                recordingLength += bufferSize;
            }


            effect.classList.add("pulse-ring");

            //avvio timer di registrazione
            getActionSelected();
            var action = actionSelected;
            if(action === "register") {
                drawTimer(30);
            }else if(action === "login"){
                drawTimer(15);
            }

            document.getElementById("action").disabled=true;  // disabilita action per la durata della registrazione
            interval = setInterval(timer,1000);
            console.log("Registrazione partita");


            // we connect the recorder
            mediaStream.connect(recorder);
            recorder.connect(context.destination);
        },
        function (e) {
            console.error(e);
            recordButton.disabled = false;
            //stopButton.disabled = false;
        });
}
*/

function stopRec() {
	console.log("stopButton clicked");
	    recordButton.disabled = false;
            effect.classList.remove("pulse-ring");
   	    clearIntervalFunction();

	//disable the stop button, enable the record too allow for new recordings
	//stopButton.disabled = true;
	//recordButton.disabled = false;
	//pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	//pauseButton.innerHTML="Pause";

	//tell the recorder to stop the recording
	rec.stop();
	//Eliminazione interval di registrazione
	clearIntervalFunction()

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}


/*
function stopRec() {

    // stop recording

    recordButton.disabled = false;
    effect.classList.remove("pulse-ring");
    clearIntervalFunction();

    recorder.disconnect(context.destination);
    mediaStream.disconnect(recorder);

    // we flat the left and right channels down
    // Float32Array[] => Float32Array
    var leftBuffer = flattenArray(leftchannel, recordingLength);
    var rightBuffer = flattenArray(rightchannel, recordingLength);
    // we interleave both channels together
    // [left[0],right[0],left[1],right[1],...]
    var interleaved = interleave(leftBuffer, rightBuffer);

    // we create our wav file
    var buffer = new ArrayBuffer(44 + interleaved.length * 2);
    var view = new DataView(buffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + interleaved.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunkSize
    view.setUint16(20, 1, true); // wFormatTag
    view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
    view.setUint32(24, sampleRate, true); // dwSamplesPerSec
    view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
    view.setUint16(32, 4, true); // wBlockAlign
    view.setUint16(34, 16, true); // wBitsPerSample
    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // write the PCM samples
    var index = 44;
    var volume = 1;
    for (var i = 0; i < interleaved.length; i++) {
        view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
        index += 2;
    }

    // our final blob
    let blob = new Blob([view], { type: 'audio/wav' });
    createDownloadLink(blob);
}

function flattenArray(channelBuffer, recordingLength) {
    var result = new Float32Array(recordingLength);
    var offset = 0;
    for (var i = 0; i < channelBuffer.length; i++) {
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

function interleave(leftChannel, rightChannel) {
    var length = leftChannel.length + rightChannel.length;
    var result = new Float32Array(length);

    var inputIndex = 0;

    for (var index = 0; index < length;) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
    }
    return result;
}

function writeUTFBytes(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
*/
function createDownloadLink(blob) {

    gBlob = blob;
    var url = URL.createObjectURL(gBlob);
    var au = document.createElement('audio');
    au.id = "audio_id";
    var li = document.createElement('li');
    var link = document.createElement('a');

    //name of .wav file to use during upload and download (without extension)
    var username = document.getElementById('username').value;
    filename = username + "_" + new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //save to disk link
    link.href = url;
    link.download = filename+".wav"; //download forces the browser to download the file using the  filename
    link.innerHTML = "Salva una copia sul tuo dispositivo";

    //add the new audio element to li
    li.appendChild(au);

    //add the filename to the li
    li.appendChild(document.createTextNode(filename+".wav "))

    //add the save to disk link to li
    li.appendChild(link);

    //upload link
    // var upload = document.createElement('a');
    // upload.href="";
    // upload.innerHTML = "Upload";

    var submit = document.getElementById('submitButton');

    submit.addEventListener("click",subListener);
    checkEvent=true;
    // li.appendChild(document.createTextNode (" "))//add a space in between
    // li.appendChild(upload)//add the upload link to li

    //add the li element to the ol
    recordingsList.appendChild(li);
}

//Carica l'articolo da leggere e modifica il contenuto della legend
var loadWikiArticle = function (e) {


    let i = Math.floor(Math.random() * 12);

    let str =  new Array();

    str[0] = "Così ho trascorso la mia vita solo, senza nessuno cui poter parlare, fino a sei anni fa quando ebbi un incidente col mio " +
    "aeroplano, nel deserto del Sahara. Qualche cosa si era rotta nel motore, e siccome non avevo con me né un meccanico, né dei " +
    "passeggeri, mi accinsi da solo a cercare di riparare il guasto. Era una questione di vita o di morte, perché avevo acqua da " +
    "bere soltanto per una settimana. La prima notte, dormii sulla sabbia, a mille miglia da qualsiasi abitazione umana. Ero più " +
    "isolato che un marinaio abbandonato in mezzo all'oceano, su una zattera, dopo un naufragio. Potete Immaginare il mio " +
    "stupore di essere svegliato all'alba da una strana vocetta: «Mi disegni, per favore, una pecora?» «Cosa?» " +
    "«Disegnami una pecora». Balzai in piedi come fossi stato colpito da un fulmine. Mi strofinai gli occhi più volte guardandomi " +
    "attentamente intorno. E vidi una straordinaria personcina che mi stava esaminando con grande serietà. Qui potete vedere il " +
    "miglior ritratto che riuscii a fare di lui, più tardi. Ma il mio disegno è molto meno affascinante del modello." ;

    str[1] = "Ci misi molto tempo a capire da dove venisse. Il piccolo " +
    "principe, che mi faceva una domanda dopo l'altra, pareva che " +
    "non sentisse mai le mie." +
    "Sono state le parole dette per caso che, poco a poco, mi hanno " +
    "rivelato tutto. Così, quando vide per la prima volta il mio " +
    "aeroplano (non lo disegnerò perché sarebbe troppo complicato " +
    "per me), mi domandò:" +
    "«Che cos'è questa cosa?»" +
    "«Non è una cosa — vola. È un aeroplano. È il mio aeroplano»." +
    "Ero molto fiero di fargli sapere che volavo. Allora gridò:" +
    "«Come? Sei caduto dal cielo!»" +
    "«Sì», risposi modestamente." +
    "«Ah! Questa è buffa...»" +
    "E il piccolo principe scoppiò in una bella risata che mi irritò." +
    "Voglio che le mie disgrazie siano prese sul serio. Poi riprese:" +
    "«Allora anche tu vieni dal cielo! Di quale pianeta sei?»" +
    "Intravidi una luce, nel mistero della sua presenza, e lo " +
    "interrogai bruscamente:" +
    "«Tu vieni dunque da un altro pianeta?»" +
    "Ma non mi rispose. Scrollò gentilmente il capo osservando " +
    "l'aeroplano." +
    "«Certo che su quello non puoi venire da molto lontano...»" +
    "E si immerse in una lunga meditazione. Poi, tirando fuori dalla " +
    "tasca la mia pecora, sprofondò nella contemplazione del suo " +
    "tesoro.";

    str[2] = "Avevo così saputo una seconda cosa molto importante! Che il " +
    "suo pianeta nativo era poco più grande di una casa. Tuttavia " +
    "questo non poteva stupirmi molto. Sapevo benissimo che, oltre " +
    "ai grandi pianeti come la Terra, Giove, Marte, Venere ai quali " +
    "si è dato un nome, ce ne sono centinaia ancora che sono a volte " +
    "piccoli che si arriva sì e no a vederli col telescopio." +
    "Quando un astronomo scopre uno di questi, gli dà per nome un " +
    "numero. Lo chiama per esempio: «l'asteroide 3251»." +
    "Ho serie ragioni per credere che il pianeta da dove veniva il " +
    "piccolo principe sia l'asteroide B 612." +
    "Questo asteroide è stato visto una sola volta al telescopio da un " +
    "astronomo turco." +
    "Aveva fatto allora una grande dimostrazione della sua scoperta " +
    "a un Congresso Internazionale d'Astronomia. Ma in costume " +
    "com'era, nessuno lo aveva preso sul serio. I grandi sono fatti " +
    "così." +
    "Fortunatamente per la reputazione dell'asteroide B 612 un " +
    "dittatore turco impose al suo popolo, sotto pena di morte, di " +
    "vestire all'europea.";

    str[3] = "Ogni giorno imparavo qualche cosa sul pianeta, sulla partenza," +
    "sul viaggio. Veniva da sé, per qualche riflessione." +
    "Fu così che al terzo giorno conobbi il dramma dei baobab." +
    "Anche questa volta fu merito della pecora, perché bruscamente " +
    "il piccolo principe mi interrogò, come preso da un grave " +
    "dubbio:" +
    "«È proprio vero che le pecore mangiano gli arbusti?»" +
    "«Sì, è vero»." +
    "«Ah! Sono contento»." +
    "Non capii perché era così importante che le pecore " +
    "mangiassero gli arbusti. Ma il piccolo principe continuò:" +
    "«Allora mangiano anche i baobab?»" +
    "Feci osservare al piccolo principe che i baobab non sono degli " +
    "arbusti, ma degli alberi grandi come chiese e che se anche " +
    "avesse portato con sé una mandria di elefanti, non sarebbe " +
    "venuto a capo di un solo baobab." +
    "L'idea della mandria di elefanti fece ridere il piccolo principe:" +
    "«Bisognerebbe metterli gli uni su gli altri...»" +
    "Ma osservò saggiamente:" +
    "«I baobab prima di diventar grandi cominciano con l'essere " +
    "piccoli»." +
    "«È esatto! Ma perché vuoi che le tue pecore mangino i piccoli " +
    "baobab?»";

    str[4] = "Imparai ben presto a conoscere meglio questo fiore. C'erano " +
    "sempre stati sul pianeta del piccolo principe dei fiori molto " +
    "semplici, ornati di una sola raggiera di petali, che non tenevano " +
    "posto e non disturbavano nessuno. Apparivano un mattino " +
    "nell'erba e si spegnevano la sera. Ma questo era spuntato un " +
    "giorno, da un seme venuto chissà da dove, e il piccolo principe " +
    "aveva sorvegliato da vicino questo ramoscello che non " +
    "assomigliava a nessun altro ramoscello. Poteva essere una " +
    "nuova specie di baobab. Ma l'arbusto cessò presto di crescere e " +
    "cominciò a preparare un fiore. Il piccolo principe, che assisteva " +
    "alla formazione di un bocciolo enorme, sentiva che ne sarebbe " +
    "uscita un'apparizione miracolosa, ma il fiore non smetteva più " +
    "di prepararsi ad essere bello, al riparo della sua camera verde." +
    "Sceglieva con cura i suoi colori, si vestiva lentamente," +
    "aggiustava i suoi petali ad uno ad uno. Non voleva uscire " +
    "sgualcito come un papavero. Non voleva apparire che nel pieno " +
    "splendore della sua bellezza. Eh, sì, c'era una gran civetteria in " +
    "tutto questo! La sua misteriosa toeletta era durata giorni e " +
    "giorni. E poi, ecco che un mattino, proprio all'ora del levar del " +
    "sole, si era mostrato.";

    str[5] = "Io credo che egli approfittò, per venirsene via, di una " +
    "migrazione di uccelli selvatici. Il mattino della partenza mise " +
    "bene in ordine il suo pianeta. Spazzò accuratamente il camino " +
    "dei suoi vulcani in attività. Possedeva due vulcani in attività." +
    "Ed era molto comodo per far scaldare la colazione del mattino." +
    "E possedeva anche un vulcano spento. Ma, come lui diceva," +
    "«non si sa mai» e così spazzò anche il camino del vulcano " +
    "spento. Se i camini sono ben puliti, bruciano piano piano," +
    "regolarmente, senza eruzioni. Le eruzioni vulcaniche sono " +
    "come gli scoppi nei caminetti. È evidente che sulla nostra terra " +
    "noi siamo troppo piccoli per poter spazzare il camino dei nostri " +
    "vulcani ed è per questo che ci danno tanti guai." +
    "Il piccolo principe strappò anche con una certa malinconia gli " +
    "ultimi germogli dei baobab. Credeva di non ritornare più. Ma " +
    "tutti quei lavori consueti gli sembravano, quel mattino," +
    "estremamente dolci. E quando innaffiò per l'ultima volta il suo " +
    "fiore, e si preparò a metterlo al riparo sotto la campana di vetro," +
    "scopri che aveva una gran voglia di piangere.";

    str[6] = "Il secondo pianeta era abitato da un vanitoso." +
    "«Ah! ah! ecco la visita di un ammiratore», gridò da lontano il " +
    "vanitoso appena scorse il piccolo principe." +
    "Per i vanitosi tutti gli altri uomini sono degli ammiratori." +
    "«Buon giorno», disse il piccolo principe, «che buffo cappello " +
    "avete!»" +
    "«È per salutare», gli rispose il vanitoso. «È per salutare quand o" +
    "mi acclamano, ma sfortunatamente non passa mai nessuno da " +
    "queste parti»." +
    "«Ah sì?» disse il piccolo principe che non capiva." +
    "«Batti le mani l'una contro l'altra», consigliò perciò il vanitoso." +
    "Il piccolo principe batté le mani l'una contro l'altra e il vanitoso " +
    "salutò con modestia sollevando il cappello." +
    "«È più divertente che la visita al re», si disse il piccolo " +
    "principe, e ricominciò a battere le mani l'una contro l'altra. Il " +
    "vanitoso ricominciò a salutare sollevando il cappello." +
    "Dopo cinque minuti di questo esercizio il piccolo principe si " +
    "stancò della monotonia del gioco: «E che cosa bisogna fare»," +
    "domandò, «perché il cappello caschi?»";

    str[7] = "Il quarto pianeta era abitato da un uomo d'affari. Questo uomo " +
    "era così occupato che non alzò neppure la testa all'arrivo del " +
    "piccolo principe." +
    "«Buon giorno», gli disse questi. «La vostra sigaretta è spenta»." +
    "«Tre più due fa cinque. Cinque più sette: dodici. Dodici più tre:" +
    "quindici. Buon giorno. Quindici più sette fa ventidue. Ventidue " +
    "più sei: ventotto. Non ho tempo per riaccenderla. Ventisei più " +
    "cinque trentuno. Ouf! Dunque fa cinquecento e un milione " +
    "seicento ventiduemila settecento trentuno»." +
    "«Cinquecento milioni di che?»" +
    "«Hem! Sei sempre li? Cinquecento e un milione di... non lo so " +
    "più. Ho talmente da fare! Sono un uomo serio, io, non mi " +
    "diverto con delle frottole! Due più cinque: sette...»" +
    "«Cinquecento e un milione di che?» ripeté il piccolo principe " +
    "che mai aveva rinunciato a una domanda una volta che l'aveva " +
    "espressa." +
    "L'uomo d'affari alzò la testa:" +
    "«Da cinquantaquattro anni che abito in questo pianeta non sono " +
    "stato disturbato che tre volte. La prima volta è stato ventidue " +
    "anni fa, da una melolonta che era caduta chissà da dove." +
    "Faceva un rumore spaventoso e ho fatto quattro errori in una " +
    "addizione. La seconda volta è stato undici anni fa per una crisi " +
    "di reumatismi. Non mi muovo mai, non ho il tempo di " +
    "girandolare. Sono un uomo serio, io. La terza volta... eccolo!" +
    "Dicevo dunque cinquecento e un milione». «Milioni di che?»" +
    "L'uomo d'affari capi che non c'era speranza di pace.";

    str[8] = "Il quinto pianeta era molto strano. Vi era appena il posto per " +
    "sistemare un lampione e l'uomo che l'accendeva. Il piccolo " +
    "principe non riusciva a spiegarsi a che potessero servire, spersi " +
    "nel cielo, su di un pianeta senza case, senza abitanti, un " +
    "lampione e il lampionaio." +
    "Eppure si disse:" +
    "«Forse quest'uomo è veramente assurdo. Però è meno assurdo " +
    "del re, del vanitoso, dell'uomo d'affari e dell'ubriacone. Almeno " +
    "il suo lavoro ha un senso. Quando accende il suo lampione, è " +
    "come se facesse nascere una stella in più, o un fiore. Quando lo " +
    "spegne addormenta il fiore o la stella. È una bellissima " +
    "occupazione, ed è veramente utile, perché è bella»." +
    "Salendo sul pianeta salutò rispettosamente l'uomo:" +
    "«Buon giorno. Perché spegni il tuo lampione?»" +
    "«È la consegna», rispose il lampionaio. «Buon giorno»." +
    "«Che cos'è la consegna?»" +
    "«È di spegnere il mio lampione. Buona sera». E lo riaccese." +
    "«E adesso perché lo riaccendi?»" +
    "«È la consegna»." +
    "«Non capisco», disse il piccolo principe." +
    "«Non c'è nulla da capire», disse l'uomo, «la consegna è la " +
    "consegna. Buon giorno». E spense il lampione." +
    "Poi si asciugò la fronte con un fazzoletto a quadri rossi";

    str[9] = "Il settimo pianeta fu dunque la Terra." +
    "La Terra non è un pianeta qualsiasi! Ci si contano cento e " +
    "undici re (non dimenticando, certo, i re negri), settemila " +
    "geografi, novecentomila uomini d'affari, sette milioni e mezzo " +
    "di ubriaconi, trecentododici milioni di vanitosi, cioè due " +
    "miliardi circa di adulti." +
    "Per darvi un'idea delle dimensioni della Terra, vi dirò che " +
    "prima dell'invenzione dell'elettricità bisognava mantenere," +
    "sull'insieme dei sei continenti, una vera armata di " +
    "quattrocentosessantaduemila e cinquecentoundici lampionai " +
    "per accendere i lampioni. Visto un po' da lontano faceva uno " +
    "splendido effetto. I movimenti di questa armata erano regolati " +
    "come quelli di un balletto d'opera. Prima c'era il turno di quelli " +
    "che accendevano i lampioni della Nuova Zelanda e " +
    "dell'Australia. Dopo di che, questi, avendo accesi i loro " +
    "lampioni, se ne andavano a dormire. Allora entravano in scena " +
    "quelli della Cina e della Siberia. Poi anch'essi se la battevano " +
    "fra le quinte. Allora veniva il turno dei lampionai della Russia e " +
    "delle Indie. Poi di quelli dell'Africa e dell'Europa. Poi di quelli " +
    "dell'America del Sud e infine di quelli dell'America del Nord. E " +
    "mai che si sbagliassero nell'ordine dell'entrata in scena. Era " +
    "grandioso.";

    str[10] = "Eravamo all'ottavo giorno della mia panne nel deserto, e avevo " +
    "ascoltato la storia del mercante bevendo l'ultima goccia della " +
    "mia provvista d'acqua:" +
    "«Ah!» dissi al piccolo principe, «sono molto graziosi i tuoi " +
    "ricordi, ma io non ho ancora riparato il mio aeroplano, non ho " +
    "più niente da bere, e sarei felice anch'io se potessi camminare " +
    "adagio adagio verso una fontana!»" +
    "«Il mio amico la volpe, mi disse...»" +
    "«Caro il mio ometto, non si tratta più della volpe!»" +
    "«Perché?»" +
    "«Perché moriremo di sete...»" +
    "Non capì il mio ragionamento e mi rispose:" +
    "«Fa bene l'aver avuto un amico, anche se poi si muore. Io, io " +
    "sono molto contento d'aver avuto un amico volpe...»" +
    "Non misura il pericolo, mi dissi. Non ha mai né fame, né sete." +
    "Gli basta un po' di sole..." +
    "Ma mi guardò e rispose al mio pensiero:" +
    "«Anch'io ho sete... cerchiamo un pozzo...»" +
    "Ebbi un gesto di stanchezza: è assurdo cercare un pozzo, a " +
    "caso, nell'immensità del deserto. Tuttavia ci mettemmo in " +
    "cammino.";

    str[11] = "Ed ora, certo, sono già passati sei anni. Non ho ancora mai " +
    "raccontata questa storia. Gli amici che mi hanno rivisto erano " +
    "molto contenti di rivedermi vivo. Ero triste, ma dicevo : «È la " +
    "stanchezza...» Ora mi sono un po' consolato. Cioè... non del " +
    "tutto. Ma so che è ritornato nel suo pianeta, perché al levar del " +
    "giorno, non ho ritrovato il suo corpo. Non era un corpo molto " +
    "pesante... E mi piace la notte ascoltare le stelle. Sono come " +
    "cinquecento milioni di sonagli..." +
    "Ma ecco che accade una cosa straordinaria." +
    "Alla museruola disegnata per il piccolo principe, ho " +
    "dimenticato di aggiungere la correggia di cuoio! Non avrà mai " +
    "potuto mettere la museruola alla pecora. Allora mi domando:" +
    "«Che cosa sarà successo sul suo pianeta? Forse la pecora ha " +
    "mangiato il fiore...»" +
    "Tal altra mi dico: «Certamente no! Il piccolo principe mette il " +
    "suo fiore tutte le notti sotto la sua campana di vetro, e sorveglia " +
    "bene la sua pecora...» Allora sono felice. E tutte le stelle ridono " +
    "dolcemente.";

    /*
    if(document.getElementById('action').value == "login"){
        document.getElementById("action-label").innerHTML = "Inserisci il nome associato alla voce che vuoi riconoscere";
    }else{
        document.getElementById("action-label").innerHTML = "Inserisci il nome che vuoi associare alla voce";

    }
    */

    //var xhr = new XMLHttpRequest();
    //xhr.open('GET', 'https://it.wikipedia.org/api/rest_v1/page/random/summary', true);
    //xhr.onloadend = function (e) {
    //	var res = JSON.parse(e.target.responseText);
    //	document.getElementById('readingText').innerText = res['extract'];
    //};
    //xhr.send();*/

    document.getElementById('readingText').innerText = str[i]

};

/*
var actionSelect = document.getElementById('action')

actionSelect.onchange = loadWikiArticle;

document.getElementById("howTo").hidden = true

document.getElementById("expandCollapse").onclick = function () {
    let howToHidden = document.getElementById("howTo").hidden;
    document.getElementById("howTo").hidden = !howToHidden;
}
*/

//Funzione di controllo durata esatta per distorsione Safari
function checkDuration(){

    getActionSelected();
    var action = actionSelected;
    var x;
    if (action === "register")
        x = 34;
    if (action === "login")
        x = 19;

    var y = document.getElementById("audio_id").duration;
    console.log(y)
    if( !(Number.isFinite(y)) || ( y > x)){
        deleteList();
        window.alert("Errore nella traccia audio\nChiudi e riapri la scheda o il browser");
        return true;
    }

    return false;

}


// Funzione di controllo sulla durata minima delle registrazioni
function timer(s){

    getActionSelected();
    var action = actionSelected;
    ++seconds;
    if(action === "register" && seconds > 30) {
        /*stopButton.disabled = false;
        element.style.background = "green";
        document.getElementById("action").disabled=false;*/
        stopRec();
    }else{
        if (action === "login" && seconds > 15){
            /*stopButton.disabled = false;
            element.style.background = "green";
            document.getElementById("action").disabled=false;*/
            stopRec();
        }
    }
}

// Funzione di eliminazione dell intervallo
function clearIntervalFunction() {

    clearInterval(interval);
    seconds=0;

}

// Funzione di corretta registrazione
function succRegistered(username){

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/registered/'+ username, true);
    xhr.onloadend = function (e) {
        redir = e.target.responseURL
        window.location.replace(redir);
    }
    xhr.send();

}

//Funzione errore di registrazione per nome utente già usato
function userAlredyExistsError(){
    let info="Nome utente già utilizzato";
    window.alert(info);
}

function userNotExistsError(){
    let info="Utente non presente nel sistema";
    window.alert(info);
}


// Elimina vecche tracce audio al cambio di action
function deleteList()
{
    if(checkEvent){
        document.getElementById("submitButton").removeEventListener("click",subListener);
        checkEvent=false;
    }
    recordingsList.innerHTML="";
    document.getElementById("result").innerHTML="";
}

//Listener pulsante Invia
function subListener(){

    //Controlla se la durata della traccia risulta valida. Se non risulta interrompe la chiamata altrimente esegue il resto dei controlli

    if (checkDuration())
    {}
    else
    {
        // Flusso normale di esecuzione dei controlli pre-chiamata

        document.getElementById("load-gif").hidden=false;
        document.getElementById("submitButton").innerHTML="Attendi";
        document.getElementById("result").innerHTML="";
        document.getElementById("submitButton").disabled=true;
        var username = document.getElementById('username').value;

        getActionSelected();
        var action = actionSelected;

        if(username.length == 0){
            confirm("Inserici un nome utente");
            document.getElementById("load-gif").hidden=true;
            document.getElementById("submitButton").innerHTML="Invia";
            document.getElementById("submitButton").disabled=false;

        }else{
            var xhr = new XMLHttpRequest();
            xhr.onloadend = function (e) {
                document.getElementById("load-gif").hidden=true;
                document.getElementById("submitButton").innerHTML="Invia";
                document.getElementById("submitButton").disabled=false;
                if (this.readyState === 4) {
                    console.log("Server returned: ", e.target.responseText);
                    var response = e.target.responseText;
                    if (action === 'register') {
                        if (response === 'USER_ALREADY_EXISTS')
                            userAlredyExistsError();
                        else
                            succRegistered(username);
                        //document.getElementById("result").innerText = 'Hey ' + username + ', Sei stato registrato!';
                    } else {
                        if(response === 'USER_NOT_EXISTS'){
                            userNotExistsError();
                        }else if (e.target.status == 250) {
                            var body = JSON.parse(response)
                            window.alert('Hey ' + username + ", Sei stato correttamente identificato!\n\n  Fusion Positive embeddings: "+body["vector_fusion embeddings"]);
                            deleteList();
                        } else {
                            var body = JSON.parse(response)
                            window.alert('Utente ' + username+" non riconosciuto!\n\n  Fusion Positive embeddings: "+body["vector_fusion embeddings"]);
                            deleteList();
                        }
                    }
                }
            };
            var fd = new FormData();
            fd.append("file", gBlob, filename);
            fd.append("username", username);
            xhr.open("POST", "/" + action + "/" + username, true);
            xhr.send(fd);
        }
    }
}


//Listener onkeyup
function controlla(){

    var username = document.getElementById('username').value;
    var usernameId = document.getElementById('username');
    //getActionSelected();
    var action = actionSelected;


    if(username.length == 0){
        usernameId.classList.add('is-invalid');
        usernameId.classList.remove('is-valid');

        return false;
    }else{
        var xhr = new XMLHttpRequest();
        xhr.onloadend = function (e) {

            if (this.readyState === 4) {
                console.log("Server returned: ", e.target.responseText);
                var response = e.target.responseText;
                if (action === 'register') {
                    if (response === 'USER_ALREADY_EXISTS'){
                        usernameId.classList.add('is-invalid');
                        usernameId.classList.remove('is-valid');
                    }else{
                        usernameId.classList.remove('is-invalid');
                        usernameId.classList.add('is-valid');

                    }
                } else if (action === 'login') {
                    if (response === 'USER_ALREADY_EXISTS'){
                        usernameId.classList.remove('is-invalid');
                        usernameId.classList.add('is-valid');

                    }else{
                        usernameId.classList.add('is-invalid');
                        usernameId.classList.remove('is-valid');

                    }
                }
            }
        };
        var fd = new FormData();
        fd.append("username", username);
        xhr.open("POST", "/" + "check" + "/" + username, true);
        xhr.send(fd);
    }
}

//JS DEL TIMER
function drawTimer(sec){
var width = 120,
    height = 120,
    timePassed = 0,
    timeLimit = sec;

var fields = [{
    value: timeLimit,
    size: timeLimit,
    update: function() {
        return timePassed = timePassed + 1;
    }
}];

var nilArc = d3.svg.arc()
    .innerRadius(width / 3 - 133)
    .outerRadius(width / 3 - 133)
    .startAngle(0)
    .endAngle(2 * Math.PI);

var arc = d3.svg.arc()
    .innerRadius(width / 3 - 55)
    .outerRadius(width / 3 - 25)
    .startAngle(0)
    .endAngle(function(d) {
        return ((d.value / d.size) * 2 * Math.PI);
    });

d3.select("#newTimer").select("svg").remove();

var svg = d3.select("#newTimer").append("svg")
    .attr("id","svgId")
    .attr("width", width)
    .attr("height", height);

var field = svg.selectAll(".field")
    .data(fields)
    .enter().append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .attr("class", "field");

var back = field.append("path")
    .attr("class", "path path--background")
    .attr("d", arc);

var path = field.append("path")
    .attr("class", "path path--foreground");

var label = field.append("text")
    .attr("class", "label")
    .attr("dy", ".35em");

(function update() {

    field
        .each(function(d) {
            d.previous = d.value, d.value = d.update(timePassed);
        });

    path.transition()
        .ease("elastic")
        .duration(500)
        .attrTween("d", arcTween);

    if (timeLimit == 30 && (timeLimit - timePassed) <= 5)
        pulseText();
    else if(timeLimit == 15 && (timeLimit - timePassed) <= 3)
        pulseText();
    else
        label
            .text(function(d) {
                return d.size - d.value;
            });

    if (timePassed <= timeLimit)
        setTimeout(update, 1000 - (timePassed % 1000));
    else
        destroyTimer();

})();

function pulseText() {
    back.classed("pulse", true);
    label.classed("pulse", true);

    if ((timeLimit - timePassed) >= 0) {
        label.style("font-size", "120px")
            .attr("transform", "translate(0," + +4 + ")")
            .text(function(d) {
                return d.size - d.value;
            });
    }

    label.transition()
        .ease("elastic")
        .duration(900)
        .style("font-size", "90px")
        .attr("transform", "translate(0," + -10 + ")");
}

function destroyTimer() {
    label.transition()
        .ease("back")
        .duration(700)
        .style("opacity", "0")
        .style("font-size", "5")
        .attr("transform", "translate(0," + -40 + ")")
        .each("end", function() {
            field.selectAll("text").remove()
        });

    path.transition()
        .ease("back")
        .duration(700)
        .attr("d", nilArc);

    back.transition()
        .ease("back")
        .duration(700)
        .attr("d", nilArc)
        .each("end", function() {
            field.selectAll("path").remove()
        });

    d3.select("#newTimer").select("svg").remove();
}

function arcTween(b) {
    var i = d3.interpolate({
        value: b.previous
    }, b);
    return function(t) {
        return arc(i(t));
    };
}

}


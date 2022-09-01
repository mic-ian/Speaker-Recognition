# Speaker_recognition
Speaker recognition è un progetto sviluppato nell'ambito del riconoscimento vocale, che è in grado di capire se chi sta parlando è il reale proprietario dell'account.
Esso si serve di un dataset di tracce audio, Librispeech, per estrarre da ognuna di esse due differenti tipi di vettori rappresentativi delle caratteristiche vocali: 
- x-vector
- i-vector

Tali vettori vengono fusi, cioè per ogni traccia ne viene restituita la media ponderata dei due. Tutti i vettori risultanti vengono dati in input al motore del progetto: una rete neurale di tipo siamese convoluzionale. Una volta ottenuto il modello migliore dall'addestramento, esso viene sfruttato tramite una piattaforma web, pensata per compiere due azioni:
- registrazione
- riconoscimento

La registrazione consente di creare il proprio account a cui associare la propria voce autentica. Ad essa verrà comparata la nota vocale registrata ad ogni tentativo di riconoscimento, inteso come un normale tentativo di accesso all'account.
Se si tratta del reale proprietario dell'account allora la rete lo riconoscerà poichè gli audio della prima registrazione e quello del tentativo di accesso avranno caratteristiche (e quindi vettori) molto simili, altrimenti no.

# Tecnologie
- Python per il machine learning
- Kaldi per l'estrazione dei vettori
- Flask, HTML, CSS, JS e Bootstrap per lo sviluppo della webapp
- Server CentOS linux-based per gestire il tool e renderlo pubblico

# Demo
https://user-images.githubusercontent.com/72653442/156880629-9a34cd7d-db0d-42eb-b043-18d3f2a16ca6.mp4

# Autori
- Michele Iannucci
- Ciro Fusco

var queue = [];
var musicLibrary;
var rockInterval = {}
var audioObject;
var stopPlease = window.stopPlease;
var rockimg,nowplaying,song;
var pasuedMusic = false;
var textLog; 
var speechSynthesisAllowed;
var nextLRCSync = {};
var currentSongData = {};
var rockHidden = false;

window.addEventListener("DOMContentLoaded", () => {
    rockimg = document.querySelector(".rockimg");
    nowplaying = document.getElementById("nowplaying");
    song = document.getElementById("song");
    textLog = document.getElementById("textLog");
    checkifSpeechSynthesisAllowed();
    if (rockimg) {
        rockimg.addEventListener("click", () => {
            if (stopPlease) {
                stopPlease = false;
                cleanUp();
                if(speechSynthesisAllowed && currentSongData) {
                    userSkipSong();
                } else {
                    startMusic();
                }
            } else {
                stopMusic();
            }
        });
    }
    changeColorFromLocal();
    updateQueue();
});

function hideRock() {
    let rockButton = document.getElementById("hideRock");
    if(rockHidden) {
        rockimg.style.opacity = '0.9';
        rockButton.innerHTML = '<span class="material-symbols-outlined">visibility_off</span>';
        rockHidden = false;
        if(currentSongData && !stopPlease) {
           startRotatingRock();
        }
    } else {
        rockimg.style.opacity = '0';
        rockButton.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
        rockHidden = true;
        for(objects in rockInterval){
            clearInterval(rockInterval[objects]);
        }
    }
}

function changeColorScheme() {
    let currentColorScheme = document.documentElement.getAttribute("data-theme");
    if(currentColorScheme === "dark") {
        document.documentElement.setAttribute("data-theme", "white");
        localStorage.setItem("colorScheme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("colorScheme", "dark");
    }
}

function changeColorFromLocal() {
    if(localStorage.getItem("colorScheme") === "light") {
        document.documentElement.setAttribute("data-theme", "white");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
    }
}

async function userSkipSong() {
    let speech = new SpeechSynthesisUtterance();
    speech.text = rockSpeak("userSkipSongTemplate", {songName: currentSongData.title, artistName: currentSongData.artist});
    console.log(speech.text);
    window.speechSynthesis.speak(speech);
    // Wait for speech to finish async
    await new Promise((resolve) => {
        speech.onend = resolve;
    });
    startMusic();
}


async function checkifSpeechSynthesisAllowed(){
    try {
        let speech = new SpeechSynthesisUtterance();
        speech.text = "Hello, I am the rock!";
        window.speechSynthesis.speak(speech);
        if(speechSynthesis.speaking){
            speechSynthesisAllowed = true;
        }
    } catch (error) {
        console.log("Speech synthesis is not allowed");
    }
}

function updateQueue() {
    try {
        musicLibrary = JSON.parse(localStorage.getItem("musicLibary"));
    } catch (error) {
        nowplaying.innerHTML = "Add some music by dragging and dropping some files on the rock!";
        stopPlease = true;
        return;
    }

    if(!musicLibrary || Object.keys(musicLibrary).length === 0) {
        nowplaying.innerHTML = "Add some music by dragging and dropping some files on the rock!";
        stopPlease = true;
        return;
    }
    
    let keys = Object.keys(musicLibrary);
    keys.sort(() => Math.random() - 0.5);
    queue = keys;
    console.log("Music queue", queue);
}

function rotateRock() {
    rockimg.style.transform = `rotate(${Math.random() * 360}deg)`;
    rockimg.style.top = `${Math.random() * 100}vh`;
    rockimg.style.left = `${Math.random() * 100}vw`;
}

function startRotatingRock() {
    if(rockHidden){
        rockimg.style.opacity = '0';
        return;
    }
    if(rockHidden) return;
    let id = Math.random().toString(36).substring(7);
    rockInterval[id] = setInterval(rotateRock, 100);
}

function lrcDisplay(lyric,id){
    if(stopPlease) return;
    if(!lyric){
        textLog.style.display = "none";
    } else {
        textLog.style.display = "block";
    }

    textLog.innerHTML = lyric;
    console.log(lyric);
}

async function lrcSync(id) {
    try {
        const opfsRoot = await navigator.storage.getDirectory();
        updateQueue();

        if (!musicLibrary[id].lrc) {
            console.log("No LRC file found");
            return;
        }

        let lrcFileHandle = await opfsRoot.getFileHandle(musicLibrary[id].lrc);
        let lrcFile = await lrcFileHandle.getFile();
        let lrcText = await lrcFile.text();
        let lines = lrcText.split("\n");

        lines.forEach(line => {
            let timeMatch = line.match(/\[\d{2}:\d{2}.\d{2}\]/g);
            let lyric = line.replace(/\[\d{2}:\d{2}.\d{2}\]/g, "").trim();

            if (timeMatch) {
                let time = timeMatch[0].replace("[", "").replace("]", "");
                let [minutes, seconds] = time.split(":").map(parseFloat);
                time = (minutes * 60) + seconds;

                if (audioObject.currentTime >= time) {
                    lrcDisplay(lyric,id);
                } else {
                    let randomID = Math.random().toString(36).substring(7);
                    let waitTime = time - audioObject.currentTime;
                    nextLRCSync[randomID] = setTimeout(() => {
                        lrcDisplay(lyric,id);
                    }, 1000 * waitTime);
                }
            }
        });
    } catch (error) {
        console.error("Failed to get LRC file", error);
    }
}

function cleanUp(){
    for(objects in rockInterval){
        clearInterval(rockInterval[objects]);
    }

    for(objects in nextLRCSync){
        clearTimeout(nextLRCSync[objects]);
    }
    currentSongData = {};
    lrcDisplay("",null)
}

function stopMusic() {
    if(stopPlease){
        pauseMusic();
        return;
    }
    stopPlease = true;
    if (audioObject) {
        audioObject.pause();
    }
    cleanUp();
    rockimg.style.transform = "";
    nowplaying.innerHTML = "Stopped";
    updateQueue();
}

function pauseMusic() {
    let pauseButton = document.getElementById("pause");
    if(pasuedMusic){
        pauseButton.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>';
        if(audioObject){
        audioObject.play();
        }
        navigator.mediaSession.playbackState = "playing";
        pasuedMusic = false;
        cleanUp();
        startRotatingRock();
        lrcSync(queue[0]);
    } else {
        pauseButton.innerHTML = '<span class="material-symbols-outlined">play_circle</span>';
        if(audioObject){
        audioObject.pause();
        }
        navigator.mediaSession.playbackState = "paused";
        pasuedMusic = true;
        cleanUp();
    }
}

function setMediaSessionKeys(){
    navigator.mediaSession.setActionHandler("play", () => {
        pauseMusic();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
        pauseMusic();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
        stopMusic();
        stopPlease = false;
        startMusic();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
        stopMusic();
        stopPlease = false;
        startMusic();
    });

    navigator.mediaSession.setActionHandler("stop", () => {
        stopMusic();
    });
}

function rockSpeak(type, allowedTemplates){
/*
    type: string ex: "songChangeTemplate", "userSkipSongTemplate", or "userSkipSong"
    allowedTemplates: JSON object ex: {songName: "Example Song Name", artistName: "Example Artist Name"}

    stuff in window.rockLines can use are like this: 

    userSkipSongTemplate: {
        songName: [
            "Not feeling [songName], huh?",
        ],
        
        artistName: [
            "Not feeling [artistName], huh?",
        ],
    }

    you can use anything you want to put into the allowedTemplates object in the template.

    Example:
    rockSpeak("userSkipSongTemplate", {"songName": "Hello World", "artistName": "Hello World"});
*/
    if('speechSynthesis' in window) {
        let vaildTemplate = {};
        let choiceArray = [];
        let text = "";

        try {
            vaildTemplate = rockLines[type];
        } catch (error) {
            return console.error("Invalid type");
        }

        if(allowedTemplates.songName && allowedTemplates.artistName) {
            console.log("songName and artistName are detected, attempting to add songName_artistName template");
            if(vaildTemplate.songName_artistName) {
                choiceArray.push(...vaildTemplate.songName_artistName);
            } else {
                console.log("songName_artistName template not found");
            }
        }

        for (let key in allowedTemplates) {
            if(!vaildTemplate[key]) {
                return console.error("Invalid key");
            } else {
                choiceArray.push(...vaildTemplate[key]);
            }
        }

        let randomIndex = Math.floor(Math.random() * choiceArray.length);
        text = choiceArray[randomIndex];

        for (let key in allowedTemplates) {
            text = text.replace(`[${key}]`, allowedTemplates[key]);
        }

        return text;
    }
}

window.startMusic = async function startMusic() {
    if (stopPlease) return;
    if (!queue.length) updateQueue();
    if(audioObject) audioObject.pause();
    // If any HTML audio is playing, stop it
    let audioElements = document.getElementsByTagName("audio");
    for (let audio of audioElements) {
        audio.pause();
    }
    let opfsRoot = await navigator.storage.getDirectory();
    for (let id of queue) {
        let musicData = musicLibrary[id];
        let fileName = musicData.fileName;
        let file = await opfsRoot.getFileHandle(fileName);
        let url = URL.createObjectURL(await file.getFile());
        let picture;
        let mediaSessionData = {
            title: musicData.data?.tags?.title || musicData.originalFileName || "No Metadata",
            artist: musicData.data?.tags?.artist || "",
            album: musicData.data?.tags?.album || "",
        };
        try {
            picture = musicData.data.tags.picture.fileName;
            picture = await opfsRoot.getFileHandle(picture);
            picture = URL.createObjectURL(await picture.getFile());
            document.getElementById("rock-container").style.backgroundImage = `url(${picture})`;
            rockimg.style.opacity = '0.9';
        } catch (error) {
            document.getElementById("rock-container").style.backgroundImage = '';
            rockimg.style.opacity = '1';
        }

        audioObject = new Audio(url);
        if('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata(mediaSessionData);
            navigator.mediaSession.playbackState = "playing";
            setMediaSessionKeys();
        }

        if(musicData.data?.tags?.title.length > 35) {
            // If the song name is too long, shorten it
            musicData.data.tags.title = musicData.data.tags.title.substring(0, 35);
        }

        if(musicData.data?.tags?.artist.length > 35) {
            // If the artist name is too long, shorten it
            musicData.data.tags.artist = musicData.data.tags.artist.substring(0, 35);
        }

        nowplaying.innerHTML = "Now playing...";
        song.innerHTML = `${musicData.data?.tags?.title || musicData.originalFileName || "No Metadata"} <i>By</i> ${musicData.data?.tags?.artist || "No Metadata"}`;

        startRotatingRock();
        currentSongData = musicData.data.tags;

        let lrcSyncStarted = false;
        if ('speechSynthesis' in window && speechSynthesisAllowed) {
            let speech = new SpeechSynthesisUtterance();
            try {
                speech.text = rockSpeak("songChangeTemplate", {"songName": mediaSessionData.title, "artistName": mediaSessionData.artist});
                console.log(speech.text);
            } catch (error) {
                speech.text = `Now playing ${mediaSessionData.title} by ${mediaSessionData.artist}`;
            }
            let loop = 0;
            let stopLoop = false;
            audioObject.volume = 0;
            lrcSyncStarted = true;
            lrcSync(id);
            audioObject.play();
            window.speechSynthesis.speak(speech);
            while(loop < 5 && !stopLoop){
                if(stopPlease) stopLoop = true;
                loop++;
                audioObject.volume = loop * 0.2;
                console.log(audioObject.volume);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } else {
            audioObject.play();
        }

        if(!lrcSyncStarted) {
            lrcSync(id);
        }

        await new Promise((resolve) => {
            audioObject.onended = resolve;
        });
        // Wait 500ms before playing the next song
        await new Promise((resolve) => setTimeout(resolve, 500));
        cleanUp();
    }
}

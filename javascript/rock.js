var queue = [];
var musicLibary;
var rockInterval = {}
var audioObject;
var stopPlease = window.stopPlease;
var rockimg,nowplaying,song;
var pasuedMusic = false;
var textLog; 
var speech;

window.addEventListener("DOMContentLoaded", () => {
    rockimg = document.querySelector(".rockimg");
    nowplaying = document.getElementById("nowplaying");
    song = document.getElementById("song");
    textLog = document.getElementById("textLog");
    speech = new SpeechSynthesisUtterance();
    if (rockimg) {
        rockimg.addEventListener("click", () => {
            if (stopPlease) {
                stopPlease = false;
                startMusic();
            } else {
                stopMusic();
            }
        });
    }
    updateQueue();
});

function updateQueue() {
    try {
        musicLibary = JSON.parse(localStorage.getItem("musicLibary"));
    } catch (error) {
        nowplaying.innerHTML = "Add some music by dragging and dropping some files on the rock!";
        stopPlease = true;
        return;
    }

    if(!musicLibary || Object.keys(musicLibary).length === 0) {
        nowplaying.innerHTML = "Add some music by dragging and dropping some files on the rock!";
        stopPlease = true;
        return;
    }
    
    let keys = Object.keys(musicLibary);
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
    let id = Math.random().toString(36).substring(7);
    rockInterval.id = setInterval(rotateRock, 100);
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
    for (objects in rockInterval) {
        clearInterval(rockInterval[objects]);
    }
    if(speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    rockimg.style.transform = "";
    nowplaying.innerHTML = "Stopped";
    updateQueue();
}

function pauseMusic() {
    let pauseButton = document.getElementById("pause");
    if(pasuedMusic){
        pauseButton.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>';
        audioObject.play();
        navigator.mediaSession.playbackState = "playing";
        pasuedMusic = false;
        startRotatingRock();
    } else {
        pauseButton.innerHTML = '<span class="material-symbols-outlined">play_circle</span>';
        audioObject.pause();
        navigator.mediaSession.playbackState = "paused";
        pasuedMusic = true;
        try {
            for (objects in rockInterval) {
                clearInterval(rockInterval[objects]);
            }
        } catch (error) {
            console.log("maybe failed to clear interval");
        }
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

    navigator.mediaSession.setActionHandler("seekbackward", () => {
        audioObject.currentTime -= 10;
    });

    navigator.mediaSession.setActionHandler("seekforward", () => {
        audioObject.currentTime += 10;
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
        audioObject.currentTime = details.seekTime;
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
        let musicData = musicLibary[id];
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

        if(musicData.data?.tags?.title?.length > 35) {
            // If the song name is too long, shorten it
            musicData.data.tags.title = musicData.data.tags.title.substring(0, 35);
        }

        if(musicData.data?.tags?.artist?.length > 35) {
            // If the artist name is too long, shorten it
            musicData.data.tags.artist = musicData.data.tags.artist.substring(0, 35);
        }

        nowplaying.innerHTML = "Now playing...";
        song.innerHTML = `${musicData.data?.tags?.title || musicData.originalFileName || "No Metadata"} <i>By</i> ${musicData.data?.tags?.artist || "No Metadata"}`;

        startRotatingRock();

        if ('speechSynthesis' in window) {
            try {
                speech.text = rockSpeak("songChangeTemplate", {"songName": mediaSessionData.title, "artistName": mediaSessionData.artist});
                console.log(speech.text);
            } catch (error) {
                speech.text = `Now playing ${mediaSessionData.title} by ${mediaSessionData.artist}`;
            }
            window.speechSynthesis.speak(speech);
            // Wait for the speech to start
            await new Promise((resolve) => {
                speech.onstart = resolve;
            });
            let loop = 0;
            audioObject.volume = 0;
            audioObject.play();
            while(loop < 10){
                loop++;
                audioObject.volume = loop * 0.1;
                console.log(audioObject.volume);
                if(stopPlease) break;
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } else {
            audioObject.play();
        }

        await new Promise((resolve) => {
            audioObject.onended = resolve;
        });
        // Wait 500ms before playing the next song
        await new Promise((resolve) => setTimeout(resolve, 500));
            for (objects in rockInterval) {
        clearInterval(rockInterval[objects]);
    }
    }
}
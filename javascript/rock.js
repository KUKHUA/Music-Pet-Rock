var queue = [];
var musicLibary;
var rockInterval = {}
var audioObject;
var stopPlease = window.stopPlease;
var rockimg,nowplaying,song;
var pasuedMusic = false;
var textLog; 

window.addEventListener("DOMContentLoaded", () => {
    rockimg = document.querySelector(".rockimg");
    nowplaying = document.getElementById("nowplaying");
    song = document.getElementById("song");
    textLog = document.getElementById("textLog");
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
    stopPlease = true;
    if (audioObject) {
        audioObject.pause();
    }
    for (objects in rockInterval) {
        clearInterval(rockInterval[objects]);
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
            title: musicData.data?.tags?.title || musicData.originalFileName || "this is old food for the rock",
            artist: musicData.data?.tags?.artist || "feed your rock!!",
            album: musicData.data?.tags?.album || "feed your rock.. please?",
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
        audioObject.play();
        navigator.mediaSession.metadata = new MediaMetadata(mediaSessionData);
        navigator.mediaSession.playbackState = "playing";
        setMediaSessionKeys();

        nowplaying.innerHTML = "Now playing...";
        song.innerHTML = `${musicData.data?.tags?.title || musicData.originalFileName || "Unknowed"} <i>By</i> ${musicData.data?.tags?.artist || "you should feed your rock a diet of metadata"}`;
        startRotatingRock();
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
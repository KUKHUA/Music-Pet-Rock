var queue = [];
var musicLibary;
var rockInterval;
var audioObject;
var stopPlease = false;
var rockimg,nowplaying,song;
var pasuedMusic = false;
var userText;
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
    startMusic();
}

function rotateRock() {
    rockimg.style.transform = `rotate(${Math.random() * 360}deg)`;
    rockimg.style.top = `${Math.random() * 100}vh`;
    rockimg.style.left = `${Math.random() * 100}vw`;
}

function startRotatingRock() {
    rockInterval = setInterval(rotateRock, 100);
}

function stopMusic() {
    stopPlease = true;
    if (audioObject) {
        audioObject.pause();
    }
    clearInterval(rockInterval);
    rockimg.style.transform = "";
    nowplaying.innerHTML = "Stopped";
    updateQueue();
}

function pauseMusic() {
    let pauseButton = document.getElementById("pause");
    if(pasuedMusic){
        pauseButton.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>';
        audioObject.play();
        pasuedMusic = false;
        textLog.innerHTML = `Paused music.`;
        clearInterval(rockInterval);
    } else {
        pauseButton.innerHTML = '<span class="material-symbols-outlined">play_circle</span>';
        audioObject.pause();
        pasuedMusic = true;
        textLog.innerHTML = `Resumed music.`;
        startRotatingRock();
    }
}

async function startMusic() {
    if (stopPlease) return;
    if (!queue.length) updateQueue();
    let opfsRoot = await navigator.storage.getDirectory();
    if(!userText){
        userText = prompt("Type anything to start playing music");
    }
    for (let id of queue) {
        let musicData = musicLibary[id];
        let fileName = musicData.fileName;
        let file = await opfsRoot.getFileHandle(fileName);
        let url = URL.createObjectURL(await file.getFile());
       // let picture = musicData.data.tags.picture.fileName;
        //picture = await opfsRoot.getFileHandle(picture);
        //picture = URL.createObjectURL(await picture.getFile());
        //let img = new Image();
        //img.src = picture;
        //document.body.appendChild(img);

        audioObject = new Audio(url);
        audioObject.play();
        nowplaying.innerHTML = "Now playing...";
        song.innerHTML = `${musicData.data.tags.title || "IDK"} <i>By</i> ${musicData.data.tags.artist || "IDK"}`;
        startRotatingRock();
        await new Promise((resolve) => {
            audioObject.onended = resolve;
        });
        // Wait 500ms before playing the next song
        await new Promise((resolve) => setTimeout(resolve, 500));
        clearInterval(rockInterval);
    }
}
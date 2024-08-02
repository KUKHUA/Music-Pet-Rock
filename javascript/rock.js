var queue = [];
var musicLibary;
var rockInterval;
var audioObject;
var stopPlease = false;
var rockimg,nowplaying,song;

window.addEventListener("DOMContentLoaded", () => {
    rockimg = document.querySelector(".rockimg");
    nowplaying = document.getElementById("nowplaying");
    song = document.getElementById("song");
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
    if(!musicLibary){
        nowplaying.innerHTML = "Add some music by dragging and dropping some files on the rock!";
        return;
    }
    musicLibary = JSON.parse(localStorage.getItem("musicLibary"));
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

async function startMusic() {
    if (stopPlease) return;
    if (!queue.length) updateQueue();
    let opfsRoot = await navigator.storage.getDirectory();
    for (let id of queue) {
        let musicData = musicLibary[id];
        let fileName = musicData.fileName;
        let file = await opfsRoot.getFileHandle(fileName);
        let url = URL.createObjectURL(await file.getFile());
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
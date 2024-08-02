var queue = [];
var musicLibary;
var rockInterval;
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
        
        clearInterval(rockInterval);
    } else {
        pauseButton.innerHTML = '<span class="material-symbols-outlined">play_circle</span>';
        audioObject.pause();
        pasuedMusic = true;
        
        startRotatingRock();
    }
}

window.startMusic = async function startMusic() {
    if (stopPlease) return;
    if (!queue.length) updateQueue();
    let opfsRoot = await navigator.storage.getDirectory();
    for (let id of queue) {
        let musicData = musicLibary[id];
        let fileName = musicData.fileName;
        let file = await opfsRoot.getFileHandle(fileName);
        let url = URL.createObjectURL(await file.getFile());
        let picture = musicData.data.tags.picture.fileName;
        picture = await opfsRoot.getFileHandle(picture);
        picture = URL.createObjectURL(await picture.getFile());
        //Make the image the same shape as the rock (mask)
        let canvas = document.createElement("canvas");
        canvas.width = 5000;
        canvas.height = 5000;
        let ctx = canvas.getContext("2d");

        let rockImage = new Image();
        let background = new Image();

        rockImage.src = rockimg.src;
        background.src = picture;
// Draw the album art image
ctx.drawImage(albumArt, 0, 0, canvas.width, canvas.height);

// Create an off-screen canvas for the mask
let maskCanvas = document.createElement('canvas');
maskCanvas.width = canvas.width;
maskCanvas.height = canvas.height;
let maskCtx = maskCanvas.getContext('2d');

// Draw the rock image on the mask canvas
maskCtx.drawImage(rockImage, 0, 0, canvas.width, canvas.height);

// Get the pixel data from the mask canvas
let maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);

// Get the pixel data from the album art image
let albumArtData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Apply the mask to the album art image
for (let i = 0; i < albumArtData.data.length; i += 4) {
    albumArtData.data[i + 3] = maskData.data[i + 3]; // Apply the alpha channel from the mask
}

// Put the masked image back on the main canvas
ctx.putImageData(albumArtData, 0, 0);

// Optionally, set the resulting image as the source of another image element if needed
rockimg.src = canvas.toDataURL();


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
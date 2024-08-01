
window.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector('body');
    body.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    body.addEventListener('drop', async (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        for (const file of files) {
            await handleFile(file);
        }
    });
});
    async function handleFile(file) {
        let opfsRoot = await navigator.storage.getDirectory();
        let jsmediatags = window.jsmediatags;
        var musicLibary = {};
    
        if (localStorage.getItem('musicLibary') === null) {
            localStorage.setItem('musicLibary', JSON.stringify({}));
        } else {
            musicLibary = JSON.parse(localStorage.getItem('musicLibary'));
        }
    
        if (file.type.startsWith("audio/")) {
            let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            let extension = file.name.split('.').pop();
            let fileName = `${id}.${extension}`;
            await makeFile(opfsRoot, fileName, file.type, file);
            console.log(`File ${fileName} was successfully saved.`);
            
            jsmediatags.read(file, {
                onSuccess: function(tag) {
                    let picture = tag.tags?.picture;
                    if (picture) {
                        let blob = new Blob([picture.data], { type: picture.format });
                        let pictureFileName;
    
                        if (picture.format == "image/jpeg") {
                            pictureFileName = `${id}.jpg`;
                        } else if (picture.format == "image/png") {
                            pictureFileName = `${id}.png`;
                        }
    
                        makeFile(opfsRoot, pictureFileName, picture.format, blob);
                        tag.tags.picture.fileName = pictureFileName;
                        tag.tags.picture.data = null;
                    }
    
                    musicLibary[id] = {
                        fileName: fileName,
                        fileType: file.type,
                        data: tag,
                    };
                    console.log(tag);
                    localStorage.setItem('musicLibary', JSON.stringify(musicLibary));
                },
                onError: function(error) {
                    console.log(error);
                    musicLibary[id] = {
                        fileName: fileName,
                        fileType: file.type,
                        data: null,
                    };
                    localStorage.setItem('musicLibary', JSON.stringify(musicLibary));
                }
            });
            console.log(musicLibary);
        } else {
            console.log(`File ${file.name} is not an audio file. It is a ${file.type} file.`);
        }
    }
    

async function makeFile(opfsRoot, fileName, fileType, content) {
    let currentFolder;
    try {
        if (fileName.includes("/")) {
            let fileParts = fileName.split("/");
            // Remove the last part
            fileName = fileParts.pop();
            currentFolder = opfsRoot;
            for (let filePart of fileParts) {
                try {
                    currentFolder = await currentFolder.getDirectoryHandle(filePart, { create: true });
                } catch (error) {
                    console.error("ERROR: Could not get dorectory handle. " + error);
                }
            }
        } else {
            currentFolder = opfsRoot;
        }
  
        // Get a handle to the file
        let fileHandle;
        try {
            fileHandle = await currentFolder.getFileHandle(fileName, { create: true });
        } catch (error) {
            console.error("ERROR: Could not get file handle. " + error);
            return; // Exit if we can't get a file handle
        }
  
        // Get a writable stream
        let writable;
        try {
            writable = await fileHandle.createWritable();
        } catch (error) {
            console.error("ERROR: Could not create writeable stream. " + error);
            return; // Exit if we can't create a writable stream
        }
  
        // Write to the file
        try {
            if (content instanceof Blob) {
                await writable.write(content);
            } else {
                await writable.write(new Blob([content], { type: fileType }));
            }
        } catch (error) {
            console.error("ERROR: Could not write to file: " + error);
        } finally {
            // Always attempt to close the writable stream
            try {
                await writable.close();
            } catch (error) {
                console.error("ERROR: Could not close writable stream: " + error);
            }
        }
  
        // Return the file handle
        return fileHandle;
    } catch (error) {
        console.error("Unexpected error: " + error);
    }
  }
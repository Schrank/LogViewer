const fs = require('fs');
const Tail = require('tail').Tail;
const settings = require('electron-settings');
const electron = require('electron');
const remote = require('electron').remote;

let currentFile = '';
let focusOnWrite = false;
let tails = [];

document.addEventListener('DOMContentLoaded', function () {
    showWatchedFiles();
    watchFilesAndUpdateList();
});

function watchFilesAndUpdateList() {
    const logFilesToWatch = settings.getSync('configFilesToWatch');

    tails.forEach(function (tail) {
        tail.unwatch();
    });
    tails = [];

    logFilesToWatch.forEach(logFile => {
        const tail = new Tail(logFile);
        tail.on("line", function (data) {
            if (focusOnWrite) {
                focus();
            }
            const list = $('#list');
            if (logFile != currentFile) {
                list.append('<li class="filename">==&gt; ' + logFile + ' &lt;==</li>');
                currentFile = logFile;
            }
            list.append('<li class="entry">' + data + '</li>');
        }.bind(logFile));
        tails.push(tail);
    });
}

electron.ipcRenderer.on('filesToWatchUpdated', () => {
    watchedFilesUpdated();
});

electron.ipcRenderer.on('focusOnWrite', (e, newFocusOnWrite) => {
    focusOnWrite = newFocusOnWrite;
});

document.ondragover = (ev) => {
    ev.preventDefault()
};

document.ondrop = (ev) => {
    ev.preventDefault();

    const size = ev.dataTransfer.files.length;
    let filesAndDirectories = [];
    for (let i = 0; i < size; i++) {
        filesAndDirectories.push(ev.dataTransfer.files[i].path);
    }

    const oldFilesAndDirectories = settings.getSync('configFilesToWatch');
    settings.setSync('configFilesToWatch', [...new Set(oldFilesAndDirectories.concat(filesAndDirectories))]);
    watchedFilesUpdated();
};

function showWatchedFiles() {
    const list = $('#list');
    const logFilesToWatch = settings.getSync('configFilesToWatch');

    if (!logFilesToWatch.length) {
        list.append('<li class="notice">Not watching any files currently.</li>');
        return;
    }

    list.append('<li class="notice">Click to stop watching</li>');
    logFilesToWatch.forEach(logFile => {
        list.append('<li class="watching" data-file="' + logFile + '">' + logFile + '</li>');
    });
    const wachtedFilesNodes = $('li.watching');
    wachtedFilesNodes.off();
    wachtedFilesNodes.click(e => {
        settings.setSync('configFilesToWatch', $.grep(settings.getSync('configFilesToWatch'), file => {
            return file != $(e.target).data('file')
        }));
        watchedFilesUpdated();
    });
}

const watchedFilesUpdated = () => {
    showWatchedFiles();
    watchFilesAndUpdateList();
    currentFile = '';
};

const focus = () => {
    remote.getCurrentWindow().focus();
    $('body').addClass('blink');
    setTimeout(() => {
        $('body').removeClass('blink');
    }, 1000);
};

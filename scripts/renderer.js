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

    logFilesToWatch.forEach(logFile => {
        tails.forEach(function (tail) {
            tail.unwatch();
        });
        tails = [];
        const tail = new Tail(logFile);

        tails.push(tail.on("line", function (data) {
                if (focusOnWrite) {
                    remote.getCurrentWindow().focus();
                }
                const list = $('#list');
                if (logFile != currentFile) {
                    list.append('<li class="filename">==&gt; ' + logFile + ' &lt;==</li>');
                    currentFile = logFile;
                }
                list.append('<li class="entry">' + data + '</li>');
            }.bind(logFile))
        );
    });
}

electron.ipcRenderer.on('filesToWatchUpdated', () => {
    watchFilesAndUpdateList();
    showWatchedFiles();
});

electron.ipcRenderer.on('focusOnWrite', (e, newFocusOnWrite) => {
    focusOnWrite = newFocusOnWrite;
});

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
        showWatchedFiles();
    });
}

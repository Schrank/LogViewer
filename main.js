const {app, BrowserWindow, Menu, dialog} = require('electron');
const settings = require('electron-settings');

let win;

settings.defaults({
    configFilesToWatch: []
});
settings.applyDefaultsSync();

function createWindow() {
    win = new BrowserWindow({width: 800, height: 600, title: "LogViewer"});
    win.loadURL(`file://${__dirname}/index.html`);
    createMenu();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

function createMenu() {
    const template = [
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Add',
                    accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
                    click: () => {
                        dialog.showOpenDialog(win, {
                            properties: ['openFile', 'multiSelections'],
                            'buttonLabel': 'Add logfiles to watcher',
                            'title': 'Choose logfiles and log directories'
                        }, filesAndDirectories => {
                            if (!filesAndDirectories) {
                                return;
                            }
                            addNewLogfiles(filesAndDirectories);
                        });
                    }
                },
                {
                    role: 'undo'
                },
                {
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'cut'
                },
                {
                    role: 'copy'
                },
                {
                    role: 'paste'
                },
                {
                    role: 'pasteandmatchstyle'
                },
                {
                    role: 'delete'
                },
                {
                    role: 'selectall'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Focus on file change',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
                    type: 'checkbox',
                    checked: false,
                    click (item) {
                        win.webContents.send('focusOnWrite', item.checked);
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click (item, focusedWindow) {
                        if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                    }
                },
                {
                    type: 'separator'
                },
                {
                    role: 'togglefullscreen'
                }
            ]
        },
        {
            role: 'window',
            submenu: [
                {
                    role: 'minimize'
                },
                {
                    role: 'close'
                }
            ]
        },
        {
            role: 'help'
        }
    ];

    if (process.platform === 'darwin') {
        const name = app.getName();
        template.unshift({
            label: name,
            submenu: [
                {
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                }
            ]
        });
        template[1].submenu.push(
            {
                type: 'separator'
            },
            {
                label: 'Speech',
                submenu: [
                    {
                        role: 'startspeaking'
                    },
                    {
                        role: 'stopspeaking'
                    }
                ]
            }
        );
        template[3].submenu = [
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Zoom',
                role: 'zoom'
            },
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        ]
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

const addNewLogfiles = (filesAndDirectories) => {
    const oldFilesAndDirectories = settings.getSync('configFilesToWatch');
    settings.setSync('configFilesToWatch', [...new Set(oldFilesAndDirectories.concat(filesAndDirectories))]);
    win.webContents.send('filesToWatchUpdated');
};

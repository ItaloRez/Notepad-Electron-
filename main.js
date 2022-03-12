const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron')
const fs = require('fs')
const path = require('path')

//JANELA PRINCIPAL
var win = null
async function createWindow(){
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "white",
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false
    }
  })


  await win.loadFile('src/pages/editor/index.html')
  createNewFile()

  ipcMain.on('update-content', (e, data) => {
    file.content = data
  })
}

//ARQUIVO
var file = {}

//CRIAR NOVO ARQUIVO
function createNewFile(){
  file = {
    name: 'novo-arquivo.txt',
    content: '',
    saved: false,
    path: app.getPath('documents')+'/novo-arquivo.txt'
  }
  
  win.webContents.send('set-file', file)
}

//SALVA ARQUIVO NO DISCO
function writeFile(filePath){
  try{
    fs.writeFile(filePath, file.content, (e) => {
      if(e) throw e

      file.path = filePath
      file.saved = true
      file.name = path.basename(filePath)

      win.webContents.send('set-file', file)
    })
  }catch(e){
    console.log(e)
  }
}


//SALVAR COMO
async function saveFileAs(){
  //DIALOG
  let dialogFile = await dialog.showSaveDialog({
    defaultPath: file.path,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  //VERIFICAR CANCELAMENTO
  if(dialogFile.canceled){
    return false
  }

  //SALVAR ARQUIVO
  writeFile(dialogFile.filePath)
}

//SALVAR
function saveFile(){
  //SAVE
  if(file.saved){
    return writeFile(file.path)
  }

  //SALVAR COMO
  else return saveFileAs()
}

// LER ARQUIVO
function readFile(filePath){
  try{
    return fs.readFileSync(filePath, 'utf8')
  }catch(e){
    console.log(e)
    return ''
  }   
}

//ABRIR ARQUIVO
async function openFile(){
  //DIALOGO
  let dialogFile = await dialog.showOpenDialog({
    defaultPath: file.path,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  //VERIFICAR CANCELAMENTO
  if(dialogFile.canceled) return false

  //ABRIR O ARQUIVO
  file = {
    name: path.basename(dialogFile.filePaths[0]),
    content: readFile(dialogFile.filePaths[0]),
    saved: 'true',
    path: dialogFile.filePaths[0]
  }

  win.webContents.send('set-file', file)
}

//TEMPLATE MENU
const templateMenu = [
  {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Novo',
        accelerator: 'CmdOrCtrl+N',
        click(){
          createNewFile()
        }
      },
      {
        label: 'Abrir',
        accelerator: 'CmdOrCtrl+O',
        click(){
          openFile()
        }
      },
      {
        label: 'Salvar',
        accelerator: 'CmdOrCtrl+S',
        click(){
          saveFile()
        }
      },
      {
        label: 'Salvar Como',
        accelerator: 'CmdOrCtrl+Shift+S',
        click(){
          saveFileAs()
        }
      },
      {
        label: 'Fechar',
        role: process.platform === 'darwin' ? 'close' : 'quit'
      }
    ],
  },
  {
    label: 'Editar',
    submenu: [
      {
        label: 'Desfazer',
        role: 'undo'
      },
      {
        label: 'Refazer',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Copiar',
        role: 'copy'
      },
      {
        label: 'Colar',
        role: 'paste'
      },
      {
        label: 'Cortar',
        role: 'cut'
      },
    ]
  },
  {
    label: 'Ajuda',
    submenu: [
      {
        label: 'README Github',
        click(){
          shell.openExternal('https://github.com/')
        }
      }
    ]
  }
]

//MENU
const menu = Menu.buildFromTemplate(templateMenu)
Menu.setApplicationMenu(menu)

//ON READY
app.whenReady()
  .then(() => {
      createWindow()
    }
  )

//ACTIVATE
app.on('activate', () => {
  if(BrowserWindow.getAllWindows().length === 0){
    createWindow()
  }
})


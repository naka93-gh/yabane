import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDatabase, closeDatabase } from './database'
import { registerProjectHandlers } from './ipc/project'
import { registerPurposeHandlers } from './ipc/purpose'
import { registerMilestoneHandlers } from './ipc/milestone'
import { registerArrowHandlers } from './ipc/arrow'
import { registerWbsHandlers } from './ipc/wbs'
import { registerIssueHandlers } from './ipc/issue'
import { registerMemberHandlers } from './ipc/member'
import { registerExportHandlers } from './ipc/export'
import { registerImportHandlers } from './ipc/import'

/** メインウィンドウを作成する */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yabane')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // DB 初期化
  getDatabase()

  // IPC ハンドラ登録
  registerProjectHandlers()
  registerPurposeHandlers()
  registerMilestoneHandlers()
  registerArrowHandlers()
  registerWbsHandlers()
  registerIssueHandlers()
  registerMemberHandlers()
  registerExportHandlers()
  registerImportHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDatabase()
})

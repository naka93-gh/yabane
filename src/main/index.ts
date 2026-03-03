import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, screen, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { closeDatabase, getDatabase } from './database'
import { registerArrowHandlers } from './ipc/arrow'
import { registerExportHandlers } from './ipc/export'
import { registerImportHandlers } from './ipc/import'
import { registerIssueHandlers } from './ipc/issue'
import { registerIssueCommentHandlers } from './ipc/issue-comment'
import { registerIssueTagHandlers } from './ipc/issue-tag'
import { registerMemberHandlers } from './ipc/member'
import { registerMilestoneHandlers } from './ipc/milestone'
import { registerProjectHandlers } from './ipc/project'
import { registerPurposeHandlers } from './ipc/purpose'
import { registerWbsHandlers } from './ipc/wbs'

/** メインウィンドウを作成する */
function createWindow(): void {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize
  const width = Math.round(screenW * 0.8)
  const height = Math.round(screenH * 0.8)

  const mainWindow = new BrowserWindow({
    width,
    height,
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

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yabane')

  // F12 でDevTools等の開発用ショートカットを有効にする
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

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
  registerIssueCommentHandlers()
  registerIssueTagHandlers()
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

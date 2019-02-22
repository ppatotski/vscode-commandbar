const vscode = require('vscode')
const childProcess = require('child_process')
const kill = require('tree-kill')
const fs = require('fs')
const path = require('path')
const strip = require('strip-json-comments')

const statusBarItems = {}
let currentFolder
const exampleJson = `{
  "skipTerminateQuickPick": true,
  "skipSwitchToOutput": false,
  "skipErrorMessage": true,
  "commands": [
    {
      "text": "☯ Serve",
      "tooltip": "Serve UI",
      "color": "yellow",
      "command": "npm run serve",
      "alignment": "left",
      "skipTerminateQuickPick": false,
      "priority": 0
    }
  ]
}`

const variableRegEx = /\$\{(.*?)\}/g
const resolveVariablesFunctions = {
  env: (name) => process.env[name.toUpperCase()],
  cwd: () => process.cwd(),
  workspaceRoot: () => getWorkspaceFolder(),
  workspaceFolder: () => getWorkspaceFolder(),
  workspaceRootFolderName: () => path.basename(getWorkspaceFolder()),
  workspaceFolderBasename: () => path.basename(getWorkspaceFolder()),
  lineNumber: () => vscode.window.activeTextEditor.selection.active.line,
  selectedText: () => vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection),
  file: () => vscode.window.activeTextEditor.document.fileName,
  fileDirname: () => path.dirname(vscode.window.activeTextEditor.document.fileName),
  fileExtname: () => path.extname(vscode.window.activeTextEditor.document.fileName),
  fileBasename: () => path.basename(vscode.window.activeTextEditor.document.fileName),
  fileBasenameNoExtension: () => {
    const basename = path.basename(vscode.window.activeTextEditor.document.fileName)
    return basename.slice(0, basename.length - path.extname(basename).length)
  },
  execPath: () => process.execpath
}

const resolveVariables = function resolveVariables (commandLine) {
  return commandLine.replace(variableRegEx, function replaceVariable (match, variableValue) {
    const [variable, argument] = variableValue.split(':')
    const resolver = resolveVariablesFunctions[variable]
    if (!resolver) throw new Error(`Variable ${variable} not found!`)

    return resolver(argument)
  })
}

function readSettings (context, done) {
  const homePath = path.dirname(context.extensionPath)
  fs.readFile(path.join(homePath, 'commandbar.json'), (err, buffer) => {
    let combinedSettings = {}
    let commands = []
    if (!err) {
      combinedSettings = JSON.parse(strip(buffer.toString()))
      commands = combinedSettings.commands
    }
    const workspaceFolder = getWorkspaceFolder()

    if (workspaceFolder) {
      fs.readFile(path.join(workspaceFolder, '.vscode', 'commandbar.json'), (err, buffer) => {
        if (!err) {
          const settings = JSON.parse(strip(buffer.toString()))
          combinedSettings = {
            ...combinedSettings,
            ...settings
          }
          commands = [ ...commands, ...settings.commands ]
        }
        done({ ...combinedSettings, commands })
      })
    } else {
      done({ ...combinedSettings, commands })
    }
  })
}

function getWorkspaceFolder (activeTextEditor = vscode.window.activeTextEditor) {
  let folder
  if (vscode.workspace) {
    if (vscode.workspace.workspaceFolders.length === 1) {
      folder = vscode.workspace.workspaceFolders[0].uri.fsPath
    } else if (activeTextEditor) {
      const folderObject = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri)
      if (folderObject) {
        folder = folderObject.uri.fsPath
      } else {
        folder = currentFolder
      }
    } else if (vscode.workspace.workspaceFolders.length > 0) {
      folder = vscode.workspace.workspaceFolders[0].uri.fsPath
    }
  }
  return folder
}

function isWorkspaceChanged (activeTextEditor) {
  const newFolder = getWorkspaceFolder(activeTextEditor)
  return currentFolder !== newFolder || (!currentFolder && !newFolder)
}

function getCurrentItemsKey () {
  return getWorkspaceFolder() || 'globalOnly'
}

function getCurrentItems () {
  const workspaceKey = getCurrentItemsKey()
  if (!statusBarItems[workspaceKey]) {
    statusBarItems[workspaceKey] = {}
  }
  return statusBarItems[workspaceKey]
}

function clearItems () {
  Object.keys(statusBarItems).forEach(key => {
    const items = statusBarItems[key]
    Object.keys(items).forEach(key => {
      items[key].hide()
    })
  })
}

function destroyItems () {
  Object.keys(statusBarItems).forEach(key => {
    const items = statusBarItems[key]
    Object.keys(items).forEach(key => {
      if (items[key].process) {
        kill(items[key].process.pid)
      }
    })
  })
}

function activate (context) {
  try {
    const homePath = path.dirname(context.extensionPath)
    let workspaceSettings = false
    let settingsPath = path.join(homePath, 'commandbar.json')
    const vsSettingsCommand = vscode.commands.registerCommand('extension.commandbar.settings', () => {
      fs.stat(settingsPath, (err) => {
        if (!err && workspaceSettings) {
          vscode.workspace.openTextDocument(settingsPath).then(doc => {
            vscode.window.showTextDocument(doc)
          })
        } else {
          const options = []
          if (vscode.workspace && getWorkspaceFolder()) {
            options.push('Create Workspace Settings')
          }
          if (err) {
            options.push('Create Global Settings')
          } else {
            options.push('Open Global Settings')
          }
          options.push('Cancel')

          vscode.window.showQuickPick(options)
            .then((option) => {
              if (option === 'Create Workspace Settings') {
                settingsPath = path.join(getWorkspaceFolder(), '.vscode', 'commandbar.json')
              }
              if (option === 'Create Workspace Settings' || option === 'Create Global Settings') {
                vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${settingsPath}`)).then(doc => {
                  vscode.window.showTextDocument(doc).then((editor) => {
                    editor.edit(edit => {
                      edit.insert(new vscode.Position(0, 0), exampleJson)
                    })
                  })
                })
              } else if (option === 'Open Global Settings') {
                vscode.workspace.openTextDocument(settingsPath).then(doc => {
                  vscode.window.showTextDocument(doc)
                })
              }
            })
        }
      })
    })
    context.subscriptions.push(vsSettingsCommand)
    const channel = vscode.window.createOutputChannel('Commandbar')
    let commandIndex = 0
    let settings
    const refreshCommands = function refreshCommands (hard = false, activeTextEditor, done) {
      if (!hard) {
        if (!isWorkspaceChanged(activeTextEditor)) {
          if (done) {
            done()
          }
          return
        } else {
          currentFolder = getWorkspaceFolder(activeTextEditor)
        }
      }
      clearItems()
      const currentItems = getCurrentItems()
      readSettings(context, (settings) => {
        settings.commands.forEach((command) => {
          const commandId = command.text
          if (currentItems[commandId] && !hard) {
            currentItems[commandId].show()
          } else {
            commandIndex += 1
            const commandRegisteredId = `extension.commandbar.command_${commandIndex}`
            const alignment = command.alignment === 'right' ? vscode.StatusBarAlignment.Right : vscode.StatusBarAlignment.Left
            const statusBarItem = vscode.window.createStatusBarItem(alignment, command.priority)
            const inProgress = `${command.text} (in progress)`
            const skipSwitchToOutput = command.skipSwitchToOutput === undefined ? settings.skipSwitchToOutput : command.skipSwitchToOutput
            const skipTerminateQuickPick = command.skipTerminateQuickPick === undefined ? settings.skipTerminateQuickPick : command.skipTerminateQuickPick
            const skipErrorMessage = command.skipErrorMessage === undefined ? settings.skipErrorMessage : command.skipErrorMessage

            statusBarItem.text = command.text
            statusBarItem.tooltip = command.tooltip
            statusBarItem.color = command.color
            statusBarItem.command = commandRegisteredId
            statusBarItem.show()
            currentItems[commandId] = statusBarItem
            context.subscriptions.push(statusBarItem)

            const vsCommand = vscode.commands.registerCommand(commandRegisteredId, () => {
              const showOutput = function showOutput () {
                if (!skipSwitchToOutput) {
                  channel.show()
                }
              }
              const executeCommand = function executeCommand () {
                const exec = function exec (commandContent) {
                  try {
                    const process = childProcess.exec(resolveVariables(commandContent), { cwd: getWorkspaceFolder(), maxBuffer: 1073741824 }, (err) => {
                      statusBarItem.text = command.text
                      statusBarItem.process = undefined
                      if (!statusBarItem.aboutToBeKilled) {
                        if (!skipErrorMessage && err) {
                          vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message} (see output for details)`)
                        }
                        showOutput()
                      }
                      statusBarItem.aboutToBeKilled = false
                    })
                    process.stdout.on('data', data => channel.append(data))
                    process.stderr.on('data', data => channel.append(data))
                    statusBarItem.process = process
                  } catch (err) {
                    vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message} (see output for details)`)
                    channel.append(err.toString())
                    showOutput()
                  }
                }

                if (command.commandType === 'script') {
                  exec(`npm run ${command.command}`)
                } else if (command.commandType === 'palette') {
                  const executeNext = function executeNext (palette, index) {
                    try {
                      let [cmd, ...args] = palettes[index].split('|')
                      if (args) args = args.map(arg => resolveVariables(arg))
                      vscode.commands.executeCommand(cmd, ...args).then(() => {
                        index += 1
                        if (index < palettes.length) {
                          executeNext(palettes, index)
                        }
                      }, (err) => {
                        vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message}`)
                      })
                    } catch (err) {
                      vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message} (see output for details)`)
                      channel.append(err.toString())
                      showOutput()
                    }
                  }
                  const palettes = command.command.split(',')
                  executeNext(palettes, 0)
                } else {
                  exec(command.command)
                }
              }

              if (command.commandType === 'file') {
                const openFile = function openFile (filePath) {
                  try {
                    const rawPath = resolveVariables(filePath)
                    const uri = vscode.Uri.parse(rawPath)
                    if (uri.scheme) {
                      vscode.commands.executeCommand('vscode.open', uri)
                    } else {
                      let file = rawPath
                      if (file[0] === '~') {
                        file = file.replace('~', homePath)
                      } else if (file[0] === '.') {
                        file = file.replace('.', getWorkspaceFolder())
                      }
                      vscode.workspace.openTextDocument(file).then(doc => {
                        vscode.window.showTextDocument(doc)
                      })
                    }
                  } catch (err) {
                    vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message} (see output for details)`)
                    channel.append(err.toString())
                    showOutput()
                  }
                }
                if (command.command) {
                  let files = command.command.split(',').map(file => file.split('|'))
                  if (files.length > 1) {
                    if (!getWorkspaceFolder()) {
                      files = files.filter(file => file[0][0] !== '.')
                    }
                    vscode.window.showQuickPick(files.map(file => file.length > 1 ? file[1] : file[0]))
                      .then((label) => {
                        openFile(files.find(file => file.length > 1 ? file[1] === label : file[0] === label)[0])
                      })
                  } else {
                    openFile(files[0][0])
                  }
                }
              } else {
                if (statusBarItem.process) {
                  if (!skipTerminateQuickPick) {
                    const options = ['Terminate', 'Terminate and Execute', 'Execute without terminating already running command', 'Cancel']

                    vscode.window.showQuickPick(options)
                      .then((option) => {
                        if (option === options[0]) {
                          statusBarItem.aboutToBeKilled = true
                          kill(statusBarItem.process.pid, 'SIGTERM', () => {
                            channel.appendLine('Terminated!')
                            statusBarItem.process = undefined
                            statusBarItem.text = command.text
                          })
                        } else if (option === options[1]) {
                          statusBarItem.aboutToBeKilled = true
                          kill(statusBarItem.process.pid, 'SIGTERM', () => {
                            statusBarItem.text = inProgress
                            showOutput()
                            channel.clear()
                            channel.appendLine(`Execute '${command.text}' command...`)
                            executeCommand()
                          })
                        } else if (option === options[2]) {
                          channel.clear()
                          channel.appendLine(`Execute '${command.text}' command...`)
                          statusBarItem.process = undefined
                          executeCommand()
                          statusBarItem.text = inProgress
                          showOutput()
                        }
                      })
                  } else {
                    statusBarItem.aboutToBeKilled = true
                    kill(statusBarItem.process.pid, 'SIGTERM', () => {
                      channel.appendLine('Terminated!')
                      statusBarItem.process = undefined
                      statusBarItem.text = command.text
                    })
                  }
                } else {
                  if (command.commandType !== 'palette') {
                    channel.clear()
                    channel.appendLine(`Execute '${command.text}' command...`)
                    executeCommand()
                    statusBarItem.text = inProgress
                    showOutput()
                  } else {
                    executeCommand()
                  }
                }
              }
            })
            context.subscriptions.push(vsCommand)
          }
        })
        if (done) {
          done()
        }
      })
    }
    vscode.window.onDidChangeActiveTextEditor((event) => {
      if (event) {
        refreshCommands(false, event, () => {
          if (settings) {
            settings.commands.forEach(command => {
              const currentItems = getCurrentItems()
              if (command.language) {
                let statusBarItem
                Object.keys(currentItems).forEach((key) => {
                  if (currentItems[key].text === command.text) {
                    statusBarItem = currentItems[key]
                  }
                })
                vscode.languages.match({ language: command.language }, event.document)
                if (vscode.languages.match({ language: command.language }, event.document)) {
                  statusBarItem.show()
                } else {
                  statusBarItem.hide()
                }
              }
            })
          }
        })
      }
    })
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const workspacePath = path.join(getWorkspaceFolder(), '.vscode', 'commandbar.json')
      if (vscode.languages.match({ pattern: workspacePath }, doc)) {
        refreshCommands(true)
      }
    })
    if (vscode.workspace && getWorkspaceFolder()) {
      const workspacePath = path.join(getWorkspaceFolder(), '.vscode', 'commandbar.json')
      fs.stat(workspacePath, (err) => {
        if (!err) {
          settingsPath = workspacePath
          workspaceSettings = true
        }
        refreshCommands()
      })
    } else {
      refreshCommands()
    }
  } catch (err) {
    console.error(err)
  }
}

exports.activate = activate

function deactivate () {
  destroyItems()
}

exports.deactivate = deactivate

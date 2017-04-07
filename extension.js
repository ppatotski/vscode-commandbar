'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const childProcess = require( 'child_process' ); // execute command line
const kill = require( 'tree-kill' ); // kill process tree
const fs = require('fs'); // File system

const statusBarItems = {};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    try {
        // THIS IS GOING TO BE DRAMATICALLY REFACTORED
        if(vscode.workspace.rootPath) {
            const settingsPath = `${vscode.workspace.rootPath}/.vscode/commandbar.json`;
            const channel = vscode.window.createOutputChannel('Commandbar');
        
            fs.exists(settingsPath, (exist) => {
                if(exist) {
                    fs.readFile(settingsPath, (err, buffer) => {
                        const settings = JSON.parse(buffer);
                        settings.commands.forEach( (command) => {
                            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
                            const commandId = `extension.commandbar.${command.id}`;
                            const inProgress = `${command.text} (in progress)`;
                            statusBarItem.text = command.text;
                            statusBarItem.tooltip = command.tooltip;
                            statusBarItem.color = command.color;
                            statusBarItem.command = commandId;
                            statusBarItem.show();
                            statusBarItems[commandId] = statusBarItem;
                            
                            const disposableCommand = vscode.commands.registerCommand(commandId, () => {
                                let process = statusBarItems[commandId].process;

                                const executeCommand = function executeCommand(channel, statusBarItem, command) {
                                    process = childProcess.exec(command.command, { cwd: vscode.workspace.rootPath }, () => {
                                        statusBarItem.text = command.text;
                                    });
                                    process.stdout.on('data', data => channel.append(data));
                                    process.stderr.on('data', data => channel.append(data));
                                    return process
                                }

                                if(process) {
                                    vscode.window.showQuickPick(['Terminate and Execute', 'Terminate', 'Execute', 'Cancel'])
                                        .then((option) => {
                                            if(option === 'Terminate and Execute') {
                                                kill(process.pid, 'SIGTERM', () => statusBarItem.text = inProgress);
                                                channel.appendLine('Terminated!');
                                                channel.show();
                                                channel.appendLine(`Execute '${command.id}' command...`);
                                                process = executeCommand(channel, statusBarItem, command);
                                            } else if (option === 'Terminate') {
                                                kill( process.pid );
                                                channel.appendLine('Terminated!');
                                                process = undefined;
                                                statusBarItem.text = command.text;
                                            } else if (option === 'Execute') {
                                                channel.appendLine(`Execute '${command.id}' command...`);
                                                process = undefined;
                                                process = executeCommand(channel, statusBarItem, command);
                                                statusBarItem.text = inProgress;
                                                channel.show();
                                            }
                                            statusBarItems[commandId].process = process;
                                        });
                                } else {
                                    channel.appendLine(`Execute '${command.id}' command...`);
                                    process = executeCommand(channel, statusBarItem, command);
                                    statusBarItem.text = inProgress;
                                    channel.show();
                                    statusBarItems[commandId].process = process;
                                }
                            });
                            context.subscriptions.push(statusBarItem);
                            context.subscriptions.push(disposableCommand);
                        });
                    });
                }
            });
        }
    } catch(err) {
        console.log(err);
    }

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
    Object.keys(statusBarItems).forEach( (key) => {
        if(statusBarItems[key].process) kill(statusBarItems[key].process.pid);
    });
}

exports.deactivate = deactivate;

'use strict';
const vscode = require('vscode');
const childProcess = require( 'child_process' );
const kill = require( 'tree-kill' );
const fs = require('fs');

const statusBarItems = {};

function activate(context) {
    try {
        if(vscode.workspace.rootPath) {
            const settingsPath = `${vscode.workspace.rootPath}/.vscode/commandbar.json`;
            const channel = vscode.window.createOutputChannel('Commandbar');
        
            fs.exists(settingsPath, (exist) => {
                if(exist) {
                    fs.readFile(settingsPath, (err, buffer) => {
                        if(err) {
                            console.error(err);
                        } else {
                            const settings = JSON.parse(buffer);
                            settings.commands.forEach( (command) => {
                                const statusBarItem = vscode.window.createStatusBarItem(command.alignment === 'right'? vscode.StatusBarAlignment.Right: vscode.StatusBarAlignment.Left, command.priority);
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

                                    const executeCommand = function executeCommand() {
                                        process = childProcess.exec(command.command, { cwd: vscode.workspace.rootPath }, () => {
                                            statusBarItem.text = command.text;
                                        });
                                        process.stdout.on('data', data => channel.append(data));
                                        process.stderr.on('data', data => channel.append(data));
                                        return process
                                    }

                                    if(process) {
                                        if(!command.skipTerminateQuickPick) {
                                            const options = ['Terminate and Execute', 'Terminate', 'Execute', 'Cancel'];

                                            vscode.window.showQuickPick(options)
                                                .then((option) => {
                                                    if(option === options[0]) {
                                                        kill(process.pid, 'SIGTERM', () => statusBarItem.text = inProgress);
                                                        channel.appendLine('Terminated!');
                                                        channel.show();
                                                        channel.appendLine(`Execute '${command.id}' command...`);
                                                        process = executeCommand();
                                                    } else if (option === options[1]) {
                                                        kill( process.pid );
                                                        channel.appendLine('Terminated!');
                                                        process = undefined;
                                                        statusBarItem.text = command.text;
                                                    } else if (option === options[2]) {
                                                        channel.appendLine(`Execute '${command.id}' command...`);
                                                        process = undefined;
                                                        process = executeCommand();
                                                        statusBarItem.text = inProgress;
                                                        channel.show();
                                                    }
                                                    statusBarItems[commandId].process = process;
                                                });
                                        } else {
                                            kill( process.pid );
                                            channel.appendLine('Terminated!');
                                            process = undefined;
                                            statusBarItem.text = command.text;
                                        }
                                    } else {
                                        channel.appendLine(`Execute '${command.id}' command...`);
                                        process = executeCommand();
                                        statusBarItem.text = inProgress;
                                        channel.show();
                                        statusBarItems[commandId].process = process;
                                    }
                                });
                                context.subscriptions.push(statusBarItem);
                                context.subscriptions.push(disposableCommand);
                            });
                        }
                    });
                    
                }
                
            });
            
        }
    } catch(err) {
        console.error(err);
    }
}
exports.activate = activate;

function deactivate() {
    Object.keys(statusBarItems).forEach( (key) => {
        if(statusBarItems[key].process) kill(statusBarItems[key].process.pid);
    });
}

exports.deactivate = deactivate;

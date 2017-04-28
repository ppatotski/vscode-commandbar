'use strict';
const vscode = require('vscode');
const childProcess = require( 'child_process' );
const kill = require( 'tree-kill' );
const fs = require('fs');
const path = require('path');

const statusBarItems = {};
const createNewMessage = 'Settings file had been created. Update wont take effect until restart vscode';
const exampleJson = `{
	"commands": [
		{
			"text": "❊ Serve",
			"tooltip": "Serve UI",
			"color": "yellow",
			"command": "npm run serve",
			"alignment": "left",
			"skipTerminateQuickPick": false,
			"priority": 0
		}
	]
}`;

function activate(context) {
	try {
		if(vscode.workspace.rootPath) {
			const settingsPath = path.join(vscode.workspace.rootPath, '.vscode', 'commandbar.json');
			const channel = vscode.window.createOutputChannel('Commandbar');
			const vsSettingsCommand = vscode.commands.registerCommand('extension.commandbar.settings', () => {
				fs.stat(settingsPath, (err) => {
					if(!err) {
						vscode.workspace.openTextDocument(settingsPath).then(doc => {
							vscode.window.showTextDocument(doc);
						});
					} else {
						const options = ['Create New', 'Cancel'];

						vscode.window.showQuickPick(options)
							.then((option) => {
								if(option === options[0]) {
									vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${settingsPath}`)).then(doc => {
										vscode.window.showTextDocument(doc).then((editor) => {
											editor.edit(edit => {
												edit.insert(new vscode.Position(0, 0), exampleJson);
												vscode.window.showInformationMessage(createNewMessage);
											});
										});
									});
								}
							});
					}
				});
			});
			fs.stat(settingsPath, (err) => {
				if(!err) {
					fs.readFile(settingsPath, (err, buffer) => {
						if(err) {
							console.error(err);
						} else {
							const settings = JSON.parse(buffer);
							let commandIndex = 0;
							settings.commands.forEach( (command) => {
								commandIndex += 1;
								const alignment = command.alignment === 'right'? vscode.StatusBarAlignment.Right: vscode.StatusBarAlignment.Left;
								const statusBarItem = vscode.window.createStatusBarItem(alignment, command.priority);
								const commandId = `extension.commandbar.command_${commandIndex}`;
								const inProgress = `${command.text} (in progress)`;

								statusBarItem.text = command.text;
								statusBarItem.tooltip = command.tooltip;
								statusBarItem.color = command.color;
								statusBarItem.command = commandId;
								statusBarItem.show();
								statusBarItems[commandId] = statusBarItem;
								context.subscriptions.push(statusBarItem);

								if(command.commandType === 'palette') {
									statusBarItem.command = command.command;
								} else {
									const vsCommand = vscode.commands.registerCommand(commandId, () => {
										const executeCommand = function executeCommand() {
											const exec = function exec(commandContent) {
												const process = childProcess.exec(commandContent, { cwd: vscode.workspace.rootPath }, () => {
													statusBarItem.text = command.text;
													statusBarItem.process = undefined;
												});
												process.stdout.on('data', data => channel.append(data));
												process.stderr.on('data', data => channel.append(data));
												statusBarItem.process = process;
											}

											if(command.commandType === 'script') {
												exec(`npm run ${command.command}`);
											} else {
												exec(command.command);
											}
										}

										if(statusBarItem.process) {
											if(!command.skipTerminateQuickPick) {
												const options = ['Terminate', 'Terminate and Execute', 'Execute without terminating already running command', 'Cancel'];

												vscode.window.showQuickPick(options)
													.then((option) => {
														if(option === options[0]) {
															kill(statusBarItem.process.pid, 'SIGTERM', () => {
																channel.appendLine('Terminated!');
																statusBarItem.process = undefined;
																statusBarItem.text = command.text;
															});
														} else if(option === options[1]) {
															kill(statusBarItem.process.pid, 'SIGTERM', () => {
																statusBarItem.text = inProgress;
																channel.appendLine('Terminated!');
																channel.show();
																channel.clear();
																channel.appendLine(`Execute '${command.text}' command...`);
																executeCommand();
															});
														} else if(option === options[2]) {
															channel.clear();
															channel.appendLine(`Execute '${command.text}' command...`);
															statusBarItem.process = undefined;
															executeCommand();
															statusBarItem.text = inProgress;
															channel.show();
														}
													});
											} else {
												kill(statusBarItem.process.pid, 'SIGTERM', () => {
													channel.appendLine('Terminated!');
													statusBarItem.process = undefined;
													statusBarItem.text = command.text;
												});
											}
										} else {
											channel.clear();
											channel.appendLine(`Execute '${command.text}' command...`);
											executeCommand();
											statusBarItem.text = inProgress;
											channel.show();
										}
									});
									context.subscriptions.push(vsCommand);
								}
							});

						}
					});

				}

			});
			context.subscriptions.push(vsSettingsCommand);
		}
	} catch(err) {
		console.error(err);
	}
}

exports.activate = activate;

function deactivate() {
	Object.keys(statusBarItems).forEach((key) => {
		if(statusBarItems[key].process) {
			kill(statusBarItems[key].process.pid);
		}
	});
}

exports.deactivate = deactivate;

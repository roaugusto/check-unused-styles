import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('checkUnusedStyles.check', async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
					const document = editor.document;
					const tsxFilePath = document.uri.fsPath;
					const tsxDirectory = path.dirname(tsxFilePath);
					const stylesFilePath = path.join(tsxDirectory, 'styles.ts');					const styles = analyzeStylesFile(stylesFilePath);
					const unusedStyles = analyzeTsxFile(tsxFilePath, styles);
					showUnusedStyles(unusedStyles);
					deleteUnusedStyles(stylesFilePath, unusedStyles);
			}
	});

	context.subscriptions.push(disposable);
}

export function analyzeStylesFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Expressão regular para encontrar "export const StyleName = ..."
    const regex = /export const (\w+)/g;
    
    let match;
    const styles = new Set<string>();
    while ((match = regex.exec(content)) !== null) {
        styles.add(match[1]);
    }

    return styles;
}


export function analyzeTsxFile(filePath: string, styles: Set<string>) {
	const content = fs.readFileSync(filePath, 'utf8');
	
	const unusedStyles = new Set(styles);

	for (let style of styles) {
			const regex = new RegExp(`\\b${style}\\b`);
			if (regex.test(content)) {
					unusedStyles.delete(style);
			}
	}

	return unusedStyles;
}

export async function deleteUnusedStyles(filePath: string, unusedStyles: Set<string>) {
	const unusedStylesList = Array.from(unusedStyles).join(', ');

	const confirmation = await vscode.window.showWarningMessage(
			'Are you sure you want to delete these unused styles? ' + unusedStylesList, 
			{ modal: true },
			'Yes', 
			'No'
	);

	if (confirmation === 'Yes') {
			let content = fs.readFileSync(filePath, 'utf8');

			for (let style of unusedStyles) {
					const regex = new RegExp(`export const ${style} = styled[\\s\\S]*?\\\`;`, 'm');
					content = content.replace(regex, '');
			}

			fs.writeFileSync(filePath, content);
	}
}

export function showUnusedStyles(unusedStyles: Set<string>) {
	if (unusedStyles.size > 0) {
			vscode.window.showInformationMessage('Find unused styles: ' + Array.from(unusedStyles).join(', '));
	} else {
			vscode.window.showInformationMessage('All styles are being used!');
	}
}

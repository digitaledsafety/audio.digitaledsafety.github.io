const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const filePath = process.argv[3];

if (!command || !filePath) {
    console.log('Usage: node scripts/workspace-tool.js <encode|decode> <file_path>');
    process.exit(1);
}

const fullPath = path.resolve(filePath);

if (command === 'decode') {
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/workspace_data:\s*([A-Za-z0-9+/=]+)/);
    if (match) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        try {
            const json = JSON.parse(decoded);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log(decoded);
        }
    } else {
        console.error('No workspace_data found in file.');
    }
} else if (command === 'encode') {
    const jsonContent = fs.readFileSync(fullPath, 'utf8');
    const encoded = Buffer.from(jsonContent).toString('base64');

    const title = path.basename(filePath, path.extname(filePath))
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const output = `---
layout: default
title: ${title}
workspace_data: ${encoded}
---`;
    console.log(output);
} else {
    console.error('Unknown command:', command);
}

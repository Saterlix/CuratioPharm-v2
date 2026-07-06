const fs = require('fs');
const lines = fs.readFileSync('c:/Users/itsup3/.gemini/antigravity/brain/5b470b1c-219d-49a2-bc92-0c7081fcfd33/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.tool_calls) {
            for (const call of entry.tool_calls) {
                if (call.function?.name === 'default_api:multi_replace_file_content' || call.function?.name === 'default_api:replace_file_content') {
                    let args = JSON.parse(call.function.arguments);
                    if (args.TargetFile && args.TargetFile.includes('AdminPage.jsx')) {
                        console.log('--- FOUND MODIFICATION TO AdminPage.jsx ---');
                        if (args.ReplacementChunks) {
                            for (let i = 0; i < args.ReplacementChunks.length; i++) {
                                console.log(`CHUNK ${i}:`);
                                console.log(args.ReplacementChunks[i].ReplacementContent);
                            }
                        } else if (args.ReplacementContent) {
                            console.log('REPLACEMENT:');
                            console.log(args.ReplacementContent);
                        }
                    }
                }
            }
        }
    } catch (e) {
    }
}

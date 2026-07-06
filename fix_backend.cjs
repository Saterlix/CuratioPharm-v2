const fs = require('fs');

function fixFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    
    // Fix greeting
    content = content.replace(/message:\s*'[^']*Curatio Pharm[^']*'/g, "message: 'Здравствуйте! Я виртуальный помощник Curatio Pharm. Задайте мне вопрос, и я постараюсь помочь. Если потребуется, вы всегда можете связаться с оператором.'");
    
    // Fix fallback AI response
    content = content.replace(/aiText\s*=\s*faqMatch\s*\?\s*faqMatch.answer\s*:\s*'[^']+';/g, "aiText = faqMatch ? faqMatch.answer : 'К сожалению, я не могу ответить на этот вопрос. Пожалуйста, нажмите «Связаться с оператором» для получения помощи от специалиста.';");
    
    // Fix sysMsg switch to operator
    content = content.replace(/message:\s*'[^']*operator[^']*'/g, "message: '🔔 Вы были переключены на оператора. Пожалуйста, подождите — специалист скоро ответит.'");
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed ' + path);
}

fixFile('server.js');
fixFile('api/index.js');

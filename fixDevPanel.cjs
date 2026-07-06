const fs = require('fs');
const path = 'src/pages/DevPanelPage.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowEventModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create">Сохранить</button>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowEventModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create">Сохранить</button>
                                </div>`,
`                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowEventModal(false)} className="btn-cancel">Отмена</button>
                                    <button type="submit" className="btn-create">Сохранить</button>
                                </div>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax error');

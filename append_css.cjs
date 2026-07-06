const fs = require('fs');
const css = `
/* Order Status Badges */
.status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.status-badge.pending { background-color: #fef3c7; color: #d97706; }
.status-badge.processing { background-color: #dbeafe; color: #2563eb; }
.status-badge.shipped { background-color: #fce7f3; color: #db2777; }
.status-badge.delivered { background-color: #d1fae5; color: #059669; }
.status-badge.cancelled { background-color: #fee2e2; color: #dc2626; }
.order-details-info { background: var(--bg-alt); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border); }
.order-details-info p { margin: 8px 0; font-size: 14px; }
.order-actions-left { display: flex; gap: 12px; }
`;

const path = 'src/pages/AdminPage.css';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes('.status-badge.pending')) {
    fs.appendFileSync(path, css, 'utf8');
    console.log('Appended to AdminPage.css');
} else {
    console.log('Already appended');
}

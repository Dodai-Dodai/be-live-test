import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log(vapidKeys);

// file出力する
import fs from 'fs';
fs.writeFileSync('vapidKeys.json', JSON.stringify(vapidKeys, null, 2));

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import webpush from 'web-push';
import dotenv from 'dotenv';



const app = new Hono();
const api = new Hono();

// VAPIDの設定
dotenv.config();

const vapidKeys = {
    publickey: process.env.VAPID_PUBLIC_KEY || 'BLg1jEi2V86J003618kS4qf-uBqQpNLI0KALUAlJ6oL-GIJA8aDHPlQzT7yOqNi922n-jXJIvyTtOAOWiGfIeIE',
    privatekey: process.env.VAPID_PRIVATE_KEY 
};

webpush.setVapidDetails(
    'mailto:example@example.com',
    vapidKeys.publickey,
    vapidKeys.privatekey
);

// サブスクリプション情報を格納する配列
let subscriptions: any[] = [];

// userの構造体を定義
interface User {
    userid: string;
}

// userの配列を定義
const users: User[] = [];

app.use('*', cors());

// usersを引数としてランダムに一つのuserを返す関数
const randomUser = (users: User[]): User => {
    return users[Math.floor(Math.random() * users.length)];
};

// userIDを取得してある程度人数が増えたら
api.post('/adduser', async (c) => {
    const param = await c.req.json<{ userid: string }>();
    const userid = {
        userid: param.userid,
    };
    console.log(userid);
    if (users.find((user) => user.userid === userid.userid) === undefined) {
        users.push(userid);
    }
    return c.json(201);
});

// usersの中身が5人以上になったらランダムに一人のuserを返す
api.get('/randomuser', async (c) => {
    if (users.length >= 5) {
        return c.json(randomUser(users));
    }
    return c.json(404);
});

// api/jsonにアクセスするとusersの中身が返ってくる
app.route('/api', api);

// クライアントからサブスクリプション情報を受け取る
api.post('/subscribe', async (c) => {
    const subscription = await c.req.json();
    subscriptions.push(subscription);
    return c.json(201);
}
);

// サブスクリプション情報を元にプッシュ通知を送る
api.post('sendNotification', async (c) => {
    const { title, message } = await c.req.json();
    const payload = JSON.stringify({ title, message });
    subscriptions.forEach((subscription) => {
        webpush.sendNotification(subscription, payload).catch((err: Error) => console.error(err));
    });
    return c.json(201);
}
);
export default {
    hostname: "0.0.0.0",
    port: 8080,
    fetch: app.fetch,
} 

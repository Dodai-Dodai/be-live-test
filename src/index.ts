import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server'
import * as dotenv from 'dotenv';
import webpush from 'web-push';

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const MAILTO = process.env.MAIL || '';

webpush.setVapidDetails(
    MAILTO,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const app = new Hono();
const api = new Hono();

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

api.post('/sendnotification', async (c) => {
    const { subscription, payload } = await c.req.json();
    webpush.sendNotification(subscription, JSON.stringify(payload))
        .then(() => c.json({ message: 'Notification sent successfully' }))
        .catch(error => c.json({ message: 'Error sending notification', error }));
});

// api/jsonにアクセスするとusersの中身が返ってくる
app.route('/api', api);

export default {
    hostname: "0.0.0.0",
    port: 8080, 
    fetch: app.fetch, 
} 

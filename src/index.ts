import { Hono } from 'hono';
import { cors } from 'hono/cors';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { resolve } from 'bun';



const app = new Hono();
const api = new Hono();

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
/*
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
*/

/*サーバーサイドは　usernameを格納する配列1と配列2を用意

クライアントからusernameが来たら、配列2を参照
→名前がなければ配列1に格納、404？を返す
→名前があればusernameを返してpostしてきた名前を配列2から削除

5秒毎に配列1は初期化
初期化前に、名前が5つ以上あれば配列2にコピー */

const usernames: User[] = [];
const usernames2: User[] = [];
// 抽選結果を格納する変数(初期値はundefined)
let rerult: User | undefined;

api.post('/randomuser', async (c) => {
    const param = await c.req.json<{ username: string }>();
    // 配列2に名前がない場合
    if (usernames2.find((user) => user.userid === param.username) === undefined) {
        // 配列1に名前がない場合
        if (usernames.find((user) => user.userid === param.username) === undefined) {
            usernames.push({ userid: param.username });
            
        }   
        return c.json(404);     
    } /*配列2に名前がある場合*/ else {
        //配列2から名前を削除
        usernames2.splice(usernames2.findIndex((user) => user.userid === param.username), 1);
        //抽選結果を返す
        return c.json(rerult);
    }
});

// 5秒毎に配列1は初期化
setInterval(() => {
    /*配列1の名前が5つ以上ある時*/
    if(usernames.length >= 5){
        // resultを初期化
        rerult = undefined;
        // 配列1から配列2にコピー
        for(let i = 0; i < usernames.length; i++){
            usernames2.push(usernames[i]);
        }
        // 配列2の中からランダムに一つの名前を抽選
        rerult = randomUser(usernames2);
    } else {
        // なにもしない
    }
    // 配列1を初期化
    for(let i = usernames.length; i > 0; i--){
        usernames.pop();
    }
}, 5000);


// api/jsonにアクセスするとusersの中身が返ってくる
app.route('/api', api);

// クライアントからサブスクリプション情報を受け取る
api.post('/subscribe', async (c) => {
    const subscription = await c.req.json();
    subscriptions.push(subscription);
    console.log(subscriptions);
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

import { Hono } from 'hono';
import { cors } from 'hono/cors';

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

// api/jsonにアクセスするとusersの中身が返ってくる
app.route('/api', api);

export default { 
    port: 8080, 
    fetch: app.fetch, 
} 

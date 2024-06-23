import { Hono } from 'hono';

const app = new Hono();
const api = new Hono();

// userの構造体を定義
interface User {
    userid: string;
}

// userの配列を定義
const users: User[] = [];


app.get('/', (c) => 
    c.text('Hello, World!')
);

// userIDを取得してある程度人数が増えたら
api.post('/json', async (c) => {
    const param = await c.req.json<{ userid: string }>();
    const userid = {
        userid: param.userid,
    };
    if (users.find((user) => user.userid === userid.userid) === undefined) {
        users.push(userid);
    }
    console.log(users);
    return c.json(users, 201);
});

// api/jsonにアクセスするとusersの中身が返ってくる
app.route('/api', api);

export default { 
    port: 3000, 
    fetch: app.fetch, 
} 
import { Hono } from 'hono';
import { test, expect, mock } from "bun:test";


test("POST api/json", async () => {
    const app = new Hono();
    const users: { userid: string }[] = [];
    
    const api = new Hono();
    api.post('/json', async (c) => {
        const param = await c.req.json<{ userid: string }>();
        const userid = {
            userid: param.userid,
        };
        if (users.find((user) => user.userid === userid.userid) === undefined) {
            users.push(userid);
        }
        return c.json(users, 201);
    });
    app.route('/api', api);

    const fetch = app.fetch;
    const res = await fetch(new Request('http://localhost:3000/api/json', {
        method: 'POST',
        body: JSON.stringify({ userid: 'test' }),
    }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([{ userid: 'test' }]);
    
    // 同じuseridを追加してもusersには追加されない
    const res2 = await fetch(new Request('http://localhost:3000/api/json', {
        method: 'POST',
        body: JSON.stringify({ userid: 'test' }),
    }));
    expect(res2.status).toBe(201);
    // userにはtestが一つだけ
    const count = users.filter((user) => user.userid === 'test').length;
    expect(count).toBe(1);
});
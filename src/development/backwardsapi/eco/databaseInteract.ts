import { WebSocket } from "ws";

const ws = new WebSocket('ws:10.0.0.230:8080');

ws.on('error', console.error);

let wsIsOpen = false;

ws.on('open', function open() {
    wsIsOpen = true;
});

/**
 * @param time Time to wait in seconds
 */
function wait(time: number): Promise<void> {
    return new Promise<void>(res => {
        setTimeout(() => {
            res()
        }, time * 1000);
    })
}

export function getUser(userid: string, guildid: string): Promise<object> {
    return new Promise<any>(async (res, rej) => {
        await wait(0.25);
        console.log(wsIsOpen);
        if (!wsIsOpen) {
            console.error("Websocket not ready, please wait.");
            rej(null);
        }


        const req = {
            name: "GETUSER",
            data: [userid, guildid]
        };

        const onResponse = (data: any) => {
            const response = JSON.parse(data.toString());
            if (response.name === "SENDUSER") {
                res(response.data[0]);
            }
        };

        ws.once("message", onResponse);

        ws.send(JSON.stringify(req), (err) => {
            if (err) throw rej(err);
            console.log("Message sent");

            // ws.removeListener("message", onResponse);
        });


    });
}

// ws.on('message', function message(data) {
//     console.log('recieved: %s', data);
// });
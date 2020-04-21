import {Socket, Presence} from 'phoenix'
let socket = new Socket(process.env.VUE_APP_CHANNEL_HOST, { params: { key: 'jeU82' } });
let channel = null;
let presence = null;

// Now that you are connected, you can join channels with a topic:

export default {
  push(msg, payload) {
    channel.push(msg, payload);
  },
  joinRoom(room, person, idCb, handsCB, quicksCB, presenceCb, applaudCb) {
    socket.connect();
    channel = socket.channel(`room:${room}`, {person})
    presence = new Presence(channel);
    channel.join()
      .receive("ok", resp => {
        idCb(null, resp.id);
        console.log("Joined successfully", resp);
      })
      .receive("error", resp => {
        idCb(resp, null);
        console.log("Unable to join", resp)
      });
    channel.on("hands", payload => {
      console.log('hands', payload)
      handsCB(payload.hands)
    });
    channel.on("quicks", payload => {
      console.log('quicks', payload)
      quicksCB(payload.hands)
    });

    channel.on("applaud", payload => {
      applaudCb(payload.person, payload.icon);
    });
    const listPeople = () => presenceCb(presence.list((id) => id));
    presence.onSync(listPeople);

    presence.onJoin(listPeople);
    presence.onLeave(listPeople);
  },
  leaveRoom() {
    channel.leave();
    channel = null;
  },
}

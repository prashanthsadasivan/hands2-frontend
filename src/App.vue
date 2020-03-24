<template>
  <div id="app">
    <div v-if="currentRoom == null" v-bind:class="{'has-error': personError || roomError}" style="margin: 60px">
      <div class="form-group">
        <label class="form-label" for="room-input">Room</label>
        <input v-bind:class="{'is-error': roomError}" class="form-input" id="room-input" v-model="room" placeholder="Room" />
        <p class="form-input-hint" v-if="roomError">Room Name is required</p>


        <label class="form-label" for="person-input">Your Name</label>
        <input v-bind:class="{'is-error': personError}" class="form-input" id="person-input" v-model="person" placeholder="your name" />
        <p class="form-input-hint" v-if="personError">Your Name is required</p>
        <button class="btn btn-primary input-group-btn" @click="goToRoom(room, person)">Enter room </button>
      </div>
    </div>
    <div v-if="currentRoom != null">
      <button class="btn btn-primary input-group-btn" @click="exitRoom()">Exit room </button>
      <div class="applaud-group">
        <button class="btn btn-action s-circle" @click="applaud('👏')">👏</button>
        <button class="btn btn-action s-circle" @click="applaud('👎')">👎</button>
        <button class="btn btn-action s-circle" @click="applaud('🤷‍♀️')">🤷‍♀️</button>
      </div>
      <div style="margin: 60px;">
        <div v-if="quicks.length">
          <h3>Quick Interjection</h3>
          <div v-for="(quick, index) in quicks" :key="index">
            <button style="margin-bottom: 15px; width: 100%" class="btn" @click="toggleQuick(false, quick)">✅ Lower Hand for {{quick}}</button>
          </div>
        </div>
        <h3> Speaking Queue </h3>
        <div v-for="(hand, index) in hands" :key="index">
          <button style="margin-bottom: 15px; width: 100%" class="btn" @click="toggleHand(false, hand)">✅ Lower Hand for {{hand}}</button>
        </div>
        <div>
          Participants: <span v-for="(p, index) in participants" :key="index">{{p}}<span v-if="index < participants.length - 1">, </span></span>
        </div>
      </div> 
      <div style="position: absolute; bottom: 0; width:100%;">
        <span v-if="!handRaised && !quickRaised">
          <button style="width:50%" class="btn btn-primary input-group-btn" @click="toggleHand(true)">🤚 Raise Hand</button>
          <button style="width: 50%" class="btn btn-primary input-group-btn" @click="toggleQuick(true)">❗️Quick Point</button>
        </span>
        <button style="width: 100%" v-if="handRaised || quickRaised" class="btn input-group-btn" @click="toggleHand(false)">✅ Lower Hand</button>
      </div>
    </div>
  </div>
</template>

<script>
import channel from './socket.js'
import hearts from './hearts.js'
let ipcRenderer = null;
if (!window.require) {
  console.log('no window.require');
}
window.require = window.require || function() { return {ipcRenderer: null } }
ipcRenderer = window.require('electron').ipcRenderer;

export default {
  name: 'App',
  components: {
  },
  data() {
    return { 
      room: null,
      roomError: null,
      person: null,
      personError: null,
      currentRoom: null,
      handRaised: false,
      hands: [],
      handsInitialized: false,
      quickRaised: false,
      quicks: [],
      quickInitialized: false,
      participants: [],
      electronWindow: null,
    };
  },
  mounted() {
    this.$nextTick(function () {
      console.log('mounted', ipcRenderer);
      if (!ipcRenderer) {
        return;
      }
      ipcRenderer.on('ready', (mb) => {
        this.electronWindow = mb;
        console.log('assigned electronWindow');
        this.$forceUpdate();
      });
      ipcRenderer.send('app_mounted');
    })
  },
  computed: {
    roomStateSynced() {
      return this.handsInitialized && this.quickInitialized;
    },
  },
  methods: {
    goToRoom(room, person) {
      console.log('go to room: ' +person ); 
      this.roomError = false;
      this.personError = false;
      if (room === null || room === '') {
        this.roomError = true;
      }
      if (person === null || person === '') {
        this.personError = true;
      }
      if (this.roomError || this.personError) {
        return;
      }
      this.currentRoom = room;
      localStorage.setItem('person', this.person);
      channel.joinRoom(this.currentRoom, this.person, (hands) => {
        let myHand = hands.filter(h => h === this.person)[0];
        if(!myHand) {
          this.handRaised = false;
        } 
        this.handsInitialized = true;
        this.notifyIfNecessary(this.hands, hands, '🤚 Someone\'s in the queue');

        this.hands = hands
        this.$forceUpdate();
      }, (quicks) => {
        let myQuick = quicks.filter(h => h === this.person)[0];
        if(!myQuick) {
          this.quickRaised = false;
        }
        this.quickInitialized = true;
        console.log('notifyIfNecessary');

        this.notifyIfNecessary(this.quicks, quicks, '❗️ Quick Note');
        this.quicks = quicks;

        this.$forceUpdate();
      }, (participants) => {
        console.log(participants);
        this.participants = participants;
        this.$forceUpdate();
      }, (person, icon) => {
        if (person != this.person) {
          hearts.addHearts(icon);
        }
      });
    },
    notifyIfNecessary(oldHands, newHands, title) {
      if (!this.electronWindow) {
        console.log('no menub ar');
        return;
      }
      let oldHandsHash = oldHands.reduce((acc, x) => {
        acc[x] = true;
        return acc;
      }, {});
      let unseenHands = newHands.filter(h => !oldHandsHash[h] && h !== this.person);
      console.log('oldHands', oldHands, 'newHands', newHands, 'unseenHands', unseenHands);
      if (unseenHands && unseenHands.length && this.roomStateSynced) {
        let myNotification = new Notification(title, {
          body: 'From: ' + unseenHands.join(", ")
        });

        myNotification.onclick = () => {
          console.log('clicked notification');
        };
      }
    },
    applaud(icon) {
      channel.push("applaud", {icon});
      hearts.addHearts(icon);
    },
    exitRoom() {
      this.currentRoom = null;
      this.hands = [];
      this.quicks = [];
      this.handRaised = false;
      this.quickRaised = false;
      this.participants = [];
      channel.leaveRoom();
    },
    toggleHand(isRaised, otherPerson) {
      if (!otherPerson) {
        this.handRaised = isRaised || false;
      }
      let msg = isRaised ? "raise_hand" : "lower_hand"
      channel.push(msg, {person: otherPerson || this.person})
    },
    toggleQuick(isRaised, otherPerson) {
      if (!otherPerson) {
        this.quickRaised = isRaised || false;
      }
      let msg = isRaised ? "raise_quick" : "lower_quick"
      channel.push(msg, {person: otherPerson || this.person})
    }

  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#person-input {
  margin-bottom: 15px;
}

.applaud-group {
  position: absolute;
  top:15px;
  right: 15px;
}
</style>

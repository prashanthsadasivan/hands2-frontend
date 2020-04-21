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
      <button class="btn btn-primary input-group-btn exit" @click="exitRoom()">Exit</button>
      <button v-if="!isPopout" class="btn btn-action s-circle popout" @click="popout()">↥</button>
      <div class="applaud-group">
        <button class="btn btn-action s-circle" @click="applaud('👏')">👏</button>
        <button class="btn btn-action s-circle" @click="applaud('👎')">👎</button>
        <button class="btn btn-action s-circle" @click="applaud('🤷‍♀️')">🤷‍♀️</button>
      </div>
      <div class="checkbox-group">
        <label class="form-switch">
          <input type="checkbox" v-model="shouldNotify">
          <i class="form-icon"></i>Sound Notification?
        </label>
      </div>
      <div style="margin: 60px;">
        <div>
          Participants: <span v-for="(p, index) in participants" :key="index">{{p}}<span v-if="index < participants.length - 1">, </span></span>
        </div>
        <div v-if="quicks.length">
          <h3>Quick Point</h3>
          <ol>
            <li v-for="(quick, index) in quicks" :key="index">{{quick.person}}</li>
          </ol>
        </div>
        <h3> Speaking Queue </h3>
        <ol>
          <li v-for="(hand, index) in hands" :key="index">{{hand.person}}</li>
        </ol>
      </div>
      <div style="position: absolute; bottom: 0; width:100%;">
        <span>
          <button style="width: 50%" v-bind:class="{'btn-primary': !handRaised}" class="btn input-group-btn" @click="toggleHand()">{{handBtnText}}</button>
          <button style="width: 50%" v-bind:class="{'btn-primary': !quickRaised}" class="btn input-group-btn" @click="toggleQuick()">{{quickBtnText}}</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import {Howl} from 'howler';
import channel from './socket.js'
import hearts from './hearts.js'
const notificationSound = new Howl({
  src: ['sound.mp3']
});

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
      channelError: null,
      id: null,
      isPopout: false,
      hands: [],
      handsInitialized: false,
      quickRaised: false,
      quicks: [],
      quickInitialized: false,
      participants: [],
      electronWindow: null,
      shouldNotify: false,
      referrer: document.referrer
    };
  },
  mounted() {
    this.$nextTick(function () {
      if (document.referrer && document.referrer != "") {
        let splits = document.referrer.split("/");
        this.room = splits[splits.length - 1];
      }
      let localPerson = localStorage.getItem('person');
      if ( localPerson && localPerson != '') {
        this.person = localPerson;
      }
      let hash = location.hash;
      if (hash && hash.split('#').length === 2) {
        try {
          let params = JSON.parse(atob(hash.split('#')[1]));
          if (params.room && this.person || params.person) {
            this.room = params.room;
            this.person = this.person || params.person;
          }
        } catch {
          console.log('couldnt parse hash');
        }
      }
      if (this.room && this.person) {
        this.goToRoom(this.room, this.person);
      }
    })
  },
  computed: {
    roomStateSynced() {
      return this.handsInitialized && this.quickInitialized && this.id;
    },
    handBtnText() {
      return this.handRaised ? '✅Lower Hand ': '🤚 Raise Hand'; 
    },
    quickBtnText() {
      return this.quickRaised ? '✅Lower Quick' : '❗️Quick Point';
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
      channel.joinRoom(this.currentRoom, this.person, (err, id) => {
        if (err != null) {
          this.channelError = err;
          return;
        }
        this.id = id;
      }, (hands) => {
        let myHand = hands.filter(h => h.id === this.id)[0];
        if(!myHand) {
          this.handRaised = false;
        } 
        this.handsInitialized = true;
        this.notifyIfNecessary(this.hands, hands, '🤚 Someone\'s in the queue');

        this.hands = hands
        this.$forceUpdate();
      }, (quicks) => {
        let myQuick = quicks.filter(h => h.id === this.id)[0];
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
    popout() {
      let hash = btoa(JSON.stringify({person: this.person, room: this.room}));
      console.log(process.env.VUE_APP_FRONTEND_HOST + '#' + hash);
      window.open(process.env.VUE_APP_FRONTEND_HOST + '#' + hash, 'hands_window_popout', 'width=300,height=800,menubar=0,toolbar=0,location=0');
      if (window && window.parent) {
        console.log('app popoout postmessage');
        window.parent.postMessage({hands_popout: true}, '*');
      }
    },
    notifyIfNecessary(oldHands, newHands) {
      let oldHandsHash = oldHands.reduce((acc, x) => {
        acc[x] = true;
        return acc;
      }, {});
      let unseenHands = newHands.filter(h => !oldHandsHash[h] && h !== this.person);
      if (this.shouldNotify && unseenHands && unseenHands.length && this.roomStateSynced) {
        notificationSound.play();
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
    toggleHand() {
      this.handRaised = !this.handRaised;
      let msg = this.handRaised ? "raise_hand" : "lower_hand"
      channel.push(msg, {person: this.person, id: this.id})
    },
    toggleQuick() {
      this.quickRaised = !this.quickRaised;
      let msg = this.quickRaised ? "raise_quick" : "lower_quick" 
      channel.push(msg, {person: this.person, id: this.id})
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
  bottom: 40px;
  right: 5px;
}

.popout {
  position: absolute;
  top: 5px;
  right: 5px;
}

.exit {
  position: absolute;
  top: 5px;
  left: 5px;
}

.checkbox-group {
  position: absolute;
  top: 60px;
  right: 15px;
}
</style>

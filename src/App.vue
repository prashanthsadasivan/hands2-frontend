<template>
  <div id="app">
    <modal name="settings" width="300">
      <div class="settings-modal">
        <h2> Settings </h2>
        <div class="form-group">
            <label class="form-switch">
              <input type="checkbox" v-model="isModerator">
              <i class="form-icon"></i>I am the moderator
            </label>
        </div>
      </div>
    </modal>
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
      <div class="topRight">
        <button class="btn btn-action btn-primary s-circle" @click="showSettings()">
          <i class="icon icon-menu"></i>
        </button>
        <button v-if="!isPopout" class="btn btn-action btn-primary s-circle" @click="popout()">
          <i class="icon icon-upward"></i>
        </button>
      </div>
      <div class="applaud-group">
        <label class="form-switch">
          <input type="checkbox" v-model="shouldPlaySounds">
          <i class="form-icon"></i>Sounds
        </label>
        <button class="btn btn-action s-circle" @click="applaud('👏')">👏</button>
        <button class="btn btn-action s-circle" @click="applaud('👍')">👍</button>
        <button class="btn btn-action s-circle" @click="applaud('👎')">👎</button>
        <button class="btn btn-action s-circle" @click="applaud('😮')">😮</button>
      </div>
      <div class="checkbox-group">
      </div>
      <div style="margin: 60px;">
        <div>
          Participants: <span v-for="(p, index) in participants" :key="index">{{p}}<span v-if="index < participants.length - 1">, </span></span>
        </div>
        <div v-if="quicks.length">
          <h3>Quick Point</h3>
          <ol>
            <li v-for="(quick, index) in quicks" :key="index">{{quick.person}}
            <button v-if="isModerator" class="btn btn-sm btn-action btn-error s-circle" @click="toggleQuick(quick.id)">
              <i class="icon icon-cross"></i>
            </button>
            </li>
          </ol>
        </div>
        <h3> Speaking Queue </h3>
        <ol>
          <li v-for="(hand, index) in hands" :key="index">{{hand.person}}
          <button v-if="isModerator" class="btn btn-action btn-error btn-sm s-circle" @click="toggleHand(hand.id)">
            <i class="icon icon-cross"></i>
          </button>
          </li>
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

let totalSoundsPlaying = 0;

function onend() {
  console.log('onend');
  totalSoundsPlaying--;
}

function onplay() {
  totalSoundsPlaying++;
}
const notificationSound = new Howl({
  src: ['goose.mp3'],
  volume: 0.2
});
const noSound = new Howl({
  src: ['no.mp3'],
  volume: 0.2,
  onplay,
  onend
});
const yesSound = new Howl({
  src: ['yes.mp3'],
  volume: 0.2,
  onplay,
  onend
});
const applauseSound = new Howl({
  src: ['applause-more.mp3'],
  volume: 0.2,
  onplay,
  onend
});
const ooohSound = new Howl({
  src: ['oooh.mp3'],
  volume: 0.2,
  onplay,
  onend
});

const soundMap = {
  '👏': applauseSound,
  '👍': yesSound,
  '👎': noSound,
  '😮': ooohSound
}

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
      shouldPlaySounds: true,
      referrer: document.referrer,
      isModerator: false,
    };
  },
  mounted() {
    this.$nextTick(function () {
      if (document.referrer && document.referrer != "") {
        let splits = document.referrer.split("/");
        let referrer = splits[splits.length - 1]
        this.room = referrer.split('?')[0].split('#')[0];
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

        this.notifyIfNecessary(this.quicks, quicks, '❗️ Quick Note');
        this.quicks = quicks;

        this.$forceUpdate();
      }, (participants) => {
        this.participants = participants;
        this.$forceUpdate();
      }, (person, icon) => {
        if (person != this.person) {
          this.playSoundForApplaud(icon);
          hearts.addHearts(icon);
        }
      });
    },
    popout() {
      let hash = btoa(JSON.stringify({person: this.person, room: this.room}));
      console.log(process.env.VUE_APP_FRONTEND_HOST + '#' + hash);
      window.open(process.env.VUE_APP_FRONTEND_HOST + '#' + hash, 'hands_window_popout', 'width=300,height=800,menubar=0,toolbar=0,location=0');
      if (window && window.parent) {
        window.parent.postMessage({hands_popout: true}, '*');
      }
    },
    notifyIfNecessary(oldHands, newHands) {
      let oldHandsHash = oldHands.reduce((acc, x) => {
        acc[x] = true;
        return acc;
      }, {});
      let unseenHands = newHands.filter(h => !oldHandsHash[h] && h !== this.person);
      if (this.shouldPlaySounds && unseenHands && unseenHands.length && this.roomStateSynced) {
        notificationSound.play();
      }
    },
    showSettings() {
      this.$modal.show('settings')
    },
    applaud(icon) {
      channel.push("applaud", {icon});
      this.playSoundForApplaud(icon);
      hearts.addHearts(icon);
    },
    playSoundForApplaud(icon) {
      console.log(totalSoundsPlaying);
      if (this.shouldPlaySounds && totalSoundsPlaying < 5) {
        soundMap[icon].play();
      }
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
    toggleHand(id) {
      if (id && id !== this.id) {
        // since this is not the same person, assume moderator
        // lowering other person's hand.
        let msg = "lower_hand"
        channel.push(msg, {person: this.person, id: id})
        return;
      }
      this.handRaised = !this.handRaised;
      let msg = this.handRaised ? "raise_hand" : "lower_hand"
      channel.push(msg, {person: this.person})
    },
    toggleQuick(id) {
      if (id && id !== this.id) {
        // since this is not the same person, assume moderator
        // lowering other person's hand.
        let msg = "lower_quick"
        channel.push(msg, {person: this.person, id: id})
        return;
      }
      this.quickRaised = !this.quickRaised;
      let msg = this.quickRaised ? "raise_quick" : "lower_quick" 
      channel.push(msg, {person: this.person})
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

.topRight {
  position: absolute;
  top: 5px;
  right: 5px;
}
.topRight > * {
    margin: 0px 5px;
}

.exit {
  position: absolute;
  top: 5px;
  left: 5px;
}

.checkbox-group {
  position: absolute;
  bottom: 80px;
  right: 5px;
}
.settings-modal {
  margin: 20px 10px;

}
</style>

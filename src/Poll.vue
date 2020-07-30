<template>
<div>
  <div class="divider"></div>
  <h4>Votes: {{totalVotes}}</h4>
  <div class="container vote-btn-container" v-if="!voted">
    <div class="columns">
      <div class="column col-4">
        <button class="btn btn-success" @click="vote('yes')">Yes</button>
      </div>
      <div class="column col-4">
        <button class="btn btn-warning" @click="vote('meh')">Meh</button>
      </div>
      <div class="column col-4">
        <button class="btn btn-error" @click="vote('no')">No</button>
      </div>
    </div>
  </div>

  <h5>Results</h5>
  <div class="bar" v-if="totalVotes > 0">
    <div class="bar-item tooltip yes-bar" v-bind:data-tooltip="yesVotes" v-bind:style="{width: yesPct + '%'}">Yes</div>
    <div class="bar-item tooltip meh-bar"  v-bind:data-tooltip="mehVotes" v-bind:style="{width: mehPct + '%'}">Meh</div>
    <div class="bar-item tooltip no-bar"  v-bind:data-tooltip="noVotes" v-bind:style="{width: noPct + '%'}">No</div>
  </div>
  <div class="bar" v-if="totalVotes === 0">
    <div class="bar-item" style="width: 100%;">No results</div>
  </div>
</div>
</template>
<script>
export default {
  name: 'Poll',
  components: {
  },
  props: {
    personId: Number,
    yesVotes: {
      type: Number,
      default: 0,
    },
    noVotes: {
      type: Number,
      default: 0,
    },
    mehVotes: {
      type: Number,
      default: 0,
    },
    voted: {
      type: Boolean,
      default: false,
    }
  },
  methods: {
    vote(val) {
      this.$emit('vote', val);
    },
  },
  computed: {
    yesPct() {
      if (this.totalVotes === 0) {
        return 0;
      }
      return (100 * this.yesVotes / this.totalVotes).toFixed()
    },
    noPct() {
      if (this.totalVotes === 0) {
        return 0;
      }
      return (100 * this.noVotes / this.totalVotes).toFixed()
    },
    mehPct() {
      if (this.totalVotes === 0) {
        return 0;
      }
      if (this.yesPct > 0 && this.noPct > 0) {
        return 100 - this.yesPct - this.noPct;
      }
      return (100 * this.mehVotes / this.totalVotes).toFixed()
    },
    totalVotes() {
      return this.yesVotes + this.noVotes + this.mehVotes;
    },
  },
}
</script>
<style scoped>
.yes-bar {
  background: #A8E6CE;
}
.no-bar {
  background: #FF8C94;
}
.meh-bar {
  background: #FFD3B5;
}
.vote-btn-container {
  margin-bottom: 18px;
}
.vote-btn-container > div > div > button {
  width: 100%;
}
.bar-item {
  -webkit-transition: width .25s ease-in-out;
  -moz-transition: width .25s ease-in-out;
  -o-transition: width .25s ease-in-out;
  transition: width .25s ease-in-out;
}
</style>

// heart class 
class Heart {
  
  constructor(icon) {
     this.x = parseFloat( window.innerWidth - 50 );
     this.y = parseFloat( window.innerHeight - 30 );
     this.phase = Math.random() * 360;
     this.radius = Math.random() * 1;
     this.speed = 1 + Math.random() * 1.15;
     this.scale = 0.2 + Math.random() * 0.8;
     this.grow = 0.01;
     this.alpha = 1;
     this.done = false;
     
     this.outer = document.createElement( "div" );
     this.outer.innerText = icon || "🎉";
     this.outer.style.display = "block";
     this.outer.style.position = "absolute";
     this.outer.style.fontSize = "45px";
     this.outer.style.left = "-30px";
     this.outer.style.top = "-15px";
     document.body.appendChild( this.outer ); 
     this.draw();
  }
  
  flush() {
     if( document.body.contains( this.outer ) ) {
        document.body.removeChild( this.outer );
     }
     this.outer = null; 
  }

  draw() {
     if( this.done ) return; 
     this.outer.style.transform = "translateX( "+ this.x +"px ) translateY( "+ this.y +"px ) translateZ( 0 ) scale( "+ this.grow +" )";
     this.outer.style.opacity = this.alpha; 
  }
  
  update() {
    console.log('update', this.scale, this.grow, this.x, this.y, this.speed);
     this.alpha = ( this.alpha > 0 ) ? ( this.alpha - 0.0045 ) : this.alpha; 
     this.alpha = ( this.alpha < 0 ) ? 0 : this.alpha; 
     
     this.x += Math.cos( this.phase / 50 ) * this.radius;
     this.y -= this.speed; 
     
     this.grow += ( this.scale - this.grow ) / 10;
     this.phase += 1;
     
     this.done = ( this.y < -100 || this.alpha <= 0 ) ? true : false;  
  }
}
let hearts = [];
let stopped = true;

// main loop
function loop() {
  let i;
  if (!stopped) {
    requestAnimationFrame( loop );
  }

  // cleanup
  for( i = 0; i < hearts.length; ++i ) {
     if( hearts[i].done ) {
        hearts[i].flush();
        hearts.splice( i, 1 );
     }
  }
  // animate
  for( i = 0; i < hearts.length; ++i ) {
     hearts[i].update();
     hearts[i].draw();
  }
}


export default {
  startLoop() {
    stopped = false;
    loop();
  },
  stopLoop() {
    stopped = true;
  },
  addHearts(icon) {
    if (stopped) {
      this.startLoop();
    }
    hearts.push(new Heart(icon));
  }
}

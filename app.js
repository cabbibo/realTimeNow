define(function(require, exports, module) {

  var Womb                = require( 'Womb/Womb'              );
  var ShaderCreator       = require( 'Shaders/ShaderCreator'  );

  var Mesh                = require( 'Components/Mesh'                );
  var Duplicator          = require( 'Components/Duplicator'          );

  var FractalBeing       = require( 'Species/Beings/FractalBeing');

  
  var m                   = require( 'Utils/Math'                   );
  var Mesh                = require( 'Components/Mesh'              );
  var Clickable           = require( 'Components/Clickable'         );
  var MeshEmitter         = require( 'Components/MeshEmitter'       );
  var Duplicator          = require( 'Components/Duplicator'        );

  var fragmentShaders     = require( 'Shaders/fragmentShaders'    );
  var vertexShaders       = require( 'Shaders/vertexShaders'      );
  var physicsShaders      = require( 'Shaders/physicsShaders'     );
  var shaderChunks        = require( 'Shaders/shaderChunks'       );

  var PhysicsSimulator    = require( 'Species/PhysicsSimulator'   );
  var FBOParticles        = require( 'Species/FBOParticles'       );
  var physicsShaders      = require( 'Shaders/physicsShaders'     );
  var physicsParticles    = require( 'Shaders/physicsParticles'   );
 
  
  var placementFunctions  = require( 'Utils/PlacementFunctions'       );

  var link = 'https://soundcloud.com/disclosuremusic';
  var info =  "Drag to spin, scroll to zoom,<br/> press 'x' to hide interface";
  
  var womb = new Womb({
    stats:    true,
  });

  var file  = 'lib/audio/voice.mp3' ;
  var audio = womb.audioController.createStream( file );
  var track = womb.audioController.createNote( 'lib/audio/lucifer.mp3' );

  console.log( track );
  womb.audio  = track;
  womb.voice = audio; 

  
  womb.slides = [];

  womb.currentSlide = 0;

  womb.nextSlide = function(){

    womb.slides[ womb.currentSlide ].exit();
    womb.currentSlide ++;
    womb.slides[ womb.currentSlide ].enter();

  }

  womb.previousSlide = function(){

    womb.slides[ womb.currentSlide ].exit();
    womb.currentSlide --;
    womb.slides[ womb.currentSlide ].enter();

  }

  console.log( audio );
 
  /*
  
    Fractal 1

  */
  womb.modelLoader.loadFile( 'OBJ' , '/lib/demoModels/LeePerrySmith.obj' , function( object ){

    if( object[0] instanceof THREE.Mesh ){
    }

    if( object[0] instanceof THREE.Geometry ){
      var geo = object[0];
      geo.computeFaceNormals();
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      geo.computeBoundingBox();

      for( var i = 0; i < geo.vertices.length; i++ ){

        geo.vertices[i].multiplyScalar( 2 );
      }
      
      womb.modelLoader.assignUVs( geo );
     
      womb.onMugLoad( geo);
    }

  });

  womb.onMugLoad = function( geo ){


      womb.loader.loadBarAdd();

      console.log( geo );
      womb.fractal1 = new FractalBeing( womb, {

        geometry: geo,
        texture:    womb.voice.texture,
        opacity: .01,
        texturePower:1,
        noisePower:1,
      
        displacementPower: .2,
        displacementOffset: 1.0,

        placementSize: womb.size/20,

        numOf: 10,
        color: new THREE.Vector3( 0.5 , 1.0 , 1.5 ),
        influence: 1,

      });

      console.log( womb.fractal1 );
      womb.fractal1.fractal.material.updateSeed();

 
   
  }

  /*
   

     Physics system


  */

   womb.ps = new PhysicsSimulator( womb , {

    textureWidth: 100,
    debug: false,
    velocityShader:           physicsShaders.velocity.curl,
    positionShader:           physicsShaders.positionAudio_4,
    
    particlesUniforms:        physicsParticles.uniforms.audio,
    particlesVertexShader:    physicsParticles.vertex.audio,
    particlesFragmentShader:  physicsParticles.fragment.audio,
    
    bounds: 100,
    speed: .1,
   
    audio: womb.audio

  });


  vertexChunk = [

    "vec2 v2 = vec2(  abs( uv.x  - .5 )  , 0.0 );",
    "float a = texture2D( AudioTexture , v2).r;",
    
    "float r = a * a* a * 20.;",
    "float t = 3.14159  * ( 1. + a + uv.x );",
    "float p = 3.14159 * 2. *  (a + uv.y );",
    
    "vec3 newP = cart( vec3( r , t , p ) );",
    
    "pos += newP;",
    
    "vDisplacement = length( newP );",

  ];

  fragmentChunk = [
    "color = Color * (vDisplacement / 20. );",
    "color.x = 10. / polar( vPos ).x;",
  ];

  womb.shader = new ShaderCreator({
    vertexChunk:   vertexChunk,
    fragmentChunk: fragmentChunk,
    uniforms:{ 
     
      Time:         womb.time,
      Color:        { type:"v3" , value: new THREE.Vector3( .7 , .8 , 1.0 ) },
      AudioTexture: { type:"t"  , value: audio.texture },
    
    },
  });

  mandala1 = womb.creator.createBeing();

  mandala1.mesh = new Mesh( mandala1 , {
      geometry: new THREE.IcosahedronGeometry( womb.size/20.0 , 6 ),
      material: womb.shader.material
  });

  mandala1.body.scale.multiplyScalar( .05 );
    
  mandala1.duplicator = new Duplicator(  mandala1.mesh , mandala1 , {
     
      numOf:              10,
      placementFunction:  placementFunctions.ring,
      size:               womb.size / 10
  
  });

  mandala1.duplicator.addAll();
  mandala1.duplicator.placeAll();

  womb.mandala1 = mandala1;

 

  /*

     CLICKABLE BEING

  */

  womb.clickableBeing = womb.creator.createBeing({
    transitionTime: 5
  });

  
  var numOfClickables = 20;
  var round           = 0;  // Which round of filled objects we have done
  var emissionRandomness = .3; // How random the direction is

  var hoverColor = new THREE.Vector3( 1.4 , .9 , .7 );
  var neutralColor = new THREE.Vector3( 1.9 , .4 , .5 );
  var selectedColor = new THREE.Vector3( .9 , 1.1 , .9 );
  var selectedHoverColor = new THREE.Vector3( 1.9 , 1.6 , .9 );

  womb.u = {

    texture:    { type: "t", value: womb.audio.texture },
    image:      { type: "t", value: womb.audio.texture },
    color:      { type: "v3", value: neutralColor },
    time:       womb.time,
    pow_noise:  { type: "f" , value: 0.2 },
    pow_audio:  { type: "f" , value: .3 },

  };

  var uniforms = THREE.UniformsUtils.merge( [
      THREE.ShaderLib['basic'].uniforms,
      womb.u,
  ]);

  uniforms.texture.value = womb.audio.texture;
  uniforms.time=  womb.time  ;

  var mat = new THREE.ShaderMaterial({

    uniforms: uniforms,
    vertexShader: vertexShaders.passThrough,
    fragmentShader: fragmentShaders.audio.color.uv.absDiamond,
    blending: THREE.AdditiveBlending,
    transparent: true,
    //side: THREE.BackSide,
  });
  var geo = new THREE.CubeGeometry( 10 , 10 , 10 );
  
  for( var i = 0; i < numOfClickables ; i++ ){


    var mesh = new Mesh( womb.clickableBeing , {

      geometry: geo,
      material: mat.clone()


    });

    mesh.material.uniforms.texture.value  = womb.audio.texture;
    mesh.material.uniforms.time           = womb.time;


    var emitter = new MeshEmitter( mesh , {
      
      startingDirection: function(){

        //console.log( this.emitTowards );
        var direction = this.emitTowards.clone().normalize();

        // Randomizes for complexity
        var ER = emissionRandomness;
        direction.x += Math.randomRange( -ER , ER );
        direction.y += Math.randomRange( -ER , ER );
        direction.z += Math.randomRange( -ER , ER );
        return direction;

      },

      maxMeshes: 1000 / numOfClickables,
      decayRate: .97,
      emissionRate: Math.random() * 500 / numOfClickables

      
    });


    mesh.emitter = emitter;

    Clickable( mesh , {

      onHoverOver: function(){
        
        if( !this.selected )
          this.material.uniforms.color.value = hoverColor;
        else
          this.material.uniforms.color.value = selectedHoverColor;
      },

      onHoverOut: function(){

        if( !this.selected )
          this.material.uniforms.color.value = neutralColor;
        else
          this.material.uniforms.color.value = selectedColor;
        

      },

      onClick: function(){

        if( !this.selected ){
          selectMesh( this ); 
        }else{
          unselectMesh( this ); 
        }

        var l = womb.selectedMeshes.length;

        var uniforms = womb.fractal1.fractal.material.uniforms;
        uniforms.texturePower.value = l * 3 / numOfClickables;
        uniforms.color.value.x = l * 2 / numOfClickables;
        

      }

    });
    
    mesh.add();

    var theta = 2 * Math.PI * Math.random();
    var phi   = 2 * Math.PI * ( Math.random() - .5 );

    mesh.position = Math.toCart( womb.size/2 , theta, phi  );
    Math.setRandomRotation( mesh.rotation );


  }

  function unselectMesh( mesh ){

    mesh.selected = false;
    mesh.material.uniforms.color.value = hoverColor;
    mesh.emitter.end();

    var l = womb.selectedMeshes.length;

  }

  function selectMesh( mesh ){

    mesh.selected = true;
    mesh.material.uniforms.color.value = selectedColor;
    mesh.emitter.begin();

    mesh.emitter.emitTowards = mesh.position.clone().multiplyScalar( -1 );

    var s = mesh.emitter.emitTowards.length() / mesh.emitter.lifetime;
    mesh.emitter.startingSpeed = s;
    mesh.emitter.friction = .99;
    mesh.emitter.burst( mesh.emitter.maxMeshes/2 );


  }


  /*

     THING

  */


   // SHARED UNIFORM

  var size = womb.size / 5;
  womb.sphereGeo = new THREE.IcosahedronGeometry( size , 6 );
  womb.sphereGeo = new THREE.SphereGeometry( size , 100 , 100 );

  womb.sphereGeo = new THREE.CubeGeometry( size , size , size , 100 , 100  ,100 );
  womb.normalMaterial = new THREE.MeshNormalMaterial();


  womb.uniforms  = {
    
    color:      { type: "v3", value: new THREE.Vector3( .0 , .0 , .9 ) },
    seed:       { type: "v3", value: new THREE.Vector3( -0.1 , -0.1 ,  -0.9) },
    texture:    { type: "t" , value: womb.voice.texture },
    time:       { type: "f" , value: 0 },
    noiseSize:  { type: "f" , value: 1 },
    noisePower: { type: "f" , value: .2 },
    audioPower: { type: "f" , value: 0.2 },

  };



  womb.vertexShader = [

    "varying vec2 vUv;",
    "varying vec3 vPos;",
    "varying float displacement;",

    "uniform sampler2D texture;",
    
    "uniform float time;",
    "uniform float noisePower;",
    "uniform float audioPower;",
    "uniform float noiseSize;",
    

    shaderChunks.noise3D,
    shaderChunks.absAudioPosition,
    shaderChunks.audioUV,

    "void main( void ){",

      "vUv = uv;",
      "vPos = position;",

      "vec3 pos = position;",
     
      "vec3 offset;",
      "vec3 nPos = normalize( position );",

      "offset.x = nPos.x + cos( time / 100.0 );",
      "offset.y = nPos.y + sin( time / 100.0 );",
      "offset.z = nPos.z;", //+ tan( time / 100.0 );",
      "offset *= noiseSize;",

      "vec2 absUV =  abs( uv - .5 );",

      "vec3 audioPosition = absAudioPosition( texture , position );",

      "float dAudio = snoise3( audioPosition );",
      "float dNoise = snoise3( offset );",

      "float aP = length( audioPosition );",

      "displacement = length( (audioPosition * audioPower) ) + ( dNoise * noisePower ) + .8;",


      "pos *= displacement;",

      "vec4 mvPosition = modelViewMatrix * vec4( pos , 1.0 );",
      "gl_Position = projectionMatrix * mvPosition;",

    "}"


  ].join( "\n" );

  womb.fragmentShader = [

    "uniform vec3 color;",
    "uniform vec3 seed;",
    "uniform float loop;",
    "uniform float noisePower;",
    "varying vec2 vUv;",
    "varying vec3 vPos;",

    shaderChunks.createKali( 20 ),


    "varying float displacement;",

    "void main( void ){",
      "vec3 nPos = normalize( vPos );",

      "vec3 c = kali( nPos , seed );",

      "vec3 cN = normalize( normalize( c ) + 3.0 * color );",
      "gl_FragColor = vec4( cN * ( ( displacement -.5 ) / ( noisePower * 2.0 ) ) , 1.0 );",
    "}"

  ].join( "\n" );

  womb.thingMaterial = new THREE.ShaderMaterial({

    uniforms        : womb.uniforms,       
    vertexShader    : womb.vertexShader,
    fragmentShader  : womb.fragmentShader,

  });

  womb.thing = womb.creator.createBeing();

  womb.sphereMesh = new THREE.Mesh( 

      womb.sphereGeo ,
      womb.material

  );

  womb.thing = womb.creator.createBeing();

  womb.thing.mesh = new Mesh( womb.thing , {
      geometry: new THREE.IcosahedronGeometry( womb.size/20.0 , 6 ),
      material: womb.thingMaterial 
  });

  womb.thing.mesh.add();


   womb.modelLoader.loadFile( 
    'OBJ' , 
    'lib/demoModels/logo.obj' , 

    function( object ){

      console.log('YO' );

      if( object[0] instanceof THREE.Mesh ){
      }

      if( object[0] instanceof THREE.Geometry ){
        var geo = object[0];
        geo.computeFaceNormals();
        geo.computeVertexNormals();
        
        geo.verticesNeedUpdate = true;

       
        womb.modelLoader.assignUVs( geo );
        var m = new THREE.Mesh( geo , new THREE.MeshBasicMaterial({
            color:0x000000,
            side: THREE.DoubleSide
          })
        );
        m.scale.multiplyScalar( 5 );


        var newGeo = new THREE.Geometry();
       
        THREE.GeometryUtils.merge( newGeo , m );

        womb.fboParticles = new FBOParticles({
          audioTexture: womb.audio.texture,
          numberOfParticles:1000000,
          particleSize: 100,
          geometry: newGeo
        });

        womb.fboParticles.update = function(){
          this.body.rotation.z += .001;
        }

        womb.fboParticles.particles.scale.multiplyScalar( .05 );
        m.scale.multiplyScalar( .05 );

        womb.fboParticles.body.add( m );
              
      }
    }
  
  );



  womb.update = function(){
    womb.voice.gain.gain.value = 1.5;
    womb.audio.gain.gain.value = .8;

    //console.log( womb.time );

    var u = womb.thing.mesh.material.uniforms;
    u.seed.value.x = ( Math.sin( womb.time.value / 1000.0 ) -1.0 ) / 2;
    u.seed.value.y = ( Math.cos( womb.time.value / 1000.0 ) -1.0 ) / 2;



  }

  womb.start = function(){
 
    womb.slides.push( womb.fractal1 );
    womb.slides.push( womb.fboParticles );
    womb.slides.push( womb.ps );
    womb.slides.push( womb.mandala1 );
    womb.slides.push( womb.fractal1 );
    womb.slides.push( womb.clickableBeing );
    womb.slides.push( womb.thing );


    womb.slides[0].enter();
    womb.audio.play();
    womb.voice.play();

  }

  setTimeout( createTextMeshes, 1000 );

  function createTextMeshes(){
  
    womb.cabbibo      = createText( 'cabbibo' , 10  );
    womb.presents     = createText( 'presents' , 50 );
    womb.holly        = createText( 'HOLLY' ,  10 );
    
   
  
  };


  function createText(  text  , size ){

    if( !size ) size = 100;
    var u = {
      texture:    { type: "t", value: womb.voice.texture },
      image:      { type: "t", value: womb.audio.texture },

      color:      { type: "v3", value: new THREE.Vector3( 1,  1 , 1 ) },
      time:       womb.time,
      pow_noise:  { type: "f" , value: 0.01 },
      pow_audio:  { type: "f" , value: .04 },
    }
   
    var uniforms =  THREE.UniformsUtils.merge( [
        THREE.ShaderLib['basic'].uniforms,
        u,
    ]);

    var textTexture = womb.textCreator.createTexture( text );
    uniforms.time             = womb.time;
    uniforms.texture.value    = womb.audio.texture;
    uniforms.image.value      = textTexture;

    var material = new THREE.ShaderMaterial( {
      uniforms:       uniforms, 
      vertexShader:   vertexShaders.passThrough,
      fragmentShader: fragmentShaders.audio.color.image.uv_absDiamond_sub,
      transparent:    true,
      fog:            true,
      opacity:        0.1,
      side:           THREE.DoubleSide
    });

     vertexChunk = [
    
      "vec3 nPos = normalize(pos);",
      
      "vec3 offset;",
      
      "offset.x = nPos.x + Time * .3;",
      "offset.y = nPos.y + Time * .2;",
      "offset.z = nPos.z + Time * .24;",
      
      "vec2 a = vec2( abs( nPos.y ) , 0.0 );",
      
      "float audio = texture2D( AudioTexture , a).r;",
      "vDisplacement = NoisePower * snoise3( offset );",
      "vDisplacement += AudioPower * audio * audio;",
    
      "pos *=  1.0 + vDisplacement;"
 

    ];

    fragmentChunk = [

      
      "float audio = texture2D( AudioTexture , vec2( vUv.x , 0.0 ) ).r;",
      "float audio1 = texture2D( AudioTexture , vec2( vUv.y , 0.0 ) ).r;",

      "vec4 image = texture2D( Texture , vUv );",
      "color = image.rgb * vec3( audio , 0.0 , audio1 );",
      "opacity = image.a * (1.0 - vDisplacement);"

    ];

    //womb.loader.addToLoadBar();

    var textShader = new ShaderCreator({
      fragmentChunk: fragmentChunk,
      vertexChunk: vertexChunk,
      uniforms:{ 
       
        Time:         womb.time,
        Color:        { type:"v3" , value: new THREE.Vector3( .1 , .2 , .3 ) },
        AudioTexture: { type:"t"  , value: womb.audio.texture },
        Texture: { type:"t"  , value: textTexture },
        NoisePower:   { type:"f"  , value: .1 + Math.random()*.2 },
        AudioPower:   { type:"f"  , value: .2 + Math.random()*.2 }
      
      },
      transparent: true

    });


    var mesh = new THREE.Mesh( new THREE.PlaneGeometry(size , size )  , textShader.material );
  
    mesh.scale.x *= textTexture.scaledWidth;

    var being = womb.creator.createBeing();
    being.body.add( mesh );
    return being;

  }

  window.addEventListener( 'keydown' , onKeyPress , false );

  function onKeyPress( e ){

    if( e.keyCode == 39 ){ womb.nextSlide() }
    if( e.keyCode == 37 ){ womb.previousSlide() }
    console.log( e );

  }


});

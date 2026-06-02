/* TIMO interactivo sensorial - versión QR sin AR/MindAR */
const ASSETS = {
  portada: {
    fondo: "assets/portada/fondo_color.png",
    bolita: "assets/portada/timo_bolita.png",
    abierto: "assets/portada/timo_open.png",
    luciernagas: "assets/portada/luciernagas.png",
    conejo: "assets/portada/conejo.png",
    pajaro: "assets/portada/pajaro.png",
    mariposa: "assets/portada/mariposa.png",
    pelota: "assets/portada/pelota.png"
  },
  respira: {
    fondo: "assets/respira/fondo_color.png",
    timoTronco: "assets/respira/timo_tronco.png",
    pajaro: "assets/respira/pajaro.png",
    mariposa: "assets/respira/mariposa.png",
    luciernagas: "assets/respira/luciernagas.png"
  },
  tunel: {
    fondo: "assets/tunel/fondo_color.png",
    bolita: "assets/tunel/timo_bolita.png",
    pelota: "assets/tunel/pelota.png"
  },
  final: {
    fondo: "assets/final/fondo_noche_color.png",
    timo: "assets/final/timo.png",
    mono: "assets/final/mono.png",
    conejo: "assets/final/conejo.png",
    pajaro: "assets/final/pajaro.png",
    mariposa: "assets/final/mariposa.png",
    pelota: "assets/final/pelota.png",
    luciernagas: "assets/final/luciernagas.png"
  }
};

const SOUND_PATHS = {
  stressLow: "sounds/stress_low.mp3",
  stressHigh: "sounds/stress_high.mp3",
  stressNoise: "sounds/stress_noise.mp3",
  heartbeatFast: "sounds/heartbeat_fast.mp3",
  heartbeatSoft: "sounds/heartbeat_soft.mp3",
  tunnelEcho: "sounds/tunnel_echo.mp3",
  rollingBall: "sounds/rolling_ball.mp3",
  bump: "sounds/bump.mp3",
  ballTap: "sounds/ball_tap.mp3",
  calmAir: "sounds/calm_air.mp3",
  deepBreath: "sounds/deep_breath.mp3",
  fireflies: "sounds/fireflies_soft.mp3",
  softChimes: "sounds/soft_chimes.mp3",
  happyWind: "sounds/happy_wind.mp3",
  forest: "sounds/forest_night.mp3",
  butterfly: "sounds/butterfly_flutter.mp3",
  playBall: "sounds/play_ball.mp3",
  softLaughs: "sounds/soft_laughs.mp3",
  aplausos: "sounds/aplausos.mp3"
};

const $ = (id) => document.getElementById(id);
const app = $("app"), fondo = $("fondo"), cieloColor = $("cieloColor"), oscuridad = $("oscuridad"), spotLuz = $("spotLuz"), ruido = $("ruido"), flash = $("flash"), luciernagasCampo = $("luciernagasCampo"), luciernagasDibujo = $("luciernagasDibujo"), timo = $("timo"), tronco = $("tronco"), pelota = $("pelota"), mono = $("mono"), conejo = $("conejo"), pajaro = $("pajaro"), mariposa = $("mariposa"), ayEco = $("ayEco"), titulo = $("titulo"), instruccion = $("instruccion"), cuento = $("cuento"), btnSonido = $("btnSonido"), btnSensible = $("btnSensible"), avisoAudio = $("avisoAudio");

let escenaActual = "portada";
let escenaEntradaQR = null;
let sonidoActivo = false;
let modoSensible = false;
let estadoPortada = "oscuro";
let progresoPortada = 0;
let timoAbierto = false;
let progresoRespira = 0;
let respirando = false;
let tunelX = 0.74;
let tunelY = 0.58;
let pelotaTunelX = 0.52;
let pelotaTunelY = 0.58;
let pelotaLibre = false;
let pelotaEncontrada = false;
let timoListoParaEmpujar = false;
let ultimoGolpe = 0;
let pointerActivo = false;
let ultimaY = 0;
let turnoPelotaFinal = 0;

const sonidos = {};
Object.entries(SOUND_PATHS).forEach(([key, path]) => {
  sonidos[key] = new Audio(path);
  sonidos[key].loop = !["bump", "ballTap", "playBall", "aplausos"].includes(key);
  sonidos[key].volume = 0;
});

function setVol(name, value) {
  if (!sonidos[name]) return;
  sonidos[name].volume = Math.max(0, Math.min(modoSensible ? value * 0.45 : value, 1));
}
function bajarTodosLosSonidos(){ Object.keys(sonidos).forEach(k => setVol(k,0)); }
function playOneShot(name, vol=.6){
  if(!sonidoActivo || !sonidos[name]) return;
  const s = sonidos[name];
  s.currentTime = 0;
  s.volume = modoSensible ? vol*.45 : vol;
  s.play().catch(()=>{});
}
function encenderSonido(){
  sonidoActivo = true;
  Object.values(sonidos).forEach(s => s.play().catch(()=>{}));
  btnSonido.textContent = "🔇";
  avisoAudio.style.opacity = 0;
  setTimeout(()=> avisoAudio.classList.add("oculto"), 600);
  actualizarAudioPorEscena();
}
function apagarSonido(){
  sonidoActivo = false;
  Object.values(sonidos).forEach(s => { s.pause(); s.currentTime = 0; s.volume = 0; });
  btnSonido.textContent = "🎧";
}
function vibrar(patron){
  if(!modoSensible && navigator.vibrate) navigator.vibrate(patron);
  else { app.classList.add("vibracionVisual"); setTimeout(()=>app.classList.remove("vibracionVisual"),300); }
}
function flashRapido(){ if(modoSensible) return; flash.style.opacity=.22; setTimeout(()=>flash.style.opacity=0,120); }
function setTexto(t,i,c=""){ titulo.textContent=t; instruccion.textContent=i; cuento.textContent=c; }
function mostrar(el, src, left, top, width){
  if(!el) return;
  el.src = src;
  el.classList.remove("oculto");
  el.style.left = left;
  el.style.top = top;
  el.style.width = width;
  el.style.transform = "translate(-50%,-50%)";
  el.style.opacity = 1;
}
function ocultarTodo(){
  [timo, tronco, pelota, mono, conejo, pajaro, mariposa, luciernagasDibujo].forEach(el => {
    el.className = el.classList.contains("personaje") ? "personaje oculto" : "capa oculto";
    el.removeAttribute("style");
    if(el.tagName === "IMG") el.src = "";
  });
  ayEco.className = "oculto";
  luciernagasCampo.innerHTML = "";
}
function crearLuciernagas(cantidad=8, foco={x:50,y:50,radio:20}){
  luciernagasCampo.innerHTML = "";
  for(let i=0;i<cantidad;i++){
    const luz = document.createElement("span");
    luz.className = "luciernaga";
    const ang = Math.random()*Math.PI*2;
    const r = Math.random()*foco.radio;
    luz.style.left = `${foco.x + Math.cos(ang)*r}%`;
    luz.style.top = `${foco.y + Math.sin(ang)*r}%`;
    luz.style.animationDelay = `${Math.random()*4}s`;
    luz.style.animationDuration = `${3+Math.random()*4}s`;
    luciernagasCampo.appendChild(luz);
  }
}
function intensidadLuciernagas(v){ luciernagasCampo.style.opacity=v; if(!luciernagasDibujo.classList.contains("oculto")) luciernagasDibujo.style.opacity=v; }
function clima({os=.5, ruidoOp=.1, brillo=1, sat=1, contraste=1, color="transparent", colorOp=.2}){
  oscuridad.style.opacity = os;
  ruido.style.opacity = ruidoOp;
  fondo.style.filter = `brightness(${brillo}) saturate(${sat}) contrast(${contraste})`;
  cieloColor.style.background = color;
  cieloColor.style.opacity = colorOp;
}

function actualizarBotones(){
  document.querySelectorAll("#menu [data-scene]").forEach(b => {
    const visible = true;
    b.style.display = visible ? "" : "none";
    b.classList.toggle("activo", b.dataset.scene === escenaActual);
  });
}
function actualizarAudioPorEscena(){
  if(!sonidoActivo) return;
  bajarTodosLosSonidos();
  if(escenaActual === "portada") audioPortada();
  if(escenaActual === "respira") audioRespira();
  if(escenaActual === "tunel") audioTunel();
  if(escenaActual === "final") audioFinal();
}

function audioPortada(){
  const p = progresoPortada, estres = 1-p, calma = p;
  setVol("forest", .55*estres); setVol("heartbeatFast", .28*estres); setVol("stressLow", .35*estres); setVol("stressHigh", .18*estres); setVol("stressNoise", .25*estres); setVol("rolling_Ball", .25*estres); setVol("play_Ball", .25*estres);setVol("fireflies", .06 + .22*calma); setVol("softChimes", .14*calma);
  setVol("heartbeatSoft", .03 + .16*calma); setVol("calmAir", .08 + .35*calma); setVol("correr", .08 + .35*calma); 
}
function audioRespira(){
  const calma = progresoRespira, tension = 1-calma;
  setVol("heartbeatFast", .28*tension); setVol("stressLow", .16*tension); setVol("heartbeatSoft", .08 + .18*calma); setVol("deepBreath", .18 + .42*calma); setVol("calmAir", .12 + .38*calma); setVol("fireflies", .06 + .20*calma); setVol("butterfly", .08 + .12*calma);
}
function audioTunel(){
  const d = distanciaAPelota(), cerca = 1 - Math.min(d/.55,1);
  setVol("heartbeatFast", .20 + .25*(1-cerca)); setVol("heartbeatSoft", .18*cerca); setVol("tunnelEcho", .42*(1-cerca)+.10); setVol("rollingBall", .14 + .24*cerca); setVol("calmAir", .12*cerca);
}
function audioFinal(){ setVol("happyWind",.32); setVol("forest",.30); setVol("fireflies",.20); setVol("softChimes",.22); setVol("butterfly",.16); setVol("softLaughs",.14); }

function cargarEscena(nombre){
  escenaActual = nombre;
  progresoPortada = 0; progresoRespira = 0; respirando = false; timoAbierto = false;
  estadoPortada = "oscuro";
  tunelX = .74; tunelY = .58; pelotaTunelX = .52; pelotaTunelY = .58; pelotaLibre = false; pelotaEncontrada = false; timoListoParaEmpujar = false;
  ocultarTodo(); actualizarBotones();
  spotLuz.style.opacity = 1;
  spotLuz.style.transform = "translate(-50%,-50%)";
  if(nombre === "portada") escenaPortada();
  if(nombre === "respira") escenaRespira();
  if(nombre === "tunel") escenaTunel();
  if(nombre === "final") escenaFinal();
  actualizarAudioPorEscena();
}

function escenaPortada(){
  fondo.src = ASSETS.portada.fondo;
  clima({os:.94, ruidoOp:.32, brillo:.42, sat:.62, contraste:1.15, color:"#07111f", colorOp:.25});
  crearLuciernagas(5,{x:18,y:55,radio:4});
  mostrar(luciernagasDibujo, ASSETS.portada.luciernagas, "18%", "50%", "clamp(22px,4vw,52px)");
  mostrar(timo, ASSETS.portada.bolita, "18%", "74%", "clamp(90px,13vw,160px)");
  timo.classList.add("temblar");
  mostrar(conejo, ASSETS.portada.conejo, "74%", "82%", "clamp(55px,9vw,120px)");
  mostrar(pajaro, ASSETS.portada.pajaro, "48%", "38%", "clamp(40px,7vw,85px)");
  mostrar(mariposa, ASSETS.portada.mariposa, "54%", "55%", "clamp(28px,5vw,60px)");
  mostrar(pelota, ASSETS.portada.pelota, "60%", "78%", "clamp(45px,7vw,95px)");
  [conejo,pajaro,mariposa,pelota].forEach(el => { el.style.opacity = ".12"; el.style.filter = "brightness(.35) blur(1px)"; });
  spotLuz.style.left = "18%"; spotLuz.style.top = "72%";
  setTexto("", "Toca suave", "Timo sale al mundo, pero todo se siente muy intenso.");
  audioPortada();
}
function tocarPortada(){
  if(estadoPortada !== "oscuro") return;

  estadoPortada = "regular";

  if(!sonidoActivo) encenderSonido();

  vibrar([35,20,45]);
  flashRapido();

  timo.className = "personaje";
  timo.src = ASSETS.portada.bolita;
  timo.style.left = "18%";
  timo.style.top = "74%";
  timo.style.width = "clamp(90px,13vw,160px)";
  timo.style.opacity = "1";
  timo.style.display = "block";
  timo.style.transform = "translate(-50%,-50%) rotate(0deg)";
  timo.style.transition = "none";

  luciernagasDibujo.style.left = "18%";
  luciernagasDibujo.style.top = "56%";
  spotLuz.style.left = "18%";
  spotLuz.style.top = "72%";

  setTimeout(() => {
    timo.style.transition = "left 1.25s ease-in, transform 1.25s ease-in";
    timo.style.left = "115%";
    timo.style.transform = "translate(-50%,-50%) rotate(760deg)";

    luciernagasDibujo.style.left = "60%";
    spotLuz.style.left = "45%";
  }, 50);

  setTexto(
    "¡Uy!",
    "Desliza suavemente tu dedo para que Timo vuelva",
    "Timo se hizo bolita para protegerse. Necesita que el mundo baje su intensidad."
  );

  setVol("heartbeatFast", .38);
  setVol("stressNoise", .32);
  setVol("rollingBall", .32);
}

function regularPortada(delta){
  progresoPortada = Math.max(0, Math.min(1, progresoPortada + delta/1500));
  const p = progresoPortada;

  [conejo,pajaro,mariposa,pelota].forEach(el => {
    el.style.opacity = .12 + p*.88;
    el.style.filter = `brightness(${.35 + p*.75}) blur(${1-p}px)`;
    if(p>.35) el.classList.add("flotar");
  });

  clima({
    os:.94-p*.86,
    ruidoOp:.32-p*.30,
    brillo:.42+p*.68,
    sat:.62+p*.35,
    contraste:1.15-p*.1,
    color:"#ffb36b",
    colorOp:.08+p*.18
  });

  intensidadLuciernagas(.20 + p*.35);

  spotLuz.style.left = `${18 + p*18}%`;
  spotLuz.style.top = `${72 + p*2}%`;
  spotLuz.style.transform = `translate(-50%,-50%) scale(${1+p*.9})`;

  luciernagasDibujo.style.left = `${18 + p*18}%`;
  luciernagasDibujo.style.top = `${56 - p*3}%`;
  luciernagasDibujo.style.width = `clamp(22px,${4 + p*1.2}vw,56px)`;

  if(p > .02 && p < .95){
    const regreso = (p-.02)/(.95-.02);
    const x = 115 - regreso*81;
    const y = 74 + regreso*6;
    const rot = 760 - regreso*760;

    timo.className = "personaje";
    timo.src = ASSETS.portada.bolita;
    timo.style.left = `${x}%`;
    timo.style.top = `${y}%`;
    timo.style.width = "clamp(78px,11vw,138px)";
    timo.style.opacity = "1";
    timo.style.display = "block";
    timo.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
  }

  if(p > .95 && estadoPortada !== "calma"){
    estadoPortada = "calma";
    timoAbierto = true;

    timo.className = "personaje";
    timo.src = ASSETS.portada.abierto;
    timo.style.left = "34%";
    timo.style.top = "80%";
    timo.style.width = "clamp(155px,22vw,280px)";
    timo.style.opacity = "1";
    timo.style.display = "block";
    timo.style.transition = "all 1.6s ease-in-out";
    timo.style.transform = "translate(-50%,-50%)";

    setTexto(
      "",
      "Gracias por esperar",
      "Cuando el mundo bajó su intensidad, Timo pudo volver a mirar."
    );
  }

  audioPortada();
}

function reenrollarTimo(){

  if(escenaActual !== "portada") return;
  timoAbierto = false;
  estadoPortada = "regular";
  progresoPortada = .18;
  timo.classList.remove("volver","rodarFuera","temblar");
  timo.src = ASSETS.portada.bolita;
  timo.classList.remove("oculto");
  timo.style.left = "18%"; timo.style.top = "74%"; timo.style.width = "clamp(90px,13vw,160px)"; timo.style.opacity = 1;
  timo.classList.add("enrollarTimo");
  setTimeout(()=>{ timo.classList.remove("enrollarTimo"); timo.classList.add("temblar"); }, 2800);
  mostrar(luciernagasDibujo, ASSETS.portada.luciernagas, "18%", "56%", "clamp(22px,4vw,52px)");
  intensidadLuciernagas(.25);
  clima({os:.72, ruidoOp:.18, brillo:.65, sat:.72, contraste:1.1, color:"#4e5467", colorOp:.18});
  setTexto("", "Toca suave otra vez", "A veces Timo necesita volver a sentirse seguro.");
  audioPortada();
}

function escenaRespira(){
  fondo.src = ASSETS.respira.fondo;
  // Más clara y cercana a Timo: no inicia tan oscura.
  fondo.style.transform="scale(.94)";
  fondo
  clima({os:.28, ruidoOp:.06, brillo:.92, sat:.92, contraste:1.02, color:"#f0b67a", colorOp:.12});
  crearLuciernagas(6,{x:25,y:58,radio:8});
  mostrar(timo, ASSETS.respira.timoTronco, "24%", "64%", "clamp(165px,34vw,420px)");
  timo.classList.add("temblar");
  mostrar(mariposa, ASSETS.respira.mariposa, "18%", "40%", "clamp(22px,4vw,48px)");
  mostrar(pajaro, ASSETS.respira.pajaro, "12%", "28%", "clamp(30px,5vw,62px)");
  mostrar(luciernagasDibujo, ASSETS.respira.luciernagas, "25%", "52%", "clamp(22px,4vw,54px)");
  mariposa.style.opacity = .25; pajaro.style.opacity = .25;
  spotLuz.style.left = "24%"; spotLuz.style.top = "64%";
  spotLuz.style.transform = "translate(-50%,-50%) scale(.82)";
  setTexto("Respira", "Mantén presionada la pantalla para inhalar. Suelta para exhalar con Timo.", "El tronco es su apoyo. Con cada respiración, el mundo se siente más seguro.");
}
function iniciarRespira(){
  if(escenaActual !== "respira") return;
  respirando = true;
  if(!sonidoActivo) encenderSonido();
  timo.classList.remove("temblar");
  timo.classList.add("respiracionSuave");
  setTexto("Inhala", "Sostén un momento…", "Timo siente el aire entrar despacio.");
  setVol("deepBreath", .45);
}
function completarRespiracion(){
  if(escenaActual !== "respira" || !respirando) return;
  respirando = false;
  moverRespira(1);
}
function moverRespira(paso=1){
  progresoRespira = Math.max(0, Math.min(1, progresoRespira + .18*paso));
  const p = progresoRespira;
  const x = 24 + p*34, y = 64 - p*5;
  timo.style.left = `${x}%`; timo.style.top = `${y}%`; timo.style.width = `clamp(${120-p*10}px,${25-p*3}vw,330px)`;
  luciernagasDibujo.style.left = `${25+p*18}%`; luciernagasDibujo.style.top = `${52-p*5}%`; luciernagasDibujo.style.width = `clamp(26px,${5+p}vw,76px)`;
  mariposa.style.left = `${18+p*32}%`; mariposa.style.top = `${40-p*7}%`; mariposa.style.opacity = .25 + p*.75; if(p>.25) mariposa.classList.add("flotar");
  pajaro.style.left = `${12+p*48}%`; pajaro.style.top = `${28+p*2}%`; pajaro.style.opacity = .25 + p*.75; if(p>.25) pajaro.classList.add("flotar");
  spotLuz.style.left = `${x}%`; spotLuz.style.top = `${y}%`; spotLuz.style.transform = `translate(-50%,-50%) scale(${.82+p*.50})`;
  clima({os:.28-p*.18, ruidoOp:.06-p*.04, brillo:.92+p*.10, sat:.92+p*.10, contraste:1.02-p*.02, color:"#f7c47d", colorOp:.12+p*.14});
  intensidadLuciernagas(.20+p*.35);
  if(p<1) setTexto("Exhala", "Suelta y vuelve a intentarlo", "Timo tiembla menos. El aire ya cabe en su cuerpo.");
  else { timo.classList.remove("temblar"); timo.classList.add("respiracionSuave"); setTexto("Respira", "Timo se asoma", "El miedo apareció, pero ya no ocupaba todo el espacio."); }
  audioRespira();
}

function escenaTunel(){

  fondo.src=ASSETS.tunel.fondo;

  clima({
    os:.34,
    ruidoOp:.16,
    brillo:.75,
    sat:.82,
    contraste:1.12,
    color:"#de7d4f",
    colorOp:.20
  });

  crearLuciernagas(
    6,
    {x:62,y:64,radio:8}
  );

  mostrar(
    luciernagasDibujo,
    ASSETS.portada.luciernagas,
    "69%",
    "62%",
    "clamp(28px,5vw,70px)"
  );

  mostrar(
    timo,
    ASSETS.tunel.bolita,
    "69%",
    "66%",
    "clamp(70px,10vw,130px)"
  );

  mostrar(
    pelota,
    ASSETS.tunel.pelota,
    "52%",
    "66%",
    "clamp(45px,7vw,90px)"
  );

  pelota.classList.add("flotar");

  spotLuz.style.left="69%";
  spotLuz.style.top="66%";

  setTexto(
    "El túnel",
    "Toca para recorrer el túnel",
    "Cuando encuentre la pelota, Timo buscará una forma de sacarla."
  );

  pelotaEncontrada=false;
  timoListoParaEmpujar=false;

  actualizarTimoTunel();

}


function distanciaAPelota(){

 const dx=
 pelotaTunelX-tunelX;

 const dy=
 pelotaTunelY-tunelY;

 return Math.sqrt(
   dx*dx+dy*dy
 );

}


function actualizarTimoTunel(){

 const x=
 10+tunelX*80;

 const y=
 25+tunelY*70;

 const px=
 10+pelotaTunelX*80;

 const py=
 25+pelotaTunelY*70;


 timo.style.left=`${x}%`;
 timo.style.top=`${y}%`;

 timo.style.transform=
 `translate(-50%,-50%)
 rotate(${(1-tunelX)*720}deg)`;


 pelota.style.left=`${px}%`;
 pelota.style.top=`${py}%`;


 luciernagasDibujo.style.left=
 `${x}%`;

 luciernagasDibujo.style.top=
 `${y-4}%`;

 spotLuz.style.left=
 `${x}%`;

 spotLuz.style.top=
 `${y}%`;

 audioTunel();

}


function avanzarTimoTunelPorTap(){

 if(
   escenaActual!=="tunel"
 ) return;

 if(
   pelotaLibre
 ) return;


 // FASE 1:
 // recorrer túnel


 if(!pelotaEncontrada){

   const dx=
   pelotaTunelX-tunelX;

   const dy=
   pelotaTunelY-tunelY;

   const distancia=
   Math.sqrt(
    dx*dx+dy*dy
   );


   if(
      distancia>.10
   ){

      tunelX+=dx*.18;

      tunelY+=dy*.18;

      actualizarTimoTunel();

      return;

   }


   pelotaEncontrada=true;

   playOneShot(
      "ballTap",
      .58
   );

   setTexto(
      "La encontró",
      "Toca otra vez",
      "Ahora Timo buscará cómo ayudarla."
   );

   return;

 }


 // FASE 2
 // acomodarse detrás


 if(
    !timoListoParaEmpujar
 ){

    const objetivoX=
    pelotaTunelX+.14;

    tunelX+=
    (objetivoX-tunelX)
    *.45;

    tunelY+=
    (pelotaTunelY-tunelY)
    *.45;

    actualizarTimoTunel();

    if(
      Math.abs(
      tunelX-objetivoX
      )<.03
    ){

      timoListoParaEmpujar=
      true;

      setTexto(
        "Listo",
        "Toca para empujar",
        "Timo encontró otra forma."
      );

    }

    return;

 }


 empujarPelotaTunel();

}



function empujarPelotaTunel(){

 playOneShot(
   "ballTap",
   .65
 );

 pelota.classList.remove(
   "saltarPelota"
 );

 void pelota.offsetWidth;

 pelota.classList.add(
   "saltarPelota"
 );


 // vuelve por donde entró

 pelotaTunelX+=.07;

 pelotaTunelY+=
 (tunelY-pelotaTunelY)
 *.18;


 actualizarTimoTunel();


 if(
   pelotaTunelX>=1.05
 ){

   pelotaLibre=true;

   playOneShot(
     "aplausos",
     .85
   );

   playOneShot(
      "softLaughs",
      .55
   );


   setTexto(
      "¡Lo logró!",
      "Sacaste la pelota",
      "Timo encontró una manera distinta de ayudar."
   );

 }

}
function golpeTunel(){
  const now = Date.now(); if(now-ultimoGolpe<800) return; ultimoGolpe=now;
  playOneShot("bump",.7); vibrar([40,30,60]); ayEco.className=""; setTimeout(()=>ayEco.classList.add("oculto"),1100);
}
function moverTunelDesktop(dx,dy=0){ tunelX += dx; tunelY += dy; if(tunelX<0||tunelX>1||tunelY<.15||tunelY>.9) golpeTunel(); tunelX=Math.max(0,Math.min(1,tunelX)); tunelY=Math.max(.15,Math.min(.9,tunelY)); actualizarTimoTunel(); }

function escenaFinal(){
  fondo.src = ASSETS.final.fondo;
  clima({os:.18, ruidoOp:0, brillo:.82, sat:1.05, contraste:1.05, color:"#16264d", colorOp:.30});
  crearLuciernagas(6,{x:50,y:48,radio:18});
  mostrar(luciernagasDibujo, ASSETS.final.luciernagas, "50%", "46%", "clamp(36px,7vw,86px)");
  mostrar(timo, ASSETS.final.timo, "76%", "82%", "clamp(82px,12vw,145px)");
  mostrar(mono, ASSETS.final.mono, "48%", "77%", "clamp(120px,18vw,230px)");
  mostrar(conejo, ASSETS.final.conejo, "22%", "84%", "clamp(42px,7vw,78px)");
  mostrar(pajaro, ASSETS.final.pajaro, "58%", "26%", "clamp(28px,5vw,58px)"); pajaro.classList.add("flotar");
  mostrar(mariposa, ASSETS.final.mariposa, "40%", "36%", "clamp(20px,3.5vw,40px)"); mariposa.classList.add("flotar");
  mostrar(pelota, ASSETS.final.pelota, "58%", "78%", "clamp(42px,7vw,85px)");
  turnoPelotaFinal = 0;
  pelota.style.transition = "left .55s ease-out, top .55s ease-out, transform .55s ease-out";
  pelota.classList.add("pelotaInteractiva");
  spotLuz.style.left = "50%"; spotLuz.style.top = "62%"; spotLuz.style.transform = "translate(-50%,-50%) scale(2.0)";
  intensidadLuciernagas(.30);
  setTexto("Juguemos todos", "Toca la pelota para lanzarla", "Cada amigo busca su manera de alcanzarla y devolverla.");
  audioFinal();
}
const destinosPelotaFinal = [
  {nombre:"Timo", x:"76%", y:"82%", tipo:"salta", el:()=>timo},
  {nombre:"Mono", x:"48%", y:"82%", tipo:"salta", el:()=>mono},
  {nombre:"Conejo", x:"22%", y:"84%", tipo:"salta", el:()=>conejo},
  {nombre:"Pájaro", x:"58%", y:"26%", tipo:"vuela", el:()=>pajaro},
  {nombre:"Mariposa", x:"40%", y:"36%", tipo:"vuela", el:()=>mariposa}
];
function animarPersonajeDestino(destino){
  const el = destino.el ? destino.el() : null;
  if(!el) return;
  const clase = destino.tipo === "vuela" ? "alcanzarPelotaVuelo" : "saltoPersonaje";
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
}
function lanzarPelota(){
  if(escenaActual !== "final") return;
  const origen={x:"58%",y:"78%"}, destino=destinosPelotaFinal[turnoPelotaFinal];
  turnoPelotaFinal = (turnoPelotaFinal+1)%destinosPelotaFinal.length;
  pelota.style.left=destino.x; pelota.style.top=destino.y; pelota.style.transform="translate(-50%,-50%) scale(1.12) rotate(180deg)";
  animarPersonajeDestino(destino);
  playOneShot("playBall",.75); playOneShot("softLaughs",.55); playOneShot("aplausos",0.45); setVol("happyWind",.55); vibrar(35);
  setTexto("¡Va para " + destino.nombre + "!", "Toca otra vez la pelota", "La pelota vuelve para seguir jugando con todos.");
  setTimeout(()=>{ pelota.style.left=origen.x; pelota.style.top=origen.y; pelota.style.transform="translate(-50%,-50%) scale(1) rotate(0deg)"; }, 720);
}

function manejarTapGlobal(e){
  if(e.target.closest("#menu")) return;
if(escenaActual === "final" && e.target.closest("#pelota")) return;  if(!sonidoActivo) encenderSonido();
  if(escenaActual === "portada" && estadoPortada === "oscuro"){ tocarPortada(); return; }
  if(escenaActual === "portada" && estadoPortada === "calma" && e.target === timo){ reenrollarTimo(); return; }
  if(escenaActual === "tunel"){ avanzarTimoTunelPorTap(); return; }
  if(escenaActual === "final"){ intensidadLuciernagas(.65); setTimeout(()=>intensidadLuciernagas(.42),500); }
}

window.addEventListener("pointerdown", e => { pointerActivo=true; ultimaY=e.clientY; if(escenaActual === "respira" && !e.target.closest("#menu")) iniciarRespira(); });
window.addEventListener("pointerup", () => { pointerActivo=false; completarRespiracion(); });
window.addEventListener("pointercancel", () => { pointerActivo=false; completarRespiracion(); });
window.addEventListener("pointermove", e => {
  if(!pointerActivo) return;
  const dy = ultimaY - e.clientY; ultimaY = e.clientY;
  if(escenaActual === "portada" && estadoPortada === "regular" && Math.abs(dy)>1) regularPortada(Math.max(dy,0));
});
window.addEventListener("wheel", e => { const delta = -e.deltaY; if(escenaActual === "portada" && estadoPortada === "regular") regularPortada(Math.max(delta,0)); });
window.addEventListener("click", manejarTapGlobal);
window.addEventListener("keydown", e => {
  if(!escenaEntradaQR){ if(e.key==="1") cargarEscena("portada"); if(e.key==="2") cargarEscena("respira"); if(e.key==="3") cargarEscena("tunel"); if(e.key==="4") cargarEscena("final"); }
  if(e.code === "Space") manejarTapGlobal({target:document.body, targetClosest:false});
  if(escenaActual === "tunel"){ if(e.key === "ArrowRight" || e.key.toLowerCase()==="d") moverTunelDesktop(.035,0); if(e.key === "ArrowLeft" || e.key.toLowerCase()==="a") moverTunelDesktop(-.035,0); if(e.key === "ArrowUp" || e.key.toLowerCase()==="w") moverTunelDesktop(0,-.025); if(e.key === "ArrowDown" || e.key.toLowerCase()==="s") moverTunelDesktop(0,.025); }
});
pelota.addEventListener("click", e => {
  e.stopPropagation();
  if(!sonidoActivo) encenderSonido();
  lanzarPelota();
});

pelota.addEventListener("pointerdown", e => {
  e.stopPropagation();
  if(!sonidoActivo) encenderSonido();
  lanzarPelota();
});


document.querySelectorAll("#menu [data-scene]").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); if(!sonidoActivo) encenderSonido(); cargarEscena(btn.dataset.scene); }));
btnSonido.addEventListener("click", e => { e.stopPropagation(); sonidoActivo ? apagarSonido() : encenderSonido(); });
btnSensible.addEventListener("click", e => { e.stopPropagation(); modoSensible=!modoSensible; app.classList.toggle("modoSensible",modoSensible); btnSensible.classList.toggle("activo",modoSensible); actualizarAudioPorEscena(); });

const btnEscanear = $("btnEscanear");

if (btnEscanear) {
  btnEscanear.addEventListener("click", e => {
    e.stopPropagation();

    document.body.classList.remove("escena-activa");
    document.body.classList.add("modo-scan");

    app.style.display = "none";

    const arScene = document.querySelector("a-scene");

    if (arScene) {
      arScene.style.display = "block";
      arScene.style.visibility = "visible";
      arScene.style.opacity = "1";

      arScene.removeAttribute("paused");

      setTimeout(() => {
        if (typeof arScene.play === "function") {
          arScene.play();
        }
      }, 300);
    }
  });
}

$("btnEntrarPortada").addEventListener("click", () => {
  $("pantallaInicio").style.display = "none";

const arScene = document.querySelector("a-scene");

if (arScene) {
  arScene.style.display = "none";
  arScene.style.visibility = "hidden";
  arScene.style.opacity = "0";
}

  app.style.display = "block";
  escenaEntradaQR = null;

  cargarEscena("portada");
});


/* ==========================
   INICIO QR / MINDAR
========================== */

const params = new URLSearchParams(window.location.search);
const escenaQR = params.get("escena");
const modoAR = params.get("ar") === "1";

const escenasValidas = [
  "portada",
  "respira",
  "tunel",
  "final"
];

if (escenaQR && escenasValidas.includes(escenaQR)) {

  escenaEntradaQR = escenaQR;

  $("pantallaInicio").style.display = "none";

  const arScene = document.querySelector("a-scene");
  if (arScene) arScene.style.display = "none";

  app.style.display = "block";

  cargarEscena(escenaQR);

}
else if (modoAR) {
  escenaEntradaQR = "scan";
  document.body.classList.add("modo-scan");
  document.body.classList.remove("escena-activa");

  $("pantallaInicio").style.display = "none";
  app.style.display = "none";
}

else {

  const arScene = document.querySelector("a-scene");

  if (arScene) {
    arScene.style.display = "none";
  }

  app.style.display = "block";

  cargarEscena("portada");

}

/* ==========================
   CONEXIÓN MINDAR
========================== */

window.addEventListener("DOMContentLoaded", () => {

  const targets = document.querySelectorAll("[mindar-image-target]");

  const escenaPorTarget = [
    "portada",
    "respira",
    "tunel",
    "final"
  ];

  targets.forEach((target, index) => {

    target.addEventListener("targetFound", () => {

      const escenaDetectada = escenaPorTarget[index];

      if (!escenaDetectada) return;

      escenaEntradaQR = "scan";

      document.body.classList.remove("modo-scan");
      document.body.classList.add("escena-activa");

      const arScene = document.querySelector("a-scene");

      if (arScene) {
        arScene.style.display = "none";
        arScene.style.visibility = "hidden";
        arScene.style.opacity = "0";
      }

      app.style.display = "block";

      cargarEscena(escenaDetectada);

    });

    target.addEventListener("targetLost", () => {

      if (document.body.classList.contains("escena-activa")) return;

      setTexto(
        "Página no visible",
        "Vuelve a enfocar la página",
        "Timo espera a que la imagen vuelva a aparecer."
      );

    });

  });

});

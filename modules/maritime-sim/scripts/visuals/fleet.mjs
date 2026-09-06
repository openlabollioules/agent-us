import { TAU, tube, path, ring, prism, chamfer, lathe, interpolate, surfaceHull, rails, ladder, helipad, fin } from "./geometry.mjs";

// These coordinates are an original visual reconstruction, NOT shipyard drawings.
// Fine details unobservable in the photographs are deliberately generic.
function bollards(m,x,y,z,scale=1) {
  chamfer(m,x,y,z,1.2*scale,.55*scale,.08*scale,"metal",.08);
  for(const dx of [-.35,.35]) {
    tube(m,[x+dx*scale,y,z],[x+dx*scale,y,z+.55*scale],.13*scale);
    tube(m,[x+dx*scale,y,z+.55*scale],[x+dx*scale,y,z+.6*scale],.18*scale);
  }
}
function windows(m,x,y,z,length,count,side=1) {
  // Individual glass panes and mullions, not a single dark stripe.
  for(let i=0;i<count;i++)m.box(x-length/2+(i+.5)*length/count,y,z,length/count-.12,.035,1.05,"glass");
  path(m,[[x-length/2,y+side*.025,z-.05],[x+length/2,y+side*.025,z-.05]],.04,"paint");
}
function grille(m,x,y,z,l,h) {
  m.box(x,y,z,l,.06,h,"dark");
  for(let dz=.08;dz<h;dz+=.15)m.box(x,y*1.0001,z+dz,l,.09,.028,"panel");
}
function door(m,x,y,z) {
  chamfer(m,x,y,z,.055,.85,1.9,"panel",.02);
  m.box(x+.035,y,z+.07,.045,.72,1.76,"paint");
  tube(m,[x+.07,y+.2,z+.9],[x+.07,y+.2,z+1.15],.025);
}

function fdi(m) {
  surfaceHull(m,122,17.7,5.8,4.6,true);
  // Long continuous inclined topsides, fore bridge and aft hangar.
  chamfer(m,-6,0,5.72,69,15.2,6.1,"hull",1.8,.84);
  chamfer(m,15,0,11.82,14,13.25,2,"paint",1.6,.95);
  chamfer(m,15,0,13.82,14.9,14,.23,"paint",1.6);
  for(const side of [-1,1])windows(m,15,side*6.35,12.25,10.5,8,side);
  // Forward glazing follows the bevelled bridge, panes tilted outward.
  for(let j=0;j<9;j++) {
    const y=-5.5+j*1.37;
    m.add([[22.01,y,12.35],[22.01,y+1.18,12.35],[22.22,y+1.18,13.45],[22.22,y,13.45]],[[0,1,2,3]],"glass");
  }
  for(const side of [-1,1]) {
    tube(m,[21.8,side*6.4,14.06],[21.8,side*6.4,18.5],.036,"metal",8,.015);
    m.box(21,side*6.92,13.6,.24,.18,.15,side===1?"green":"red");
  }
  // Distinct four-faced integrated mast, with chamfered panel frames.
  chamfer(m,7,0,11.8,12.4,9.2,7,"paint",1.45,.71);
  chamfer(m,6,0,18.8,8.4,6.65,7.1,"paint",.75,.59);
  for(const side of [-1,1]) {
    m.box(6,side*3.4,19.4,3.5,.13,3.6,"panel");
    m.box(6,side*3.48,19.72,2.95,.04,2.96,"paint");
    m.box(6,side*2.52,24.2,2.1,.12,1.15,"panel");
    m.box(6,side*2.6,24.36,1.78,.04,.83,"white");
  }
  chamfer(m,10.43,0,19.5,.18,3.6,3.6,"panel",.07);
  chamfer(m,10.55,0,19.8,.06,3,3,"paint",.02);
  chamfer(m,5.5,0,25.9,5.6,4,4.6,"paint",.4,.15);
  tube(m,[5.5,0,30.5],[5.5,0,40.5],.16,"paint",16,.055);
  for(let z=28;z<40;z+=1.7) {
    tube(m,[5.5,-1.25,z],[5.5,1.25,z],.035,"metal",8);
    for(const side of [-1,1])tube(m,[5.5,side*1.25,z-.12],[5.5,side*1.25,z+.42],.023,"metal",6);
  }
  m.ellipsoid(17,0,15.3,2.6,2.6,2.8,"paint");
  chamfer(m,-15,0,11.82,10.8,7.1,4.9,"paint",.7,.72);
  chamfer(m,-15,0,16.72,8.4,5.2,.25,"dark",.6);
  for(const side of [-1,1])grille(m,-14.5,side*3.18,13.8,5.7,1.9);
  // Boat recesses and inflatable boats visible below the midships side openings.
  for(const side of [-1,1]) {
    m.box(-6,side*7.04,7.1,8.8,.06,3.4,"dark");
    m.ellipsoid(-6,side*7.15,7.75,7,1.3,1,"rubber");
    chamfer(m,-6,side*7.1,7.9,5.5,.9,.25,"paint",.1);
    for(const x of [-8.3,-3.7])tube(m,[x,side*7.4,8],[x,side*7.4,10.7],.065);
    for(const x of [-32,-27]) {
      tube(m,[x-.55,side*6.15,12.25],[x+.55,side*6.15,12.25],.4,"white",20);
      for(const dx of [-.33,.33])ring(m,[x+dx,side*6.15,12.25],.405,.035,"metal",32,"yz");
    }
    grille(m,-26,side*6.6,9.1,4.3,1.7);
    rails(m,[[-59,side*5.5,5.85],[-54,side*6.6,5.85],[-41,side*7.4,5.85]]);
    rails(m,[[29,side*7.1,6.27],[38,side*6,6.38],[47,side*4.2,6.5],[56,side*1.4,6.59]],.85);
    for(const x of [-55,-44,35,47])bollards(m,x,side*(x>0?3.5:5.4),x>0?6.5:5.87,.7);
  }
  // Ribbed hangar doors and access ladders at the flight deck.
  m.box(-40.55,0,6,.08,8.2,5.25,"panel");
  for(let z=6.2;z<11.3;z+=.26)m.box(-40.61,0,z,.03,8.1,.045,"metal");
  door(m,-40.65,5.05,5.87); ladder(m,-40.68,-5.4,5.85,5.6);
  helipad(m,-50,0,5.89,5.5);
  m.box(-44.9,0,5.9,9,.13,.012,"white");
  // Small deck furnishings provide scale without introducing weapon systems.
  for(const x of [28,34])chamfer(m,x,0,6.4,3,2,.12,"panel",.25);
  for(const side of [-1,1])path(m,[[47,side*.65,6.6],[52,side*.6,6.64]],.07,"metal");
}

function suffren(m) {
  // Public overall envelope: 99.5 m long, 8.8 m diameter (Naval Group).
  lathe(m,interpolate([[-49.75,.06,.06,0],[-47,1.3,1.3,0],[-40,2.4,2.4,0],[-30,3.65,3.65,0],[-19,4.4,4.4,0],[24,4.4,4.4,0],[35,4.05,4.05,0],[42,3.35,3.35,0],[47,2.15,2.15,0],[49.75,.06,.06,0]],10),"rubber",112);
  // Flat dorsal casing blending into the cylindrical body.
  chamfer(m,3,0,3.83,67,4.05,.6,"rubber",1.4,.92);
  // Rounded sail sections, widening into a faired root at the front.
  const vertices=[],faces=[],sides=64;
  for(const [z,cx,l,w] of [[3.9,13,15.7,3.9],[4.7,12.9,14.1,3.45],[6,12.4,12.2,2.95],[8,11.9,10.4,2.75],[12,11.8,10.2,2.6],[13,11.8,9.6,2.4],[13.45,11.8,8.5,1.75]]) {
    for(let j=0;j<sides;j++) {const t=j*TAU/sides;vertices.push([cx+Math.cos(t)*l/2,Math.sin(t)*w/2,z]);}
  }
  for(let k=0;k<6;k++)for(let j=0;j<sides;j++)faces.push([k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j]);
  m.add(vertices,faces,"rubber",true);
  m.add(vertices.slice(-sides),[Array.from({length:sides},(_,j)=>j)],"rubber");
  for(const [x,y,h,r] of [[14,.25,1.2,.11],[10,-.3,.65,.13],[9.1,.2,.25,.2]])tube(m,[x,y,13.2],[x,y,13.2+h],r,"panel",16);
  for(const x of [28,-11,-26]) {
    ring(m,[x,0,4.445],.56,.035,"panel",48);
    m.box(x,0,4.45,.55,.05,.015,"metal");
  }
  // Visible X tail. Hydrodynamic sections/internal propulsor deliberately absent.
  for(let i=0;i<4;i++)fin(m,-37,2.8,3.8,6.2,Math.PI/4+i*Math.PI/2);
  for(const side of [-1,1])fin(m,31,3.8,2.3,3.4,side===1?0:Math.PI);
  // Exterior shroud, hollow ring; no invented internal blades.
  const sections=[[-49.5,1.7],[-48.8,1.9],[-45.9,1.95],[-45.4,1.78],[-45.4,1.53],[-49.5,1.48],[-49.5,1.7]];
  latheShell(m,sections,"rubber");
}

function latheShell(m,sections,material) {
  const sides=64,vertices=[],faces=[];
  for(const [x,r] of sections)for(let j=0;j<sides;j++)vertices.push([x,r*Math.cos(j*TAU/sides),r*Math.sin(j*TAU/sides)]);
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<sides;j++)faces.push([i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j]);
  m.add(vertices,faces,material,true);
}

function seagent(m,model) {
  const [l,w]=model.sizeM, xl=model.id==="seagent-xl", r=w/2;
  lathe(m,interpolate([[-l*.5,.02,.02,0],[-l*.44,r*.43,r*.4,0],[-l*.29,r*.85,r*.8,0],[-l*.19,r,r*.87,0],[l*.29,r,r*.87,0],[l*.43,r*.73,r*.67,0],[l*.5,.02,.02,0]],8),"rubber",80);
  for(let i=0;i<4;i++)fin(m,-l*.37,r*.55,r*.8,l*.12,(xl?Math.PI/4:0)+i*Math.PI/2);
  if(xl) {
    latheShell(m,[[-l*.5,r*.45],[-l*.46,r*.48],[-l*.45,r*.43],[-l*.5,r*.4],[-l*.5,r*.45]],"panel");
    chamfer(m,l*.03,0,r*.865,l*.3,w*.13,.035,"panel",.04);
  } else tube(m,[l*.29,0,r*.84],[l*.29,0,r*1.45],r*.085,"panel",16);
  for(const x of [-l*.18,l*.27])ring(m,[x,0,0],r*1.002,.012,"panel",80,"yz");
}

function seaquest(m,model) {
  const [l,w]=model.sizeM, small=model.id==="seaquest-s", d=small?.85:2.2;
  surfaceHull(m,l,w,d,small?.65:2.2,false);
  if(small) {
    // Seaquest 12 photograph: open aft working deck, low covered bow.
    chamfer(m,l*.27,0,d,l*.29,w*.72,.66,"paint",.45,.65);
    chamfer(m,-l*.02,0,d,l*.27,w*.52,.13,"deck",.1);
    for(const side of [-1,1]) {
      path(m,[[-l*.46,side*w*.46,d],[-l*.1,side*w*.47,d],[l*.27,side*w*.27,d+.1]],.055,"rubber",12);
      bollards(m,-l*.39,side*w*.28,d,.32);
    }
    chamfer(m,-l*.23,0,d,.65,.7,.62,"paint",.06);
    tube(m,[-l*.16,0,d+.2],[-l*.16,0,d+1.6],.045,"paint",12);
    tube(m,[-l*.16,-.35,d+1.5],[-l*.16,.35,d+1.5],.055,"paint",12);
    for(const x of [-l*.3,0])chamfer(m,x,0,d+.14,l*.16,w*.44,.07,"panel",.12);
  } else {
    // M and L drawings show open working aft decks and a compact forward tower.
    const k=l/28;
    chamfer(m,l*.17,0,d,l*.22,w*.66,2.1*k,"paint",.5*k,.72);
    chamfer(m,l*.19,0,d+2.1*k,l*.1,w*.33,2.2*k,"paint",.2*k,.63);
    chamfer(m,l*.19,0,d+4.3*k,l*.12,w*.36,.15*k,"panel",.1*k);
    tube(m,[l*.19,0,d+4.45*k],[l*.19,0,d+5.3*k],.085*k,"paint",16);
    m.box(l*.19,0,d+5.3*k,.2*k,2.3*k,.17*k,"paint");
    for(const x of [-l*.28,-l*.03])chamfer(m,x,0,d+.05,l*.17,w*.64,.25*k,"deck",.3*k);
    // Empty modular deck bays: no payload capability is modelled.
    for(const side of [-1,1]) {
      chamfer(m,-l*.34,side*w*.36,d,l*.15,w*.2,1.7*k,"paint",.2*k);
      rails(m,[[-l*.47,side*w*.3,d],[-l*.39,side*w*.43,d],[-l*.04,side*w*.46,d]],.8*k);
      for(const x of [-l*.4,l*.36])bollards(m,x,side*w*.26,d+.1,.5*k);
    }
    tube(m,[-l*.41,0,d],[-l*.41,0,d+2*k],.11*k,"paint",12);
  }
}

function carrier(m) {
  // Public PA-NG concept proportions, not a representation of an as-built ship.
  surfaceHull(m,310,40,16,10.5,false);
  const deck=[[-155,-24],[-85,-36],[10,-40],[55,-39],[72,-21],[143,-15],[155,-11],[155,13],[105,21],[65,27],[-35,35],[-112,34],[-155,24]];
  // The concave outline is triangulated explicitly by prism().
  prism(m,deck,16,2.1,"hull");
  prism(m,deck.map(([x,y])=>[x*.998,y*.995]),18.1,.07,"deck");
  // Island is to starboard (+Y), aft of midships.
  chamfer(m,-61,23,18.18,42,12,12,"paint",2.8,.8);
  chamfer(m,-61,23,30.18,43,12.4,2.1,"paint",2.1,.96);
  for(const side of [-1,1])windows(m,-61,23+side*6.08,30.62,35,22,side);
  chamfer(m,-61,23,32.28,44,13,.3,"paint",2.1);
  chamfer(m,-54,23,32.58,16,8,9,"paint",1.1,.62);
  for(const side of [-1,1])m.box(-54,23+side*3.1,36,4.1,.06,3.4,"panel");
  tube(m,[-53,23,41.58],[-53,23,53],.18,"paint",16,.055);
  for(let z=43;z<53;z+=2)tube(m,[-53,21.4,z],[-53,24.6,z],.04,"metal",8);
  for(const x of [-75,-68]){tube(m,[x,23,32.58],[x,23,34.3],.45,"paint");m.ellipsoid(x,23,35,2.7,2.7,2.9,"white");}
  // Angled landing strip, paint only; no aviation/weapons mechanics.
  const start=[-146,5,18.19],end=[68,-26,18.19];
  for(const offset of [-8,8])path(m,[[start[0],start[1]+offset,18.19],[end[0],end[1]+offset,18.19]],.14,"white",6);
  for(let t=0;t<.97;t+=.045){const p=start.map((v,k)=>v+(end[k]-v)*t);const q=p.map((v,k)=>v+(end[k]-start[k])*.018);path(m,[p,q],.15,"white",6);}
  for(const y of [-6,7]) {
    path(m,[[35,y,18.2],[146,y,18.2]],.09,"yellow",6);
    path(m,[[35,y+.55,18.2],[146,y+.55,18.2]],.05,"metal",6);
  }
  for(const x of [-17,42]) {
    chamfer(m,x,24,18.18,19,12,.035,"panel",1.2);
    for(const y of [18,30])path(m,[[x-8,y,18.23],[x+8,y,18.23]],.13,"yellow",6);
  }
  for(const side of [-1,1]) {
    for(let x=-130;x<30;x+=14) {
      chamfer(m,x,side*21,11,9,5,3.4,"hull",.6,.8);
      m.box(x,side*23.4,11.8,5,.12,1.6,"dark");
    }
  }
  for(let x=-135;x<110;x+=7)for(let y=-14;y<16;y+=5)ring(m,[x,y,18.2],.08,.02,"metal",12);
  for(let i=0;i<deck.length;i++) {
    const a=deck[i],b=deck[(i+1)%deck.length];
    rails(m,[[a[0],a[1],17.2],[b[0],b[1],17.2]],.75);
  }
}

function vsr700(m) {
  // Uncrewed fuselage: painted nose, three-blade rotor, shrouded tail rotor.
  lathe(m,interpolate([[-1.45,.08,.08,1.05],[-.95,.38,.52,1.08],[-.3,.63,.69,1.04],[.7,.66,.63,1.0],[1.45,.43,.43,.92],[1.9,.035,.05,.87]],6),"paint",64);
  tube(m,[-1.12,0,1.22],[-4.2,0,1.38],.19,"paint",24,.085);
  // Vertical tail and exterior duct oriented across Y.
  prism(m,[[-4.3,-.065],[-3.6,-.065],[-3.6,.065],[-4.3,.065]],1.13,.92,"paint",.7);
  ring(m,[-3.92,-.075,1.7],.43,.09,"paint",64,"xz");
  ring(m,[-3.92,.075,1.7],.43,.09,"paint",64,"xz");
  for(let i=0;i<7;i++) {const a=i*TAU/7;tube(m,[-3.92,-.08,1.7],[-3.92+.35*Math.cos(a),-.08,1.7+.35*Math.sin(a)],.024,"panel",6);}
  m.box(-3.05,0,1.35,.45,1.24,.055,"paint",.7);
  tube(m,[-.08,0,1.62],[-.08,0,2.25],.064,"metal",20);
  m.ellipsoid(-.08,0,2.22,.34,.34,.15,"panel");
  for(let i=0;i<3;i++) {
    const a=i*TAU/3,rot=([x,y,z])=>[-.08+x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z];
    m.add([[.16,-.07,2.245],[3.6,-.12,2.22],[3.6,.03,2.225],[.16,.08,2.26]].map(rot),[[0,1,2,3],[3,2,1,0]],"dark");
  }
  for(const side of [-1,1]) {
    path(m,[[-1.3,side*.73,.075],[1.18,side*.73,.075],[1.48,side*.73,.21]],.035,"metal",12);
    for(const x of [-.7,.8])path(m,[[x,side*.38,.67],[x,side*.69,.2],[x,side*.73,.075]],.033,"metal",10);
    grille(m,-.58,side*.54,1.15,.48,.27);
  }
  m.ellipsoid(.72,0,.3,.38,.38,.38,"panel");
  m.ellipsoid(.87,0,.3,.08,.17,.17,"glass");
}

export function detailedModel(m,model) {
  const builder={fdi,suffren,"france-libre":carrier,vsr700}[model.id];
  if(builder){builder(m);return true;}
  if(model.id.startsWith("seaquest-")){seaquest(m,model);return true;}
  if(model.id.startsWith("seagent-")){seagent(m,model);return true;}
  return false;
}

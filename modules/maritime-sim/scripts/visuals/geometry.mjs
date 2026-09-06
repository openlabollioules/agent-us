// Modelling primitives in metres. Separate additions keep hard edges separate.
export const TAU = Math.PI*2;
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};

export function tube(m,a,b,r,material="metal",sides=12,r2=r) {
  const axis=unit(sub(b,a)), u=unit(cross(axis,Math.abs(axis[2])<.9?[0,0,1]:[0,1,0])), v=cross(axis,u);
  const vertices=[];
  for(const [p,radius] of [[a,r],[b,r2]]) for(let j=0;j<sides;j++)
    vertices.push(p.map((n,k)=>n+radius*(u[k]*Math.cos(j*TAU/sides)+v[k]*Math.sin(j*TAU/sides))));
  const faces=Array.from({length:sides},(_,j)=>[j,(j+1)%sides,(j+1)%sides+sides,j+sides]);
  // This basis has u x v = axis; ring tangent x axis points outwards.
  m.add(vertices,faces,material,true);
  for(const [offset,reverse] of [[0,true],[sides,false]]) {
    const ring=vertices.slice(offset,offset+sides);
    m.add(ring,[Array.from({length:sides},(_,j)=>reverse?sides-1-j:j)],material);
  }
}

export function path(m,points,r,material="metal",sides=8) {
  for(let i=1;i<points.length;i++) tube(m,points[i-1],points[i],r,material,sides);
}

export function ring(m,center,radius,width,material="white",segments=96,plane="xy") {
  const axes=plane==="yz"?[1,2]:plane==="xz"?[0,2]:[0,1], vertices=[],faces=[];
  for(let j=0;j<segments;j++) for(const r of [radius-width/2,radius+width/2]) {
    const p=[...center]; p[axes[0]]+=Math.cos(j*TAU/segments)*r; p[axes[1]]+=Math.sin(j*TAU/segments)*r; vertices.push(p);
  }
  for(let j=0;j<segments;j++) faces.push([j*2,j*2+1,((j+1)%segments)*2+1,((j+1)%segments)*2]);
  m.add(vertices,faces,material);
}

// Ear clipping handles the concave PA-NG deck without overlapping triangles.
export function triangulate(outline) {
  const area=outline.reduce((sum,a,i)=>{const b=outline[(i+1)%outline.length];return sum+a[0]*b[1]-a[1]*b[0];},0);
  const ids=outline.map((_,i)=>i); if(area<0)ids.reverse();
  const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const faces=[];
  while(ids.length>3) {
    let found=false;
    for(let j=0;j<ids.length;j++) {
      const a=ids[(j+ids.length-1)%ids.length],b=ids[j],c=ids[(j+1)%ids.length];
      if(turn(outline[a],outline[b],outline[c])<=1e-10)continue;
      const contains=ids.some(i=>i!==a&&i!==b&&i!==c&&turn(outline[a],outline[b],outline[i])>=0&&turn(outline[b],outline[c],outline[i])>=0&&turn(outline[c],outline[a],outline[i])>=0);
      if(contains)continue;
      faces.push([a,b,c]);ids.splice(j,1);found=true;break;
    }
    if(!found)throw new Error("Invalid or self-intersecting deck outline");
  }
  faces.push(ids);return faces;
}

// Deck outline, CCW as seen from above.
export function prism(m,outline,z,height,material="paint",taper=1,shift=[0,0]) {
  const n=outline.length, center=outline.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]);
  const vertices=outline.map(p=>[...p,z]).concat(outline.map(p=>[
    center[0]+(p[0]-center[0])*taper+shift[0],center[1]+(p[1]-center[1])*taper+shift[1],z+height]));
  const faces=[];
  for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);
  for(const face of triangulate(outline))faces.push([...face].reverse(),face.map(j=>j+n));
  m.add(vertices,faces,material);
}

export function chamfer(m,x,y,z,l,w,h,mat="paint",bevel=.25,taper=1) {
  const a=l/2,b=w/2,c=Math.min(bevel,a*.8,b*.8);
  prism(m,[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]].map(p=>[p[0]+x,p[1]+y]),z,h,mat,taper);
}

// Elliptic rings with arbitrary longitudinal profile: [x, half-width, half-height, z-center].
export function lathe(m,stations,mat="rubber",sides=96) {
  const vertices=[], faces=[];
  for(const [x,w,h,z=0] of stations)for(let j=0;j<sides;j++)vertices.push([x,w*Math.cos(j*TAU/sides),z+h*Math.sin(j*TAU/sides)]);
  for(let i=0;i<stations.length-1;i++)for(let j=0;j<sides;j++)faces.push([i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j]);
  m.add(vertices,faces,mat,true);
  m.add(vertices.slice(0,sides),[Array.from({length:sides},(_,j)=>sides-1-j)],mat);
  m.add(vertices.slice(-sides),[Array.from({length:sides},(_,j)=>j)],mat);
}

export function interpolate(stations,steps=6) {
  const out=[];
  for(let i=0;i<stations.length-1;i++)for(let j=0;j<steps;j++) {
    const t=j/steps, s=t*t*(3-2*t);
    out.push(stations[i].map((v,k)=>v+(stations[i+1][k]-v)*(k===0?t:s)));
  }
  return [...out,stations.at(-1)];
}

export function surfaceHull(m,l,w,deck,draft,inverted=false) {
  const stations=[[-.5,.7],[-.47,.88],[-.38,.98],[-.2,1],[0,1],[.18,.96],[.32,.78],[.42,.48],[.475,.17],[.5,.008]];
  const section=[[-.86,1],[-1,.7],[-1,0],[-.9,-.35],[-.6,-.83],[0,-1],[.6,-.83],[.9,-.35],[1,0],[1,.7],[.86,1]];
  const verts=[];
  for(const [x,b] of interpolate(stations,5))for(const [y,z] of section) {
    // Waterline is z=0; aft flight deck is lower than the forecastle.
    const sheer=Math.max(0,x)*1.5;
    const top=deck+sheer;
    verts.push([x*l-(inverted?Math.max(0,(x-.32)/.18)*Math.max(0,z)*3.3:0),y*b*w/2,z>=0?z*top:z*draft]);
  }
  const count=verts.length/section.length;
  for(let j=0;j<section.length;j++) {
    const faces=[];
    for(let i=0;i<count-1;i++)faces.push([i*11+j,i*11+(j+1)%11,(i+1)*11+(j+1)%11,(i+1)*11+j]);
    // Smooth the plating longitudinally, retain the hard chines and waterline.
    const used=[...new Set(faces.flat())], map=new Map(used.map((v,i)=>[v,i]));
    m.add(used.map(v=>verts[v]),faces.map(f=>f.map(v=>map.get(v))),j===10?"deck":j>=2&&j<=7?"antifouling":"hull",true);
  }
  m.add(verts.slice(0,11),[[10,9,8,7,6,5,4,3,2,1,0]],"hull");
  m.add(verts.slice(-11),[[0,1,2,3,4,5,6,7,8,9,10]],"hull");
}

export function rails(m,points,height=1.05) {
  for(const z of [.48,height])path(m,points.map(p=>[p[0],p[1],p[2]+z]),.018,"metal",6);
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i], n=Math.ceil(Math.hypot(...sub(b,a))/2);
    for(let j=0;j<n;j++){const p=a.map((v,k)=>v+(b[k]-v)*j/n);tube(m,p,[p[0],p[1],p[2]+height],.026,"paint",8);}
  }
}

export function ladder(m,x,y,z,height) {
  for(const side of [-1,1])tube(m,[x,y+side*.32,z],[x,y+side*.32,z+height],.025);
  for(let dz=.15;dz<height;dz+=.3)tube(m,[x,y-.32,z+dz],[x,y+.32,z+dz],.02);
}

export function helipad(m,x,y,z,r) {
  ring(m,[x,y,z],r,.18,"yellow");
  for(const side of [-1,1])m.box(x,y+side*r*.25,z,r*.72,.18,.008,"white");
  m.box(x,y,z,.18,r*.5,.008,"white");
  for(let dx=-r*.7;dx<r*.75;dx+=r*.18)for(const side of [-1,1])ring(m,[x+dx,y+side*r*.72,z],.09,.025,"metal",12);
}

// Closed visual fairing, no articulated/functional simulation.
export function fin(m,x,root,span,chord,angle,mat="rubber") {
  const shape=[[x-chord*.5,root],[x+chord*.5,root],[x+chord*.1,root+span],[x-chord*.5,root+span]];
  const vertices=[];
  for(const t of [-.08,.08])for(const [px,r] of shape)vertices.push([px,r*Math.cos(angle)-t*Math.sin(angle),r*Math.sin(angle)+t*Math.cos(angle)]);
  m.add(vertices,[[3,2,1,0],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]],mat);
}

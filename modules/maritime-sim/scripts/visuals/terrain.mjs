// Fictional bathymetry; preserves the three shoreline sectors of the tactical map.
const polygons=[
  [[3000,-2000],[3000,300],[1000,300],[940,285],[880,220],[900,165],[915,120],[860,70],[760,62],[700,57],[652,0],[652,-2000]],
  [[-2000,3000],[-2000,715],[0,715],[95,710],[152,758],[172,832],[188,892],[128,952],[0,1000],[0,3000]],
  [[3000,3000],[3000,818],[1000,818],[928,840],[898,902],[920,958],[970,996],[1000,1000]],
].map(poly=>poly.map(([x,y])=>[(x-500)*10,(y-500)*10]));
const noise=(x,y)=>{
  const hash=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return (s-Math.floor(s))*2-1;};
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;
};
function distance(x,y,poly) {
  let inside=false,nearest=Infinity;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[j],b=poly[i];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
    nearest=Math.min(nearest,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
  }
  return inside?nearest:-nearest;
}
export function elevation(x,y) {
  const outline=Math.max(...polygons.map(p=>distance(x,y,p)));
  // Irregular inlets remain close to the fictional outline; the land continues
  // beyond map borders instead of turning their rectangular crop into islands.
  const d=outline+noise(x*.005,y*.005)*24*Math.exp(-Math.abs(outline)/450);
  const hills=65*noise(x*.0014,y*.0014)+24*noise(x*.004,y*.004)+8*noise(x*.011,y*.011);
  return d>0?210*(1-Math.exp(-d/650))+hills*Math.min(1,d/180):Math.max(-290,d*.25)+hills*.08*Math.min(1,-d/100);
}
export function terrain(Mesh) {
  const coast=new Mesh(),surf=new Mesh(),vertices=[],faces=[],cells=512,size=14000;
  for(let y=0;y<=cells;y++)for(let x=0;x<=cells;x++) {
    const px=(x/cells-.5)*size,py=(y/cells-.5)*size;
    vertices.push([px,py,elevation(px,py)]);
  }
  for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){const a=y*(cells+1)+x;faces.push([a,a+1,a+cells+2,a+cells+1]);}
  // One material blends sand/rock/vegetation by height, slope and world position.
  coast.add(vertices,faces,"land",true);
  // Fine nearshore boulders, deterministic and entirely fictional.
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
  for(let y=-4900;y<5000;y+=75)for(let x=-4900;x<5000;x+=75) {
    const px=x+hash(x,y)*60,py=y+hash(y,x)*60,z=elevation(px,py);
    if(z < -3 || z > 26 || hash(x+4,y)<.35)continue;
    const radius=2+hash(x+8,y)*9,rv=[],rf=[],sides=12,rings=8;
    for(let j=0;j<=rings;j++)for(let i=0;i<sides;i++) {
      const t=-Math.PI/2+(j+.02)/(rings+.04)*Math.PI,a=i*Math.PI*2/sides;
      const r=radius*(.86+.22*hash(i+x,j+y));
      rv.push([px+Math.cos(t)*Math.cos(a)*r,py+Math.cos(t)*Math.sin(a)*r*.8,z-1+Math.sin(t)*r*.75]);
    }
    for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;rf.push([a,b,b+sides,a+sides]);}
    coast.add(rv,rf,'rock',true);
  }
  // Shore foam follows the exact zero-height contour of the rendered triangles.
  for(const face of faces) for(const triangle of [[face[0],face[1],face[2]],[face[0],face[2],face[3]]]) {
    const cuts=[];
    for(let i=0;i<3;i++) {
      const a=vertices[triangle[i]],b=vertices[triangle[(i+1)%3]];
      if((a[2]>0)===(b[2]>0))continue;
      const t=-a[2]/(b[2]-a[2]);cuts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.12]);
    }
    if(cuts.length!==2)continue;
    const [a,b]=cuts,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<.01)continue;
    const normal=[-dy/len*7,dx/len*7,0];
    const p=[a.map((n,i)=>n+normal[i]),a.map((n,i)=>n-normal[i]),b.map((n,i)=>n-normal[i]),b.map((n,i)=>n+normal[i])];
    surf.add(p,[[0,1,2,3]],'surf');
  }
  const seabed=new Mesh();seabed.add([[-15000,-15000,-300],[15000,-15000,-300],[15000,15000,-300],[-15000,15000,-300]],[[0,1,2,3]],"sand");
  // Opaque coast can use Nanite; translucent foam must remain a separate mesh.
  return [["coast",coast],["seabed",seabed],["surf",surf]];
}

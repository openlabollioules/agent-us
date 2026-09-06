// Fictional bathymetry; preserves the three shoreline sectors of the tactical map.
const polygons=[
  [[1000,0],[1000,300],[940,285],[880,220],[900,165],[915,120],[860,70],[760,62],[700,57],[652,0]],
  [[0,1000],[0,715],[95,710],[152,758],[172,832],[188,892],[128,952]],
  [[1000,1000],[1000,818],[928,840],[898,902],[920,958],[970,996]],
].map(poly=>poly.map(([x,y])=>[(x-500)*10,(y-500)*10]));
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
  const d=Math.max(...polygons.map(p=>distance(x,y,p)));
  const hills=22*Math.sin(x*.004)*Math.cos(y*.005)+9*Math.sin(x*.011+y*.008);
  return d>0?Math.min(210,d*.3)+hills*Math.min(1,d/150):Math.max(-290,d*.25)+hills*.12*Math.min(1,-d/100);
}
export function terrain(Mesh) {
  const coast=new Mesh(),vertices=[],faces=[],cells=256,size=14000;
  for(let y=0;y<=cells;y++)for(let x=0;x<=cells;x++) {
    const px=(x/cells-.5)*size,py=(y/cells-.5)*size;
    vertices.push([px,py,elevation(px,py)]);
  }
  for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){const a=y*(cells+1)+x;faces.push([a,a+1,a+cells+2,a+cells+1]);}
  // One material blends sand/rock/vegetation by height, slope and world position.
  coast.add(vertices,faces,"land",true);
  const seabed=new Mesh();seabed.add([[-15000,-15000,-300],[15000,-15000,-300],[15000,15000,-300],[-15000,15000,-300]],[[0,1,2,3]],"sand");
  return [["coast",coast],["seabed",seabed]];
}

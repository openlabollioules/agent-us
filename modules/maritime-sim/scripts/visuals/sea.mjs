import { readFile, writeFile } from 'node:fs/promises';
export const spectrum=JSON.parse(await readFile(new URL('../../catalog/sea-spectrum.json',import.meta.url),'utf8')).waves;
export function seaHeight(x,y,time,height=1,depth=0) {
  return spectrum.reduce((sum,w)=>{const k=Math.PI*2/w.wavelengthM;return sum+Math.sin((x*Math.cos(w.angleRad)+y*Math.sin(w.angleRad))*k-time*Math.sqrt(9.81*k)+w.phase)*w.amplitude*height*Math.exp(k*Math.min(0,depth));},0);
}
export async function writeSeaHeader() {
  const waves=spectrum.map(w=>`    { ${[Math.PI*2/w.wavelengthM,Math.cos(w.angleRad),Math.sin(w.angleRad),w.amplitude,w.phase,Math.sqrt(9.81*Math.PI*2/w.wavelengthM)].map(v=>v.toFixed(12)).join(', ')} }`).join(',\n');
  const destination=new URL('../../unreal/Source/MaritimeSim/MaritimeSea.h',import.meta.url);
  const source=`// Generated from catalog/sea-spectrum.json by generate-models.mjs. Visual animation only.
#pragma once
#include "CoreMinimal.h"
namespace MaritimeSea {
struct FWave { double K, DX, DY, Amplitude, Phase, Omega; };
inline constexpr FWave Waves[] = {
${waves}
};
inline double Height(double X, double Y, double T, double H, double Depth = 0.) {
    double Z=0;
    for (const auto& W : Waves) {
        const double Attenuation = Depth < 0 ? FMath::Exp(W.K * Depth) : 1.;
        Z += FMath::Sin((X*W.DX+Y*W.DY)*W.K-T*W.Omega+W.Phase)*W.Amplitude*H*Attenuation;
    }
    return Z;
}
}
`;
  // Preserve the timestamp when the spectrum is unchanged: material iterations
  // should not recompile the editor and game C++ translation units.
  let previous;
  try { previous=await readFile(destination,'utf8'); }
  catch(error) { if(error.code!=='ENOENT')throw error; }
  if(previous!==source)await writeFile(destination,source);
}
export function oceanMesh(Mesh) {
  const m=new Mesh(),v=[],f=[],n=256,half=400;
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)v.push([(x/n*2-1)*half,(y/n*2-1)*half,0]);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x;f.push([a,a+1,a+n+2,a+n+1]);}
  let edge=[];
  for(let i=0;i<n;i++)edge.push(i);
  for(let i=0;i<n;i++)edge.push(i*(n+1)+n);
  for(let i=n;i>0;i--)edge.push(n*(n+1)+i);
  for(let i=n;i>0;i--)edge.push(i*(n+1));
  // Matching perimeter topology keeps every ring watertight, without T-junctions.
  for(let radius=500;radius<=140000;radius*=1.25) {
    const next=edge.map(index=>{const p=v[index],s=radius/Math.max(Math.abs(p[0]),Math.abs(p[1]));v.push([p[0]*s,p[1]*s,0]);return v.length-1;});
    for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;f.push([edge[i],next[i],next[j],edge[j]]);}
    edge=next;
  }
  // Optical curvature only, outside the detailed local surface. The distant sea
  // meets Sky Atmosphere instead of ending in a straight 14 km blue strip.
  for(const p of v) { const r=Math.hypot(p[0],p[1]); p[2]=-(Math.max(0,r-2000)**2)/(2*6371000); }
  m.add(v,f,'water',true);return m;
}

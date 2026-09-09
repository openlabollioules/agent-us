// Original narrow stencil lettering, projected onto the exterior (metres).
// The identifiers are public; type subtitles are educational presentation paint.
// No texture atlas, font binary, depth bias, or billboard is required.
const glyphs = {
  A: [[[0,0],[0, .78],[.12,1],[.48,1],[.6,.78],[.6,0]],[[0,.45],[.6,.45]]],
  B: [[[0,0],[0,1],[.43,1],[.6,.85],[.6,.65],[.43,.5],[0,.5]],[[.43,.5],[.6,.35],[.6,.15],[.43,0],[0,0]]],
  C: [[[.6,.85],[.45,1],[.15,1],[0,.85],[0,.15],[.15,0],[.45,0],[.6,.15]]],
  D: [[[0,0],[0,1],[.4,1],[.6,.8],[.6,.2],[.4,0],[0,0]]],
  E: [[[.6,1],[0,1],[0,0],[.6,0]],[[0,.5],[.48,.5]]],
  F: [[[0,0],[0,1],[.6,1]],[[0,.5],[.48,.5]]],
  G: [[[.6,.82],[.42,1],[.15,1],[0,.83],[0,.17],[.15,0],[.6,0],[.6,.48],[.33,.48]]],
  H: [[[0,0],[0,1]],[[.6,0],[.6,1]],[[0,.5],[.6,.5]]],
  I: [[[.3,0],[.3,1]]], J: [[[.6,1],[.6,.16],[.44,0],[.14,0],[0,.16]]],
  L: [[[0,1],[0,0],[.6,0]]], M: [[[0,0],[0,1],[.3,.6],[.6,1],[.6,0]]],
  N: [[[0,0],[0,1],[.6,0],[.6,1]]],
  O: [[[.15,0],[0,.15],[0,.85],[.15,1],[.45,1],[.6,.85],[.6,.15],[.45,0],[.15,0]]],
  P: [[[0,0],[0,1],[.43,1],[.6,.85],[.6,.65],[.43,.5],[0,.5]]],
  Q: [[[.15,0],[0,.15],[0,.85],[.15,1],[.45,1],[.6,.85],[.6,.15],[.45,0],[.15,0]],[[.35,.25],[.65,-.05]]],
  R: [[[0,0],[0,1],[.43,1],[.6,.85],[.6,.65],[.43,.5],[0,.5]],[[.28,.5],[.6,0]]],
  S: [[[.6,.85],[.45,1],[.15,1],[0,.85],[0,.65],[.15,.5],[.45,.5],[.6,.35],[.6,.15],[.45,0],[.15,0],[0,.15]]],
  T: [[[0,1],[.6,1]],[[.3,1],[.3,0]]], U: [[[0,1],[0,.15],[.15,0],[.45,0],[.6,.15],[.6,1]]],
  V: [[[0,1],[.3,0],[.6,1]]], X: [[[0,1],[.6,0]],[[0,0],[.6,1]]],
  '0': [[[.15,0],[0,.15],[0,.85],[.15,1],[.45,1],[.6,.85],[.6,.15],[.45,0],[.15,0]]],
  '1': [[[.1,.8],[.3,1],[.3,0]],[[.08,0],[.55,0]]],
  '2': [[[0,.85],[.15,1],[.45,1],[.6,.85],[.6,.7],[0,0],[.6,0]]],
  '3': [[[0,1],[.45,1],[.6,.85],[.6,.65],[.45,.5],[.2,.5]],[[.45,.5],[.6,.35],[.6,.15],[.45,0],[0,0]]],
  '4': [[[.45,0],[.45,1],[0,.3],[.6,.3]]],
  '5': [[[.6,1],[0,1],[0,.52],[.44,.52],[.6,.36],[.6,.16],[.44,0],[0,0]]],
  '6': [[[.6,1],[.15,1],[0,.82],[0,.16],[.15,0],[.45,0],[.6,.16],[.6,.36],[.45,.52],[0,.52]]],
  '7': [[[0,1],[.6,1],[.15,0]]],
  '-': [[[.08,.5],[.52,.5]]], ' ': [],
};

export function lettering(mesh, text, { x, z, height, side, yAt, material = 'marking' }) {
  const width = (text.length * .82 - .22) * height;
  for (const [index, char] of [...text].entries()) {
    if (!glyphs[char]) throw new Error(`Unsupported hull character: ${char}`);
    for (const stroke of glyphs[char]) for (let i=1;i<stroke.length;i++) {
      const a=stroke[i-1],b=stroke[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const dx=-(b[1]-a[1])/len*.046,dy=(b[0]-a[0])/len*.046;
      // Subdivide long strokes so their chords cannot sink through a curved sail.
      const segments=Math.max(1,Math.ceil(len*height/.18));
      for(let j=0;j<segments;j++) {
        const p=a.map((v,k)=>v+(b[k]-v)*j/segments),q=a.map((v,k)=>v+(b[k]-v)*(j+1)/segments);
        const points=[[p[0]+dx,p[1]+dy],[p[0]-dx,p[1]-dy],[q[0]-dx,q[1]-dy],[q[0]+dx,q[1]+dy]].map(([u,v])=>{
          const px=x-side*((index*.82+u)*height-width/2),pz=z+v*height;
          return [px,side*(yAt(px,pz)+.015),pz];
        });
        mesh.add(points,[[0,1,2,3]],material);
      }
    }
  }
}

export const identities = {
  fdi: { name: "Amiral Ronarc'h", type: 'FDI', pennant: 'D660', source: 'https://www.defense.gouv.fr/sites/default/files/marine/Liste%20navires%20MN.pdf' },
  suffren: { name: 'Suffren', type: 'SNA SUFFREN', pennant: 'S635', source: 'https://www.defense.gouv.fr/marine/marins/marins-nucleaires-dattaque-sna-type-suffren' },
};

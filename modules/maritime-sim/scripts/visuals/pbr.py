"""Import the explicit CC0 surface maps downloaded by fetch-pbr-textures.mjs."""
from pathlib import Path
import json
import hashlib
import unreal as ue

ROOT = Path(__file__).resolve().parents[2] / 'generated' / 'textures'

def import_textures():
    manifest = ROOT / 'manifest.json'
    if not manifest.is_file():
        ue.log_warning('CC0 terrain textures absent: run node --use-system-ca scripts/fetch-pbr-textures.mjs, then update-visuals.')
        return {}
    result = {}
    for entry in json.loads(manifest.read_text(encoding='utf-8')):
        path = ROOT / entry['name']
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise RuntimeError('Texture integrity mismatch: ' + str(path))
        name = 'T_' + entry['id'] + '_' + entry['map']
        dest = '/Game/Maritime/Textures/' + name
        texture = ue.load_asset(dest) if ue.EditorAssetLibrary.does_asset_exist(dest) else None
        if not texture:
            task = ue.AssetImportTask()
            task.filename = str(path)
            task.destination_path = '/Game/Maritime/Textures'
            task.destination_name = name
            task.automated = True
            task.save = True
            ue.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
            texture = ue.load_asset(dest)
        if not texture:
            raise RuntimeError('Texture import failed: ' + name)
        normal = entry['map'] == 'normal'
        texture.set_editor_property('srgb', entry['map'] == 'albedo')
        texture.set_editor_property('compression_settings', ue.TextureCompressionSettings.TC_NORMALMAP if normal else ue.TextureCompressionSettings.TC_DEFAULT)
        texture.set_editor_property('flip_green_channel', normal)  # Poly Haven OpenGL -> UE DirectX
        ue.EditorAssetLibrary.set_metadata_tag(texture, 'Source', entry['source'])
        ue.EditorAssetLibrary.set_metadata_tag(texture, 'License', entry['license'])
        ue.EditorAssetLibrary.save_loaded_asset(texture)
        result[(entry['id'], entry['map'])] = texture
    return result

def terrain_material(mat, name, textures, node, custom, scalar, output):
    if not textures:
        return False
    mat.set_editor_property('tangent_space_normal', False)
    pos = node(mat, ue.MaterialExpressionWorldPosition)
    normal = node(mat, ue.MaterialExpressionVertexNormalWS)
    # Use centimetres, triplanar projection, correct metre scale, plus macro maps.
    blend = '''
        float3 w=pow(abs(N),4); w/=max(dot(w,1),.0001);
        float3 p=P/Scale;
        // Smooth, non-periodic warping breaks visible rows of repeated scans.
        float3 cell=floor(P/2700.);float3 f=frac(P/2700.);f=f*f*(3-2*f);
        float a0=frac(sin(dot(cell.xy,float2(127.1,311.7)))*43758.5453);
        float a1=frac(sin(dot(cell.xy+float2(1,0),float2(127.1,311.7)))*43758.5453);
        float a2=frac(sin(dot(cell.xy+float2(0,1),float2(127.1,311.7)))*43758.5453);
        float a3=frac(sin(dot(cell.xy+1,float2(127.1,311.7)))*43758.5453);
        float warp=lerp(lerp(a0,a1,f.x),lerp(a2,a3,f.x),f.y);
        p+=float3(warp,warp*.73,warp*.41)*1.3;
        // Two incommensurate scales and a varying blend suppress scan tiling.
        float3 a=lerp(Texture2DSample(Tex,TexSampler,p.yz).rgb,Texture2DSample(Tex,TexSampler,p.yz*.731+float2(.37,.61)).rgb,.25+.5*warp);
        float3 b=lerp(Texture2DSample(Tex,TexSampler,p.xz).rgb,Texture2DSample(Tex,TexSampler,p.xz*.731+float2(.37,.61)).rgb,.25+.5*warp);
        float3 c=lerp(Texture2DSample(Tex,TexSampler,p.xy).rgb,Texture2DSample(Tex,TexSampler,p.xy*.731+float2(.37,.61)).rgb,.25+.5*warp);
        return a*w.x+b*w.y+c*w.z;
    '''
    samples={}
    for key, asset, scale in [('Sand','coast_sand_rocks_02',400.),('Rock','rock_boulder_dry',180.),('Grass','aerial_grass_rock',600.)]:
        for kind in ('albedo','roughness','normal'):
            tex=node(mat,ue.MaterialExpressionTextureObject,texture=textures[(asset,kind)])
            # Normal maps are decoded in their three projection frames.
            code=blend if kind!='normal' else '''
                float3 w=pow(abs(N),4);w/=max(dot(w,1),.0001);float3 p=P/Scale;
        // Smooth, non-periodic warping breaks visible rows of repeated scans.
        float3 cell=floor(P/2700.);float3 f=frac(P/2700.);f=f*f*(3-2*f);
        float a0=frac(sin(dot(cell.xy,float2(127.1,311.7)))*43758.5453);
        float a1=frac(sin(dot(cell.xy+float2(1,0),float2(127.1,311.7)))*43758.5453);
        float a2=frac(sin(dot(cell.xy+float2(0,1),float2(127.1,311.7)))*43758.5453);
        float a3=frac(sin(dot(cell.xy+1,float2(127.1,311.7)))*43758.5453);
        float warp=lerp(lerp(a0,a1,f.x),lerp(a2,a3,f.x),f.y);
        p+=float3(warp,warp*.73,warp*.41)*1.3;
                float2 ax=lerp(Texture2DSample(Tex,TexSampler,p.yz).rg,Texture2DSample(Tex,TexSampler,p.yz*.731+float2(.37,.61)).rg,.25+.5*warp)*2-1;
                float2 ay=lerp(Texture2DSample(Tex,TexSampler,p.xz).rg,Texture2DSample(Tex,TexSampler,p.xz*.731+float2(.37,.61)).rg,.25+.5*warp)*2-1;
                float2 az=lerp(Texture2DSample(Tex,TexSampler,p.xy).rg,Texture2DSample(Tex,TexSampler,p.xy*.731+float2(.37,.61)).rg,.25+.5*warp)*2-1;
                float3 nx=float3(sqrt(saturate(1-dot(ax,ax)))*sign(N.x),ax.x,ax.y);
                float3 ny=float3(ay.x,sqrt(saturate(1-dot(ay,ay)))*sign(N.y),ay.y);
                float3 nz=float3(az.x,az.y,sqrt(saturate(1-dot(az,az)))*sign(N.z));
                return normalize(nx*w.x+ny*w.y+nz*w.z);
            '''
            samples[key+kind]=custom(mat,code,{'P':pos,'N':normal,'Tex':tex,'Scale':scalar(mat,scale)})
    for kind,prop in [('albedo',ue.MaterialProperty.MP_BASE_COLOR),('roughness',ue.MaterialProperty.MP_ROUGHNESS),('normal',ue.MaterialProperty.MP_NORMAL)]:
        code='''
            float shore=1-smoothstep(170.,1150.,P.z);
            float cliff=smoothstep(.18,.48,1-N.z);
            float3 value=lerp(lerp(G,R,cliff),S,shore);
        ''' if name=='land' else 'float3 value='+('S;' if name=='sand' else 'R;')
        if kind=='albedo':
            code+='float macro=.80+.20*sin(P.x*.00017+sin(P.y*.00023)); return value*macro*lerp(.62,1.,smoothstep(-30.,180.,P.z));'
        elif kind=='roughness':
            code+='return lerp(.24,clamp(value.r,.45,.99),smoothstep(-40.,170.,P.z));'
        else:
            code+='return normalize(value);'
        output(custom(mat,code,{'P':pos,'N':normal,'S':samples['Sand'+kind],'R':samples['Rock'+kind],'G':samples['Grass'+kind]},1 if kind=='roughness' else 3),prop)
    return True


def vessel_material(mat, name, textures, uv, wet, values, node, custom, scalar, vector, output):
    if name not in ('hull','paint','steel','panel','rubber','dark','deck','metal'):
        return
    asset = 'rubber_tiles' if name in ('rubber','dark','deck') else 'metal_plate_02'
    if (asset,'albedo') not in textures:
        return
    samples={}
    # Both CC0 scans cover 2 m. Use only restrained microstructure for paint;
    # rusty source colours must never turn a modern ship into bare rusty steel.
    for kind in ('albedo','roughness','normal'):
        tex=node(mat,ue.MaterialExpressionTextureObject,texture=textures[(asset,kind)])
        samples[kind]=custom(mat,'return Texture2DSample(Tex,TexSampler,UV*5.).rgb;',{'Tex':tex,'UV':uv})
    color,roughness,metallic,variation=values
    output(custom(mat,'''float luminance=dot(Scan,float3(.2126,.7152,.0722));
        float patina=1.+(luminance-.3)*.12;
        return Base*patina*lerp(1.,.7,W);''',{'Scan':samples['albedo'],'Base':vector(mat,color),'W':wet}),ue.MaterialProperty.MP_BASE_COLOR)
    output(custom(mat,'''float r=clamp(R+(Scan.r-.5)*.14,.12,.95);
        return lerp(r,max(.13,r*.55),W);''',{'Scan':samples['roughness'],'R':scalar(mat,roughness),'W':wet},1),ue.MaterialProperty.MP_ROUGHNESS)
    output(custom(mat,'return normalize(float3((Scan.rg*2-1)*Strength,1));',
        {'Scan':samples['normal'],'Strength':scalar(mat,.22 if asset=='rubber_tiles' else .10)}),ue.MaterialProperty.MP_NORMAL)

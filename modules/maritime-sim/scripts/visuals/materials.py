"""Reproducible UE materials: analytic ship surfaces and CC0 photographic terrain.

Uses engine material expressions and portable HLSL (DX12 / Vulkan SM6).
Public photos are reference only. Coefficients are artistic settings.
"""
import unreal as ue
import json
import hashlib
import math
from pathlib import Path
from pbr import import_textures, terrain_material, vessel_material

ASSET_ROOT = "/Game/Maritime"
VERSION = "exterior-v4"
SOURCE_HASH = hashlib.sha256(b''.join(p.read_bytes() for p in (
    Path(__file__), Path(__file__).with_name('pbr.py'),
    Path(__file__).resolve().parents[2]/'catalog'/'sea-spectrum.json'))).hexdigest()
TEXTURE_MANIFEST = Path(__file__).resolve().parents[2]/'generated'/'textures'/'manifest.json'
SOURCE_HASH = hashlib.sha256((SOURCE_HASH + (TEXTURE_MANIFEST.read_text(encoding='utf-8') if TEXTURE_MANIFEST.is_file() else 'no-pbr-cache')).encode()).hexdigest()
TEXTURES = {}
# Smooth value noise, shared by whitecaps, wake and shoreline foam. Unlike a
# product of sines, hashed cells do not stamp identical diamonds across the sea.
FOAM_NOISE = '''
struct FoamNoise {
    float hash(float2 p) {
        float3 q=frac(float3(p.xyx)*.1031);
        q+=dot(q,q.yzx+33.33);
        return frac((q.x+q.y)*q.z);
    }
    float noise(float2 p) {
        float2 i=floor(p),f=frac(p);f=f*f*(3.-2.*f);
        return lerp(lerp(hash(i),hash(i+float2(1,0)),f.x),
                    lerp(hash(i+float2(0,1)),hash(i+1),f.x),f.y);
    }
    float field(float2 p) {
        return .55*noise(p)+.28*noise(p*3.17+19.3)+.17*noise(p*9.43-7.6);
    }
};
FoamNoise foamNoise;
'''
edit = ue.MaterialEditingLibrary
tools = ue.AssetToolsHelpers.get_asset_tools()


def node(mat, kind, **props):
    result = edit.create_material_expression(mat, kind)
    for key, value in props.items():
        result.set_editor_property(key, value)
    return result


def scalar(mat, value):
    return node(mat, ue.MaterialExpressionConstant, r=value)


def vector(mat, values):
    return node(mat, ue.MaterialExpressionConstant3Vector, constant=ue.LinearColor(*values, 1))


def wire(a, b, pin):
    if not edit.connect_material_expressions(a, "", b, pin):
        raise RuntimeError("Material connection failed: " + pin)


def output(expr, prop):
    if not edit.connect_material_property(expr, "", prop):
        raise RuntimeError("Material output connection failed: " + str(prop))


def custom(mat, code, inputs, size=3):
    expr = node(mat, ue.MaterialExpressionCustom, code=code, description="Maritime exterior v2",
                output_type=getattr(ue.CustomMaterialOutputType, "CMOT_FLOAT" + str(size)))
    pins = []
    for name in inputs:
        pin = ue.CustomInput()
        pin.set_editor_property("input_name", name)
        pins.append(pin)
    expr.set_editor_property("inputs", pins)
    for name, value in inputs.items():
        wire(value, expr, name)
    return expr


def backup(path):
    dest = path.replace(ASSET_ROOT + "/", ASSET_ROOT + "/BackupBeforeExteriorV4/")
    if ue.EditorAssetLibrary.does_asset_exist(path) and not ue.EditorAssetLibrary.does_asset_exist(dest):
        if not ue.EditorAssetLibrary.duplicate_asset(path, dest):
            raise RuntimeError("Cannot back up " + path)


def begin(name, replace):
    path = ASSET_ROOT + "/Materials/" + name
    if ue.EditorAssetLibrary.does_asset_exist(path):
        mat = ue.load_asset(path)
        if not replace and ue.EditorAssetLibrary.get_metadata_tag(mat, 'MaritimeSourceHash') == SOURCE_HASH:
            return mat, False
        backup(path)
        edit.delete_all_material_expressions(mat)
    else:
        mat = tools.create_asset(name, ASSET_ROOT + "/Materials", ue.Material, ue.MaterialFactoryNew())
    mat.set_editor_property("two_sided", False)
    return mat, True


# Base colors are linear RGB. Painted metal is a dielectric, not bare steel.
SURFACES = {
    "hull": ((.20, .235, .26), .38, 0., .08),
    "paint": ((.25, .29, .32), .34, 0., .06),
    "steel": ((.40, .44, .46), .43, 0., .05),
    "rubber": ((.006, .008, .010), .46, 0., .14),
    "dark": ((.025, .033, .037), .43, 0., .04),
    "panel": ((.22, .25, .265), .50, 0., .06),
    "deck": ((.09, .105, .11), .83, 0., .15),
    "metal": ((.46, .49, .52), .30, .82, .03),
    "glass": ((.013, .032, .04), .075, .10, .006),
    "antifouling": ((.115, .029, .02), .67, 0., .09),
    "white": ((.74, .75, .70), .52, 0., .04),
    "yellow": ((.74, .48, .045), .55, 0., .05),
    "red": ((.60, .015, .01), .22, 0., .01),
    "green": ((.012, .4, .08), .22, 0., .01),
    "container": ((.33, .10, .06), .64, 0., .08),
    "sand": ((.22, .18, .12), .91, 0., .15),
    "rock": ((.25, .23, .20), .88, 0., .16),
    "land": ((.13, .18, .11), .91, 0., .15),
    "signal": ((.015, .55, .82), .50, 0., .0),
    "marking": ((.075, .085, .09), .48, 0., .06),
    "sub_marking": ((.49, .50, .48), .5, 0., .07),
    "rotor": ((.02, .025, .03), .4, 0., .035),
}


def surface(name, values, replace):
    mat, fresh = begin("M_" + name, replace)
    if not fresh:
        return mat
    color, roughness, metallic, variation = values
    uv = node(mat, ue.MaterialExpressionTextureCoordinate)
    pos = node(mat, ue.MaterialExpressionWorldPosition)
    wetness = node(mat, ue.MaterialExpressionScalarParameter, parameter_name="Wetness", default_value=.12)
    wet = custom(mat,"return max(W,1-smoothstep(-20.,110.,P.z));",{'W':wetness,'P':pos},1)
    # UV coordinates represent 10 m; frequencies below range from mm to metres.
    color_expr = custom(mat, """
        float broad=sin(UV.x*19.7+sin(UV.y*8.1))*sin(UV.y*27.3);
        float streak=pow(.5+.5*sin(UV.x*490.0+sin(UV.x*93.0)),12.0);
        float grain=sin(UV.x*13217.0)*sin(UV.y*17231.0);
        float2 panel=abs(frac(UV*float2(16,22))-.5);
        float seam=smoothstep(.490,.499,max(panel.x,panel.y));
        return Base*(1.0+Amount*(broad*.45-streak*.65+grain*.1-seam*.16))*lerp(1.,.63,W);
    """, {"UV": uv, "Base": vector(mat, color), "Amount": scalar(mat, variation), "W": wet})
    if name == "land":
        pos = node(mat, ue.MaterialExpressionWorldPosition)
        normal = node(mat, ue.MaterialExpressionVertexNormalWS)
        color_expr = custom(mat, """
            float n=.5+.5*sin(P.x*.0007+sin(P.y*.00041))*sin(P.y*.0006);
            float3 sand=float3(.26,.22,.15)*(0.86+.25*n);
            float3 green=lerp(float3(.075,.105,.048),float3(.19,.20,.11),n);
            float3 rock=float3(.26,.245,.21)*(0.85+.25*n);
            float3 land=lerp(green,rock,saturate((.88-N.z)*4.0));
            return lerp(sand,land,smoothstep(450.0,2400.0,P.z));
        """, {"P": pos, "N": normal})
    output(color_expr, ue.MaterialProperty.MP_BASE_COLOR)
    output(custom(mat, "return clamp(lerp(R,.14,W*.85) + A*.3*sin(UV.x*573.0)*sin(UV.y*347.0),.06,.98);",
                  {"UV": uv, "R": scalar(mat, roughness), "A": scalar(mat, variation), "W":wet}, 1), ue.MaterialProperty.MP_ROUGHNESS)
    output(scalar(mat, metallic), ue.MaterialProperty.MP_METALLIC)
    output(scalar(mat, .5), ue.MaterialProperty.MP_SPECULAR)
    output(custom(mat, """
        float fade=1.0-saturate(max(length(ddx(UV)),length(ddy(UV)))*12000.0);
        return normalize(float3(A*fade*sin(UV.x*13217.0),A*fade*cos(UV.y*17231.0),1));
    """, {"UV": uv, "A": scalar(mat, variation*.65)}), ue.MaterialProperty.MP_NORMAL)
    if name in ("red", "green", "signal"):
        output(vector(mat, tuple(v*.5 for v in color)), ue.MaterialProperty.MP_EMISSIVE_COLOR)
    if name in ('land','sand','rock'):
        terrain_material(mat,name,TEXTURES,node,custom,scalar,output)
    else:
        vessel_material(mat,name,TEXTURES,uv,wet,values,node,custom,scalar,vector,output)
    if name == 'rotor':
        mat.set_editor_property('two_sided',True)
        local = node(mat,ue.MaterialExpressionPreSkinnedPosition)
        time = node(mat,ue.MaterialExpressionTime)
        rpm = node(mat,ue.MaterialExpressionScalarParameter,parameter_name='RotorHz',default_value=0.)
        offset = custom(mat,'''float a=T*Hz*6.283185;float2 p=P.xy-float2(-8,0);
            float2 q=float2(p.x*cos(a)-p.y*sin(a),p.x*sin(a)+p.y*cos(a));
            return float3(q-p,0);''',{'P':local,'T':time,'Hz':rpm})
        transform=node(mat,ue.MaterialExpressionTransform,transform_source_type=ue.MaterialVectorCoordTransformSource.TRANSFORMSOURCE_LOCAL,
            transform_type=ue.MaterialVectorCoordTransform.TRANSFORM_WORLD)
        wire(offset,transform,'')
        output(transform,ue.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    finish(mat)
    return mat


def finish(mat):
    if mat.get_editor_property('blend_mode') in (ue.BlendMode.BLEND_OPAQUE, ue.BlendMode.BLEND_MASKED) and mat.get_name() not in ('M_Ocean','M_rotor','M_signal'):
        # Explicitly cook Nanite permutations; editor auto-fixes are not persisted.
        edit.set_base_material_usage(mat, ue.MaterialUsage.MATUSAGE_NANITE)
    ue.EditorAssetLibrary.set_metadata_tag(mat, "MaritimeVisualVersion", VERSION)
    ue.EditorAssetLibrary.set_metadata_tag(mat, 'MaritimeSourceHash', SOURCE_HASH)
    edit.layout_material_expressions(mat)
    edit.recompile_material(mat)
    if not ue.EditorAssetLibrary.save_loaded_asset(mat):
        raise RuntimeError("Cannot save " + mat.get_path_name())


def sea_offset(mat,pos,clock,wave):
    spectrum=json.loads((Path(__file__).resolve().parents[2]/'catalog'/'sea-spectrum.json').read_text())['waves']
    camera=node(mat,ue.MaterialExpressionCameraPositionWS)
    code='float2 p=P.xy*.01;float distanceM=length(P.xy-C.xy)*.01;float z=0;\n'
    for w in spectrum:
        code+=f'''{{float k=6.283185/{w['wavelengthM']};float2 d=float2(cos({w['angleRad']}),sin({w['angleRad']}));
            float fade=1-smoothstep({w['wavelengthM']*20}.,{w['wavelengthM']*40}.,distanceM);
            z+=sin(dot(p,d)*k-T*sqrt(9.81*k)+{w['phase']})*{w['amplitude']}*fade;}}\n'''
    return custom(mat,code+'return float3(0,0,z*H);',{'P':pos,'T':clock,'H':wave,'C':camera})


def sea_surface(mat, pos, clock, wave):
    """The pixel slope and whitecaps follow the actual displaced wave spectrum."""
    spectrum = json.loads((Path(__file__).resolve().parents[2]/'catalog'/'sea-spectrum.json').read_text())['waves']
    code = 'float2 p=P.xy*.01;float distanceM=length(P.xy-C.xy)*.01;float2 slope=0;float crest=0;\n'
    for w in spectrum:
        k = 2*math.pi/w['wavelengthM']
        code += f'''{{float2 d=float2({math.cos(w['angleRad']):.9f},{math.sin(w['angleRad']):.9f});
            float phase=dot(p,d)*{k:.9f}-T*{math.sqrt(9.81*k):.9f}+{w['phase']};
            float fade=1-smoothstep({w['wavelengthM']*20}.,{w['wavelengthM']*40}.,distanceM);
            slope+=d*cos(phase)*{w['amplitude']*k*.01:.9f}*H*fade;
            crest+=sin(phase)*{w['amplitude']};}}\n'''
    crest_code = code
    code += '''float pixel=max(length(ddx(p)),length(ddy(p)));
        // Filter wavelengths smaller than a pixel to avoid glitter at the horizon.
        float ripples=clamp(H/160.,.12,1.);
    '''
    for i in range(14):
        k = .6 * 1.42**i * (1+.10*math.sin(i*3.1))
        angle = .32 + math.sin(i*2.39996)*1.25
        code += f'''{{float2 d=float2({math.cos(angle):.9f},{math.sin(angle):.9f});
            float atten=1-smoothstep(.4,2.,{k:.9f}*pixel);
            float phaseWarp=.42*sin(dot(p,float2(.11,.17))+T*.11+{i:.1f});
            slope+=d*cos(dot(p,d)*{k:.9f}-T*{math.sqrt(9.81*k):.9f}+{i*1.73:.5f}+phaseWarp)*{.037*(1-math.exp(-k*.75))/(1+i*.07):.9f}*atten*ripples;}}\n'''
    params = {'P':pos,'T':clock,'H':wave,'C':node(mat,ue.MaterialExpressionCameraPositionWS)}
    normal = custom(mat, code+'return normalize(float3(-slope,1));',params)
    # Crest threshold follows the same four waves, not an unrelated foam sine.
    foam = custom(mat,FOAM_NOISE+crest_code+'''
        float2 drift=p-float2(.38,.12)*T;
        float breakup=foamNoise.field(drift*.23);
        float bubbles=lerp(.72,foamNoise.noise(drift*3.4),
            1-smoothstep(.15,.8,max(length(ddx(p)),length(ddy(p)))));
        return smoothstep(.20,.36,crest)*smoothstep(.43,.66,breakup)
            *(.5+.5*bubbles)*saturate((H-90.)/240.);''',params,1)
    return normal, foam


def ocean(replace):
    mat, fresh = begin("M_Ocean", replace)
    if not fresh:
        return mat
    mat.set_editor_property("shading_model", ue.MaterialShadingModel.MSM_SINGLE_LAYER_WATER)
    mat.set_editor_property("two_sided", True)
    mat.set_editor_property("tangent_space_normal", False)
    pos = node(mat, ue.MaterialExpressionWorldPosition)
    time = node(mat, ue.MaterialExpressionTime)
    scene = node(mat, ue.MaterialExpressionScalarParameter, parameter_name="SceneTime", default_value=0.)
    clock = custom(mat, "return T+Scene;", {"T": time, "Scene": scene}, 1)
    wave = node(mat, ue.MaterialExpressionScalarParameter, parameter_name="WaveHeight", default_value=60.)
    output(sea_offset(mat,pos,clock,wave),ue.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    normal,foam = sea_surface(mat,pos,clock,wave)
    output(normal, ue.MaterialProperty.MP_NORMAL)
    output(custom(mat,'return lerp(float3(.012,.038,.045),float3(.65,.70,.68),F);',{'F':foam}),ue.MaterialProperty.MP_BASE_COLOR)
    output(custom(mat,'return lerp(.12,.68,F);',{'F':foam},1),ue.MaterialProperty.MP_ROUGHNESS)
    output(scalar(mat, .255), ue.MaterialProperty.MP_SPECULAR)  # water F0 ~= .0204
    output(scalar(mat, 0.), ue.MaterialProperty.MP_METALLIC)
    output(custom(mat,'return lerp(.08,.94,F);',{'F':foam},1),ue.MaterialProperty.MP_OPACITY)
    # UE 5.8 may insert this output when switching the shading model.
    water_nodes = [e for e in edit.get_material_expressions(mat)
                   if isinstance(e, ue.MaterialExpressionSingleLayerWaterMaterialOutput)]
    water = water_nodes[0] if water_nodes else node(mat, ue.MaterialExpressionSingleLayerWaterMaterialOutput)
    for duplicate in water_nodes[1:]:
        edit.delete_material_expression(mat, duplicate)
    wire(vector(mat, (.000055, .00011, .00013)), water, "ScatteringCoefficients")
    wire(vector(mat, (.0012, .00024, .00012)), water, "AbsorptionCoefficients")
    wire(scalar(mat, .45), water, "PhaseG")
    wire(vector(mat, (1., 1., 1.)), water, "ColorScaleBehindWater")
    finish(mat)
    return mat


def build(replace=False):
    global TEXTURES
    TEXTURES=import_textures()
    result = {name: surface(name, values, replace) for name, values in SURFACES.items()}
    result["water"] = ocean(replace)
    result['surf'] = surf(replace)
    result['wake']=wake(replace)
    return result


def wake(replace):
    mat,fresh=begin('M_Wake',replace)
    if not fresh:return mat
    mat.set_editor_property('blend_mode',ue.BlendMode.BLEND_TRANSLUCENT)
    mat.set_editor_property('two_sided',True)
    uv=node(mat,ue.MaterialExpressionTextureCoordinate)
    time=node(mat,ue.MaterialExpressionTime)
    strength=node(mat,ue.MaterialExpressionScalarParameter,parameter_name='Strength',default_value=0.)
    foam=custom(mat,FOAM_NOISE+'''float x=UV.x+.5,y=abs(UV.y)*2;
        float width=.14+(1-x)*.72;
        float edge=exp(-pow((y-width)*18,2));
        float core=exp(-y*y/(.008+(1-x)*.1))*.5;
        float noise=foamNoise.field(float2(x*37-T*.6,UV.y*21));
        return saturate((edge+core)*smoothstep(0.,.18,x)*(1-smoothstep(.88,1.,x))*(.22+.78*noise)*S);''',{'UV':uv,'T':time,'S':strength},1)
    output(vector(mat,(.56,.65,.66)),ue.MaterialProperty.MP_BASE_COLOR)
    output(scalar(mat,.65),ue.MaterialProperty.MP_ROUGHNESS)
    output(foam,ue.MaterialProperty.MP_OPACITY)
    pos=node(mat,ue.MaterialExpressionWorldPosition)
    scene=node(mat,ue.MaterialExpressionScalarParameter,parameter_name='SceneTime',default_value=0.)
    clock=custom(mat,'return T+S;',{'T':time,'S':scene},1)
    wave=node(mat,ue.MaterialExpressionScalarParameter,parameter_name='WaveHeight',default_value=60.)
    output(sea_offset(mat,pos,clock,wave),ue.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    finish(mat)
    return mat


def surf(replace):
    mat,fresh=begin('M_Surf',replace)
    if not fresh:return mat
    mat.set_editor_property('blend_mode',ue.BlendMode.BLEND_TRANSLUCENT)
    mat.set_editor_property('two_sided',True)
    pos=node(mat,ue.MaterialExpressionWorldPosition)
    time=node(mat,ue.MaterialExpressionTime)
    foam=custom(mat,FOAM_NOISE+'''float2 p=P.xy*.01;
        float n=foamNoise.field((p-float2(.17,.08)*T)*.65);
        float swell=.5+.5*sin(p.x*.13+p.y*.21-T*.65);
        return smoothstep(.35,.7,n)*(.15+.45*swell);''',{'P':pos,'T':time},1)
    output(foam,ue.MaterialProperty.MP_OPACITY)
    output(vector(mat,(.62,.68,.67)),ue.MaterialProperty.MP_BASE_COLOR)
    output(scalar(mat,.66),ue.MaterialProperty.MP_ROUGHNESS)
    finish(mat)
    return mat


def assign(mesh, materials):
    # Use imported slot names, never rely on ordering from Interchange/FbxFactory.
    slots = mesh.get_editor_property("static_materials")
    for index, slot in enumerate(slots):
        names = [str(slot.get_editor_property("imported_material_slot_name")),
                 str(slot.get_editor_property("material_slot_name"))]
        if slot.material_interface:
            names.append(slot.material_interface.get_name())
        key = next((name for name in names if name in materials), None)
        if key is None:
            raise RuntimeError("Unknown material slot in " + mesh.get_name() + ": " + str(names))
        slot.set_editor_property("material_interface", materials[key])
        slots[index] = slot
    # A single edit avoids rebuilding distance fields once per material slot.
    mesh.set_editor_property("static_materials", slots)
    ue.EditorAssetLibrary.save_loaded_asset(mesh)

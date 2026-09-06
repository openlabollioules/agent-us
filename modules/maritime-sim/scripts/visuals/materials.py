"""Reproducible UE materials: analytic microstructure, no downloaded textures.

Uses engine material expressions and portable HLSL (DX12 / Vulkan SM6).
Public photos are reference only. Coefficients are artistic settings.
"""
import unreal as ue

ASSET_ROOT = "/Game/Maritime"
VERSION = "exterior-v2"
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
    dest = path.replace(ASSET_ROOT + "/", ASSET_ROOT + "/BackupBeforeExteriorV2/")
    if ue.EditorAssetLibrary.does_asset_exist(path) and not ue.EditorAssetLibrary.does_asset_exist(dest):
        if not ue.EditorAssetLibrary.duplicate_asset(path, dest):
            raise RuntimeError("Cannot back up " + path)


def begin(name, replace):
    path = ASSET_ROOT + "/Materials/" + name
    if ue.EditorAssetLibrary.does_asset_exist(path):
        mat = ue.load_asset(path)
        if not replace:
            return mat, False
        backup(path)
        edit.delete_all_material_expressions(mat)
    else:
        mat = tools.create_asset(name, ASSET_ROOT + "/Materials", ue.Material, ue.MaterialFactoryNew())
    mat.set_editor_property("two_sided", False)
    return mat, True


# Base colors are linear RGB. Painted metal is a dielectric, not bare steel.
SURFACES = {
    "hull": ((.38, .405, .42), .43, 0., .055),
    "paint": ((.49, .515, .52), .39, 0., .035),
    "steel": ((.40, .44, .46), .43, 0., .05),
    "rubber": ((.017, .022, .026), .40, 0., .10),
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
}


def surface(name, values, replace):
    mat, fresh = begin("M_" + name, replace)
    if not fresh:
        return mat
    color, roughness, metallic, variation = values
    uv = node(mat, ue.MaterialExpressionTextureCoordinate)
    # UV coordinates represent 10 m; frequencies below range from mm to metres.
    color_expr = custom(mat, """
        float broad=sin(UV.x*19.7+sin(UV.y*8.1))*sin(UV.y*27.3);
        float streak=pow(.5+.5*sin(UV.x*490.0+sin(UV.x*93.0)),12.0);
        float grain=sin(UV.x*13217.0)*sin(UV.y*17231.0);
        return Base*(1.0+Amount*(broad*.45-streak*.65+grain*.1));
    """, {"UV": uv, "Base": vector(mat, color), "Amount": scalar(mat, variation)})
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
    output(custom(mat, "return clamp(R + A*.3*sin(UV.x*573.0)*sin(UV.y*347.0),.04,.98);",
                  {"UV": uv, "R": scalar(mat, roughness), "A": scalar(mat, variation)}, 1), ue.MaterialProperty.MP_ROUGHNESS)
    output(scalar(mat, metallic), ue.MaterialProperty.MP_METALLIC)
    output(scalar(mat, .5), ue.MaterialProperty.MP_SPECULAR)
    output(custom(mat, """
        float fade=1.0-saturate(max(length(ddx(UV)),length(ddy(UV)))*12000.0);
        return normalize(float3(A*fade*sin(UV.x*13217.0),A*fade*cos(UV.y*17231.0),1));
    """, {"UV": uv, "A": scalar(mat, variation*.65)}), ue.MaterialProperty.MP_NORMAL)
    if name in ("red", "green", "signal"):
        output(vector(mat, tuple(v*.5 for v in color)), ue.MaterialProperty.MP_EMISSIVE_COLOR)
    finish(mat)
    return mat


def finish(mat):
    ue.EditorAssetLibrary.set_metadata_tag(mat, "MaritimeVisualVersion", VERSION)
    edit.layout_material_expressions(mat)
    edit.recompile_material(mat)
    if not ue.EditorAssetLibrary.save_loaded_asset(mat):
        raise RuntimeError("Cannot save " + mat.get_path_name())


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
    # The only displacement wavelengths exceed the mesh's Nyquist limit.
    output(custom(mat, """
        float2 p=P.xy*.01;
        float z=sin(dot(p,float2(.008,.003))-T*.22)*.27;
        z+=sin(dot(p,float2(-.004,.012))-T*.30)*.16;
        return float3(0,0,z*H);
    """, {"P": pos, "T": clock, "H": wave}), ue.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    # Analytic slope spectrum, evaluated per pixel and attenuated below pixel size.
    output(custom(mat, """
        float2 p=P.xy*.01;
        float pixel=max(length(ddx(p)),length(ddy(p)));
        float2 slope=0;
        [unroll] for(int i=0;i<18;i++) {
            float a=i*2.39996;
            float2 d=normalize(float2(cos(a)*.65+.7,sin(a)*.65+.2));
            float k=.35*pow(1.36,(float)i);
            float atten=1-smoothstep(.55,2.4,k*pixel);
            float phase=dot(p,d)*k-T*sqrt(9.81*k)+i*1.73;
            slope+=d*cos(phase)*(.08/(1+i*.15))*atten;
        }
        return normalize(float3(-slope*clamp(H/60,.12,2.2),1));
    """, {"P": pos, "T": clock, "H": wave}), ue.MaterialProperty.MP_NORMAL)
    output(vector(mat, (.008, .025, .03)), ue.MaterialProperty.MP_BASE_COLOR)
    output(scalar(mat, .10), ue.MaterialProperty.MP_ROUGHNESS)
    output(scalar(mat, .255), ue.MaterialProperty.MP_SPECULAR)  # water F0 ~= .0204
    output(scalar(mat, 0.), ue.MaterialProperty.MP_METALLIC)
    output(scalar(mat, .035), ue.MaterialProperty.MP_OPACITY)
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
    result = {name: surface(name, values, replace) for name, values in SURFACES.items()}
    result["water"] = ocean(replace)
    return result


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

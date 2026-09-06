"""Run inside UE 5.8 Editor with -ExecutePythonScript=<absolute path>.

Creates only missing generated assets. Existing artist replacements are preserved.
The files are derived study meshes, not faithful production models.
"""
from pathlib import Path
import os
import unreal as ue

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = "/Game/Maritime"
tools = ue.AssetToolsHelpers.get_asset_tools()
edit = ue.MaterialEditingLibrary


def expression(material, kind, **props):
    node = edit.create_material_expression(material, kind)
    for key, value in props.items():
        node.set_editor_property(key, value)
    return node


def constant(material, value):
    return expression(material, ue.MaterialExpressionConstant, r=value)


def connect(source, dest, pin):
    if not edit.connect_material_expressions(source, "", dest, pin):
        raise RuntimeError("Cannot connect material expression: " + pin)


def material(name, color, roughness=0.5, emissive=False):
    path = ASSET_ROOT + "/Materials/" + name
    if ue.EditorAssetLibrary.does_asset_exist(path):
        return ue.load_asset(path), False
    mat = tools.create_asset(name, ASSET_ROOT + "/Materials", ue.Material, ue.MaterialFactoryNew())
    node = expression(mat, ue.MaterialExpressionConstant3Vector, constant=ue.LinearColor(*color, 1))
    edit.connect_material_property(node, "", ue.MaterialProperty.MP_BASE_COLOR)
    edit.connect_material_property(constant(mat, roughness), "", ue.MaterialProperty.MP_ROUGHNESS)
    if emissive:
        edit.connect_material_property(node, "", ue.MaterialProperty.MP_EMISSIVE_COLOR)
    return mat, True


def build_materials():
    ocean, fresh = material("M_Ocean", (0.012, 0.09, 0.13), 0.14)
    if fresh:
        ocean.set_editor_property("two_sided", True)
        position = expression(ocean, ue.MaterialExpressionWorldPosition)
        time = expression(ocean, ue.MaterialExpressionScalarParameter,
                          parameter_name="SceneTime", default_value=0.0)
        height = expression(ocean, ue.MaterialExpressionScalarParameter,
                            parameter_name="WaveHeight", default_value=50.0)
        waves = []
        for direction, wavelength, speed, amplitude in [((1, 0.3, 0), 16000., 0.12, 0.3),
                                                       ((0.3, 1, 0), 7500., 0.18, 0.14),
                                                       ((0.8, -0.6, 0), 3500., 0.24, 0.06)]:
            vector = expression(ocean, ue.MaterialExpressionConstant3Vector,
                                constant=ue.LinearColor(*direction, 1))
            dot = expression(ocean, ue.MaterialExpressionDotProduct)
            connect(position, dot, "A"); connect(vector, dot, "B")
            scale = expression(ocean, ue.MaterialExpressionDivide)
            connect(dot, scale, "A"); connect(constant(ocean, wavelength), scale, "B")
            phase = expression(ocean, ue.MaterialExpressionMultiply)
            connect(time, phase, "A"); connect(constant(ocean, speed), phase, "B")
            total = expression(ocean, ue.MaterialExpressionAdd)
            connect(scale, total, "A"); connect(phase, total, "B")
            sine = expression(ocean, ue.MaterialExpressionSine)
            connect(total, sine, "")
            weighted = expression(ocean, ue.MaterialExpressionMultiply)
            connect(sine, weighted, "A"); connect(constant(ocean, amplitude), weighted, "B")
            waves.append(weighted)
        summed = waves[0]
        for wave in waves[1:]:
            node = expression(ocean, ue.MaterialExpressionAdd)
            connect(summed, node, "A"); connect(wave, node, "B"); summed = node
        displacement = expression(ocean, ue.MaterialExpressionMultiply)
        connect(summed, displacement, "A"); connect(height, displacement, "B")
        up = expression(ocean, ue.MaterialExpressionConstant3Vector, constant=ue.LinearColor(0, 0, 1, 1))
        offset = expression(ocean, ue.MaterialExpressionMultiply)
        connect(displacement, offset, "A"); connect(up, offset, "B")
        edit.connect_material_property(offset, "", ue.MaterialProperty.MP_WORLD_POSITION_OFFSET)
        edit.recompile_material(ocean)
        ue.EditorAssetLibrary.save_loaded_asset(ocean)
    overlay, fresh = material("M_Overlay", (0.05, 0.65, 0.9), 0.8, True)
    if fresh:
        edit.recompile_material(overlay)
        ue.EditorAssetLibrary.save_loaded_asset(overlay)


def main():
    inputs = sorted((ROOT / "generated").glob("SM_*.obj"))
    if len(inputs) < 16:
        raise RuntimeError("Run node scripts/generate-models.mjs before the editor setup")
    for folder in ["Models", "Materials", "Maps"]:
        ue.EditorAssetLibrary.make_directory(ASSET_ROOT + "/" + folder)
    for source in inputs:
        target = ASSET_ROOT + "/Models/" + source.stem
        if ue.EditorAssetLibrary.does_asset_exist(target) and os.environ.get("MARITIME_REIMPORT") != "1":
            continue
        task = ue.AssetImportTask()
        task.filename = str(source)
        task.destination_path = ASSET_ROOT + "/Models"
        task.destination_name = source.stem
        task.automated = True
        task.replace_existing = os.environ.get("MARITIME_REIMPORT") == "1"
        task.save = True
        options = ue.FbxImportUI()
        options.set_editor_property("is_obj_import", True)
        options.set_editor_property("import_mesh", True)
        options.set_editor_property("import_materials", True)
        options.set_editor_property("import_textures", False)
        options.set_editor_property("automated_import_should_detect_type", False)
        options.set_editor_property("mesh_type_to_import", ue.FBXImportType.FBXIT_STATIC_MESH)
        options.static_mesh_import_data.set_editor_property("combine_meshes", True)
        options.static_mesh_import_data.set_editor_property("convert_scene", False)
        options.static_mesh_import_data.set_editor_property("auto_generate_collision", False)
        options.static_mesh_import_data.set_editor_property("normal_import_method", ue.FBXNormalImportMethod.FBXNIM_IMPORT_NORMALS)
        task.options = options
        task.factory = ue.FbxFactory()
        tools.import_asset_tasks([task])
        if not ue.EditorAssetLibrary.does_asset_exist(target):
            raise RuntimeError("Import failed: " + target)
    build_materials()
    map_path = ASSET_ROOT + "/Maps/Ocean"
    if not ue.EditorAssetLibrary.does_asset_exist(map_path):
        subsystem = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
        if not subsystem.new_level(map_path):
            raise RuntimeError("Cannot create ocean map")
        subsystem.save_current_level()
    ue.EditorAssetLibrary.save_directory(ASSET_ROOT)
    ue.log("Maritime Sim assets created. Open Ocean and Play. Native build and visual checks required.")


main()

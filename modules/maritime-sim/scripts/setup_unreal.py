"""Run inside UE 5.8 Editor with -ExecutePythonScript=<absolute path>.

Updates generated assets when their source fingerprints change;
MARITIME_REIMPORT=1 forces rebuilding after backing up meshes/materials. Gameplay and scene protocol unchanged.
"""
from pathlib import Path
import os
import sys
import hashlib
import json
import unreal as ue

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "visuals"))
import materials as visual_materials
import environment as visual_environment
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
    overlay, fresh = material("M_Overlay", (0.05, 0.65, 0.9), 0.8, True)
    if fresh:
        edit.recompile_material(overlay)
        ue.EditorAssetLibrary.save_loaded_asset(overlay)


def main():
    inputs = sorted((ROOT / "generated").glob("SM_*.obj"))
    if len(inputs) < 18 or not (ROOT / 'generated' / 'SM_surf.obj').is_file():
        raise RuntimeError("Run node scripts/generate-models.mjs before the editor setup")
    for folder in ["Models", "Materials", "Maps"]:
        ue.EditorAssetLibrary.make_directory(ASSET_ROOT + "/" + folder)
    replace = os.environ.get("MARITIME_REIMPORT") == "1"
    surfaces = visual_materials.build(replace)
    for source in inputs:
        if os.environ.get("MARITIME_MATERIALS_ONLY") == "1":
            continue
        target = ASSET_ROOT + "/Models/" + source.stem
        digest = hashlib.sha256(source.read_bytes() + b'visual-import-v4').hexdigest()
        existing = ue.load_asset(target) if ue.EditorAssetLibrary.does_asset_exist(target) else None
        if existing and not replace and ue.EditorAssetLibrary.get_metadata_tag(existing, 'MaritimeSourceHash') == digest:
            # Also migrate import settings/obsolete slots without reimporting OBJ.
            if ue.EditorAssetLibrary.get_metadata_tag(existing, 'MaritimeImportSettings') != 'v4.2':
                configure_mesh(existing, source.stem)
                ue.EditorAssetLibrary.save_loaded_asset(existing)
            continue
        if existing:
            visual_materials.backup(target)
        task = ue.AssetImportTask()
        task.filename = str(source)
        task.destination_path = ASSET_ROOT + "/Models"
        task.destination_name = source.stem
        task.automated = True
        task.replace_existing = True
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
        mesh = ue.load_asset(target)
        visual_materials.assign(mesh, surfaces)
        configure_mesh(mesh, source.stem)
        ue.EditorAssetLibrary.set_metadata_tag(mesh, "MaritimeVisualVersion", visual_materials.VERSION)
        ue.EditorAssetLibrary.set_metadata_tag(mesh, 'MaritimeSourceHash', digest)
        ue.EditorAssetLibrary.save_loaded_asset(mesh)
    build_materials()
    map_path = ASSET_ROOT + "/Maps/Ocean"
    if not ue.EditorAssetLibrary.does_asset_exist(map_path):
        subsystem = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
        if not subsystem.new_level(map_path):
            raise RuntimeError("Cannot create ocean map")
        subsystem.save_current_level()
    if replace:
        visual_materials.backup(map_path)
    visual_environment.install(map_path)
    ue.EditorAssetLibrary.save_directory(ASSET_ROOT)
    audit_assets(inputs)
    ue.log("Maritime exterior v4 imported. Changed generated assets backed up before upgrading. Open Ocean and Play.")


def configure_mesh(mesh, name):
    subsystem = ue.get_editor_subsystem(ue.StaticMeshEditorSubsystem)
    # Reimport preserves old slots (e.g. the former coast foam), even when no
    # triangle uses them. One leftover translucent slot disables Nanite entirely.
    sections = [(lod,section,subsystem.get_lod_material_slot(mesh,lod,section))
                for lod in range(mesh.get_num_lods()) for section in range(mesh.get_num_sections(lod))]
    used = sorted({slot for _,_,slot in sections})
    slots = mesh.get_editor_property('static_materials')
    if len(used) < len(slots):
        remap = {old:new for new,old in enumerate(used)}
        for lod,section,slot in sections:
            if remap[slot] != slot: subsystem.set_lod_material_slot(mesh,remap[slot],lod,section)
        mesh.set_editor_property('static_materials',[slots[index] for index in used])
    # Interchange may ignore the FbxImportUI collision flag for OBJ. Remove the
    # resulting convex bodies from the asset, not only from runtime components.
    subsystem.remove_collisions_with_notification(mesh, False)
    settings = subsystem.get_nanite_settings(mesh)
    settings.set_editor_property('enabled', name not in ('SM_ocean','SM_seabed','SM_surf','SM_wake','SM_vsr700','SM_uncertain'))
    if name not in ('SM_coast','SM_ocean','SM_seabed','SM_surf','SM_wake'):
        # UE stores inverse powers: step = 2^(-PositionPrecision) cm.
        settings.set_editor_property('position_precision', 2)  # 0.25 cm: preserve thin painted lettering
    subsystem.set_nanite_settings(mesh, settings, False)
    build = subsystem.get_lod_build_settings(mesh, 0)
    build.set_editor_property('use_full_precision_u_vs', True)
    build.set_editor_property('generate_lightmap_u_vs', False)
    # Imported analytic normals are authoritative; only rebuild the tangent frame.
    build.set_editor_property('recompute_normals', False)
    build.set_editor_property('recompute_tangents', True)
    if name in ('SM_ocean','SM_seabed','SM_surf','SM_wake'):
        build.set_editor_property('distance_field_resolution_scale', 0.)
    if name in ('SM_ocean','SM_wake'):
        # A flat plane has zero Z extent: multiplying its bounds cannot include WPO.
        for side in ('positive_bounds_extension','negative_bounds_extension'):
            mesh.set_editor_property(side, ue.Vector(0,0,1000))
    if name == 'SM_vsr700':
        for side in ('positive_bounds_extension','negative_bounds_extension'):
            mesh.set_editor_property(side, ue.Vector(0,400,0))
    subsystem.set_lod_build_settings(mesh, 0, build)
    ue.EditorAssetLibrary.set_metadata_tag(mesh,'MaritimeImportSettings','v4.2')


def audit_assets(inputs):
    subsystem = ue.get_editor_subsystem(ue.StaticMeshEditorSubsystem)
    report = {}
    for source in inputs:
        mesh = ue.load_asset(ASSET_ROOT + '/Models/' + source.stem)
        settings = subsystem.get_nanite_settings(mesh)
        nanite = settings.get_editor_property('enabled')
        collisions = subsystem.get_simple_collision_count(mesh)
        if collisions != 0: raise RuntimeError('Unexpected visual collision: '+source.stem)
        if source.stem == 'SM_coast' and not nanite: raise RuntimeError('Coast is not Nanite')
        for slot in mesh.get_editor_property('static_materials'):
            if nanite and not edit.has_material_usage(slot.material_interface, ue.MaterialUsage.MATUSAGE_NANITE):
                raise RuntimeError('Missing Nanite material permutation: '+slot.material_interface.get_name())
        precision = settings.get_editor_property('position_precision')
        if source.stem not in ('SM_coast','SM_ocean','SM_seabed','SM_surf','SM_wake') and precision != 2:
            raise RuntimeError('Insufficient hull marking precision: '+source.stem)
        report[source.stem] = {'nanite':bool(nanite),'simpleCollisions':collisions,'positionPrecision':precision,'verticesLod0':subsystem.get_number_verts(mesh,0)}
    (ROOT/'generated'/'asset-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')


main()

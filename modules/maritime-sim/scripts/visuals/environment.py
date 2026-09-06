"""Art direction of the Unreal level only; no tactical or weather simulation."""
import unreal as ue


def clouds():
    actors = ue.get_editor_subsystem(ue.EditorActorSubsystem)
    existing = next((a for a in actors.get_all_level_actors() if a.get_actor_label() == "Maritime_Clouds"), None)
    if existing:
        return existing
    cloud = actors.spawn_actor_from_class(ue.VolumetricCloud, ue.Vector(0, 0, 0))
    cloud.set_actor_label("Maritime_Clouds")
    comp = cloud.get_component_by_class(ue.VolumetricCloudComponent)
    comp.set_editor_property("layer_bottom_altitude", 1.2)
    comp.set_editor_property("layer_height", 2.5)
    comp.set_editor_property("view_sample_count_scale", 1.0)
    comp.set_editor_property("material", ue.load_asset("/Engine/EngineSky/VolumetricClouds/m_SimpleVolumetricCloud_Inst"))
    return cloud


def install(map_path):
    levels = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
    if not levels.load_level(map_path):
        raise RuntimeError("Cannot open " + map_path)
    clouds()
    if not levels.save_current_level():
        raise RuntimeError("Cannot save " + map_path)

"""Render comparison plates with Unreal, independently of Agent Us.

Run in the editor with -ExecutePythonScript=<this file> -RenderOffscreen.
No level is saved; outputs go to generated/lookdev. This is a visual inspection,
not a performance benchmark. The scene uses the same mesh/material assets.
"""
from pathlib import Path
import json
import math
import os
import time
import traceback
import sys
import unreal as ue

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "visuals"))
import environment as visual_environment
OUT = ROOT / "generated" / "lookdev"
OUT.mkdir(parents=True, exist_ok=True)
actors = ue.get_editor_subsystem(ue.EditorActorSubsystem)
levels = ue.get_editor_subsystem(ue.LevelEditorSubsystem)
# Transient editor world; do not modify the player's Ocean level.
ue.EditorLoadingAndSavingUtils.new_blank_map(False)
world = ue.get_editor_subsystem(ue.UnrealEditorSubsystem).get_editor_world()


def spawn(kind, location=(0, 0, 0)):
    return actors.spawn_actor_from_class(kind, ue.Vector(*location))


def mesh(name, location=(0, 0, 0)):
    asset = ue.load_asset("/Game/Maritime/Models/SM_" + name)
    if not asset:
        raise RuntimeError("Missing mesh: " + name)
    actor = spawn(ue.StaticMeshActor, location)
    actor.static_mesh_component.set_static_mesh(asset)
    return actor


sun = spawn(ue.DirectionalLight)
sun.light_component.set_mobility(ue.ComponentMobility.MOVABLE)
sun.set_actor_rotation(ue.Rotator(-28, -55, 0), False)
sun.light_component.set_editor_property("intensity", 6.0)
sun.light_component.set_editor_property("atmosphere_sun_light", True)
spawn(ue.SkyAtmosphere)
visual_environment.clouds()
sky = spawn(ue.SkyLight)
sky.light_component.set_mobility(ue.ComponentMobility.MOVABLE)
sky.light_component.set_editor_property("source_type", ue.SkyLightSourceType.SLS_SPECIFIED_CUBEMAP)
sky.light_component.set_editor_property("cubemap", ue.load_asset("/Engine/MapTemplates/Sky/DaylightAmbientCubemap"))
sky.light_component.set_editor_property("intensity", .8)
sky.light_component.recapture_sky()
water = mesh("ocean")
water.static_mesh_component.set_material(0, ue.load_asset("/Game/Maritime/Materials/M_Ocean"))
mesh("coast")
mesh("seabed")
capture = spawn(ue.SceneCapture2D)
comp = capture.get_component_by_class(ue.SceneCaptureComponent2D)
comp.set_editor_property("capture_every_frame", False)
comp.set_editor_property("capture_on_movement", False)
comp.set_editor_property("always_persist_rendering_state", True)
comp.set_editor_property("capture_source", ue.SceneCaptureSource.SCS_FINAL_COLOR_LDR)
comp.set_editor_property("fov_angle", 42.)
target = ue.RenderingLibrary.create_render_target2d(world, 1600, 1000, ue.TextureRenderTargetFormat.RTF_RGBA8)
comp.set_editor_property("texture_target", target)
capture.root_component.set_mobility(ue.ComponentMobility.MOVABLE)
pp = comp.get_editor_property("post_process_settings")
pp.set_editor_property("override_auto_exposure_method", True)
pp.set_editor_property("auto_exposure_method", ue.AutoExposureMethod.AEM_MANUAL)
pp.set_editor_property("override_auto_exposure_apply_physical_camera_exposure", True)
pp.set_editor_property("auto_exposure_apply_physical_camera_exposure", False)
pp.set_editor_property("override_auto_exposure_bias", True)
pp.set_editor_property("auto_exposure_bias", 0.)
pp.set_editor_property("override_dynamic_global_illumination_method", True)
pp.set_editor_property("dynamic_global_illumination_method", ue.DynamicGlobalIlluminationMethod.LUMEN)
pp.set_editor_property("override_reflection_method", True)
pp.set_editor_property("reflection_method", ue.ReflectionMethod.LUMEN)
comp.set_editor_property("post_process_settings", pp)

requested = os.environ.get("MARITIME_LOOKDEV", "fdi,suffren,seaquest_s,seaquest_m,seaquest_l,seagent_m,seagent_xl,france_libre,vsr700").split(",")
catalog = json.loads((ROOT / "catalog" / "models.json").read_text(encoding="utf-8"))
report = []
state = {"index": 0, "boat": None, "ready_at": 0., "info": None}


def prepare(name):
    entry = next(x for x in catalog if x["id"].replace("-", "_") == name)
    length = entry["sizeM"][0]
    is_sub = entry["shape"] == "submarine"
    water.set_actor_hidden_in_game(is_sub)
    water.set_is_temporarily_hidden_in_editor(is_sub)
    boat = mesh(name)
    # Submarines shown dry to expose the complete silhouette for comparison.
    focus_z = 2 if is_sub else min(12., length*.065)
    if name == "vsr700":
        focus_z = 1.1
        length = 9
    eye = ue.Vector(length*93, -length*117, length*55)
    focus = ue.Vector(0, 0, focus_z*100)
    capture.set_actor_location(eye, False, False)
    capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye, focus), False)
    state["boat"] = boat
    state["ready_at"] = time.monotonic() + (90 if state["index"] == 0 else 12)
    state["info"] = {"model": name, "image": name + ".png", "fovDeg": 42,
                     "cameraCm": [eye.x, eye.y, eye.z], "dryInspection": is_sub,
                     "engine": ue.SystemLibrary.get_engine_version()}


def finish():
    ue.unregister_slate_post_tick_callback(callback)
    ue.EditorPythonScriptingLibrary.set_keep_python_script_alive(False)


def tick(delta):
    try:
        if state["boat"] is None:
            prepare(requested[state["index"]])
            return
        # Allow real engine ticks for transforms, shader results, sky and Lumen.
        comp.capture_scene()
        if time.monotonic() < state["ready_at"]:
            return
        name = requested[state["index"]]
        samples = [ue.RenderingLibrary.read_render_target_pixel(world, target, x, y)
                   for x in (400, 800, 1200) for y in (200, 500, 800)]
        if max(max(c.r, c.g, c.b) for c in samples) < 3:
            raise RuntimeError("Black frame for " + name + "; check scene initialization and exposure")
        ue.RenderingLibrary.export_render_target(world, target, str(OUT), name + ".png")
        if not (OUT / (name + ".png")).is_file():
            raise RuntimeError("No render exported for " + name)
        report.append(state["info"])
        ue.log("LOOKDEV_CAPTURE: " + name)
        actors.destroy_actor(state["boat"])
        state["boat"] = None
        state["index"] += 1
        if state["index"] == len(requested):
            (OUT / "capture-manifest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            ue.log("LOOKDEV_OK: " + str(len(report)) + " Unreal captures in " + str(OUT))
            finish()
    except Exception:
        ue.log_error(traceback.format_exc())
        finish()


ue.EditorPythonScriptingLibrary.set_keep_python_script_alive(True)
callback = ue.register_slate_post_tick_callback(tick)

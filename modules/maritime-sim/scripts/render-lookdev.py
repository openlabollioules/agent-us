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
    actor = actors.spawn_actor_from_class(kind, ue.Vector(*location))
    actor.set_actor_location(ue.Vector(*location), False, False)
    return actor


def mesh(name, location=(0, 0, 0)):
    asset = ue.load_asset("/Game/Maritime/Models/SM_" + name)
    if not asset:
        raise RuntimeError("Missing mesh: " + name)
    actor = spawn(ue.StaticMeshActor, location)
    actor.static_mesh_component.set_static_mesh(asset)
    return actor


sun = spawn(ue.DirectionalLight)
sun.light_component.set_mobility(ue.ComponentMobility.MOVABLE)
sun.set_actor_rotation(ue.Rotator(pitch=-35, yaw=65, roll=0), False)
sun.light_component.set_editor_property("intensity", 80000.0)
sun.light_component.set_editor_property("atmosphere_sun_light", True)
spawn(ue.SkyAtmosphere)
visual_environment.clouds()
sky = spawn(ue.SkyLight)
sky.light_component.set_mobility(ue.ComponentMobility.MOVABLE)
sky.light_component.set_editor_property("source_type", ue.SkyLightSourceType.SLS_CAPTURED_SCENE)
sky.light_component.set_editor_property("real_time_capture", True)
sky.light_component.set_editor_property("intensity", 1.)
sky.light_component.recapture_sky()
water = mesh("ocean")
water.static_mesh_component.set_cast_shadow(False)
water.static_mesh_component.set_material(0, ue.load_asset("/Game/Maritime/Materials/M_Ocean"))
mesh("coast")
if ue.EditorAssetLibrary.does_asset_exist('/Game/Maritime/Models/SM_surf'):
    mesh('surf').static_mesh_component.set_cast_shadow(False)
mesh("seabed").static_mesh_component.set_cast_shadow(False)
capture = spawn(ue.CameraActor)
comp = capture.get_component_by_class(ue.CameraComponent)
comp.set_field_of_view(42.)
comp.set_editor_property('constrain_aspect_ratio', False)
capture.root_component.set_mobility(ue.ComponentMobility.MOVABLE)
pp = comp.get_editor_property("post_process_settings")
pp.set_editor_property("override_auto_exposure_method", True)
pp.set_editor_property("auto_exposure_method", ue.AutoExposureMethod.AEM_HISTOGRAM)
for name,value in [('auto_exposure_min_brightness',0.),('auto_exposure_max_brightness',16.)]:
    pp.set_editor_property('override_'+name,True)
    pp.set_editor_property(name,value)
pp.set_editor_property("override_auto_exposure_bias", True)
pp.set_editor_property("auto_exposure_bias", -.35)
pp.set_editor_property("override_dynamic_global_illumination_method", True)
pp.set_editor_property("dynamic_global_illumination_method", ue.DynamicGlobalIlluminationMethod.LUMEN)
pp.set_editor_property("override_reflection_method", True)
pp.set_editor_property("reflection_method", ue.ReflectionMethod.LUMEN)
comp.set_editor_property("post_process_settings", pp)
levels.editor_set_game_view(True)
levels.pilot_level_actor(capture)

requested = os.environ.get("MARITIME_LOOKDEV", "fdi,suffren,seaquest_s,seaquest_m,seaquest_l,seagent_m,seagent_xl,france_libre,vsr700,fdi_starboard,fdi_sunset,suffren_underwater,coast,fdi_detail,suffren_sail").split(",")
catalog = json.loads((ROOT / "catalog" / "models.json").read_text(encoding="utf-8"))
report = []
state = {"index": 0, "boat": None, "ready_at": 0., "info": None, "task": None}
fog=spawn(ue.ExponentialHeightFog)
fog_component=fog.get_component_by_class(ue.ExponentialHeightFogComponent)
fog_component.set_editor_property('fog_density',.0008)
fog_component.set_volumetric_fog(True)


def prepare(name):
    variant=name
    name={'coast':'fdi','fdi_starboard':'fdi','fdi_sunset':'fdi','suffren_underwater':'suffren','fdi_detail':'fdi','suffren_sail':'suffren'}.get(name,name)
    entry = next(x for x in catalog if x["id"].replace("-", "_") == name)
    length = entry["sizeM"][0]
    water.set_actor_location(ue.Vector(0,0,0),False,False)
    is_sub = entry["shape"] == "submarine"
    water.set_actor_hidden_in_game(is_sub)
    water.set_is_temporarily_hidden_in_editor(is_sub)
    boat = mesh(name)
    # Submarines shown dry to expose the complete silhouette for comparison.
    focus_z = 2 if is_sub else min(12., length*.065)
    if name == "vsr700":
        focus_z = 1.1
        length = 9
    eye = ue.Vector(length*105, -length*138, length*35)
    focus = ue.Vector(0, 0, focus_z*100)
    capture.set_actor_location(eye, False, False)
    capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye, focus), False)
    if variant=='fdi_starboard':
        eye.y=-eye.y
        capture.set_actor_location(eye,False,False)
        capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye,focus),False)
    if variant in ('fdi_detail','suffren_sail'):
        eye=ue.Vector(5700,-4000,1250) if variant=='fdi_detail' else ue.Vector(1700,-1900,1450)
        focus=ue.Vector(3500,-500,400) if variant=='fdi_detail' else ue.Vector(1180,0,1020)
        capture.set_actor_location(eye,False,False)
        capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye,focus),False)
    if variant=='coast':
        eye=ue.Vector(195000,-495000,18000);focus=ue.Vector(285000,-440000,4000)
        boat.set_actor_location(ue.Vector(240000,-460000,0),False,False)
        water.set_actor_location(ue.Vector(240000,-460000,0),False,False)
        capture.set_actor_location(eye,False,False)
        capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye,focus),False)
    if variant=='suffren_underwater':
        water.set_actor_hidden_in_game(False);water.set_is_temporarily_hidden_in_editor(False)
        boat.set_actor_location(ue.Vector(0,0,-2600),False,False)
        eye=ue.Vector(9000,-11000,-1800);focus=ue.Vector(0,0,-2200)
        capture.set_actor_location(eye,False,False)
        capture.set_actor_rotation(ue.MathLibrary.find_look_at_rotation(eye,focus),False)
    fog_component.set_editor_property('fog_density',.025 if variant=='suffren_underwater' else .0008)
    fog_component.set_editor_property('fog_inscattering_luminance',ue.LinearColor(.025,.15,.19,1) if variant=='suffren_underwater' else ue.LinearColor(.5,.62,.7,1))
    sun.set_actor_rotation(ue.Rotator(pitch=-8 if variant=='fdi_sunset' else -35,yaw=65,roll=0),False)
    sun.light_component.set_editor_property('intensity',25000. if variant=='fdi_sunset' else 80000.)
    sun.light_component.set_light_color(ue.LinearColor(1,.6,.31,1) if variant=='fdi_sunset' else ue.LinearColor(1,1,1,1))
    state["boat"] = boat
    ue.log('LOOKDEV_LIGHT: rotation='+str(sun.get_actor_rotation())+' direction='+str(sun.get_actor_forward_vector())+' lux='+str(sun.light_component.get_editor_property('intensity'))+' color='+str(sun.light_component.get_editor_property('light_color')))
    ue.log('LOOKDEV_BOUNDS: '+str(boat.get_actor_bounds(False)))
    levels.pilot_level_actor(capture)
    state["ready_at"] = time.monotonic() + (30 if state["index"] == 0 else 12)
    state["info"] = {"model": name, "image": variant + ".png", "fovDeg": 42,
                     "cameraCm": [eye.x, eye.y, eye.z], "dryInspection": is_sub and variant!='suffren_underwater',
                     "engine": ue.SystemLibrary.get_engine_version()}


def finish():
    ue.unregister_slate_post_tick_callback(callback)
    ue.EditorPythonScripting.set_keep_python_script_alive(False)


def tick(delta):
    try:
        if state["boat"] is None:
            prepare(requested[state["index"]])
            return
        # Allow real engine ticks for transforms, shader results, sky and Lumen.
        if time.monotonic() < state["ready_at"]:
            return
        name = requested[state["index"]]
        if state['task'] is None:
            state['task'] = ue.AutomationLibrary.take_high_res_screenshot(1600, 1000, str(OUT / (name+'.png')), capture, delay=3.)
            state['deadline'] = time.monotonic()+60
            return
        if not state['task'].is_task_done():
            if time.monotonic()>state['deadline']: raise RuntimeError('Screenshot timed out: '+name)
            return
        if not (OUT / (name + ".png")).is_file():
            raise RuntimeError("No render exported for " + name)
        report.append(state["info"])
        ue.log("LOOKDEV_CAPTURE: " + name)
        actors.destroy_actor(state["boat"])
        state["boat"] = None
        state['task'] = None
        state["index"] += 1
        if state["index"] == len(requested):
            (OUT / "capture-manifest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            ue.log("LOOKDEV_OK: " + str(len(report)) + " Unreal captures in " + str(OUT))
            finish()
    except Exception:
        ue.log_error(traceback.format_exc())
        finish()


ue.EditorPythonScripting.set_keep_python_script_alive(True)
callback = ue.register_slate_post_tick_callback(tick)

"""Exercise the actual C++ renderer in PIE against a private loopback fixture.

Run with -ExecutePythonScript=... -SceneBridge=http://127.0.0.1:18787.
Never connects to the player's normal bridge. No map is saved.
"""
import json
import threading
import time
import traceback
import os
import statistics
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import unreal as ue

ROOT=Path(__file__).resolve().parents[1]
LAUNCH=time.monotonic()
START=None
samples=[]
checks={}
frame_times=[]
wave_epochs=[]
captured=False
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def do_GET(self):
        global START
        if START is None: START=time.monotonic()
        age=time.monotonic()-START
        stage=0 if age<10 else 1 if age<18 else 2
        frame={'owner':'maritime-visual-test-only','revision':stage,'snapshot':{
            'protocol':'maritime-scene/1','simulationId':'visual-check','scenarioId':'visual-check',
            'turn':stage,'presentation':'showcase','timeSeconds':stage*20,
            'environment':{'condition':'clear','sunElevationDeg':35,'waveHeightM':2,'visibilityM':20000},
            'contacts':[{'id':'test-boat','label':'Visual fixture','model':'uncertain' if stage==2 else 'fdi',
                'position':{'x':0 if stage==0 else 100,'y':0,'z':0},'headingDeg':90,
                'uncertain':stage==2,'highlighted':False,'affiliation':'unknown','trail':[]}],
            'areas':[],'focus':{'center':{'x':0,'y':0,'z':0},'radiusM':100,'contactIds':['test-boat']}},
            'camera':{'auto':False,'targetId':'test-boat','yawDeg':135,'pitchDeg':-25,'distanceM':200,'altitudeOffsetM':0}}
        payload=json.dumps({'generation':0,'frame':frame}).encode()
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(payload)

server=ThreadingHTTPServer(('127.0.0.1',18787),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
levels=ue.get_editor_subsystem(ue.LevelEditorSubsystem)
ue.EditorLoadingAndSavingUtils.new_blank_map(False)
levels.editor_request_begin_play()
ue.EditorPythonScripting.set_keep_python_script_alive(True)

def finish():
    ue.unregister_slate_post_tick_callback(callback)
    levels.editor_request_end_play()
    server.shutdown();server.server_close()
    ue.EditorPythonScripting.set_keep_python_script_alive(False)

def tick(delta):
    global captured
    try:
        if START is None:
            if time.monotonic()-LAUNCH>120: raise RuntimeError('Renderer did not connect to the test fixture')
            return
        age=time.monotonic()-START
        worlds=ue.EditorLevelLibrary.get_pie_worlds(False)
        if worlds:
            world=worlds[0]
            if 4<age<17: frame_times.append(ue.GameplayStatics.get_world_delta_seconds(world)*1000)
            if os.environ.get('MARITIME_GPU_CHECK')=='1' and age>7 and not captured:
                path=(ROOT/'generated'/'appearance-runtime.png').as_posix()
                ue.SystemLibrary.execute_console_command(world,'HighResShot 1600x1000 filename="'+path+'"')
                captured=True
            klass=ue.load_class(None,'/Script/MaritimeSim.MaritimeWorld')
            renderers=ue.GameplayStatics.get_all_actors_of_class(world,klass)
            if renderers:
                meshes=renderers[0].get_components_by_class(ue.StaticMeshComponent)
                ocean=next((m for m in meshes if m.get_name().startswith('Ocean')),None)
                if ocean and age>4:
                    wave_epochs.append(ocean.get_material(0).get_scalar_parameter_value('SceneTime'))
                boat=next((m for m in meshes if m.get_name().startswith('test-boat') and '_wake' not in m.get_name()),None)
                wake=next((m for m in meshes if 'test-boat_wake' in m.get_name()),None)
                if boat and boat.static_mesh:
                    p=boat.get_world_location();r=boat.get_world_rotation()
                    if 4<age<9: samples.append([p.x,p.y,p.z,r.pitch,r.roll])
                    if 13<age<14:
                        checks['settles_at_received_xy']=abs(p.x-10000)<1 and abs(p.y)<1
                        checks['moving_surface_has_wake']=bool(wake and wake.is_visible())
                    if 16<age<17:
                        checks['stationary_wake_fades']=bool(wake and not wake.is_visible())
                    if age>20:
                        checks['uncertain_mesh_anonymous']=boat.static_mesh.get_name()=='SM_uncertain'
                        checks['uncertain_has_no_wake']=bool(wake and not wake.is_visible())
        if age>24:
            checks['wave_motion_observed']=len(samples)>5 and max(s[2] for s in samples)-min(s[2] for s in samples)>1
            checks['no_horizontal_prediction']=bool(samples) and all(abs(s[0])<1 and abs(s[1])<1 for s in samples)
            checks['wave_phase_continuous_between_turns']=len(wave_epochs)>5 and max(wave_epochs)-min(wave_epochs)<1.e-6
            expected={'settles_at_received_xy','moving_surface_has_wake','stationary_wake_fades','uncertain_mesh_anonymous','uncertain_has_no_wake','wave_motion_observed','no_horizontal_prediction','wave_phase_continuous_between_turns'}
            if set(checks)!=expected or not all(checks.values()): raise RuntimeError('Appearance checks failed: '+json.dumps(checks))
            gpu=os.environ.get('MARITIME_GPU_CHECK')=='1'
            timing={'medianMs':statistics.median(frame_times),'p95Ms':sorted(frame_times)[int(len(frame_times)*.95)],'samples':len(frame_times)} if frame_times else {}
            (ROOT/'generated'/('appearance-gpu.json' if gpu else 'appearance-check.json')).write_text(json.dumps({'checks':checks,'samples':len(samples),'engine':ue.SystemLibrary.get_engine_version(),'rhi':'DX12 SM6' if gpu else 'Null','editorWorldFrameIntervals':timing},indent=2))
            ue.log('APPEARANCE_OK: '+json.dumps(checks))
            finish()
    except Exception:
        ue.log_error(traceback.format_exc());finish()
callback=ue.register_slate_post_tick_callback(tick)

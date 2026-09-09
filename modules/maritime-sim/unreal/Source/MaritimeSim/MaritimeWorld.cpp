#include "MaritimeWorld.h"
#include "MaritimeSea.h"
#include "Camera/CameraActor.h"
#include "Camera/CameraComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Components/InstancedStaticMeshComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/ExponentialHeightFog.h"
#include "Engine/SkyLight.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "InputCoreTypes.h"

namespace
{
    // Contract axes: X east, Y south, Z up, metres. UE uses centimetres.
    bool ReadPosition(const TSharedPtr<FJsonObject>& Obj, FVector& Out)
    {
        double X, Y, Z;
        if (!Obj || !Obj->TryGetNumberField(TEXT("x"), X) || !Obj->TryGetNumberField(TEXT("y"), Y) ||
            !Obj->TryGetNumberField(TEXT("z"), Z) || !FMath::IsFinite(X) || !FMath::IsFinite(Y) ||
            !FMath::IsFinite(Z) || FMath::Abs(X) > 100000 || FMath::Abs(Y) > 100000 || Z < -2000 || Z > 20000) return false;
        Out = FVector(X, Y, Z) * 100.;
        return true;
    }
    bool FieldPosition(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Field, FVector& Out)
    {
        const TSharedPtr<FJsonObject>* Position;
        return Obj && Obj->TryGetObjectField(Field, Position) && ReadPosition(*Position, Out);
    }
    FString MeshPath(const FString& Model)
    {
        static const TSet<FString> Models = { TEXT("fdi"), TEXT("suffren"), TEXT("seaquest-s"),
            TEXT("seaquest-m"), TEXT("seaquest-l"), TEXT("seagent-m"), TEXT("seagent-xl"),
            TEXT("france-libre"), TEXT("vsr700"), TEXT("cargo"), TEXT("fishing"), TEXT("patrol"), TEXT("uncertain") };
        const FString Safe = Models.Contains(Model) ? Model.Replace(TEXT("-"), TEXT("_")) : TEXT("uncertain");
        return FString::Printf(TEXT("/Game/Maritime/Models/SM_%s.SM_%s"), *Safe, *Safe);
    }
    struct FContactData
    {
        FString Id, Label, Model, Relation;
        FVector Position;
        double Heading = 0;
        bool bUncertain = true;
        bool bHighlighted = false;
        TArray<FVector> Trail;
    };
}

AMaritimeWorld::AMaritimeWorld()
{
    PrimaryActorTick.bCanEverTick = true;
    RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
}

UStaticMeshComponent* AMaritimeWorld::AddMesh(const FString& Name, const FString& Asset)
{
    auto* Mesh = NewObject<UStaticMeshComponent>(this, MakeUniqueObjectName(this, UStaticMeshComponent::StaticClass(), FName(*Name)));
    Mesh->SetupAttachment(RootComponent);
    Mesh->SetMobility(EComponentMobility::Movable);
    Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Mesh->SetStaticMesh(LoadObject<UStaticMesh>(nullptr, *Asset));
    Mesh->RegisterComponent();
    return Mesh;
}

UTextRenderComponent* AMaritimeWorld::AddLabel(const FString& Text)
{
    auto* Label = NewObject<UTextRenderComponent>(this);
    Label->SetupAttachment(RootComponent);
    Label->SetText(FText::FromString(Text));
    Label->SetHorizontalAlignment(EHTA_Center);
    Label->SetWorldSize(1000);
    Label->SetTextRenderColor(FColor(180, 220, 240));
    Label->RegisterComponent();
    return Label;
}

void AMaritimeWorld::BeginPlay()
{
    Super::BeginPlay();
    FParse::Value(FCommandLine::Get(), TEXT("SceneBridge="), BridgeUrl);
    // The bundled bridge intentionally listens on loopback only.
    if (!BridgeUrl.StartsWith(TEXT("http://127.0.0.1:")) && !BridgeUrl.StartsWith(TEXT("http://localhost:")))
        BridgeUrl = TEXT("http://127.0.0.1:8787");
    Camera = GetWorld()->SpawnActor<ACameraActor>();
    Camera->GetCameraComponent()->SetFieldOfView(60);
    auto& Exposure = Camera->GetCameraComponent()->PostProcessSettings;
    Exposure.bOverride_AutoExposureMethod = true;
    Exposure.AutoExposureMethod = EAutoExposureMethod::AEM_Histogram;
    Exposure.bOverride_AutoExposureMinBrightness = Exposure.bOverride_AutoExposureMaxBrightness = true;
    Exposure.AutoExposureMinBrightness = 0;
    Exposure.AutoExposureMaxBrightness = 16;
    Exposure.bOverride_AutoExposureBias = true;
    Exposure.AutoExposureBias = -.35f;
    Exposure.bOverride_AutoExposureSpeedUp = Exposure.bOverride_AutoExposureSpeedDown = true;
    Exposure.AutoExposureSpeedUp = 3;
    Exposure.AutoExposureSpeedDown = 1.5f;
    Exposure.bOverride_BloomIntensity = true;
    Exposure.BloomIntensity = .15f;
    if (auto* PC = GetWorld()->GetFirstPlayerController())
    {
        PC->SetViewTarget(Camera);
        PC->bShowMouseCursor = true;
        PC->SetInputMode(FInputModeGameAndUI());
    }
    auto* Ocean = AddMesh(TEXT("Ocean"), TEXT("/Game/Maritime/Models/SM_ocean.SM_ocean"));
    OceanMesh = Ocean;
    Ocean->SetCastShadow(false);
    if (auto* Mat = LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Maritime/Materials/M_Ocean.M_Ocean")))
    {
        OceanMaterial = UMaterialInstanceDynamic::Create(Mat, this);
        Ocean->SetMaterial(0, OceanMaterial);
    }
    auto* Seabed = AddMesh(TEXT("Seabed"), TEXT("/Game/Maritime/Models/SM_seabed.SM_seabed"));
    Seabed->SetCastShadow(false);
    Seabed->bAffectDistanceFieldLighting = false;
    auto* Coast = AddMesh(TEXT("Coast"), TEXT("/Game/Maritime/Models/SM_coast.SM_coast"));
    Coast->SetMobility(EComponentMobility::Static);
    auto* Surf = AddMesh(TEXT("Surf"), TEXT("/Game/Maritime/Models/SM_surf.SM_surf"));
    Surf->SetCastShadow(false);
    Surf->bAffectDistanceFieldLighting = false;
    Surf->SetMobility(EComponentMobility::Static);
    Ocean->bAffectDistanceFieldLighting = false;
    Sun = GetWorld()->SpawnActor<ADirectionalLight>();
    Sun->GetLightComponent()->SetMobility(EComponentMobility::Movable);
    Sun->GetLightComponent()->SetIntensity(80000);
    CastChecked<UDirectionalLightComponent>(Sun->GetLightComponent())->bAtmosphereSunLight = true;
    CastChecked<UDirectionalLightComponent>(Sun->GetLightComponent())->LightSourceAngle = .5357f;
    Sun->SetActorRotation(FRotator(-35, 65, 0));
    auto* Atmosphere = NewObject<USkyAtmosphereComponent>(this);
    Atmosphere->SetupAttachment(RootComponent);
    Atmosphere->RegisterComponent();
    auto* Sky = GetWorld()->SpawnActor<ASkyLight>();
    Sky->GetLightComponent()->SetMobility(EComponentMobility::Movable);
    Sky->GetLightComponent()->SetRealTimeCaptureEnabled(true);
    Fog = GetWorld()->SpawnActor<AExponentialHeightFog>();
    Fog->GetComponent()->SetVolumetricFog(true);
    Lines = NewObject<UInstancedStaticMeshComponent>(this);
    Lines->SetupAttachment(RootComponent);
    Lines->SetStaticMesh(LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube")));
    Lines->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Lines->SetCastShadow(false);
    Lines->SetMaterial(0, LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Maritime/Materials/M_Overlay.M_Overlay")));
    Lines->RegisterComponent();
    Banner = AddLabel(TEXT("Waiting for scene bridge - fictional exercise"));
    bAssetsReady = Ocean->GetStaticMesh() && OceanMaterial;
    if (!bAssetsReady)
    {
        Banner->SetText(FText::FromString(TEXT("Missing assets: run setup_unreal.py in the editor")));
        UE_LOG(LogTemp, Error, TEXT("Maritime Sim: generated ocean assets missing; renderer stays unavailable."));
    }
    UpdateCamera(0);
    Poll();
}

void AMaritimeWorld::Poll()
{
    if (!bAssetsReady || Pending.IsValid()) return;
    Pending = FHttpModule::Get().CreateRequest();
    Pending->SetURL(BridgeUrl + TEXT("/frame"));
    Pending->SetVerb(TEXT("GET"));
    Pending->SetHeader(TEXT("X-Maritime-Renderer"), TEXT("1"));
    Pending->SetTimeout(2.5f);
    Pending->OnProcessRequestComplete().BindWeakLambda(this,
        [this](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bOK)
        {
            Pending.Reset();
            if (!bOK || !Response.IsValid() || Response->GetResponseCode() != 200 ||
                Response->GetContentLength() > 2 * 1024 * 1024) return;
            TSharedPtr<FJsonObject> Envelope;
            if (FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Response->GetContentAsString()), Envelope) &&
                ApplyFrame(Envelope)) OfflineElapsed = 0;
        });
    if (!Pending->ProcessRequest()) Pending.Reset();
}

void AMaritimeWorld::ClearScene()
{
    for (auto& Pair : Contacts) Pair.Value->DestroyComponent();
    for (auto& Pair : Labels) Pair.Value->DestroyComponent();
    for (auto& Pair : Wakes) Pair.Value->DestroyComponent();
    Contacts.Empty(); Labels.Empty(); Wakes.Empty(); Appearance.Empty();
    Lines->ClearInstances();
    bHasFrame = false;
    LastRevision = -1;
    LastCameraJson.Empty();
    Banner->SetText(FText::FromString(TEXT("Scene disconnected - return to 2D")));
}

bool AMaritimeWorld::ApplyFrame(const TSharedPtr<FJsonObject>& Envelope)
{
    const TSharedPtr<FJsonObject>* FramePtr;
    double Generation;
    if (!Envelope || !Envelope->TryGetNumberField(TEXT("generation"), Generation)) return false;
    if (!Envelope->TryGetObjectField(TEXT("frame"), FramePtr))
    {
        ClearScene(); LastOwner.Empty(); LastRevision = -1; LastCameraJson.Empty();
        return true;
    }
    const auto Frame = *FramePtr;
    const TSharedPtr<FJsonObject> *ScenePtr, *CameraPtr, *EnvironmentPtr, *FocusPtr;
    FString SessionOwner, Protocol;
    double Revision;
    if (!Frame->TryGetStringField(TEXT("owner"), SessionOwner) || !Frame->TryGetNumberField(TEXT("revision"), Revision) ||
        !Frame->TryGetObjectField(TEXT("snapshot"), ScenePtr) || !Frame->TryGetObjectField(TEXT("camera"), CameraPtr)) return false;
    if (SessionOwner == LastOwner && Generation == LastGeneration && Revision <= LastRevision) return true;
    const auto Scene = *ScenePtr;
    const auto Cam = *CameraPtr;
    const TArray<TSharedPtr<FJsonValue>> *ContactArray, *AreaArray;
    FVector NewFocus;
    double Radius, Time, Wave, Visibility, SunElevation, NewYaw, NewPitch, NewDistance, NewHeight;
    bool bAuto;
    if (!Scene->TryGetStringField(TEXT("protocol"), Protocol) || Protocol != TEXT("maritime-scene/1") ||
        !Scene->TryGetArrayField(TEXT("contacts"), ContactArray) || ContactArray->Num() > 256 ||
        !Scene->TryGetArrayField(TEXT("areas"), AreaArray) || AreaArray->Num() > 64 ||
        !Scene->TryGetObjectField(TEXT("environment"), EnvironmentPtr) || !Scene->TryGetObjectField(TEXT("focus"), FocusPtr) ||
        !FieldPosition(*FocusPtr, TEXT("center"), NewFocus) || !(*FocusPtr)->TryGetNumberField(TEXT("radiusM"), Radius) ||
        !Scene->TryGetNumberField(TEXT("timeSeconds"), Time) ||
        !(*EnvironmentPtr)->TryGetNumberField(TEXT("waveHeightM"), Wave) ||
        !(*EnvironmentPtr)->TryGetNumberField(TEXT("visibilityM"), Visibility) ||
        !(*EnvironmentPtr)->TryGetNumberField(TEXT("sunElevationDeg"), SunElevation) ||
        !Cam->TryGetBoolField(TEXT("auto"), bAuto) || !Cam->TryGetNumberField(TEXT("yawDeg"), NewYaw) ||
        !Cam->TryGetNumberField(TEXT("pitchDeg"), NewPitch) || !Cam->TryGetNumberField(TEXT("distanceM"), NewDistance) ||
        !Cam->TryGetNumberField(TEXT("altitudeOffsetM"), NewHeight)) return false;
    for (const double Value : {Radius, Time, Wave, Visibility, SunElevation, NewYaw, NewPitch, NewDistance, NewHeight})
        if (!FMath::IsFinite(Value)) return false;
    // Validate the whole contact set before mutating the rendered scene.
    TArray<FContactData> Data;
    TSet<FString> Ids;
    for (const auto& Value : *ContactArray)
    {
        const auto Obj = Value->AsObject();
        FContactData C;
        const TArray<TSharedPtr<FJsonValue>>* Trail;
        if (!Obj || !Obj->TryGetStringField(TEXT("id"), C.Id) || Ids.Contains(C.Id) ||
            !Obj->TryGetStringField(TEXT("label"), C.Label) || !Obj->TryGetStringField(TEXT("model"), C.Model) ||
            !FieldPosition(Obj, TEXT("position"), C.Position) || !Obj->TryGetNumberField(TEXT("headingDeg"), C.Heading) ||
            !FMath::IsFinite(C.Heading) || !Obj->TryGetBoolField(TEXT("uncertain"), C.bUncertain) ||
            !Obj->TryGetBoolField(TEXT("highlighted"), C.bHighlighted) ||
            !Obj->TryGetArrayField(TEXT("trail"), Trail) || Trail->Num() > 256) return false;
        if (C.bUncertain) C.Model = TEXT("uncertain");
        Obj->TryGetStringField(TEXT("relationTargetId"), C.Relation);
        for (const auto& Point : *Trail)
        {
            FVector P;
            if (!ReadPosition(Point->AsObject(), P)) return false;
            C.Trail.Add(P);
        }
        Ids.Add(C.Id); Data.Add(MoveTemp(C));
    }
    TArray<TPair<FVector, double>> Areas;
    for (const auto& Value : *AreaArray)
    {
        FVector P; double R;
        const auto Area = Value->AsObject();
        if (!FieldPosition(Area, TEXT("center"), P) || !Area->TryGetNumberField(TEXT("radiusM"), R) ||
            !FMath::IsFinite(R) || R < 0 || R > 100000) return false;
        Areas.Add(TPair<FVector, double>(P, R));
    }
    if (SessionOwner != LastOwner || Generation != LastGeneration) { ClearScene(); LastCameraJson.Empty(); }
    TArray<FString> Removed;
    for (const auto& Pair : Contacts) if (!Ids.Contains(Pair.Key)) Removed.Add(Pair.Key);
    for (const auto& Id : Removed)
    {
        Contacts[Id]->DestroyComponent(); Contacts.Remove(Id);
        Labels[Id]->DestroyComponent(); Labels.Remove(Id);
        if (Wakes.Contains(Id)) { Wakes[Id]->DestroyComponent(); Wakes.Remove(Id); }
        Appearance.Remove(Id);
    }
    Lines->ClearInstances();
    for (const auto& C : Data)
    {
        if (!Contacts.Contains(C.Id))
        {
            Contacts.Add(C.Id, AddMesh(C.Id, MeshPath(C.Model)));
            Labels.Add(C.Id, AddLabel(C.Label));
        }
        auto* Mesh = Contacts[C.Id].Get();
        const bool bNewVisual = !Appearance.Contains(C.Id) || Appearance[C.Id].Model != C.Model;
        if (bNewVisual)
        {
            Mesh->EmptyOverrideMaterials();
            Mesh->SetStaticMesh(LoadObject<UStaticMesh>(nullptr, *MeshPath(C.Model)));
            for (int32 Slot = 0; Slot < Mesh->GetNumMaterials(); ++Slot)
                Mesh->CreateAndSetMaterialInstanceDynamic(Slot);
            FMaritimeAppearance Visual;
            Visual.From = Visual.To = C.Position; Visual.Model = C.Model;
            Visual.FromHeading = Visual.Heading = C.Heading - 90.;
            if (Mesh->GetStaticMesh())
            {
                const auto Size = Mesh->GetStaticMesh()->GetBoundingBox().GetSize() * .01;
                Visual.LengthM = Size.X; Visual.BeamM = Size.Y;
            }
            Appearance.Add(C.Id, Visual);
        }
        auto& Visual = Appearance[C.Id];
        const float NewHeading = C.Heading - 90.;
        if (!Visual.To.Equals(C.Position, .1) || FMath::Abs(FMath::FindDeltaAngleDegrees(Visual.Heading, NewHeading)) > .01f)
        {
            const double Elapsed = Time - SceneTime;
            Visual.SpeedMps = Elapsed > 0 ? FMath::Clamp(FVector::Dist2D(Visual.To, C.Position) / (100. * Elapsed), 0., 25.) : 0;
            const double Blend = FMath::SmoothStep(0., 1., FMath::Clamp(Visual.Age / 1.2, 0., 1.));
            Visual.From = FMath::Lerp(Visual.From, Visual.To, Blend); // exclude visual heave
            Visual.FromHeading += FMath::FindDeltaAngleDegrees(Visual.FromHeading, Visual.Heading) * Blend;
            Visual.To = C.Position; Visual.Age = 0;
        }
        Visual.Heading = NewHeading;
        if (!Wakes.Contains(C.Id) && C.Model != TEXT("uncertain") && C.Model != TEXT("vsr700"))
        {
            auto* WakeMesh = AddMesh(C.Id + TEXT("_wake"), TEXT("/Game/Maritime/Models/SM_wake.SM_wake"));
            WakeMesh->SetCastShadow(false);
            if (auto* WakeMat = LoadObject<UMaterialInterface>(nullptr,TEXT("/Game/Maritime/Materials/M_Wake.M_Wake")))
                WakeMesh->SetMaterial(0, UMaterialInstanceDynamic::Create(WakeMat, this));
            Wakes.Add(C.Id,WakeMesh);
        }
        auto* Label = Labels[C.Id].Get();
        Label->SetText(FText::FromString(C.Label + (C.bUncertain ? TEXT(" [?]") : TEXT(""))));
        Label->SetWorldLocation(C.Position + FVector(0, 0, 5000));
        Label->SetTextRenderColor(C.bHighlighted ? FColor(255, 180, 60) : FColor(180, 220, 240));
        for (int32 I = 1; I < C.Trail.Num(); I++) AddLine(C.Trail[I-1] + FVector(0,0,200), C.Trail[I] + FVector(0,0,200));
    }
    for (const auto& C : Data) if (Contacts.Contains(C.Relation))
        AddLine(C.Position + FVector(0,0,300), Contacts[C.Relation]->GetComponentLocation() + FVector(0,0,300), 1.2f);
    for (const auto& Area : Areas) for (int32 I = 0; I < 96; I++)
    {
        const double A = I * 2. * PI / 96., B = (I+1) * 2. * PI / 96.;
        AddLine(Area.Key + FVector(FMath::Cos(A), FMath::Sin(A), 0) * Area.Value * 100. + FVector(0,0,300),
            Area.Key + FVector(FMath::Cos(B), FMath::Sin(B), 0) * Area.Value * 100. + FVector(0,0,300), 1.5f);
    }
    Focus = NewFocus; FocusRadiusM = FMath::Clamp(Radius, 25., 100000.);
    VisibilityM = FMath::Clamp(Visibility, 20., 100000.);
    if (!bHasFrame) { WaveTimeOffset = Time; DisplayWaveHeightM = FMath::Clamp(Wave, 0., 20.); }
    SceneTime = Time; WaveHeightM = FMath::Clamp(Wave, 0., 20.);
    FString Weather;
    (*EnvironmentPtr)->TryGetStringField(TEXT("condition"), Weather);
    Wetness = Weather == TEXT("rain") || Weather == TEXT("storm") ? .85f : .12f;
    Sun->GetLightComponent()->SetIntensity((Weather == TEXT("storm") ? 12000.f : Weather == TEXT("rain") ? 24000.f : 80000.f)
        * FMath::Clamp(float(FMath::Sin(FMath::DegreesToRadians(SunElevation))) * 2.f, .0001f, 1.f));
    Sun->GetLightComponent()->SetLightColor(SunElevation < 12 ? FLinearColor(1.f,.66f,.42f) : FLinearColor::White);
    if (OceanMaterial)
    {
        OceanMaterial->SetScalarParameterValue(TEXT("SceneTime"), WaveTimeOffset);
    }
    // Material parameters change with the weather/frame, not in every mesh slot each tick.
    for (const auto& Pair : Contacts)
    {
        const auto& Model = Appearance[Pair.Key].Model;
        for (int32 Slot = 0; Slot < Pair.Value->GetNumMaterials(); ++Slot)
            if (auto* Mat = Cast<UMaterialInstanceDynamic>(Pair.Value->GetMaterial(Slot)))
            {
                Mat->SetScalarParameterValue(TEXT("Wetness"), Model == TEXT("suffren") || Model.StartsWith(TEXT("seagent-")) ? .72f : Wetness);
                Mat->SetScalarParameterValue(TEXT("RotorHz"), Model == TEXT("vsr700") ? 12.f : 0.f);
            }
    }
    Sun->SetActorRotation(FRotator(-FMath::Clamp(SunElevation, -90., 90.), 65, 0));
    FString CameraJson;
    FJsonSerializer::Serialize(Cam.ToSharedRef(), TJsonWriterFactory<>::Create(&CameraJson));
    if (LastCameraJson != CameraJson)
    {
        bAutomatic = bAuto; Yaw = NewYaw; Pitch = FMath::Clamp(NewPitch, -85., 85.);
        DistanceM = FMath::Clamp(NewDistance, 20., 30000.); HeightOffsetM = FMath::Clamp(NewHeight, -1500., 15000.);
        TargetId.Empty(); Cam->TryGetStringField(TEXT("targetId"), TargetId);
        LastCameraJson = CameraJson;
    }
    LastOwner = SessionOwner; LastRevision = Revision; LastGeneration = Generation; bHasFrame = true;
    FString Presentation;
    Scene->TryGetStringField(TEXT("presentation"), Presentation);
    Banner->SetText(FText::FromString(Presentation == TEXT("showcase")
        ? TEXT("FLEET GALLERY - public exterior reconstructions") : TEXT("FICTIONAL EXERCISE - estimated tracks")));
    return true;
}

void AMaritimeWorld::UpdateAppearance(float DeltaSeconds)
{
    const double T = GetWorld()->GetTimeSeconds() + WaveTimeOffset;
    DisplayWaveHeightM = FMath::Lerp(DisplayWaveHeightM, WaveHeightM, 1.f - FMath::Exp(-DeltaSeconds * .7f));
    if (OceanMaterial) OceanMaterial->SetScalarParameterValue(TEXT("WaveHeight"), DisplayWaveHeightM * 100.f);
    for (auto& Pair : Appearance)
    {
        auto* Mesh = Contacts.FindRef(Pair.Key).Get();
        if (!Mesh) continue;
        auto& V = Pair.Value;
        V.Age += DeltaSeconds;
        const double Alpha = FMath::SmoothStep(0., 1., FMath::Clamp(V.Age / 1.2, 0., 1.));
        FVector P = FMath::Lerp(V.From, V.To, Alpha);
        const double Heading = V.FromHeading + FMath::FindDeltaAngleDegrees(V.FromHeading, V.Heading) * Alpha;
        FRotator R(0,Heading,0);
        const bool bSub = V.Model == TEXT("suffren") || V.Model.StartsWith(TEXT("seagent-"));
        const bool bAir = V.Model == TEXT("vsr700");
        const bool bMarker = V.Model == TEXT("uncertain");
        const double Surface = bSub ? FMath::Exp(FMath::Min(0., V.To.Z / 800.)) : 1.;
        if (!bMarker && !bAir)
        {
            const auto Target = MaritimeMotion::Sample(P * .01, Heading, V.LengthM, V.BeamM, T, DisplayWaveHeightM, bSub);
            const double Response = FMath::Clamp(.12 + FMath::Sqrt(V.LengthM) * .035, .18, .85);
            V.Heave.Step(Target.Heave, DeltaSeconds, Response);
            V.Pitch.Step(Target.Pitch, DeltaSeconds, Response * 1.2);
            V.Roll.Step(Target.Roll, DeltaSeconds, Response * 1.6);
            P.Z += V.Heave.Value * 100.;
            R.Pitch = V.Pitch.Value; R.Roll = V.Roll.Value;
        }
        if (bAir) { P.Z += FMath::Sin(T*.7)*7.; R.Roll = FMath::Sin(T*.45)*.8; }
        Mesh->SetWorldLocationAndRotation(P,R);
        Labels[Pair.Key]->SetWorldLocation(P+FVector(0,0,5000));
        if (auto* WakeMesh=Wakes.FindRef(Pair.Key).Get())
        {
            const double WakeFade = 1. - FMath::SmoothStep(1.2, 5., double(V.Age));
            const bool bWake = !bMarker && !bAir && V.SpeedMps > .25f && Surface > .65 && WakeFade > .01;
            WakeMesh->SetVisibility(bWake);
            if (bWake)
            {
                const double Length=FMath::Clamp(V.LengthM*1.8f,16.f,450.f);
                const FVector Behind=FRotator(0,Heading,0).Vector()*(V.LengthM*.38+Length*.5)*100.;
                WakeMesh->SetWorldLocation(FVector(P.X-Behind.X,P.Y-Behind.Y,18));
                WakeMesh->SetWorldRotation(FRotator(0,Heading,0));
                WakeMesh->SetWorldScale3D(FVector(Length*.1,FMath::Max(V.BeamM*3.f,5.f)*.1,1));
                if (auto* Mat=Cast<UMaterialInstanceDynamic>(WakeMesh->GetMaterial(0)))
                {
                    Mat->SetScalarParameterValue(TEXT("Strength"),FMath::Clamp(V.SpeedMps/8.f,0.f,.9f)*WakeFade);
                    Mat->SetScalarParameterValue(TEXT("WaveHeight"),DisplayWaveHeightM*100.f);
                    Mat->SetScalarParameterValue(TEXT("SceneTime"),WaveTimeOffset);
                }
            }
        }
    }
    if (OceanMesh && Camera)
    {
        const auto P=Camera->GetActorLocation();
        // Match the dense grid spacing (800 m / 256), avoiding 100 m jumps.
        OceanMesh->SetWorldLocation(FVector(FMath::GridSnap(P.X,312.5),FMath::GridSnap(P.Y,312.5),0));
    }
}

void AMaritimeWorld::AddLine(const FVector& A, const FVector& B, float Width)
{
    const FVector Delta = B - A;
    if (Delta.IsNearlyZero()) return;
    Lines->AddInstance(FTransform(Delta.Rotation(), (A+B)*0.5, FVector(Delta.Length()/100., Width, Width)));
}

void AMaritimeWorld::UpdateCamera(float DeltaSeconds)
{
    auto* PC = GetWorld()->GetFirstPlayerController();
    if (!PC || !Camera) return;
    float DX = 0, DY = 0;
    PC->GetInputMouseDelta(DX, DY);
    if (PC->IsInputKeyDown(EKeys::RightMouseButton) && (DX != 0 || DY != 0))
    {
        bAutomatic = false; Yaw += DX * .3f; Pitch = FMath::Clamp(Pitch + DY * .3f, -85.f, 85.f);
    }
    if (PC->WasInputKeyJustPressed(EKeys::MouseScrollUp)) { bAutomatic = false; DistanceM /= 1.15f; }
    if (PC->WasInputKeyJustPressed(EKeys::MouseScrollDown)) { bAutomatic = false; DistanceM *= 1.15f; }
    if (PC->IsInputKeyDown(EKeys::E)) { bAutomatic = false; HeightOffsetM += DeltaSeconds * 100.f; }
    if (PC->IsInputKeyDown(EKeys::Q)) { bAutomatic = false; HeightOffsetM -= DeltaSeconds * 100.f; }
    if (PC->WasInputKeyJustPressed(EKeys::Home)) { bAutomatic = true; TargetId.Empty(); }
    if (PC->WasInputKeyJustPressed(EKeys::U)) { bAutomatic = false; HeightOffsetM = -40; Pitch = 0; DistanceM = 200; }
    DistanceM = FMath::Clamp(DistanceM, 20.f, 30000.f);
    HeightOffsetM = FMath::Clamp(HeightOffsetM, -1500.f, 15000.f);
    FVector Target = Contacts.Contains(TargetId) ? Contacts[TargetId]->GetComponentLocation() : Focus;
    float Radius = Contacts.Contains(TargetId) ? 200.f : FocusRadiusM;
    // Fit the framing sphere in the narrower FOV (including portrait windows).
    int32 Width = 1280, Height = 720;
    PC->GetViewportSize(Width, Height);
    const float Aspect = FMath::Max(.2f, float(Width) / FMath::Max(1, Height));
    const float HalfFov = FMath::Atan(FMath::Tan(FMath::DegreesToRadians(30.f)) / FMath::Max(1.f, Aspect));
    const float Range = bAutomatic ? FMath::Clamp(Radius / FMath::Sin(HalfFov), 250.f, 30000.f) : DistanceM;
    const FRotator Rotation(bAutomatic ? -40.f : Pitch, Yaw, 0);
    Target.Z += bAutomatic ? 0 : HeightOffsetM * 100.;
    FVector Location = Target - Rotation.Vector() * Range * 100.;
    Location.Z = FMath::Clamp(Location.Z, -28000., 2000000.);
    Camera->SetActorLocation(FMath::VInterpTo(Camera->GetActorLocation(), Location, DeltaSeconds, 5));
    Camera->SetActorRotation(FMath::RInterpTo(Camera->GetActorRotation(), Rotation, DeltaSeconds, 5));
    const bool bUnderwater = Camera->GetActorLocation().Z < 0;
    Fog->GetComponent()->SetFogDensity(bUnderwater ? .045f : FMath::Clamp(15.f / VisibilityM, .0002f, .04f));
    Fog->GetComponent()->SetFogInscatteringColor(bUnderwater ? FLinearColor(.015f,.14f,.22f) : FLinearColor(.45f,.58f,.66f));
    auto& PP = Camera->GetCameraComponent()->PostProcessSettings;
    PP.bOverride_SceneColorTint = true;
    PP.SceneColorTint = bUnderwater ? FLinearColor(.3f,.75f,.85f) : FLinearColor::White;
    for (auto& Pair : Labels)
    {
        const FVector Delta = Camera->GetActorLocation() - Pair.Value->GetComponentLocation();
        Pair.Value->SetWorldRotation(Delta.Rotation());
        Pair.Value->SetWorldSize(FMath::Clamp(Delta.Length() * .009f, 60., 2200.));
    }
    Banner->SetWorldLocation(Camera->GetActorLocation() + Camera->GetActorForwardVector() * 1000. - Camera->GetActorUpVector() * 360.);
    Banner->SetWorldRotation((-Camera->GetActorForwardVector()).Rotation());
    Banner->SetWorldSize(14);
}

void AMaritimeWorld::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    PollElapsed += DeltaSeconds; OfflineElapsed += DeltaSeconds;
    if (PollElapsed >= .2f) { PollElapsed = 0; Poll(); }
    if (OfflineElapsed > 5 && bHasFrame) ClearScene();
    UpdateAppearance(DeltaSeconds);
    UpdateCamera(DeltaSeconds);
}

void AMaritimeWorld::EndPlay(const EEndPlayReason::Type Reason)
{
    if (Pending.IsValid()) { Pending->OnProcessRequestComplete().Unbind(); Pending->CancelRequest(); Pending.Reset(); }
    Super::EndPlay(Reason);
}

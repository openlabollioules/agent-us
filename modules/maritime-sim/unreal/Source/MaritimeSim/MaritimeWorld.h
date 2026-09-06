#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Interfaces/IHttpRequest.h"
#include "MaritimeWorld.generated.h"

class UStaticMeshComponent;
class UTextRenderComponent;
class UInstancedStaticMeshComponent;
class UMaterialInstanceDynamic;
class ACameraActor;
class ADirectionalLight;
class AExponentialHeightFog;
class FJsonObject;

UCLASS()
class MARITIMESIM_API AMaritimeWorld : public AActor
{
    GENERATED_BODY()
public:
    AMaritimeWorld();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    virtual void EndPlay(const EEndPlayReason::Type Reason) override;
private:
    void Poll();
    bool ApplyFrame(const TSharedPtr<FJsonObject>& Envelope);
    void ClearScene();
    void UpdateCamera(float DeltaSeconds);
    void AddLine(const FVector& A, const FVector& B, float Width = 0.5f);
    UStaticMeshComponent* AddMesh(const FString& Name, const FString& Asset);
    UTextRenderComponent* AddLabel(const FString& Text);
    UPROPERTY() TMap<FString, TObjectPtr<UStaticMeshComponent>> Contacts;
    UPROPERTY() TMap<FString, TObjectPtr<UTextRenderComponent>> Labels;
    UPROPERTY() TObjectPtr<UInstancedStaticMeshComponent> Lines;
    UPROPERTY() TObjectPtr<UMaterialInstanceDynamic> OceanMaterial;
    UPROPERTY() TObjectPtr<ACameraActor> Camera;
    UPROPERTY() TObjectPtr<ADirectionalLight> Sun;
    UPROPERTY() TObjectPtr<AExponentialHeightFog> Fog;
    UPROPERTY() TObjectPtr<UTextRenderComponent> Banner;
    TSharedPtr<IHttpRequest, ESPMode::ThreadSafe> Pending;
    FString BridgeUrl = TEXT("http://127.0.0.1:8787");
    FString LastOwner;
    FString LastCameraJson;
    double LastRevision = -1;
    double LastGeneration = -1;
    float PollElapsed = 0;
    float OfflineElapsed = 0;
    bool bAutomatic = true;
    bool bHasFrame = false;
    bool bAssetsReady = false;
    FVector Focus = FVector::ZeroVector;
    float FocusRadiusM = 1200;
    FString TargetId;
    float Yaw = 135;
    float Pitch = -35;
    float DistanceM = 1600;
    float HeightOffsetM = 0;
    float VisibilityM = 20000;
};

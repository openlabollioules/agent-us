#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MaritimeGameMode.generated.h"

UCLASS()
class MARITIMESIM_API AMaritimeGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AMaritimeGameMode();
    virtual void BeginPlay() override;
};

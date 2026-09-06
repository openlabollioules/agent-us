#include "MaritimeGameMode.h"
#include "MaritimeWorld.h"
#include "Engine/World.h"
AMaritimeGameMode::AMaritimeGameMode() { DefaultPawnClass = nullptr; }
void AMaritimeGameMode::BeginPlay()
{
    Super::BeginPlay();
    GetWorld()->SpawnActor<AMaritimeWorld>();
}

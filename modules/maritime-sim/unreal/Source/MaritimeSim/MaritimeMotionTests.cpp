#include "MaritimeMotion.h"
#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FMaritimeDampingTest, "Maritime.Visual.Damping",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FMaritimeDampingTest::RunTest(const FString& Parameters)
{
    MaritimeMotion::FSpring Single, Split;
    Single.Step(3., 1., .65);
    double Previous = 0;
    for (int I = 0; I < 120; ++I)
    {
        Split.Step(3., 1./120., .65);
        TestTrue(TEXT("Response has no overshoot or backward jump"), Split.Value >= Previous && Split.Value <= 3.);
        Previous = Split.Value;
    }
    TestTrue(TEXT("Identical response at different frame rates"), FMath::Abs(Single.Value-Split.Value) < 1.e-10);
    Split.Step(3., 10., .65);
    TestTrue(TEXT("Hitches remain finite and converge"), FMath::IsFinite(Split.Value) && FMath::Abs(Split.Value-3.) < 1.e-8);
    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FMaritimeSeaTest, "Maritime.Visual.WaterlineResponse",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FMaritimeSeaTest::RunTest(const FString& Parameters)
{
    double SurfaceEnergy = 0, DeepEnergy = 0, SmallPitch = 0, LargePitch = 0;
    for (int I = 0; I < 400; ++I)
    {
        const double T = I*.1;
        auto Surface = MaritimeMotion::Sample(FVector(200,300,0), 30, 100, 9, T, 3, true);
        auto Deep = MaritimeMotion::Sample(FVector(200,300,-150), 30, 100, 9, T, 3, true);
        auto Small = MaritimeMotion::Sample(FVector::ZeroVector, 0, 12, 4, T, 3, false);
        auto Large = MaritimeMotion::Sample(FVector::ZeroVector, 0, 300, 60, T, 3, false);
        SurfaceEnergy += FMath::Square(Surface.Heave);
        DeepEnergy += FMath::Square(Deep.Heave);
        SmallPitch += FMath::Square(Small.Pitch); LargePitch += FMath::Square(Large.Pitch);
        TestTrue(TEXT("Attitudes bounded"), FMath::Abs(Small.Roll)<=10 && FMath::Abs(Small.Pitch)<=7 && FMath::Abs(Small.Heave)<=1.5);
    }
    TestTrue(TEXT("Deep submerged hull loses wave energy"), DeepEnergy < SurfaceEnergy*.001);
    TestTrue(TEXT("Long hull filters short-wave pitch"), LargePitch < SmallPitch*.1);
    const auto Calm = MaritimeMotion::Sample(FVector(20,70,0), 180, 122, 18, 21, 0, false);
    TestTrue(TEXT("Calm sea has no invented motion"), Calm.Heave==0 && Calm.Roll==0 && Calm.Pitch==0);
    return true;
}
#endif

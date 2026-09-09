#pragma once
#include "CoreMinimal.h"
#include "MaritimeSea.h"

// Display-only response. No vessel mass, manoeuvring or military characteristics.
namespace MaritimeMotion
{
struct FSpring
{
    double Value = 0, Velocity = 0;
    void Step(double Target, double Seconds, double ResponseSeconds)
    {
        // Exact critically damped solution for a held target: stable after a hitch
        // and independent of frame partitioning. ResponseSeconds is artistic.
        const double W = 2. / FMath::Max(.05, ResponseSeconds);
        const double Error = Value - Target, J = Velocity + W * Error;
        const double Decay = FMath::Exp(-W * FMath::Max(0., Seconds));
        Value = Target + (Error + J * Seconds) * Decay;
        Velocity = (Velocity - W * J * Seconds) * Decay;
    }
};

struct FAttitude { double Heave = 0, Pitch = 0, Roll = 0; };
inline FAttitude Sample(const FVector& PositionM, double Heading, double LengthM, double BeamM,
    double Time, double HeightM, bool bSubmarine)
{
    const FRotator Rotation(0, Heading, 0);
    const FVector Forward = Rotation.Vector(), Right = FRotationMatrix(Rotation).GetUnitAxis(EAxis::Y);
    const double L = FMath::Max(3., LengthM) * .38, B = FMath::Max(1., BeamM) * .4;
    double Z = 0, XZ = 0, YZ = 0;
    // Nine waterline samples fit a least-squares plane and average short waves
    // across the footprint, instead of rocking a 300 m deck like a small drone.
    for (int X = -1; X <= 1; ++X) for (int Y = -1; Y <= 1; ++Y)
    {
        const FVector P = PositionM + Forward * (X * L) + Right * (Y * B);
        const double H = MaritimeSea::Height(P.X, P.Y, Time, HeightM, bSubmarine ? FMath::Min(0., PositionM.Z) : 0.);
        Z += H; XZ += X * H; YZ += Y * H;
    }
    return { Z / 9., FMath::Clamp(FMath::RadiansToDegrees(FMath::Atan(XZ / (6 * L))), -7., 7.),
        FMath::Clamp(-FMath::RadiansToDegrees(FMath::Atan(YZ / (6 * B))), -10., 10.) };
}
}

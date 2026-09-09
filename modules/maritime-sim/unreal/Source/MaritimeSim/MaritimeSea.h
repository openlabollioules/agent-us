// Generated from catalog/sea-spectrum.json by generate-models.mjs. Visual animation only.
#pragma once
#include "CoreMinimal.h"
namespace MaritimeSea {
struct FWave { double K, DX, DY, Amplitude, Phase, Omega; };
inline constexpr FWave Waves[] = {
    { 0.044879895051, 0.949235418082, 0.314566560616, 0.190000000000, 0.000000000000, 0.663529781135 },
    { 0.101341698503, 0.738468558730, 0.674287911628, 0.130000000000, 1.700000000000, 0.997076758486 },
    { 0.224399475256, 0.913088940312, -0.407760453060, 0.085000000000, 3.100000000000, 1.483697695713 },
    { 0.483321946706, 0.362357754477, 0.932039085967, 0.045000000000, 4.800000000000, 2.177472915374 }
};
inline double Height(double X, double Y, double T, double H, double Depth = 0.) {
    double Z=0;
    for (const auto& W : Waves) {
        const double Attenuation = Depth < 0 ? FMath::Exp(W.K * Depth) : 1.;
        Z += FMath::Sin((X*W.DX+Y*W.DY)*W.K-T*W.Omega+W.Phase)*W.Amplitude*H*Attenuation;
    }
    return Z;
}
}

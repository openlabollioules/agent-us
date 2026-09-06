using UnrealBuildTool;
public class MaritimeSim : ModuleRules
{
    public MaritimeSim(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore", "HTTP", "Json", "JsonUtilities"
        });
    }
}

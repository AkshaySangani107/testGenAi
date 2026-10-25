export class ExpandTestDto {
  sourceContent: string;
  existingSpec: string;
  uncoveredMethods: string[];
  uncoveredBranches: string[];
  dependencyContext?: string;
}

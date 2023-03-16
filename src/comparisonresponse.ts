import { SnowflakeType } from "./types";
import { sqlinsert } from "./sqlrest";

export const saveComparisonSelection = async (comparisonId: SnowflakeType, elementId: SnowflakeType): Promise<void> => {
  return sqlinsert('comparisonresponse', { id: comparisonId, selectedComparisonElementId: elementId });
};
import type { Worksheet } from "../types";
import {
  getSubjectCounts,
  type OptionWithCount,
} from "./resourceFilters";
import {
  filterWorksheetsBySmartContext,
  getSmartLearningContext,
  type SmartLearningContext,
} from "./smartContext";

export interface SubjectHomeData {
  context: SmartLearningContext & {
    selectedClass: string;
  };
  list: OptionWithCount[];
  total: number;
}

/**
 * Build the guided Subject Home for the current learning period.
 *
 * Rules:
 * - active class is required
 * - current Academic Year only
 * - current Semester + blank/general Semester
 * - only subjects that actually have matching resources are returned
 */
export function getSubjectHomeData(
  worksheets: Worksheet[],
  selectedClass: string,
  date: Date = new Date(),
): SubjectHomeData {
  const className =
    String(selectedClass ?? "").trim();

  const smartContext =
    getSmartLearningContext(date);

  const context = {
    ...smartContext,
    selectedClass: className,
  };

  if (!className) {
    return {
      context,
      list: [],
      total: 0,
    };
  }

  const scoped =
    filterWorksheetsBySmartContext(
      worksheets,
      context,
    );

  const subjectData =
    getSubjectCounts(
      scoped,
      className,
    );

  return {
    context,
    list: subjectData.list,
    total: subjectData.total,
  };
}

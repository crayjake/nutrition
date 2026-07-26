import type {
  ClimbBand,
  GymGradeColour,
  LoggedClimb
} from "@/types/tracking";

export interface GymGrade {
  id: GymGradeColour;
  label: string;
  colour: string;
  textColour: string;
  grades: Record<ClimbBand, string>;
}

// The Climbing Lab grading chart, ordered from easiest to hardest. Green,
// yellow and red route tags select the easy, medium and hard values.
export const GYM_GRADES: GymGrade[] = [
  {
    id: "green",
    label: "Green",
    colour: "#07952d",
    textColour: "#ffffff",
    grades: { easy: "B", medium: "0", hard: "1" }
  },
  {
    id: "orange",
    label: "Orange",
    colour: "#ff8412",
    textColour: "#ffffff",
    grades: { easy: "0", medium: "1", hard: "2" }
  },
  {
    id: "yellow",
    label: "Yellow",
    colour: "#ffce08",
    textColour: "#27220d",
    grades: { easy: "1", medium: "2", hard: "3" }
  },
  {
    id: "pink",
    label: "Pink",
    colour: "#ef3bca",
    textColour: "#ffffff",
    grades: { easy: "2", medium: "3", hard: "4" }
  },
  {
    id: "black",
    label: "Black",
    colour: "#202321",
    textColour: "#ffffff",
    grades: { easy: "3", medium: "4", hard: "5" }
  },
  {
    id: "blue",
    label: "Blue",
    colour: "#158bdd",
    textColour: "#ffffff",
    grades: { easy: "4", medium: "5", hard: "6" }
  },
  {
    id: "purple",
    label: "Purple",
    colour: "#9c28d1",
    textColour: "#ffffff",
    grades: { easy: "6", medium: "7", hard: "8" }
  },
  {
    id: "mint",
    label: "Mint",
    colour: "#18c3c1",
    textColour: "#102d2c",
    grades: { easy: "8+", medium: "8+", hard: "8+" }
  }
];

export const CLIMB_BANDS: Array<{
  id: ClimbBand;
  label: string;
  colour: string;
}> = [
  { id: "easy", label: "Easy", colour: "#3c9b65" },
  { id: "medium", label: "Medium", colour: "#e1aa2d" },
  { id: "hard", label: "Hard", colour: "#d14f45" }
];

export function gradeLabel(climb: Pick<LoggedClimb, "gradeColour" | "band">) {
  const grade =
    GYM_GRADES.find((item) => item.id === climb.gradeColour) ??
    GYM_GRADES[0];
  const band =
    CLIMB_BANDS.find((item) => item.id === climb.band)?.label ?? climb.band;
  return `${grade.label} · ${band} · ${grade.grades[climb.band]}`;
}

export function gradeRangeLabel(grade: GymGrade): string {
  const values = [
    grade.grades.easy,
    grade.grades.medium,
    grade.grades.hard
  ];
  return new Set(values).size === 1
    ? values[0]
    : values.join(" / ");
}

export function gradeScore(
  climb: Pick<LoggedClimb, "gradeColour" | "band">
): number {
  const gradeIndex = Math.max(
    0,
    GYM_GRADES.findIndex((item) => item.id === climb.gradeColour)
  );
  const bandIndex = Math.max(
    0,
    CLIMB_BANDS.findIndex((item) => item.id === climb.band)
  );
  return gradeIndex * CLIMB_BANDS.length + bandIndex;
}

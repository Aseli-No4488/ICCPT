export const TemplateMap = {
  IMAGE_TOP: 1,
  IMAGE_LEFT: 2,
  IMAGE_RIGHT: 3,
  IMAGE_BOTTOM: 4,
  IMAGE_CENTER: 5,
} as const;

export const OperatorMap = {
  "": "",
  ">": "1",
  ">=": "2",
  "==": "3",
  "<": "4",
  "<=": "5",
} as const;

type Template = (typeof TemplateMap)[keyof typeof TemplateMap];

type RequireType = "id" | "points" | "pointCompare" | "or";

type Point = {
  name: string;
  value: number;
};

type OperatorStr = ">=" | ">" | "<=" | "<" | "==" | "";

export type { Template, RequireType, Point, OperatorStr };

export class blankJSON {
  ToJSON() {
    return "";
  }
}

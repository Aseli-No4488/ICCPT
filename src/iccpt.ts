import type { Template, RequireType, OperatorStr } from "./type.ts";
import { TemplateMap, OperatorMap } from "./type.ts";

import { bolierplate } from "./statics.js";

import { randomChars } from "./utils.ts";

export default class Project {
  rows: Row[] = [];
  pointTypes: Point[] = [];

  constructor() {
    Object.assign(this, bolierplate);
  }

  addRow(param: Partial<Row>, index?: number) {
    const row = new Row(param);
    row.index = index ?? this.rows.length; // Force set index might causes unexpected error.
    this.rows.push(row);

    return row;
  }

  addScoreType(id: string, initValue: number = 0, params: Partial<Point> = {}) {
    const point = new Point(id, initValue);
    Object.assign(point, params);
    this.pointTypes.push(point);
    return point;
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    // Not Recommanded to use
    return JSON.stringify(this);
  }
}

export class Row {
  id: string = "Row_" + randomChars(8);
  title: string = "";
  debugTitle: string = "";
  titleText: string = "";
  text: string = "";
  image: string = "";
  template: Template = TemplateMap.IMAGE_TOP;
  allowedChoices: number = 0;
  currentChoices: number = 0;
  deselectChoice: boolean = false;
  requireds: any[] = [];
  objects: Choice[] = [];

  index: number = 0;
  objectWidth: string = "col-md-3";
  isButtonRow: boolean = false;
  buttonType: boolean = true;
  buttonId: string = "";
  buttonText: string = "Click";
  buttonRandom: boolean = false;
  buttonRandomNumber: number = 1;
  isResultRow: boolean = false;
  resultGroupId: string = "";
  isInfoRow: boolean = false;
  defaultAspectWidth: number = 1;
  defaultAspectHeight: number = 1;
  rowJustify: string = "start";
  isEditModeOn: boolean = false;
  isRequirementOpen: boolean = false;
  rowDesignGroups: any[] = [];

  constructor(param: Partial<Row>) {
    const { requireds, ...rest } = param;

    if (!rest.titleText && rest.text) {
      rest.titleText = rest.text;
      rest.text = undefined;
    }

    if (param.requireds instanceof Requires) {
      this.requireds = param.requireds.childs;
    }
    Object.assign(this, rest);
  }

  addChoice(param: Partial<Choice>) {
    const choice = new Choice(param);
    this.objects.push(choice);
    return choice;
  }

  setRequireds(requireds: Requires) {
    this.requireds = requireds.childs;
    return this;
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this);
  }
}

export class Choice {
  id: string = "Choice_" + randomChars(8);
  title: string = "";
  text: string = "";
  debugTitle: string = "";
  image: string = "";

  index?: number = 0;
  template: Template = TemplateMap.IMAGE_TOP;
  objectWidth: string = "";
  isActive: boolean = false;
  multipleUseVariable: number = 0;
  initMultipleTimesMinus: number = 0;
  selectedThisManyTimesProp: number = 0;
  requireds: Require[] = [];
  addons: any[] = [];
  scores: Score[] = [];
  groups: any[] = [];
  objectDesignGroups: any[] = [];

  numMultipleTimesMinus: number = 0;
  isVisible: boolean = true;
  isNotSelectable: boolean = false;
  // selectOnce: boolean = false;

  constructor(param: Partial<Choice>) {
    const { requireds, ...rest } = param;

    if (param.requireds instanceof Requires) {
      this.requireds = param.requireds.childs;
    }
    Object.assign(this, rest);
  }

  addScore(
    pointObj: Point | string,
    value: number,
    params: Partial<Score> = {},
  ) {
    const score = new Score({
      idx: "s-" + randomChars(5),
      id: typeof pointObj === "string" ? pointObj : pointObj.id,
      value: value,
    });
    score.add(params);

    this.scores.push(score);

    return score;
  }

  setRequireds(requireds: Requires) {
    this.requireds = requireds.childs;
    return this;
  }

  addAddon(param: Partial<Addon>) {
    const addon = new Addon(param, this.id);
    this.addons.push(addon);
    return addon;
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this);
  }
}

export class Addon extends Choice {
  parentId: string;
  constructor(param: Partial<Choice>, parentId: string) {
    super(param);
    this.parentId = parentId;
  }
  override addAddon(param: any): never {
    throw new Error("This method should not be used in Addon class");
  }
}

export class Score {
  idx?: string;
  id?: string;

  value?: number = 0;
  type?: string = "";
  requireds?: Require[] = [];
  beforeText?: string = "Cost:";
  afterText?: string = "points";
  showScore?: boolean = true;

  isNotRecalculatable?: boolean = false;
  isNotDiscountable?: boolean = false;
  hideValue?: boolean = false;
  isRandom: boolean = false;
  minValue?: number = 0;
  maxValue?: number = 0;

  useExpression?: boolean = false;
  expValue?: string = "";

  // TODO: might be only used in older ICC version.
  isActive?: any;
  setValue?: any;
  discountIsOn?: any;
  discountShow?: any;

  constructor(param: Partial<Score>) {
    const { requireds, ...rest } = param;

    if (param.requireds instanceof Requires) {
      this.requireds = param.requireds.childs;
    }
    Object.assign(this, rest);
  }

  setRequireds(requireds: Requires) {
    this.requireds = requireds.childs;
    return this;
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this);
  }
}
export class Point {
  id: string;
  initValue: number;

  name: string = "Point";
  startingSum: number = 0;
  activatedId: string = "";
  beforeText: string = "";
  afterText: string = "";
  category: number = -1;
  isNotShownPointBar: boolean = false;
  belowZeroNotAllowed: boolean = false;
  isNotShownObjects: boolean = false;
  allowFloat: boolean = false;
  plussOrMinusAdded: boolean = false;
  decimalPlaces: number = 2;
  plussOrMinusInverted: boolean = false;

  pointColorsIsOn: boolean = false;
  positiveColor?: string | any = undefined; // Hex color string | ICC color object
  negativeColor?: string | any = undefined; // Hex color string | ICC color object

  constructor(id: string, initValue: number = 0) {
    this.id = id;
    this.initValue = initValue;
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this);
  }
}

export class Requires {
  childs: Require[] = [];
  constructor() {}

  add(require: Require) {
    this.childs.push(require);
    return this;
  }

  select(id: string | Choice, param: Partial<Require> = {}) {
    const require = new Require({
      reqId: typeof id === "string" ? id : id.id,
      ...param,
    });

    this.childs.push(require);

    return this;
  }
  nselect(id: string | Choice, param: Partial<Require> = {}) {
    const require = new Require({
      reqId: typeof id === "string" ? id : id.id,
      required: false,
      ...param,
    });
    this.childs.push(require);
    return this;
  }
  point(
    pointId: string | Point,
    operatorStr: OperatorStr,
    value: number,
    params: Partial<Require> = {},
  ) {
    const require = new Require({
      type: "points",
      reqId: typeof pointId === "string" ? pointId : pointId.id,
      reqPoints: value,
      operator: OperatorMap[operatorStr],
      ...params,
    });
    this.childs.push(require);
    return this;
  }
  pointCompare(
    pointId1: string | Point,
    operatorStr: OperatorStr,
    pointId2: string | Point,
    params: Partial<Require> = {},
  ) {
    const require = new Require({
      type: "pointCompare",
      reqId: typeof pointId1 === "string" ? pointId1 : pointId1.id,
      reqId1: typeof pointId2 === "string" ? pointId2 : pointId2.id,
      operator: OperatorMap[operatorStr],
      ...params,
    });
    this.childs.push(require);

    return this;
  }
  xOfTheseMet(
    requires: Require[] | Requires,
    num: number,
    params: Partial<Require> = {},
  ) {
    if (requires instanceof Requires) requires = requires.childs;
    const require = new Require({
      type: "or",
      requireds: requires,
      orNum: num,
      ...params,
    });
    this.childs.push(require);
    return this;
  }
  nxOfTheseMet(
    requires: Require[] | Requires,
    num: number,
    params: Partial<Require> = {},
  ) {
    if (requires instanceof Requires) requires = requires.childs;
    const require = new Require({
      type: "or",
      requireds: requires,
      orNum: num,
      required: false,
      ...params,
    });
    this.childs.push(require);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this.childs);
  }
}
// TODO: group requirements

export class Require {
  required: boolean = true;
  requireds: Require[] | Requires | any[] = [];
  orRequired: Require[] | Requires | any[] = [];
  orRequireds: any[] = []; // TODO: what is this
  id: string = "";
  type: RequireType = "id";
  reqId: string = "";
  reqId1: string = "";
  reqId2: string = "";
  reqId3: string = "";
  reqPoints: number = 0;
  showRequired: boolean = false;
  operator: (typeof OperatorMap)[keyof typeof OperatorMap] = "";
  afterText: string = "choice";
  beforeText: string = "Required:";
  orNum: number = 1;
  selNum: number = 1;
  selFromOperators: string = "1";
  more: any[] = [];

  constructor(param: Partial<Require>) {
    Object.assign(this, param);
  }

  add(params: any) {
    Object.assign(this, params);
    return this;
  }

  ToJSON() {
    return JSON.stringify(this);
  }
}

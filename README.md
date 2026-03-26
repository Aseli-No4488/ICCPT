# Interactive CYOA Creator Plus - Text based interface

Designed based on ICC Plus 2.8.10 version. `ICCPT` allows you to create projects programmatically using a text-based interface.

## Quick Start

```typescript
import Project from "./src/iccpt.ts";

// Create a new project
const project = new Project();

// Add a point type (score)
const point1 = project.addScoreType("point_id", 100, {
  name: "Point Name",
  description: "Description of the point",
  positiveColor: "#00fc2e",
  negativeColor: "#cd2727",
});

// Add a row
const row1 = project.addRow({
  title: "<b>Row Title</b>",
  text: "Description of the row",
  allowedChoices: 0, // 0 means unlimited
});

// Add a choice to the row
const choice1 = row1.addChoice({
  title: "Choice 1",
  text: "Description for choice 1",
});

// Attach a score cost to the choice
choice1.addScore(point1, 10, {
  beforeText: "Cost: ",
});

// ---
// Save the project into json file
import fs from "fs";
const jsonString = JSON.stringify(project);
fs.writeFileSync("project.json", jsonString);
```

---

## API Reference

### `Project`

The root class managing rows and point types.

#### Instantiation

```typescript
const project = new Project();
```

Initializes the project with default styling and boilerplate data.

#### Methods

- `addRow(param: Partial<Row>, index?: number): Row`  
  Appends a new `Row` to the project.
- `addScoreType(id: string, initValue?: number, params?: Partial<Point>): Point`  
  Adds a new point/currency type.
- `ToJSON(): string`  
  Serializes the object struct to JSON.
- `add(params: any): Project`  
  Merges arbitrary raw parameters.

#### `addScoreType`

Defines a specific score/currency system (e.g., gold, health, alignment points).

##### Instantiation

Generally generated via `project.addScoreType()`.

```typescript
const gold = project.addScoreType("gold", 0, { name: "Gold Coins" });
```

##### Core Properties

- `id: string`
- `initValue: number`
- `name: string`
- `belowZeroNotAllowed: boolean`
- `allowFloat: boolean`
- `positiveColor / negativeColor: string`: Hex code colors.

---

### `Row`

Represents a section (Row) containing choices.

#### Instantiation

Generally generated via `project.addRow()`.

```typescript
const row = project.addRow({
  title: "Main Row",
  allowedChoices: 1,
});
```

#### Core Properties

- `id: string` (Default: auto-generated)
- `title / titleText / text: string`
- `image: string`
- `template: Template`: Layout template from `TemplateMap`.
- `allowedChoices: number`: Number of allowed selections (0 for unlimited).

#### Methods

- `addChoice(param: Partial<Choice>): Choice`  
  Adds a new choice to this row.
- `setRequireds(requireds: Requires): Row`  
  Sets visibility/selection requirements.
- `add(params: any): Row`  
  Escape hatch to append raw object properties.

---

### `Choice`

A selectable item within a `Row`.

#### Instantiation

Generally generated via `row.addChoice()`.

```typescript
const choice = row.addChoice({
  title: "A simple choice",
  text: "Description goes here",
});
```

#### Core Properties

- `id: string` (Default: auto-generated)
- `title / text: string`
- `image: string`
- `isActive: boolean`
- `isVisible: boolean`

#### Methods

- `addScore(pointObj: Point | string, value: number, params?: Partial<Score>): Score`  
  Appends a score cost or gain to the choice. Note that it's different from `addScoreType()` which creates a new point type, while this method attaches a score to the choice.
- `addAddon(param: any): Addon`  
  Appends an Addon choice connected to this original choice.
- `setRequireds(requireds: Requires): Choice`  
  Attaches activation/visibility requirements.

---

### `Score`

Represents the numerical implication (costs or rewards) of taking a `Choice`.

#### Instantiation

Generally generated via `choice.addScore()`.

```typescript
choice.addScore(point1, 5, { showScore: true });
```

#### Core Properties

- `id: string`: ID of the connected `Point`.
- `value: number`
- `beforeText / afterText: string`: Defines how the score is visually read (e.g., "Cost:", "points").
- `showScore: boolean`: Visibility of the score block.

#### Methods

- `setRequireds(requireds: Requires): Score`  
  Adds conditions upon which this score executes.

---

### `Requires` (Builder Pattern)

Chainable requirement builder to define dependencies between user selections and points.

#### Instantiation

```typescript
import { Requires } from "./src/iccpt.ts";

const reqs = new Requires().select("some_choice_id").point(gold, ">=", 10);

choice.setRequireds(reqs);
```

#### Methods

- `select(id: string, param?: Partial<Require>): Requires`  
  Demands a choice ID to be selected.
- `nselect(id: string, param?: Partial<Require>): Requires`  
  Demands a choice ID to _not_ be selected.
- `point(pointObj: Point, operatorStr: OperatorStr, value: number, params?: Partial<Require>): Requires`  
  Compares a point total against a literal value.
- `pointCompare(pointObj1: Point, operatorStr: OperatorStr, pointObj2: Point, params?: Partial<Require>): Requires`  
  Compares a point against another point.
- `xOfTheseMet(requires: Require[], num: number, params?: Partial<Require>): Requires`  
  Met if `num` of the nested requirements are met.
- `nxOfTheseMet(...)`  
  Met if `num` of the nested requirements are _not_ met.

---

### Useful Maps / Enums (From `type.ts`)

#### `TemplateMap`

- `IMAGE_TOP`, `IMAGE_LEFT`, `IMAGE_RIGHT`, `IMAGE_BOTTOM`, `IMAGE_CENTER`

#### `OperatorStr`

- `">=" | ">" | "<=" | "<" | "==" | ""`

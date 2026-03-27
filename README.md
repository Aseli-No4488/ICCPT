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
  Appends a new [`Row`](#row) to the project.
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

Represents a section (Row) containing [`Choice`](#choice)s.

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
- `template: Template`: Layout template from [`TemplateMap`](#templatemap).
- `allowedChoices: number`: Number of allowed selections (0 for unlimited).

#### Methods

- `addChoice(param: Partial<Choice>): Choice`  
  Adds a new [`Choice`](#choice) to this row.
- `setRequireds(requireds: Requires): Row`  
  Sets visibility/selection requirements documented in [`Requires`](#requires-builder-pattern).
- `add(params: any): Row`  
  Escape hatch to append raw object properties.

---

### `Choice`

A selectable item within a [`Row`](#row).

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
  Appends a [`Score`](#score) cost or gain to the choice. Note that it's different from [`addScoreType()`](#addscoretype) which creates a new point type, while this method attaches a score to the choice.
- `addAddon(param: any): Addon`  
  Appends an [`Addon`](#addon) connected to this original choice.
- `setRequireds(requireds: Requires): Choice`  
  Attaches activation/visibility requirements. Refer to [`Requires`](#requires-builder-pattern).

---

### `Addon`

Represents an additional component (addon) connected to an original [`Choice`](#choice). It extends the functionality of a [`Choice`](#choice) and inherits its properties and methods. Refer to the [`Requires`](#requires-builder-pattern) section for more information on how to control addon visibility.

#### Instantiation

Generally generated via `choice.addAddon()`.
Usually used with requirements to control its visibility, as addons are meant to be conditional extensions of their parent choice.

```typescript
const addon = choice.addAddon({
  title: "Addon Title",
  text: "Description for this addon",
});
```

#### Core Properties

Inherits all properties from [`Choice`](#choice), with the addition of:

- `parentId: string`: The ID of the parent [`Choice`](#choice) this addon is attached to.

#### Methods

Inherits all methods from [`Choice`](#choice), with one exception:

- `addAddon(param: any): never`  
  Throws an error, as addons cannot have their own nested addons.

---

### `Score`

Represents the numerical implication (costs or rewards) of taking a [`Choice`](#choice).

#### Instantiation

Generally generated via `choice.addScore()`.

```typescript
choice.addScore(point1, 5, { showScore: false }); // Default showScore is true.
```

#### Core Properties

- `id: string`: ID of the connected `Point` (from [`addScoreType()`](#addscoretype)).
- `value: number`
- `beforeText / afterText: string`: Defines how the score is visually read (e.g., "Cost:", "points").
- `showScore: boolean`: Visibility of the score block.

#### Methods

- `setRequireds(requireds: Requires): Score`  
  Adds conditions upon which this score executes. Refer to [`Requires`](#requires-builder-pattern).

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

#### `xOfTheseMet()` Example

```typescript
const reqs = new Requires().xOfTheseMet(
  [
    new Requires().select("choice1"),
    new Requires().point(gold, ">=", 10),
    new Requires().point(health, "<", 5),
  ],
  2,
);
```

---

### Enums and Types

#### `TemplateMap`

- `IMAGE_TOP` (1)
- `IMAGE_LEFT` (2)
- `IMAGE_RIGHT` (3)
- `IMAGE_BOTTOM` (4)
- `IMAGE_CENTER` (5)

#### `OperatorMap`

Maps comparison string operators to internal values used by ICC:

- `""` &rarr; `""`
- `">="` &rarr; `"1"`
- `">"` &rarr; `"2"`
- `"<="` &rarr; `"3"`
- `"<"` &rarr; `"4"`
- `"=="` &rarr; `"5"`

#### `Template`

- `(typeof TemplateMap)[keyof typeof TemplateMap]` (i.e. `1 | 2 | 3 | 4 | 5`)

#### `RequireType`

- `"id" | "points" | "pointCompare" | "or"`

#### `OperatorStr`

- `">=" | ">" | "<=" | "<" | "==" | ""`

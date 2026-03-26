import { bolierplate } from "../src/statics.js";
import { Requires, Require, Row, Score } from "../src/iccpt.ts";
import { OperatorMap, blankJSON } from "../src/type.ts";
import fs from "fs";
import { cleanVarName, randomChars } from "../src/utils.ts";

// All templates
const rowTemplate = new Row({});
const choiceTemplate = new Row({}).addChoice({});
const requiredTemplate = new Require({});
const pointTemplate = new Score({});
const addonTemplate = new Row({}).addChoice({}).addAddon({});

function requiredsToScriptString(
  requireds: Require[],
  reqVarName: string = "req_" + randomChars(8),
) {
  let result = `\nconst ${reqVarName} = new Requires()`;

  for (const r of requireds) {
    const { id, type, operator, reqId, reqId1, required, ...params } = r;

    // Find operator string from OperatorMap
    const operatorStr = Object.keys(OperatorMap).find(
      (key) => OperatorMap[key as keyof typeof OperatorMap] === operator,
    );

    //
    let differentParams: any = {};
    for (const key in params) {
      if (!requiredTemplate.hasOwnProperty(key)) {
        differentParams[key] = params[key as keyof typeof params];
        continue;
      }
      if (
        JSON.stringify(
          requiredTemplate[key as keyof typeof requiredTemplate],
        ) !== JSON.stringify(params[key as keyof typeof params])
      ) {
        differentParams[key] = params[key as keyof typeof params];
      }
    }

    if (type === "points") {
      const pointVarName = cleanVarName(`point_${reqId}`);
      // console.log(pointVarName, operatorStr, operator);

      result +=
        `.point(${pointVarName}, "${operatorStr}", ${r.reqPoints}, ${JSON.stringify(differentParams)})\n\t`.replace(
          ", {}",
          "",
        );
    } else if (type === "pointCompare") {
      const pointVarName1 = cleanVarName(`point_${reqId}`);
      const pointVarName2 = cleanVarName(`point_${reqId1}`);

      result +=
        `.pointCompare(${pointVarName1}, "${operatorStr}", ${pointVarName2}, ${JSON.stringify(differentParams)})\n\t`.replace(
          ", {}",
          "",
        );
    } else if (type === "id") {
      if (required) {
        result +=
          `.select("${reqId}", ${JSON.stringify(differentParams)})\n\t`.replace(
            ", {}",
            "",
          );
      } else {
        result +=
          `.nselect("${reqId}", ${JSON.stringify(differentParams)})\n\t`.replace(
            ", {}",
            "",
          );
      }
    } else if (type === "or" || type === "gid") {
      // Lazy implementation - xOfTheseMet, nxOfTheseMet, group requirements are not implemented yet
      differentParams.type = type;
      result +=
        `.add(new Require(${JSON.stringify(differentParams)}))\n\t`.replace(
          ", {}",
          "",
        );
    }
  }

  if (result === `\nconst ${reqVarName} = new Requires()`) {
    return "";
  }

  result = result.trimEnd() + ";\n";

  return result;
}

// Get arg
const args = process.argv.slice(3);
if (args.length < 1) {
  console.error("Please provide the path to the project.json file.");
  process.exit(1);
}

// Target file path from args
const inputFile = args[0];
const outputFile = args[1] || "./translated_project.ts";
const outputJSONFile = args[2] || "./translated_generated.json";

// Initialize project
const project = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

let result: string = `
// Auto-generated file, might be inaccurate. Please keep the original Project.json file.
import Project from "./src/iccpt.ts";
import { Requires, Require } from "./src/iccpt.ts";
import fs from "fs";

const project = new Project();

`;

// Project class
// // -- // Compare with bolierplate's params except rows and pointTypes.
for (const key in project) {
  if (key == "rows" || key == "pointTypes") continue;

  if (
    key in bolierplate &&
    JSON.stringify(bolierplate[key as keyof typeof bolierplate]) ==
      JSON.stringify(project[key])
  ) {
    continue;
  }

  result += `project.add({ ${key}: ${JSON.stringify(project[key])} }); // Missing\n`;
}

// Handle pointTypes
if (project.pointTypes && project.pointTypes.length > 0) {
  for (const point of project.pointTypes) {
    const { id, initValue, ...pointParams } = point;

    // Compare with template (default) and delete same values
    let param: any = {};
    for (const key in pointParams) {
      if (!pointTemplate.hasOwnProperty(key)) {
        param[key as keyof typeof param] =
          pointParams[key as keyof typeof pointParams];
      } else if (
        JSON.stringify(pointTemplate[key as keyof typeof pointTemplate]) !==
        JSON.stringify(pointParams[key as keyof typeof pointParams])
      ) {
        param[key as keyof typeof param] =
          pointParams[key as keyof typeof pointParams];
      }
    }
    const pointVarName = cleanVarName(`point_${id}`);

    result += `\nconst ${pointVarName} = project.addScoreType("${id}", ${initValue}, ${JSON.stringify(param)});`;
  }
}

for (const row of project.rows) {
  const varname = cleanVarName(`row_${row.id}`);

  //   Append params that is in the Partial<Row> type.

  let existingParams: any = {};
  let missingParams: any = {};

  for (const key in row) {
    // Handle params that are in the Partial<Row> type
    if (key === "objects" || key === "requireds") continue;
    if (!(key in rowTemplate)) {
      missingParams[key as keyof typeof missingParams] =
        row[key as keyof typeof row];
      continue;
    }

    if (
      JSON.stringify(rowTemplate[key as keyof Row]) !== JSON.stringify(row[key])
    ) {
      existingParams[key as keyof typeof existingParams] =
        row[key as keyof typeof row];
    }
  }

  result += `\n\nconst ${varname} = project.addRow(${JSON.stringify(existingParams)});\n`;

  // Handle requireds
  if (row.requireds && row.requireds.length > 0) {
    const str = requiredsToScriptString(row.requireds, `req_${varname}`);
    if (str.length > 0) {
      result += str;
      result += `${varname}.setRequireds(req_${varname});\n\n`;
    }
  }

  // Handle missing params
  if (Object.keys(missingParams).length > 0) {
    result += `${varname}`;
    for (const key in missingParams) {
      result += `.add({ ${key}: ${JSON.stringify(missingParams[key])} })\n\t`;
    }
    result = result.trimEnd() + ";\n";
  }

  result += "\n";

  // Handle objects
  if (row.objects && row.objects.length > 0) {
    for (const choice of row.objects) {
      const choiceVarName = `choice_${choice.id}`.replace(
        /[^a-zA-Z0-9_]/g,
        "_",
      );

      // Existing params
      let existingChoiceParams: any = {};
      let missingChoiceParams: any = {};

      for (const key of Object.keys(choice)) {
        if (["addons", "requireds", "scores"].includes(key)) continue;
        if (!choiceTemplate.hasOwnProperty(key)) {
          missingChoiceParams[key] = choice[key];
          continue;
        }

        if (
          JSON.stringify(choiceTemplate[key as keyof typeof choiceTemplate]) !==
          JSON.stringify(choice[key])
        ) {
          existingChoiceParams[key] = choice[key];
        }
      }

      result += `\nconst ${choiceVarName} = ${varname}.addChoice(${JSON.stringify(existingChoiceParams)});\n`;

      //   Handle scores
      if (choice.scores && choice.scores.length > 0) {
        for (let idx = 0; idx < choice.scores.length; idx++) {
          // score except id and value = param
          const score = choice.scores[idx];
          const { id, value, requireds, ...scoreParams } = score;

          const pointObj = project.pointTypes.find((p: any) => p.id === id);
          const pointVarName = cleanVarName(`point_${id}`);

          const scoreVarName = cleanVarName(`score_${choice.id}_${idx}`);
          const requiredsVarName = cleanVarName(`req_${scoreVarName}`);

          const requiredsString = requiredsToScriptString(
            requireds || [],
            requiredsVarName,
          );
          if (requiredsString.length > 0) {
            result += requiredsString;
            // TODO: add req to score
          }
          result += `const ${scoreVarName} = ${choiceVarName}.addScore(${pointVarName}, ${value}, ${JSON.stringify(scoreParams)})`;
          if (requiredsString.length > 0) {
            result += `.setRequireds(${requiredsVarName})`;
          }
          result += `;\n`;
        }
      }

      // Handle requireds
      if (choice.requireds && choice.requireds.length > 0) {
        const requiredsString = requiredsToScriptString(
          choice.requireds,
          `req_${choiceVarName}`,
        );
        if (requiredsString.length > 0) {
          result += requiredsString;
          result += `${choiceVarName}.setRequireds(req_${choiceVarName});\n`;
        }
      }

      // Handle addons
      if (choice.addons && choice.addons.length > 0) {
        // result += `${choiceVarName}.addons = ${JSON.stringify(choice.addons)};\n`;
        for (let i = 0; i < choice.addons.length; i++) {
          const addon = choice.addons[i];
          const addonVarName = cleanVarName(`addon_${choice.id}_${i}`);

          let existingAddonParams: any = {};
          let missingAddonParams: any = {};

          for (const key of Object.keys(addon)) {
            if (["requireds", "scores", "parentId"].includes(key)) continue;
            if (!addonTemplate.hasOwnProperty(key)) {
              missingAddonParams[key] = addon[key];
              continue;
            }

            if (
              JSON.stringify(
                addonTemplate[key as keyof typeof addonTemplate],
              ) !== JSON.stringify(addon[key])
            ) {
              existingAddonParams[key] = addon[key];
            }
          }

          result += `\nconst ${addonVarName} = ${choiceVarName}.addAddon(${JSON.stringify(existingAddonParams)});\n`;

          // Handle requreds in addon
          if (addon.requireds && addon.requireds.length > 0) {
            const requiredsString = requiredsToScriptString(
              addon.requireds,
              `req_${addonVarName}`,
            );
            if (requiredsString.length > 0) {
              result += requiredsString;
              result += `${addonVarName}.setRequireds(req_${addonVarName});\n`;
            }
          }

          // Handle missing addon params
          if (Object.keys(missingAddonParams).length > 0) {
            result += `${addonVarName}`;
            for (const key in missingAddonParams) {
              result += `.add({ ${key}: ${JSON.stringify(missingAddonParams[key])} })\n\t`;
            }
            result = result.trimEnd() + ";\n";
          }

          // `\nconst ${addonVarName} = ${choiceVarName}.addAddon(${JSON.stringify(addon)});\n`;
        }
      }

      // Handle missing params
      if (Object.keys(missingChoiceParams).length > 0) {
        result += `${choiceVarName}`;
        for (const key in missingChoiceParams) {
          result += `.add({ ${key}: ${JSON.stringify(missingChoiceParams[key])} })\n\t`;
        }
        result = result.trimEnd() + ";\n";
      }
    }
  }
}

// Save project
result += `
// Save the project into json file
const jsonString = JSON.stringify(project);
fs.writeFileSync("${outputJSONFile}", jsonString);
`;

// Save the result into output file
fs.writeFileSync(outputFile, result);

import fs from "fs";
function sortJSON(obj) {
  // Return null/undefined/primitives as is
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // If it's an array, recursively sort its children
  if (Array.isArray(obj)) {
    return obj.map(sortJSON);
  }

  // If it's an object, sort the keys and reconstruct
  return Object.keys(obj)
    .sort()
    .reduce((sortedObj, key) => {
      sortedObj[key] = sortJSON(obj[key]);
      return sortedObj;
    }, {});
}

function findJsonDifferences(obj1, obj2, path = "") {
  let differences = [];

  // 1. If they are strictly equal, no difference
  if (obj1 === obj2) return differences;

  // 2. If one is null/undefined or they are different types (e.g., string vs object)
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    differences.push({ path: path || "root", expected: obj1, actual: obj2 });
    return differences;
  }

  // 3. Collect all unique keys from both objects
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  // 4. Iterate through keys and compare recursively
  for (const key of allKeys) {
    // Build the path string (e.g., "user.profile.age")
    const currentPath = path ? `${path}.${key}` : key;

    if (!(key in obj1)) {
      differences.push({ path: currentPath, type: "ADDED", actual: obj2[key] });
    } else if (!(key in obj2)) {
      differences.push({
        path: currentPath,
        type: "REMOVED",
        expected: obj1[key],
      });
    } else {
      // Recursively check nested objects/arrays
      const nestedDiffs = findJsonDifferences(
        obj1[key],
        obj2[key],
        currentPath,
      );
      differences = differences.concat(nestedDiffs);
    }
  }

  return differences;
}

// Get args
const [file1, file2] = process.argv.slice(2);

if (!file1 || !file2) {
  console.error("Usage: node compareJson.js <file1.json> <file2.json>");
  process.exit(1);
}

try {
  const json1 = JSON.parse(fs.readFileSync(file1, "utf-8"));
  const json2 = JSON.parse(fs.readFileSync(file2, "utf-8"));
  const sortedJson1 = sortJSON(json1);
  const sortedJson2 = sortJSON(json2);
  const differences = findJsonDifferences(sortedJson1, sortedJson2);
  if (differences.length === 0) {
    console.log("The JSON files are equivalent.");
  } else {
    console.log("Differences found:");
    differences.forEach((diff) => {
      if (diff.type === "ADDED") {
        console.log(`ADDED: ${diff.path} = ${JSON.stringify(diff.actual)}`);
      } else if (diff.type === "REMOVED") {
        console.log(
          `REMOVED: ${diff.path} (expected ${JSON.stringify(diff.expected)})`,
        );
      } else {
        console.log(
          `CHANGED: ${diff.path} (expected ${JSON.stringify(
            diff.expected,
          )}, actual ${JSON.stringify(diff.actual)})`,
        );
      }
    });
  }
} catch (err) {
  console.error("Error reading or parsing JSON files:", err);
  process.exit(1);
}

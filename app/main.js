const fs = require("fs");
const path = require("path");
const zlib = require("node:zlib");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.error("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "read":
    readFile();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(process.cwd(), ".git", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function readFile() {
  try {
    const objectHash = process.argv[4];
    if (!objectHash || objectHash.length < 4) {
      throw new Error("Invalid object hash provided.");
    }

    const objectPath = path.join(
      process.cwd(),
      ".git",
      "objects",
      objectHash.substring(0, 2),
      objectHash.substring(2)
    );

    if (!fs.existsSync(objectPath)) {
      throw new Error(`Git object not found at path: ${objectPath}`);
    }

    const blob = fs.readFileSync(objectPath);
    const buffer = zlib.unzipSync(blob).toString();
    const contentStartIndex = buffer.indexOf("\x00") + 1;

    if (contentStartIndex <= 0) {
      throw new Error("Invalid Git object format.");
    }

    const content = buffer.substring(contentStartIndex);
    process.stdout.write(content);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    process.exit(1);
  }
}

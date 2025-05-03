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
  case "cat-file":
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
    const gitObjectPath = path.join(
      process.cwd(),
      ".git",
      "objects",
      process.argv[4].slice(0, 2),
      process.argv[4].slice(2)
    );

    const compressedBlob = fs.readFileSync(gitObjectPath);
    const decompressedBlob = zlib.unzipSync(compressedBlob).toString();

    const contentStartIndex = decompressedBlob.indexOf("\x00") + 1;
    const fileContent = decompressedBlob.substring(contentStartIndex);

    process.stdout.write(fileContent);
  } catch (error) {
    console.error("Error reading the file:", error.message);
    process.exit(1); // Exit with a non-zero status code to indicate failure
  }
}

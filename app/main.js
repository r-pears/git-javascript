const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

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
  case "hash-object":
    hashObject(process.argv);
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

async function hashObject(arguments) {
  try {
    const filePath = arguments.at(-1);
    const absoluteFilePath = path.resolve(__dirname, filePath);

    const fileContent = await fs.readFile(absoluteFilePath);

    const objectBuffer = Buffer.from(
      `blob ${fileContent.length}\x00${fileContent.toString()}`
    );

    const blobData = zlib.deflateSync(objectBuffer);

    const hash = crypto.createHash("sha1").update(blobData).digest("hex");

    const objectFolder = hash.slice(0, 2);
    const objectFile = hash.slice(2);
    const objectFolderPath = path.join(
      __dirname,
      ".git",
      "objects",
      objectFolder
    );

    await fs.mkdir(objectFolderPath, { recursive: true });

    const objectFilePath = path.join(objectFolderPath, objectFile);
    await fs.writeFile(objectFilePath, blobData);

    process.stdout.write(hash);
  } catch (error) {
    console.error("Error hashing object:", error.message);
  }
}

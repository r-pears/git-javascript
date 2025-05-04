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
  const filePath = arguments.at(-1);

  try {
    // Resolve the file path relative to the current working directory
    const fullPath = path.resolve(process.cwd(), filePath);

    // Read the file content asynchronously
    const fileContent = await fs.promises.readFile(fullPath);

    // Create the object buffer
    const objectBuffer = Buffer.from(
      `blob ${fileContent.length}\x00${fileContent.toString()}`
    );

    // Compress the object buffer
    const blobData = zlib.deflateSync(objectBuffer);

    // Generate the SHA-1 hash
    const hash = crypto.createHash("sha1").update(blobData).digest("hex");

    // Extract folder and file names from the hash
    const objectFolder = hash.slice(0, 2);
    const objectFile = hash.slice(2);

    // Create the folder path for the object
    const objectFolderPath = path.join(
      process.cwd(),
      ".git",
      "objects",
      objectFolder
    );

    // Ensure the folder exists
    await fs.promises.mkdir(objectFolderPath, { recursive: true });

    // Write the compressed blob data to the file
    await fs.promises.writeFile(
      path.join(objectFolderPath, objectFile),
      blobData
    );

    // Output the hash
    process.stdout.write(hash);
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

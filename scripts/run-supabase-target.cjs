const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const [, , targetName, ...supabaseArgs] = process.argv;

if (!targetName || supabaseArgs.length === 0) {
  console.error("Usage: node scripts/run-supabase-target.cjs <development|test> <supabase args...>");
  process.exit(1);
}

const configPath = path.join(__dirname, "..", ".supabase", "projects.json");
if (!fs.existsSync(configPath)) {
  console.error(`Missing ${configPath}`);
  console.error("Create it from .supabase/projects.example.json before running this script.");
  process.exit(1);
}

const projectConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const projectRef = projectConfig?.[targetName]?.projectRef;

if (!projectRef || typeof projectRef !== "string") {
  console.error(`Missing projectRef for target '${targetName}' in ${configPath}`);
  process.exit(1);
}

const supabasePath = resolveSupabaseCliPath();
const finalArgs = buildSupabaseArgs(projectRef, supabaseArgs);
const result = spawnSync(supabasePath, finalArgs, {
  cwd: path.join(__dirname, ".."),
  shell: false,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);

function buildSupabaseArgs(projectRef, args) {
  if (args[0] === "link") {
    return ["link", "--project-ref", projectRef];
  }

  if (args.includes("--project-ref")) {
    return args;
  }

  return [...args, "--project-ref", projectRef];
}

function resolveSupabaseCliPath() {
  const candidatePaths = [
    process.env.SUPABASE_CLI_PATH,
    "supabase",
    path.join("C:\\", "tools", "supabase", "supabase.exe"),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    if (candidatePath === "supabase") {
      return candidatePath;
    }

    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  console.error("Supabase CLI was not found. Set SUPABASE_CLI_PATH or install supabase CLI.");
  process.exit(1);
}

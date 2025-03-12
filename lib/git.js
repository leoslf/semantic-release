import gitLogParser from "git-log-parser";
import getStream from "get-stream";
import { execa } from "execa";
import debugGit from "debug";
import { merge } from "lodash-es";
import { GIT_NOTE_REF } from "./definitions/constants.js";

const debug = debugGit("semantic-release:git");

/**
 * @typedef {import("execa").Options} ExecaOptions
 */

/**
 * @typedef {import("execa").ExecaError} ExecaError
 */

/**
 * Actor.
 *
 * @typedef {object} Actor
 * @property {string} name
 * @property {string} email
 * @property {string} date ISO8601 timestamp
 */

/**
 * Commit message information.
 *
 * @typedef {object} Commit
 * @property {object} commit
 * @property {string} commit.long Long commit hash
 * @property {string} commit.short Short commit hash
 * @property {object} tree
 * @property {string} tree.long Long commit hash
 * @property {string} tree.short Short commit hash
 * @property {Actor} author
 * @property {Actor} committer
 * @property {string} committerDate ISO8601 timeestamp
 * @property {string} subject
 * @property {string} body
 * @property {string} hash Commit hash
 * @property {string} message
 * @property {string[]} gitTags
 */

Object.assign(gitLogParser.fields, { hash: "H", message: "B", gitTags: "d", committerDate: { key: "ci", type: Date } });

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 * @param {ExecaOptions} [execaOptions] Options to pass to `execa`.
 *
 * @returns {Promise<string | null>} The commit sha of the tag in parameter or `null`.
 */
export async function getTagHead(tagName, execaOptions) {
  return (await execa("git", ["rev-list", "-1", tagName], execaOptions)).stdout;
}

/**
 * Get all the tags for a given branch.
 *
 * @param {string} branch The branch for which to retrieve the tags.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<string[]>} List of git tags.
 * @throws {ExecaError} If the `git` command fails.
 */
export async function getTags(branch, execaOptions) {
  return (await execa("git", ["tag", "--merged", branch], execaOptions)).stdout
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Retrieve a range of commits.
 *
 * @param {string} from to includes all commits made after this sha (does not include this sha).
 * @param {string} to to includes all commits made before this sha (also include this sha).
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 * @returns {Promise<Commit[]>} The list of commits between `from` and `to`.
 */
export async function getCommits(from, to, execaOptions) {
  return (
    await getStream.array(
      gitLogParser.parse(
        { _: `${from ? from + ".." : ""}${to}` },
        { cwd: execaOptions.cwd, env: { ...process.env, ...execaOptions.env } }
      )
    )
  ).map(({ message, gitTags, ...commit }) => ({ ...commit, message: message.trim(), gitTags: gitTags.trim() }));
}

/**
 * Get all the repository branches.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<string[]>} List of git branches.
 * @throws {ExecaError} If the `git` command fails.
 */
export async function getBranches(repositoryUrl, execaOptions) {
  return (await execa("git", ["ls-remote", "--heads", repositoryUrl], execaOptions)).stdout
    .split("\n")
    .filter(Boolean)
    .map((branch) => branch.match(/^.+refs\/heads\/(?<branch>.+)$/)[1]);
}

/**
 * Verify if the `ref` exits
 *
 * @param {string} ref The reference to verify.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<boolean>} `true` if the reference exists, falsy otherwise.
 */
export async function isRefExists(ref, execaOptions) {
  try {
    return (await execa("git", ["rev-parse", "--verify", ref], execaOptions)).exitCode === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Fetch all the tags from a branch. Unshallow if necessary.
 * This will update the local branch from the latest on the remote if:
 * - The branch is not the one that triggered the CI
 * - The CI created a detached head
 *
 * Otherwise it just calls `git fetch` without specifying the `refspec` option to avoid overwritting the head commit set by the CI.
 *
 * The goal is to retrieve the informations on all the release branches without "disturbing" the CI, leaving the trigger branch or the detached head intact.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {string} branch The repository branch to fetch.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 */
export async function fetch(repositoryUrl, branch, ciBranch, execaOptions) {
  const isDetachedHead =
    (await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"], { ...execaOptions, reject: false })).stdout === "HEAD";

  try {
    await execa(
      "git",
      [
        "fetch",
        "--unshallow",
        "--tags",
        ...(branch === ciBranch && !isDetachedHead
          ? [repositoryUrl]
          : ["--update-head-ok", repositoryUrl, `+refs/heads/${branch}:refs/heads/${branch}`]),
      ],
      execaOptions
    );
  } catch {
    await execa(
      "git",
      [
        "fetch",
        "--tags",
        ...(branch === ciBranch && !isDetachedHead
          ? [repositoryUrl]
          : ["--update-head-ok", repositoryUrl, `+refs/heads/${branch}:refs/heads/${branch}`]),
      ],
      execaOptions
    );
  }
}

/**
 * Unshallow the git repository if necessary and fetch all the notes.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 */
export async function fetchNotes(repositoryUrl, execaOptions) {
  try {
    await execa("git", ["fetch", "--unshallow", repositoryUrl, `+refs/notes/*:refs/notes/*`], execaOptions);
  } catch {
    await execa("git", ["fetch", repositoryUrl, `+refs/notes/*:refs/notes/*`], {
      ...execaOptions,
      reject: false,
    });
  }
}

/**
 * Get the HEAD sha.
 *
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<string>} the sha of the HEAD commit.
 */
export async function getGitHead(execaOptions) {
  return (await execa("git", ["rev-parse", "HEAD"], execaOptions)).stdout;
}

/**
 * Get the repository remote URL.
 *
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<string>} The value of the remote git URL.
 */
export async function repoUrl(execaOptions) {
  try {
    return (await execa("git", ["config", "--get", "remote.origin.url"], execaOptions)).stdout;
  } catch (error) {
    debug(error);
  }
}

/**
 * Test if the current working directory is a Git repository.
 *
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<boolean>} `true` if the current working directory is in a git repository, falsy otherwise.
 */
export async function isGitRepo(execaOptions) {
  try {
    return (await execa("git", ["rev-parse", "--git-dir"], execaOptions)).exitCode === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify the write access authorization to remote repository with push dry-run.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {string} branch The repository branch for which to verify write access.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @throws {ExecaError} if not authorized to push.
 */
export async function verifyAuth(repositoryUrl, branch, execaOptions) {
  try {
    await execa("git", ["push", "--dry-run", "--no-verify", repositoryUrl, `HEAD:${branch}`], execaOptions);
  } catch (error) {
    debug(error);
    throw error;
  }
}

/**
 * Tag the commit head on the local repository.
 *
 * @param {string} tagName The name of the tag.
 * @param {string} ref The Git reference to tag.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @throws {ExecaError} if the tag creation failed.
 */
export async function tag(tagName, ref, execaOptions) {
  await execa("git", ["tag", tagName, ref], execaOptions);
}

/**
 * Push to the remote repository.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @throws {ExecaError} if the push failed.
 */
export async function push(repositoryUrl, execaOptions) {
  await execa("git", ["push", "--tags", repositoryUrl], execaOptions);
}

/**
 * Push notes to the remote repository.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @throws {ExecaError} if the push failed.
 */
export async function pushNotes(repositoryUrl, ref, execaOptions) {
  await execa("git", ["push", repositoryUrl, `refs/notes/${GIT_NOTE_REF}-${ref}`], execaOptions);
}

/**
 * Verify a tag name is a valid Git reference.
 *
 * @param {string} tagName the tag name to verify.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<boolean>} `true` if valid, falsy otherwise.
 */
export async function verifyTagName(tagName, execaOptions) {
  try {
    return (await execa("git", ["check-ref-format", `refs/tags/${tagName}`], execaOptions)).exitCode === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify a branch name is a valid Git reference.
 *
 * @param {string} branch the branch name to verify.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<boolean>} `true` if valid, falsy otherwise.
 */
export async function verifyBranchName(branch, execaOptions) {
  try {
    return (await execa("git", ["check-ref-format", `refs/heads/${branch}`], execaOptions)).exitCode === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify the local branch is up to date with the remote one.
 *
 * @param {string} repositoryUrl The remote repository URL.
 * @param {string} branch The repository branch for which to verify status.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<boolean>} `true` is the HEAD of the current local branch is the same as the HEAD of the remote branch, falsy otherwise.
 */
export async function isBranchUpToDate(repositoryUrl, branch, execaOptions) {
  return (
    (await getGitHead(execaOptions)) ===
    (await execa("git", ["ls-remote", "--heads", repositoryUrl, branch], execaOptions)).stdout.match(/^(?<ref>\w+)?/)[1]
  );
}

/**
 * Get and parse the JSON note of a given reference.
 *
 * @param {string} ref The Git reference for which to retrieve the note.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Promise<object>} The parsed JSON note if there is one, an empty object otherwise.
 */
export async function getNote(ref, execaOptions) {
  const handleError = (error) => {
    if (error.exitCode === 1) {
      return { stdout: "{}" };
    }

    debug(error);
    throw error;
  };

  try {
    return merge(
      JSON.parse(
        // Used for retro-compatibility
        (await execa("git", ["notes", "--ref", GIT_NOTE_REF, "show", ref], execaOptions).catch(handleError)).stdout
      ),
      JSON.parse(
        (await execa("git", ["notes", "--ref", `${GIT_NOTE_REF}-${ref}`, "show", ref], execaOptions).catch(handleError))
          .stdout
      )
    );
  } catch (error) {
    if (error.exitCode === 1) {
      return {};
    }

    debug(error);
    throw error;
  }
}

/**
 * Add JSON note to a given reference.
 *
 * @param {object} note The object to save in the reference note.
 * @param {string} ref The Git reference to add the note to.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 */
export async function addNote(note, ref, execaOptions) {
  await execa(
    "git",
    ["notes", "--ref", `${GIT_NOTE_REF}-${ref}`, "add", "-f", "-m", JSON.stringify(note), ref],
    execaOptions
  );
}

/**
 * Get the reference of a tag
 *
 * @param {string} tag The tag name to get the reference of.
 * @param {ExecaOptions} [execaOpts] Options to pass to `execa`.
 **/
export async function getTagRef(tag, execaOptions) {
  return (await execa("git", ["show-ref", tag, "--hash"], execaOptions)).stdout;
}

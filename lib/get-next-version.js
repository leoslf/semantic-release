import semver from "semver";
import { DEFAULT_FIRST_RELEASE, DEFAULT_PRERELEASE_IDENTIFIER_BASE } from "./definitions/constants.js";
import { getLatestVersion, highest, isSameChannel, tagsToVersions } from "./utils.js";

/**
 * Increment the version by the release type.
 * @param {string | import("semver").SemVer} version
 * @param {import("semver").ReleaseType} release
 * @param {{ branch: { prerelease?: string }; prereleaseIdentifierBase: import("semver").inc.IdentifierBase }} options
 * @returns {string | null} The incremented version or null if invalid
 */
export function inc(version, release, identifier, prereleaseIdentifierBase) {
  const { major } = semver.parse(version);
  // apply special rule when major === 0
  if (major === 0) {
    release =
      {
        major: "minor",
        minor: "patch",
        patch: "patch",
      }[release] ?? release;
  }
  return semver.inc(version, release, identifier, prereleaseIdentifierBase);
}

/**
 * Calculate the next version.
 * @param {import("semantic-release").VerifyReleaseContext} context
 * @returns {string} The next version.
 */
export default ({
  branch,
  nextRelease: { type, channel },
  lastRelease,
  logger,
  packageVersion,
  options: {
    respectPackageJsonVersion = false,
    firstRelease = DEFAULT_FIRST_RELEASE,
    prereleaseIdentifierBase = DEFAULT_PRERELEASE_IDENTIFIER_BASE,
  } = {},
}) => {
  let version;
  if (lastRelease.version) {
    const { major, minor, patch } = semver.parse(lastRelease.version);

    if (branch.type === "prerelease") {
      if (
        semver.prerelease(lastRelease.version) &&
        lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
      ) {
        version = highest(
          inc(lastRelease.version, "prerelease"),
          `${inc(getLatestVersion(tagsToVersions(branch.tags), { withPrerelease: true }), type)}-${branch.prerelease}.${prereleaseIdentifierBase}`
        );
      } else {
        version = `${inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${prereleaseIdentifierBase}`;
      }
    } else {
      version = inc(lastRelease.version, type);
    }

    logger.log("The next release version is %s", version);
  } else {
    if (respectPackageJsonVersion) {
      firstRelease = packageVersion;
    }
    version =
      branch.type === "prerelease" ? `${firstRelease}-${branch.prerelease}.${prereleaseIdentifierBase}` : firstRelease;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

import test from "ava";
import { stub } from "sinon";
import getNextVersion from "../lib/get-next-version.js";

test.beforeEach((t) => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = { log: t.context.log };
});

test("Increase version for patch release", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
      },
      nextRelease: { type: "patch" },
      lastRelease: { version: "1.0.0", channels: [null] },
      logger: t.context.logger,
    }),
    "1.0.1"
  );
});

test("Increase version for patch release in major version 0", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v0.0.1", version: "0.0.1", channels: [null] }],
      },
      nextRelease: { type: "patch" },
      lastRelease: { version: "0.0.1", channels: [null] },
      logger: t.context.logger,
    }),
    "0.0.2"
  );
});

test("Increase version for minor release", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
      },
      nextRelease: { type: "minor" },
      lastRelease: { version: "1.0.0", channels: [null] },
      logger: t.context.logger,
    }),
    "1.1.0"
  );
});

test("Increase version for minor release at major version 0", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v0.0.1", version: "0.0.1", channels: [null] }],
      },
      nextRelease: { type: "minor" },
      lastRelease: { version: "0.0.1", channels: [null] },
      logger: t.context.logger,
    }),
    "0.0.2"
  );
});

test("Increase version for major release", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
      },
      nextRelease: { type: "major" },
      lastRelease: { version: "1.0.0", channels: [null] },
      logger: t.context.logger,
    }),
    "2.0.0"
  );
});

test("Increase version for major release at major version 0", (t) => {
  t.is(
    getNextVersion({
      branch: {
        name: "master",
        type: "release",
        tags: [{ gitTag: "v0.0.1", version: "0.0.1", channels: [null] }],
      },
      nextRelease: { type: "major" },
      lastRelease: { version: "0.0.1", channels: [null] },
      logger: t.context.logger,
    }),
    "0.1.0"
  );
});

test("Return 1.0.0 if there is no previous release if we don't respect package.json's version", (t) => {
  t.is(
    getNextVersion({
      branch: { name: "master", type: "release", tags: [] },
      nextRelease: { type: "minor" },
      lastRelease: {},
      logger: t.context.logger,
    }),
    "1.0.0"
  );
});

test("Increase version for patch release on prerelease branch", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
        },
        nextRelease: { type: "patch", channel: "beta" },
        lastRelease: { version: "1.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.0.1-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
            {
              gitTag: `v1.0.1-beta.${prereleaseIdentifierBase}`,
              version: `1.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "beta" },
        lastRelease: { version: `1.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.0.1-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v1.0.1-beta.${prereleaseIdentifierBase}`,
              version: `1.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "alpha" },
        lastRelease: { version: `1.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.0.2-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for patch release on prerelease branch at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v0.0.0", version: "0.0.0", channels: [null] }],
        },
        nextRelease: { type: "patch", channel: "beta" },
        lastRelease: { version: "0.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.0.0", version: "0.0.0", channels: [null] },
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "beta" },
        lastRelease: { version: `0.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "alpha" },
        lastRelease: { version: "0.0.1-beta.1", channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.2-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for minor release on prerelease branch", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: "1.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.1.0-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
            {
              gitTag: `v1.1.0-beta.${prereleaseIdentifierBase}`,
              version: `1.1.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: `1.1.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.1.0-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v1.1.0-beta.${prereleaseIdentifierBase}`,
              version: `1.1.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "alpha" },
        lastRelease: { version: `1.1.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.2.0-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for minor release on prerelease branch at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v0.0.0", version: "0.0.0", channels: [null] }],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: "0.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.0.0", version: "0.0.0", channels: [null] },
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: `0.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "alpha" },
        lastRelease: { version: `0.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.2-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for major release on prerelease branch", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v1.0.0", version: "1.0.0", channels: [null] }],
        },
        nextRelease: { type: "major", channel: "beta" },
        lastRelease: { version: "1.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `2.0.0-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
            {
              gitTag: `v2.0.0-beta.${prereleaseIdentifierBase}`,
              version: `2.0.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "major", channel: "beta" },
        lastRelease: { version: `2.0.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `2.0.0-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v2.0.0-beta.${prereleaseIdentifierBase}`,
              version: `2.0.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "major", channel: "alpha" },
        lastRelease: { version: `2.0.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `3.0.0-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for major release on prerelease branch at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [{ gitTag: "v0.0.0", version: "0.0.0", channels: [null] }],
        },
        nextRelease: { type: "major", channel: "beta" },
        lastRelease: { version: "0.0.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.0-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.0.0", version: "0.0.0", channels: [null] },
            {
              gitTag: `v0.1.0-beta.${prereleaseIdentifierBase}`,
              version: `0.1.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "major", channel: "beta" },
        lastRelease: { version: `0.1.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.0-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v2.0.0-beta.${prereleaseIdentifierBase}`,
              version: `2.0.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "major", channel: "alpha" },
        lastRelease: { version: `2.0.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `3.0.0-alpha.${prereleaseIdentifierBase}`
    );
  });
});

test("Return ${firstRelease}-beta.${prereleaseIdentifierBase} if there is no previous release on prerelease branch and we don't respect package.json's version", (t) => {
  ["0.0.1", "1.0.0"].forEach((firstRelease) => {
    ["0", "1"].forEach((prereleaseIdentifierBase) => {
      t.is(
        getNextVersion({
          branch: { name: "beta", type: "prerelease", prerelease: "beta", tags: [] },
          nextRelease: { type: "minor" },
          lastRelease: {},
          logger: t.context.logger,
          options: { respectPackageJsonVersion: false, firstRelease, prereleaseIdentifierBase },
        }),
        `${firstRelease}-beta.${prereleaseIdentifierBase}`
      );
    });
  });
});

test("Return ${packageVersion}-beta.${prereleaseIdentifierBase} if there is no previous release on prerelease branch and we don't respect package.json's version", (t) => {
  const packageVersion = "0.1.0";
  ["0.0.1", "1.0.0"].forEach((firstRelease) => {
    ["0", "1"].forEach((prereleaseIdentifierBase) => {
      t.is(
        getNextVersion({
          branch: { name: "beta", type: "prerelease", prerelease: "beta", tags: [] },
          nextRelease: { type: "minor" },
          lastRelease: {},
          logger: t.context.logger,
          packageVersion,
          options: { respectPackageJsonVersion: true, firstRelease, prereleaseIdentifierBase },
        }),
        `${packageVersion}-beta.${prereleaseIdentifierBase}`
      );
    });
  });
});

test("Increase version for release on prerelease branch after previous commits were merged to release branch", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
            { gitTag: "v1.1.0", version: "1.1.0", channels: [null] }, // Version v1.1.0 released on default branch after beta was merged into master
            {
              gitTag: `v1.1.0-beta.${prereleaseIdentifierBase}`,
              version: `1.1.0-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "minor" },
        lastRelease: { version: "1.1.0", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.2.0-beta.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for release on prerelease branch after previous commits were merged to release branch at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.0.0", version: "0.0.0", channels: [null] },
            { gitTag: "v0.0.1", version: "0.0.1", channels: [null] }, // Version v1.1.0 released on default branch after beta was merged into master
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "minor" },
        lastRelease: { version: "0.0.1", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.2-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.1.0", version: "0.1.0", channels: [null] },
            { gitTag: "v0.1.1", version: "0.1.1", channels: [null] }, // Version v0.1.1 released on default branch after beta was merged into master
            {
              gitTag: `v0.1.1-beta.${prereleaseIdentifierBase}`,
              version: `0.1.1-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "minor" },
        lastRelease: { version: "0.1.1", channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.2-beta.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for release on prerelease branch based on highest commit type since last regular release", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
            {
              gitTag: `v1.1.0-beta.${prereleaseIdentifierBase}`,
              version: `1.1.0-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "major" },
        lastRelease: { version: `v1.1.0-beta.${prereleaseIdentifierBase}`, channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `2.0.0-beta.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for release on prerelease branch based on highest commit type since last regular release at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.0.0", version: "0.0.0", channels: [null] },
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "major" },
        lastRelease: { version: `v0.0.1-beta.${prereleaseIdentifierBase}`, channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.0-beta.${prereleaseIdentifierBase}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            { gitTag: "v0.1.0", version: "0.1.0", channels: [null] },
            {
              gitTag: `v0.1.1-beta.${prereleaseIdentifierBase}`,
              version: `0.1.1-beta.${prereleaseIdentifierBase}`,
              channels: [null, "beta"],
            },
          ],
        },
        nextRelease: { type: "major" },
        lastRelease: { version: `v0.1.1-beta.${prereleaseIdentifierBase}`, channels: [null] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.2.0-beta.${prereleaseIdentifierBase}`
    );
  });
});

test("Increase version for release on prerelease branch when there is no regular releases on other branches", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            {
              gitTag: `v1.0.0-beta.${prereleaseIdentifierBase}`,
              version: `1.0.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: `v1.0.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.0.0-beta.${+prereleaseIdentifierBase + 1}`
    );
  });
});

test("Increase version for release on prerelease branch when there is no regular releases on other branches at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: `v0.0.1-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-beta.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "beta",
          type: "prerelease",
          prerelease: "beta",
          tags: [
            {
              gitTag: `v0.1.0-beta.${prereleaseIdentifierBase}`,
              version: `0.1.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
          ],
        },
        nextRelease: { type: "minor", channel: "beta" },
        lastRelease: { version: `v0.1.0-beta.${prereleaseIdentifierBase}`, channels: ["beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.0-beta.${+prereleaseIdentifierBase + 1}`
    );
  });
});

test("Increase patch when previous version shares HEAD with other releases", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v1.0.0-beta.${prereleaseIdentifierBase}`,
              version: `1.0.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
            {
              gitTag: `v1.0.0-beta.${+prereleaseIdentifierBase + 1}`,
              version: `1.0.0-beta.${+prereleaseIdentifierBase + 1}`,
              channels: ["alpha", "beta"],
            },
            {
              gitTag: `v1.0.0-alpha.${prereleaseIdentifierBase}`,
              version: `1.0.0-alpha.${prereleaseIdentifierBase}`,
              channels: ["alpha", "beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "alpha" },
        lastRelease: { version: `v1.0.0-alpha.${prereleaseIdentifierBase}`, channels: ["alpha", "beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `1.0.0-alpha.${+prereleaseIdentifierBase + 1}`
    );
  });
});

test("Increase patch when previous version shares HEAD with other releases at major version 0", (t) => {
  ["0", "1"].forEach((prereleaseIdentifierBase) => {
    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v0.0.1-beta.${prereleaseIdentifierBase}`,
              version: `0.0.1-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
            {
              gitTag: `v0.0.1-beta.${+prereleaseIdentifierBase + 1}`,
              version: `0.0.1-beta.${+prereleaseIdentifierBase + 1}`,
              channels: ["alpha", "beta"],
            },
            {
              gitTag: `v0.0.1-alpha.${prereleaseIdentifierBase}`,
              version: `0.0.1-alpha.${prereleaseIdentifierBase}`,
              channels: ["alpha", "beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "alpha" },
        lastRelease: { version: `v0.0.1-alpha.${prereleaseIdentifierBase}`, channels: ["alpha", "beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.0.1-alpha.${+prereleaseIdentifierBase + 1}`
    );

    t.is(
      getNextVersion({
        branch: {
          name: "alpha",
          type: "prerelease",
          prerelease: "alpha",
          tags: [
            {
              gitTag: `v0.1.0-beta.${prereleaseIdentifierBase}`,
              version: `0.1.0-beta.${prereleaseIdentifierBase}`,
              channels: ["beta"],
            },
            {
              gitTag: `v0.1.0-beta.${+prereleaseIdentifierBase + 1}`,
              version: `0.1.0-beta.${+prereleaseIdentifierBase + 1}`,
              channels: ["alpha", "beta"],
            },
            {
              gitTag: `v0.1.0-alpha.${prereleaseIdentifierBase}`,
              version: `0.1.0-alpha.${prereleaseIdentifierBase}`,
              channels: ["alpha", "beta"],
            },
          ],
        },
        nextRelease: { type: "patch", channel: "alpha" },
        lastRelease: { version: `v0.1.0-alpha.${prereleaseIdentifierBase}`, channels: ["alpha", "beta"] },
        logger: t.context.logger,
        options: { prereleaseIdentifierBase },
      }),
      `0.1.0-alpha.${+prereleaseIdentifierBase + 1}`
    );
  });
});

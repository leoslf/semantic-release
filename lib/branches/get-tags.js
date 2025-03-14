import { escapeRegExp, template } from "lodash-es";
import semver from "semver";
import pReduce from "p-reduce";
import debugTags from "debug";
import { getNote, getTags } from "../../lib/git.js";

const debug = debugTags("semantic-release:get-tags");

export default async ({ cwd, env, options: { tagFormat } }, branches) => {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  const tagRegexp = `^${escapeRegExp(template(tagFormat)({ version: " " })).replace(" ", "(.+)")}`;

  return pReduce(
    branches,
    async (branches, branch) => {
      const branchTags = await pReduce(
        await getTags(/refs\/pull\/\d+\/merge/.test(branch.name) ? "HEAD" : branch.name, { cwd, env }),
        async (branchTags, tag) => {
          const [, version] = tag.match(tagRegexp) || [];
          return version && semver.valid(semver.clean(version))
            ? [...branchTags, { gitTag: tag, version, channels: (await getNote(tag, { cwd, env })).channels || [null] }]
            : branchTags;
        },
        []
      );

      debug("found tags for branch %s: %o", branch.name, branchTags);
      return [...branches, { ...branch, tags: branchTags }];
    },
    []
  );
};
